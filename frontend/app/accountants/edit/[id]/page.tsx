'use client';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { CheckCircle, AlertCircle, ArrowLeft, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';



const UpdateAccountantSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
});

type FormData = z.infer<typeof UpdateAccountantSchema>;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.mode === 'dark' ? '#064e3b' : '#008800'} 100%);
  color: #ffffff;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0 0 ${props => props.theme.spacing.xs};
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.md};
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.md};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.mutedForeground};
  font-size: ${props => props.theme.typography.fontSizes.md};
  margin-bottom: ${props => props.theme.spacing.md};
  text-decoration: none;
  transition: color ${props => props.theme.transitions.default};

  &:hover {
    color: ${props => props.theme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FormCard = styled.form`
  background: ${props => props.theme.colors.card};
  padding: 28px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
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
  border: 1.5px solid ${props => props.theme.colors.border};
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
`;

const FieldError = styled.p`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  margin-top: ${props => props.theme.spacing.xs};
`;

const ErrorBanner = styled.div`
  background: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : '#fecaca'};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#991b1b'};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const SuccessBanner = styled.div`
  background: ${props => props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : '#a7f3d0'};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.mode === 'dark' ? '#6ee7b7' : '#065f46'};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 8px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  
  p {
    margin-top: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.mutedForeground};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const Spinner = styled(Loader2)`
  width: 40px;
  height: 40px;
  color: ${props => props.theme.colors.primary};
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function EditAccountantPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { updateUser } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(UpdateAccountantSchema),
  });

  const loadUser = useCallback(async () => {
    if (!id) return;

    setLoadingUser(true);
    setError(null);

    try {
      const response = await apiClient.getUser(parseInt(id, 10));
      const user = response.data;

      if (!user) {
        setError('Accountant not found');
        return;
      }

      // Populate form with user data
      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        department: user.department || '',
      });
    } catch (err: unknown) {
      const errMessage =
        (typeof err === 'object' && err !== null && 'response' in err && (err as { response?: { data?: { detail?: string } } }).response?.data?.detail) ||
        (err as { message?: string }).message ||
        'Failed to load accountant';
      setError(errMessage);
    } finally {
      setLoadingUser(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
        department: data.department || undefined,
      };

      await apiClient.updateUser(parseInt(id, 10), userData);
      await updateUser(id, userData); // Update store

      setSuccess('Accountant updated successfully!');
      toast.success('Accountant updated successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/accountants/list');
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
        'Failed to update accountant';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading accountant...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href="/accountants/list">
            <ArrowLeft />
            Back to Accountants
          </BackLink>

          <HeaderContainer>
            <HeaderContent>
              <Users />
              <div>
                <h1>Edit Accountant</h1>
                <p>Update accountant information</p>
              </div>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          {success && (
            <SuccessBanner>
              <CheckCircle />
              <span>{success}</span>
            </SuccessBanner>
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

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/accountants/list')}
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
                  'Update Accountant'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
