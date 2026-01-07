'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  Database, Download, Trash2, RefreshCw, HardDrive, Clock, FileText, AlertTriangle,
  CheckCircle, Loader, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

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

// Icon color mapping for different icon types
const getIconColor = (iconType: string, active: boolean = false): string => {
  if (active) {
    // Active state colors (brighter)
    const activeColors: Record<string, string> = {
      'database': '#3b82f6',           // Blue
      'download': '#22c55e',           // Green
      'trash2': '#ef4444',             // Red
      'refresh-cw': '#06b6d4',         // Cyan
      'hard-drive': '#8b5cf6',         // Purple
      'clock': '#f59e0b',              // Amber
      'file-text': '#6366f1',           // Indigo
      'alert-triangle': '#f59e0b',     // Amber
      'check-circle': '#22c55e',        // Green
      'loader': '#3b82f6',             // Blue
      'x': '#6b7280',                  // Gray
    };
    return activeColors[iconType] || '#6b7280';
  } else {
    // Inactive state colors (muted but colorful)
    const inactiveColors: Record<string, string> = {
      'database': '#60a5fa',           // Light Blue
      'download': '#4ade80',           // Light Green
      'trash2': '#f87171',             // Light Red
      'refresh-cw': '#22d3ee',         // Light Cyan
      'hard-drive': '#a78bfa',         // Light Purple
      'clock': '#fbbf24',              // Light Amber
      'file-text': '#818cf8',           // Light Indigo
      'alert-triangle': '#fbbf24',      // Light Amber
      'check-circle': '#4ade80',        // Light Green
      'loader': '#60a5fa',             // Light Blue
      'x': '#9ca3af',                  // Light Gray
    };
    return inactiveColors[iconType] || '#9ca3af';
  }
};

// Icon styled components
const IconWrapper = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false) : '#6b7280'};
    opacity: ${props => props.$active ? 1 : 0.8};
    transition: all 0.2s ease;
    
    svg {
        width: ${props => props.$size ? `${props.$size}px` : '18px'};
        height: ${props => props.$size ? `${props.$size}px` : '18px'};
        transition: all 0.2s ease;
    }

    &:hover {
        opacity: 1;
        transform: scale(1.1);
    }
`;

const TitleIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

const CardIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

const ButtonIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

const DetailIcon = styled(IconWrapper)`
    margin-right: 0.25rem;
`;

const MessageIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

const ModalIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Card = styled.div`
  background-color: ${props => props.theme.colors.card};
  border-radius: 0.375rem;
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: 1.25rem;
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardContent = styled.div`
  padding: 1.25rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.mutedForeground};
  margin-top: 0.25rem;
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${props => props.theme.colors.primary};
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.border};
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: ${props => props.theme.colors.card};
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const BackupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const BackupItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 0.375rem;
  background-color: ${props => props.theme.colors.backgroundSecondary};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.backgroundSecondary};
  }
`;

const BackupInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const BackupName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.textDark};
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BackupDetails = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.mutedForeground};
  flex-wrap: wrap;
`;

const BackupDetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const BackupActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${props => props.theme.colors.mutedForeground};
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${props => props.theme.colors.mutedForeground};
    margin-bottom: 1rem;
  }
  
  .secondary-text {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.875rem;
  }
`;

const ModalText = styled.p`
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const Message = styled.div<{ type: 'error' | 'success' | 'warning' }>`
  background-color: ${props => {
    switch (props.type) {
      case 'error':
        return `color-mix(in srgb, ${props.theme.colors.error}, transparent 90%)`;
      case 'warning':
        return `color-mix(in srgb, ${props.theme.colors.warning}, transparent 90%)`;
      default:
        // Use primary color for success as a fallback since theme.success is not defined
        return `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)`;
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'error':
        return props.theme.colors.error;
      case 'warning':
        return props.theme.colors.warning;
      default:
        return props.theme.colors.primary;
    }
  }};
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid ${props => {
    switch (props.type) {
      case 'error':
        return `color-mix(in srgb, ${props.theme.colors.error}, transparent 70%)`;
      case 'warning':
        return `color-mix(in srgb, ${props.theme.colors.warning}, transparent 70%)`;
      default:
        return `color-mix(in srgb, ${props.theme.colors.primary}, transparent 70%)`;
    }
  }};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.card};
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  box-shadow: ${props => props.theme.shadows.md};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.mutedForeground};
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.textDark};
  }
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  transition: border-color 0.2s;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)`};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.backgroundSecondary};
    cursor: not-allowed;
  }
`;

