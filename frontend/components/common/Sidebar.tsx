// components/common/sidebar.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import {
    Home,
    ArrowDownCircle,
    ArrowUpCircle,
    Receipt,
    PieChart,
    Building,
    Briefcase,
    Users,
    UserCog,
    Settings,
    ChevronDown,
    Menu,
    Wallet,
    Shield,
    UserPlus,
    List,
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
    width: ${props => (props.$collapsed ? '70px' : '250px')};
    height: 100vh;
    background: ${theme.colors.background};
    border-right: 1px solid ${theme.colors.border};
    padding: ${theme.spacing.md} 0;
    position: fixed;
    left: 0;
    top: 0;
    overflow-y: auto;
    z-index: 50;
    transition: width 0.3s ease;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
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
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
    }
`;

const Logo = styled.div<{ $collapsed: boolean }>`
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: ${props => (props.$collapsed ? 'center' : 'flex-start')}; 
    padding: 0 ${theme.spacing.xl};
    margin-bottom: ${theme.spacing.xl};
    font-size: ${theme.typography.fontSizes.xxl};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${theme.colors.primary};
`;

const SectionTitle = styled.h3<{$collapsed: boolean}>`
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: ${theme.colors.textSecondary};
    padding: ${theme.spacing.sm} ${theme.spacing.xl};
    margin: ${theme.spacing.xl} 0 ${theme.spacing.md};
    opacity: ${props => (props.$collapsed ? 0 : 1)};
    pointer-events: none;
`;

const NavItem = styled(Link)<{ $active?: boolean; $collapsed?: boolean }>`
    display: flex;
    align-items: center;
    padding: ${theme.spacing.md} ${props => (props.$collapsed ? theme.spacing.lg : theme.spacing.xl)};
    color: ${props => (props.$active ? theme.colors.primary : theme.colors.textSecondary)};
    text-decoration: none;
    border-left: 3px solid ${props => (props.$active ? theme.colors.primary : 'transparent')};
    transition: all 0.2s;
    justify-content: ${props => (props.$collapsed ? 'center' : 'flex-start')};

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
    }

    svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-right: ${props => (props.$collapsed ? 0 : theme.spacing.md)};
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
    transition: all 0.2s;

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
    }

    svg:last-child {
        transition: transform 0.3s;
        transform: ${props => (props.$open ? 'rotate(180deg)' : 'rotate(0)')};
        display: ${props => (props.$collapsed ? 'none' : 'block')};
    }
`;

const SubMenu = styled.div<{$collapsed: boolean}>`
    margin-left: ${props => (props.$collapsed ? 0 : '20px')}; 
    border-left: ${props => (props.$collapsed ? 'none' : '2px solid ' + theme.colors.border)};

    /* Correct NavItem padding inside SubMenu */
    ${NavItem} {
        padding-left: ${props => (props.$collapsed ? theme.spacing.lg : `calc(${theme.spacing.xl} + 5px)`)};
        border-left: none;
    }
