'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterSchema } from '@/lib/validation';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { CheckCircle, AlertCircle, ArrowLeft, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type FormData = z.infer<typeof RegisterSchema>;

export default function CreateEmployeePage() {
  const router = useRouter();
  const { createUser, fetchAllUsers } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { 
      role: 'EMPLOYEE' as const,
      full_name: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      department: '',
      managerId: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Map form data to API format
      const userData = {
        full_name: data.full_name,
        email: data.email,
        username: data.username,
        password: data.password,
        role: 'employee', // Backend expects lowercase
        phone: data.phone || null,
        department: data.department || null,
        manager_id: data.managerId ? parseInt(data.managerId, 10) : null,
      };
      
      await apiClient.createUser(userData);
      await createUser(userData); // Update store
      await fetchAllUsers(); // Refresh user list
      
      setSuccess('Employee created successfully!');
      reset();
      toast.success('Employee created successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/employees/list');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to create employee';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Create Employee</h1>
        </div>
        <p className="text-muted-foreground">Add a new employee to your organization</p>
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
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" {...register('full_name')} disabled={loading} className="mt-1" />
            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} disabled={loading} className="mt-1" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="username">Username *</Label>
            <Input id="username" {...register('username')} disabled={loading} className="mt-1" />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" {...register('password')} disabled={loading} className="mt-1" />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input id="phone" {...register('phone')} disabled={loading} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="department">Department (Optional)</Label>
            <Input id="department" {...register('department')} disabled={loading} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="managerId">Manager ID (Optional)</Label>
            <Input 
              id="managerId" 
              type="number" 
              {...register('managerId')} 
              disabled={loading} 
              className="mt-1"
              placeholder="Enter manager user ID"
            />
            {errors.managerId && <p className="text-red-500 text-sm mt-1">{errors.managerId.message}</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => router.push('/employees/list')}
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
                'Create Employee'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
