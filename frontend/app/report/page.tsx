'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Download, 
  RefreshCw, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Report {
  id: number;
  title: string;
  description?: string | null;
  type: string;
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  file_url?: string | null;
  file_size?: number | null;
  created_at: string;
  generated_at?: string | null;
  download_count: number;
  is_public: boolean;
}

interface ReportType {
  type: string;
  name: string;
  description: string;
}

export default function ReportPage() {
  const { user, isAuthenticated } = useUserStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [availableTypes, setAvailableTypes] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    parameters: '',
    is_public: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
      loadAvailableTypes();
    }
  }, [isAuthenticated]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: Record<string, any> = {};
      if (filterType !== 'all') filters.report_type = filterType;
      if (filterStatus !== 'all') filters.status = filterStatus;
      
      const response = await apiClient.getReports(filters);
      setReports(response.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTypes = async () => {
    try {
      const response = await apiClient.getAvailableReportTypes();
      setAvailableTypes(response.data?.report_types || []);
    } catch (err: any) {
      console.error('Failed to load available report types:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
    }
  }, [filterType, filterStatus, isAuthenticated]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const reportData = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        parameters: formData.parameters || null,
        is_public: formData.is_public,
      };

      await apiClient.createReport(reportData);
      toast.success('Report generation started!');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        type: '',
        parameters: '',
        is_public: false,
      });
      loadReports();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create report';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (reportId: number) => {
    try {
      const response = await apiClient.downloadReport(reportId);
      const { download_url, filename } = response.data;
      
      // Open download URL in new tab
      window.open(download_url, '_blank');
      toast.success('Report download started');
      loadReports(); // Refresh to update download count
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to download report';
      toast.error(errorMessage);
    }
  };

  const handleRegenerate = async (reportId: number) => {
    try {
      await apiClient.regenerateReport(reportId);
      toast.success('Report regeneration started');
      loadReports();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to regenerate report';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await apiClient.deleteReport(reportId);
      toast.success('Report deleted successfully');
      loadReports();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete report';
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Generate and manage financial reports</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Cancel' : 'Create Report'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Create Report Form */}
      {showCreateForm && (
        <div className="mb-6 bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Create New Report</h2>
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Monthly Financial Summary"
                required
                disabled={creating}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                disabled={creating}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="type">Report Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                disabled={creating}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select report type</option>
                {availableTypes.map((type) => (
                  <option key={type.type} value={type.type}>
                    {type.name} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="parameters">Parameters (JSON, Optional)</Label>
              <Textarea
                id="parameters"
                value={formData.parameters}
                onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                placeholder='{"start_date": "2024-01-01", "end_date": "2024-01-31"}'
                disabled={creating}
                className="mt-1 font-mono text-sm"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="is_public"
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                disabled={creating}
                className="h-4 w-4"
              />
              <Label htmlFor="is_public" className="cursor-pointer">
                Make this report public (visible to managers)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Report'
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Types</option>
          {availableTypes.map((type) => (
            <option key={type.type} value={type.type}>
              {type.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="generating">Generating</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No reports found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'No reports match your filters'
              : 'Get started by creating your first report'}
          </p>
          {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Downloads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{report.title}</div>
                      {report.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {report.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {report.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {report.download_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {report.status === 'completed' && report.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.id)}
                            className="h-8 w-8 p-0"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {report.status !== 'generating' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerate(report.id)}
                            className="h-8 w-8 p-0"
                            title="Regenerate"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
