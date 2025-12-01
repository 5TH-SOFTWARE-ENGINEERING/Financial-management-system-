'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  LineChart, ArrowLeft, Calendar, TrendingUp, TrendingDown,
  BarChart3, Activity, FileText, AlertCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

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

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
  padding: ${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.sm};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  text-decoration: none;
  margin-bottom: ${theme.spacing.md};
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const InfoCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  
  &:last-child {
    margin-bottom: 0;
  }
  
  strong {
    color: ${TEXT_COLOR_DARK};
    min-width: 150px;
  }
`;

const MethodBadge = styled.span<{ $method: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.sm};
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

const ForecastDataCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const ForecastTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${theme.spacing.md};
  
  th {
    text-align: left;
    padding: ${theme.spacing.md};
    background: ${PRIMARY_LIGHT};
    font-weight: ${theme.typography.fontWeights.medium};
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
    border-bottom: 2px solid ${theme.colors.border};
  }
  
  td {
    padding: ${theme.spacing.md};
    border-bottom: 1px solid ${theme.colors.border};
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
  }
  
  tr:hover {
    background: ${PRIMARY_LIGHT};
  }
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
  historical_start_date?: string;
  historical_end_date?: string;
  forecast_data?: any[];
  created_at: string;
}

const ForecastDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  const forecastId = params?.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (forecastId) {
      loadForecast();
    }
  }, [forecastId]);

  const loadForecast = async () => {
    if (!forecastId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getForecast(forecastId);
      const forecastData = response.data as any;
      
      // Parse JSON fields if they're strings
      if (typeof forecastData.forecast_data === 'string') {
        forecastData.forecast_data = JSON.parse(forecastData.forecast_data);
      }
      if (typeof forecastData.method_params === 'string') {
        forecastData.method_params = JSON.parse(forecastData.method_params);
      }
      
      setForecast(forecastData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load forecast');
      router.push('/forecast/list');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getForecastTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <TrendingUp size={20} />;
      case 'expense': return <TrendingDown size={20} />;
      case 'profit': return <BarChart3 size={20} />;
      default: return <Activity size={20} />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading forecast...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (!forecast) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', color: TEXT_COLOR_MUTED }} />
              <p>Forecast not found</p>
              <Button onClick={() => router.push('/forecast/list')} style={{ marginTop: theme.spacing.md }}>
                Back to Forecasts
              </Button>
            </div>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  const forecastDataArray = forecast.forecast_data && Array.isArray(forecast.forecast_data) 
    ? forecast.forecast_data 
    : [];

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href="/forecast/list">
            <ArrowLeft size={16} />
            Back to Forecasts
          </BackLink>

          <HeaderContainer>
            <HeaderContent>
              <div style={{ flex: 1 }}>
                <h1>
                  <LineChart size={36} />
                  {forecast.name}
                </h1>
                <div style={{ marginTop: theme.spacing.sm, display: 'flex', gap: theme.spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
                  <MethodBadge $method={forecast.method}>
                    {forecast.method.replace('_', ' ')}
                  </MethodBadge>
                  {forecast.description && (
                    <p style={{ margin: 0, opacity: 0.9, fontSize: theme.typography.fontSizes.md }}>
                      {forecast.description}
                    </p>
                  )}
                </div>
              </div>
            </HeaderContent>
          </HeaderContainer>

          <InfoCard>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.lg }}>Forecast Information</h3>
            <InfoRow>
              <strong>Forecast Type:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                {getForecastTypeIcon(forecast.forecast_type)}
                <span style={{ textTransform: 'capitalize' }}>{forecast.forecast_type}</span>
              </div>
            </InfoRow>
            <InfoRow>
              <strong>Period Type:</strong>
              <span style={{ textTransform: 'capitalize' }}>{forecast.period_type}</span>
            </InfoRow>
            <InfoRow>
              <strong>Start Date:</strong>
              <span>{formatDate(forecast.start_date)}</span>
            </InfoRow>
            <InfoRow>
              <strong>End Date:</strong>
              <span>{formatDate(forecast.end_date)}</span>
            </InfoRow>
            {forecast.historical_start_date && (
              <InfoRow>
                <strong>Historical Start:</strong>
                <span>{formatDate(forecast.historical_start_date)}</span>
              </InfoRow>
            )}
            {forecast.historical_end_date && (
              <InfoRow>
                <strong>Historical End:</strong>
                <span>{formatDate(forecast.historical_end_date)}</span>
              </InfoRow>
            )}
            <InfoRow>
              <strong>Method Parameters:</strong>
              <span>
                {forecast.method_params && typeof forecast.method_params === 'object' 
                  ? JSON.stringify(forecast.method_params, null, 2)
                  : 'None'
                }
              </span>
            </InfoRow>
            <InfoRow>
              <strong>Created:</strong>
              <span>{formatDate(forecast.created_at)}</span>
            </InfoRow>
          </InfoCard>

          <ForecastDataCard>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md }}>Forecast Data</h3>
            {forecastDataArray.length === 0 ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No forecast data available.</p>
              </div>
            ) : (
              <>
                <ForecastTable>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Date</th>
                      <th>Forecasted Value</th>
                      {forecastDataArray[0]?.method && <th>Method</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {forecastDataArray.map((item: any, index: number) => (
                      <tr key={index}>
                        <td>{item.period || '-'}</td>
                        <td>{item.date ? formatDate(item.date) : '-'}</td>
                        <td style={{ fontWeight: theme.typography.fontWeights.bold }}>
                          {formatCurrency(item.forecasted_value || 0)}
                        </td>
                        {item.method && (
                          <td>
                            <span style={{ textTransform: 'capitalize' }}>
                              {item.method.replace('_', ' ')}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </ForecastTable>
                
                <div style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md, background: PRIMARY_LIGHT, borderRadius: theme.borderRadius.sm }}>
                  <strong>Total Forecast: </strong>
                  {formatCurrency(forecastDataArray.reduce((sum: number, item: any) => sum + (item.forecasted_value || 0), 0))}
                  <br />
                  <strong>Average per Period: </strong>
                  {formatCurrency(forecastDataArray.length > 0 
                    ? forecastDataArray.reduce((sum: number, item: any) => sum + (item.forecasted_value || 0), 0) / forecastDataArray.length
                    : 0
                  )}
                  <br />
                  <strong>Number of Periods: </strong>
                  {forecastDataArray.length}
                </div>
              </>
            )}
          </ForecastDataCard>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ForecastDetailPage;

