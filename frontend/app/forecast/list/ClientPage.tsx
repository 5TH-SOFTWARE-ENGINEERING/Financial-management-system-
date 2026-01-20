'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  LineChart, FileText, Plus, Edit, Trash2, Calendar,
  TrendingUp, TrendingDown, Filter, Search,
  BarChart3, Activity, Loader2, Eye, EyeOff, Lock, XCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/rbac/auth-context';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = (props: any) => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.1)' : '#e8f5e9';
const TEXT_COLOR_DARK =theme.colors.textDark || '#000000';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = (props: any) => props.theme.mode === 'dark' ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${props.theme.colors.background} 100%)` : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${props.theme.colors.background} 100%)`;

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
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${theme.spacing.md};
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
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
      case 'arima': return '#e0e7ff';
      case 'prophet': return '#fce7f3';
      case 'xgboost': return '#dbeafe';
      case 'lstm': return '#e0e7ff';
      case 'linear_regression': return '#fef3c7';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$method) {
      case 'moving_average': return '#1e40af';
      case 'linear_growth': return '#065f46';
      case 'trend': return '#92400e';
      case 'arima': return '#4338ca';
      case 'prophet': return '#be185d';
      case 'xgboost': return '#1e40af';
      case 'lstm': return '#4338ca';
      case 'linear_regression': return '#92400e';
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

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    
    &:hover {
      background: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_DARK};
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const WarningBox = styled.div`
  padding: ${theme.spacing.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  
  p {
    margin: 0;
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  margin-bottom: ${theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    padding-right: 48px;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    background: ${theme.colors.background};
    font-size: ${theme.typography.fontSizes.md};
    color: ${TEXT_COLOR_DARK};
    transition: all ${theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
    
    &::placeholder {
      color: ${TEXT_COLOR_MUTED};
      opacity: 0.5;
    }
    
    &:disabled {
      background-color: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_MUTED};
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
  
  button {
    position: absolute;
    right: ${theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${theme.transitions.default};
    
    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg};
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
  method_params?: Record<string, unknown>;
  forecast_data?: ForecastDataPoint[];
  created_at: string;
}

interface ForecastRaw extends Omit<Forecast, 'forecast_data' | 'method_params'> {
  method_params?: Record<string, unknown> | string | null;
  forecast_data?: ForecastDataPoint[] | string | null;
}

interface ForecastDataPoint {
  forecasted_value?: number;
  [key: string]: unknown;
}

const ForecastListPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getForecasts();
      // Handle both axios response format and direct response
      const responseData = response?.data || response;
      const forecastsData: ForecastRaw[] = Array.isArray(responseData) ? (responseData as ForecastRaw[]) : [];
      
      // Parse JSON fields if they're strings
      const parsedForecasts: Forecast[] = forecastsData.map((forecast) => {
        const forecastClone: ForecastRaw = { ...forecast };

        if (typeof forecast.forecast_data === 'string') {
          try {
            forecastClone.forecast_data = JSON.parse(forecast.forecast_data) as ForecastDataPoint[];
          } catch {
            forecastClone.forecast_data = [];
          }
        } else if (Array.isArray(forecast.forecast_data)) {
          forecastClone.forecast_data = forecast.forecast_data;
        }
        if (typeof forecast.method_params === 'string') {
          try {
              forecastClone.method_params = JSON.parse(forecast.method_params) as Record<string, unknown>;
          } catch {
            forecastClone.method_params = {};
          }
        } else if (forecast.method_params) {
          forecastClone.method_params = forecast.method_params;
        }
        return forecastClone as Forecast;
      });
      
      setForecasts(parsedForecasts);
    } catch (error: unknown) {
      const errorMessage =
        (typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (error instanceof Error ? error.message : 'Failed to load forecasts');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use login endpoint to verify password
      const identifier = user.email || '';
      await apiClient.request({
        method: 'POST',
        url: '/auth/login-json',
        data: {
          username: identifier,
          password: password
        }
      });
      return true;
    } catch (err: unknown) {
      // If login fails, password is incorrect
      return false;
    }
  };

  const handleDeleteClick = (id: number) => {
    setShowDeleteModal(id);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(null);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async (id: number, password: string) => {
    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);

    try {
      // First verify password
      const isValid = await verifyPassword(password.trim());
      
      if (!isValid) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setVerifyingPassword(false);
        return;
      }

      // Password is correct, proceed with deletion
      setDeletingId(id);
      await apiClient.deleteForecast(id, password.trim());
      toast.success('Forecast deleted successfully');
      setShowDeleteModal(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadForecasts();
    } catch (error: unknown) {
      const errorMessage =
        (typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (error instanceof Error ? error.message : 'Failed to delete forecast');
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
      setVerifyingPassword(false);
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
    
    const values = forecast.forecast_data.map((item: ForecastDataPoint) => item.forecasted_value || 0);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, position: 'relative' }}>
              <Search size={20} color={TEXT_COLOR_MUTED} style={{ position: 'absolute', left: '12px', zIndex: 1 }} />
              <StyledInput
                type="text"
                placeholder="Search forecasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <Filter size={20} color={TEXT_COLOR_MUTED} />
              <StyledSelect
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="profit">Profit</option>
                <option value="all">All</option>
              </StyledSelect>
            </div>
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
                        {forecast.method.replace(/_/g, ' ')}
                        {(forecast.method === 'arima' || forecast.method === 'prophet' || 
                          forecast.method === 'xgboost' || forecast.method === 'lstm' || 
                          forecast.method === 'linear_regression') && ' (AI)'}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/forecast/${forecast.id}/edit`);
                        }}
                      >
                        <Edit size={14} />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(forecast.id);
                        }}
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

          {/* Delete Modal with Password Verification */}
          {showDeleteModal && (() => {
            const forecastToDelete = forecasts.find((f: Forecast) => f.id === showDeleteModal);
            const summary = forecastToDelete ? getForecastSummary(forecastToDelete) : { count: 0, total: 0, average: 0 };
            
            return (
              <ModalOverlay $isOpen={showDeleteModal !== null} onClick={handleDeleteCancel}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalHeader>
                    <ModalTitle>
                      <Trash2 size={20} style={{ color: '#ef4444' }} />
                      Delete Forecast
                    </ModalTitle>
                    <button onClick={handleDeleteCancel} title="Close" type="button">
                      <XCircle />
                    </button>
                  </ModalHeader>
                  
                  <WarningBox>
                    <p>
                      <strong>Warning:</strong> You are about to permanently delete this forecast. 
                      This action cannot be undone. Please enter your password to confirm this deletion.
                    </p>
                  </WarningBox>

                  {forecastToDelete && (
                    <div style={{
                      background: theme.colors.backgroundSecondary,
                      border: '1px solid ' + theme.colors.border,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.lg,
                      marginBottom: theme.spacing.lg
                    }}>
                      <h4 style={{
                        fontSize: theme.typography.fontSizes.md,
                        fontWeight: theme.typography.fontWeights.bold,
                        color: TEXT_COLOR_DARK,
                        margin: `0 0 ${theme.spacing.md} 0`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm
                      }}>
                        <LineChart size={18} />
                        Forecast Details to be Deleted
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.medium }}>
                              {forecastToDelete.name || 'N/A'}
                            </span>
                          </div>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, textTransform: 'capitalize' }}>
                              {forecastToDelete.forecast_type || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {forecastToDelete.description && (
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK, lineHeight: 1.6 }}>
                              {forecastToDelete.description}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Method</strong>
                            <MethodBadge $method={forecastToDelete.method}>
                              {forecastToDelete.method.replace(/_/g, ' ')}
                            </MethodBadge>
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Period Type</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK, textTransform: 'capitalize' }}>
                              {forecastToDelete.period_type || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                              {formatDate(forecastToDelete.start_date)} - {formatDate(forecastToDelete.end_date)}
                            </span>
                          </div>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Points</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.bold }}>
                              {summary.count}
                            </span>
                          </div>
                        </div>
                        {summary.count > 0 && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                            <div style={{ flex: '1 1 200px' }}>
                              <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Forecast</strong>
                              <span style={{ fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
                                ${summary.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                              <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average</strong>
                              <span style={{ fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>
                                ${summary.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <FormGroup>
                    <Label htmlFor="delete-password">
                      <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                      Enter <strong>your own password</strong> to confirm deletion of <strong>{forecastToDelete?.name || 'this forecast'}</strong>:
                    </Label>
                    <PasswordInputWrapper>
                      <input
                        id="delete-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setDeletePassword(e.target.value);
                          setDeletePasswordError(null);
                        }}
                        placeholder="Enter your password"
                        autoFocus
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' && deletePassword.trim() && showDeleteModal !== null && !verifyingPassword && !deletingId) {
                            handleDelete(showDeleteModal, deletePassword);
                          }
                        }}
                        disabled={verifyingPassword || deletingId === showDeleteModal}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        title={showDeletePassword ? 'Hide password' : 'Show password'}
                        disabled={verifyingPassword || deletingId === showDeleteModal}
                      >
                        {showDeletePassword ? <EyeOff /> : <Eye />}
                      </button>
                    </PasswordInputWrapper>
                    {deletePasswordError && (
                      <ErrorText>{deletePasswordError}</ErrorText>
                    )}
                  </FormGroup>

                  <ModalActions>
                    <Button
                      variant="outline"
                      onClick={handleDeleteCancel}
                      disabled={deletingId === showDeleteModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (showDeleteModal !== null) {
                          handleDelete(showDeleteModal, deletePassword);
                        }
                      }}
                      disabled={!deletePassword.trim() || deletingId === showDeleteModal || verifyingPassword || showDeleteModal === null}
                    >
                      {verifyingPassword ? (
                        <>
                          <Loader2 size={16} style={{ marginRight: theme.spacing.sm, animation: 'spin 1s linear infinite' }} />
                          Verifying...
                        </>
                      ) : deletingId === showDeleteModal ? (
                        <>
                          <Loader2 size={16} style={{ marginRight: theme.spacing.sm, animation: 'spin 1s linear infinite' }} />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                          Delete Forecast
                        </>
                      )}
                    </Button>
                  </ModalActions>
                </ModalContent>
              </ModalOverlay>
            );
          })()}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ForecastListPage;

