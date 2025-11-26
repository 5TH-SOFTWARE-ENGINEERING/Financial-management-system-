// app/accountants/[id]/edit/page.tsx
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
import { CheckCircle, AlertCircle, ArrowLeft, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
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

const FormWrapper = styled.form`
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

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 14px;
  margin-top: 4px;
`;

const AlertBox = styled.div<{ status: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;

  background: ${(p) => (p.status === 'error' ? '#fee2e2' : '#d1fae5')};
  border: 1px solid ${(p) => (p.status === 'error' ? '#fecaca' : '#a7f3d0')};
  color: ${(p) => (p.status === 'error' ? '#991b1b' : '#065f46')};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
`;

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
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
        router.push('/accountants/list');
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
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading accountant...</p>
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
          <BackLink href="/accountants/list">
            <ArrowLeft size={16} />
            Back to Accountants
          </BackLink>

          <Title>
            <Users className="h-8 w-8 text-primary" />
            Edit Accountant
          </Title>
          <Subtitle>Update accountant information</Subtitle>

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

          <FormWrapper onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" {...register('full_name')} disabled={loading} />
              {errors.full_name && <ErrorText>{errors.full_name.message}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} disabled={loading} />
              {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="username">Username *</Label>
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
                onClick={() => router.push('/accountants/list')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
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
          </FormWrapper>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}