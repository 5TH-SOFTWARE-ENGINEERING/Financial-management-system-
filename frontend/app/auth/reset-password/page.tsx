// app/auth/reset-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/rbac';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';
import { ResetPasswordSchema, type ResetPasswordInput } from '@/lib/validation';

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

const ResetContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: rgb(82, 80, 80);
  font-family: ${theme.typography.fontFamily};
`;

const ResetCard = styled.div`
  background: rgb(43, 42, 42);
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
  padding: ${theme.spacing.sm};
  border: 1px solid #4a4a4a;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  background-color: #333333;
  color: #ffffff;
  transition: border-color ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &::placeholder {
    color: #b3b3b3;
  }
`;

const ResetButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.primary};
  color: #ffffff;
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: background-color ${theme.transitions.default};

  &:hover {
    background-color: #feb47b;
  }

  &:disabled {
    background-color: #4a4a4a;
    cursor: not-allowed;
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
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.5);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: #22c55e;
  text-align: center;
  font-size: ${theme.typography.fontSizes.sm};
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.xs};
  text-align: center;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.sm};
`;

export default function ResetPassword() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState<'request' | 'otp' | 'new-password'>('request');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      // Simulate API call for password reset request
      // In real app, call /api/v1/auth/reset-password
      console.log('Reset password request:', data);
      
      if (step === 'request') {
        toast.success('Password reset email sent! Check your inbox.');
        setStep('otp');
        reset();
        setIsSuccess(true);
      } else if (step === 'otp') {
        toast.success('OTP verified! Please enter new password.');
        setStep('new-password');
        reset();
      } else {
        toast.success('Password reset successful! You can now login.');
        router.push('/auth/login');
      }
    } catch (error) {
      toast.error('Reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp' || step === 'new-password') {
      setStep('request');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <ResetContainer>
      <Toaster position="top-right" />
      <ResetCard>
        <BackLink href="#" onClick={goBack}>
          <ArrowLeft size={16} />
          Back to Login
        </BackLink>
        
        <Title>Reset Password</Title>
        
        {step === 'request' && (
          <>
            <Subtitle>Enter your email to receive a reset link.</Subtitle>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
              </FormGroup>
              <ResetButton type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </ResetButton>
            </form>
          </>
        )}
        
        {step === 'otp' && (
          <>
            <Subtitle>Enter the OTP sent to your email.</Subtitle>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label>OTP Code</Label>
                <Input
                  {...register('otp')}
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  disabled={isLoading}
                />
                {errors.otp && <ErrorMessage>{errors.otp.message}</ErrorMessage>}
              </FormGroup>
              <ResetButton type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </ResetButton>
            </form>
            {isSuccess && (
              <SuccessMessage>
                <CheckCircle size={16} className="inline mr-2" />
                Check your email for the OTP code.
              </SuccessMessage>
            )}
          </>
        )}
        
        {step === 'new-password' && (
          <>
            <Subtitle>Enter your new password.</Subtitle>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label>New Password</Label>
                <Input
                  {...register('newPassword')}
                  type="password"
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
                {errors.newPassword && <ErrorMessage>{errors.newPassword.message}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Confirm New Password</Label>
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword.message}</ErrorMessage>}
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