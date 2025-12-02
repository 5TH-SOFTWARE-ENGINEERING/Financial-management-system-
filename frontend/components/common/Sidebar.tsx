// components/common/sidebar.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import {
    Home, ArrowDownCircle, ArrowUpCircle, Receipt, PieChart, Building, Briefcase, Users,
    UserCog, Settings, ChevronDown, Menu, Wallet, Shield, UserPlus, List, Calculator,
    DollarSign, Plus, FileText, TrendingUp, GitCompare, BarChart3,
} from 'lucide-react';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuthorization } from '@/lib/rbac/use-authorization';
import { useAuth } from '@/lib/rbac/auth-context';
import { UserType } from '@/lib/rbac/models';
import { theme } from './theme'; 

interface SidebarContainerProps {
    $collapsed: boolean;
}

const SidebarContainer = styled.div<SidebarContainerProps>`
    width: ${props => (props.$collapsed ? '70px' : '230px')};
    height: 100vh;
    background: ${theme.colors.background};
    border-right: 1px solid ${theme.colors.border};
    padding: ${theme.spacing.sm} 0;
    position: fixed;
    left: 0;
    top: 0;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 50;
    transition: width ${theme.transitions.default};
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;

    /* Custom scrollbar styling */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: ${theme.colors.border};
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: ${theme.colors.textSecondary};
    }
`;

const CollapseButton = styled.button`
    position: absolute;
    top: ${theme.spacing.md};
    right: ${theme.spacing.md};
    background: transparent;
    border: none;
    color: ${theme.colors.textSecondary};
    cursor: pointer;
    padding: ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }

    svg {
        width: 20px;
        height: 20px;
    }
`;

const Logo = styled.div<{ $collapsed: boolean }>`
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: ${props => (props.$collapsed ? 'center' : 'flex-start')}; 
    padding: 0 ${props => (props.$collapsed ? theme.spacing.sm : theme.spacing.lg)};
    margin-bottom: ${theme.spacing.sm};
    font-size: ${theme.typography.fontSizes.xxl};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${theme.colors.primary};
    transition: padding ${theme.transitions.default};
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: ${props => (props.$collapsed ? theme.spacing.sm : theme.spacing.lg)};
        right: ${props => (props.$collapsed ? theme.spacing.sm : theme.spacing.lg)};
        height: 1px;
        background: ${theme.colors.border};
        opacity: 0.5;
    }
`;

const SectionTitle = styled.h3<{$collapsed: boolean}>`
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: ${theme.colors.textSecondary};
    padding: ${theme.spacing.md} ${theme.spacing.xl};
    margin: ${theme.spacing.xl} 0 ${theme.spacing.md};
    opacity: ${props => (props.$collapsed ? 0 : 1)};
    pointer-events: none;
    transition: opacity ${theme.transitions.default};
    font-weight: ${theme.typography.fontWeights.medium};
`;

const NavItem = styled(Link)<{ $active?: boolean; $collapsed?: boolean }>`
    display: flex;
    align-items: center;
    padding: ${theme.spacing.md} ${props => (props.$collapsed ? theme.spacing.lg : theme.spacing.xl)};
    color: ${props => (props.$active ? theme.colors.primary : theme.colors.textSecondary)};
    text-decoration: none;
    border-left: 3px solid ${props => (props.$active ? theme.colors.primary : 'transparent')};
    transition: all ${theme.transitions.default};
    justify-content: ${props => (props.$collapsed ? 'center' : 'flex-start')};
    position: relative;
    margin: 2px ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.sm};
    font-weight: ${props => (props.$active ? theme.typography.fontWeights.medium : 400)};

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
        transform: translateX(${props => (props.$collapsed ? '0' : '4px')});
    }

    ${props => props.$active && `
        background: ${theme.colors.backgroundSecondary};
        font-weight: ${theme.typography.fontWeights.medium};
    `}

    svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-right: ${props => (props.$collapsed ? 0 : theme.spacing.md)};
        transition: all ${theme.transitions.default};
    }
`;

