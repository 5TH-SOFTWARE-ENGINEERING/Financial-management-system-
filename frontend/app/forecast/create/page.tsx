'use client';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  LineChart, Save, X, AlertCircle, TrendingUp, BarChart3
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
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
  background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${theme.colors.background} 100%);
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
  margin-bottom: ${theme.spacing.md};
  
  label {
    display: block;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin-bottom: ${theme.spacing.xs};
  }
  
  input, select, textarea {
    width: 100%;
    padding: ${theme.spacing.sm};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    font-size: ${theme.typography.fontSizes.sm};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MethodInfo = styled.div`
  background: ${PRIMARY_COLOR}15;
  border-left: 4px solid ${PRIMARY_COLOR};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.md};
  
  h4 {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${theme.spacing.xs};
  }
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
`;

const ValidationErrors = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  
  h4 {
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
  }
  
  ul {
    margin: 0;
    padding-left: ${theme.spacing.lg};
    color: #991b1b;
    font-size: ${theme.typography.fontSizes.sm};
  }
`;

const ForecastCreatePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    forecast_type: 'revenue',
    period_type: 'monthly',
    start_date: '',
    end_date: '',
    method: 'moving_average',
    historical_start_date: '',
    historical_end_date: '',
    window: 3,
    growth_rate: 0.05
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getMethodInfo = () => {
    switch (formData.method) {
      case 'moving_average':
        return {
          title: 'Moving Average Method',
          description: 'Calculates the average of the last N periods and uses it to forecast future periods. Best for stable trends.'
        };
      case 'linear_growth':
        return {
          title: 'Linear Growth Method',
          description: 'Applies a constant growth rate to the last period value. Best for consistent growth patterns.'
        };
      case 'trend':
        return {
          title: 'Trend Analysis Method',
          description: 'Uses linear regression to identify trends in historical data and project them forward. Best for identifying long-term patterns.'
        };
      default:
        return { title: '', description: '' };
    }
  };

  const handleValidate = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Forecast name is required');
    if (!formData.start_date) errors.push('Start date is required');
    if (!formData.end_date) errors.push('End date is required');
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      errors.push('End date must be after start date');
    }
    if (formData.method === 'moving_average' && (formData.window < 1 || formData.window > 12)) {
      errors.push('Moving average window must be between 1 and 12');
    }
    if (formData.method === 'linear_growth' && (formData.growth_rate < -1 || formData.growth_rate > 10)) {
      errors.push('Growth rate should be between -100% and 1000%');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handleValidate()) {
      toast.error('Please fix validation errors before creating forecast');
      return;
    }

    try {
      setLoading(true);
      
      const forecastPayload: any = {
        name: formData.name,
        description: formData.description || undefined,
        forecast_type: formData.forecast_type,
        period_type: formData.period_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        method: formData.method,
        method_params: {}
      };

      // Add method-specific parameters
      if (formData.method === 'moving_average') {
        forecastPayload.method_params.window = formData.window;
      } else if (formData.method === 'linear_growth') {
        forecastPayload.method_params.growth_rate = formData.growth_rate;
      }

      // Add historical date range if provided
      if (formData.historical_start_date) {
        forecastPayload.historical_start_date = formData.historical_start_date;
      }
      if (formData.historical_end_date) {
        forecastPayload.historical_end_date = formData.historical_end_date;
      }

      await apiClient.createForecast(forecastPayload);
      toast.success('Forecast created successfully!');
      router.push('/forecast/list');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create forecast');
    } finally {
      setLoading(false);
    }
  };

  const methodInfo = getMethodInfo();

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <h1>
              <LineChart size={36} />
              Create New Forecast
            </h1>
          </HeaderContainer>

          <form onSubmit={handleSubmit}>
            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Forecast Information
              </h2>

              <FormGroup>
                <label>Forecast Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Q1 2024 Revenue Forecast"
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Forecast description..."
                />
              </FormGroup>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Forecast Type *</label>
                  <select
                    value={formData.forecast_type}
                    onChange={(e) => handleInputChange('forecast_type', e.target.value)}
                    required
                  >
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                    <option value="profit">Profit</option>
                    <option value="all">All</option>
                  </select>
                </FormGroup>

                <FormGroup>
                  <label>Period Type *</label>
                  <select
                    value={formData.period_type}
                    onChange={(e) => handleInputChange('period_type', e.target.value)}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </FormGroup>
              </TwoColumnGrid>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Forecast Start Date *</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <label>Forecast End Date *</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    required
                  />
                </FormGroup>
              </TwoColumnGrid>
            </FormCard>

            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Forecasting Method
              </h2>

              <FormGroup>
                <label>Method *</label>
                <select
                  value={formData.method}
                  onChange={(e) => handleInputChange('method', e.target.value)}
                  required
                >
                  <option value="moving_average">Moving Average</option>
                  <option value="linear_growth">Linear Growth</option>
                  <option value="trend">Trend Analysis</option>
                </select>
              </FormGroup>

              {methodInfo.title && (
                <MethodInfo>
                  <h4>{methodInfo.title}</h4>
                  <p>{methodInfo.description}</p>
                </MethodInfo>
              )}

              {formData.method === 'moving_average' && (
                <FormGroup>
                  <label>Moving Average Window (periods) *</label>
                  <Input
                    type="number"
                    value={formData.window}
                    onChange={(e) => handleInputChange('window', parseInt(e.target.value) || 3)}
                    min="1"
                    max="12"
                    required
                  />
                  <p style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginTop: theme.spacing.xs }}>
                    Number of historical periods to average (recommended: 3-6)
                  </p>
                </FormGroup>
              )}

              {formData.method === 'linear_growth' && (
                <FormGroup>
                  <label>Growth Rate (decimal) *</label>
                  <Input
                    type="number"
                    value={formData.growth_rate}
                    onChange={(e) => handleInputChange('growth_rate', parseFloat(e.target.value) || 0.05)}
                    step="0.01"
                    min="-1"
                    max="10"
                    required
                  />
                  <p style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginTop: theme.spacing.xs }}>
                    Growth rate per period (0.05 = 5% growth, -0.1 = -10% decline)
                  </p>
                </FormGroup>
              )}
            </FormCard>

            <FormCard>
              <h2 style={{ marginBottom: theme.spacing.lg, color: TEXT_COLOR_DARK }}>
                Historical Data Period (Optional)
              </h2>
              <p style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.md }}>
                Specify the historical period to analyze. If not specified, defaults to 1 year before the forecast start date.
              </p>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Historical Start Date</label>
                  <Input
                    type="date"
                    value={formData.historical_start_date}
                    onChange={(e) => handleInputChange('historical_start_date', e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Historical End Date</label>
                  <Input
                    type="date"
                    value={formData.historical_end_date}
                    onChange={(e) => handleInputChange('historical_end_date', e.target.value)}
                  />
                </FormGroup>
              </TwoColumnGrid>
            </FormCard>

            {validationErrors.length > 0 && (
              <ValidationErrors>
                <h4>
                  <AlertCircle size={16} />
                  Validation Errors
                </h4>
                <ul>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </ValidationErrors>
            )}

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
                type="button"
                variant="outline"
                onClick={handleValidate}
              >
                <AlertCircle size={16} />
                Validate
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Creating...' : 'Create Forecast'}
              </Button>
            </ActionButtons>
          </form>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ForecastCreatePage;

