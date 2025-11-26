'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema, type CreateProjectInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

export default function CreateProjectPage() {
  const router = useRouter();
  const { allUsers } = useUserStore();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<any>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      assignedUsers: [],
    },
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await apiClient.getDepartments();
      setDepartments(response.data || []);
    } catch (err: any) {
      console.error('Failed to load departments:', err);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Format dates for API
      const startDate = new Date(data.startDate).toISOString();
      const endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
      
      const projectData = {
        name: data.name,
        description: data.description || null,
        department_id: data.departmentId ? parseInt(data.departmentId) : null,
        assigned_users: selectedUsers.map(id => parseInt(id)),
        budget: data.budget || null,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      };

      await apiClient.createProject(projectData);
      setSuccess('Project created successfully!');
      toast.success('Project created successfully!');
      reset();
      setSelectedUsers([]);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/project/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create project';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/project/list"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <FolderKanban className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Create Project</h1>
        </div>
        <p className="text-muted-foreground">Add a new project</p>
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

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Website Redesign"
              disabled={loading}
              className="mt-1"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{String(errors.name.message || '')}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Project description"
              disabled={loading}
              className="mt-1"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{String(errors.description.message || '')}</p>
            )}
          </div>

          <div>
            <Label htmlFor="departmentId">Department *</Label>
            <select
              id="departmentId"
              {...register('departmentId')}
              disabled={loading}
              className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-600">{String(errors.departmentId.message || '')}</p>
            )}
          </div>

          <div>
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              {...register('budget', { valueAsNumber: true })}
              placeholder="0.00"
              disabled={loading}
              className="mt-1"
            />
            {errors.budget && (
              <p className="mt-1 text-sm text-red-600">{String(errors.budget.message || '')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                disabled={loading}
                className="mt-1"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{String(errors.startDate.message || '')}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                disabled={loading}
                className="mt-1"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{String(errors.endDate.message || '')}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Assigned Users</Label>
            <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {allUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users available</p>
              ) : (
                allUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      disabled={loading}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {(user as any).full_name || user.email} ({user.role})
                    </label>
                  </div>
                ))
              )}
            </div>
            {errors.assignedUsers && (
                <p className="mt-1 text-sm text-red-600">{String(errors.assignedUsers.message || '')}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/project/list')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
