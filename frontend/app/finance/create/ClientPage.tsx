//app/finance/create/page.tsx
'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Sidebar from '@/components/common/Sidebar';
import Navbar from '@/components/common/Navbar';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

import Link from 'next/link';
import { toast } from 'sonner';

const formSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'FINANCE_ADMIN', 'ACCOUNTANT', 'EMPLOYEE']),
  phone: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

/* --------------------------------- LAYOUT ---------------------------------- */

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

/* --------------------------------- UI STYLES ---------------------------------- */

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

const AlertBox = styled.div<{ $status: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 6px;
  margin-bottom: 16px;

  display: flex;
  align-items: center;
  gap: 8px;

  background: ${({ $status, theme }) =>
    $status === 'error'
      ? (theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2')
      : (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')};
  border: 1px solid
    ${({ $status, theme }) =>
    $status === 'error'
      ? (theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : '#FECACA')
      : (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : '#A7F3D0')};
  color: ${({ $status, theme }) =>
    $status === 'error'
      ? (theme.mode === 'dark' ? '#fca5a5' : '#B91C1C')
      : (theme.mode === 'dark' ? '#6ee7b7' : '#047857')};
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

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
  justify-content: space-between;
  align-items: center;
`;

/* --------------------------------- PAGE ---------------------------------- */

export default function CreateFinancePage() {
  const router = useRouter();
  const { fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'FINANCE_ADMIN' as const,
      phone: '',
      department: '',
      managerId: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    // Prevent multiple submissions
    if (isSubmitting || loading) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Trim whitespace from email and username to prevent false duplicates
      const trimmedEmail = (data.email || '').trim().toLowerCase();
      const trimmedUsername = (data.username || '').trim();
      const trimmedFullName = (data.full_name || '').trim();
      const trimmedPhone = data.phone ? (data.phone || '').trim() : '';
      const trimmedDepartment = data.department ? (data.department || '').trim() : '';

      // Validate that email and username are not empty after trimming
      if (!trimmedEmail) {
        throw new Error('Email is required');
      }
      if (!trimmedUsername) {
        throw new Error('Username is required');
      }
      if (!trimmedFullName) {
        throw new Error('Full name is required');
      }

      // Convert role to backend enum format (lowercase with underscores)
      // Frontend uses uppercase, backend expects lowercase
      const roleMap: Record<string, string> = {
        'ADMIN': 'admin',
        'FINANCE_ADMIN': 'finance_manager', // Backend uses finance_manager for FINANCE_ADMIN
        'ACCOUNTANT': 'accountant',
        'EMPLOYEE': 'employee',
        'MANAGER': 'manager',
        'SUPER_ADMIN': 'super_admin'
      };
      const roleValue = roleMap[data.role || 'FINANCE_ADMIN'] || 'finance_manager';

      const userData = {
        full_name: trimmedFullName,
        email: trimmedEmail,
        username: trimmedUsername,
        password: data.password,
        role: roleValue,
        phone: trimmedPhone || undefined,
        department: trimmedDepartment || undefined,
        manager_id: data.managerId ? Number(data.managerId) : undefined
      };

      // Only call the API, don't call store's createUser as it might cause issues
      await apiClient.createUser(userData);
      await fetchAllUsers();

      setSuccess('Finance manager created successfully!');
      toast.success('Finance manager created successfully!');
      reset();

      setTimeout(() => router.push('/finance/list'), 2000);
    } catch (err: unknown) {
      console.error('Error creating finance manager:', err);

      let errorMessage = 'Failed to create finance manager';

      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: unknown; status?: number } }).response;
        const data = response?.data;
        const statusCode = response?.status;

        if (statusCode === 422) {
          // Handle Pydantic validation errors (422 Unprocessable Entity)
          if (data && typeof data === 'object') {
            const errorObj = data as { detail?: unknown };
            const detail = errorObj.detail;

            if (Array.isArray(detail)) {
              // Pydantic validation errors come as an array
              const validationErrors = detail
                .map((errItem: { loc?: unknown[]; msg?: string; type?: string }) => {
                  if (Array.isArray(errItem.loc) && errItem.msg) {
                    const field = errItem.loc.slice(-1)[0]; // Get last element (field name)
                    return `${String(field)}: ${errItem.msg}`;
                  }
                  return errItem.msg || JSON.stringify(errItem);
                })
                .filter((msg: string) => msg && typeof msg === 'string');

              if (validationErrors.length > 0) {
                errorMessage = validationErrors.join(', ');
              }
            } else if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (detail && typeof detail === 'object' && 'msg' in detail) {
              const msg = (detail as { msg?: string }).msg;
              if (msg) errorMessage = msg;
            }
          }
        } else {
          // Handle other error formats
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data && typeof data === 'object') {
            const errorObj = data as { detail?: unknown; message?: string; error?: string };
            const detail = errorObj.detail;
            const message = errorObj.message;
            const errorText = errorObj.error;

            // Handle array of validation errors
            if (Array.isArray(detail)) {
              const validationErrors = detail
                .map((errItem: { loc?: unknown[]; msg?: string }) => {
                  if (Array.isArray(errItem.loc) && errItem.msg) {
                    const field = errItem.loc.slice(-1)[0];
                    return `${String(field)}: ${errItem.msg}`;
                  }
                  return errItem.msg || String(errItem);
                })
                .filter((msg: string) => msg && typeof msg === 'string');

              errorMessage = validationErrors.length > 0 ? validationErrors.join(', ') : errorMessage;
            } else if (typeof detail === 'string') {
              errorMessage = detail;
            } else {
              errorMessage = message || errorText || errorMessage;
            }
          }
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
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
          <BackLink href="/finance/list">
            <ArrowLeft size={16} />
            Back to Finance Managers
          </BackLink>

          <Title>
            <Briefcase className="h-8 w-8 text-primary" />
            Create Finance Manager
          </Title>
          <Subtitle>Add a new finance manager to your organization</Subtitle>

          {error && (
            <AlertBox $status="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </AlertBox>
          )}

          {success && (
            <AlertBox $status="success">
              <CheckCircle size={18} />
              <span>{success}</span>
            </AlertBox>
          )}

          <FormCard onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <Label htmlFor="full_name">Full Name </Label>
              <StyledInput id="full_name" {...register('full_name')} disabled={loading} />
              {errors.full_name && (
                <FieldError>{errors.full_name.message}</FieldError>
              )}
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
                {errors.username && (
                  <FieldError>{errors.username.message}</FieldError>
                )}
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
                {errors.password && (
                  <FieldError>{errors.password.message}</FieldError>
                )}
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
                {errors.confirmPassword && (
                  <FieldError>{errors.confirmPassword.message}</FieldError>
                )}
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
                disabled={loading}
                onClick={() => router.push('/finance/list')}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading || isSubmitting}
                onClick={(e) => {
                  // Prevent double submission
                  if (loading || isSubmitting) {
                    e.preventDefault();
                    return false;
                  }
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-8 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Finance Manager'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
