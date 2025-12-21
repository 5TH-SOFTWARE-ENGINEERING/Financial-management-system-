'use client';
import { useState, useEffect, Suspense } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { AlertCircle, Edit, Trash2, UserPlus, Loader2, UserCheck, Shield, Eye, EyeOff, Lock, XCircle, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Switch } from '@/components/ui/switch';
import { type ApiUser } from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

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

interface Accountant {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  department: string | null;
}

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
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
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
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const AddButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: ${theme.borderRadius.md};
  text-decoration: none;
  font-weight: ${theme.typography.fontWeights.medium};
  font-size: ${theme.typography.fontSizes.md};
  transition: all ${theme.transitions.default};
  border: 1px solid rgba(255, 255, 255, 0.3);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  svg {
    width: 16px;
    height: 16px;
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

const Card = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl} ${theme.spacing.lg};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.md};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: ${theme.borderRadius.md};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  border-bottom: 2px solid ${theme.colors.border};
  
  th {
    text-align: left;
    padding: ${theme.spacing.md};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    font-size: ${theme.typography.fontSizes.sm};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${theme.colors.border};
    transition: background-color ${theme.transitions.default};
    
    &:hover {
      background: ${theme.colors.backgroundSecondary};
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    td {
      padding: ${theme.spacing.md};
      color: ${TEXT_COLOR_MUTED};
      font-size: ${theme.typography.fontSizes.md};
    }
  }
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $isActive }) =>
    $isActive
      ? `
        background: #D1FAE5;
        color: #065F46;
      `
      : `
        background: #FEE2E2;
        color: #991B1B;
      `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
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

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    
    &:hover {
      background: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_DARK};
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const WarningBox = styled.div`
  padding: ${theme.spacing.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  
  p {
    margin: 0;
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.xs};
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    padding-right: 48px;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    background: ${theme.colors.background};
    font-size: ${theme.typography.fontSizes.md};
    color: ${TEXT_COLOR_DARK};
    transition: all ${theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
    
    &::placeholder {
      color: ${TEXT_COLOR_MUTED};
      opacity: 0.5;
    }
    
    &:disabled {
      background-color: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_MUTED};
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
  
  button {
    position: absolute;
    right: ${theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${theme.transitions.default};
    
    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg};
`;

const SearchContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    padding-left: 40px;
    padding-right: 40px;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    background: ${theme.colors.background};
    font-size: ${theme.typography.fontSizes.md};
    color: ${TEXT_COLOR_DARK};
    transition: all ${theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
    
    &::placeholder {
      color: ${TEXT_COLOR_MUTED};
      opacity: 0.5;
    }
  }
  
  .search-icon {
    position: absolute;
    left: ${theme.spacing.sm};
    color: ${TEXT_COLOR_MUTED};
    width: 18px;
    height: 18px;
    pointer-events: none;
  }
  
  .clear-button {
    position: absolute;
    right: ${theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${theme.transitions.default};
    
    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const SearchButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const SearchResultsInfo = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
`;

const Badge = styled.span<{ $variant: 'admin' | 'finance_manager' | 'finance_admin' | 'accountant' | 'employee' | 'active' | 'inactive' | 'default' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;

  ${(p) => {
    switch (p.$variant) {
      case 'admin':
        return 'background-color: #f3e8ff; color: #6b21a8;';
      case 'finance_manager':
        return 'background-color: #dbeafe; color: #1e40af;';
      case 'finance_admin':
        return 'background-color: #dbeafe; color: #1e40af;';
      case 'accountant':
        return 'background-color: #dcfce7; color: #166534;';
      case 'employee':
        return 'background-color: #fed7aa; color: #9a3412;';
      case 'active':
        return 'background-color: #dcfce7; color: #166534;';
      case 'inactive':
        return 'background-color: #fee2e2; color: #991b1b;';
      default:
        return 'background-color: #f3f4f6; color: #374151;';
    }
  }}
`;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const typedErr = err as { response?: { data?: { detail?: string; message?: string } } };
    return typedErr.response?.data?.detail || typedErr.response?.data?.message || fallback;
  }
  return (err as { message?: string }).message || fallback;
};

