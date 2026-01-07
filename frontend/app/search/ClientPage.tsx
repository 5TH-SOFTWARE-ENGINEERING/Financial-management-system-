'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, FileText, DollarSign, Users, Building, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import styled from 'styled-components';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/lib/rbac/auth-context';
import Layout from '@/components/layout';
import { Input } from '@/components/ui/input';

// Type definitions
interface SearchResult {
  type: 'user' | 'revenue' | 'expense' | 'project' | 'department';
  data: unknown;
  title: string;
  subtitle?: string;
}

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_CARD = (props: any) => props.theme.colors.background || '#ffffff';
const BACKGROUND_SECONDARY = (props: any) => props.theme.colors.backgroundSecondary || '#f5f6fa';

const CardShadow = (props: any) => props.theme.mode === 'dark'
  ? '0 4px 16px rgba(0, 0, 0, 0.4)'
  : `0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(0, 0, 0, 0.02)`;

const CardShadowHover = (props: any) => props.theme.mode === 'dark'
  ? '0 12px 28px rgba(0, 0, 0, 0.5)'
  : `0 8px 12px -2px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.03)`;

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
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0 0 ${props => props.theme.spacing.xs};
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.md};
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.md};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
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
  gap: ${props => props.theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${BORDER_COLOR};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  
  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${props => props.theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }
  
  h3 {
    font-size: ${props => props.theme.typography.fontSizes.lg};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${props => props.theme.spacing.sm};
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ResultCard = styled(Link)`
  display: block;
  text-decoration: none;
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
  padding: ${props => props.theme.spacing.md};
  transition: all ${props => props.theme.transitions.default};
  
  &:hover {
    box-shadow: ${CardShadowHover};
    transform: translateY(-2px);
    background-color: ${BACKGROUND_SECONDARY};
  }
`;

const ResultCardContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
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
    font-size: ${props => props.theme.typography.fontSizes.md};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${props => props.theme.spacing.xs};
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0;
  }
`;

const TypeBadge = styled.span`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  border-radius: 9999px;
  background: ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'};
  color: ${props => props.theme.mode === 'dark' ? '#60a5fa' : '#1d4ed8'};
  text-transform: capitalize;
  flex-shrink: 0;
`;

const UnauthenticatedContainer = styled.div`
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const SearchInputWrapper = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  svg {
    position: absolute;
    left: ${props => props.theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    width: 20px;
    height: 20px;
    pointer-events: none;
    z-index: 1;
  }
`;

const SearchInput = styled(Input)`
  width: 100%;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} 48px;
  font-size: ${props => props.theme.typography.fontSizes.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  transition: all ${props => props.theme.transitions.default};
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
  
  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
  }
`;

type Subordinate = { id?: number | string; role?: string };

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user: storeUser } = useUserStore();
  const { user: authUser } = useAuth();
  const user = storeUser || authUser;
  const initialQuery = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessibleUserIds, setAccessibleUserIds] = useState<number[] | null>(null);
  const [isAccessibleUserIdsReady, setIsAccessibleUserIdsReady] = useState(false);

  // Initialize accessible user IDs based on role
  useEffect(() => {
    const initializeAccessibleUsers = async () => {
      if (!user) {
        setAccessibleUserIds(null);
        setIsAccessibleUserIdsReady(false);
        return;
      }

      const userRole = user?.role?.toLowerCase() || '';
      const isFinanceAdmin = userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager';
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';
      const isAccountant = userRole === 'accountant';
      const isEmployee = userRole === 'employee';

      if (isAdmin) {
        // Admin sees all - no filtering needed
        setAccessibleUserIds(null);
        setIsAccessibleUserIdsReady(true);
        return;
      }

      if (isFinanceAdmin && user?.id) {
        // Finance Admin/Manager: Get their own subordinates ONLY (accountants and employees)
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        try {
          const subordinatesRes = await apiClient.getSubordinates(userId);
          const subordinates = Array.isArray(subordinatesRes?.data) ? subordinatesRes.data : [];

          // Filter subordinates to ONLY include accountants and employees
          const validSubordinateIds = subordinates
            .map((sub: Subordinate) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
              const subRole = (sub.role || '').toLowerCase();

              if (typeof subId === 'number' &&
                (subRole === 'accountant' || subRole === 'employee')) {
                return subId;
              }
              return null;
            })
            .filter((id): id is number => id !== null);

          setAccessibleUserIds([userId, ...validSubordinateIds]);
          setIsAccessibleUserIdsReady(true);
        } catch (err) {
          console.error('Failed to fetch subordinates for Finance Admin:', err);
          setAccessibleUserIds([userId]);
          setIsAccessibleUserIdsReady(true);
        }
      } else if (isAccountant && user?.id) {
        // Accountant: See their own + employees' data (from their Finance Admin's team)
        const accountantId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
        const managerId = storeUser?.managerId
          ? (typeof storeUser.managerId === 'string' ? parseInt(storeUser.managerId, 10) : storeUser.managerId)
          : null;

        if (managerId) {
          try {
            const subordinatesRes = await apiClient.getSubordinates(managerId);
            const subordinates: Subordinate[] = Array.isArray(subordinatesRes?.data) ? subordinatesRes.data : [];

            const employeeIds = subordinates
              .map((sub) => {
                const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
                const subRole = (sub.role || '').toLowerCase() || '';
                if (!Number.isNaN(subId) && subRole === 'employee') {
                  return subId;
                }
                return undefined;
              })
              .filter((id): id is number => id !== undefined);

            setAccessibleUserIds([accountantId, ...employeeIds]);
            setIsAccessibleUserIdsReady(true);
          } catch (err) {
            console.warn('Failed to fetch Finance Admin subordinates for accountant:', err);
            setAccessibleUserIds([accountantId]);
            setIsAccessibleUserIdsReady(true);
          }
        } else {
          setAccessibleUserIds([accountantId]);
          setIsAccessibleUserIdsReady(true);
        }
      } else if (isEmployee && user?.id) {
        // Employee: See their own + Finance Admin's data (their manager)
        const employeeId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
        const managerId = storeUser?.managerId
          ? (typeof storeUser.managerId === 'string' ? parseInt(storeUser.managerId, 10) : storeUser.managerId)
          : null;

        if (managerId) {
          setAccessibleUserIds([employeeId, managerId]);
        } else {
          setAccessibleUserIds([employeeId]);
        }
        setIsAccessibleUserIdsReady(true);
      } else {
        // Other roles: only see own data
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        setAccessibleUserIds(userId ? [userId] : null);
        setIsAccessibleUserIdsReady(true);
      }
    };

    initializeAccessibleUsers();
  }, [user, storeUser]);

  // Update query from URL params on mount
  useEffect(() => {
    if (initialQuery && initialQuery !== searchInput) {
      setSearchInput(initialQuery);
      setQuery(initialQuery);
    }
  }, [initialQuery, searchInput]);

  // Create a stable search callback
  const performSearchAndUpdateURL = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery);
      // Update URL without causing a page reload
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    } else {
      setQuery('');
      setResults([]);
      setLoading(false);
      // Clear URL param
      router.replace('/search', { scroll: false });
    }
  }, [router]);

  // Debounced search timeout ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    // Wait for accessibleUserIds to be ready (unless admin)
    if (!isAccessibleUserIdsReady) {
      return;
    }

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

      const allResults: SearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Get current user info for filtering
      const currentUserId = user?.id ? (typeof user.id === 'string' ? parseInt(user.id, 10) : user.id) : null;
      const userRole = user?.role?.toLowerCase() || '';
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      // Helper function to check if a user ID is accessible
      const isAccessibleUserId = (userId: number | undefined | null): boolean => {
        if (userId === undefined || userId === null) {
          return false; // No user ID means not accessible for non-admin
        }
        if (isAdmin) {
          return true; // Admin sees all
        }
        if (accessibleUserIds === null) {
          return userId === currentUserId; // Fallback: only own data
        }
        return accessibleUserIds.includes(userId);
      };

      // Filter and add results - Users
      (users.data || []).forEach((userItem: unknown) => {
        const userData = userItem as { id: number; full_name?: string; name?: string; email?: string };
        // Only show users that are accessible
        if (!isAccessibleUserId(userData.id)) {
          return;
        }
        const name = userData.full_name || userData.name || userData.email || '';
        if (name.toLowerCase().includes(lowerQuery) || userData.email?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'user', data: userData, title: name, subtitle: userData.email });
        }
      });

      // Filter and add results - Revenues
      (revenues.data || []).forEach((revenue: unknown) => {
        const revenueData = revenue as { id: number; title?: string; description?: string; amount?: number; created_by_id?: number; user_id?: number };
        // Check if revenue is accessible (created_by_id or user_id)
        const revenueUserId = revenueData.created_by_id || revenueData.user_id;
        if (!isAccessibleUserId(revenueUserId)) {
          return;
        }
        if (revenueData.title?.toLowerCase().includes(lowerQuery) || revenueData.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'revenue', data: revenueData, title: revenueData.title || '', subtitle: `$${revenueData.amount || 0}` });
        }
      });

      // Filter and add results - Expenses
      (expenses.data || []).forEach((expense: unknown) => {
        const expenseData = expense as { id: number; title?: string; description?: string; amount?: number; created_by_id?: number; user_id?: number };
        // Check if expense is accessible (created_by_id or user_id)
        const expenseUserId = expenseData.created_by_id || expenseData.user_id;
        if (!isAccessibleUserId(expenseUserId)) {
          return;
        }
        if (expenseData.title?.toLowerCase().includes(lowerQuery) || expenseData.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'expense', data: expenseData, title: expenseData.title || '', subtitle: `$${expenseData.amount || 0}` });
        }
      });

      // Filter and add results - Projects
      (projects.data || []).forEach((project: unknown) => {
        const projectData = project as { id: number; name?: string; description?: string; department_name?: string; created_by_id?: number; user_id?: number };
        // Check if project is accessible (created_by_id or user_id)
        const projectUserId = projectData.created_by_id || projectData.user_id;
        if (!isAccessibleUserId(projectUserId)) {
          return;
        }
        if (projectData.name?.toLowerCase().includes(lowerQuery) || projectData.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'project', data: projectData, title: projectData.name || '', subtitle: projectData.department_name });
        }
      });

      // Departments are shared resources - all authenticated users can see all departments
      (departments.data || []).forEach((dept: unknown) => {
        const deptData = dept as { id: number; name?: string; description?: string };
        if (deptData.name?.toLowerCase().includes(lowerQuery) || deptData.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'department', data: deptData, title: deptData.name || '', subtitle: deptData.description });
        }
      });

      setResults(allResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, accessibleUserIds, isAccessibleUserIdsReady]);

  // Trigger search when query changes
  useEffect(() => {
    if (query && isAuthenticated && isAccessibleUserIdsReady) {
      performSearch(query);
    } else if (!query) {
      setResults([]);
      setLoading(false);
    }
  }, [query, isAuthenticated, performSearch, isAccessibleUserIdsReady]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      setLoading(true);
      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        performSearchAndUpdateURL(value.trim());
      }, 500);
    } else {
      setQuery('');
      setResults([]);
      setLoading(false);
      router.replace('/search', { scroll: false });
    }
  }, [performSearchAndUpdateURL, router]);

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
        return `/revenue/${id}`;
      case 'expense':
        return `/expenses/${id}`;
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
              Search
            </h1>
            <p>
              {query ? `Results for "${query}"` : 'Search across users, revenue, expenses, projects, and departments'}
            </p>
          </HeaderContainer>

          <SearchInputWrapper>
            <SearchInputContainer>
              <Search />
              <SearchInput
                type="text"
                placeholder="Type to search..."
                value={searchInput}
                onChange={handleInputChange}
                autoFocus
              />
            </SearchInputContainer>
          </SearchInputWrapper>

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
              {results.map((result, index) => {
                const data = result.data as { id: number | string };
                return (
                  <ResultCard
                    key={`${result.type}-${data.id}-${index}`}
                    href={getResultLink(result.type, Number(data.id))}
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
                );
              })}
            </ResultsContainer>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}

