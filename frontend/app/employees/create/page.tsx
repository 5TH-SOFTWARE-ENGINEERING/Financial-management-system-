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
import { CheckCircle, AlertCircle, ArrowLeft, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Styled Components Layout
// ──────────────────────────────────────────
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

const FieldError = styled.p`
  color: #dc2626;
  font-size: 14px;
  margin-top: 4px;
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

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 12px;
`;

type FormData = z.infer<typeof RegisterSchema>;

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function CreateEmployeePage() {
  const router = useRouter();
  const { user, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { 
      role: 'EMPLOYEE' as const,
      full_name: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      department: '',
      managerId: '',
    },
  });

  const onSubmit = async (data: any) => {
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
        phone: data.phone?.trim() || null,
        department: data.department?.trim() || null,
        manager_id: data.managerId ? parseInt(data.managerId, 10) : null,
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to create employee';
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
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" {...register('full_name')} disabled={loading} />
              {errors.full_name && <FieldError>{errors.full_name.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} disabled={loading} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="username">Username *</Label>
              <Input id="username" {...register('username')} disabled={loading} />
              {errors.username && <FieldError>{errors.username.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Password *</Label>
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

            <FormGroup>
              <Label htmlFor="managerId">Manager ID (Optional)</Label>
              <Input 
                id="managerId" 
                type="number" 
                {...register('managerId')} 
                disabled={loading} 
                placeholder="Enter manager user ID"
              />
              {errors.managerId && <FieldError>{errors.managerId.message}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => router.push('/employees/list')}
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
