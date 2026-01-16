'use client';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateProjectSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { useThemeStore } from '@/store/useThemeStore';

// ──────────────────────────────────────────
// Styled Components Layout
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: var(--background);
  color: var(--text);
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
  background: var(--card);
  padding: 28px;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
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

  background: ${(p) => (p.type === 'error' ? 'color-mix(in srgb, var(--error), transparent 90%)' : 'color-mix(in srgb, var(--primary), transparent 90%)')};
  border: 1px solid ${(p) => (p.type === 'error' ? 'color-mix(in srgb, var(--error), transparent 70%)' : 'color-mix(in srgb, var(--primary), transparent 70%)')};
  color: ${(p) => (p.type === 'error' ? 'var(--error)' : 'var(--primary)')};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
  justify-content: space-between;
  align-items: center;
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
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  font-size: 14px;
  color: var(--text);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary), transparent 90%);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const UsersList = styled.div`
  max-height: 192px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  background: var(--background);
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

export default function CreateProjectPage() {
  const router = useRouter();
  const { allUsers } = useUserStore();
  const { themePreference, setThemePreference } = useThemeStore();
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const CreateProjectFormSchema = CreateProjectSchema.extend({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
  });

  type ProjectFormValues = z.infer<typeof CreateProjectFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(CreateProjectFormSchema),
    defaultValues: {
      assignedUsers: [],
    },
  });

  const loadDepartments = useCallback(async () => {
    try {
      const response = await apiClient.getDepartments();
      setDepartments((response.data as Array<{ id: number; name: string }>) || []);
    } catch (err: unknown) {
      console.error('Failed to load departments:', err);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const onSubmit = async (data: ProjectFormValues) => {
    setLoading(true);
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
        is_active: true,
      };

      await apiClient.createProject(projectData);
      setSuccess('Project created successfully!');
      toast.success('Project created successfully!');
      reset();
      setSelectedUsers([]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/project/list');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (err instanceof Error ? err.message : 'Failed to create project');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

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
            Create Project
          </Title>
          <Subtitle>Add a new project</Subtitle>

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
              <Label htmlFor="name">Project Name </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Website Redesign"
                disabled={loading}
              />
              {errors.name && <FieldError>{String(errors.name.message || '')}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Project description"
                disabled={loading}
                rows={3}
              />
              {errors.description && <FieldError>{String(errors.description.message || '')}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="departmentId">Department </Label>
              <Select
                id="departmentId"
                {...register('departmentId')}
                disabled={loading}
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
                disabled={loading}
              />
              {errors.budget && <FieldError>{String(errors.budget.message || '')}</FieldError>}
            </FormGroup>

            <GridRow>
              <FormGroup>
                <Label htmlFor="startDate">Start Date </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  disabled={loading}
                />
                {errors.startDate && <FieldError>{String(errors.startDate.message || '')}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  disabled={loading}
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
                        disabled={loading}
                      />
                      <label htmlFor={`user-${user.id}`}>
                        {user.name || user.email} ({user.role})
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
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}