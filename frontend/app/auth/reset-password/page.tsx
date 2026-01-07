// app/auth/reset-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/rbac';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ResetPasswordRequestSchema,
  ResetPasswordOTPSchema,
  ResetPasswordNewSchema,
} from '@/lib/validation';
import apiClient from '@/lib/api';
import { theme as globalTheme } from '@/components/common/theme';

const theme = {
  colors: {
    primary: globalTheme.colors.primary || '#00AA00', // Green 600
    primaryHover: '#008800', // Green 700
    accent: '#10b981', // Emerald 500
    background: '#0f172a', // Slate 900
    surface: '#1e293b', // Slate 800
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.1)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    md: '10px',
    lg: '16px',
    xl: '24px',
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontSizes: {
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '28px',
      xxl: '36px',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(0, 170, 0, 0.3)', // Green glow
  },
  transitions: {
    default: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Icon color function
const getIconColor = (iconType: string, active: boolean = true): string => {
  const activeColors: Record<string, string> = {
    arrowLeft: '#10b981',      // Emerald 500
    mail: '#10b981',           // Emerald 500
    lock: '#10b981',
    checkCircle: '#10b981',
    eye: '#10b981',
    eyeOff: '#10b981',
    default: '#00AA00',        // Green 600
  };

  const inactiveColors: Record<string, string> = {
    arrowLeft: '#64748b',
    mail: '#64748b',
    lock: '#64748b',
    checkCircle: '#64748b',
    eye: '#64748b',
    eyeOff: '#64748b',
    default: '#64748b',
  };

  if (active) {
    return activeColors[iconType] || activeColors.default;
  } else {
    return inactiveColors[iconType] || inactiveColors.default;
  }
};

// Icon styled components
const IconWrapper = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active !== false) : '#94a3b8'};
  opacity: ${props => props.$active !== false ? 1 : 0.7};
  transition: all ${theme.transitions.default};
  
  svg {
    width: ${props => props.$size ? `${props.$size}px` : '20px'};
    height: ${props => props.$size ? `${props.$size}px` : '20px'};
    stroke-width: 2;
    transition: all ${theme.transitions.default};
  }

  &:hover {
    opacity: 1;
    transform: scale(1.15);
  }
`;

const LinkIcon = styled(IconWrapper)`
  margin-right: ${theme.spacing.xs};
`;

const PasswordIcon = styled(IconWrapper)`
  cursor: pointer;
`;

const PasswordContainer = styled.div`
  position: relative;
  width: 100%;
`;

const EyeIconButton = styled.button`
  position: absolute;
  top: 50%;
  right: ${theme.spacing.sm};
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: ${theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.md};
  transition: all ${theme.transitions.default};

  &:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  &:focus {
    outline: none;
    background: rgba(16, 185, 129, 0.15);
  }
`;

const SuccessIcon = styled(IconWrapper)`
  margin-right: ${theme.spacing.sm};
  vertical-align: middle;
