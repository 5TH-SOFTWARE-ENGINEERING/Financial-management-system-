'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
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

// ──────────────────────────────────────────
// Styled Components
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: #f5f6fa;
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: var(--card);
  border-right: 1px solid var(--border);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: auto;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding-left: 250px;
  display: flex;
  flex-direction: column;
`;

const InnerContent = styled.div`
  padding: 32px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-between;
  align-items: center;
  margin-bottom: 24px;
`;

const HeaderText = styled.div`
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  p {
    color: var(--muted-foreground);
  }
`;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;

  background: ${(p) => (p.type === 'error' ? '#fee2e2' : '#d1fae5')};
  border: 1px solid ${(p) => (p.type === 'error' ? '#fecaca' : '#a7f3d0')};
  color: ${(p) => (p.type === 'error' ? '#991b1b' : '#065f46')};
`;

const Card = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 20px;
`;

const FormCard = styled.form`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FiltersCard = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted-foreground);
  }
  
  input {
    padding-left: 40px;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: var(--foreground);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  
  svg {
    margin: 0 auto 16px;
    color: var(--muted-foreground);
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--foreground);
  }
  
  p {
    color: var(--muted-foreground);
    margin-bottom: 16px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  border-bottom: 1px solid var(--border);
  background: var(--muted);
  
  th {
    text-align: left;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--foreground);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid var(--border);
    transition: background-color 0.2s;
    
    &:hover {
      background: var(--muted);
    }
    
    td {
      padding: 12px 16px;
      color: var(--muted-foreground);
      font-size: 14px;
    }
  }
`;

const TypeBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #dbeafe;
  color: #1e40af;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${(p) => {
    switch (p.status) {
      case 'completed': return '#d1fae5';
      case 'failed': return '#fee2e2';
      case 'generating': return '#dbeafe';
      case 'scheduled': return '#fef3c7';
      default: return '#f3f4f6';
    }
  }};
  color: ${(p) => {
    switch (p.status) {
      case 'completed': return '#065f46';
      case 'failed': return '#991b1b';
      case 'generating': return '#1e40af';
      case 'scheduled': return '#92400e';
      default: return '#374151';
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  label {
    cursor: pointer;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const LoadingContainer = styled.div`
  padding: 32px;
  text-align: center;
  
  p {
    color: var(--muted-foreground);
    margin-top: 16px;
  }
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatusIconWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

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
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <InnerContent>
            <EmptyState>
              <p>Please log in to view reports</p>
            </EmptyState>
          </InnerContent>
        </ContentArea>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <ContentArea>
        <Navbar />

        <InnerContent>
          <Header>
            <HeaderText>
              <h1>Reports</h1>
              <p>Generate and manage financial reports</p>
            </HeaderText>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showCreateForm ? 'Cancel' : 'Create Report'}
            </Button>
          </Header>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </MessageBox>
          )}

          {/* Create Report Form */}
          {showCreateForm && (
            <Card>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Create New Report</h2>
              <FormCard onSubmit={handleCreateReport}>
                <FormGroup>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Monthly Financial Summary"
                    required
                    disabled={creating}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    disabled={creating}
                    rows={2}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="type">Report Type *</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    disabled={creating}
                  >
                    <option value="">Select report type</option>
                    {availableTypes.map((type) => (
                      <option key={type.type} value={type.type}>
                        {type.name} - {type.description}
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="parameters">Parameters (JSON, Optional)</Label>
                  <Textarea
                    id="parameters"
                    value={formData.parameters}
                    onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                    placeholder='{"start_date": "2024-01-01", "end_date": "2024-01-31"}'
                    disabled={creating}
                    style={{ fontFamily: 'monospace', fontSize: '14px' }}
                    rows={3}
                  />
                </FormGroup>

                <CheckboxWrapper>
                  <input
                    id="is_public"
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    disabled={creating}
                  />
                  <Label htmlFor="is_public">Make this report public (visible to managers)</Label>
                </CheckboxWrapper>

                <ButtonRow>
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
                </ButtonRow>
              </FormCard>
            </Card>
          )}

          {/* Filters */}
          <FiltersCard>
            <SearchWrapper>
              <Filter size={16} />
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {availableTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.name}
                </option>
              ))}
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="generating">Generating</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </Select>
          </FiltersCard>

          {/* Reports List */}
          {loading ? (
            <Card>
              <LoadingContainer>
                <Spinner />
                <p>Loading reports...</p>
              </LoadingContainer>
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card>
              <EmptyState>
                <FileText size={48} />
                <h3>No reports found</h3>
                <p>
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
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Downloads</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                            {report.title}
                          </div>
                          {report.description && (
                            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {report.description}
                            </div>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <TypeBadge>{report.type.replace('_', ' ')}</TypeBadge>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <StatusIconWrapper>
                            {getStatusIcon(report.status)}
                            <StatusBadge status={report.status}>
                              {report.status}
                            </StatusBadge>
                          </StatusIconWrapper>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(report.created_at)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{report.download_count || 0}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <ActionButtons>
                            {report.status === 'completed' && report.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(report.id)}
                                style={{ height: '32px', width: '32px', padding: 0 }}
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
                                style={{ height: '32px', width: '32px', padding: 0 }}
                                title="Regenerate"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                              style={{ height: '32px', width: '32px', padding: 0, color: 'var(--destructive)' }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ActionButtons>
                        </td>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}
