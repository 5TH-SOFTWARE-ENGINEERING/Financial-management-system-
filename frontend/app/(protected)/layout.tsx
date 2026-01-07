'use client';

import React, { useEffect } from 'react';
import styled from 'styled-components';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import { useAuth } from '@/lib/rbac/auth-context';
import { useRouter } from 'next/navigation';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 250px; // Width of the sidebar
  min-height: 100vh;
  background-color: ${theme.colors.backgroundSecondary};
`;

const ContentWrapper = styled.div`
  margin-top: 48px; // Height of the header + some extra space
  padding: 24px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${theme.colors.backgroundSecondary};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #6b7280;
  font-size: 14px;
`;

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, user, refreshUser } = useAuth();
  const router = useRouter();
  
  // Fetch user data on mount if authenticated but user is null
  useEffect(() => {
    if (isAuthenticated && !isLoading && !user) {
      refreshUser().catch(() => {
        // If refresh fails, user might not be authenticated
        router.push('/auth/login');
      });
    }
  }, [isAuthenticated, isLoading, user, refreshUser, router]);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const shouldRedirect = !isLoading && !isAuthenticated;
  
  // While checking authentication status, show a proper loading state
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    );
  }
  
  // If not authenticated, don't render children yet (will redirect in useEffect)
  if (shouldRedirect) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Redirecting to login...</LoadingText>
      </LoadingContainer>
    );
  }
  
  // User is authenticated, render the protected layout
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Navbar />
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
}