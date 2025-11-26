'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, FolderKanban, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Project {
  id: number;
  name: string;
  description?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  assigned_users?: number[] | null;
  budget?: number | null;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
}

export default function DeleteProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id ? parseInt(params.id as string, 10) : null;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getProjects();
      const projects = response.data || [];
      const foundProject = projects.find((p: any) => p.id === projectId);
      
      if (!foundProject) {
        setError('Project not found');
        return;
      }

      setProject(foundProject);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load project';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !project) return;

    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiClient.deleteProject(projectId);
      toast.success('Project deleted successfully!');
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/project/list');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete project';
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
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
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
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2 text-red-700">
          <AlertTriangle size={16} />
          <span>{error || 'Project not found'}</span>
        </div>
      </div>
    );
  }

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
          <FolderKanban className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-foreground">Delete Project</h1>
        </div>
        <p className="text-muted-foreground">Confirm deletion of project</p>
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
              Are you sure you want to delete this project?
            </h2>
            <p className="text-muted-foreground mb-4">
              This action cannot be undone. All data associated with this project will be permanently deleted.
            </p>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md mb-6">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-foreground">Name:</span>{' '}
              <span className="text-muted-foreground">{project.name}</span>
            </div>
            {project.description && (
              <div>
                <span className="font-medium text-foreground">Description:</span>{' '}
                <span className="text-muted-foreground">{project.description}</span>
              </div>
            )}
            {project.department_name && (
              <div>
                <span className="font-medium text-foreground">Department:</span>{' '}
                <span className="text-muted-foreground">{project.department_name}</span>
              </div>
            )}
            {project.budget && (
              <div>
                <span className="font-medium text-foreground">Budget:</span>{' '}
                <span className="text-muted-foreground font-semibold">{formatCurrency(project.budget)}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Start Date:</span>{' '}
              <span className="text-muted-foreground">{formatDate(project.start_date)}</span>
            </div>
            {project.end_date && (
              <div>
                <span className="font-medium text-foreground">End Date:</span>{' '}
                <span className="text-muted-foreground">{formatDate(project.end_date)}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Status:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs ${
                project.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {project.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/project/list')}
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
                Delete Project
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

