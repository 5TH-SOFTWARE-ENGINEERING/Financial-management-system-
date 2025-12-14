//app/layout
'use client';

import { Inter } from 'next/font/google';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '@/components/common/theme';
import StyledComponentsRegistry from '@/lib/registry';
import { AuthProvider } from '@/lib/rbac/auth-context'; 
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  preload: false,
});

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  flex: 1;
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ThemeProvider theme={theme}>
            <AuthProvider> 
              <LayoutContainer>
                <MainContent>
                  <ContentWrapper>{children}</ContentWrapper>
                </MainContent>
              </LayoutContainer>
              <Toaster position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
