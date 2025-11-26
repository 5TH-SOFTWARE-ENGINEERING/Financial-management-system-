'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import { RegisterSchema } from '@/lib/validation';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Styled Components Layout
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: #f5f6fa;
  height: 100vh;
`;

const ContentArea = styled.div`
  flex: 1;
  padding-left: 260px; /* Sidebar width */
  display: flex;
  flex-direction: column;
`;

const InnerContent = styled.div`
  padding: 32px;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
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

const FieldError = styled.p`
  color: #dc2626;
  font-size: 14px;
  margin-top: 6px;
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

type FormData = z.infer<typeof RegisterSchema>;

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function CreateAccountantPage() {
  const router = useRouter();
  const { createUser } = useUserStore();

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
        full_name: data.full_name,
        email: data.email,
        username: data.username,
        password: data.password,
        role: 'accountant',
        phone: data.phone || null,
        department: data.department || null,
      };

      await apiClient.createUser(userData);
      await createUser(userData);

      setSuccess('Accountant created successfully!');
      toast.success('Accountant created successfully!');
      reset();

      setTimeout(() => router.push('/accountants'), 1500);
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
    <LayoutWrapper>
      <Sidebar />
      <ContentArea>
        <Navbar />

        <InnerContent>
          <Title>Create Accountant</Title>

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
            <div>
              <Label>Full Name</Label>
              <Input {...register('full_name')} />
              {errors.full_name && <FieldError>{errors.full_name.message}</FieldError>}
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </div>

            <div>
              <Label>Username</Label>
              <Input {...register('username')} />
              {errors.username && <FieldError>{errors.username.message}</FieldError>}
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </div>

            <div>
              <Label>Phone (optional)</Label>
              <Input {...register('phone')} />
            </div>

            <div>
              <Label>Department (optional)</Label>
              <Input {...register('department')} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Creating...' : 'Create Accountant'}
              </Button>
            </div>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
