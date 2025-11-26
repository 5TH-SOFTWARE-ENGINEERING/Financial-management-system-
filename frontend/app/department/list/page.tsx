'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Department {
  id: number;
  name: string;
  description?: string | null;
  manager_id?: number | null;
  manager_name?: string | null;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DepartmentListPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getDepartments();
      setDepartments(response.data || []);
    } catch (err: any) {
      // If endpoint doesn't exist yet, show empty state with helpful message
      if (err.response?.status === 404) {
        setError('Department API endpoint not yet implemented. Please implement backend endpoints.');
        setDepartments([]);
      } else {
        setError(err.response?.data?.detail || 'Failed to load departments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteDepartment(id);
      toast.success('Department deleted successfully');
      loadDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete department');
    }
  };


  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage organizational departments</p>
        </div>
        <Link href="/department/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Department
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        {departments.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No departments found.</p>
            <Link href="/department/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Department
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Manager</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Employees</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{dept.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {dept.description || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {dept.manager_name || 'Not assigned'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {dept.employee_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {dept.created_at 
                        ? new Date(dept.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link href={`/department/edit/${dept.id}`}>
                          <Button size="sm" variant="secondary">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(dept.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

