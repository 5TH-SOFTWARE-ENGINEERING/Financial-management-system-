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

const HelpText = styled.p`
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted-foreground);
`;

const FieldError = styled.p`
  color: #dc2626;
  font-size: 14px;
  margin-top: 4px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
`;

/* --------------------------------- PAGE ---------------------------------- */

export default function CreateFinancePage() {
  const router = useRouter();
  const { fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const trimmedPhone = data.phone ? (data.phone || '').trim() : null;
      const trimmedDepartment = data.department ? (data.department || '').trim() : null;

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

      const userData = {
        full_name: trimmedFullName,
        email: trimmedEmail,
        username: trimmedUsername,
        password: data.password,
        role: 'manager',
        phone: trimmedPhone || null,
        department: trimmedDepartment || null,
        manager_id: data.managerId ? Number(data.managerId) : null
      };

      // Only call the API, don't call store's createUser as it might cause issues
      const response = await apiClient.createUser(userData);
      
      // Refresh the user list after successful creation
      await fetchAllUsers();

      setSuccess('Finance manager created successfully!');
      toast.success('Finance manager created successfully!');
      reset();

      setTimeout(() => router.push('/finance/list'), 2000);
    } catch (err: any) {
      console.error('Error creating finance manager:', err);
      
      // Better error message extraction
      let errorMessage = 'Failed to create finance manager';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
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
            <AlertBox status="error">
              <AlertCircle size={18} />
              {error}
            </AlertBox>
          )}

          {success && (
            <AlertBox status="success">
              <CheckCircle size={18} />
              {success}
            </AlertBox>
          )}

          <FormCard 
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading && !isSubmitting) {
                handleSubmit(onSubmit)(e);
              }
            }}
          >
            <FormGroup>
              <Label htmlFor="full_name">Full Name </Label>
              <Input id="full_name" {...register('full_name')} disabled={loading} />
              {errors.full_name && (
                <FieldError>{errors.full_name.message}</FieldError>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email </Label>
              <Input id="email" type="email" {...register('email')} disabled={loading} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="username">Username </Label>
              <Input id="username" {...register('username')} disabled={loading} />
              {errors.username && (
                <FieldError>{errors.username.message}</FieldError>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Password </Label>
              <Input id="password" type="password" {...register('password')} disabled={loading} />
              {errors.password && (
                <FieldError>{errors.password.message}</FieldError>
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
                <FieldError>{errors.managerId.message}</FieldError>
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

              <Button 
                type="submit" 
                disabled={loading || isSubmitting} 
                className="flex-1"
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
