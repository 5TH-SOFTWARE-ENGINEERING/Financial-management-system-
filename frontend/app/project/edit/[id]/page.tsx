'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema, type CreateProjectInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FolderKanban, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

// ──────────────────────────────────────────
// Styled Components Layout
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: #f5f6fa;
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: var(--card);
  border-right: 1px solid var(--border);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: auto;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding-left: 250px;
  display: flex;
  flex-direction: column;
`;

const InnerContent = styled.div`
  padding: 32px;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted-foreground);
  font-size: 14px;
  margin-bottom: 16px;
  transition: 0.2s;

  &:hover {
    color: var(--foreground);
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: var(--muted-foreground);
  margin-bottom: 24px;
`;

const FormCard = styled.form`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldError = styled.p`
  color: #dc2626;
  font-size: 14px;
  margin-top: 4px;
`;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;

  background: ${(p) => (p.type === 'error' ? '#fee2e2' : '#d1fae5')};
  border: 1px solid ${(p) => (p.type === 'error' ? '#fecaca' : '#a7f3d0')};
  color: ${(p) => (p.type === 'error' ? '#991b1b' : '#065f46')};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: var(--foreground);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const UsersList = styled.div`
  max-height: 192px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  label {
    font-size: 14px;
    cursor: pointer;
    flex: 1;
  }
`;

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id ? parseInt(params.id as string, 10) : null;
  const { allUsers } = useUserStore();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(CreateProjectSchema),
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadDepartments();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getProjects();
      const projects = response.data || [];
      const project = projects.find((p: any) => p.id === projectId);
      
      if (!project) {
        setError('Project not found');
        return;
      }

      // Format dates for input fields
      const startDate = project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '';
      const endDate = project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '';
      
      reset({
        name: project.name || '',
        description: project.description || '',
        departmentId: project.department_id?.toString() || '',
        budget: project.budget || undefined,
        startDate: startDate as any,
        endDate: (endDate || undefined) as any,
        assignedUsers: project.assigned_users?.map((id: number) => id.toString()) || [],
      });

      setSelectedUsers(project.assigned_users?.map((id: number) => id.toString()) || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load project';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.getDepartments();
      setDepartments(response.data || []);
    } catch (err: any) {
      console.error('Failed to load departments:', err);
    }
  };

  const onSubmit = async (data: any) => {
    if (!projectId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Format dates for API
      const startDate = new Date(data.startDate).toISOString();
      const endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
      
      const projectData = {
        name: data.name,
        description: data.description || null,
        department_id: data.departmentId ? parseInt(data.departmentId) : null,
        assigned_users: selectedUsers.map(id => parseInt(id)),
        budget: data.budget || null,
        start_date: startDate,
        end_date: endDate,
      };

      await apiClient.updateProject(projectId, projectData);
      setSuccess('Project updated successfully!');
      toast.success('Project updated successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/project/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update project';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading project...</p>
          </LoadingContainer>
        </ContentArea>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <ContentArea>
        <Navbar />

        <InnerContent>
          <BackLink href="/project/list">
            <ArrowLeft size={16} />
            Back to Projects
          </BackLink>

          <Title>
            <FolderKanban className="h-8 w-8 text-primary" />
            Edit Project
          </Title>
          <Subtitle>Update project information</Subtitle>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              {error}
            </MessageBox>
          )}

          {success && (
            <MessageBox type="success">
              <CheckCircle size={18} />
              {success}
            </MessageBox>
          )}

          <FormCard onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Website Redesign"
                disabled={submitting}
              />
              {errors.name && <FieldError>{String(errors.name.message || '')}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Project description"
                disabled={submitting}
                rows={3}
              />
              {errors.description && <FieldError>{String(errors.description.message || '')}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="departmentId">Department *</Label>
              <Select
                id="departmentId"
                {...register('departmentId')}
                disabled={submitting}
              >
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </option>
                ))}
              </Select>
              {errors.departmentId && <FieldError>{String(errors.departmentId.message || '')}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                {...register('budget', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={submitting}
              />
              {errors.budget && <FieldError>{String(errors.budget.message || '')}</FieldError>}
            </FormGroup>

            <GridRow>
              <FormGroup>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  disabled={submitting}
                />
                {errors.startDate && <FieldError>{String(errors.startDate.message || '')}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  disabled={submitting}
                />
                {errors.endDate && <FieldError>{String(errors.endDate.message || '')}</FieldError>}
              </FormGroup>
            </GridRow>

            <FormGroup>
              <Label>Assigned Users</Label>
              <UsersList>
                {allUsers.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>No users available</p>
                ) : (
                  allUsers.map((user) => (
                    <CheckboxItem key={user.id}>
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        disabled={submitting}
                      />
                      <label htmlFor={`user-${user.id}`}>
                        {(user as any).full_name || user.email} ({user.role})
                      </label>
                    </CheckboxItem>
                  ))
                )}
              </UsersList>
              {errors.assignedUsers && <FieldError>{String(errors.assignedUsers.message || '')}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/project/list')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Project'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

