'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  UserCheck,
  Briefcase,
  Shield,
  Calendar,
  MoreVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { type User } from '@/lib/validation';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

export default function UsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, allUsers, fetchAllUsers } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !['admin', 'finance_manager'].includes(user?.role || ''))) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAllUsers();
    }
  }, [isAuthenticated, user]);

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
    return allUsers.filter((u: any) => (u.managerId === userId) || (u.manager_id?.toString() === userId));
  };

  const filteredUsers = allUsers.filter((userItem: any) => {
    const userRole = (userItem.role || '').toLowerCase();
    const userName = userItem.full_name || userItem.name || userItem.email || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (userItem.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || userRole === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && (userItem.is_active !== false)) ||
                          (filterStatus === 'inactive' && (userItem.is_active === false));
    return matchesSearch && matchesRole && matchesStatus;
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'finance_manager':
        return <Building className="h-4 w-4" />;
      case 'accountant':
        return <UserCheck className="h-4 w-4" />;
      case 'employee':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const renderUserHierarchy = (users: any[], level = 0) => {
    return users.map((userItem: any) => {
      const userRole = (userItem.role || '').toLowerCase();
      const userId = userItem.id?.toString() || userItem.id;
      const subordinates = getSubordinates(userId);
      const isExpanded = expandedUsers.has(userId);
      
      return (
        <div key={userId} className="select-none">
          <div 
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
              level > 0 && `ml-${Math.min(level * 8, 24)}`
            )}
            onClick={() => subordinates.length > 0 && toggleUserExpansion(userId)}
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
              {getRoleIcon(userRole)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {userItem.full_name || userItem.name || userItem.email}
                </p>
                <span className={cn(
                  "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                  getRoleColor(userRole)
                )}>
                  {getRoleDisplayName(userRole)}
                </span>
                <span className={cn(
                  "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                  (userItem.is_active !== false) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {(userItem.is_active !== false) ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 mr-1" />
                  {userItem.email}
                </div>
                {userItem.phone && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1" />
                    {userItem.phone}
                  </div>
                )}
                {userItem.created_at && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {formatDate(userItem.created_at)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {subordinates.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {subordinates.length} {subordinates.length === 1 ? 'subordinate' : 'subordinates'}
                </span>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/users/${userItem.id}`);
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const role = userRole;
                  if (role === 'employee') {
                    router.push(`/employees/edit/${userItem.id}`);
                  } else if (role === 'accountant') {
                    router.push(`/accountants/edit/${userItem.id}`);
                  } else if (role === 'finance_manager' || role === 'manager' || role === 'finance_admin') {
                    router.push(`/finance/edit/${userItem.id}`);
                  } else {
                    router.push(`/users/${userItem.id}/edit`);
                  }
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Edit user"
              >
                <Edit className="h-4 w-4" />
              </button>
              {(userRole === 'admin' || (userRole === 'finance_manager' && user?.id !== userId)) && (
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    const userName = userItem.full_name || userItem.name || userItem.email;
                    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
                      try {
                        await apiClient.deleteUser(typeof userItem.id === 'string' ? parseInt(userItem.id) : userItem.id);
                        toast.success('User deleted successfully');
                        fetchAllUsers();
                      } catch (err: any) {
                        toast.error(err.response?.data?.detail || 'Failed to delete user');
                      }
                    }
                  }}
                  className="p-1 text-destructive hover:text-destructive/80"
                  title="Delete user"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
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

  if (!['admin', 'finance_manager'].includes(user.role)) {
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

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u: any) => u.is_active !== false).length;
  const inactiveUsers = allUsers.filter((u: any) => u.is_active === false).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage users and team hierarchy</p>
            </div>
            <button
              onClick={() => router.push('/employees/create')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Users</p>
                <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                <p className="text-2xl font-bold text-foreground">
                  {user.role === 'admin' ? 'All' : getSubordinates(user.id).length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Building className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="finance_manager">Finance Manager</option>
            <option value="accountant">Accountant</option>
            <option value="employee">Employee</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {user.role === 'admin' ? 'All Users' : 'Your Team'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.role === 'admin' 
                ? 'View and manage all users in the system'
                : 'View users in your team hierarchy'
              }
            </p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              <div className="p-4 space-y-1">
                {renderUserHierarchy(
                  user.role === 'admin' 
                    ? filteredUsers.filter((u: any) => !u.managerId && !u.manager_id)
                    : filteredUsers.filter((u: any) => (u.managerId === user.id || u.manager_id?.toString() === user.id) || u.id === user.id)
                )}
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

    </div>
  );
}