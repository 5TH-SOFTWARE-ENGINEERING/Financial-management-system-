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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';

export default function CreateDepartmentPage() {
  const router = useRouter();
  const { allUsers, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDepartmentInput>({
    resolver: zodResolver(CreateDepartmentSchema),
  });

  // Fetch users for manager selection
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const onSubmit = async (data: CreateDepartmentInput) => {
    setLoading(true);
    setError(null);

    try {
      const departmentData = {
        name: data.name,
        description: data.description || null,
        manager_id: data.managerId ? parseInt(data.managerId, 10) : null,
      };

      const response = await apiClient.createDepartment(departmentData);
      toast.success('Department created successfully!');
      reset();
      router.push('/department/list');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create department';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter managers from all users
  const managers = allUsers.filter(
    user => user.role === 'admin' || user.role === 'finance_manager'
  );

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
          <h1 className="text-3xl font-bold text-foreground">Create Department</h1>
        </div>
        <p className="text-muted-foreground">Add a new department to your organization</p>
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Department'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
