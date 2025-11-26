'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, FolderKanban, Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${(p) => (p.active ? '#d1fae5' : '#f3f4f6')};
  color: ${(p) => (p.active ? '#065f46' : '#374151')};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
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

interface Project {
  id: number;
  name: string;
  description?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  assigned_users?: number[] | null;
  assigned_users_names?: string[] | null;
  budget?: number | null;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export default function ProjectListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
    loadDepartments();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getProjects();
      setProjects(response.data || []);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Project API endpoint not yet implemented. Please implement backend endpoints.');
        setProjects([]);
      } else {
        setError(err.response?.data?.detail || 'Failed to load projects');
        toast.error('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.getDepartments();
      setDepartments(response.data || []);
    } catch (err: any) {
      console.error('Failed to load departments:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteProject(id);
      toast.success('Project deleted successfully');
      loadProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete project');
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.department_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || 
      project.department_id?.toString() === departmentFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && project.is_active) ||
      (statusFilter === 'inactive' && !project.is_active);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  if (loading) {
    return (
      <LayoutWrapper>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentArea>
          <Navbar />
          <LoadingContainer>
            <Spinner />
            <p>Loading projects...</p>
          </LoadingContainer>
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
              <h1>Projects</h1>
              <p>Manage your projects</p>
            </HeaderText>
            <Link href="/project/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </Link>
          </Header>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </MessageBox>
          )}

          <FiltersCard>
            <SearchWrapper>
              <Search size={16} />
              <Input
                type="text"
                placeholder="Search by name, description, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FiltersCard>

          <Card>
            {filteredProjects.length === 0 ? (
              <EmptyState>
                <FolderKanban size={48} />
                <h3>No projects</h3>
                <p>
                  {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                    ? 'No projects match your filters'
                    : 'Get started by adding your first project'}
                </p>
                {!searchTerm && departmentFilter === 'all' && statusFilter === 'all' && (
                  <Link href="/project/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </Link>
                )}
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Budget</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                            {project.name}
                          </div>
                          {project.description && (
                            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {project.description}
                            </div>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{project.department_name || '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {project.budget ? (
                            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                              ${project.budget.toLocaleString()}
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(project.start_date)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {project.end_date ? formatDate(project.end_date) : '-'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <StatusBadge active={project.is_active}>
                            {project.is_active ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <ActionButtons>
                            <Link href={`/project/edit/${project.id}`}>
                              <Button variant="ghost" size="sm" style={{ height: '32px', width: '32px', padding: 0 }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ height: '32px', width: '32px', padding: 0, color: 'var(--destructive)' }}
                              onClick={() => handleDelete(project.id)}
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
            )}
          </Card>
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

