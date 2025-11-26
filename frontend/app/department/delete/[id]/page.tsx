'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Department {
  id: number;
  name: string;
  description?: string | null;
  manager_id?: number | null;
}

export default function DeleteDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    if (departmentId) {
      loadDepartment();
    }
  }, [departmentId]);

  const loadDepartment = async () => {
    if (!departmentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getDepartment(departmentId);
      setDepartment(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load department';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!departmentId || !department) return;

    if (!confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteDepartment(departmentId);
      toast.success('Department deleted successfully!');
      router.push('/department/list');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete department';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading department...</p>
        </div>
      </div>
    );
  }

  if (error && !department) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/department/list"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Departments
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/department/list"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Departments
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-foreground">Delete Department</h1>
        </div>
        <p className="text-muted-foreground">Confirm deletion of department</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-red-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Are you sure you want to delete this department?
            </h2>
            <p className="text-muted-foreground mb-4">
              This action cannot be undone. All associated data may be affected.
            </p>
          </div>
        </div>

        {department && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <div className="space-y-2">
              <div>
                <span className="font-medium text-foreground">Name:</span>{' '}
                <span className="text-muted-foreground">{department.name}</span>
              </div>
              {department.description && (
                <div>
                  <span className="font-medium text-foreground">Description:</span>{' '}
                  <span className="text-muted-foreground">{department.description}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/department/list')}
            disabled={deleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Department
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

