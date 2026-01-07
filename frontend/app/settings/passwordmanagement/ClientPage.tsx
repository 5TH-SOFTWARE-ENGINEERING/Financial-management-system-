'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/rbac/auth-context';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Shield, Key, User, Search, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styled from 'styled-components';


const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundSecondary};
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CardTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  color: ${props => props.theme.colors.textSecondary};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 48px 10px 40px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.background};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    color: ${props => props.theme.colors.text};
    background-color: ${props => props.theme.colors.backgroundSecondary};
  }
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 0.5rem;
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  background-color: ${props => props.type === 'success'
    ? (props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.2)' : '#e7f3ff')
    : (props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#ffebe8')};
  color: ${props => props.type === 'success'
    ? (props.theme.mode === 'dark' ? '#86efac' : '#1877f2')
    : (props.theme.mode === 'dark' ? '#fca5a5' : '#f02849')};
  border: 1px solid ${props => props.type === 'success'
    ? (props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.5)' : '#1877f2')
    : (props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : '#f02849')};
`;

const ShieldIcon = styled(Shield)`
  color: ${props => props.theme.colors.primary};
`;

export default function ResetPasswordPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status) setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (formData.newPassword !== formData.confirmPassword) {
      const msg = 'New passwords do not match.';
      setStatus({ type: 'error', message: msg });
      toast.error(msg);
      return;
    }

    if (formData.newPassword.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setStatus({ type: 'error', message: msg });
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.adminResetPassword(
        formData.usernameOrEmail,
        formData.newPassword
      );

      setStatus({ type: 'success', message: response.message || 'Password reset successfully.' });
      toast.success(response.message || 'Password updated.');
      setFormData({ usernameOrEmail: '', newPassword: '', confirmPassword: '' });
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to reset password.';
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <Container>
        <Card>
          <CardHeader>
            <ShieldIcon size={24} />
            <CardTitle>Administrative Password Reset</CardTitle>
          </CardHeader>
          <CardContent>
            <HelperText style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              As an administrator, you can reset the password for any user in your organization or hierarchy.
            </HelperText>

            {status && (
              <StatusMessage type={status.type}>
                {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {status.message}
              </StatusMessage>
            )}

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="usernameOrEmail">User Identifier</Label>
                <InputWrapper>
                  <InputIcon><User size={18} /></InputIcon>
                  <Input
                    type="text"
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    placeholder="Enter email or username"
                    value={formData.usernameOrEmail}
                    onChange={handleChange}
                    required
                  />
                </InputWrapper>
                <HelperText>Email or username of the account you want to reset.</HelperText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="newPassword">New Password</Label>
                <InputWrapper>
                  <InputIcon><Key size={18} /></InputIcon>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </TogglePasswordButton>
                </InputWrapper>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <InputWrapper>
                  <InputIcon><Key size={18} /></InputIcon>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </TogglePasswordButton>
                </InputWrapper>
              </FormGroup>

              <Button
                type="submit"
                disabled={isLoading || !formData.usernameOrEmail || !formData.newPassword || !formData.confirmPassword}
                variant="default"
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  height: '44px',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Resetting...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={18} />
                    Reset Password
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </ComponentGate>
  );
}

