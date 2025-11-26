// app/accountants/[id]/delete/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components'; // Import styled
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  border-radius: 8px;
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

const Card = styled.div`
  background: var(--card, #ffffff);
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow */
`;

const ConfirmationText = styled.p`
  font-size: 1.125rem; /* lg */
  font-weight: 600; /* semibold */
  margin-bottom: 16px;
  color: #B91C1C; /* red-700 */
`;

const UserDetails = styled.div`
  background: #F9FAFB; /* gray-50 */
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 24px;
  line-height: 1.5;
  
  strong {
    font-weight: 700;
    margin-right: 4px;
  }
`;

const WarningText = styled.p`
  margin-top: 16px;
  font-size: 0.875rem; /* sm */
  color: #4B5563; /* gray-600 */
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

const CenteredMessage = styled.div`
  padding-top: 48px;
  text-align: center;
  font-size: 1rem;
`;

/* --------------------------------- PAGE ---------------------------------- */

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

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    setLoadingUser(true);
    setError(null);
    
    try {
      // NOTE: This assumes apiClient.getUsers() fetches ALL users, which is inefficient.
      // A dedicated API endpoint like apiClient.getUserById(id) would be better.
      const response = await apiClient.getUsers();
      const user = (response.data || []).find((u: any) => u.id.toString() === id);
      
      if (!user) {
        setError('Accountant not found');
        return;
      }
      
      setAccountant(user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load accountant');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await apiClient.deleteUser(parseInt(id, 10));
      await deleteUser(id); // Update store
      
      setSuccess('Accountant deleted successfully!');
      toast.success('Accountant deleted successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/accountants');
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
      <PageContainer>
        <CenteredMessage>
          <p>Loading accountant...</p>
        </CenteredMessage>
      </PageContainer>
    );
  }

  if (!accountant) {
    return (
      <PageContainer>
        <AlertBox status="error">
          <AlertCircle size={16} />
          <span>{error || 'Accountant not found'}</span>
        </AlertBox>
        <Button 
          className="mt-4" 
          variant="secondary"
          onClick={() => router.push('/accountants')}
        >
          Back to Accountants
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>Delete Accountant</PageHeader>
      
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

      {/* Confirmation Card */}
      <Card>
        <ConfirmationText>
          Are you sure you want to delete this accountant?
        </ConfirmationText>
        
        <UserDetails>
          <p><strong>Name:</strong> {accountant.full_name || 'N/A'}</p>
          <p><strong>Email:</strong> {accountant.email}</p>
          <p><strong>Username:</strong> {accountant.username}</p>
          <p><strong>Department:</strong> {accountant.department || 'N/A'}</p>
        </UserDetails>
        
        <WarningText>
          This action cannot be undone. All data associated with this accountant will be permanently deleted.
        </WarningText>

        <ButtonRow>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => router.push('/accountants')}
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
            {loading ? 'Deleting...' : 'Delete Accountant'}
          </Button>
        </ButtonRow>
      </Card>
    </PageContainer>
  );
}