const PasswordError = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 0.75rem;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background-color: ${props => `color-mix(in srgb, ${props.theme.colors.error}, transparent 90%)`};
  border-radius: 0.25rem;
  border: 1px solid ${props => `color-mix(in srgb, ${props.theme.colors.error}, transparent 70%)`};
`;

interface Backup {
  name: string;
  file: string;
  size: number;
  created_at: string;
  metadata?: {
    backup_name?: string;
    created_at?: string;
    include_files?: boolean;
    version?: string;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
}

export default function BackupSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [includeFiles, setIncludeFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Check if user has required role (ADMIN, FINANCE_ADMIN, or SUPER_ADMIN)
  // Note: Roles are normalized in the store (super_admin -> admin, finance_manager -> finance_manager)
  const hasRequiredRole = React.useMemo(() => {
    if (!user) return false;
    const userRole = user.role?.toLowerCase();
    // Check normalized roles: admin (could be admin or super_admin), finance_manager (could be finance_manager or finance_admin)
    return userRole === 'admin' || userRole === 'finance_manager';
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Check role upfront for better UX (optimistic permission check)
    if (hasRequiredRole) {
      setHasPermission(true);
    }

    // Try to load backups - will get 403 if user doesn't have permission
    loadBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await apiClient.listBackups();
      setBackups((response.data?.backups || []) as Backup[]);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to load backups:', err);

      // Check if it's a permission error
      const error = err as ErrorWithDetails;
      if (error?.response?.status === 403) {
        const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
        setError(errorMessage);
        setHasPermission(false);
        toast.error(errorMessage);
      } else {
        const errorMessage = error?.response?.data?.detail || 'Failed to load backups.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    if (hasPermission === false) {
      setError('Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.');
      toast.error('Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.createBackup(includeFiles);
      const message = response.data?.message || 'Backup started in background.';
      setSuccess(message);
      toast.success(message);

      // Refresh backup list after a delay
      setTimeout(() => {
        loadBackups();
      }, 2000);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      if (error?.response?.status === 403) {
        const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
        setError(errorMessage);
        setHasPermission(false);
        toast.error(errorMessage);
      } else {
        const errorMessage = error?.response?.data?.detail || 'Failed to create backup. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    if (hasPermission === false) {
      setError('Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.');
      toast.error('Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.');
      setShowRestoreModal(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowRestoreModal(false);

    try {
      const response = await apiClient.restoreBackup(selectedBackup.name);
      const message = response.data?.message || 'Backup restored successfully.';
      setSuccess(message);
      toast.success(message);
      setSelectedBackup(null);

      // Refresh backup list
      setTimeout(() => {
        loadBackups();
      }, 1000);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      if (error?.response?.status === 403) {
        const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
        setError(errorMessage);
        setHasPermission(false);
        toast.error(errorMessage);
      } else {
        const errorMessage = error?.response?.data?.detail || 'Failed to restore backup. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    if (hasPermission === false) {
      setError('Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.');
      toast.error('Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.');
      setShowDeleteModal(false);
      return;
    }

    // Validate password
    if (!deletePassword || !deletePassword.trim()) {
      setPasswordError('Password is required to delete a backup.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPasswordError(null);

    try {
      const response = await apiClient.deleteBackup(selectedBackup.name, deletePassword.trim());
      const message = response.data?.message || 'Backup deleted successfully.';
      setSuccess(message);
      toast.success(message);
      setSelectedBackup(null);
      setDeletePassword('');
      setShowDeleteModal(false);

      // Refresh backup list
      loadBackups();
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      if (error?.response?.status === 403) {
        if (error?.response?.data?.detail?.includes('password') || error?.response?.data?.detail?.includes('Password')) {
          const errorMessage = error?.response?.data?.detail || 'Invalid password. Please verify your password to delete this backup.';
          setPasswordError(errorMessage);
          toast.error(errorMessage);
        } else {
          const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
          setError(errorMessage);
          setHasPermission(false);
          toast.error(errorMessage);
          setShowDeleteModal(false);
        }
      } else if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.detail || 'Password is required to delete a backup.';
        setPasswordError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = error?.response?.data?.detail || 'Failed to delete backup. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        setShowDeleteModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const openRestoreModal = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const openDeleteModal = (backup: Backup) => {
    setSelectedBackup(backup);
    setDeletePassword('');
    setPasswordError(null);
    setShowDeleteModal(true);
  };

  if (!user) {
    return (
      <Container>
        <p>Loading...</p>
      </Container>
    );
  }

  // Show access denied message if user doesn't have permission
  if (hasPermission === false) {
    return (
      <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
        <Container>
          <Header>
            <Title>
              <TitleIcon $iconType="database" $size={24} $active={true}>
                <Database size={24} />
              </TitleIcon>
              Backup Management
            </Title>
          </Header>
          <Card>
            <CardContent>
              <EmptyState>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <IconWrapper $iconType="alert-triangle" $size={48} $active={true}>
                    <AlertTriangle size={48} />
                  </IconWrapper>
                </div>
                <h3>
                  Access Denied
                </h3>
                <p>
                  Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.
                </p>
                <p className="secondary-text">
                  Please contact your administrator if you need access to this feature.
                </p>
              </EmptyState>
            </CardContent>
          </Card>
        </Container>
      </ComponentGate>
    );
  }

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <Container>
        <Header>
          <Title>
            <TitleIcon $iconType="database" $size={24} $active={true}>
              <Database size={24} />
            </TitleIcon>
            Backup Management
          </Title>
        </Header>

        {error && !error.includes('Access denied') && (
          <Message type="error">
            <MessageIcon $iconType="alert-triangle" $size={16} $active={true}>
              <AlertTriangle size={16} />
            </MessageIcon>
            <span>{error}</span>
          </Message>
        )}

        {success && (
          <Message type="success">
            <MessageIcon $iconType="check-circle" $size={16} $active={true}>
              <CheckCircle size={16} />
            </MessageIcon>
            <span>{success}</span>
          </Message>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <CardIcon $iconType="hard-drive" $size={18} $active={true}>
                <HardDrive size={18} />
              </CardIcon>
              Create Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <SwitchContainer>
                <div>
                  <Label htmlFor="includeFiles">Include Files</Label>
                  <HelperText>
                    Include uploaded files and attachments in the backup (larger backup size)
                  </HelperText>
                </div>
                <Switch>
                  <SwitchInput
                    type="checkbox"
                    id="includeFiles"
                    checked={includeFiles}
                    onChange={(e) => setIncludeFiles(e.target.checked)}
                    disabled={loading}
                  />
                  <SwitchSlider />
                </Switch>
              </SwitchContainer>
            </FormGroup>

            <ActionButtons>
              <Button
                variant="default"
                onClick={handleCreateBackup}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <ButtonIcon $iconType="loader" $size={16} $active={true}>
                      <Loader size={16} className="animate-spin" />
                    </ButtonIcon>
                    Creating...
                  </>
                ) : (
                  <>
                    <ButtonIcon $iconType="database" $size={16} $active={true}>
                      <Database size={16} />
                    </ButtonIcon>
                    Create Backup
                  </>
                )}
              </Button>
            </ActionButtons>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CardIcon $iconType="file-text" $size={18} $active={true}>
                <FileText size={18} />
              </CardIcon>
              Available Backups
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadBackups}
              disabled={loadingBackups}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ButtonIcon $iconType="refresh-cw" $size={16} $active={!loadingBackups}>
                <RefreshCw size={16} className={loadingBackups ? 'animate-spin' : ''} />
              </ButtonIcon>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingBackups ? (
              <EmptyState>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <IconWrapper $iconType="loader" $size={24} $active={true}>
                    <Loader size={24} className="animate-spin" />
                  </IconWrapper>
                </div>
                <p>Loading backups...</p>
              </EmptyState>
            ) : backups.length === 0 ? (
              <EmptyState>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <IconWrapper $iconType="file-text" $size={48} $active={false}>
                    <FileText size={48} />
                  </IconWrapper>
                </div>
                <p>No backups available</p>
                <HelperText>Create your first backup to get started</HelperText>
              </EmptyState>
            ) : (
              <BackupList>
                {backups.map((backup) => (
                  <BackupItem key={backup.name}>
                    <BackupInfo>
                      <BackupName>
                        <DetailIcon $iconType="database" $size={16} $active={true}>
                          <Database size={16} />
                        </DetailIcon>
                        {backup.name}
                      </BackupName>
                      <BackupDetails>
                        <BackupDetailItem>
                          <DetailIcon $iconType="clock" $size={12} $active={false}>
                            <Clock size={12} />
                          </DetailIcon>
                          {formatDate(backup.created_at)}
                        </BackupDetailItem>
                        <BackupDetailItem>
                          <DetailIcon $iconType="hard-drive" $size={12} $active={false}>
                            <HardDrive size={12} />
                          </DetailIcon>
                          {formatFileSize(backup.size)}
                        </BackupDetailItem>
                        {backup.metadata?.include_files && (
                          <BackupDetailItem>
                            <DetailIcon $iconType="file-text" $size={12} $active={true}>
                              <FileText size={12} />
                            </DetailIcon>
                            Includes files
                          </BackupDetailItem>
                        )}
                        {backup.metadata?.version && (
                          <BackupDetailItem>
                            Version: {backup.metadata.version}
                          </BackupDetailItem>
                        )}
                      </BackupDetails>
                    </BackupInfo>
                    <BackupActions>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openRestoreModal(backup)}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <ButtonIcon $iconType="download" $size={14} $active={true}>
                          <Download size={14} />
                        </ButtonIcon>
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteModal(backup)}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <ButtonIcon $iconType="trash2" $size={14} $active={true}>
                          <Trash2 size={14} />
                        </ButtonIcon>
                      </Button>
                    </BackupActions>
                  </BackupItem>
                ))}
              </BackupList>
            )}
          </CardContent>
        </Card>

        {/* Restore Confirmation Modal */}
        {showRestoreModal && selectedBackup && (
          <ModalOverlay onClick={() => !loading && setShowRestoreModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>
                  <ModalIcon $iconType="alert-triangle" $size={20} $active={true}>
                    <AlertTriangle size={20} />
                  </ModalIcon>
                  Confirm Restore
                </ModalTitle>
                <CloseButton
                  onClick={() => setShowRestoreModal(false)}
                  disabled={loading}
                >
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </CloseButton>
              </ModalHeader>
              <div>
                <Message type="warning">
                  <MessageIcon $iconType="alert-triangle" $size={16} $active={true}>
                    <AlertTriangle size={16} />
                  </MessageIcon>
                  <span>
                    This action will restore the backup and may overwrite current data. This cannot be undone.
                  </span>
                </Message>
                <ModalText>
                  Are you sure you want to restore the backup <strong>{selectedBackup.name}</strong>?
                </ModalText>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRestoreModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleRestoreBackup}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {loading ? (
                      <>
                        <ButtonIcon $iconType="loader" $size={16} $active={true}>
                          <Loader size={16} className="animate-spin" />
                        </ButtonIcon>
                        Restoring...
                      </>
                    ) : (
                      <>
                        <ButtonIcon $iconType="download" $size={16} $active={true}>
                          <Download size={16} />
                        </ButtonIcon>
                        Confirm Restore
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedBackup && (
          <ModalOverlay onClick={() => !loading && setShowDeleteModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>
                  <ModalIcon $iconType="alert-triangle" $size={20} $active={true}>
                    <AlertTriangle size={20} />
                  </ModalIcon>
                  Confirm Delete
                </ModalTitle>
                <CloseButton
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                >
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </CloseButton>
              </ModalHeader>
              <div>
                <Message type="warning">
                  <MessageIcon $iconType="alert-triangle" $size={16} $active={true}>
                    <AlertTriangle size={16} />
                  </MessageIcon>
                  <span>
                    This action will permanently delete the backup. This cannot be undone.
                  </span>
                </Message>
                <ModalText>
                  Are you sure you want to delete the backup <strong>{selectedBackup.name}</strong>?
                </ModalText>
                <div style={{ marginBottom: '1rem' }}>
                  <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                  <PasswordInput
                    type="password"
                    id="deletePassword"
                    placeholder="Enter your password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setPasswordError(null);
                    }}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading && deletePassword.trim()) {
                        handleDeleteBackup();
                      }
                    }}
                  />
                  {passwordError && (
                    <PasswordError>{passwordError}</PasswordError>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                      setPasswordError(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteBackup}
                    disabled={loading || !deletePassword.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {loading ? (
                      <>
                        <ButtonIcon $iconType="loader" $size={16} $active={true}>
                          <Loader size={16} className="animate-spin" />
                        </ButtonIcon>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <ButtonIcon $iconType="trash2" $size={16} $active={true}>
                          <Trash2 size={16} />
                        </ButtonIcon>
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
    </ComponentGate>
  );
}
