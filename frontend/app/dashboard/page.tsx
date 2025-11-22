'use client';
import React from 'react';
import styled from 'styled-components';
import { useAuth } from '@/lib/rbac/auth-context';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import {
  Users, DollarSign, TrendingUp, FileText, Shield, Calendar,
  CreditCard, Activity, Briefcase, UserCheck,
  ClipboardList, BarChart3, Wallet
} from 'lucide-react';
import Layout from '@/components/layout';

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

const getIconColor = (IconComponent) => {
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
const RoleBadge = styled.span`
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

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
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

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          {renderWelcomeHeader()}
        </HeaderContainer>

        <ContentContainer>
          <ComponentGate componentId={ComponentId.DASHBOARD}>
            <SectionTitle>System Overview</SectionTitle>
            <DashboardGrid>
              {createStatsCard(Users, 'Total Users', '1,248')}
              {createStatsCard(DollarSign, 'Total Revenue', '$1.2M')}
              {createStatsCard(FileText, 'Active Transactions', '843')}
              {createStatsCard(TrendingUp, 'Growth Rate', '15%')}
            </DashboardGrid>
          </ComponentGate>
          <ComponentGate componentId={ComponentId.FINANCE_MANAGER_DASHBOARD}>
            <SectionTitle>Department Performance</SectionTitle>
            <DashboardGrid>
              {createStatsCard(DollarSign, 'Department Revenue', '$450K')}
              {createStatsCard(Activity, 'Expense Ratio', '42%')}
              {createStatsCard(ClipboardList, 'Pending Approvals', '12')}
              {createStatsCard(BarChart3, 'Quarterly Targets', '85%')}
            </DashboardGrid>
          </ComponentGate>
          <ComponentGate componentId={ComponentId.ACCOUNTANT_DASHBOARD}>
            <SectionTitle>Financial Records</SectionTitle>
            <DashboardGrid>
              {createStatsCard(CreditCard, 'Outstanding Invoices', '37')}
              {createStatsCard(FileText, 'Pending Audits', '5')}
              {createStatsCard(Wallet, 'Current Balance', '$250K')}
              {createStatsCard(Shield, 'Compliance Score', '98%')}
            </DashboardGrid>
          </ComponentGate>
          <ComponentGate componentId={ComponentId.EMPLOYEE_DASHBOARD}>
            <SectionTitle>Personal Finance Overview</SectionTitle>
            <DashboardGrid>
              {createStatsCard(Wallet, 'Personal Balance', '$5,200')}
              {createStatsCard(DollarSign, 'Monthly Expenses', '$1,800')}
              {createStatsCard(ClipboardList, 'Pending Requests', '3')}
              {createStatsCard(TrendingUp, 'Savings Goal', '75%')}
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
                <tr>
                  <td>2023-11-10</td>
                  <td>Salary Deposit</td>
                  <AmountCell $isPositive={true}>+$2,500</AmountCell>
                  <td><Badge $type="success">Completed</Badge></td>
                </tr>

                <tr>
                  <td>2023-11-09</td>
                  <td>Utility Bill Payment</td>
                  <AmountCell $isPositive={false}>-$150</AmountCell>
                  <td><Badge $type="success">Completed</Badge></td>
                </tr>

                <tr>
                  <td>2023-11-08</td>
                  <td>Grocery Purchase</td>
                  <AmountCell $isPositive={false}>-$89</AmountCell>
                  <td><Badge $type="warning">Pending</Badge></td>
                </tr>

                <tr>
                  <td>2023-11-07</td>
                  <td>Client Invoice</td>
                  <AmountCell $isPositive={true}>+$1,200</AmountCell>
                  <td><Badge $type="danger">Overdue</Badge></td>
                </tr>
              </tbody>
            </Table>
          </TableContainer>

        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default AdminDashboard;