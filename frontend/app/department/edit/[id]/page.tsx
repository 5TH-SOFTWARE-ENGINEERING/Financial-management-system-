'use client';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDepartmentSchema, type CreateDepartmentInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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

const FormCard = styled.form`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
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
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
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

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
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
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.id ? (params.id as string) : undefined;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDepartmentInput>({
    resolver: zodResolver(CreateDepartmentSchema),
  });

  const loadDepartment = useCallback(async () => {
    if (!departmentId) {
      setError('Department ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Decode the department ID if it's URL encoded
      const decodedId = decodeURIComponent(departmentId);
      
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading department with ID:', {
          original: departmentId,
          decoded: decodedId,
        });
      }
      
      const response = await apiClient.getDepartment(decodedId);
      
      // Handle both direct response and wrapped response
      const department = (response?.data || response) as {
        id?: string;
        name?: string;
        description?: string | null;
        user_count?: number;
      };
      
      if (!department) {
        throw new Error('Invalid response from server');
      }
      
      // Check if department has required fields
      if (!department.name) {
        throw new Error('Department name is missing in response');
      }
      
      reset({
        name: department.name || '',
        description: department.description || undefined,
        managerId: '', // Departments don't have managers in current implementation
      });
    } catch (err: unknown) {
      console.error('Error loading department:', err);
      
      let errorMessage = 'Failed to load department';
      
      if (typeof err === 'object' && err !== null) {
        // Handle Axios errors
        if ('response' in err) {
          const axiosError = err as { response?: { status?: number; data?: { detail?: string; message?: string } } };
          const status = axiosError.response?.status;
          const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message;
          
          if (status === 404) {
            errorMessage = `Department not found. The department with ID "${departmentId}" does not exist or has no active users.`;
          } else if (status === 403) {
            errorMessage = 'You do not have permission to view this department.';
          } else if (status === 401) {
            errorMessage = 'Please log in to view departments.';
          } else if (detail) {
            errorMessage = detail;
          } else {
            errorMessage = `Failed to load department (Status: ${status})`;
          }
        } else if ('message' in err) {
          // Handle standard Error objects
          errorMessage = (err as { message: string }).message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [departmentId, reset]);

  useEffect(() => {
    if (departmentId) {
      loadDepartment();
    }
  }, [departmentId, loadDepartment]);

  const onSubmit = async (data: CreateDepartmentInput) => {
    if (!departmentId) {
      setError('Department ID is missing');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Decode the department ID if it's URL encoded
      const decodedId = decodeURIComponent(departmentId);
      
      const departmentData = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      };

      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Updating department:', {
          id: decodedId,
          data: departmentData,
        });
      }

      await apiClient.updateDepartment(decodedId, departmentData);
      toast.success('Department updated successfully!');
      router.push('/department/list');
    } catch (err: unknown) {
      console.error('Error updating department:', err);
      
      let errorMessage = 'Failed to update department';
      
      if (typeof err === 'object' && err !== null) {
        // Handle Axios errors
        if ('response' in err) {
          const axiosError = err as { response?: { status?: number; data?: { detail?: string; message?: string } } };
          const status = axiosError.response?.status;
          const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message;
          
          if (status === 404) {
            errorMessage = `Department not found. The department with ID "${departmentId}" does not exist or has no users.`;
          } else if (status === 403) {
            errorMessage = 'You do not have permission to update departments.';
          } else if (status === 401) {
            errorMessage = 'Please log in to update departments.';
          } else if (status === 400) {
            errorMessage = detail || 'Invalid department data. Please check your input.';
          } else if (detail) {
            errorMessage = detail;
          } else {
            errorMessage = `Failed to update department (Status: ${status})`;
          }
        } else if ('message' in err) {
          // Handle standard Error objects
          errorMessage = (err as { message: string }).message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading department...</p>
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
          <BackLink href="/department/list">
            <ArrowLeft size={16} />
            Back to Departments
          </BackLink>

          <Title>
            <Building2 className="h-8 w-8 text-primary" />
            Edit Department
          </Title>
          <Subtitle>Update department information</Subtitle>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              {error}
            </MessageBox>
          )}

          <FormCard onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <Label htmlFor="name">Department Name </Label>
              <StyledInput
                id="name"
                {...register('name')}
                placeholder="e.g., Finance, HR, IT"
                disabled={submitting}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <StyledTextarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the department"
                disabled={submitting}
                rows={4}
              />
              {errors.description && <FieldError>{errors.description.message}</FieldError>}
            </FormGroup>

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/department/list')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Department'
                )}
              </Button>
            </ButtonRow>
          </FormCard>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

