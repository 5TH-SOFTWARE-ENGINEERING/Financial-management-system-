'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import apiClient, { type ApiUser } from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';
import type { StoreUser } from '@/store/userStore';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  text-decoration: none;
  margin-bottom: ${theme.spacing.md};
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const HeaderSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const HeaderText = styled.div`
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
`;

const Required = styled.span`
  color: #dc2626;
  margin-left: ${theme.spacing.xs};
`;

const Input = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  background: ${theme.colors.background};
  transition: border-color ${theme.transitions.default}, box-shadow ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }

  &:disabled {
    background: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  background: ${theme.colors.background};
  transition: border-color ${theme.transitions.default}, box-shadow ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }

  &:disabled {
    background: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${PRIMARY_COLOR};
`;

const HelperText = styled.p`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  margin: 0;
`;

const ErrorText = styled.p`
  font-size: ${theme.typography.fontSizes.xs};
  color: #dc2626;
  margin: 0;
`;

const ErrorBanner = styled.div`
  padding: ${theme.spacing.md};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #dc2626;
  margin-bottom: ${theme.spacing.md};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xxl};
  text-align: center;

  p {
    color: ${TEXT_COLOR_MUTED};
    margin-top: ${theme.spacing.md};
  }
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  color: ${PRIMARY_COLOR};

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

