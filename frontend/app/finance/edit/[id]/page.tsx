'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styled from 'styled-components';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';

import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Loader2
} from 'lucide-react';

import Link from 'next/link';
import { toast } from 'sonner';

/* ------------------------------- VALIDATION ------------------------------- */

const UpdateFinanceSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional()
});

type FormData = z.infer<typeof UpdateFinanceSchema>;

/* -------------------------------- STYLES --------------------------------- */

const Layout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--background);
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: var(--card);
  border-right: 1px solid var(--border);

  @media (max-width: 768px) {
    width: auto;
  }
`;

const MainWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  padding: 32px;
`;

const PageWrapper = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted-foreground);
  font-size: 14px;
  margin-bottom: 16px;

  &:hover {
    color: var(--foreground);
  }
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: var(--muted-foreground);
`;

const AlertBox = styled.div<{ status: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  background: ${({ status }) => (status === 'error' ? '#FEF2F2' : '#ECFDF5')};
  border: 1px solid
    ${({ status }) => (status === 'error' ? '#FECACA' : '#A7F3D0')};
  color: ${({ status }) => (status === 'error' ? '#B91C1C' : '#047857')};
`;

const Card = styled.div`
  background: var(--card);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin-top: 4px;
`;

const HelpText = styled.p`
  font-size: 13px;
  color: var(--muted-foreground);
  margin-top: 4px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  padding-top: 12px;
`;

/* -------------------------------- PAGE ----------------------------------- */

export default function EditFinancePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { updateUser, fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } =
    useForm<FormData>({
      resolver: zodResolver(UpdateFinanceSchema)
    });

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;

    setLoadingUser(true);
    setError(null);

    try {
      const response = await apiClient.getUser(parseInt(id, 10));
      const user = response.data;

      if (!user) {
        setError('Finance manager not found');
        return;
      }

      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        department: user.department || '',
        managerId: user.manager_id?.toString() || ''
      });
    } catch (err: any) {
      setError('Failed to load finance manager');
      toast.error('Failed to load finance manager');
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
        manager_id: data.managerId ? parseInt(data.managerId, 10) : null
      };

      await apiClient.updateUser(parseInt(id, 10), userData);
      await updateUser(id, userData);
      await fetchAllUsers();

      setSuccess('Finance manager updated successfully!');
      toast.success('Finance manager updated successfully!');

      setTimeout(() => router.push('/finance/list'), 2000);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to update finance manager';

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading finance manager...</p>
      </div>
    );
  }

  return (
    <Layout>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>

      <MainWrapper>
        <Navbar />

        <ContentWrapper>
          <PageWrapper>
            <BackLink href="/finance/list">
              <ArrowLeft size={16} />
              Back to Finance Managers
            </BackLink>

            <Header>
              <HeaderRow>
                <Briefcase className="h-8 w-8 text-primary" />
                <Title>Edit Finance Manager</Title>
              </HeaderRow>
              <Subtitle>Update finance manager information</Subtitle>
            </Header>

            {error && (
              <AlertBox status="error">
                <AlertCircle size={16} /> {error}
              </AlertBox>
            )}

            {success && (
              <AlertBox status="success">
                <CheckCircle size={16} /> {success}
              </AlertBox>
            )}

            <Card>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormGroup>
                  <Label>Full Name *</Label>
                  <Input {...register('full_name')} disabled={loading} />
                  {errors.full_name && (
                    <ErrorText>{errors.full_name.message}</ErrorText>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label>Email *</Label>
                  <Input type="email" {...register('email')} disabled={loading} />
                  {errors.email && (
                    <ErrorText>{errors.email.message}</ErrorText>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label>Username *</Label>
                  <Input {...register('username')} disabled={loading} />
                  {errors.username && (
                    <ErrorText>{errors.username.message}</ErrorText>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label>Phone</Label>
                  <Input {...register('phone')} disabled={loading} />
                </FormGroup>

                <FormGroup>
                  <Label>Department</Label>
                  <Input {...register('department')} disabled={loading} />
                </FormGroup>

                <FormGroup>
                  <Label>Manager ID</Label>
                  <Input
                    type="number"
                    {...register('managerId')}
                    disabled={loading}
                  />
                  <HelpText>
                    Finance managers can be assigned to an admin manager.
                  </HelpText>
                </FormGroup>

                <ButtonRow>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/finance/list')}
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
                      'Update Finance Manager'
                    )}
                  </Button>
                </ButtonRow>
              </form>
            </Card>
          </PageWrapper>
        </ContentWrapper>
      </MainWrapper>
    </Layout>
  );
}