`;

const ResetContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: ${theme.typography.fontFamily};
  position: relative;
  overflow: hidden;
  background-color: ${theme.colors.background};
  background-image: 
    radial-gradient(at 0% 0%, rgba(0, 170, 0, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.02;
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

const ResetCard = styled.div`
  background: rgba(30, 41, 59, 0.7);
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.xl};
  width: 100%;
  max-width: 440px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  transition: all ${theme.transitions.default};

  &:hover {
    border-color: rgba(0, 170, 0, 0.3);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
`;

const Title = styled.h1`
  text-align: center;
  font-size: ${theme.typography.fontSizes.xl};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.text};
  margin-bottom: ${theme.spacing.xs};
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.normal};
  margin-bottom: ${theme.spacing.md};
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  background-color: rgba(15, 23, 42, 0.4);
  color: ${theme.colors.text};
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    background-color: rgba(15, 23, 42, 0.6);
    box-shadow: 0 0 0 4px rgba(0, 170, 0, 0.1);
  }

  &::placeholder {
    color: #475569;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResetButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.md};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.semibold};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  position: relative;
  min-height: 48px;
  box-shadow: 0 4px 15px rgba(0, 170, 0, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #008800 0%, #059669 100%);
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 170, 0, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: ${theme.colors.surface};
    color: ${theme.colors.textSecondary};
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  text-decoration: none;
  margin-bottom: ${theme.spacing.md};
  transition: all ${theme.transitions.default};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};

  &:hover {
    color: ${theme.colors.text};
    background: rgba(148, 163, 184, 0.1);
    transform: translateX(-2px);
  }
`;

const SuccessMessage = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: ${theme.colors.accent};
  text-align: left;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  color: #f87171;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.xs};
  padding: ${theme.spacing.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ResendContainer = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.md};
  
  p {
    color: #b3b3b3;
    font-size: ${theme.typography.fontSizes.sm};
    margin-bottom: ${theme.spacing.sm};
  }
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  cursor: pointer;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.semibold};
  text-decoration: none;
  transition: all ${theme.transitions.default};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};

  &:hover:not(:disabled) {
    color: ${theme.colors.primaryHover};
    background: rgba(0, 170, 0, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const TimerText = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.sm};
  margin: 0;
  font-weight: ${theme.typography.fontWeights.medium};
`;

export default function ResetPassword() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'otp' | 'new-password'>('request');
  const [email, setEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [canResendOTP, setCanResendOTP] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [requires2FA, setRequires2FA] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Separate forms for each step
  const requestForm = useForm<{ email: string }>({
    resolver: zodResolver(ResetPasswordRequestSchema),
  });

  const otpForm = useForm<{ otp: string }>({
    resolver: zodResolver(ResetPasswordOTPSchema),
  });

  const passwordForm = useForm<{ newPassword: string; confirmPassword: string; totp_code?: string }>({
    resolver: zodResolver(ResetPasswordNewSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleRequestOTP = async (data: { email: string }) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Request OTP for password reset
      const response = await apiClient.requestOTP(data.email);

      // Check if we got a valid response
      if (response && (response.data || response.message)) {
        setEmail(data.email);
        setIsSuccess(true);
        setStep('otp');
        setCanResendOTP(false);
        setResendTimer(60); // 60 seconds cooldown

        // Start countdown timer
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResendOTP(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        const message = response.data?.message || response.message || 'OTP sent to your email!';
        toast.success(message);
        requestForm.reset();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.detail) ||
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.message) ||
        (err as { message?: string }).message ||
        'Failed to send OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email || !canResendOTP) return;

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.requestOTP(email);
      setCanResendOTP(false);
      setResendTimer(60); // Reset timer

      // Start countdown timer
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResendOTP(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast.success('OTP resent to your email!');
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string } } }).response?.data?.detail) ||
        (err as { message?: string }).message ||
        'Failed to resend OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: { otp: string }) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Store the OTP code - verification will happen in the reset-password step
      // This allows the user to proceed to enter their new password
      setOtpCode(data.otp);
      setIsSuccess(true);
      setStep('new-password');
      toast.success('Please enter your new password.');
      otpForm.reset();
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string } } }).response?.data?.detail) ||
        (err as { message?: string }).message ||
        'Failed to proceed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: { newPassword: string; confirmPassword: string; totp_code?: string }) => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      toast.error('Please enter a valid 6-digit OTP code');
      setStep('otp');
      return;
    }

    if (!email) {
      setError('Email is required');
      toast.error('Email is required');
      setStep('request');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Reset password with email, OTP, and new password
      // The backend will verify the OTP during this step

      // If 2FA is required, include the code
      const totp = requires2FA ? data.totp_code : undefined;

      const response = await apiClient.resetPassword(email, otpCode, data.newPassword, totp);

      // Handle different response structures
      const successMessage = response?.data?.message || response?.message || 'Password reset successful! You can now login.';
      toast.success(successMessage);

      // Clear state
      setEmail('');
      setOtpCode('');
      setRequires2FA(false);
      passwordForm.reset();

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: unknown) {
      const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : {};
      const errorResponse = errObj.response as {
        status?: number;
        data?: { detail?: unknown; error?: unknown; message?: unknown };
        headers?: Record<string, string>;
      } | undefined;
      const errorStatus = errorResponse?.status;
      const errorHeaders = errorResponse?.headers;

      // Check for 2FA requirement (403 Forbidden with specific header or message)
      const has2FAHeader = errorHeaders && (
        errorHeaders['x-requires-2fa'] === 'true' ||
        errorHeaders['X-Requires-2FA'] === 'true'
      );

      const errorDetail = (errorResponse?.data?.detail as string) || (errorResponse?.data?.message as string) || '';
      const errorDetailLower = String(errorDetail).toLowerCase();

      const is2FARequired = errorStatus === 403 && (
        has2FAHeader ||
        errorDetailLower.includes('two-factor') ||
        errorDetailLower.includes('2fa') ||
        errorDetailLower.includes('authentication required')
      );

      if (is2FARequired) {
        setRequires2FA(true);
        const msg = 'Two-factor authentication required. Please enter your 6-digit code from your authenticator app.';
        setError(msg);
        toast.info(msg);
        setIsLoading(false);
        return;
      }

      const errorMessage =
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.detail) ||
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.message) ||
        (err as { message?: string }).message ||
        'Failed to reset password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);

      // If OTP is invalid or expired, go back to OTP step
      if (errorMessage.toLowerCase().includes('otp') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('expired')) {
        setOtpCode('');
        setStep('otp');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp' || step === 'new-password') {
      setStep(step === 'otp' ? 'request' : 'otp');
      setError(null);
      setIsSuccess(false);
      setRequires2FA(false); // Reset 2FA state on back
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <ResetContainer>
      <ResetCard>
        <BackLink href="/auth/login" onClick={goBack}>
          <LinkIcon $iconType="arrowLeft" $active={true} $size={16}>
            <ArrowLeft />
          </LinkIcon>
          Back to Login
        </BackLink>

        <Title>Reset Password</Title>

        {step === 'request' && (
          <>
            <Subtitle>Enter your email to receive an OTP code.</Subtitle>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <form onSubmit={requestForm.handleSubmit(handleRequestOTP)}>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  {...requestForm.register('email')}
                  type="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {requestForm.formState.errors.email && (
                  <ErrorMessage>{requestForm.formState.errors.email.message}</ErrorMessage>
                )}
              </FormGroup>
              <ResetButton type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </ResetButton>
            </form>
            {isSuccess && (
              <SuccessMessage>
                <SuccessIcon $iconType="checkCircle" $active={true} $size={18}>
                  <CheckCircle />
                </SuccessIcon>
                <span>OTP sent! Please check your email.</span>
              </SuccessMessage>
            )}
          </>
        )}

        {step === 'otp' && (
          <>
            <Subtitle>Enter the OTP sent to {email}</Subtitle>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)}>
              <FormGroup>
                <Label>OTP Code</Label>
                <Input
                  {...otpForm.register('otp')}
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  disabled={isLoading}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {otpForm.formState.errors.otp && (
                  <ErrorMessage>{otpForm.formState.errors.otp.message}</ErrorMessage>
                )}
              </FormGroup>
              <ResetButton type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </ResetButton>
            </form>
            <ResendContainer>
              <p>Didn&apos;t receive the OTP?</p>
              {canResendOTP ? (
                <ResendButton
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                >
                  Resend OTP
                </ResendButton>
              ) : (
                <TimerText>
                  Resend OTP in {resendTimer}s
                </TimerText>
              )}
            </ResendContainer>
            {isSuccess && (
              <SuccessMessage>
                <SuccessIcon $iconType="checkCircle" $active={true} $size={18}>
                  <CheckCircle />
                </SuccessIcon>
                <span>Please enter your new password.</span>
              </SuccessMessage>
            )}
          </>
        )}

        {step === 'new-password' && (
          <>
            <Subtitle>Enter your new password.</Subtitle>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <form onSubmit={passwordForm.handleSubmit(handleResetPassword)}>
              <FormGroup>
                <Label>New Password</Label>
                <PasswordContainer>
                  <Input
                    {...passwordForm.register('newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 8 characters)"
                    disabled={isLoading}
                  />
                  <EyeIconButton
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    <PasswordIcon $iconType={showNewPassword ? 'eyeOff' : 'eye'} $active={true} $size={20}>
                      {showNewPassword ? <EyeOff /> : <Eye />}
                    </PasswordIcon>
                  </EyeIconButton>
                </PasswordContainer>
                {passwordForm.formState.errors.newPassword && (
                  <ErrorMessage>{passwordForm.formState.errors.newPassword.message}</ErrorMessage>
                )}
              </FormGroup>
              <FormGroup>
                <Label>Confirm New Password</Label>
                <PasswordContainer>
                  <Input
                    {...passwordForm.register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                  <EyeIconButton
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <PasswordIcon $iconType={showConfirmPassword ? 'eyeOff' : 'eye'} $active={true} $size={20}>
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </PasswordIcon>
                  </EyeIconButton>
                </PasswordContainer>
                {passwordForm.formState.errors.confirmPassword && (
                  <ErrorMessage>{passwordForm.formState.errors.confirmPassword.message}</ErrorMessage>
                )}
              </FormGroup>

              {/* Added 2FA Field */}
              {requires2FA && (
                <FormGroup>
                  <Label>2FA Authenticator Code</Label>
                  <Input
                    {...passwordForm.register('totp_code')}
                    type="text"
                    placeholder="Enter 6-digit code from authenticator app"
                    disabled={isLoading}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoFocus
                  />
                  {passwordForm.formState.errors.totp_code && (
                    <ErrorMessage>{passwordForm.formState.errors.totp_code.message}</ErrorMessage>
                  )}
                </FormGroup>
              )}

              <ResetButton type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Reset Password'}
              </ResetButton>
            </form>
          </>
        )}
      </ResetCard>
    </ResetContainer>
  );
}