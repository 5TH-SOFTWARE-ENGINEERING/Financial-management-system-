'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, FileText, DollarSign, Users, Building, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import styled from 'styled-components';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
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
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }

  svg {
    width: 32px;
    height: 32px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: ${theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xxl};
  text-align: center;
  
  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${theme.spacing.sm};
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ResultCard = styled(Link)`
  display: block;
  text-decoration: none;
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.md};
  transition: all ${theme.transitions.default};
  
  &:hover {
    box-shadow: ${CardShadowHover};
    transform: translateY(-2px);
    background-color: ${theme.colors.backgroundSecondary};
  }
`;

const ResultCardContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const IconWrapper = styled.div<{ $type: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$type) {
      case 'revenue':
        return 'rgba(34, 197, 94, 0.12)';
      case 'expense':
        return 'rgba(239, 68, 68, 0.12)';
      default:
        return 'rgba(0, 170, 0, 0.12)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => {
      switch (props.$type) {
        case 'revenue':
          return '#15803d';
        case 'expense':
          return '#dc2626';
        default:
          return PRIMARY_COLOR;
      }
    }};
  }
`;

const ResultInfo = styled.div`
  flex: 1;
  
  h3 {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${theme.spacing.xs};
  }
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0;
  }
`;

const TypeBadge = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  text-transform: capitalize;
  flex-shrink: 0;
`;

const UnauthenticatedContainer = styled.div`
  padding: ${theme.spacing.xl};
  text-align: center;
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query && isAuthenticated) {
      performSearch(query);
    }
  }, [query, isAuthenticated]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Search across multiple resources
      const [users, revenues, expenses, projects, departments] = await Promise.all([
        apiClient.getUsers().catch(() => ({ data: [] })),
        apiClient.getRevenues().catch(() => ({ data: [] })),
        apiClient.getExpenses().catch(() => ({ data: [] })),
        apiClient.getProjects().catch(() => ({ data: [] })),
        apiClient.getDepartments().catch(() => ({ data: [] })),
      ]);

      const allResults: any[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Filter and add results
      (users.data || []).forEach((user: any) => {
        const name = user.full_name || user.name || user.email || '';
        if (name.toLowerCase().includes(lowerQuery) || user.email?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'user', data: user, title: name, subtitle: user.email });
        }
      });

      (revenues.data || []).forEach((revenue: any) => {
        if (revenue.title?.toLowerCase().includes(lowerQuery) || revenue.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'revenue', data: revenue, title: revenue.title, subtitle: `$${revenue.amount}` });
        }
      });

      (expenses.data || []).forEach((expense: any) => {
        if (expense.title?.toLowerCase().includes(lowerQuery) || expense.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'expense', data: expense, title: expense.title, subtitle: `$${expense.amount}` });
        }
      });

      (projects.data || []).forEach((project: any) => {
        if (project.name?.toLowerCase().includes(lowerQuery) || project.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'project', data: project, title: project.name, subtitle: project.department_name });
        }
      });

      (departments.data || []).forEach((dept: any) => {
        if (dept.name?.toLowerCase().includes(lowerQuery) || dept.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'department', data: dept, title: dept.name, subtitle: dept.description });
        }
      });

      setResults(allResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users />;
      case 'revenue':
        return <DollarSign />;
      case 'expense':
        return <DollarSign />;
      case 'project':
        return <FolderKanban />;
      case 'department':
        return <Building />;
      default:
        return <FileText />;
    }
  };

  const getResultLink = (type: string, id: number) => {
    switch (type) {
      case 'user':
        return `/users/${id}`;
      case 'revenue':
        return `/revenue/edit/${id}`;
      case 'expense':
        return `/expenses/edit/${id}`;
      case 'project':
        return `/project/edit/${id}`;
      case 'department':
        return `/department/edit/${id}`;
      default:
        return '#';
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <UnauthenticatedContainer>
              <p>Please log in to search</p>
            </UnauthenticatedContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <h1>
              <Search />
              Search Results
            </h1>
            <p>
              {query ? `Results for "${query}"` : 'Enter a search query'}
            </p>
          </HeaderContainer>

          {loading ? (
            <LoadingContainer>
              <Spinner />
              <p>Searching...</p>
            </LoadingContainer>
          ) : results.length === 0 ? (
            <EmptyState>
              <Search />
              <h3>No results found</h3>
              <p>
                {query ? `No results found for "${query}"` : 'Enter a search query to get started'}
              </p>
            </EmptyState>
          ) : (
            <ResultsContainer>
              {results.map((result, index) => (
                <ResultCard
                  key={`${result.type}-${result.data.id}-${index}`}
                  href={getResultLink(result.type, result.data.id)}
                >
                  <ResultCardContent>
                    <IconWrapper $type={result.type}>
                      {getResultIcon(result.type)}
                    </IconWrapper>
                    <ResultInfo>
                      <h3>{result.title}</h3>
                      {result.subtitle && (
                        <p>{result.subtitle}</p>
                      )}
                    </ResultInfo>
                    <TypeBadge>
                      {result.type}
                    </TypeBadge>
                  </ResultCardContent>
                </ResultCard>
              ))}
            </ResultsContainer>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}

