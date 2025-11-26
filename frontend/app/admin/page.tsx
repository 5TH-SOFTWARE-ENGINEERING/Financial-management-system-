'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building,
  Settings,
  Shield,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Activity,
  Database,
  Key
} from 'lucide-react';
import { useUserStore, type StoreUser } from '@/store/userStore';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalExpenses: number;
  pendingApprovals: number;
  systemHealth: 'healthy' | 'warning' | 'error' | 'unhealthy';
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, allUsers, fetchAllUsers } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAllUsers();
      fetchSystemStats();
    }
  }, [isAuthenticated, user]);

  const fetchSystemStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await apiClient.getAdminSystemStats();
      const data = response.data;
      setSystemStats({
        totalUsers: data.users?.total ?? 0,
        activeUsers: data.users?.active ?? 0,
        totalRevenue: data.financials?.total_revenue ?? 0,
        totalExpenses: data.financials?.total_expenses ?? 0,
        pendingApprovals: data.pending_approvals ?? 0,
        systemHealth: (data.system_health as SystemStats['systemHealth']) || 'healthy',
      });
    } catch (error: any) {
      setStatsError(error.response?.data?.detail || 'Failed to load system stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getSubordinates = (userId: string) => {
    return allUsers.filter(u => u.managerId === userId);
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'finance_manager':
        return 'bg-blue-100 text-blue-800';
      case 'accountant':
        return 'bg-green-100 text-green-800';
      case 'employee':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
    case 'unhealthy':
      return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const statsReady = !!systemStats;
  const totalRevenue = systemStats?.totalRevenue ?? 0;
  const totalExpenses = systemStats?.totalExpenses ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const activeUsersCount = systemStats?.activeUsers ?? 0;

  const renderUserHierarchy = (users: StoreUser[], level = 0) => {
    return users.map(user => {
      const subordinates = getSubordinates(user.id);
      const isExpanded = expandedUsers.has(user.id);
      
      return (
        <div key={user.id} className="select-none">
          <div 
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
              level > 0 && `ml-${Math.min(level * 8, 24)}`
            )}
            onClick={() => subordinates.length > 0 && toggleUserExpansion(user.id)}
          >
            {subordinates.length > 0 && (
              <div className="flex items-center">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
            
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </p>
                <span className={cn(
                  "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                  getRoleColor(user.role)
                )}>
                  {user.role.replace('_', ' ')}
                </span>
                <span className={cn(
                  "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                  user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {subordinates.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {subordinates.length} {subordinates.length === 1 ? 'subordinate' : 'subordinates'}
                </span>
              )}
              <button className="p-1 text-muted-foreground hover:text-foreground">
                <Eye className="h-4 w-4" />
              </button>
              <button className="p-1 text-muted-foreground hover:text-foreground">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {isExpanded && subordinates.length > 0 && (
            <div className="mt-1">
              {renderUserHierarchy(subordinates, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">System administration and user management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {statsError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            {statsError}
          </div>
        )}
        {!statsReady && statsLoading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            Loading system statistics...
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{systemStats?.totalUsers ?? '--'}</p>
                <p className="text-xs text-muted-foreground">{activeUsersCount} active</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-foreground capitalize">{systemStats?.systemHealth ?? 'unknown'}</p>
              </div>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                getHealthColor(systemStats?.systemHealth ?? 'unknown')
              )}>
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-foreground">{systemStats?.pendingApprovals ?? '--'}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsReady ? `$${netProfit.toLocaleString()}` : '--'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">User Hierarchy</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="finance_manager">Finance Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              <div className="p-4 space-y-1">
                {renderUserHierarchy(filteredUsers.filter(u => !u.managerId))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <Database className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">Database</p>
              <p className="text-sm text-muted-foreground">Backup & Restore</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <FileText className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">Reports</p>
              <p className="text-sm text-muted-foreground">Generate Reports</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">Settings</p>
              <p className="text-sm text-muted-foreground">System Configuration</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <Key className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">Security</p>
              <p className="text-sm text-muted-foreground">Access Control</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
  );
}