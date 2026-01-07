'use client';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
  background: ${props => props.theme.colors.backgroundSecondary};
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: ${props => props.theme.colors.card};
  border-right: 1px solid ${props => props.theme.colors.border};
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
  color: ${props => props.theme.colors.mutedForeground};
  font-size: 14px;
  margin-bottom: 16px;
  transition: 0.2s;

  &:hover {
    color: ${props => props.theme.colors.text};
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
  color: ${props => props.theme.colors.mutedForeground};
  margin-bottom: 24px;
`;

const FormCard = styled.form`
  background: ${props => props.theme.colors.card};
  padding: 28px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.border};
  }

  &::placeholder {
    color: ${props => props.theme.colors.mutedForeground};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.backgroundSecondary};
    color: ${props => props.theme.colors.mutedForeground};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${props => props.theme.colors.border};
  }

  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const HelpText = styled.p`
  margin-top: 4px;
  font-size: 13px;
  color: ${props => props.theme.colors.mutedForeground};
`;

const FieldError = styled.p`
  color: ${props => props.theme.colors.error};
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
  gap: 16px;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 8px;
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

  const loadUser = useCallback(async () => {
    if (!id) return;

    setLoadingUser(true);
    setError(null);

    try {
      const response = await apiClient.getUser(parseInt(id, 10));
      const user = response.data;

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
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to load employee';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingUser(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadUser();
  }, [id, loadUser]);

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
        phone: data.phone || undefined,
        department: data.department || undefined,
        manager_id: data.managerId ? parseInt(data.managerId, 10) : undefined,
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
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.detail ||
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.message
          : undefined) || 'Failed to update employee';
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
            <FormRow>
              <FormGroup>
                <Label htmlFor="full_name">Full Name</Label>
                <StyledInput
                  id="full_name"
                  {...register('full_name')}
                  disabled={loading}
                  placeholder="Enter full name"
                />
                {errors.full_name && <FieldError>{errors.full_name.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="username">Username</Label>
                <StyledInput
                  id="username"
                  {...register('username')}
                  disabled={loading}
                  placeholder="Enter username"
                />
                {errors.username && <FieldError>{errors.username.message}</FieldError>}
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <StyledInput
                id="email"
                type="email"
                {...register('email')}
                disabled={loading}
                placeholder="Enter email address"
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="phone">Phone</Label>
                <StyledInput
                  id="phone"
                  {...register('phone')}
                  disabled={loading}
                  placeholder="Enter phone number"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="department">Department</Label>
                <StyledInput
                  id="department"
                  {...register('department')}
                  disabled={loading}
                  placeholder="Enter department"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="managerId">Manager ID</Label>
              <StyledInput
                id="managerId"
                type="number"
                {...register('managerId')}
                disabled={true}
                placeholder="Enter manager ID (optional)"
              />
              <HelpText>
                Manager ID cannot be changed. Contact an administrator to modify this field.
              </HelpText>
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
              <Button type="submit" disabled={loading}>
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

