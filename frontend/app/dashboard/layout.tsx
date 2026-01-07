'use client';

import React from 'react';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 16%;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.backgroundSecondary};

`;

const ContentWrapper = styled.div`
  padding: 18px;
`;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <LayoutContainer>
      <MainContent>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
} 