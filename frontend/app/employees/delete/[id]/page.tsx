'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { AlertCircle, CheckCircle, ArrowLeft, Users, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DeleteEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { deleteUser, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    setLoadingUser(true);
    setError(null);
    
    try {
      const response = await apiClient.getUsers();
      const user = (response.data || []).find((u: any) => u.id.toString() === id);
      
      if (!user) {
        setError('Employee not found');
        return;
      }
      
      setEmployee(user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load employee');
      toast.error('Failed to load employee');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm(`Are you sure you want to delete "${employee?.full_name || 'this employee'}"? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await apiClient.deleteUser(parseInt(id, 10));
      await deleteUser(id); // Update store
      await fetchAllUsers(); // Refresh user list
      
      setSuccess('Employee deleted successfully!');
      toast.success('Employee deleted successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/employees/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to delete employee';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading employee...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/employees/list"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error || 'Employee not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/employees/list"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-foreground">Delete Employee</h1>
        </div>
        <p className="text-muted-foreground">Confirm deletion of employee</p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-red-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Are you sure you want to delete this employee?
            </h2>
            <p className="text-muted-foreground mb-4">
              This action cannot be undone. All data associated with this employee will be permanently deleted.
            </p>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md mb-6">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-foreground">Name:</span>{' '}
              <span className="text-muted-foreground">{employee.full_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Email:</span>{' '}
              <span className="text-muted-foreground">{employee.email}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Username:</span>{' '}
              <span className="text-muted-foreground">{employee.username}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Department:</span>{' '}
              <span className="text-muted-foreground">{employee.department || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Status:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs ${
                employee.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => router.push('/employees/list')}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Employee
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