`;
// --- End Styled Component Fixes ---

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
        // Paths to check if a section should be initially open
        const paths = ['revenue', 'expense', 'transaction', 'report', 'finance-admin', 'accountant', 'employee', 'department', 'project'];
        const newOpen = { ...openSections };
        paths.forEach(p => {
            if (pathname.includes(`/${p}`)) newOpen[p] = true; 
        });
        setOpenSections(newOpen);
    }, [pathname]);
  // the newly added to fix the admin permission 
    const isAdmin = hasUserType(UserType.ADMIN) || user?.userType?.toLowerCase() === "admin";
    const isFinanceAdmin = hasUserType(UserType.FINANCE_ADMIN) || user?.userType?.toLowerCase() === "finance_admin";
    
    return (
        <SidebarContainer $collapsed={collapsed}> 
        <CollapseButton onClick={() => setCollapsed(!collapsed)}>
            <Menu size={22} />
        </CollapseButton>

        <Logo $collapsed={collapsed}> 
        {!collapsed ? 'FinancePro' : 'FP'}
        </Logo>

        {/* ========== MAIN NAVIGATION ========== */}
        <SectionTitle $collapsed={collapsed}>Main</SectionTitle>

        <ComponentGate componentId={ComponentId.SIDEBAR_DASHBOARD}>
           <NavItem href="/dashboard" $active={pathname === '/dashboard'} $collapsed={collapsed}> 
            <Home />
            {!collapsed && 'Dashboard'}
           </NavItem>
        </ComponentGate>

        {/* Revenue */}
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
                    <ComponentGate componentId={ComponentId.REVENUE_CREATE}>
                        <NavItem href="/revenue/create" $active={pathname === '/revenue/create'} $collapsed={collapsed}> 
                            <UserPlus size={16} /> {/* Added icon for Create */}
                            {!collapsed && 'Add Revenue'}
                        </NavItem>
                    </ComponentGate>
                    <ComponentGate componentId={ComponentId.REVENUE_LIST}>
                        <NavItem href="/revenue/list" $active={pathname === '/revenue/list'} $collapsed={collapsed}> 
                            <List size={16} /> {/* Added icon for List */}
                            {!collapsed && 'All Revenue'}
                        </NavItem>
                    </ComponentGate>
                    </SubMenu>
                )}
            </>
        </ComponentGate>

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
                        <ComponentGate componentId={ComponentId.EXPENSE_CREATE}>
                            <NavItem href="/expense/create" $active={pathname === '/expense/create'} $collapsed={collapsed}>
                                <UserPlus size={16} /> {/* Added icon for Create */}
                                {!collapsed && 'Add Expense'}
                            </NavItem>
                        </ComponentGate>
                        <ComponentGate componentId={ComponentId.EXPENSE_LIST}>
                            <NavItem href="/expense/list" $active={pathname === '/expense/list'} $collapsed={collapsed}>
                                <List size={16} /> {/* Added icon for List */}
                                {!collapsed && 'All Expenses'}
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

        {/* ==============================================
            ADMINISTRATION SECTION 🛡️
            ==============================================
        */}
        {(isAdmin || isFinanceAdmin) && (
            <>
                <SectionTitle $collapsed={collapsed}>Administration</SectionTitle>

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
                                {!collapsed && <span style={{ marginLeft: '12px' }}>Finance Managers</span>}
                            </div>
                            {!collapsed && <ChevronDown size={16} />}
                        </DropdownHeader>
                        {isOpen('finance-admin') && (
                            <SubMenu $collapsed={collapsed}>
                                {/* Finance Create Link */}
                                <ComponentGate componentId={ComponentId.FINANCE_MANAGER_CREATE}>
                                    <NavItem href="/finance-admin/create" $active={pathname === '/finance-admin/create'} $collapsed={collapsed}>
                                        <UserPlus size={16} />
                                        {!collapsed && 'Add Finance Manager'}
                                    </NavItem>
                                </ComponentGate>
                                {/* Finance List Link */}
                                <ComponentGate componentId={ComponentId.FINANCE_MANAGER_LIST}>
                                    <NavItem href="/finance-admin/list" $active={pathname === '/finance-admin/list'} $collapsed={collapsed}>
                                        <List size={16} />
                                        {!collapsed && 'All Finance Managers'}
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
                                <NavItem href="/accountant/create" $active={pathname === '/accountant/create'} $collapsed={collapsed}>
                                    <UserPlus size={16} />
                                    {!collapsed && 'Add Accountant'}
                                </NavItem>
                            </ComponentGate>
                            {/* Accountant List Link */}
                            <ComponentGate componentId={ComponentId.ACCOUNTANT_LIST}>
                                <NavItem href="/accountant/list" $active={pathname === '/accountant/list'} $collapsed={collapsed}>
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
                                <NavItem href="/employee/create" $active={pathname === '/employee/create'} $collapsed={collapsed}>
                                    <UserPlus size={16} />
                                    {!collapsed && 'Add Employee'}
                                </NavItem>
                            </ComponentGate>
                            {/* Employee List Link */}
                            <ComponentGate componentId={ComponentId.EMPLOYEE_LIST}>
                                <NavItem href="/employee/list" $active={pathname === '/employee/list'} $collapsed={collapsed}>
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
        <div style={{ marginTop: 'auto', paddingTop: theme.spacing.xl }}>
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
        </div>
      </SidebarContainer>
    );
};

export default Sidebar;