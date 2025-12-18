// app/auth/login/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/rbac';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';
import { LoginSchema, type LoginInput } from '@/lib/validation';
import useUserStore from '@/store/userStore';

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
  font-family: ${theme.typography.fontFamily};
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #239f94 0%, #2c7a8c 50%, #1e5f6f 100%);

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      #239f94 0deg,
      #2c7a8c 60deg,
      #1e5f6f 120deg,
      #239f94 180deg,
      #2c7a8c 240deg,
      #1e5f6f 300deg,
      #239f94 360deg
    );
    animation: spiralRotate 20s linear infinite;
    opacity: 0.8;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 180deg,
      #1e5f6f 0deg,
      #239f94 60deg,
      #2c7a8c 120deg,
      #1e5f6f 180deg,
      #239f94 240deg,
      #2c7a8c 300deg,
      #1e5f6f 360deg
    );
    animation: spiralRotateReverse 25s linear infinite;
    opacity: 0.6;
  }

  @keyframes spiralRotate {
    0% {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(180deg) scale(1.2);
    }
    100% {
      transform: rotate(360deg) scale(1);
    }
  }

  @keyframes spiralRotateReverse {
    0% {
      transform: rotate(360deg) scale(1.1);
    }
    50% {
      transform: rotate(180deg) scale(0.9);
    }
    100% {
      transform: rotate(0deg) scale(1.1);
    }
  }

  > * {
    position: relative;
    z-index: 1;
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  position: relative;
  min-height: 44px;

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

const SpinningLoader = styled.div`
  display: inline-flex;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingOverlay = styled.div<{ $isLoading: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isLoading ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.lg};
  z-index: 10;
  backdrop-filter: blur(2px);
`;

const LoadingText = styled.div`
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.md};
  margin-top: ${theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
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
const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: ${theme.typography.fontFamily};
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #239f94 0%, #2c7a8c 50%, #1e5f6f 100%);
  padding: ${theme.spacing.xl};
  text-align: center;
`;

const NotFoundCard = styled.div`
  background: rgb(84, 81, 81);
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.lg};
  max-width: 600px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const NotFoundTitle = styled.h1`
  font-size: 72px;
  font-weight: ${theme.typography.fontWeights.semibold};
  background: linear-gradient(90deg, #ff7e5f, #feb47b);
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: ${theme.spacing.md};
  text-shadow: 
    0 0 10px rgba(255, 126, 95, 0.8),
    0 0 20px rgba(255, 126, 95, 0.6);
`;

const NotFoundSubtitle = styled.h2`
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.xl};
  font-weight: ${theme.typography.fontWeights.medium};
  margin-bottom: ${theme.spacing.lg};
`;

const NotFoundMessage = styled.p`
  color: #b3b3b3;
  font-size: ${theme.typography.fontSizes.md};
  margin-bottom: ${theme.spacing.xl};
  line-height: 1.6;
`;

const BackButton = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, #feb47b 100%);
  color: rgb(255, 255, 255);
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  box-shadow: 0 2px 8px rgba(255, 126, 95, 0.3);

  &:hover {
    background: linear-gradient(135deg, #feb47b 0%, ${theme.colors.primary} 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 126, 95, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function Login() {
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasExplicitLogin, setHasExplicitLogin] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRememberMe = localStorage.getItem('rememberMe');
      const savedIdentifier = localStorage.getItem('savedIdentifier');
      
      if (savedRememberMe === 'true' && savedIdentifier) {
        setRememberMe(true);
      }
    }
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Only redirect if user explicitly logged in on this page
  // Don't redirect for automatic authentication (token restoration)
  useEffect(() => {
    if (hydrated && isAuthenticated && !authLoading && !isLoading && !userNotFound && hasExplicitLogin) {
      router.push('/dashboard');
    }
  }, [hydrated, isAuthenticated, authLoading, isLoading, userNotFound, hasExplicitLogin, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setUserNotFound(false);
    setErrorMessage(null);
    setHasExplicitLogin(true); // Mark that user explicitly attempted login
    
    try {
      const loginSuccess = await login(data.identifier, data.password);
      
      if (loginSuccess === true) {
        setHasExplicitLogin(true); // Ensure flag is set on successful login
        if (rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedIdentifier', data.identifier);
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedIdentifier');
        }
        const storeState = useUserStore.getState();
        if (storeState.isAuthenticated && storeState.user) {
          toast.success('Login successful! You are now logged in.');
          router.push('/dashboard');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        const retryState = useUserStore.getState();
        if (retryState.isAuthenticated && retryState.user) {
          toast.success('Login successful! You are now logged in.');
          router.push('/dashboard');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        const finalState = useUserStore.getState();
        if (finalState.isAuthenticated && finalState.user) {
          toast.success('Login successful! You are now logged in.');
          router.push('/dashboard');
          return;
        }
        setErrorMessage('Login verification failed. Please try again.');
        toast.error('Login verification failed. Please try again.');
        setIsLoading(false);
        return;
      }
      toast.error('Incorrect username or password', {
        duration: 4000,
      });
      setUserNotFound(true);
      setIsLoading(false);
      return;
      
    } catch (error: unknown) {
      const errObj = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
      const errorResponse = errObj.response as { status?: number; data?: { detail?: unknown; error?: unknown } } | undefined;
      const errorStatus = errorResponse?.status;
      const errorData = errorResponse?.data;
      const errorDetail = (errorData?.detail as unknown) || (errorData?.error as unknown) || (errObj.message as unknown) || '';
      const errorCode = errObj.code as string | undefined;
      const errorMessage = String((errObj.message as string | undefined) || '').toLowerCase();
      const errorDetailLower = String(errorDetail).toLowerCase();
      const isNetworkError = !errorResponse || 
                            errorCode === 'ECONNREFUSED' ||
                            errorCode === 'ERR_NETWORK' ||
                            errorCode === 'ECONNABORTED' ||
                            errorCode === 'ETIMEDOUT' ||
                            errorMessage.includes('network error') ||
                            errorMessage.includes('failed to fetch') ||
                            errorMessage.includes('timeout');
      
      const statusCode = typeof errorStatus === 'number' ? errorStatus : null;
      const isServerError = statusCode !== null && statusCode >= 500 && statusCode < 600;
      
      const isAuthError = statusCode === 401 || 
                         statusCode === 403 || 
                         statusCode === 404 ||
                         errorDetailLower.includes('incorrect username') ||
                         errorDetailLower.includes('incorrect password') ||
                         errorDetailLower.includes('invalid credentials') ||
                         errorDetailLower.includes('authentication failed') ||
                         errorDetailLower.includes('unauthorized') ||
                         errorDetailLower.includes('forbidden') ||
                         errorDetailLower.includes('user not found');
      
      const isRateLimitError = errorStatus === 429;
      
      const isAccountError = errorStatus === 400 && (
                             errorDetailLower.includes('inactive') ||
                             errorDetailLower.includes('locked') ||
                             errorDetailLower.includes('disabled')
                           );
      if (isNetworkError) {
        const msg = 'Unable to connect to the server. Please try again later.';
        setErrorMessage(msg);
        toast.error(msg);
        setIsLoading(false);
        return;
      }
      // Network connection error. Please check your internet connection and try again.
      if (isServerError) {
        const msg = 'Server error. Please try again in a few moments.';
        setErrorMessage(msg);
        toast.error(msg);
        setIsLoading(false);
        return;
      }
      
      if (isRateLimitError) {
        const msg = 'Too many login attempts. Please wait a few minutes before trying again.';
        setErrorMessage(msg);
        toast.error(msg);
        setIsLoading(false);
        return;
      }
      
      if (isAccountError) {
        const msg = errorDetailLower.includes('inactive')
          ? 'Your account is inactive. Please contact your administrator.'
          : 'Your account is locked. Please contact your administrator.';
        setErrorMessage(msg);
        toast.error(msg);
        setIsLoading(false);
        return;
      }
      
      if (isAuthError || errorStatus === 401 || errorStatus === 403 || errorStatus === 404) {
        toast.error('Incorrect username or password', {
          duration: 4000,
        });
        setUserNotFound(true);
        setIsLoading(false);
        return;
      }
      toast.error('Incorrect username or password', {
        duration: 4000,
      });
      setUserNotFound(true);
      setIsLoading(false);
      
    } finally {
      setIsLoading(false);
    }
  };
  if (userNotFound) {
    return (
      <NotFoundContainer>
        <NotFoundCard>
          <NotFoundTitle>404</NotFoundTitle>
          <NotFoundSubtitle>Login Failed</NotFoundSubtitle>
          <NotFoundMessage>
            <strong>Incorrect username or password.</strong>
            <br />
            <br />
            The credentials you entered do not match our records.
            <br />
            Please check your email/username and password, or contact your administrator if you need assistance.
          </NotFoundMessage>
          <BackButton 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUserNotFound(false);
              setErrorMessage(null);
            }}
          >
            Back to Login
          </BackButton>
        </NotFoundCard>
      </NotFoundContainer>
    );
  }
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)();
  };
  if (authLoading) {
    return (
      <LoginContainer>
        <LoginCard>
        <LoadingText>
          <SpinningLoader>
            <Loader2 size={24} />
          </SpinningLoader>
          Checking authentication...
        </LoadingText>
        </LoginCard>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <Toaster position="top-right" />
      <LoginCard>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Title className="cursor-pointer hover:text-blue-600 transition-colors duration-300">
            Login to Your Account
          </Title>
        </Link>
        <Subtitle>Welcome back! Please sign in below</Subtitle>
        {errorMessage && (
          <ErrorMessage>{errorMessage}</ErrorMessage>
        )}
        <LoadingOverlay $isLoading={isLoading}>
          <div style={{ textAlign: 'center' }}>
            <SpinningLoader>
              <Loader2 size={48} color="#ffffff" />
            </SpinningLoader>
            <LoadingText>Signing in...</LoadingText>
          </div>
        </LoadingOverlay>

        <form onSubmit={handleFormSubmit} noValidate method="post" action="#">
          <FormGroup>
            <Label htmlFor="identifier">Email or Username</Label>
            <Input
              {...register('identifier')}
              id="identifier"
              type="text"
              placeholder="Enter your Email or Username"
              disabled={isLoading}
              autoComplete="username email"
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
            />
            {errors.identifier && (
              <ErrorMessage id="identifier-error" role="alert">
                {errors.identifier.message}
              </ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <PasswordContainer>
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <EyeIconButton 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <PasswordIcon $iconType={showPassword ? 'eyeOff' : 'eye'} $active={true} $size={20}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </PasswordIcon>
              </EyeIconButton>
            </PasswordContainer>
            {errors.password && (
              <ErrorMessage id="password-error" role="alert">
                {errors.password.message}
              </ErrorMessage>
            )}
          </FormGroup>

          <CheckboxContainer>
            <CheckboxWrapper>
              <Checkbox
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <CheckboxLabel htmlFor="remember">Remember me</CheckboxLabel>
            </CheckboxWrapper>
            <ForgotPassword 
              href="/auth/reset-password"
              onClick={(e) => {
                e.preventDefault();
                if (!isLoading) {
                  router.push('/auth/reset-password');
                }
              }}
            >
              Forgot password?
            </ForgotPassword>
          </CheckboxContainer>

          <SignInButton 
            type="submit" 
            disabled={isLoading || authLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <SpinningLoader>
                  <Loader2 size={20} />
                </SpinningLoader>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </SignInButton>
        </form>
      </LoginCard>
    </LoginContainer>
  );
}