interface UserFormData {
  email: string;
  username: string;
  full_name: string;
  phone: string;
  role: string;
  department: string;
  is_active: boolean;
  manager_id: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id ? parseInt(params.id as string, 10) : null;
  const { user: currentUser, allUsers, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [user, setUser] = useState<ApiUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    username: '',
    full_name: '',
    phone: '',
    role: '',
    department: '',
    is_active: true,
    manager_id: '',
  });

  const loadUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUser(userId);
      const foundUser = response.data;
      
      if (!foundUser) {
        setError('User not found');
        return;
      }

      setUser(foundUser);
      setFormData({
        email: foundUser.email || '',
        username: foundUser.username || '',
        full_name: foundUser.full_name || foundUser.username || foundUser.email || '',
        phone: foundUser.phone || '',
        role: foundUser.role?.toLowerCase() || 'employee',
        department: foundUser.department || '',
        is_active: foundUser.is_active !== false,
        manager_id: foundUser.manager_id?.toString() || '',
      });
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to load user'
          : err instanceof Error
            ? err.message
            : 'Failed to load user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId, loadUser]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormError({});

    if (!validateForm()) {
      return;
    }

    if (!userId || !user || !currentUser) return;

    setSaving(true);

    try {
      // Check permissions
      const currentRole = (currentUser.role || '').toLowerCase();
      const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';
      const isFinanceManager = currentRole === 'finance_manager' || currentRole === 'finance_admin' || currentRole === 'manager';
      const isSubordinate = isFinanceManager && user.manager_id?.toString() === currentUser.id?.toString();
      const targetRole = (user.role || '').toLowerCase();
      const isTargetSubordinate = targetRole === 'accountant' || targetRole === 'employee';
      const isEditingSelf = userId.toString() === currentUser.id?.toString();

      // Check if current user can edit this user
      if (!isAdmin && !(isFinanceManager && isSubordinate && isTargetSubordinate)) {
        // If not admin and not editing own subordinate, check if editing self
        if (!isEditingSelf) {
          setError('You do not have permission to edit this user');
          toast.error('You do not have permission to edit this user');
          setSaving(false);
          return;
        }
      }

      type UpdatePayload = Partial<ApiUser> & {
        department?: string | null;
        phone?: string | null;
        manager_id?: number | null;
      };

      const updateData: UpdatePayload = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
      };

      // Only admins can edit role, manager_id, is_active, and department
      // But admins cannot edit these fields when editing themselves
      if (isAdmin && !isEditingSelf) {
        updateData.role = formData.role;
        updateData.is_active = formData.is_active;
        updateData.manager_id = formData.manager_id ? parseInt(formData.manager_id, 10) : undefined;
        updateData.department = formData.department.trim() || undefined;
      } else if (!isEditingSelf || !isAdmin) {
        // Non-admins or admins editing others can edit department
        updateData.department = formData.department.trim() || undefined;
      }
      // Finance managers can edit their subordinates but cannot change role, manager_id, or is_active
      // Those fields are handled by the backend which will reject changes

      await apiClient.updateUser(userId, updateData);
      toast.success('User updated successfully');
      fetchAllUsers(); // Refresh user list
      router.push(`/users/${userId}`);
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to update user'
          : err instanceof Error
            ? err.message
            : 'Failed to update user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formError[field]) {
      setFormError(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner size={32} />
            <p>Loading user data...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (error && !user) {
    return (
      <Layout>
        <PageContainer>
          <BackLink href="/users">
            <ArrowLeft size={16} />
            Back to Users
          </BackLink>
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        </PageContainer>
      </Layout>
    );
  }

  if (!user || !currentUser) {
    return null;
  }

  // Check permissions
  const currentRole = (currentUser.role || '').toLowerCase();
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';
  const isFinanceManager = currentRole === 'finance_manager' || currentRole === 'finance_admin' || currentRole === 'manager';
  const targetRole = (user.role || '').toLowerCase();
  const isTargetSubordinate = targetRole === 'accountant' || targetRole === 'employee';
  const isSubordinate = isFinanceManager && user.manager_id?.toString() === currentUser.id?.toString();
  const isEditingSelf = userId?.toString() === currentUser.id?.toString();
  
  // Determine what can be edited
  // Admins cannot edit Role, Department, Active User, or Manager when editing themselves
  const canEditRole = isAdmin && !isEditingSelf;
  const canEditManager = isAdmin && !isEditingSelf;
  const canEditStatus = isAdmin && !isEditingSelf;
  const canEditDepartment = !isEditingSelf || !isAdmin;
  const canEditUser = isAdmin || (isFinanceManager && isSubordinate && isTargetSubordinate) || isEditingSelf;

  // Get available managers for dropdown
  const availableManagers = allUsers.filter((u: StoreUser) => {
    const role = (u.role || '').toLowerCase();
    return role === 'manager' || role === 'finance_manager' || role === 'finance_admin' || role === 'admin';
  });

  // Redirect if no permission
  if (!canEditUser && userId?.toString() !== currentUser.id?.toString()) {
    return (
      <Layout>
        <PageContainer>
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>You do not have permission to edit this user</span>
          </ErrorBanner>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderSection>
          <BackLink href={`/users/${userId}`}>
            <ArrowLeft size={16} />
            Back to User Details
          </BackLink>
          <HeaderText>
            <h1>Edit User</h1>
            <p>Update user information and settings</p>
          </HeaderText>
        </HeaderSection>

        {error && (
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        )}

        <Card>
          <Form onSubmit={handleSubmit}>
            <FormGrid>
              <FormGroup>
                <Label htmlFor="email">
                  Email <Required></Required>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
                {formError.email && <ErrorText>{formError.email}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="username">
                  Username <Required></Required>
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                />
                {formError.username && <ErrorText>{formError.username}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="full_name">
                  Full Name <Required></Required>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  required
                />
                {formError.full_name && <ErrorText>{formError.full_name}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={!canEditRole}
                >
                  <option value="employee">Employee</option>
                  <option value="accountant">Accountant</option>
                  <option value="manager">Manager</option>
                  <option value="finance_manager">Finance Manager</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="admin">Administrator</option>
                  {currentRole === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </Select>
                {!canEditRole && (
                  <HelperText>
                    {isEditingSelf && isAdmin 
                      ? 'You cannot change your own role' 
                      : 'You don&apos;t have permission to change the role'}
                  </HelperText>
                )}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={!canEditDepartment}
                />
                {!canEditDepartment && isEditingSelf && isAdmin && (
                  <HelperText>You cannot change your own department</HelperText>
                )}
              </FormGroup>

              {(canEditManager || isEditingSelf) && (
                <FormGroup>
                  <Label htmlFor="manager_id">Manager</Label>
                  <Select
                    id="manager_id"
                    value={formData.manager_id}
                    onChange={(e) => handleChange('manager_id', e.target.value)}
                    disabled={!canEditManager}
                  >
                    <option value="">None</option>
                    {availableManagers.map((manager: StoreUser) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name || manager.email}
                      </option>
                    ))}
                  </Select>
                  <HelperText>
                    {!canEditManager && isEditingSelf && isAdmin
                      ? 'You cannot change your own manager'
                      : 'Select a manager for this user'}
                  </HelperText>
                </FormGroup>
              )}

              {(canEditStatus || isEditingSelf) && (
                <FormGroup>
                  <CheckboxWrapper>
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                      disabled={!canEditStatus}
                    />
                    <Label htmlFor="is_active" style={{ margin: 0, cursor: canEditStatus ? 'pointer' : 'not-allowed' }}>
                      Active User
                    </Label>
                  </CheckboxWrapper>
                  <HelperText>
                    {!canEditStatus && isEditingSelf && isAdmin
                      ? 'You cannot change your own active status'
                      : 'Inactive users cannot log in to the system'}
                  </HelperText>
                </FormGroup>
              )}
            </FormGrid>

            <Actions>
              <Button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: PRIMARY_COLOR, color: '#fff' }}
              >
                {saving ? (
                  <>
                    <Spinner size={16} style={{ marginRight: theme.spacing.sm }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} style={{ marginRight: theme.spacing.sm }} />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
            </Actions>
          </Form>
        </Card>
      </PageContainer>
    </Layout>
  );
}

