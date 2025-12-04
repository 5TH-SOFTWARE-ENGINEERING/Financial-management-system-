// app/auth/login/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/rbac';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';
import { LoginSchema, type LoginInput } from '@/lib/validation';

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
    eye: '#3b82f6',      // Blue for show password
    eyeOff: '#8b5cf6',   // Purple for hide password
    default: '#ff7e5f',  // Primary color
  };

  const inactiveColors: Record<string, string> = {
    eye: '#6b7280',
    eyeOff: '#6b7280',
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
  color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active !== false) : '#d1d1d1'};
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

const PasswordIcon = styled(IconWrapper)`
  cursor: pointer;
`;
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: rgb(35, 161, 148);
  font-family: ${theme.typography.fontFamily};
`;
const LoginCard = styled.div`
  background: rgb(84, 81, 81);
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
const Subtitle = styled.h2`
  text-align: center;
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.md};
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
    background: rgba(255, 126, 95, 0.1);
  }

  &:focus {
    outline: none;
    background: rgba(255, 126, 95, 0.15);
  }
`;
const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;
const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;
const Checkbox = styled.input`
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: ${theme.colors.primary};
  
  &:checked {
    background-color: ${theme.colors.primary};
  }
`;
const CheckboxLabel = styled.label`
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.sm};
  cursor: pointer;
  user-select: none;
  
  &:hover {
    color: ${theme.colors.primary};
  }
`;
const SignInButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.md};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, #feb47b 100%);
  color: rgb(255, 255, 255);
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
const ForgotPassword = styled.a`
  text-align: right;
  color: rgb(155, 186, 32);
  font-size: ${theme.typography.fontSizes.sm};
  cursor: pointer;
  text-decoration: none;
  transition: all ${theme.transitions.default};
  
  &:hover {
    color: ${theme.colors.primary};
    text-decoration: underline;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;
const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: rgba(255, 77, 79, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-left: 3px solid #ff4d4f;
  text-align: left;
`;
export default function Login() {
  const { login, error: authError, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await login(data.identifier, data.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Toaster position="top-right" />
      <LoginCard>
      <Link href="/" className="no-underline">
       <Title className="cursor-pointer hover:text-blue-600 transition-colors duration-300">
       Login to Your Account
       </Title>
      </Link>
        <Subtitle>Welcome back! Please sign in below</Subtitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label>Email</Label>
            <Input
              {...register('identifier')}
              type="text"
              placeholder="Enter your Email or Username "
              disabled={isLoading}
            />
            {errors.identifier && <ErrorMessage>{errors.identifier.message}</ErrorMessage>}
          </FormGroup>
          <FormGroup>
            <Label>Password</Label>
            <PasswordContainer>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <EyeIconButton type="button" onClick={() => setShowPassword(!showPassword)}>
                <PasswordIcon $iconType={showPassword ? 'eyeOff' : 'eye'} $active={true} $size={20}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </PasswordIcon>
              </EyeIconButton>
            </PasswordContainer>
            {errors.password && (
              <ErrorMessage>{errors.password.message}</ErrorMessage>
            )}
          </FormGroup>

          <CheckboxContainer>
            <CheckboxWrapper>
              <Checkbox
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <CheckboxLabel htmlFor="remember">Remember me</CheckboxLabel>
            </CheckboxWrapper>
            <ForgotPassword onClick={() => router.push('/auth/reset-password')}>
              Forgot password?
            </ForgotPassword>
          </CheckboxContainer>

          <SignInButton type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </SignInButton>
        </form>
      </LoginCard>
    </LoginContainer>
  );
}