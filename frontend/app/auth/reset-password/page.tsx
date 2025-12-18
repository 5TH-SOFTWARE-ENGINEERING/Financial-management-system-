// app/auth/reset-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/rbac';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';
import { 
  ResetPasswordRequestSchema, 
  ResetPasswordOTPSchema,
  ResetPasswordNewSchema,
} from '@/lib/validation';
import apiClient from '@/lib/api';

const theme = {
  colors: { primary: '#ff7e5f' },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '28px',
  },
  borderRadius: {
    md: '8px',
    lg: '12px',
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    fontSizes: {
      sm: '14px',
      md: '16px',
      xl: '26px',
    },
    fontWeights: {
      medium: 500,
      semibold: 600,
    },
  },
  shadows: {
    lg: '0 4px 20px rgba(0,0,0,0.3)',
  },
  transitions: {
    default: '0.3s ease-in-out',
  },
};

// Icon color function
const getIconColor = (iconType: string, active: boolean = true): string => {
  const activeColors: Record<string, string> = {
    arrowLeft: '#3b82f6',      // Blue for back navigation
    mail: '#10b981',           // Green for email
    lock: '#8b5cf6',          // Purple for password/lock
    checkCircle: '#22c55e',    // Green for success
    default: '#ff7e5f',        // Primary color
  };

  const inactiveColors: Record<string, string> = {
    arrowLeft: '#6b7280',
    mail: '#6b7280',
    lock: '#6b7280',
    checkCircle: '#6b7280',
    default: '#9ca3af',
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
  color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active !== false) : '#ffffff'};
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

const SuccessIcon = styled(IconWrapper)`
  margin-right: ${theme.spacing.sm};
  vertical-align: middle;
`;

const ResetContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: rgb(44, 122, 140);
  font-family: ${theme.typography.fontFamily};
`;

const ResetCard = styled.div`
  background: rgb(68, 65, 65);
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.lg};
  width: 100%;
  max-width: 450px;
  max-height: 80vh;
  overflow-y: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all ${theme.transitions.default};

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
`;

const Title = styled.h1`
  text-align: center;
  font-size: ${theme.typography.fontSizes.xl};
  font-weight: ${theme.typography.fontWeights.semibold};
  background: linear-gradient(90deg, #ff7e5f, #feb47b);
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 
    0 0 5px rgba(255, 126, 95, 0.8),
    0 0 10px rgba(255, 126, 95, 0.6),
    0 0 15px rgba(255, 126, 95, 0.4);
  animation: pulse 2s infinite alternate;

  @keyframes pulse {
    0% {
      text-shadow: 
        0 0 5px rgba(255, 126, 95, 0.8),
        0 0 10px rgba(255, 126, 95, 0.6);
    }
    100% {
      text-shadow: 
        0 0 10px rgba(255, 126, 95, 1),
        0 0 20px rgba(255, 126, 95, 0.8);
    }
  }
`;

const Subtitle = styled.p`
  text-align: center;
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.md};
  margin-bottom: ${theme.spacing.md};
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.sm};
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing.md} ${theme.spacing.sm};
  border: 1px solid #4a4a4a;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  background-color: #333333;
  color: #ffffff;
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(255, 126, 95, 0.1);
  }

  &::placeholder {
    color: #b3b3b3;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResetButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.md};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, #feb47b 100%);
  color: #ffffff;
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  box-shadow: 0 2px 8px rgba(255, 126, 95, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #feb47b 0%, ${theme.colors.primary} 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 126, 95, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #4a4a4a;
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.6;
  }
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.sm};
  text-decoration: none;
  margin-bottom: ${theme.spacing.md};
  transition: all ${theme.transitions.default};
  padding: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.md};

  &:hover {
    color: ${theme.colors.primary};
    background: rgba(255, 126, 95, 0.1);
    transform: translateX(-4px);
  }

  &:active {
    transform: translateX(-2px);
  }
`;

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.5);
  border-left: 3px solid #22c55e;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: #22c55e;
  text-align: left;
  font-size: ${theme.typography.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.xs};
  text-align: left;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-left: 3px solid #ff4d4f;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
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
  text-decoration: underline;
  transition: all ${theme.transitions.default};
  padding: ${theme.spacing.xs};

  &:hover:not(:disabled) {
    color: #feb47b;
    transform: scale(1.05);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const TimerText = styled.p`
  color: #b3b3b3;
  font-size: ${theme.typography.fontSizes.sm};
  margin: 0;
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

  // Separate forms for each step
  const requestForm = useForm<{ email: string }>({
    resolver: zodResolver(ResetPasswordRequestSchema),
  });

  const otpForm = useForm<{ otp: string }>({
    resolver: zodResolver(ResetPasswordOTPSchema),
  });

  const passwordForm = useForm<{ newPassword: string; confirmPassword: string }>({
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

  const handleResetPassword = async (data: { newPassword: string; confirmPassword: string }) => {
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
      const response = await apiClient.resetPassword(email, otpCode, data.newPassword);
      
      // Handle different response structures
      const successMessage = response?.data?.message || response?.message || 'Password reset successful! You can now login.';
      toast.success(successMessage);
      
      // Clear state
      setEmail('');
      setOtpCode('');
      passwordForm.reset();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
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
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <ResetContainer>
      <Toaster position="top-right" />
      <ResetCard>
        <BackLink href="#" onClick={goBack}>
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
                <Input
                  {...passwordForm.register('newPassword')}
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  disabled={isLoading}
                />
                {passwordForm.formState.errors.newPassword && (
                  <ErrorMessage>{passwordForm.formState.errors.newPassword.message}</ErrorMessage>
                )}
              </FormGroup>
              <FormGroup>
                <Label>Confirm New Password</Label>
                <Input
                  {...passwordForm.register('confirmPassword')}
                  type="password"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <ErrorMessage>{passwordForm.formState.errors.confirmPassword.message}</ErrorMessage>
                )}
              </FormGroup>
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