'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  LineChart, FileText, Plus, Edit, Trash2, Calendar,
  TrendingUp, TrendingDown, AlertCircle, Filter, Search,
  BarChart3, Target, Activity
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = '#e8f5e9';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%)`;

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl} clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl});
  margin-bottom: ${theme.spacing.xl};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const FiltersContainer = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.xl};
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;
`;

const ForecastsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const ForecastCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  transition: all ${theme.transitions.default};
  cursor: pointer;
  
  &:hover {
    box-shadow: ${CardShadowHover};
    transform: translateY(-2px);
    border-color: ${PRIMARY_COLOR};
  }
`;

const ForecastHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    flex: 1;
  }
`;

const MethodBadge = styled.span<{ $method: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => {
    switch (props.$method) {
      case 'moving_average': return '#dbeafe';
      case 'linear_growth': return '#d1fae5';
      case 'trend': return '#fef3c7';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$method) {
      case 'moving_average': return '#1e40af';
      case 'linear_growth': return '#065f46';
      case 'trend': return '#92400e';
      default: return '#6b7280';
    }
  }};
  text-transform: capitalize;
`;

const ForecastMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
`;

const ForecastInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${PRIMARY_LIGHT};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.md};
`;

const InfoItem = styled.div`
  text-align: center;
  
  .label {
    font-size: ${theme.typography.fontSizes.xs};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.xs};
  }
  
  .value {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
  }
`;

const ForecastActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface Forecast {
  id: number;
  name: string;
  description?: string;
  forecast_type: string;
  period_type: string;
  start_date: string;
  end_date: string;
  method: string;
  method_params?: any;
  forecast_data?: any[];
  created_at: string;
}

const ForecastListPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getForecasts();
      setForecasts(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this forecast?')) return;
    
    try {
      // Note: Delete endpoint may need to be added to API
      await apiClient.deleteForecast(id);
      toast.success('Forecast deleted successfully');
      loadForecasts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete forecast');
    }
  };

  const filteredForecasts = forecasts.filter(forecast => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !forecast.name.toLowerCase().includes(query) &&
        !forecast.description?.toLowerCase().includes(query) &&
        !forecast.forecast_type.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedType && forecast.forecast_type !== selectedType) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getForecastTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <TrendingUp size={20} />;
      case 'expense': return <TrendingDown size={20} />;
      case 'profit': return <BarChart3 size={20} />;
      default: return <Activity size={20} />;
    }
  };

  const getForecastSummary = (forecast: Forecast) => {
    if (!forecast.forecast_data || !Array.isArray(forecast.forecast_data)) {
      return { count: 0, total: 0, average: 0 };
    }
    
    const values = forecast.forecast_data.map((item: any) => item.forecasted_value || 0);
    const total = values.reduce((sum: number, val: number) => sum + val, 0);
    const average = values.length > 0 ? total / values.length : 0;
    
    return {
      count: values.length,
      total: total,
      average: average
    };
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading forecasts...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>
                  <LineChart size={36} />
                  Financial Forecasts
                </h1>
                <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
                  Generate and manage forecasts for future financial activities
                </p>
              </div>
              <Button
                onClick={() => router.push('/forecast/create')}
                style={{ background: 'white', color: PRIMARY_COLOR }}
              >
                <Plus size={16} />
                New Forecast
              </Button>
            </HeaderContent>
          </HeaderContainer>

          <FiltersContainer>
            <Search size={20} color={TEXT_COLOR_MUTED} />
            <Input
              type="text"
              placeholder="Search forecasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, maxWidth: '300px' }}
            />
            <Filter size={20} color={TEXT_COLOR_MUTED} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="profit">Profit</option>
              <option value="all">All</option>
            </select>
          </FiltersContainer>

          {filteredForecasts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
              <LineChart size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No forecasts found. Create your first forecast to get started.</p>
            </div>
          ) : (
            <ForecastsGrid>
              {filteredForecasts.map((forecast) => {
                const summary = getForecastSummary(forecast);
                return (
                  <ForecastCard
                    key={forecast.id}
                    onClick={() => router.push(`/forecast/${forecast.id}`)}
                  >
                    <ForecastHeader>
                      <h3>{forecast.name}</h3>
                      <MethodBadge $method={forecast.method}>
                        {forecast.method.replace('_', ' ')}
                      </MethodBadge>
                    </ForecastHeader>
                    
                    <ForecastMeta>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                        {getForecastTypeIcon(forecast.forecast_type)}
                        <span style={{ textTransform: 'capitalize' }}>{forecast.forecast_type}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                        <Calendar size={14} />
                        <span>
                          {formatDate(forecast.start_date)} - {formatDate(forecast.end_date)}
                        </span>
                      </div>
                      {forecast.description && (
                        <p style={{ margin: 0, fontSize: theme.typography.fontSizes.xs }}>
                          {forecast.description}
                        </p>
                      )}
                    </ForecastMeta>

                    <ForecastInfo>
                      <InfoItem>
                        <div className="label">Period Type</div>
                        <div className="value" style={{ textTransform: 'capitalize' }}>
                          {forecast.period_type}
                        </div>
                      </InfoItem>
                      <InfoItem>
                        <div className="label">Data Points</div>
                        <div className="value">{summary.count}</div>
                      </InfoItem>
                      {summary.count > 0 && (
                        <>
                          <InfoItem>
                            <div className="label">Total Forecast</div>
                            <div className="value">
                              ${summary.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </InfoItem>
                          <InfoItem>
                            <div className="label">Average</div>
                            <div className="value">
                              ${summary.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </InfoItem>
                        </>
                      )}
                    </ForecastInfo>

                    <ForecastActions onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/forecast/${forecast.id}`);
                        }}
                      >
                        <FileText size={14} />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(forecast.id)}
                        style={{ color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </ForecastActions>
                  </ForecastCard>
                );
              })}
            </ForecastsGrid>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ForecastListPage;

