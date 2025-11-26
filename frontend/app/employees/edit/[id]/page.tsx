'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { CheckCircle, AlertCircle, ArrowLeft, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Styled Components
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

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

const UpdateEmployeeSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
});

type FormData = z.infer<typeof UpdateEmployeeSchema>;

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { updateUser, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(UpdateEmployeeSchema),
  });

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    setLoadingUser(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      const user = (response.data || []).find((u: any) => u.id.toString() === id);
      
      if (!user) {
        setError('Employee not found');
        return;
      }
      
      // Populate form with user data
      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        department: user.department || '',
        managerId: user.manager_id?.toString() || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load employee');
      toast.error('Failed to load employee');
    } finally {
      setLoadingUser(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const userData = {
        full_name: data.full_name,
        email: data.email,
        username: data.username,
        phone: data.phone || null,
        department: data.department || null,
        manager_id: data.managerId ? parseInt(data.managerId, 10) : null,
      };
      
      await apiClient.updateUser(parseInt(id, 10), userData);
      await updateUser(id, userData); // Update store
      await fetchAllUsers(); // Refresh user list
      
      setSuccess('Employee updated successfully!');
      toast.success('Employee updated successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/employees/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to update employee';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading employee...</p>
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
          <BackLink href="/employees/list">
            <ArrowLeft size={16} />
            Back to Employees
          </BackLink>

          <Title>
            <Users className="h-8 w-8 text-primary" />
            Edit Employee
          </Title>
          <Subtitle>Update employee information</Subtitle>

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
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" {...register('full_name')} disabled={loading} />
              {errors.full_name && <FieldError>{errors.full_name.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} disabled={loading} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="username">Username *</Label>
              <Input id="username" {...register('username')} disabled={loading} />
              {errors.username && <FieldError>{errors.username.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" {...register('phone')} disabled={loading} />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="department">Department (Optional)</Label>
              <Input id="department" {...register('department')} disabled={loading} />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="managerId">Manager ID (Optional)</Label>
              <Input 
                id="managerId" 
                type="number" 
                {...register('managerId')} 
                disabled={loading} 
                placeholder="Enter manager user ID"
              />
              {errors.managerId && <FieldError>{errors.managerId.message}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => router.push('/employees/list')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Employee'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

