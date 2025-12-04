'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { Save, Lock, Shield, Key, AlertTriangle, Eye, EyeOff, CheckCircle, AlertCircle, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

// Icon color mapping for different icon types
const getIconColor = (iconType: string, active: boolean = false): string => {
    if (active) {
        // Active state colors (brighter)
        const activeColors: Record<string, string> = {
            'save': '#22c55e',              // Green
            'lock': '#3b82f6',              // Blue
            'shield': '#8b5cf6',            // Purple
            'key': '#f59e0b',               // Amber
            'alert-triangle': '#f59e0b',     // Amber
            'eye': '#6366f1',               // Indigo
            'eye-off': '#6b7280',           // Gray
            'check-circle': '#22c55e',       // Green
            'alert-circle': '#ef4444',       // Red
            'x': '#6b7280',                 // Gray
            'qr-code': '#06b6d4',           // Cyan
        };
        return activeColors[iconType] || '#6b7280';
    } else {
        // Inactive state colors (muted but colorful)
        const inactiveColors: Record<string, string> = {
            'save': '#4ade80',              // Light Green
            'lock': '#60a5fa',              // Light Blue
            'shield': '#a78bfa',            // Light Purple
            'key': '#fbbf24',               // Light Amber
            'alert-triangle': '#fbbf24',     // Light Amber
            'eye': '#818cf8',               // Light Indigo
            'eye-off': '#9ca3af',           // Light Gray
            'check-circle': '#4ade80',       // Light Green
            'alert-circle': '#f87171',       // Light Red
            'x': '#9ca3af',                 // Light Gray
            'qr-code': '#22d3ee',           // Light Cyan
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

const ToggleIcon = styled(IconWrapper)`
    cursor: pointer;
`;

const StatusIcon = styled(IconWrapper)`
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
  max-width: 1000px;
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

const ErrorText = styled.p`
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const PasswordInputContainer = styled.div`
  position: relative;
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #4b5563;
  }
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

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const PasswordStrengthMeter = styled.div`
  margin-top: 0.5rem;
`;

const PasswordStrengthBar = styled.div`
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  margin-top: 0.25rem;
  overflow: hidden;
`;

const PasswordStrengthIndicator = styled.div<{ strength: number }>`
  height: 100%;
  width: ${props => `${props.strength}%`};
  background-color: ${props => {
    if (props.strength < 25) return '#ef4444'; // Red (weak)
    if (props.strength < 50) return '#f97316'; // Orange (fair)
    if (props.strength < 75) return '#eab308'; // Yellow (good)
    return '#22c55e'; // Green (strong)
  }};
  transition: width 0.3s ease, background-color 0.3s ease;
`;

const PasswordStrengthLabel = styled.div<{ strength: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  
  span:first-child {
    color: ${props => {
      if (props.strength < 25) return '#ef4444'; // Red (weak)
      if (props.strength < 50) return '#f97316'; // Orange (fair)
      if (props.strength < 75) return '#eab308'; // Yellow (good)
      return '#22c55e'; // Green (strong)
    }};
    font-weight: 500;
  }
  
  span:last-child {
    color: #6b7280;
  }
`;

const VerificationHistoryContainer = styled.div`
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-top: 0.5rem;
`;

const VerificationHistoryItem = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:nth-child(even) {
    background-color: #f9fafb;
  }
`;

const VerificationHistoryDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VerificationHistoryDevice = styled.div`
  font-weight: 500;
  color: #4b5563;
`;

const VerificationHistoryMeta = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const VerificationHistoryStatus = styled.span<{ $success: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.$success ? '#22c55e' : '#ef4444'};
  font-size: 0.75rem;
  font-weight: 500;
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  background-color: ${props => props.type === 'error' ? '#fee2e2' : '#dcfce7'};
  color: ${props => props.type === 'error' ? '#b91c1c' : '#166534'};
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
  max-height: 90vh;
  overflow-y: auto;
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

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const QRCodeImage = styled.img`
  width: 250px;
  height: 250px;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.5rem;
  background-color: white;
`;

const CodeInput = styled(Input)`
  text-align: center;
  font-size: 1.25rem;
  letter-spacing: 0.5rem;
  font-family: monospace;
  max-width: 200px;
  margin: 0 auto;
`;

const StatusBadge = styled.span<{ $enabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.$enabled ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.$enabled ? '#166534' : '#b91c1c'};
`;

interface VerificationHistoryEntry {
  id: string;
  device: string;
  location: string;
  ip: string;
  date: string;
  success: boolean;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    requirePasswordChange: 90, // days
    allowMultipleSessions: true,
    ipRestriction: false
  });
  
  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading2FAStatus, setLoading2FAStatus] = useState(true);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [manualEntryKey, setManualEntryKey] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [setupStep, setSetupStep] = useState<'qr' | 'verify'>('qr');
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Verification history
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // IP Restriction state
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
  const [allowedIPs, setAllowedIPs] = useState<string[]>([]);
  const [loadingIPRestriction, setLoadingIPRestriction] = useState(true);
  const [newIPAddress, setNewIPAddress] = useState('');
  const [ipError, setIpError] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationHistory();
    load2FAStatus();
    loadIPRestrictionStatus();
  }, []);

  const load2FAStatus = async () => {
    setLoading2FAStatus(true);
    try {
      const response = await apiClient.get2FAStatus();
      setIs2FAEnabled(response.data?.enabled || false);
      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: response.data?.enabled || false }));
    } catch (err: any) {
      console.error('Failed to load 2FA status:', err);
    } finally {
      setLoading2FAStatus(false);
    }
  };

  const handle2FASetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.setup2FA();
      setQrCodeUrl(response.data?.qr_code_url || null);
      setManualEntryKey(response.data?.manual_entry_key || null);
      setShow2FASetup(true);
      setSetupStep('qr');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to setup 2FA. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient.verify2FA(verificationCode);
      setIs2FAEnabled(true);
      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
      setShow2FASetup(false);
      setVerificationCode('');
      setQrCodeUrl(null);
      setManualEntryKey(null);
      setSuccess('2FA enabled successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Invalid verification code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!disablePassword) {
      setError('Please enter your current password to disable 2FA');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient.disable2FA(disablePassword);
      setIs2FAEnabled(false);
      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
      setShow2FADisable(false);
      setDisablePassword('');
      setSuccess('2FA disabled successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to disable 2FA. Please check your password.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await apiClient.getVerificationHistory();
      setVerificationHistory(response.data || []);
    } catch (err: any) {
      console.error('Failed to load verification history:', err);
      setVerificationHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadIPRestrictionStatus = async () => {
    setLoadingIPRestriction(true);
    try {
      const response = await apiClient.getIPRestrictionStatus();
      setIpRestrictionEnabled(response.data?.enabled || false);
      setAllowedIPs(response.data?.allowed_ips || []);
      setSecuritySettings(prev => ({ ...prev, ipRestriction: response.data?.enabled || false }));
    } catch (err: any) {
      console.error('Failed to load IP restriction status:', err);
    } finally {
      setLoadingIPRestriction(false);
    }
  };

  const handleIPRestrictionToggle = async (enabled: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.updateIPRestriction(enabled);
      setIpRestrictionEnabled(response.data?.enabled || false);
      setAllowedIPs(response.data?.allowed_ips || []);
      setSecuritySettings(prev => ({ ...prev, ipRestriction: enabled }));
      setSuccess(`IP restriction ${enabled ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update IP restriction. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIPAddress.trim()) {
      setIpError('Please enter an IP address');
      return;
    }

    setIpError(null);
    setLoading(true);
    try {
      const response = await apiClient.addAllowedIP(newIPAddress.trim());
      setAllowedIPs(response.data?.allowed_ips || []);
      setNewIPAddress('');
      setSuccess('IP address added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to add IP address. Please check the format.';
      setIpError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIP = async (ipAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.removeAllowedIP(ipAddress);
      setAllowedIPs(response.data?.allowed_ips || []);
      setSuccess('IP address removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to remove IP address. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    // Reset specific error when user is typing
    setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    
    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }
    
    // Calculate password strength if changing new password
    if (name === 'newPassword') {
      calculatePasswordStrength(value);
    }
    
    // Re-validate confirm password if new password changes
    if (name === 'newPassword' && passwordForm.confirmPassword) {
      if (value !== passwordForm.confirmPassword) {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleSecuritySettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSecuritySettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setSecuritySettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculatePasswordStrength = (password: string) => {
    // Basic password strength calculation
    let strength = 0;
    
    // Length contribution (up to 25%)
    const lengthFactor = Math.min(password.length / 12, 1) * 25;
    strength += lengthFactor;
    
    // Character variety contribution (up to 75% more)
    if (/[A-Z]/.test(password)) strength += 15; // Uppercase
    if (/[a-z]/.test(password)) strength += 15; // Lowercase
    if (/[0-9]/.test(password)) strength += 15; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 30; // Special characters
    
    setPasswordStrength(Math.min(strength, 100));
  };

  const getPasswordStrengthLabel = (): string => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const validatePasswordForm = (): boolean => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    
    // Check if there are any errors
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSavePassword = async () => {
    // Clear previous errors
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!validatePasswordForm()) {
      // Validation errors are already set in passwordErrors state
      toast.error('Please fix the errors in the form before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call API to change password
      const response = await apiClient.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      // Reset form on success
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength(0);
      
      // Clear password errors
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Show success message
      const successMessage = response.data?.message || 'Password updated successfully';
      setSuccess(successMessage);
      toast.success(successMessage);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to update password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Set specific field error if it's about current password
      if (errorMessage.toLowerCase().includes('current password') || errorMessage.toLowerCase().includes('incorrect')) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Save to localStorage (these are client-side preferences)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_security_settings', JSON.stringify(securitySettings));
      }
      
      setSuccess('Security settings updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to update security settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load security settings from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user_security_settings');
        if (stored) {
          setSecuritySettings(prev => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch (error) {
        console.error('Failed to load security settings:', error);
      }
    }
  }, []);

  if (!user) {
    return (
      <Container>
        <p>Loading...</p>
      </Container>
    );
  }

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <Container>
        <Header>
          <Title>
            <TitleIcon $iconType="shield" $size={24} $active={true}>
              <Shield size={24} />
            </TitleIcon>
            Security Settings
          </Title>
        </Header>

        {error && (
          <Message type="error">
            <MessageIcon $iconType="alert-circle" $size={16} $active={true}>
              <AlertCircle size={16} />
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
              <CardIcon $iconType="key" $size={18} $active={true}>
                <Key size={18} />
              </CardIcon>
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInputContainer>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                />
                <TogglePasswordButton
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <ToggleIcon $iconType={showCurrentPassword ? "eye-off" : "eye"} $size={16} $active={true}>
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </ToggleIcon>
                </TogglePasswordButton>
              </PasswordInputContainer>
              {passwordErrors.currentPassword && (
                <ErrorText>{passwordErrors.currentPassword}</ErrorText>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInputContainer>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
                <TogglePasswordButton
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <ToggleIcon $iconType={showNewPassword ? "eye-off" : "eye"} $size={16} $active={true}>
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </ToggleIcon>
                </TogglePasswordButton>
              </PasswordInputContainer>
              {passwordErrors.newPassword && (
                <ErrorText>{passwordErrors.newPassword}</ErrorText>
              )}
              
              {passwordForm.newPassword && (
                <PasswordStrengthMeter>
                  <PasswordStrengthLabel strength={passwordStrength}>
                    <span>{getPasswordStrengthLabel()}</span>
                    <span>Password Strength</span>
                  </PasswordStrengthLabel>
                  <PasswordStrengthBar>
                    <PasswordStrengthIndicator strength={passwordStrength} />
                  </PasswordStrengthBar>
                </PasswordStrengthMeter>
              )}
              
              <HelperText>
                Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
              </HelperText>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInputContainer>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
                <TogglePasswordButton
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <ToggleIcon $iconType={showConfirmPassword ? "eye-off" : "eye"} $size={16} $active={true}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </ToggleIcon>
                </TogglePasswordButton>
              </PasswordInputContainer>
              {passwordErrors.confirmPassword && (
                <ErrorText>{passwordErrors.confirmPassword}</ErrorText>
              )}
            </FormGroup>

              <ActionButtons>
              <Button 
                variant="default" 
                onClick={handleSavePassword} 
                disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <ButtonIcon $iconType="save" $size={16} $active={true}>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block"></div>
                    </ButtonIcon>
                    Updating...
                  </>
                ) : (
                  <>
                    <ButtonIcon $iconType="save" $size={16} $active={true}>
                      <Save size={16} />
                    </ButtonIcon>
                    Update Password
                  </>
                )}
              </Button>
            </ActionButtons>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CardIcon $iconType="shield" $size={18} $active={true}>
                <Shield size={18} />
              </CardIcon>
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SwitchContainer>
              <div>
                <Label htmlFor="twoFactorEnabled">Two-Factor Authentication</Label>
                <HelperText>Add an extra layer of security to your account</HelperText>
                {loading2FAStatus ? (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>Loading...</div>
                ) : (
                  <StatusBadge $enabled={is2FAEnabled} style={{ marginTop: '0.5rem' }}>
                    {is2FAEnabled ? (
                      <>
                        <StatusIcon $iconType="check-circle" $size={12} $active={true}>
                          <CheckCircle size={12} />
                        </StatusIcon>
                        Enabled
                      </>
                    ) : (
                      <>
                        <StatusIcon $iconType="alert-circle" $size={12} $active={true}>
                          <AlertCircle size={12} />
                        </StatusIcon>
                        Disabled
                      </>
                    )}
                  </StatusBadge>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {is2FAEnabled ? (
                  <Button
                    variant="default"
                    onClick={() => setShow2FADisable(true)}
                    disabled={loading}
                    style={{ backgroundColor: '#ef4444', color: 'white' }}
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handle2FASetup}
                    disabled={loading || loading2FAStatus}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ButtonIcon $iconType="qr-code" $size={16} $active={true}>
                      <QrCode size={16} />
                    </ButtonIcon>
                    Enable 2FA
                  </Button>
                )}
              </div>
            </SwitchContainer>

            <Divider />
            
            <SwitchContainer>
              <div>
                <Label htmlFor="loginAlerts">Login Alerts</Label>
                <HelperText>Receive notifications for new login attempts</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="loginAlerts"
                  name="loginAlerts"
                  checked={securitySettings.loginAlerts}
                  onChange={handleSecuritySettingChange}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <Divider />
            
            <FormGroup>
              <Label htmlFor="requirePasswordChange">Password Expiry</Label>
              <select
                id="requirePasswordChange"
                name="requirePasswordChange"
                value={securitySettings.requirePasswordChange}
                onChange={handleSecuritySettingChange}
                style={{ 
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value={30}>Every 30 days</option>
                <option value={60}>Every 60 days</option>
                <option value={90}>Every 90 days</option>
                <option value={180}>Every 180 days</option>
                <option value={0}>Never</option>
              </select>
              <HelperText>How often you'll be required to change your password</HelperText>
            </FormGroup>

            <Divider />

            <SwitchContainer>
              <div>
                <Label htmlFor="allowMultipleSessions">Multiple Active Sessions</Label>
                <HelperText>Allow multiple devices to be logged in at the same time</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="allowMultipleSessions"
                  name="allowMultipleSessions"
                  checked={securitySettings.allowMultipleSessions}
                  onChange={handleSecuritySettingChange}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <Divider />
            
            <FormGroup>
              <SwitchContainer>
                <div>
                  <Label htmlFor="ipRestriction">IP Address Restriction</Label>
                  <HelperText>Restrict login attempts to known IP addresses</HelperText>
                  {loadingIPRestriction ? (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>Loading...</div>
                  ) : (
                    <StatusBadge $enabled={ipRestrictionEnabled} style={{ marginTop: '0.5rem' }}>
                      {ipRestrictionEnabled ? (
                        <>
                          <StatusIcon $iconType="check-circle" $size={12} $active={true}>
                            <CheckCircle size={12} />
                          </StatusIcon>
                          Enabled ({allowedIPs.length} IP{allowedIPs.length !== 1 ? 's' : ''})
                        </>
                      ) : (
                        <>
                          <StatusIcon $iconType="alert-circle" $size={12} $active={true}>
                            <AlertCircle size={12} />
                          </StatusIcon>
                          Disabled
                        </>
                      )}
                    </StatusBadge>
                  )}
                </div>
                <Switch>
                  <SwitchInput
                    type="checkbox"
                    id="ipRestriction"
                    name="ipRestriction"
                    checked={ipRestrictionEnabled}
                    onChange={(e) => handleIPRestrictionToggle(e.target.checked)}
                    disabled={loading || loadingIPRestriction}
                  />
                  <SwitchSlider />
                </Switch>
              </SwitchContainer>

              {ipRestrictionEnabled && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                  <Label>Allowed IP Addresses</Label>
                  <HelperText style={{ marginBottom: '0.75rem' }}>
                    Only these IP addresses will be allowed to log in. You can use CIDR notation (e.g., 192.168.1.0/24).
                  </HelperText>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Input
                      type="text"
                      placeholder="e.g., 192.168.1.100 or 192.168.1.0/24"
                      value={newIPAddress}
                      onChange={(e) => {
                        setNewIPAddress(e.target.value);
                        setIpError(null);
                      }}
                      disabled={loading}
                      style={{ flex: 1 }}
                    />
                    <Button
                      variant="default"
                      onClick={handleAddIP}
                      disabled={loading || !newIPAddress.trim()}
                    >
                      Add IP
                    </Button>
                  </div>
                  
                  {ipError && (
                    <ErrorText style={{ marginBottom: '0.75rem' }}>{ipError}</ErrorText>
                  )}

                  {allowedIPs.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                      No IP addresses added yet. Add at least one IP address to enable IP restriction.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {allowedIPs.map((ip, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.25rem'
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#111827' }}>
                            {ip}
                          </span>
                          <Button
                            variant="default"
                            onClick={() => handleRemoveIP(ip)}
                            disabled={loading}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </FormGroup>

            <ActionButtons>
              <Button 
                variant="default" 
                onClick={handleSaveSecuritySettings} 
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ButtonIcon $iconType="save" $size={16} $active={true}>
                  <Save size={16} />
                </ButtonIcon>
                Save Security Settings
              </Button>
            </ActionButtons>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CardIcon $iconType="alert-triangle" $size={18} $active={true}>
                <AlertTriangle size={18} />
              </CardIcon>
              Login Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HelperText>Recent login attempts to your account</HelperText>
            <VerificationHistoryContainer>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted-foreground)' }}>
                  Loading verification history...
                </div>
              ) : verificationHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted-foreground)' }}>
                  No verification history available
                </div>
              ) : (
                verificationHistory.map(entry => (
                  <VerificationHistoryItem key={entry.id}>
                    <VerificationHistoryDetails>
                      <VerificationHistoryDevice>{entry.device}</VerificationHistoryDevice>
                      <VerificationHistoryStatus $success={entry.success}>
                        {entry.success ? (
                          <>
                            <StatusIcon $iconType="check-circle" $size={12} $active={true}>
                              <CheckCircle size={12} />
                            </StatusIcon>
                            Success
                          </>
                        ) : (
                          <>
                            <StatusIcon $iconType="alert-circle" $size={12} $active={true}>
                              <AlertCircle size={12} />
                            </StatusIcon>
                            Failed
                          </>
                        )}
                      </VerificationHistoryStatus>
                    </VerificationHistoryDetails>
                    <VerificationHistoryMeta>
                      {entry.location} • {entry.ip} • {entry.date ? new Date(entry.date).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Unknown date'}
                    </VerificationHistoryMeta>
                  </VerificationHistoryItem>
                ))
              )}
            </VerificationHistoryContainer>
          </CardContent>
        </Card>

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <ModalOverlay onClick={() => !loading && setShow2FASetup(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Setup Two-Factor Authentication</ModalTitle>
                <CloseButton onClick={() => setShow2FASetup(false)} disabled={loading}>
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </CloseButton>
              </ModalHeader>

              {setupStep === 'qr' && (
                <>
                  <HelperText style={{ marginBottom: '1rem' }}>
                    Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy, Microsoft Authenticator)
                  </HelperText>
                  {qrCodeUrl && (
                    <QRCodeContainer>
                      <QRCodeImage src={qrCodeUrl} alt="2FA QR Code" />
                      {manualEntryKey && (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                          <strong>Or enter this key manually:</strong>
                          <div style={{ fontFamily: 'monospace', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                            {manualEntryKey}
                          </div>
                        </div>
                      )}
                    </QRCodeContainer>
                  )}
                  <HelperText style={{ marginBottom: '1rem' }}>
                    After scanning, enter the 6-digit code from your authenticator app to verify and enable 2FA.
                  </HelperText>
                  <FormGroup>
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <CodeInput
                      id="verificationCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      disabled={loading}
                    />
                  </FormGroup>
                  <ActionButtons>
                    <Button
                      variant="default"
                      onClick={() => setShow2FASetup(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      onClick={handle2FAVerify}
                      disabled={loading || verificationCode.length !== 6}
                    >
                      Verify & Enable
                    </Button>
                  </ActionButtons>
                </>
              )}
            </ModalContent>
          </ModalOverlay>
        )}

        {/* 2FA Disable Modal */}
        {show2FADisable && (
          <ModalOverlay onClick={() => !loading && setShow2FADisable(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Disable Two-Factor Authentication</ModalTitle>
                <CloseButton onClick={() => setShow2FADisable(false)} disabled={loading}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <HelperText style={{ marginBottom: '1rem' }}>
                To disable 2FA, please enter your current password for security verification.
              </HelperText>

              <FormGroup>
                <Label htmlFor="disablePassword">Current Password</Label>
                <PasswordInputContainer>
                  <Input
                    id="disablePassword"
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </PasswordInputContainer>
              </FormGroup>

              <ActionButtons>
                <Button
                  variant="default"
                  onClick={() => {
                    setShow2FADisable(false);
                    setDisablePassword('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handle2FADisable}
                  disabled={loading || !disablePassword}
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  Disable 2FA
                </Button>
              </ActionButtons>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
    </ComponentGate>
  );
} 