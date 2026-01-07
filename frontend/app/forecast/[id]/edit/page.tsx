'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import {
  LineChart, Save, X, AlertCircle, ArrowLeft
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${props => props.theme.mode === 'dark' ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${props.theme.colors.background} 100%)` : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${props.theme.colors.background} 100%)`};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
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
  
  h1 {
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const FormCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
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
  
  label {
    display: block;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
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

const StyledTextarea = styled.textarea`
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
  resize: vertical;
  min-height: 100px;

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

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
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

type ForecastMethod = 'moving_average' | 'linear_growth' | 'trend' | string;

type MethodParams = Record<string, unknown>;

interface ForecastDataPoint {
  period?: string;
  date?: string;
  forecasted_value?: number;
  method?: ForecastMethod;
}

interface Forecast {
  id: number;
  name: string;
  description?: string;
  forecast_type: string;
  period_type: string;
  start_date: string;
  end_date: string;
  method: ForecastMethod;
  method_params?: MethodParams;
  forecast_data?: ForecastDataPoint[];
  created_at: string;
}

const ForecastEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const forecastId = params?.id ? parseInt(params.id as string) : null;

  const loadForecast = useCallback(async () => {
    if (!forecastId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getForecast(forecastId);
      // Handle both axios response format and direct response
      const responseData = response?.data || response;
      const forecastData = responseData as Forecast;
      
      // Parse JSON fields if they're strings
      if (typeof forecastData.forecast_data === 'string') {
        forecastData.forecast_data = JSON.parse(forecastData.forecast_data) as ForecastDataPoint[];
      }
      if (typeof forecastData.method_params === 'string') {
        forecastData.method_params = JSON.parse(forecastData.method_params) as MethodParams;
      }
      
      setForecast(forecastData);
      setFormData({
        name: forecastData.name || '',
        description: forecastData.description || ''
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load forecast';
      toast.error(message);
      router.push('/forecast/list');
    } finally {
      setLoading(false);
    }
  }, [forecastId, router]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Forecast name is required');
      return;
    }

    if (!forecastId) return;

    try {
      setSaving(true);
      
      await apiClient.updateForecast(forecastId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      toast.success('Forecast updated successfully!');
      router.push(`/forecast/${forecastId}`);
    } catch (error: unknown) {
      const apiMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      const message = apiMessage || (error instanceof Error ? error.message : 'Failed to update forecast');
      toast.error(message);
    } finally {
      setSaving(false);
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

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href={`/forecast/${forecastId}`}>
            <ArrowLeft size={16} />
            Back to Forecast
          </BackLink>

          <HeaderContainer>
            <h1>
              <LineChart size={36} />
              Edit Forecast
            </h1>
          </HeaderContainer>

          <form onSubmit={handleSubmit}>
            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Forecast Information
              </h2>

              <FormGroup>
                <label>Forecast Name *</label>
                <StyledInput
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Q1 2024 Revenue Forecast"
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Description</label>
                <StyledTextarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Forecast description..."
                  rows={4}
                />
              </FormGroup>

              <div style={{ 
                padding: theme.spacing.md, 
                background: '#f3f4f6', 
                borderRadius: theme.borderRadius.sm,
                marginTop: theme.spacing.md
              }}>
                <p style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, margin: 0 }}>
                  <strong>Note:</strong> Only name and description can be edited. To change forecast parameters, 
                  method, or dates, please create a new forecast.
                </p>
              </div>
            </FormCard>

            <ActionButtons>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                <X size={16} />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ActionButtons>
          </form>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ForecastEditPage;

