'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import { RegisterSchema } from '@/lib/validation';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { CheckCircle, AlertCircle, ArrowLeft, Users, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Styled Components Layout
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: ${props => props.theme.colors.background};
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
  padding-left: 250px; /* Sidebar width */
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
  color: ${props => props.theme.colors.textDark};
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FieldError = styled.p`
  color: ${props => props.theme.colors.error};
  font-size: 14px;
  margin-top: 4px;
`;

const StyledInput = styled.input`
  width: 70%;
  padding: 10px 14px;
  border: 1.5px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.textSecondary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
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

  &[type="password"] {
    letter-spacing: 0.05em;
  }
`;

const PasswordInputContainer = styled.div`
  position: relative;
  width: 70%;
`;

const PasswordInput = styled(StyledInput)`
  width: 100%;
  padding-right: 40px;
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.textSecondary};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: ${props => props.theme.colors.text};
    background: ${props => props.theme.colors.backgroundSecondary};
  }

  &:focus {
    outline: none;
    background: ${props => props.theme.colors.backgroundSecondary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;

  background: ${props => props.type === 'error'
    ? (props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
    : (props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.2)' : '#d1fae5')
  };
  border: 1px solid ${props => props.type === 'error'
    ? (props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : '#fecaca')
    : (props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.5)' : '#a7f3d0')
  };
  color: ${props => props.type === 'error'
    ? (props.theme.mode === 'dark' ? '#fca5a5' : '#991b1b')
    : (props.theme.mode === 'dark' ? '#86efac' : '#065f46')
  };
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
  justify-content: space-between;
  align-items: center;
`;

const RoleEnum = z.enum(['ADMIN', 'FINANCE_ADMIN', 'ACCOUNTANT', 'EMPLOYEE']);

const RegisterFormSchema = RegisterSchema.omit({ role: true }).extend({
  role: RoleEnum,
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function CreateEmployeePage() {
  const router = useRouter();
  const { user, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      role: 'EMPLOYEE' as const,
      full_name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      phone: '',
      department: '',
      managerId: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Map form data to API format
      const userData = {
        full_name: data.full_name.trim(),
        email: data.email.toLowerCase().trim(),
        username: data.username.trim(),
        password: data.password,
        role: 'employee', // Backend expects lowercase
        phone: data.phone?.trim() || undefined,
        department: data.department?.trim() || undefined,
        manager_id: data.managerId ? parseInt(data.managerId, 10) : undefined,
      };

      // Check user role to determine which endpoint to use
      const userRole = user?.role?.toLowerCase();

      // Finance managers (manager) should use /subordinates endpoint
      // Admins can use either endpoint, but /users is more appropriate for admins
      if (userRole === 'manager' || userRole === 'finance_manager') {
        await apiClient.createSubordinate(userData);
      } else {
        // Admin or super_admin uses the regular createUser endpoint
        await apiClient.createUser(userData);
      }

      await fetchAllUsers(); // Refresh user list

      setSuccess('Employee created successfully!');
      reset();
      toast.success('Employee created successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/employees/list');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.detail) ||
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.message) ||
        (err as { message?: string }).message ||
        'Failed to create employee';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            Create Employee
          </Title>
          <Subtitle>Add a new employee to your organization</Subtitle>

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
              <Label htmlFor="full_name">Full Name </Label>
              <StyledInput id="full_name" {...register('full_name')} disabled={loading} />
              {errors.full_name && <FieldError>{errors.full_name.message}</FieldError>}
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="email">Email </Label>
                <StyledInput id="email" type="email" {...register('email')} disabled={loading} />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="username">Username </Label>
                <StyledInput id="username" {...register('username')} disabled={loading} />
                {errors.username && <FieldError>{errors.username.message}</FieldError>}
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label htmlFor="password">Password </Label>
                <PasswordInputContainer>
                  <PasswordInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    disabled={loading}
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </TogglePasswordButton>
                </PasswordInputContainer>
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="confirmPassword">Confirm Password </Label>
                <PasswordInputContainer>
                  <PasswordInput
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    disabled={loading}
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </TogglePasswordButton>
                </PasswordInputContainer>
                {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <StyledInput id="phone" {...register('phone')} disabled={loading} />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="department">Department (Optional)</Label>
                <StyledInput id="department" {...register('department')} disabled={loading} />
              </FormGroup>
            </FormRow>

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
                    Creating...
                  </>
                ) : (
                  'Create Employee'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
