'use client';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  LineChart, Save, X, AlertCircle
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = theme.colors.textDark || '#000000';
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

  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  &[type="date"] {
    cursor: pointer;
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

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 28px;
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
  gap: 16px;
  justify-content: space-between;
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

type ForecastMethod = 'moving_average' | 'linear_growth' | 'trend' | 'arima' | 'prophet' | 'xgboost' | 'lstm' | 'linear_regression';

type ForecastForm = {
  name: string;
  description: string;
  forecast_type: 'revenue' | 'expense' | 'profit' | 'all';
  period_type: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  method: ForecastMethod;
  historical_start_date: string;
  historical_end_date: string;
  window: number;
  growth_rate: number;
};

type MethodParams = {
  window?: number;
  growth_rate?: number;
};

type ForecastPayload = {
  name: string;
  description?: string;
  forecast_type: ForecastForm['forecast_type'];
  period_type: ForecastForm['period_type'];
  start_date: string;
  end_date: string;
  method: ForecastMethod;
  method_params?: MethodParams;
  historical_start_date?: string;
  historical_end_date?: string;
};

const ForecastCreatePage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ForecastForm>({
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

  const handleInputChange = <K extends keyof ForecastForm>(field: K, value: ForecastForm[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-adjust forecast_type when AI method is selected
      if (field === 'method') {
        const method = value as ForecastMethod;
        if (method === 'arima' || method === 'linear_regression') {
          updated.forecast_type = 'expense';
        } else if (method === 'xgboost' || method === 'lstm') {
          updated.forecast_type = 'revenue';
        }
        // Prophet works with both revenue and expense, so no change needed
      }
      
      // Validate method and forecast_type compatibility
      if (field === 'forecast_type') {
        const forecastType = value as ForecastForm['forecast_type'];
        const currentMethod = prev.method;
        if ((currentMethod === 'arima' || currentMethod === 'linear_regression') && forecastType !== 'expense') {
          // Reset to compatible method if type changes
          updated.method = 'moving_average';
        } else if ((currentMethod === 'xgboost' || currentMethod === 'lstm') && forecastType !== 'revenue') {
          updated.method = 'moving_average';
        }
      }
      
      return updated;
    });
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
      case 'arima':
        return {
          title: 'ARIMA (AutoRegressive Integrated Moving Average)',
          description: 'AI-powered time series forecasting method. Best for expenses forecasting. Requires trained model (automatically uses if available).'
        };
      case 'prophet':
        return {
          title: 'Facebook Prophet',
          description: 'AI-powered forecasting tool by Facebook. Handles seasonality and holidays automatically. Best for revenue/expense forecasting with seasonal patterns. Requires trained model.'
        };
      case 'xgboost':
        return {
          title: 'XGBoost (Gradient Boosting)',
          description: 'Advanced machine learning method using gradient boosting. Best for revenue forecasting with complex patterns. Requires trained model.'
        };
      case 'lstm':
        return {
          title: 'LSTM (Long Short-Term Memory)',
          description: 'Deep learning neural network for sequence prediction. Best for revenue forecasting with long-term dependencies. Requires trained model.'
        };
      case 'linear_regression':
        return {
          title: 'Linear Regression (ML)',
          description: 'Machine learning-based linear regression for expenses. More accurate than traditional trend analysis. Requires trained model.'
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
    
    // Validate AI/ML method compatibility with forecast type
    if (formData.method === 'arima' && formData.forecast_type !== 'expense') {
      errors.push('ARIMA method is only available for expense forecasting');
    }
    if (formData.method === 'linear_regression' && formData.forecast_type !== 'expense') {
      errors.push('Linear Regression ML method is only available for expense forecasting');
    }
    if ((formData.method === 'xgboost' || formData.method === 'lstm') && formData.forecast_type !== 'revenue') {
      errors.push(`${formData.method.toUpperCase()} method is only available for revenue forecasting`);
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
      
      // Convert date strings to ISO datetime format (YYYY-MM-DDTHH:mm:ss)
      // Pydantic expects datetime strings in ISO format
      // Since validation ensures start_date and end_date are required, they should always be present
      const startDateISO = `${formData.start_date}T00:00:00`;
      const endDateISO = `${formData.end_date}T23:59:59`;
      const historicalStartISO = formData.historical_start_date ? `${formData.historical_start_date}T00:00:00` : undefined;
      const historicalEndISO = formData.historical_end_date ? `${formData.historical_end_date}T23:59:59` : undefined;

      const forecastPayload: ForecastPayload = {
        name: formData.name,
        description: formData.description || undefined,
        forecast_type: formData.forecast_type,
        period_type: formData.period_type,
        start_date: startDateISO,
        end_date: endDateISO,
        method: formData.method
      };

      // Add method-specific parameters only if they exist
      const methodParams: MethodParams = {};
      if (formData.method === 'moving_average') {
        methodParams.window = formData.window;
      } else if (formData.method === 'linear_growth') {
        methodParams.growth_rate = formData.growth_rate;
      }
      // Only include method_params if it has values (trend method doesn't need params)
      if (Object.keys(methodParams).length > 0) {
        forecastPayload.method_params = methodParams;
      }

      // Add historical date range if provided
      if (historicalStartISO) {
        forecastPayload.historical_start_date = historicalStartISO;
      }
      if (historicalEndISO) {
        forecastPayload.historical_end_date = historicalEndISO;
      }

      await apiClient.createForecast(forecastPayload);
      toast.success('Forecast created successfully!');
      router.push('/forecast/list');
    } catch (error: unknown) {
      const errorMessage =
        (typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (error instanceof Error ? error.message : 'Failed to create forecast');
      toast.error(errorMessage);
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
                <label>Forecast Name </label>
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

              <TwoColumnGrid>
                <FormGroup>
                  <label>Forecast Type </label>
                  <StyledSelect
                    value={formData.forecast_type}
                    onChange={(e) => handleInputChange('forecast_type', e.target.value as ForecastForm['forecast_type'])}
                    required
                  >
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                    <option value="profit">Profit</option>
                    <option value="all">All</option>
                  </StyledSelect>
                </FormGroup>

                <FormGroup>
                  <label>Period Type </label>
                <StyledSelect
                  value={formData.period_type}
                  onChange={(e) => handleInputChange('period_type', e.target.value as ForecastForm['period_type'])}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </StyledSelect>
                </FormGroup>
              </TwoColumnGrid>

              <TwoColumnGrid>
                <FormGroup>
                  <label>Forecast Start Date </label>
                  <StyledInput
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <label>Forecast End Date </label>
                  <StyledInput
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
                <label>Method </label>
                <StyledSelect
                  value={formData.method}
                  onChange={(e) => handleInputChange('method', e.target.value as ForecastMethod)}
                  required
                >
                  <optgroup label="Traditional Methods">
                    <option value="moving_average">Moving Average</option>
                    <option value="linear_growth">Linear Growth</option>
                    <option value="trend">Trend Analysis</option>
                  </optgroup>
                  <optgroup label="AI/ML Methods (Requires Trained Models)">
                    <option value="arima">ARIMA (Expenses)</option>
                    <option value="prophet">Prophet (Revenue/Expense)</option>
                    <option value="xgboost">XGBoost (Revenue)</option>
                    <option value="lstm">LSTM (Revenue)</option>
                    <option value="linear_regression">Linear Regression ML (Expenses)</option>
                  </optgroup>
                </StyledSelect>
                <p style={{ fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginTop: theme.spacing.xs }}>
                  AI/ML methods use pre-trained models. Ensure models are trained before using.
                </p>
              </FormGroup>

              {methodInfo.title && (
                <MethodInfo>
                  <h4>{methodInfo.title}</h4>
                  <p>{methodInfo.description}</p>
                  {(formData.method === 'arima' || formData.method === 'prophet' || 
                    formData.method === 'xgboost' || formData.method === 'lstm' || 
                    formData.method === 'linear_regression') && (
                    <p style={{ 
                      fontSize: theme.typography.fontSizes.xs, 
                      color: '#dc2626', 
                      marginTop: theme.spacing.xs,
                      fontWeight: theme.typography.fontWeights.medium
                    }}>
                      ⚠️ Note: This AI/ML method requires a trained model. If no model is available, the forecast will fail. 
                      Train models first using the backend training script.
                    </p>
                  )}
                </MethodInfo>
              )}

              {formData.method === 'moving_average' && (
                <FormGroup>
                  <label>Moving Average Window (periods) </label>
                  <StyledInput
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
                  <label>Growth Rate (decimal) </label>
                  <StyledInput
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
                  <StyledInput
                    type="date"
                    value={formData.historical_start_date}
                    onChange={(e) => handleInputChange('historical_start_date', e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Historical End Date</label>
                  <StyledInput
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