const DropdownHeader = styled.div<{ $open?: boolean; $collapsed?: boolean; $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: ${props => (props.$collapsed ? 'center' : 'space-between')}; 
    padding: ${theme.spacing.md} ${props => (props.$collapsed ? theme.spacing.lg : theme.spacing.xl)};
    color: ${props => (props.$active ? theme.colors.primary : theme.colors.textSecondary)};
    cursor: pointer;
    border-left: 3px solid ${props => (props.$active ? theme.colors.primary : 'transparent')};
    transition: all ${theme.transitions.default};
    position: relative;
    margin: 2px ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.sm};
    font-weight: ${props => (props.$active ? theme.typography.fontWeights.medium : 400)};

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
        transform: translateX(${props => (props.$collapsed ? '0' : '4px')});
    }

    ${props => props.$active && `
        background: ${theme.colors.backgroundSecondary};
    `}

    svg:first-child {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-right: ${props => (props.$collapsed ? 0 : theme.spacing.md)};
    }

    svg:last-child {
        transition: transform ${theme.transitions.default};
        transform: ${props => (props.$open ? 'rotate(180deg)' : 'rotate(0)')};
        display: ${props => (props.$collapsed ? 'none' : 'block')};
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }
`;

const SubMenu = styled.div<{$collapsed: boolean}>`
    margin-left: ${props => (props.$collapsed ? 0 : '20px')}; 
    border-left: ${props => (props.$collapsed ? 'none' : `2px solid ${theme.colors.border}`)};
    padding-left: ${props => (props.$collapsed ? 0 : theme.spacing.xs)};
    margin-top: ${props => (props.$collapsed ? theme.spacing.xs : theme.spacing.sm)};
    animation: ${props => (!props.$collapsed ? 'slideDown 0.2s ease-out' : 'none')};

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Correct NavItem padding inside SubMenu */
    ${NavItem} {
        padding-left: ${props => (props.$collapsed ? theme.spacing.lg : `calc(${theme.spacing.xl} + 8px)`)};
        border-left: none;
        margin-left: ${props => (props.$collapsed ? theme.spacing.sm : '0')};
        margin-right: ${props => (props.$collapsed ? theme.spacing.sm : '0')};
        font-size: ${theme.typography.fontSizes.sm};

        &::before {
            content: '';
            position: absolute;
            left: ${props => (props.$collapsed ? '0' : theme.spacing.xl)};
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: ${theme.colors.textSecondary};
            opacity: 0.5;
        }
    }
`;

const AccountSection = styled.div<{$collapsed: boolean}>`
    margin-top: auto;
    padding-top: ${theme.spacing.xl};
    border-top: 1px solid ${theme.colors.border};
    margin-left: ${theme.spacing.sm};
    margin-right: ${theme.spacing.sm};
    padding-left: ${props => (props.$collapsed ? theme.spacing.sm : 0)};
    padding-right: ${props => (props.$collapsed ? theme.spacing.sm : 0)};
