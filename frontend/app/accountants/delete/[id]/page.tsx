'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { AlertCircle, CheckCircle, ArrowLeft, Users, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const ERROR_COLOR = '#dc2626';
const WARNING_BG = '#fee2e2';
const WARNING_BORDER = '#fecaca';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${ERROR_COLOR} 0%, #991b1b 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  font-size: ${theme.typography.fontSizes.md};
  margin-bottom: ${theme.spacing.md};
  text-decoration: none;
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${PRIMARY_COLOR};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Card = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  border: 2px solid ${WARNING_BORDER};
  box-shadow: ${CardShadow};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const ErrorBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #991b1b;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const SuccessBanner = styled.div`
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #065f46;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const WarningSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  
  .icon-wrapper {
    padding: ${theme.spacing.md};
    background: ${WARNING_BG};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
    line-height: 1.5;
  }
`;

const InfoBox = styled.div`
  background: ${theme.colors.backgroundSecondary};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  border: 1px solid ${theme.colors.border};
  
  div {
    display: flex;
    align-items: center;
    margin-bottom: ${theme.spacing.sm};
    
    &:last-child {
      margin-bottom: 0;
    }
    
    span:first-child {
      font-weight: ${theme.typography.fontWeights.medium};
      color: ${TEXT_COLOR_DARK};
      margin-right: ${theme.spacing.sm};
      min-width: 100px;
    }
    
    span:last-child {
      color: ${TEXT_COLOR_MUTED};
      font-size: ${theme.typography.fontSizes.md};
    }
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => (p.$active ? '#d1fae5' : '#fee2e2')};
  color: ${(p) => (p.$active ? '#065f46' : '#991b1b')};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  
  p {
    margin-top: ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const Spinner = styled(Loader2)`
  width: 40px;
  height: 40px;
  color: ${PRIMARY_COLOR};
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function DeleteAccountantPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { deleteUser } = useUserStore();
  
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountant, setAccountant] = useState<any>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    setLoadingUser(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      const user = (response.data || []).find((u: any) => u.id.toString() === id);
      
      if (!user) {
        setError('Accountant not found');
        setLoadingUser(false);
        return;
      }
      
      // Filter to ensure it's an accountant
      if (user.role?.toLowerCase() !== 'accountant') {
        setError('User is not an accountant');
        setLoadingUser(false);
        return;
      }
      
      setAccountant(user);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load accountant';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await apiClient.deleteUser(parseInt(id, 10), password);
      await deleteUser(id, password); // Update store
      
      setSuccess('Accountant deleted successfully!');
      toast.success('Accountant deleted successfully!');
      
      // Redirect after 2 seconds to the list page
      setTimeout(() => {
        router.push('/accountants/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to delete accountant';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading accountant...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (!accountant && !error) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <BackLink href="/accountants/list">
              <ArrowLeft />
              Back to Accountants
            </BackLink>
            <ErrorBanner>
              <AlertCircle />
              <span>Accountant not found</span>
            </ErrorBanner>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href="/accountants/list">
            <ArrowLeft />
            Back to Accountants
          </BackLink>

          <HeaderContainer>
            <HeaderContent>
              <AlertTriangle />
              <div>
                <h1>Delete Accountant</h1>
                <p>Confirm deletion of accountant</p>
              </div>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          {success && (
            <SuccessBanner>
              <CheckCircle />
              <span>{success}</span>
            </SuccessBanner>
          )}

          {accountant && (
            <Card>
              <WarningSection>
                <div className="icon-wrapper">
                  <AlertTriangle size={24} style={{ color: ERROR_COLOR }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2>Are you sure you want to delete this accountant?</h2>
                  <p>
                    This action cannot be undone. All data associated with this accountant will be permanently deleted.
                  </p>
                </div>
              </WarningSection>

              <InfoBox>
                <div>
                  <span>Name:</span>
                  <span>{accountant.full_name || 'N/A'}</span>
                </div>
                <div>
                  <span>Email:</span>
                  <span>{accountant.email || 'N/A'}</span>
                </div>
                <div>
                  <span>Username:</span>
                  <span>{accountant.username || 'N/A'}</span>
                </div>
                <div>
                  <span>Phone:</span>
                  <span>{accountant.phone || 'N/A'}</span>
                </div>
                <div>
                  <span>Department:</span>
                  <span>{accountant.department || 'N/A'}</span>
                </div>
                <div>
                  <span>Status:</span>
                  <StatusBadge $active={accountant.is_active ?? true}>
                    {accountant.is_active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </div>
              </InfoBox>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, color: TEXT_COLOR_DARK, fontWeight: 500 }}>
                  Enter your password to confirm
                </label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <ButtonRow>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => router.push('/accountants/list')}
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
                      Delete Accountant
                    </>
                  )}
                </Button>
              </ButtonRow>
            </Card>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
