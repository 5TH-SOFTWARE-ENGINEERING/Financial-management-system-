'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { AlertCircle, FolderKanban, Plus, Edit, Trash2, Search, Loader2, Eye, EyeOff, Lock, XCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { theme } from '@/components/common/theme';
import { useAuth } from '@/lib/rbac/auth-context';

// Type definitions for error handling
type ErrorWithDetails = {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
};

// ──────────────────────────────────────────
// Theme Constants
// ──────────────────────────────────────────
const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = theme.colors.textDark || '#000000';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

// ──────────────────────────────────────────
// Styled Components
// ──────────────────────────────────────────
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

const AddButton = styled(Button)`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  backdrop-filter: blur(8px);
  transition: all ${theme.transitions.default};

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;


const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
  font-size: ${theme.typography.fontSizes.sm};

  background: ${(p) => (p.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)')};
  border: 1px solid ${(p) => (p.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)')};
  color: ${(p) => (p.type === 'error' ? '#dc2626' : '#065f46')};
`;

const Card = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
`;

const FiltersCard = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.lg};
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: ${theme.spacing.md};
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: ${theme.spacing.md};
    top: 50%;
    transform: translateY(-50%);
    color: ${TEXT_COLOR_MUTED};
    width: 16px;
    height: 16px;
    z-index: 1;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  padding-left: 40px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl} ${theme.spacing.lg};
  
  svg {
    margin: 0 auto ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    margin-bottom: ${theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin-bottom: ${theme.spacing.md};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  border-bottom: 2px solid ${theme.colors.border};
  background: ${theme.colors.backgroundSecondary};
  
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
      background: ${theme.colors.backgroundSecondary};
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

const StatusBadge = styled.span<{ $active: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${(p) => (p.$active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')};
  color: ${(p) => (p.$active ? '#065f46' : '#991b1b')};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const ProjectName = styled.div`
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
`;

const ProjectDescription = styled.div`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  margin-top: ${theme.spacing.xs};
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BudgetAmount = styled.span`
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
`;

const TableCell = styled.td`
  white-space: nowrap;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const IconButton = styled(Button)`
  height: 32px;
  width: 32px;
  padding: 0;
