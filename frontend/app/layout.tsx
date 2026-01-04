//app/layout
'use client';

import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { theme } from '@/components/common/theme';
import StyledComponentsRegistry from '@/lib/registry';
import { AuthProvider } from '@/lib/rbac/auth-context';
import { Toaster } from '@/components/ui/sonner';

// Use system fonts instead of Google Fonts to avoid download warnings
// This provides better performance and no external dependencies
const GlobalStyle = createGlobalStyle`
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

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
      <body>
        <GlobalStyle />
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
