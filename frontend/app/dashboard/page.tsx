'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import {
  Users, DollarSign, TrendingUp, FileText, Shield, Calendar,
  CreditCard, Activity, Briefcase, UserCheck,
  ClipboardList, BarChart3, Wallet, ArrowRight, AlertCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = '#e8f5e9';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%)`;

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
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 97.5%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl} clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl});
  margin-bottom: ${theme.spacing.xl};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-left: calc(-1 * clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl}));
  margin-right: calc(-1 * clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl}));
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  width: min(1280px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    font-size: clamp(${theme.typography.fontSizes.md}, 1.8vw, ${theme.typography.fontSizes.lg});
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: clamp(20px, 2.2vw, 28px);
  margin: ${theme.spacing.xl} 0 ${theme.spacing.lg};
  color: ${TEXT_COLOR_DARK};
  font-weight: ${theme.typography.fontWeights.bold};
  border-bottom: 2px solid ${PRIMARY_LIGHT};
  padding-bottom: ${theme.spacing.sm};
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const getIconColor = (IconComponent: React.FC<any>) => {
  switch (IconComponent) {
    case Users:
    case TrendingUp:
      return { bg: 'rgba(34, 197, 94, 0.12)', color: '#15803d', border: '#10b981' }; // Green
    case DollarSign:
    case Wallet:
      return { bg: 'rgba(245, 158, 11, 0.12)', color: '#b45309', border: '#f59e0b' }; // Amber
    case FileText:
    case ClipboardList:
      return { bg: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', border: '#3b82f6' }; // Blue
    case Activity:
    case CreditCard:
    case Shield:
      return { bg: 'rgba(79, 70, 229, 0.12)', color: '#4338ca', border: '#6366f1' }; // Indigo
    default:
      return { bg: 'rgba(34, 197, 94, 0.12)', color: '#15803d', border: '#10b981' };
  }
};

const StatsCard = styled.div<{ $IconComponent: React.FC<any>; $clickable?: boolean }>`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: all ${theme.transitions.default};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => getIconColor(props.$IconComponent).border};
    border-top-left-radius: ${theme.borderRadius.md};
    border-bottom-left-radius: ${theme.borderRadius.md};
    transition: width ${theme.transitions.default};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${CardShadowHover};
    border-color: ${props => getIconColor(props.$IconComponent).border};
    
    ${props => props.$clickable && `
      &:before {
        width: 6px;
      }
      
      ${CardValue} {
        color: ${PRIMARY_COLOR};
      }
    `}
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const CardIcon = styled.div<{ $IconComponent: React.FC<any> }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.md};
  background: ${props => getIconColor(props.$IconComponent).bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.md};
  transition: transform ${theme.transitions.default};
  
  ${StatsCard}:hover & {
    transform: scale(1.05);
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => getIconColor(props.$IconComponent).color};
    stroke-width: 2.5;
  }
`;

const CardTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const CardValue = styled.div`
  font-size: clamp(28px, 3vw, 36px);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  line-height: 1.1;
  transition: color ${theme.transitions.default};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ClickableIndicator = styled(ArrowRight)`
  width: 18px;
  height: 18px;
  color: ${TEXT_COLOR_MUTED};
  opacity: 0;
  transition: all ${theme.transitions.default};
  
  ${StatsCard}:hover & {
    opacity: 1;
    transform: translateX(4px);
    color: ${PRIMARY_COLOR};
  }
`;

const TableContainer = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  overflow: hidden;
`;

const TableTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.lg};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    text-align: left;
  }
  
  th {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-top: 0;
    border-bottom: 2px solid ${theme.colors.border};
  }
  
  tbody tr {
    transition: background-color ${theme.transitions.default};
    
    &:hover {
      background-color: ${theme.colors.backgroundSecondary};
    }
    
    &:last-child td {
      border-bottom: none;
    }
    
    td {
      border-bottom: 1px solid ${theme.colors.border};
      font-size: ${theme.typography.fontSizes.sm};
    }
  }
`;

// Ensure text-color utility is applied for amounts
const AmountCell = styled.td<{ $isPositive: boolean }>`
  font-weight: 600;
  color: ${props => props.$isPositive ? '#059669' : '#ef4444'}; /* Emerald-600 or Red-500 */
`;

