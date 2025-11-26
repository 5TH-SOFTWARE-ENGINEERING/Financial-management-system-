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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { RegisterSchema } from '@/lib/validation';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
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

type FormData = z.infer<typeof RegisterSchema>;

/* --------------------------------- LAYOUT ---------------------------------- */

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
  flex: 1;
  padding: 32px;
`;

const PageWrapper = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

/* --------------------------------- UI STYLES ---------------------------------- */

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

const PageHeader = styled.div`
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

  background: ${({ status }) =>
    status === 'error' ? '#FEF2F2' : '#ECFDF5'};
  border: 1px solid
    ${({ status }) =>
      status === 'error' ? '#FECACA' : '#A7F3D0'};
  color: ${({ status }) =>
    status === 'error' ? '#B91C1C' : '#047857'};
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

const HelpText = styled.p`
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted-foreground);
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin-top: 4px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  padding-top: 12px;
`;

/* --------------------------------- PAGE ---------------------------------- */

export default function CreateFinancePage() {
  const router = useRouter();
  const { createUser, fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      full_name: '',
      email: '',
      username: '',
      password: '',
      role: 'FINANCE_ADMIN' as const,
      phone: '',
      department: '',
      managerId: ''
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userData = {
        full_name: data.full_name,
        email: data.email,
        username: data.username,
        password: data.password,
        role: 'manager',
        phone: data.phone || null,
        department: data.department || null,
        manager_id: data.managerId ? Number(data.managerId) : null
      };

      await apiClient.createUser(userData);
      await createUser(userData);
      await fetchAllUsers();

      setSuccess('Finance manager created successfully!');
      toast.success('Finance manager created successfully!');
      reset();

      setTimeout(() => router.push('/finance/list'), 2000);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to create finance manager';

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* --- Sidebar --- */}
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>

      {/* --- Right Panel (Navbar + Content) --- */}
      <MainWrapper>
        <Navbar />

        <ContentWrapper>
          <PageWrapper>
            {/* Back */}
            <BackLink href="/finance/list">
              <ArrowLeft size={16} />
              Back to Finance Managers
            </BackLink>

            {/* Header */}
            <PageHeader>
              <HeaderRow>
                <Briefcase className="h-8 w-8 text-primary" />
                <Title>Create Finance Manager</Title>
              </HeaderRow>
              <Subtitle>Add a new finance manager to your organization</Subtitle>
            </PageHeader>

            {/* Alerts */}
            {error && (
              <AlertBox status="error">
                <AlertCircle size={16} />
                {error}
              </AlertBox>
            )}

            {success && (
              <AlertBox status="success">
                <CheckCircle size={16} />
                {success}
              </AlertBox>
            )}

            {/* Form */}
            <Card>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormGroup>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" {...register('full_name')} disabled={loading} />
                  {errors.full_name && (
                    <ErrorText>{errors.full_name.message}</ErrorText>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register('email')} disabled={loading} />
                  {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="username">Username *</Label>
                  <Input id="username" {...register('username')} disabled={loading} />
                  {errors.username && (
                    <ErrorText>{errors.username.message}</ErrorText>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" {...register('password')} disabled={loading} />
                  {errors.password && (
                    <ErrorText>{errors.password.message}</ErrorText>
                  )}
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
                    placeholder="Enter manager user ID (usually admin)"
                  />
                  {errors.managerId && (
                    <ErrorText>{errors.managerId.message}</ErrorText>
                  )}
                  <HelpText>Finance managers can be assigned to a supervising admin.</HelpText>
                </FormGroup>

                <ButtonRow>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loading}
                    onClick={() => router.push('/finance/list')}
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
                      'Create Finance Manager'
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
