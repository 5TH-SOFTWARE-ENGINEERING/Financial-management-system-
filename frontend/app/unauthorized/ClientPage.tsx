'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, ArrowLeft, Home, AlertCircle, LogIn } from 'lucide-react';
import styled from 'styled-components';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const WARNING_COLOR = '#f59e0b';
const WARNING_BG = '#fef3c7';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - 100px);
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CenteredContent = styled.div`
  max-width: 700px;
  width: 100%;
  text-align: center;
`;

const IconContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${WARNING_BG};
  margin-bottom: ${theme.spacing.lg};
  
  svg {
    width: 40px;
    height: 40px;
    color: ${WARNING_COLOR};
  }
`;

const Title = styled.h1`
  font-size: clamp(28px, 4vw, 42px);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.md};
`;

const Subtitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.xl};
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.lg};
    margin: 0;
  }
`;

const InfoCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  text-align: left;
`;

const InfoSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.sm};
`;

const SectionText = styled.p`
  font-size: ${theme.typography.fontSizes.md};
  color: ${TEXT_COLOR_MUTED};
  line-height: 1.6;
  margin: 0;
`;

const Divider = styled.div`
  height: 1px;
  background: ${theme.colors.border};
  margin: ${theme.spacing.lg} 0;
`;

const UserInfo = styled.div`
  margin-top: ${theme.spacing.md};
`;

const UserLabel = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin: 0 0 ${theme.spacing.sm};
`;

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const UserName = styled.span`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
`;

const RoleBadge = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  text-transform: capitalize;
`;

const List = styled.ul`
  list-style: disc;
  list-style-position: inside;
  margin: 0;
  padding: 0;
  
  li {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    line-height: 1.8;
    margin-bottom: ${theme.spacing.xs};
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  justify-content: center;
  align-items: center;
  
  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'outline' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  border-radius: ${theme.borderRadius.md};
  border: ${props => {
    if (props.$variant === 'outline') return `1px solid ${theme.colors.border}`;
    if (props.$variant === 'secondary') return `1px solid ${theme.colors.border}`;
    return 'none';
  }};
  background: ${props => {
    if (props.$variant === 'primary') return PRIMARY_COLOR;
    if (props.$variant === 'secondary') return theme.colors.backgroundSecondary;
    return 'transparent';
  }};
  color: ${props => {
    if (props.$variant === 'primary') return '#ffffff';
    return TEXT_COLOR_DARK;
  }};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  text-decoration: none;
  min-width: 160px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$variant === 'primary' ? `0 4px 12px rgba(0, 170, 0, 0.3)` : CardShadowHover};
    background: ${props => {
      if (props.$variant === 'primary') return '#008800';
      if (props.$variant === 'secondary') return theme.colors.backgroundSecondary;
      return theme.colors.backgroundSecondary;
    }};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const FooterText = styled.div`
  margin-top: ${theme.spacing.xl};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  
  p {
    margin: 0;
    line-height: 1.6;
  }
`;

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <CenteredContent>
            <IconContainer>
              <ShieldOff />
            </IconContainer>
            <Title>Access Denied</Title>
            <Subtitle>
              <AlertCircle />
              <p>You do not have permission to access this page.</p>
            </Subtitle>

            <InfoCard>
              <InfoSection>
                <SectionTitle>What happened?</SectionTitle>
                <SectionText>
                  You tried to access a page or resource that requires specific permissions. 
                  Your current role may not have the necessary access rights.
                </SectionText>
              </InfoSection>

              {user && (
                <>
                  <Divider />
                  <UserInfo>
                    <UserLabel>Current User:</UserLabel>
                    <UserDetails>
                      <UserName>{user.name || user.email || 'Unknown User'}</UserName>
                      <RoleBadge>{user.role || 'User'}</RoleBadge>
                    </UserDetails>
                  </UserInfo>
                </>
              )}

              <Divider />
              <InfoSection>
                <SectionTitle>What can you do?</SectionTitle>
                <List>
                  <li>Contact your administrator to request access</li>
                  <li>Verify that you&apos;re logged in with the correct account</li>
                  <li>Return to the dashboard and navigate to accessible pages</li>
                </List>
              </InfoSection>
            </InfoCard>

            <ButtonGroup>
              <ActionButton $variant="outline" onClick={handleGoBack}>
                <ArrowLeft />
                Go Back
              </ActionButton>
              <ActionButton $variant="primary" onClick={handleGoHome}>
                <Home />
                Go to Dashboard
              </ActionButton>
              {!isAuthenticated && (
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <ActionButton $variant="secondary">
                    <LogIn />
                    Go to Login
                  </ActionButton>
                </Link>
              )}
            </ButtonGroup>

            {isAuthenticated && (
              <FooterText>
                <p>
                  If you believe this is an error, please contact your system administrator 
                  or submit a support request.
                </p>
              </FooterText>
            )}
          </CenteredContent>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
