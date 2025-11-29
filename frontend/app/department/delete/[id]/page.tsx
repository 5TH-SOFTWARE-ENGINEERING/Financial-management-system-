'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
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

const Card = styled.div`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
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

const WarningSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  
  .icon-wrapper {
    padding: 12px;
    background: #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--foreground);
  }
  
  p {
    color: var(--muted-foreground);
    margin-bottom: 16px;
  }
`;

const InfoBox = styled.div`
  background: var(--muted);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  
  div {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    span:first-child {
      font-weight: 500;
      color: var(--foreground);
      margin-right: 8px;
    }
    
    span:last-child {
      color: var(--muted-foreground);
    }
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

interface Department {
  id: string;
  name: string;
  description?: string | null;
  manager_id?: number | null;
  user_count?: number;
}

export default function DeleteDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.id ? (params.id as string) : null;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    if (departmentId) {
      loadDepartment();
    }
  }, [departmentId]);

  const loadDepartment = async () => {
    if (!departmentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getDepartment(departmentId);
      setDepartment(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load department';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!departmentId || !department) return;

    if (!confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteDepartment(departmentId as string);
      toast.success('Department deleted successfully!');
      router.push('/department/list');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete department';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
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

  if (error && !department) {
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
            <Card>
              <MessageBox type="error">
                <AlertTriangle size={18} />
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Error</h2>
                  <p>{error}</p>
                </div>
              </MessageBox>
            </Card>
          </InnerContent>
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
            <Building2 className="h-8 w-8 text-red-600" />
            Delete Department
          </Title>
          <Subtitle>Confirm deletion of department</Subtitle>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              {error}
            </MessageBox>
          )}

          <Card>
            <WarningSection>
              <div className="icon-wrapper">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div style={{ flex: 1 }}>
                <h2>Are you sure you want to delete this department?</h2>
                <p>This action cannot be undone. All associated data may be affected.</p>
              </div>
            </WarningSection>

            {department && (
              <InfoBox>
                <div>
                  <span>Name:</span>
                  <span>{department.name}</span>
                </div>
                {department.description && (
                  <div>
                    <span>Description:</span>
                    <span>{department.description}</span>
                  </div>
                )}
              </InfoBox>
            )}

            <ButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/department/list')}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Department
                  </>
                )}
              </Button>
            </ButtonRow>
          </Card>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