const Badge = styled.span<{ $type: 'success' | 'warning' | 'danger' | 'info' }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background-color: ${props => {
    switch(props.$type) {
      case 'success': return 'rgba(16, 185, 129, 0.12)'; // Emerald-500
      case 'warning': return 'rgba(251, 191, 36, 0.16)'; // Amber-400
      case 'danger': return 'rgba(239, 68, 68, 0.18)'; // Red-500
      case 'info': return 'rgba(99, 102, 241, 0.15)'; // Indigo-400
      default: return 'rgba(16, 185, 129, 0.12)';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'success': return '#065f46'; // Emerald-800
      case 'warning': return '#b45309'; // Amber-800
      case 'danger': return '#991b1b'; // Red-800
      case 'info': return '#3730a3'; // Indigo-800
      default: return '#065f46';
    }
  }};
`;

const RoleBadge = styled.span<{ $role: string }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  margin-left: ${theme.spacing.md};
  border-radius: 999px;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  
  /* Dynamic colors for the badge */
  background-color: ${props => {
    const role = props.$role.toLowerCase();
    if (role.includes('admin')) return 'rgba(255, 255, 255, 0.2)';
    if (role.includes('manager') || role.includes('finance')) return 'rgba(255, 255, 255, 0.15)';
    if (role.includes('accountant')) return 'rgba(255, 255, 255, 0.15)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${props => {
    return '#ffffff';
  }};
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  
  svg {
    flex-shrink: 0;
  }
`;