`;

const DeleteIconButton = styled(IconButton)`
  color: #dc2626;
  
  &:hover {
    color: #991b1b;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin-top: ${theme.spacing.md};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
  
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

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

interface Project {
  id: number;
  name: string;
  description?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  assigned_users?: number[] | null;
  assigned_users_names?: string[] | null;
  budget?: number | null;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    loadProjects();
    loadDepartments();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getProjects();
      setProjects((response.data || []) as Project[]);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      if (error.response?.status === 404) {
        setError('Projects feature is not available. Please contact your administrator.');
        setProjects([]);
      } else {
        setError(error.response?.data?.detail || 'Failed to load projects');
        toast.error('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.getDepartments();
      setDepartments(response.data || []);
    } catch {
      // Silently fail - departments are optional for filtering
      setDepartments([]);
    }
  };

  const { user } = useAuth();

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

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeletePasswordError(null);
    setProjectToDelete(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async () => {
    if (!projectToDelete || !projectToDelete.id) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);
    setError(null);

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
      await apiClient.deleteProject(projectToDelete.id, deletePassword.trim());
      toast.success('Project deleted successfully');
      setShowDeleteModal(false);
      setProjectToDelete(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadProjects();
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to delete project';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setVerifyingPassword(false);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.department_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' ||
      project.department_id?.toString() === departmentFilter;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && project.is_active) ||
      (statusFilter === 'inactive' && !project.is_active);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleExportProjects = () => {
    try {
      if (filteredProjects.length === 0) {
        toast.error('No projects to export');
        return;
      }

      // Define columns to export
      const headers = [
        'Name',
        'Description',
        'Department',
        'Budget',
        'Start Date',
        'End Date',
        'Status'
      ];

      // Format data as CSV
      const csvRows = filteredProjects.map(project => {
        const statusLabel = project.is_active ? 'Active' : 'Inactive';
        const budgetValue = project.budget ? project.budget.toFixed(2) : '0.00';
        const startDate = formatDate(project.start_date);
        const endDate = project.end_date ? formatDate(project.end_date) : '-';

        return [
          `"${(project.name || '').replace(/"/g, '""')}"`,
          `"${(project.description || '').replace(/"/g, '""')}"`,
          `"${(project.department_name || '-').replace(/"/g, '""')}"`,
          `"${budgetValue}"`,
          `"${startDate}"`,
          `"${endDate}"`,
          `"${statusLabel}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `projects_export_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Project list exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export project list');
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading projects...</p>
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
                <h1>Projects</h1>
                <p>Manage your projects</p>
              </div>
              <Link href="/project/create">
                <AddButton>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </AddButton>
              </Link>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </MessageBox>
          )}

          <FiltersCard>
            <SearchWrapper>
              <Search size={16} />
              <StyledInput
                type="text"
                placeholder="Search by name, description, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
            <StyledSelect
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {(departments as Array<{ id: number; name: string }>).map((dept) => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </option>
              ))}
            </StyledSelect>
            <StyledSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </StyledSelect>
            <Button
              variant="outline"
              onClick={handleExportProjects}
              disabled={filteredProjects.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}
            >
              <Download size={16} />
              Export
            </Button>
          </FiltersCard>

          <Card>
            {filteredProjects.length === 0 ? (
              <EmptyState>
                <FolderKanban size={48} />
                <h3>No projects</h3>
                <p>
                  {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                    ? 'No projects match your filters'
                    : 'Get started by adding your first project'}
                </p>
                {!searchTerm && departmentFilter === 'all' && statusFilter === 'all' && (
                  <Link href="/project/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </Link>
                )}
              </EmptyState>
            ) : (
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Budget</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <ProjectName>
                            {project.name}
                          </ProjectName>
                          {project.description && (
                            <ProjectDescription>
                              {project.description}
                            </ProjectDescription>
                          )}
                        </td>
                        <TableCell>{project.department_name || '-'}</TableCell>
                        <TableCell>
                          {project.budget ? (
                            <BudgetAmount>
                              ${project.budget.toLocaleString()}
                            </BudgetAmount>
                          ) : (
                            <span>-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(project.start_date)}</TableCell>
                        <TableCell>
                          {project.end_date ? formatDate(project.end_date) : '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge $active={project.is_active}>
                            {project.is_active ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <ActionButtons>
                            <Link href={`/project/edit/${project.id}`}>
                              <IconButton variant="ghost" size="sm">
                                <Edit size={14} className="h-4 w-4" />
                              </IconButton>
                            </Link>
                            <DeleteIconButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(project)}
                              disabled={deleting}
                            >
                              {deleting && projectToDelete?.id === project.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 size={14} className="h-4 w-4" />
                              )}
                            </DeleteIconButton>
                          </ActionButtons>
                        </TableCell>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            )}
          </Card>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && projectToDelete && (
            <ModalOverlay $isOpen={showDeleteModal} onClick={handleDeleteCancel}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>
                    <Trash2 size={20} style={{ color: '#ef4444' }} />
                    Delete Project
                  </ModalTitle>
                  <button onClick={handleDeleteCancel} title="Close" type="button">
                    <XCircle />
                  </button>
                </ModalHeader>
                <WarningBox>
                  <p>
                    <strong>Warning:</strong> You are about to permanently delete this project.
                    This action cannot be undone. Please enter your password to confirm this deletion.
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
                    <FolderKanban size={18} />
                    Project Details to be Deleted
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.medium }}>
                          {projectToDelete.name || 'N/A'}
                        </span>
                      </div>
                      {projectToDelete.budget && (
                        <div style={{ flex: '1 1 200px' }}>
                          <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budget</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
                            ${projectToDelete.budget.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {projectToDelete.description && (
                      <div>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK, lineHeight: 1.6 }}>
                          {projectToDelete.description}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                      {projectToDelete.department_name && (
                        <div>
                          <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                            {projectToDelete.department_name}
                          </span>
                        </div>
                      )}
                      <div>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                        <StatusBadge $active={projectToDelete.is_active}>
                          {projectToDelete.is_active ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </div>
                    </div>
                    {(projectToDelete.start_date || projectToDelete.end_date) && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                        <div style={{ flex: '1 1 200px' }}>
                          <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Date</strong>
                          <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                            {formatDate(projectToDelete.start_date)}
                          </span>
                        </div>
                        {projectToDelete.end_date && (
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>End Date</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                              {formatDate(projectToDelete.end_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {(projectToDelete.assigned_users_names && projectToDelete.assigned_users_names.length > 0) || projectToDelete.created_at ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                        {projectToDelete.assigned_users_names && projectToDelete.assigned_users_names.length > 0 && (
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Users</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                              {projectToDelete.assigned_users_names.join(', ')}
                            </span>
                          </div>
                        )}
                        {projectToDelete.created_at && (
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                              {formatDate(projectToDelete.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <FormGroup>
                  <Label htmlFor="delete-password">
                    <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    Enter <strong>your own password</strong> to confirm deletion of <strong>{projectToDelete.name}</strong>:
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
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={!deletePassword.trim() || deleting || verifyingPassword}
                  >
                    {verifyingPassword ? (
                      <ButtonContent>
                        <Loader2 size={16} className="animate-spin" />
                        Verifying...
                      </ButtonContent>
                    ) : deleting ? (
                      <ButtonContent>
                        <Loader2 size={16} className="animate-spin" />
                        Deleting...
                      </ButtonContent>
                    ) : (
                      <ButtonContent>
                        <Trash2 size={16} />
                        Delete Project
                      </ButtonContent>
                    )}
                  </Button>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}

