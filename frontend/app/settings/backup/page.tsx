'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  HardDrive, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Loader,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

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
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.25rem;
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
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
  color: #4b5563;
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
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
    background-color: #3b82f6;
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
  background-color: #e5e7eb;
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
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
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
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
  color: #111827;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BackupDetails = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
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
  color: #6b7280;
`;

const Message = styled.div<{ type: 'error' | 'success' | 'warning' }>`
  background-color: ${props => 
    props.type === 'error' ? '#fee2e2' : 
    props.type === 'warning' ? '#fef3c7' : 
    '#dcfce7'};
  color: ${props => 
    props.type === 'error' ? '#b91c1c' : 
    props.type === 'warning' ? '#92400e' : 
    '#166534'};
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #111827;
  }
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
      setBackups(response.data?.backups || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load backups:', err);
      
      // Check if it's a permission error
      if (err.response?.status === 403) {
        const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
        setError(errorMessage);
        setHasPermission(false);
        toast.error(errorMessage);
      } else {
        const errorMessage = err.response?.data?.detail || 'Failed to load backups.';
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
    } catch (err: any) {
      if (err.response?.status === 403) {
        const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
        setError(errorMessage);
        setHasPermission(false);
        toast.error(errorMessage);
      } else {
        const errorMessage = err.response?.data?.detail || 'Failed to create backup. Please try again.';
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
    } catch (err: any) {
      if (err.response?.status === 403) {
        const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
        setError(errorMessage);
        setHasPermission(false);
        toast.error(errorMessage);
      } else {
        const errorMessage = err.response?.data?.detail || 'Failed to restore backup. Please try again.';
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

    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowDeleteModal(false);

    try {
      const response = await apiClient.deleteBackup(selectedBackup.name);
      const message = response.data?.message || 'Backup deleted successfully.';
      setSuccess(message);
      toast.success(message);
      setSelectedBackup(null);
      
      // Refresh backup list
      loadBackups();
    } catch (err: any) {
      if (err.response?.status === 403) {
        const errorMessage = 'Access denied. Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.';
        setError(errorMessage);
        setHasPermission(false);
        toast.error(errorMessage);
      } else {
        const errorMessage = err.response?.data?.detail || 'Failed to delete backup. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
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
                <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                  Access Denied
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Backup management requires ADMIN, FINANCE_ADMIN, or SUPER_ADMIN role.
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
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
            <Database size={24} />
            Backup Management
          </Title>
        </Header>

        {error && !error.includes('Access denied') && (
          <Message type="error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </Message>
        )}

        {success && (
          <Message type="success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </Message>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <HardDrive size={18} />
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
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Database size={16} />
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
              <FileText size={18} />
              Available Backups
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadBackups}
              disabled={loadingBackups}
            >
              <RefreshCw size={16} className={loadingBackups ? 'animate-spin' : ''} />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingBackups ? (
              <EmptyState>
                <Loader size={24} className="animate-spin mx-auto mb-2" />
                <p>Loading backups...</p>
              </EmptyState>
            ) : backups.length === 0 ? (
              <EmptyState>
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No backups available</p>
                <HelperText>Create your first backup to get started</HelperText>
              </EmptyState>
            ) : (
              <BackupList>
                {backups.map((backup) => (
                  <BackupItem key={backup.name}>
                    <BackupInfo>
                      <BackupName>
                        <Database size={16} />
                        {backup.name}
                      </BackupName>
                      <BackupDetails>
                        <BackupDetailItem>
                          <Clock size={12} />
                          {formatDate(backup.created_at)}
                        </BackupDetailItem>
                        <BackupDetailItem>
                          <HardDrive size={12} />
                          {formatFileSize(backup.size)}
                        </BackupDetailItem>
                        {backup.metadata?.include_files && (
                          <BackupDetailItem>
                            <FileText size={12} />
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
                      >
                        <Download size={14} />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteModal(backup)}
                        disabled={loading}
                      >
                        <Trash2 size={14} />
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
                  <AlertTriangle size={20} />
                  Confirm Restore
                </ModalTitle>
                <CloseButton
                  onClick={() => setShowRestoreModal(false)}
                  disabled={loading}
                >
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <div>
                <Message type="warning">
                  <AlertTriangle size={16} />
                  <span>
                    This action will restore the backup and may overwrite current data. This cannot be undone.
                  </span>
                </Message>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Are you sure you want to restore the backup <strong>{selectedBackup.name}</strong>?
                </p>
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
                  >
                    {loading ? (
                      <>
                        <Loader size={16} className="animate-spin mr-2" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
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
                  <AlertTriangle size={20} />
                  Confirm Delete
                </ModalTitle>
                <CloseButton
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                >
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <div>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Are you sure you want to delete the backup <strong>{selectedBackup.name}</strong>? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteBackup}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader size={16} className="animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
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

