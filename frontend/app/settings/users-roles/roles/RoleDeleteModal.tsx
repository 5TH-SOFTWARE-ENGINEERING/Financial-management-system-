'use client';

import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import {
  Trash2,
  Shield,
  Lock,
  Eye,
  EyeOff,
  XCircle,
  Loader2,
  AlertTriangle,
  Users,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface ModalRole {
  id: string | number;
  name: string;
  description?: string;
  permissions?: any[];
  userCount?: number;
  permissionCount?: number;
}
// ... existing styled components ...

// Note: Ensure start lines match where component definition starts
// I will just replace the component definition start and the specific JSX parts.
// But better to just replace the whole component body or key parts?
// Since `replace_file_content` works on contiguous blocks, let's fix the imports first, then the component body.
// Actually allowMultiple=false so I have to do it in one block or multiple calls.
// Since the import is at top and component at bottom, I'll do two calls. This call is for IMPORT.


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
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.lg};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.shadows.md};
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
  margin-bottom: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const ModalTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.mutedForeground};
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all ${props => props.theme.transitions.default};
  
  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
    color: ${props => props.theme.colors.text};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const WarningBox = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => `color-mix(in srgb, ${props.theme.colors.error}, transparent 90%)`};
  border: 1px solid ${props => `color-mix(in srgb, ${props.theme.colors.error}, transparent 70%)`};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  p {
    margin: 0;
    color: ${props => props.theme.colors.error};
    font-size: ${props => props.theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const DetailsBox = styled.div`
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const DetailsTitle = styled.h4`
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const DetailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const DetailLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.xs};
  color: ${props => props.theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
`;

const DetailValue = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.md};
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    padding-right: 48px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.theme.colors.background};
    font-size: ${props => props.theme.typography.fontSizes.md};
    color: ${props => props.theme.colors.text};
    transition: all ${props => props.theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 3px ${props => `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)`};
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.mutedForeground};
      opacity: 0.5;
    }
    
    &:disabled {
      background-color: ${props => props.theme.colors.backgroundSecondary};
      color: ${props => props.theme.colors.mutedForeground};
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
  
  .eye-button {
    position: absolute;
    right: ${props => props.theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${props => props.theme.colors.mutedForeground};
    padding: ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${props => props.theme.transitions.default};
    
    &:hover {
      color: ${props => props.theme.colors.text};
      background: ${props => props.theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  margin: ${props => props.theme.spacing.xs} 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing.lg};
`;

interface RoleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  role: ModalRole | null;
  isDeleting: boolean;
}

export const RoleDeleteModal: React.FC<RoleDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  role,
  isDeleting
}) => {
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      setError(null);
      await onConfirm(password);
      setPassword('');
      setShowPassword(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete role. Please verify your password.';
      setError(msg);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setPassword('');
    setError(null);
    setShowPassword(false);
    onClose();
  };

  const formatRoleName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  if (!role) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Trash2 size={20} style={{ color: theme.colors.error }} />
            Secure Role Deletion
          </ModalTitle>
          <CloseButton onClick={handleClose} title="Close" disabled={isDeleting}>
            <XCircle />
          </CloseButton>
        </ModalHeader>

        <WarningBox>
          <p>
            <strong>Warning:</strong> This action is permanent. Deleting the role <strong>"{formatRoleName(role.name)}"</strong> will remove it from the system.
            Please ensure no users are currently assigned to this role before proceeding.
          </p>
        </WarningBox>

        <DetailsBox>
          <DetailsTitle>
            <Shield size={18} />
            Role Specification
          </DetailsTitle>
          <DetailRow>
            <DetailLabel>System Name</DetailLabel>
            <DetailValue>{role.name}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Display Name</DetailLabel>
            <DetailValue>{formatRoleName(role.name)}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Permissions</DetailLabel>
            <DetailValue>{role.permissions?.length || 0} configured permissions</DetailValue>
          </DetailRow>
        </DetailsBox>

        <FormGroup>
          <Label htmlFor="delete-password">
            <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
            Verification Required
          </Label>
          <p style={{ fontSize: '12px', color: theme.colors.mutedForeground, marginBottom: '8px' }}>
            Enter your administrator password to confirm deletion:
          </p>
          <PasswordInputWrapper>
            <input
              id="delete-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter password"
              autoFocus
              disabled={isDeleting}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
            <button
              type="button"
              className="eye-button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isDeleting}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </PasswordInputWrapper>
          {error && <ErrorText>{error}</ErrorText>}
        </FormGroup>

        <ModalActions>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!password.trim() || isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                Permanently Delete
              </>
            )}
          </Button>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};
