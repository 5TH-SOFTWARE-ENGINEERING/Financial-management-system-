'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { AlertCircle, CheckCircle, ArrowLeft, Users, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Styled Components
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

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${(p) => (p.active ? '#d1fae5' : '#fee2e2')};
  color: ${(p) => (p.active ? '#065f46' : '#991b1b')};
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

export default function DeleteEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { deleteUser, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    setLoadingUser(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      const user = (response.data || []).find((u: any) => u.id.toString() === id);
      
      if (!user) {
        setError('Employee not found');
        return;
      }
      
      setEmployee(user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load employee');
      toast.error('Failed to load employee');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm(`Are you sure you want to delete "${employee?.full_name || 'this employee'}"? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await apiClient.deleteUser(parseInt(id, 10));
      await deleteUser(id); // Update store
      await fetchAllUsers(); // Refresh user list
      
      setSuccess('Employee deleted successfully!');
      toast.success('Employee deleted successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/employees/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to delete employee';
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
            <p>Loading employee...</p>
          </LoadingContainer>
        </ContentArea>
      </LayoutWrapper>
    );
  }

  if (!employee) {
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
            <MessageBox type="error">
              <AlertCircle size={18} />
              {error || 'Employee not found'}
            </MessageBox>
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
          <BackLink href="/employees/list">
            <ArrowLeft size={16} />
            Back to Employees
          </BackLink>

          <Title>
            <Users className="h-8 w-8" style={{ color: '#dc2626' }} />
            Delete Employee
          </Title>
          <Subtitle>Confirm deletion of employee</Subtitle>

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

          <Card style={{ borderColor: '#fecaca' }}>
            <WarningSection>
              <div className="icon-wrapper">
                <AlertTriangle size={24} style={{ color: '#dc2626' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2>Are you sure you want to delete this employee?</h2>
                <p>
                  This action cannot be undone. All data associated with this employee will be permanently deleted.
                </p>
              </div>
            </WarningSection>

            <InfoBox>
              <div>
                <span>Name:</span>
                <span>{employee.full_name || 'N/A'}</span>
              </div>
              <div>
                <span>Email:</span>
                <span>{employee.email}</span>
              </div>
              <div>
                <span>Username:</span>
                <span>{employee.username}</span>
              </div>
              <div>
                <span>Department:</span>
                <span>{employee.department || 'N/A'}</span>
              </div>
              <div>
                <span>Status:</span>
                <StatusBadge active={employee.is_active}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </StatusBadge>
              </div>
            </InfoBox>

            <ButtonRow>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => router.push('/employees/list')}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Employee
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

