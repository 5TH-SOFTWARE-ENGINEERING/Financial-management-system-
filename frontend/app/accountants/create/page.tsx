'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout';
import { RegisterSchema } from '@/lib/validation';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { CheckCircle, AlertCircle, ArrowLeft, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

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
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
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
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  font-size: ${theme.typography.fontSizes.md};
  margin-bottom: ${theme.spacing.md};
  text-decoration: none;
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${PRIMARY_COLOR};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FormCard = styled.form`
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const FieldError = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.xs};
`;

const ErrorBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #991b1b;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const SuccessBanner = styled.div`
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #065f46;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  margin-top: ${theme.spacing.sm};
`;

type FormData = z.infer<typeof RegisterSchema>;

export default function CreateAccountantPage() {
  const router = useRouter();
  const { user, fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      full_name: '',
      email: '',
      username: '',
      password: '',
      role: 'ACCOUNTANT' as const,
      phone: '',
      department: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userData = {
        full_name: data.full_name.trim(),
        email: data.email.toLowerCase().trim(),
        username: data.username.trim(),
        password: data.password,
        role: 'accountant',
        phone: data.phone?.trim() || null,
        department: data.department?.trim() || null,
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

      // Refresh the user list
      await fetchAllUsers();

      setSuccess('Accountant created successfully!');
      toast.success('Accountant created successfully!');
      reset();

      setTimeout(() => router.push('/accountants/list'), 1500);
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to create accountant';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
                <h1>Create Accountant</h1>
                <p>Add a new accountant to your organization</p>
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
            <FormGroup>
              <Label htmlFor="full_name">Full Name </Label>
              <Input id="full_name" {...register('full_name')} disabled={loading} />
              {errors.full_name && <FieldError>{errors.full_name.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email </Label>
              <Input id="email" type="email" {...register('email')} disabled={loading} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="username">Username </Label>
              <Input id="username" {...register('username')} disabled={loading} />
              {errors.username && <FieldError>{errors.username.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Password </Label>
              <Input id="password" type="password" {...register('password')} disabled={loading} />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" {...register('phone')} disabled={loading} />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="department">Department (Optional)</Label>
              <Input id="department" {...register('department')} disabled={loading} />
            </FormGroup>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/accountants/list')}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Accountant'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
