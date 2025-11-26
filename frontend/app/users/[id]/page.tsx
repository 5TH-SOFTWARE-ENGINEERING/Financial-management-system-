'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  Edit,
  Trash2,
  UserCheck,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UserDetail {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  department?: string | null;
  manager_id?: number | null;
  created_at?: string;
  updated_at?: string | null;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id ? parseInt(params.id as string, 10) : null;
  const { user: currentUser, allUsers, fetchAllUsers } = useUserStore();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const loadUser = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUsers();
      const users = response.data || [];
      const foundUser = users.find((u: any) => u.id === userId);
      
      if (!foundUser) {
        setError('User not found');
        return;
      }

      setUser({
        id: foundUser.id,
        full_name: foundUser.full_name || foundUser.username || foundUser.email || '',
        email: foundUser.email || '',
        username: foundUser.username || '',
        phone: foundUser.phone || null,
        role: foundUser.role?.toLowerCase() || 'employee',
        is_active: foundUser.is_active !== false,
        department: foundUser.department || null,
        manager_id: foundUser.manager_id || null,
        created_at: foundUser.created_at || '',
        updated_at: (foundUser as any).updated_at || null,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !user) return;

    if (!confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteUser(userId);
      toast.success('User deleted successfully');
      router.push('/users');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'finance_manager':
      case 'manager':
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
        return <Shield className="h-5 w-5" />;
      case 'finance_manager':
      case 'manager':
        return <Building className="h-5 w-5" />;
      case 'accountant':
        return <UserCheck className="h-5 w-5" />;
      case 'employee':
        return <Briefcase className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      manager: 'Manager',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    return roleNames[role] || role;
  };

  const getManagerName = () => {
    if (!user?.manager_id) return 'None';
    const manager = allUsers.find(u => u.id === user.manager_id?.toString());
    return manager?.name || 'Unknown';
  };

  const getSubordinates = () => {
    if (!user) return [];
    return allUsers.filter(u => u.managerId === user.id.toString());
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link 
            href="/users"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const subordinates = getSubordinates();

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link 
          href="/users"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (user.role === 'employee') {
                  router.push(`/employees/edit/${user.id}`);
                } else if (user.role === 'accountant') {
                  router.push(`/accountants/edit/${user.id}`);
                } else if (user.role === 'finance_manager' || user.role === 'manager') {
                  router.push(`/finance/edit/${user.id}`);
                } else {
                  router.push(`/users/${user.id}/edit`);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
            {(currentUser?.role === 'admin' || (currentUser?.role === 'finance_manager' && currentUser.id !== user.id.toString())) && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Personal Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {getRoleIcon(user.role)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{user.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="text-sm font-medium text-foreground">{user.username}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.department && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="text-sm font-medium text-foreground">{user.department}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hierarchy Card */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Team Hierarchy</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Manager</p>
                <p className="text-sm font-medium text-foreground">{getManagerName()}</p>
              </div>
              {subordinates.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Subordinates ({subordinates.length})</p>
                  <div className="space-y-2">
                    {subordinates.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <span className="text-sm font-medium text-foreground">{sub.name}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(sub.role)}`}>
                          {getRoleDisplayName(sub.role)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">User ID</p>
                <p className="text-sm font-medium text-foreground">#{user.id}</p>
              </div>
              {user.created_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              )}
              {user.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{formatDate(user.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

