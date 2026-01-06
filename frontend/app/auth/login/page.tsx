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
  colors: {
    primary: '#4f46e5', // Indigo 600
    primaryHover: '#4338ca', // Indigo 700
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
    glow: '0 0 20px rgba(79, 70, 229, 0.3)',
  },
  transitions: {
    default: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Icon color function
const getIconColor = (iconType: string, active: boolean = true): string => {
  const activeColors: Record<string, string> = {
    eye: '#6366f1',      // Indigo 500
    eyeOff: '#6366f1',
    default: '#4f46e5',  // Indigo 600
  };

  const inactiveColors: Record<string, string> = {
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
  background-color: ${theme.colors.background};
  background-image: 
    radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.15) 0px, transparent 50%),
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

const LoginCard = styled.div`
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
    border-color: rgba(79, 70, 229, 0.3);
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
  transition: color ${theme.transitions.default};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const Subtitle = styled.h2`
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.normal};
  margin-bottom: ${theme.spacing.md};
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
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }

  &::placeholder {
    color: #475569;
  }

  &:disabled {
    opacity: 0.5;
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
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.sm};
  cursor: pointer;
  user-select: none;
  
  &:hover {
    color: ${theme.colors.text};
  }
`;

const SignInButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.md};
  background: ${theme.colors.primary};
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

  &:hover:not(:disabled) {
    background: ${theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.glow};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: ${theme.colors.surface};
    color: ${theme.colors.textSecondary};
    cursor: not-allowed;
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
  background: rgba(15, 23, 42, 0.6);
  display: ${props => props.$isLoading ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.lg};
  z-index: 10;
  backdrop-filter: blur(4px);
  transition: all ${theme.transitions.default};
`;

const LoadingText = styled.div`
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  margin-top: ${theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;
const ForgotPassword = styled.a`
  text-align: right;
  color: ${theme.colors.primary};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  text-decoration: none;
  transition: all ${theme.transitions.default};
  
  &:hover {
    color: ${theme.colors.primaryHover};
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: #f87171;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.xs};
  padding: ${theme.spacing.sm};
  background: rgba(239, 68, 68, 0.1);
  border-radius: ${theme.borderRadius.md};
  border: 1px solid rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
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
  background: ${theme.colors.surface};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.xl};
  max-width: 500px;
  width: 100%;
  border: 1px solid ${theme.colors.border};
  backdrop-filter: blur(16px);
`;

const NotFoundTitle = styled.h1`
  font-size: 80px;
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.sm};
  letter-spacing: -0.05em;
`;

const NotFoundSubtitle = styled.h2`
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSizes.xl};
  font-weight: ${theme.typography.fontWeights.semibold};
  margin-bottom: ${theme.spacing.md};
`;

const NotFoundMessage = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.md};
  margin-bottom: ${theme.spacing.xl};
  line-height: 1.6;
`;

const BackButton = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.semibold};
  cursor: pointer;
  transition: all ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.glow};
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
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRememberMe = localStorage.getItem('rememberMe');
      const savedIdentifier = localStorage.getItem('savedIdentifier');

      if (savedRememberMe === 'true' && savedIdentifier) {
        setRememberMe(true);
        setValue('identifier', savedIdentifier);
      }
    }
  }, [setValue]);

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
            <strong>users not found with this username or password.</strong>
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
      <LoginCard>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Title>
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