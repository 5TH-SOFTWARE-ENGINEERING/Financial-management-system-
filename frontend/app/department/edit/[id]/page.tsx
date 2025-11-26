'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDepartmentSchema, type CreateDepartmentInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.id ? parseInt(params.id as string, 10) : null;
  const { allUsers, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDepartmentInput>({
    resolver: zodResolver(CreateDepartmentSchema),
  });

  useEffect(() => {
    if (departmentId) {
      loadDepartment();
      fetchAllUsers();
    }
  }, [departmentId]);

  const loadDepartment = async () => {
    if (!departmentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getDepartment(departmentId);
      const department = response.data;
      
      reset({
        name: department.name || '',
        description: department.description || '',
        managerId: department.manager_id?.toString() || '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load department';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateDepartmentInput) => {
    if (!departmentId) return;

    setSubmitting(true);
    setError(null);

    try {
      const departmentData = {
        name: data.name,
        description: data.description || null,
        manager_id: data.managerId ? parseInt(data.managerId, 10) : null,
      };

      await apiClient.updateDepartment(departmentId, departmentData);
      toast.success('Department updated successfully!');
      router.push('/department/list');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update department';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter managers from all users
  const managers = allUsers.filter(
    user => user.role === 'admin' || user.role === 'finance_manager'
  );

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
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Edit Department</h1>
        </div>
        <p className="text-muted-foreground">Update department information</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Finance, HR, IT"
              disabled={submitting}
              className="mt-1"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the department"
              disabled={submitting}
              className="mt-1"
              rows={4}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="managerId">Manager</Label>
            <select
              id="managerId"
              {...register('managerId')}
              disabled={submitting}
              className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a manager (optional)</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.email})
                </option>
              ))}
            </select>
            {errors.managerId && (
              <p className="mt-1 text-sm text-red-600">{errors.managerId.message}</p>
            )}
            {managers.length === 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                No managers available. Create a manager user first.
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/department/list')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Department'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