`;

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { hasUserType } = useAuthorization();
    const { user } = useAuth();

    const [collapsed, setCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleSection = (key: string) => {
        if (collapsed) setCollapsed(false);
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isOpen = (key: string) => openSections[key] || pathname.includes(`/${key}`);

    useEffect(() => {
        const paths = ['revenue', 'expense', 'transaction', 'report', 'forecast', 'scenario', 'variance', 'budget', 'finance-admin', 'accountant', 'employee', 'department', 'project'];
        const newOpen = { ...openSections };
        paths.forEach(p => {
            if (pathname.includes(`/${p}`)) newOpen[p] = true; 
        });
        setOpenSections(newOpen);
    }, [pathname]);
    const isAdmin = hasUserType(UserType.ADMIN) || user?.userType?.toLowerCase() === "admin";
    const isFinanceAdmin = hasUserType(UserType.FINANCE_ADMIN) || user?.userType?.toLowerCase() === "finance_admin";
    const isEmployee = hasUserType(UserType.EMPLOYEE) || user?.userType?.toLowerCase() === "employee";
    const isAccountant = hasUserType(UserType.ACCOUNTANT) || user?.userType?.toLowerCase() === "accountant";
    
    return (
        <SidebarContainer $collapsed={collapsed}> 
        <CollapseButton onClick={() => setCollapsed(!collapsed)}>
            <Menu size={22} />
        </CollapseButton>

        <Logo $collapsed={collapsed}> 
        {!collapsed ? 'Finance': null}
        </Logo>
        <SectionTitle $collapsed={collapsed}>Main</SectionTitle>

        <ComponentGate componentId={ComponentId.SIDEBAR_DASHBOARD}>
           <NavItem href="/dashboard" $active={pathname === '/dashboard'} $collapsed={collapsed}> 
            <Home />
            {!collapsed && 'Dashboard'}
           </NavItem>
        </ComponentGate>

        {/* Revenue - Hidden for employees */}
        {!isEmployee && (
            <ComponentGate componentId={ComponentId.SIDEBAR_REVENUE}>
                <>
                <DropdownHeader 
                    onClick={() => toggleSection('revenue')}
                    $open={isOpen('revenue')}
                    $active={pathname.includes('/revenue')}
                    $collapsed={collapsed} 
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowDownCircle />
                        {!collapsed && <span style={{ marginLeft: '12px' }}>Revenue</span>}
                    </div>
                    {!collapsed && <ChevronDown size={16} />}
                </DropdownHeader>
                {isOpen('revenue') && (
                    <SubMenu $collapsed={collapsed}> 
                        <ComponentGate componentId={ComponentId.REVENUE_LIST}>
                            <NavItem href="/revenue/list" $active={pathname === '/revenue/list'} $collapsed={collapsed}> 
                                <List size={16} /> {/* Added icon for List */}
                                {!collapsed && 'Revenues'}
                            </NavItem>
                        </ComponentGate>
                        </SubMenu>
                    )}
                </>
            </ComponentGate>
        )}

        {/* Expenses */}
        <ComponentGate componentId={ComponentId.SIDEBAR_EXPENSE}>
            <>
                <DropdownHeader
                    onClick={() => toggleSection('expense')}
                    $open={isOpen('expense')}
                    $active={pathname.includes('/expense')}
                    $collapsed={collapsed}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowUpCircle />
                        {!collapsed && <span style={{ marginLeft: '12px' }}>Expenses</span>}
                    </div>
                    {!collapsed && <ChevronDown size={16} />}
                </DropdownHeader>
                {isOpen('expense') && (
                    <SubMenu $collapsed={collapsed}>
                        <ComponentGate componentId={ComponentId.EXPENSE_LIST}>
                            <NavItem href="/expenses/list" $active={pathname === '/expense/list'} $collapsed={collapsed}>
                                <List size={16} /> {/* Added icon for List */}
                                {!collapsed && 'Expenses'}
                            </NavItem>
                        </ComponentGate>
                        <ComponentGate componentId={ComponentId.EXPENSE_CREATE}>
                            <NavItem href="/expenses/items" $active={pathname === '/expenses/items'} $collapsed={collapsed}>
                                <Calculator size={16} />
                                {!collapsed && 'Expense-Calcu'}
                            </NavItem>
                        </ComponentGate>
                    </SubMenu>
                )}
            </>
        </ComponentGate>

        {/* Transactions */}
        <ComponentGate componentId={ComponentId.SIDEBAR_TRANSACTION}>
            <NavItem href="/transaction/list" $active={pathname.includes('/transaction')} $collapsed={collapsed}>
                <Receipt />
                {!collapsed && 'Transactions'}
            </NavItem>
        </ComponentGate>

        {/* Reports */}
        <ComponentGate componentId={ComponentId.SIDEBAR_REPORT}>
            <NavItem href="/report" $active={pathname.includes('/report')} $collapsed={collapsed}>
                <PieChart />
                {!collapsed && 'Reports'}
            </NavItem>
        </ComponentGate>

        {/* Forecasts - Full access for Admin and Finance Admin, View only for Accountant and Employee */}
        <ComponentGate componentId={ComponentId.SIDEBAR_FORECAST}>
            <>
                <DropdownHeader
                    onClick={() => toggleSection('forecast')}
                    $open={isOpen('forecast')}
                    $active={pathname.includes('/forecast')}
                    $collapsed={collapsed}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUp />
                        {!collapsed && <span style={{ marginLeft: '12px' }}>Forecasts</span>}
                    </div>
                    {!collapsed && <ChevronDown size={16} />}
                </DropdownHeader>
                {isOpen('forecast') && (
                    <SubMenu $collapsed={collapsed}>
                        {/* Create - Only for Admin and Finance Admin */}
                        {(isAdmin || isFinanceAdmin) && (
                            <ComponentGate componentId={ComponentId.FORECAST_CREATE}>
                                <NavItem href="/forecast/create" $active={pathname === '/forecast/create'} $collapsed={collapsed}>
                                    <Plus size={16} />
                                    {!collapsed && 'new forecast'}
                                </NavItem>
                            </ComponentGate>
                        )}
                        {/* List - Available for all authorized users */}
                        <ComponentGate componentId={ComponentId.FORECAST_LIST}>
                            <NavItem href="/forecast/list" $active={pathname === '/forecast/list'} $collapsed={collapsed}>
                                <List size={16} />
                                {!collapsed && 'forecasts'}
                            </NavItem>
                        </ComponentGate>
                    </SubMenu>
                )}
            </>
        </ComponentGate>

        {/* Scenarios - Only for Admin and Finance Admin */}
        {(isAdmin || isFinanceAdmin) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_SCENARIO}>
                <>
                    <DropdownHeader
                        onClick={() => toggleSection('scenario')}
                        $open={isOpen('scenario')}
                        $active={pathname.includes('/scenario')}
                        $collapsed={collapsed}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <GitCompare />
                            {!collapsed && <span style={{ marginLeft: '12px' }}>Scenarios</span>}
                        </div>
                        {!collapsed && <ChevronDown size={16} />}
                    </DropdownHeader>
                    {isOpen('scenario') && (
                        <SubMenu $collapsed={collapsed}>
                            <ComponentGate componentId={ComponentId.SCENARIO_CREATE}>
                                <NavItem href="/scenarios/create" $active={pathname === '/scenarios/create'} $collapsed={collapsed}>
                                    <Plus size={16} />
                                    {!collapsed && 'new scenario'}
                                </NavItem>
                            </ComponentGate>
                            <ComponentGate componentId={ComponentId.SCENARIO_LIST}>
                                <NavItem href="/scenarios/list" $active={pathname === '/scenarios/list'} $collapsed={collapsed}>
                                    <List size={16} />
                                    {!collapsed && 'scenarios'}
                                </NavItem>
                            </ComponentGate>
                            <ComponentGate componentId={ComponentId.SCENARIO_COMPARE}>
                                <NavItem href="/scenarios/campare" $active={pathname.includes('/scenarios/campare')} $collapsed={collapsed}>
                                    <GitCompare size={16} />
                                    {!collapsed && 'compare scenarios'}
                                </NavItem>
                            </ComponentGate>
                        </SubMenu>
                    )}
                </>
            </ComponentGate>
        )}

        {/* Variance - Only for Admin and Finance Admin */}
        {(isAdmin || isFinanceAdmin) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_VARIANCE}>
                <>
                    <DropdownHeader
                        onClick={() => toggleSection('variance')}
                        $open={isOpen('variance')}
                        $active={pathname.includes('/variance')}
                        $collapsed={collapsed}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <BarChart3 />
                            {!collapsed && <span style={{ marginLeft: '12px' }}>Variance</span>}
                        </div>
                        {!collapsed && <ChevronDown size={16} />}
                    </DropdownHeader>
                    {isOpen('variance') && (
                        <SubMenu $collapsed={collapsed}>
                            <ComponentGate componentId={ComponentId.VARIANCE_CALCULATE}>
                                <NavItem href="/variance/calculatevariance" $active={pathname.includes('/variance/calculatevariance')} $collapsed={collapsed}>
                                    <Calculator size={16} />
                                    {!collapsed && 'calculate variance'}
                                </NavItem>
                            </ComponentGate>
                            <ComponentGate componentId={ComponentId.VARIANCE_HISTORY}>
                                <NavItem href="/variance/variancehistory" $active={pathname.includes('/variance/variancehistory')} $collapsed={collapsed}>
                                    <FileText size={16} />
                                    {!collapsed && 'variance history'}
                                </NavItem>
                            </ComponentGate>
                            <ComponentGate componentId={ComponentId.VARIANCE_SUMMARY}>
                                <NavItem href="/variance/variancesummery" $active={pathname.includes('/variance/variancesummery')} $collapsed={collapsed}>
                                    <BarChart3 size={16} />
                                    {!collapsed && 'variance summary'}
                                </NavItem>
                            </ComponentGate>
                        </SubMenu>
                    )}
                </>
            </ComponentGate>
        )}

        {/* Budgets - Only for Admin and Finance Admin */}
        {(isAdmin || isFinanceAdmin) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_BUDGETS}>
                <>
                    <DropdownHeader
                        onClick={() => toggleSection('budget')}
                        $open={isOpen('budget')}
                        $active={pathname.includes('/budget')}
                        $collapsed={collapsed}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <DollarSign />
                            {!collapsed && <span style={{ marginLeft: '12px' }}>Budgets</span>}
                        </div>
                        {!collapsed && <ChevronDown size={16} />}
                    </DropdownHeader>
                    {isOpen('budget') && (
                        <SubMenu $collapsed={collapsed}>
                            <NavItem href="/budgets/create" $active={pathname === '/budgets/create'} $collapsed={collapsed}>
                                <Plus size={16} />
                                {!collapsed && 'new budget'}
                            </NavItem>
                            <NavItem href="/budgets" $active={pathname === '/budgets'} $collapsed={collapsed}>
                                <List size={16} />
                                {!collapsed && 'budgets'}
                            </NavItem>
                            <NavItem href="/budgets/additems" $active={pathname.includes('/budgets/additems')} $collapsed={collapsed}>
                                <Calculator size={16} />
                                {!collapsed && 'Add Items'}
                            </NavItem>
                            <NavItem href="/budgets/listitems" $active={pathname.includes('/budgets/listitems')} $collapsed={collapsed}>
                                <FileText size={16} />
                                {!collapsed && 'List Items'}
                            </NavItem>
                        </SubMenu>
                    )}
                </>
            </ComponentGate>
        )}

        {/* ==============================================
            ADMINISTRATION SECTION 🛡️
            ==============================================
        */}
        {(isAdmin || isFinanceAdmin) && (
            <>
                <SectionTitle $collapsed={collapsed}>Admin</SectionTitle>

                {/* 1. Finance Managers (Create, List) */}
                {isAdmin && ( // Only show the main dropdown if Admin
                    <ComponentGate componentId={ComponentId.SIDEBAR_FINANCE_ADMINS}> 
                        <>
                        <DropdownHeader
                            onClick={() => toggleSection('finance-admin')}
                            $open={isOpen('finance-admin')}
                            $active={pathname.includes('/finance-admin')}
                            $collapsed={collapsed}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Shield style={{ color: '#e74c3c' }} />
                                {!collapsed && <span style={{ marginLeft: '12px' }}>Finance</span>}
                            </div>
                            {!collapsed && <ChevronDown size={16} />}
                        </DropdownHeader>
                        {isOpen('finance-admin') && (
                            <SubMenu $collapsed={collapsed}>
                                {/* Finance Create Link */}
                                <ComponentGate componentId={ComponentId.FINANCE_MANAGER_CREATE}>
                                    <NavItem href="/finance/create" $active={pathname === '/finance-admin/create'} $collapsed={collapsed}>
                                        <UserPlus size={16} />
                                        {!collapsed && 'Add Manager'}
                                    </NavItem>
                                </ComponentGate>
                                {/* Finance List Link */}
                                <ComponentGate componentId={ComponentId.FINANCE_MANAGER_LIST}>
                                    <NavItem href="/finance/list" $active={pathname === '/finance-admin/list'} $collapsed={collapsed}>
                                        <List size={16} />
                                        {!collapsed && 'All Managers'}
                                    </NavItem>
                                </ComponentGate>
                            </SubMenu>
                        )}
                        </>
                    </ComponentGate>
                )}

                {/* 2. Accountants (Create, List) */}
                <ComponentGate componentId={ComponentId.SIDEBAR_ACCOUNTANTS}> 
                    <>
                    <DropdownHeader
                        onClick={() => toggleSection('accountant')}
                        $open={isOpen('accountant')}
                        $active={pathname.includes('/accountant')}
                        $collapsed={collapsed}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Wallet />
                            {!collapsed && <span style={{ marginLeft: '12px' }}>Accountants</span>}
                        </div>
                        {!collapsed && <ChevronDown size={16} />}
                    </DropdownHeader>
                    {isOpen('accountant') && (
                        <SubMenu $collapsed={collapsed}>
                            {/* Accountant Create Link */}
                            <ComponentGate componentId={ComponentId.ACCOUNTANT_CREATE}>
                                <NavItem href="/accountants/create" $active={pathname === '/accountant/create'} $collapsed={collapsed}>
                                    <UserPlus size={16} />
                                    {!collapsed && 'Add Accountant'}
                                </NavItem>
                            </ComponentGate>
                            {/* Accountant List Link */}
                            <ComponentGate componentId={ComponentId.ACCOUNTANT_LIST}>
                                <NavItem href="/accountants/list" $active={pathname === '/accountant/list'} $collapsed={collapsed}>
                                    <List size={16} />
                                    {!collapsed && 'All Accountants'}
                                </NavItem>
                            </ComponentGate>
                        </SubMenu>
                    )}
                    </>
                </ComponentGate>

                {/* 3. Employees (Create, List) */}
                <ComponentGate componentId={ComponentId.SIDEBAR_EMPLOYEES}>
                    <>
                    <DropdownHeader
                        onClick={() => toggleSection('employee')}
                        $open={isOpen('employee')}
                        $active={pathname.includes('/employee')}
                        $collapsed={collapsed}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Users />
                            {!collapsed && <span style={{ marginLeft: '12px' }}>Employees</span>}
                        </div>
                        {!collapsed && <ChevronDown size={16} />}
                    </DropdownHeader>
                    {isOpen('employee') && (
                        <SubMenu $collapsed={collapsed}>
                            {/* Employee Create Link */}
                            <ComponentGate componentId={ComponentId.EMPLOYEE_CREATE}>
                                <NavItem href="/employees/create" $active={pathname === '/employee/create'} $collapsed={collapsed}>
                                    <UserPlus size={16} />
                                    {!collapsed && 'Add Employee'}
                                </NavItem>
                            </ComponentGate>
                            {/* Employee List Link */}
                            <ComponentGate componentId={ComponentId.EMPLOYEE_LIST}>
                                <NavItem href="/employees/list" $active={pathname === '/employee/list'} $collapsed={collapsed}>
                                    <List size={16} />
                                    {!collapsed && 'All Employees'}
                                </NavItem>
                            </ComponentGate>
                        </SubMenu>
                    )}
                    </>
                </ComponentGate>

                {/* Departments */}
                <ComponentGate componentId={ComponentId.SIDEBAR_DEPARTMENT}>
                    <NavItem href="/department/list" $active={pathname.includes('/department')} $collapsed={collapsed}>
                        <Building />
                        {!collapsed && 'Departments'}
                    </NavItem>
                </ComponentGate>

                {/* Projects */}
                <ComponentGate componentId={ComponentId.SIDEBAR_PROJECT}>
                    <NavItem href="/project/list" $active={pathname.includes('/project')} $collapsed={collapsed}>
                        <Briefcase />
                        {!collapsed && 'Projects'}
                    </NavItem>
                </ComponentGate>
            </>
        )}

        {/* ========== ACCOUNT SECTION (Bottom) 👤 ========== */}
        <AccountSection $collapsed={collapsed}>
            <SectionTitle $collapsed={collapsed}>user</SectionTitle>

            <ComponentGate componentId={ComponentId.SIDEBAR_PROFILE}>
                <NavItem href="/profile" $active={pathname === '/profile'} $collapsed={collapsed}>
                    <UserCog />
                    {!collapsed && 'Profile'}
                </NavItem>
            </ComponentGate>

            <ComponentGate componentId={ComponentId.SIDEBAR_SETTINGS}>
                <NavItem href="/settings" $active={pathname.startsWith('/settings')} $collapsed={collapsed}>
                    <Settings />
                    {!collapsed && 'Settings'}
                </NavItem>
            </ComponentGate>
        </AccountSection>
      </SidebarContainer>
    );
};

export default Sidebar;