'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { AlertCircle, Building2, Plus, Edit, Trash2, Loader2, Eye, EyeOff, Lock, XCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';
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
  justify-content: space-between;
  align-items: center;
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

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const Card = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
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
  padding: ${theme.spacing.xxl};
  
  svg {
    margin: 0 auto ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.md};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  background: ${theme.colors.backgroundSecondary};
  border-bottom: 2px solid ${theme.colors.border};
  
  th {
    text-align: left;
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${theme.colors.border};
    transition: background-color ${theme.transitions.default};
    
    &:hover {
      background-color: ${theme.colors.backgroundSecondary};
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    td {
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      color: ${TEXT_COLOR_DARK};
      font-size: ${theme.typography.fontSizes.sm};
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const DepartmentName = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  svg {
    width: 16px;
    height: 16px;
    color: ${TEXT_COLOR_MUTED};
  }
  
  span {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
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

interface Department {
  id: string;
  name: string;
  description?: string | null;
  manager_id?: number | null;
  manager_name?: string | null;
  user_count?: number;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DepartmentListPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getDepartments();
      const departmentsData = Array.isArray(response.data) ? response.data as Department[] : [];
      setDepartments(departmentsData);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 404
      ) {
        setError('Departments feature is not available. Please contact your administrator.');
        setDepartments([]);
      } else {
        const fallbackError =
          (typeof err === 'object' &&
            err !== null &&
            'response' in err &&
            (err as { response?: { data?: { detail?: string } } }).response?.data?.detail) ||
          'Failed to load departments';
        setError(fallbackError);
      }
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

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeletePasswordError(null);
    setDepartmentToDelete(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async () => {
    if (!departmentToDelete || !departmentToDelete.id) return;

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
      await apiClient.deleteDepartment(departmentToDelete.id, deletePassword.trim());
      toast.success('Department deleted successfully');
      setShowDeleteModal(false);
      setDepartmentToDelete(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadDepartments();
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.detail) ||
        'Failed to delete department';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setVerifyingPassword(false);
    }
  };

  const handleExport = () => {
    try {
      if (departments.length === 0) {
        toast.error('No departments to export');
        return;
      }

      // Define columns to export
      const headers = [
        'Name',
        'Description',
        'Employees',
        'Manager',
        'Created At'
      ];

      // Format data as CSV
      const csvRows = departments.map(dept => {
        const employeeCount = dept.user_count ?? dept.employee_count ?? 0;
        const managerName = dept.manager_name || 'N/A';
        const createdAt = dept.created_at ? new Date(dept.created_at).toLocaleDateString() : 'N/A';

        return [
          `"${(dept.name || '').replace(/"/g, '""')}"`,
          `"${(dept.description || 'N/A').replace(/"/g, '""')}"`,
          `"${employeeCount}"`,
          `"${managerName.replace(/"/g, '""')}"`,
          `"${createdAt}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `departments_export_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Departments exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export departments');
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading departments...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>Departments</h1>
                <p>Manage organizational departments</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={departments.length === 0}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Link href="/department/create">
                  <Button style={{
                    background: '#ffffff',
                    color: PRIMARY_COLOR,
                    fontWeight: 600
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Department
                  </Button>
                </Link>
              </div>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <Card>
            {departments.length === 0 ? (
              <EmptyState>
                <Building2 size={48} />
                <p>No departments found.</p>
                <Link href="/department/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Department
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Employees</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td>
                          <DepartmentName>
                            <Building2 size={16} />
                            <span>{dept.name}</span>
                          </DepartmentName>
                        </td>
                        <td>{dept.description || 'N/A'}</td>
                        <td>{dept.user_count ?? dept.employee_count ?? 0}</td>
                        <td>
                          {dept.created_at
                            ? new Date(dept.created_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <ActionButtons>
                            <Link href={`/department/edit/${dept.id}`}>
                              <Button size="sm" variant="secondary">
                                <Edit size={14} className="h-4 w-4 mr-1" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(dept)}
                              disabled={deleting}
                            >
                              {deleting && departmentToDelete?.id === dept.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                </>
                              ) : (
                                <Trash2 size={14} className="h-4 w-4 mr-1" />
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
        </ContentContainer>
      </PageContainer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && departmentToDelete && (
        <ModalOverlay $isOpen={showDeleteModal} onClick={handleDeleteCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                Delete Department
              </ModalTitle>
              <button onClick={handleDeleteCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>

            <WarningBox>
              <p>
                <strong>Warning:</strong> You are about to permanently delete this department.
                This action cannot be undone and will remove all users from this department.
                Please enter <strong>your own password</strong> to verify this action.
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
                <Building2 size={18} />
                Department Details to be Deleted
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department Name</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.medium }}>
                      {departmentToDelete.name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employees</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.medium }}>
                      {departmentToDelete.user_count ?? departmentToDelete.employee_count ?? 0}
                    </span>
                  </div>
                </div>
                {departmentToDelete.description && (
                  <div style={{ paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK, lineHeight: 1.6 }}>
                      {departmentToDelete.description}
                    </span>
                  </div>
                )}
                {(departmentToDelete.manager_name || departmentToDelete.created_at) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                    {departmentToDelete.manager_name && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manager</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                          {departmentToDelete.manager_name}
                        </span>
                      </div>
                    )}
                    {departmentToDelete.created_at && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                          {new Date(departmentToDelete.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="delete-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm deletion of <strong>{departmentToDelete.name || 'this department'}</strong>:
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
                    Delete Department
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