const EmptyState = styled.div`
  padding: ${theme.spacing.xl};
  text-align: center;
  color: ${TEXT_COLOR_MUTED};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.backgroundSecondary};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
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

/* --------------------------------------------------------------- */

interface ActivityItem {
  id: string;
  type: string;
  title?: string;
  amount?: number;
  date?: string;
  status?: string;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [overview, setOverview] = useState<any | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOverview(null);
      setRecentActivity([]);
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, activityRes] = await Promise.all([
          apiClient.getDashboardOverview(),
          apiClient.getDashboardRecentActivity(8),
        ]);
        // Ensure overview data is properly set
        const overviewData = overviewRes.data || {};
        setOverview(overviewData);
        
        // Fetch all pending approvals in real-time (workflows, revenue, expenses)
        let totalPendingCount = 0;
        try {
          // Fetch pending approval workflows
          const workflowsRes = await apiClient.getApprovals();
          if (workflowsRes?.data && Array.isArray(workflowsRes.data)) {
            const pendingWorkflows = workflowsRes.data.filter((w: any) => 
              (w.status?.toLowerCase() === 'pending' || w.status === 'pending')
            );
            totalPendingCount += pendingWorkflows.length;
          }

          // Fetch pending revenue entries
          const revenuesRes = await apiClient.getRevenues({ is_approved: false });
          if (revenuesRes?.data && Array.isArray(revenuesRes.data)) {
            const pendingRevenues = revenuesRes.data.filter((r: any) => !r.is_approved);
            totalPendingCount += pendingRevenues.length;
          }

          // Fetch pending expense entries
          const expensesRes = await apiClient.getExpenses({ is_approved: false });
          if (expensesRes?.data && Array.isArray(expensesRes.data)) {
            const pendingExpenses = expensesRes.data.filter((e: any) => !e.is_approved);
            totalPendingCount += pendingExpenses.length;
          }
        } catch (err) {
          // Fallback to overview count if direct fetching fails
          const overviewCount = overviewData.pending_approvals ?? 
                               overviewData.team_stats?.pending_approvals ?? 
                               overviewData.personal_stats?.pending_approvals;
          if (overviewCount !== undefined && overviewCount !== null) {
            totalPendingCount = Number(overviewCount) || 0;
          }
        }
        
        setPendingApprovalsCount(Math.max(0, totalPendingCount));
        
        // Log for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('Dashboard Overview Data:', {
            overview: overviewData,
            financials: overviewData.financials,
            total_revenue: overviewData.financials?.total_revenue,
            total_expenses: overviewData.financials?.total_expenses,
            profit: overviewData.financials?.profit,
            pending_approvals_count: totalPendingCount,
          });
        }
        
        const activity = (activityRes.data || []).map((entry: any, index: number): ActivityItem => ({
          id: entry.id?.toString() ?? `activity-${index}`,
          type: entry.type ?? 'activity',
          title: entry.title ?? entry.type,
          amount: entry.amount !== undefined ? Number(entry.amount) : undefined,
          date: entry.date ?? entry.created_at,
          status: entry.status ?? (entry.is_approved ? 'approved' : 'pending'),
        }));
        setRecentActivity(activity);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to load dashboard data';
        setError(errorMessage);
        // Set default values on error so UI still renders
        setOverview({
          financials: {
            total_revenue: 0,
            total_expenses: 0,
            profit: 0,
            profit_margin: 0,
          },
          pending_approvals: 0,
        });
        setPendingApprovalsCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  // Extract financial data with proper type conversion (handles Decimal from backend)
  // Always ensure we have valid numbers, defaulting to 0 if data is missing
  const totalRevenue = (overview?.financials?.total_revenue !== undefined && overview?.financials?.total_revenue !== null)
    ? Number(overview.financials.total_revenue) 
    : 0;
  const totalExpenses = (overview?.financials?.total_expenses !== undefined && overview?.financials?.total_expenses !== null)
    ? Number(overview.financials.total_expenses) 
    : 0;
  const netProfit = (overview?.financials?.profit !== undefined && overview?.financials?.profit !== null)
    ? Number(overview.financials.profit)
    : (totalRevenue - totalExpenses);
  
  // Use the pending approvals count from state (fetched from multiple sources)
  const pendingApprovals = pendingApprovalsCount;

  const renderWelcomeHeader = () => {
    if (!user) return <HeaderContent><h1>Dashboard</h1></HeaderContent>;
    
    return (
      <HeaderContent>
        <h1>Welcome, {user.username || 'Admin'} </h1>
        <RoleBadge $role={user.role}>{user.role}</RoleBadge>
      </HeaderContent>
    );
  };

  const handlePendingApprovalsClick = () => {
    if (pendingApprovals > 0) {
      router.push('/approvals?status=pending');
    } else {
      router.push('/approvals');
    }
  };

  const createStatsCard = (
    Icon: React.FC<any>, 
    title: string, 
    value: string, 
    clickable: boolean = false,
    onClick?: () => void
  ) => (
    <StatsCard 
      $IconComponent={Icon} 
      $clickable={clickable}
      onClick={onClick}
    >
      <CardIcon $IconComponent={Icon}><Icon /></CardIcon> 
      <CardTitle>{title}</CardTitle>
      <CardValue>
        {value}
        {clickable && <ClickableIndicator />}
      </CardValue>
    </StatsCard>
  );


  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner />
            <p>Loading dashboard...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          {renderWelcomeHeader()}
        </HeaderContainer>

        <ContentContainer>
          {error && (
            <ErrorBanner>
              <AlertCircle size={20} />
              <span>{error}</span>
            </ErrorBanner>
          )}
          <SectionTitle>System Overview</SectionTitle>
          {overview ? (
            <DashboardGrid>
              {createStatsCard(
                DollarSign, 
                'Total Revenue', 
                `$${Number(totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
              {createStatsCard(
                CreditCard, 
                'Total Expenses', 
                `$${Number(totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
              {createStatsCard(
                TrendingUp, 
                'Net Profit', 
                `$${Number(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
              {createStatsCard(
                ClipboardList, 
                'Pending Approvals', 
                pendingApprovals.toString(),
                true,
                handlePendingApprovalsClick
              )}
            </DashboardGrid>
          ) : (
            <EmptyState>
              <p>No overview data available. Please ensure you have revenue and expense entries.</p>
            </EmptyState>
          )}
          <SectionTitle>Recent Transactions</SectionTitle>
          <TableContainer>
            <TableTitle>Latest Activity</TableTitle>
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No recent activity recorded.
                    </td>
                  </tr>
                )}
                {recentActivity.map((item) => {
                  const isPositive = item.type === 'revenue';
                  const amount = Number(item.amount || 0);
                  const statusType =
                    item.status === 'approved'
                      ? 'success'
                      : item.status === 'pending'
                      ? 'warning'
                      : item.status === 'rejected'
                      ? 'danger'
                      : 'info';

                  return (
                    <tr key={`${item.type}-${item.id}-${item.date}`}>
                      <td>{item.date ? new Date(item.date).toLocaleDateString() : '—'}</td>
                      <td>{item.title || item.type}</td>
                      <AmountCell $isPositive={isPositive}>
                        {isPositive ? '+' : '-'}${Math.abs(amount).toLocaleString()}
                      </AmountCell>
                      <td>
                        <Badge $type={statusType as 'success' | 'warning' | 'danger' | 'info'}>
                          {(item.status || 'pending').toString().toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>

        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default AdminDashboard;