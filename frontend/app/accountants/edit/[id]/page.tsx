// app/accountants/[id]/edit/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styled from 'styled-components'; // Import styled
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/* --------------------------------- ZOD SCHEMA ---------------------------------- */

const UpdateAccountantSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
});

type FormData = z.infer<typeof UpdateAccountantSchema>;

/* --------------------------------- STYLED COMPONENTS ---------------------------------- */

const PageContainer = styled.div`
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
`;

const PageHeader = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 32px;
`;

const AlertBox = styled.div<{ status: 'error' | 'success' }>`
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  /* Conditional styling based on status */
  ${({ status }) =>
    status === 'error'
      ? `
        background: #FEF2F2; /* red-50 */
        border: 1px solid #FECACA; /* red-200 */
        color: #B91C1C; /* red-700 */
      `
      : `
        background: #ECFDF5; /* green-50 */
        border: 1px solid #A7F3D0; /* green-200 */
        color: #047857; /* green-700 */
      `}
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px; /* space-y-6 */
  background: var(--card, #ffffff);
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow */
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const ErrorText = styled.p`
  color: #EF4444; /* red-500 */
  font-size: 0.875rem; /* text-sm */
  margin-top: 4px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  padding-top: 8px;
`;

const CenteredMessage = styled.div`
  padding-top: 48px;
  text-align: center;
  font-size: 1rem;
`;

/* --------------------------------- PAGE ---------------------------------- */

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

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    setLoadingUser(true);
    setError(null);
    
    try {
      // NOTE: Better to use a dedicated getUserById endpoint if available
      const response = await apiClient.getUsers(); 
      const user = (response.data || []).find((u: any) => u.id.toString() === id);
      
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load accountant');
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
      };
      
      await apiClient.updateUser(parseInt(id, 10), userData);
      await updateUser(id, userData); // Update store
      
      setSuccess('Accountant updated successfully!');
      toast.success('Accountant updated successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/accountants');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to update accountant';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <PageContainer>
        <CenteredMessage>
          <p>Loading accountant...</p>
        </CenteredMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>Edit Accountant</PageHeader>
      
      {/* Alerts */}
      {error && (
        <AlertBox status="error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </AlertBox>
      )}
      
      {success && (
        <AlertBox status="success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </AlertBox>
      )}

      {/* Form */}
      <FormWrapper onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" {...register('full_name')} disabled={loading} />
          {errors.full_name && <ErrorText>{errors.full_name.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} disabled={loading} />
          {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...register('username')} disabled={loading} />
          {errors.username && <ErrorText>{errors.username.message}</ErrorText>}
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
            onClick={() => router.push('/accountants')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Updating...' : 'Update Accountant'}
          </Button>
        </ButtonRow>
      </FormWrapper>
    </PageContainer>
  );
}