function AccountantListPageInner() {
  const { user } = useAuth();
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountantToDelete, setAccountantToDelete] = useState<Accountant | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [accountantToActivate, setAccountantToActivate] = useState<Accountant | null>(null);
  const [accountantToDeactivate, setAccountantToDeactivate] = useState<Accountant | null>(null);
  const [activatePassword, setActivatePassword] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [activatePasswordError, setActivatePasswordError] = useState<string | null>(null);
  const [deactivatePasswordError, setDeactivatePasswordError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAccountants, setFilteredAccountants] = useState<Accountant[]>([]);

  useEffect(() => {
    loadAccountants();
  }, []);

  useEffect(() => {
    filterAccountants();
  }, [accountants, searchQuery]);

  const filterAccountants = () => {
    if (!searchQuery.trim()) {
      setFilteredAccountants(accountants);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = accountants.filter((accountant) => {
      const fullName = (accountant.full_name || '').toLowerCase();
      const email = (accountant.email || '').toLowerCase();
      const username = (accountant.username || '').toLowerCase();
      const phone = (accountant.phone || '').toLowerCase();
      const department = (accountant.department || '').toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query) ||
        phone.includes(query) ||
        department.includes(query)
      );
    });

    setFilteredAccountants(filtered);
  };

  const handleSearch = () => {
    filterAccountants();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredAccountants(accountants);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadAccountants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      const users = Array.isArray(response.data) ? (response.data as ApiUser[]) : [];
      // Filter for accountants only
      const accountantUsers = users
        .filter((user) => user.role?.toLowerCase() === 'accountant')
        .map((user) => ({
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || null,
        role: user.role || 'accountant',
        is_active: user.is_active ?? true,
        department: user.department || null,
      }));
      setAccountants(accountantUsers);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to load accountants');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use login endpoint to verify password
      const identifier = user.email || '';
      await apiClient.request({
        method: 'POST',
        url: '/auth/login-json',
        data: {
          username: identifier,
          password: password
        }
      });
      return true;
    } catch (err: unknown) {
      // If login fails, password is incorrect
      return false;
    }
  };

  const handleDeleteClick = (accountant: Accountant) => {
    setAccountantToDelete(accountant);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeletePasswordError(null);
    setAccountantToDelete(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async () => {
    if (!accountantToDelete || !accountantToDelete.id) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);

    try {
      // First verify password
      const isValid = await verifyPassword(deletePassword.trim());
      
      if (!isValid) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setVerifyingPassword(false);
        return;
      }

      // Password is correct, proceed with deletion
      setDeleting(true);
      setError(null);
      await apiClient.deleteUser(accountantToDelete.id, deletePassword.trim());
      toast.success('Accountant deleted successfully');
      setShowDeleteModal(false);
      setAccountantToDelete(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadAccountants();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to delete accountant');
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setVerifyingPassword(false);
    }
  };

  const handleToggleActive = (accountant: Accountant) => {
    if (togglingId === accountant.id) return;

    if (accountant.is_active) {
      // Show deactivate modal
      setAccountantToDeactivate(accountant);
      setShowDeactivateModal(true);
      setDeactivatePassword('');
      setDeactivatePasswordError(null);
    } else {
      // Show activate modal
      setAccountantToActivate(accountant);
      setShowActivateModal(true);
      setActivatePassword('');
      setActivatePasswordError(null);
    }
  };

  const handleActivateCancel = () => {
    setShowActivateModal(false);
    setAccountantToActivate(null);
    setActivatePassword('');
    setActivatePasswordError(null);
  };

  const handleDeactivateCancel = () => {
    setShowDeactivateModal(false);
    setAccountantToDeactivate(null);
    setDeactivatePassword('');
    setDeactivatePasswordError(null);
  };

  const handleActivate = async () => {
    if (!accountantToActivate || !activatePassword.trim()) {
      setActivatePasswordError('Password is required');
      return;
    }

    setTogglingId(accountantToActivate.id);
    setActivatePasswordError(null);
    setError(null);

    try {
      await apiClient.activateUser(accountantToActivate.id, activatePassword.trim());
      toast.success(`${accountantToActivate.full_name} has been activated`);
      setShowActivateModal(false);
      setAccountantToActivate(null);
      setActivatePassword('');
      await loadAccountants();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to activate accountant');
      setActivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!accountantToDeactivate || !deactivatePassword.trim()) {
      setDeactivatePasswordError('Password is required');
      return;
    }

    setTogglingId(accountantToDeactivate.id);
    setDeactivatePasswordError(null);
    setError(null);

    try {
      await apiClient.deactivateUser(accountantToDeactivate.id, deactivatePassword.trim());
      toast.success(`${accountantToDeactivate.full_name} has been deactivated`);
      setShowDeactivateModal(false);
      setAccountantToDeactivate(null);
      setDeactivatePassword('');
      await loadAccountants();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to deactivate accountant');
      setDeactivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const getRoleBadgeVariant = (role: string): 'admin' | 'finance_manager' | 'finance_admin' | 'accountant' | 'employee' | 'default' => {
    const normalizedRole = (role || '').toLowerCase();
    switch (normalizedRole) {
      case 'admin':
        return 'admin';
      case 'finance_manager':
      case 'manager':
        return 'finance_manager';
      case 'finance_admin':
        return 'finance_admin';
      case 'accountant':
        return 'accountant';
      case 'employee':
        return 'employee';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      manager: 'Manager',
      finance_admin: 'Finance Admin',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    const normalizedRole = (role || '').toLowerCase();
    return roleNames[normalizedRole] || normalizedRole;
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>Accountants</h1>
                <p>Manage accountant accounts</p>
              </div>
              <AddButton href="/accountants/create">
                <UserPlus />
                Create Accountant
              </AddButton>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          {!loading && accountants.length > 0 && (
            <SearchContainer>
              <SearchInputWrapper>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, username, phone, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-button"
                    onClick={handleClearSearch}
                    title="Clear search"
                  >
                    <X />
                  </button>
                )}
              </SearchInputWrapper>
              <SearchButton onClick={handleSearch}>
                <Search size={16} />
                Search
              </SearchButton>
            </SearchContainer>
          )}

          {!loading && searchQuery && (
            <SearchResultsInfo>
              Showing {filteredAccountants.length} of {accountants.length} accountant{accountants.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </SearchResultsInfo>
          )}

          {loading ? (
            <LoadingContainer>
              <Spinner />
              <p>Loading accountants...</p>
            </LoadingContainer>
          ) : (
            <Card>
              {filteredAccountants.length === 0 && searchQuery ? (
                <EmptyState>
                  <p>No accountants found matching "{searchQuery}".</p>
                  <Button
                    variant="outline"
                    onClick={handleClearSearch}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </EmptyState>
              ) : accountants.length === 0 ? (
                <EmptyState>
                  <p>No accountants found.</p>
                  <Link href="/accountants/create">
                    <Button className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create First Accountant
                    </Button>
                  </Link>
                </EmptyState>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Phone</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {filteredAccountants.map((accountant) => (
                        <tr key={accountant.id}>
                          <td>{accountant.full_name || 'N/A'}</td>
                          <td>{accountant.email}</td>
                          <td>{accountant.username}</td>
                          <td>{accountant.phone || 'N/A'}</td>
                          <td>{accountant.department || 'N/A'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                              <StatusBadge $isActive={accountant.is_active}>
                                {accountant.is_active ? 'Active' : 'Inactive'}
                              </StatusBadge>
                              <Switch
                                checked={accountant.is_active}
                                onCheckedChange={() => handleToggleActive(accountant)}
                                disabled={togglingId === accountant.id || deleting}
                                aria-label={`${accountant.is_active ? 'Deactivate' : 'Activate'} ${accountant.full_name}`}
                              />
                              {togglingId === accountant.id && (
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: TEXT_COLOR_MUTED }} />
                              )}
                            </div>
                          </td>
                          <td>
                            <ActionButtons>
                              <Link href={`/accountants/edit/${accountant.id}`}>
                                <Button size="sm" variant="secondary">
                                  <Edit size={14} className="h-4 w-4 mr-1" />
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteClick(accountant)}
                                disabled={deleting}
                              >
                                {deleting && accountantToDelete?.id === accountant.id ? (
                                  <>
                                    <Loader2 size={16} className="h-4 w-4 mr-1 animate-spin" />
                                  </>
                                ) : (
                                  <Trash2 size={14}className="h-4 w-4 mr-1" />
                                )}
                              </Button>
                            </ActionButtons>
                          </td>
                        </tr>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          )}
        </ContentContainer>
      </PageContainer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && accountantToDelete && (
        <ModalOverlay $isOpen={showDeleteModal} onClick={handleDeleteCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                Delete Accountant
              </ModalTitle>
              <button onClick={handleDeleteCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>
            <WarningBox>
              <p>
                <strong>Warning:</strong> You are about to permanently delete this accountant. 
                This action cannot be undone. Please enter <strong>your own password</strong> to verify this action.
              </p>
            </WarningBox>

            <div style={{
              background: theme.colors.backgroundSecondary,
              border: '1px solid ' + theme.colors.border,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg
            }}>
              <h4 style={{
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.bold,
                color: TEXT_COLOR_DARK,
                margin: `0 0 ${theme.spacing.md} 0`,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                <Shield size={18} />
                Accountant Details to be Deleted
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.medium }}>
                      {accountantToDelete.full_name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                      {accountantToDelete.email}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                  {accountantToDelete.username && (
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                        {accountantToDelete.username}
                      </span>
                    </div>
                  )}
                  {accountantToDelete.phone && (
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                        {accountantToDelete.phone}
                      </span>
                    </div>
                  )}
                </div>
                {(accountantToDelete.department || accountantToDelete.role || accountantToDelete.is_active !== undefined) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                    {accountantToDelete.department && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                          {accountantToDelete.department}
                        </span>
                      </div>
                    )}
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</strong>
                      <Badge $variant={getRoleBadgeVariant(accountantToDelete.role)}>
                        {getRoleDisplayName(accountantToDelete.role)}
                      </Badge>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                      <Badge $variant={accountantToDelete.is_active ? 'active' : 'inactive'}>
                        {accountantToDelete.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="delete-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm deletion of <strong>{accountantToDelete.full_name || 'this accountant'}</strong>:
              </Label>
              <PasswordInputWrapper>
                <input
                  id="delete-password"
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && deletePassword.trim() && !verifyingPassword && !deleting) {
                      handleDelete();
                    }
                  }}
                  disabled={verifyingPassword || deleting}
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  title={showDeletePassword ? 'Hide password' : 'Show password'}
                  disabled={verifyingPassword || deleting}
                >
                  {showDeletePassword ? <EyeOff /> : <Eye />}
                </button>
              </PasswordInputWrapper>
              {deletePasswordError && (
                <ErrorText>{deletePasswordError}</ErrorText>
              )}
            </FormGroup>

            <ModalActions>
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deleting || verifyingPassword}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!deletePassword.trim() || deleting || verifyingPassword}
              >
                {verifyingPassword ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Verifying...
                  </>
                ) : deleting ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                    Delete Accountant
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && accountantToActivate && (
        <ModalOverlay $isOpen={showActivateModal} onClick={handleActivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <UserCheck size={20} style={{ color: '#16a34a' }} />
                Activate Accountant
              </ModalTitle>
              <button onClick={handleActivateCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>

            <WarningBox style={{ background: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }}>
              <p style={{ color: '#16a34a' }}>
                <strong>Confirm Activation:</strong> This will restore access for <strong>{accountantToActivate.full_name}</strong>.
              </p>
            </WarningBox>

            <FormGroup>
              <Label htmlFor="activate-password">
                Enter <strong>your own password</strong> to confirm activation of <strong>{accountantToActivate.full_name}</strong>:
              </Label>
              <PasswordInputWrapper>
                <input
                  id="activate-password"
                  type="password"
                  value={activatePassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setActivatePassword(e.target.value);
                    setActivatePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && activatePassword.trim()) {
                      handleActivate();
                    }
                  }}
                />
              </PasswordInputWrapper>
              {activatePasswordError && (
                <ErrorText>{activatePasswordError}</ErrorText>
              )}
            </FormGroup>

            <ModalActions>
              <Button
                variant="outline"
                onClick={handleActivateCancel}
                disabled={togglingId === accountantToActivate.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActivate}
                disabled={!activatePassword.trim() || togglingId === accountantToActivate.id}
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              >
                {togglingId === accountantToActivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <UserCheck size={16} style={{ marginRight: theme.spacing.sm }} />
                    Activate Accountant
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && accountantToDeactivate && (
        <ModalOverlay $isOpen={showDeactivateModal} onClick={handleDeactivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Shield size={20} style={{ color: '#dc2626' }} />
                Deactivate Accountant
              </ModalTitle>
              <button onClick={handleDeactivateCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>

            <WarningBox>
              <p>
                <strong>Warning:</strong> This will revoke access for <strong>{accountantToDeactivate.full_name}</strong>. They will not be able to log in until reactivated.
              </p>
            </WarningBox>

            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg
            }}>
              <h4 style={{
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.bold,
                color: TEXT_COLOR_DARK,
                margin: `0 0 ${theme.spacing.md} 0`
              }}>
                Accountant Details to be Deactivated:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Name:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                    {accountantToDeactivate.full_name || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Email:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                    {accountantToDeactivate.email}
                  </span>
                </div>
                {accountantToDeactivate.username && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Username:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {accountantToDeactivate.username}
                    </span>
                  </div>
                )}
                {accountantToDeactivate.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Phone:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {accountantToDeactivate.phone}
                    </span>
                  </div>
                )}
                {accountantToDeactivate.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Department:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {accountantToDeactivate.department}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Role:</strong>
                  <Badge $variant={getRoleBadgeVariant(accountantToDeactivate.role)}>
                    {getRoleDisplayName(accountantToDeactivate.role)}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Status:</strong>
                  <Badge $variant={accountantToDeactivate.is_active ? 'active' : 'inactive'}>
                    {accountantToDeactivate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="deactivate-password">
                Enter your password to confirm deactivation:
              </Label>
              <PasswordInputWrapper>
                <input
                  id="deactivate-password"
                  type="password"
                  value={deactivatePassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDeactivatePassword(e.target.value);
                    setDeactivatePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && deactivatePassword.trim()) {
                      handleDeactivate();
                    }
                  }}
                />
              </PasswordInputWrapper>
              {deactivatePasswordError && (
                <ErrorText>{deactivatePasswordError}</ErrorText>
              )}
            </FormGroup>

            <ModalActions>
              <Button
                variant="outline"
                onClick={handleDeactivateCancel}
                disabled={togglingId === accountantToDeactivate.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={!deactivatePassword.trim() || togglingId === accountantToDeactivate.id}
              >
                {togglingId === accountantToDeactivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Shield size={16} style={{ marginRight: theme.spacing.sm }} />
                    Deactivate Accountant
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Layout>
  );
}

const AccountantListPageFallback = () => (
  <Layout>
    <PageContainer>
      <ContentContainer>
        <LoadingContainer>
          <Spinner />
          <p>Loading accountants...</p>
        </LoadingContainer>
      </ContentContainer>
    </PageContainer>
  </Layout>
);

export default function AccountantListPage() {
  return (
    <Suspense fallback={<AccountantListPageFallback />}>
      <AccountantListPageInner />
    </Suspense>
  );
}
