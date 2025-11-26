'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/lib/rbac/auth-context';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import {
  Users, DollarSign, TrendingUp, FileText, Shield, Calendar,
  CreditCard, Activity, Briefcase, UserCheck,
  ClipboardList, BarChart3, Wallet
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';

const PRIMARY_COLOR = '#4f46e5'; 
const PRIMARY_LIGHT = '#eef2ff'; 
const TEXT_COLOR_DARK = '#111827'; 
const TEXT_COLOR_MUTED = '#6b7280'; 
const BACKGROUND_GRADIENT = `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, #ffffff 100%)`;

const CardShadow = `
  0 4px 6px -1px rgba(0, 0, 0, 0.1),
  0 2px 4px -2px rgba(0, 0, 0, 0.1),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;
const CardShadowHover = `
  0 10px 15px -3px rgba(0, 0, 0, 0.1),
  0 4px 6px -4px rgba(0, 0, 0, 0.1),
  inset 0 0 0 1px rgba(0, 0, 0, 0.05)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 40px) 48px; /* Added bottom padding */
`;

const HeaderContainer = styled.div`
  background-color: ${PRIMARY_COLOR};
  color: #ffffff;
  padding: 48px clamp(16px, 4vw, 40px);
  margin-bottom: 32px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  /* The padding is handled by ContentContainer, so this is just for the background */
  margin-left: calc(-1 * clamp(16px, 4vw, 40px));
  margin-right: calc(-1 * clamp(16px, 4vw, 40px));
`;

const HeaderContent = styled.div`
  width: min(1280px, 100%);
  margin: 0 auto;
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: 800;
    margin-bottom: 4px;
  }
  
  p {
    font-size: clamp(16px, 1.8vw, 20px);
    font-weight: 400;
    opacity: 0.85;
  }
`;

const SectionTitle = styled.h2`
  font-size: clamp(20px, 2.2vw, 28px);
  margin: 48px 0 24px 0;
  color: ${TEXT_COLOR_DARK};
  font-weight: 700;
  border-bottom: 2px solid ${PRIMARY_LIGHT};
  padding-bottom: 8px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
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

const CardIcon = styled.div<{ $IconComponent: React.FC<any> }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => getIconColor(props.$IconComponent).bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => getIconColor(props.$IconComponent).color};
    stroke-width: 2.5; /* Slightly thicker icon stroke */
  }
`;

const StatsCard = styled.div<{ $IconComponent: React.FC<any> }>`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: ${CardShadow};
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background-color: ${props => getIconColor(props.$IconComponent).border};
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: ${CardShadowHover};
  }
`;

const CardTitle = styled.h3`
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: 4px;
  font-weight: 600;
`;

const CardValue = styled.div`
  font-size: 34px;
  font-weight: 800;
  color: ${TEXT_COLOR_DARK};
  line-height: 1.1;
`;

const TableContainer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: ${CardShadow};
  padding: 24px;
`;

const TableTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${TEXT_COLOR_DARK};
  margin-bottom: 24px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: 16px 20px;
    text-align: left;
  }
  
  th {
    font-weight: 600;
    color: #94a3b8; /* Gray-400 */
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-top: 0;
    border-bottom: 2px solid #f3f4f6;
  }
  
  tbody tr {
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #f9fafb;
    }
    
    &:last-child td {
      border-bottom: none;
    }
    
    td {
      border-bottom: 1px solid #e5e7eb;
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

// Within the '--- Layout & Structure ---' or similar section
const RoleBadge = styled.span<{ $role: string }>`
  display: inline-block;
  padding: 4px 12px;
  margin-left: 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  /* Dynamic colors for the badge */
  background-color: ${props => {
    const role = props.$role.toLowerCase();
    if (role.includes('admin')) return 'rgba(236, 72, 153, 0.15)'; // Pink
    if (role.includes('manager') || role.includes('finance')) return 'rgba(34, 197, 94, 0.15)'; // Green
    if (role.includes('accountant')) return 'rgba(59, 130, 246, 0.15)'; // Blue
    return 'rgba(251, 191, 36, 0.15)'; // Yellow/Default
  }};
  color: ${props => {
    const role = props.$role.toLowerCase();
    if (role.includes('admin')) return '#be185d';
    if (role.includes('manager') || role.includes('finance')) return '#15803d';
    if (role.includes('accountant')) return '#1d4ed8';
    return '#b45309';
  }};
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
  const { user } = useAuth();
  const [overview, setOverview] = useState<any | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
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
        setOverview(overviewRes.data);
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
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const totalRevenue = overview?.financials?.total_revenue ?? 0;
  const totalExpenses = overview?.financials?.total_expenses ?? 0;
  const netProfit = overview?.financials?.profit ?? (totalRevenue - totalExpenses);
  const pendingApprovals =
    overview?.pending_approvals ??
    overview?.team_stats?.pending_approvals ??
    overview?.personal_stats?.pending_approvals ??
    0;

  const renderWelcomeHeader = () => {
    if (!user) return <HeaderContent><h1>Dashboard</h1></HeaderContent>;
    
    return (
      <HeaderContent>
        <h1>Welcome, {user.username || 'Admin'} 👋</h1>
        <RoleBadge $role={user.role}>{user.role}</RoleBadge>
      </HeaderContent>
    );
  };

  const createStatsCard = (Icon: React.FC<any>, title: string, value: string) => (
    <StatsCard $IconComponent={Icon}>
      <CardIcon $IconComponent={Icon}><Icon /></CardIcon> 
      <CardTitle>{title}</CardTitle>
      <CardValue>{value}</CardValue>
    </StatsCard>
  );

  if (loading) {
    return (
      <Layout>
        <PageContainer className="items-center justify-center">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
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
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive mb-6">
              {error}
            </div>
          )}
          <ComponentGate componentId={ComponentId.DASHBOARD}>
            <SectionTitle>System Overview</SectionTitle>
            <DashboardGrid>
              {createStatsCard(DollarSign, 'Total Revenue', `$${totalRevenue.toLocaleString()}`)}
              {createStatsCard(CreditCard, 'Total Expenses', `$${totalExpenses.toLocaleString()}`)}
              {createStatsCard(TrendingUp, 'Net Profit', `$${netProfit.toLocaleString()}`)}
              {createStatsCard(ClipboardList, 'Pending Approvals', pendingApprovals.toString())}
            </DashboardGrid>
          </ComponentGate>
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