'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, ArrowLeft, Home, AlertCircle, LogIn } from 'lucide-react';
import styled from 'styled-components';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import Layout from '@/components/layout';
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - 100px);
  background: ${props => props.theme.colors.background};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
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
  background: ${props => `color-mix(in srgb, ${props.theme.colors.warning}, transparent 90%)`};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  svg {
    width: 40px;
    height: 40px;
    color: ${props => props.theme.colors.warning};
  }
`;

const Title = styled.h1`
  font-size: clamp(28px, 4vw, 42px);
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md};
`;

const Subtitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.mutedForeground};
  margin-bottom: ${props => props.theme.spacing.xl};
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.lg};
    margin: 0;
  }
`;

const InfoCard = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.md};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: left;
`;

const InfoSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm};
`;

const SectionText = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.md};
  color: ${props => props.theme.colors.mutedForeground};
  line-height: 1.6;
  margin: 0;
`;

const Divider = styled.div`
  height: 1px;
  background: ${props => props.theme.colors.border};
  margin: ${props => props.theme.spacing.lg} 0;
`;

const UserInfo = styled.div`
  margin-top: ${props => props.theme.spacing.md};
`;

const UserLabel = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${props => props.theme.colors.mutedForeground};
  margin: 0 0 ${props => props.theme.spacing.sm};
`;

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const UserName = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.text};
`;

const RoleBadge = styled.span`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  border-radius: 9999px;
  background: ${props => `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)`};
  color: ${props => props.theme.colors.primary};
  text-transform: capitalize;
`;

const List = styled.ul`
  list-style: disc;
  list-style-position: inside;
  margin: 0;
  padding: 0;
  
  li {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${props => props.theme.colors.mutedForeground};
    line-height: 1.8;
    margin-bottom: ${props => props.theme.spacing.xs};
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
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
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  border-radius: ${props => props.theme.borderRadius.md};
  border: ${props => {
    if (props.$variant === 'outline') return `1px solid ${props.theme.colors.border}`;
    if (props.$variant === 'secondary') return `1px solid ${props.theme.colors.border}`;
    return 'none';
  }};
  background: ${props => {
    if (props.$variant === 'primary') return props.theme.colors.primary;
    if (props.$variant === 'secondary') return props.theme.colors.backgroundSecondary;
    return 'transparent';
  }};
  color: ${props => {
    if (props.$variant === 'primary') return props.theme.colors.primaryForeground;
    return props.theme.colors.text;
  }};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};
  text-decoration: none;
  min-width: 160px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    background: ${props => {
    if (props.$variant === 'primary') return `color-mix(in srgb, ${props.theme.colors.primary}, black 10%)`;
    if (props.$variant === 'secondary') return props.theme.colors.backgroundSecondary;
    return props.theme.colors.backgroundSecondary;
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
  margin-top: ${props => props.theme.spacing.xl};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${props => props.theme.colors.mutedForeground};
  
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
