'use client';
import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Brain, Play, CheckCircle, XCircle, AlertCircle, Loader2,
  TrendingUp, TrendingDown, Package, Info
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
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
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.sm} 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const TrainingControls = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &[type="date"] {
    cursor: pointer;
  }
`;

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const ModelCard = styled.div<{ $status?: 'trained' | 'training' | 'error' | 'pending' }>`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  transition: all ${theme.transitions.default};
  position: relative;
  
  border-left: 4px solid ${props => {
    switch (props.$status) {
      case 'trained': return '#10b981';
      case 'training': return '#3b82f6';
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  }};
  
  &:hover {
    box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`;

const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
`;

const StatusBadge = styled.span<{ $status?: 'trained' | 'training' | 'error' | 'pending' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => {
    switch (props.$status) {
      case 'trained': return '#d1fae5';
      case 'training': return '#dbeafe';
      case 'error': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'trained': return '#065f46';
      case 'training': return '#1e40af';
      case 'error': return '#991b1b';
      default: return '#6b7280';
    }
  }};
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: capitalize;
`;

const ModelDescription = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin: 0 0 ${theme.spacing.md} 0;
  line-height: 1.5;
`;

const ModelMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${PRIMARY_LIGHT};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.md};
`;

const MetricItem = styled.div`
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

const ModelActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-start;
  
  p {
    margin: 0;
    color: #1e40af;
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.6;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.lg} 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  metric: 'expense' | 'revenue' | 'inventory';
  icon: React.ReactNode;
  status?: 'trained' | 'training' | 'error' | 'pending';
  metrics?: {
    mae?: number;
    rmse?: number;
    dataPoints?: number;
    modelPath?: string;
  };
  error?: string;
}

interface TrainingResponse {
  data?: TrainingResult;
  status?: string;
  detail?: string;
  message?: string;
}

interface TrainingResult {
  status?: string;
  model_type?: string;
  mae?: number;
  rmse?: number;
  data_points?: number;
  model_path?: string;
  detail?: string;
  message?: string;
}

interface TrainingAllResponse {
  data?: {
    results?: TrainingResults;
  };
  results?: TrainingResults;
}

interface TrainingResults {
  expenses?: {
    arima?: TrainingResult;
    prophet?: TrainingResult;
    linear_regression?: TrainingResult;
  };
  revenue?: {
    prophet?: TrainingResult;
    xgboost?: TrainingResult;
    lstm?: TrainingResult;
  };
  inventory?: {
    sarima?: TrainingResult;
    xgboost?: TrainingResult;
    lstm?: TrainingResult;
  };
  errors?: string[];
  [key: string]: unknown;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      results?: TrainingResults;
    };
  };
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
}

const MLTrainingPage: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [trainingAll, setTrainingAll] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([
    {
      id: 'expenses-arima',
      name: 'Expenses ARIMA',
      description: 'AutoRegressive Integrated Moving Average for expense forecasting',
      metric: 'expense',
      icon: <TrendingDown size={20} />,
      status: 'pending'
    },
    {
      id: 'expenses-prophet',
      name: 'Expenses Prophet',
      description: 'Facebook Prophet for seasonal expense patterns',
      metric: 'expense',
      icon: <TrendingDown size={20} />,
      status: 'pending'
    },
    {
      id: 'expenses-linear-regression',
      name: 'Expenses Linear Regression',
      description: 'Machine learning linear regression for expenses',
      metric: 'expense',
      icon: <TrendingDown size={20} />,
      status: 'pending'
    },
    {
      id: 'revenue-prophet',
      name: 'Revenue Prophet',
      description: 'Facebook Prophet for seasonal revenue patterns',
      metric: 'revenue',
      icon: <TrendingUp size={20} />,
      status: 'pending'
    },
    {
      id: 'revenue-xgboost',
      name: 'Revenue XGBoost',
      description: 'Gradient boosting for complex revenue patterns',
      metric: 'revenue',
      icon: <TrendingUp size={20} />,
      status: 'pending'
    },
    {
      id: 'revenue-lstm',
      name: 'Revenue LSTM',
      description: 'Deep learning LSTM for long-term revenue dependencies',
      metric: 'revenue',
      icon: <TrendingUp size={20} />,
      status: 'pending'
    },
    {
      id: 'inventory-sarima',
      name: 'Inventory SARIMA',
      description: 'Seasonal ARIMA for inventory forecasting',
      metric: 'inventory',
      icon: <Package size={20} />,
      status: 'pending'
    },
    {
      id: 'inventory-xgboost',
      name: 'Inventory XGBoost',
      description: 'Gradient boosting for inventory patterns',
      metric: 'inventory',
      icon: <Package size={20} />,
      status: 'pending'
    },
    {
      id: 'inventory-lstm',
      name: 'Inventory LSTM',
      description: 'Deep learning LSTM for inventory dependencies',
      metric: 'inventory',
      icon: <Package size={20} />,
      status: 'pending'
    },
  ]);

  const trainModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, status: 'training', error: undefined } : m
    ));

    try {
      let result: TrainingResponse;
      
      if (modelId === 'expenses-arima') {
        result = await apiClient.trainExpensesArima(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'expenses-prophet') {
        result = await apiClient.trainExpensesProphet(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'expenses-linear-regression') {
        result = await apiClient.trainExpensesLinearRegression(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'revenue-prophet') {
        result = await apiClient.trainRevenueProphet(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'revenue-xgboost') {
        result = await apiClient.trainRevenueXGBoost(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'revenue-lstm') {
        result = await apiClient.trainRevenueLSTM(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'inventory-sarima') {
        result = await apiClient.trainInventorySARIMA(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'inventory-xgboost') {
        result = await apiClient.trainInventoryXGBoost(startDate, endDate) as TrainingResponse;
      } else if (modelId === 'inventory-lstm') {
        result = await apiClient.trainInventoryLSTM(startDate, endDate) as TrainingResponse;
      } else {
        return;
      }

      // Handle both axios response format and direct response
      const responseData = (result?.data || result) as TrainingResult;
      // Check for successful training status
      if (responseData?.status === 'trained' || responseData?.status === 'success' || 
          (responseData?.model_type && responseData?.status !== 'error')) {
        setModels(prev => prev.map(m => 
          m.id === modelId ? {
            ...m,
            status: 'trained',
            metrics: {
              mae: responseData.mae,
              rmse: responseData.rmse,
              dataPoints: responseData.data_points,
              modelPath: responseData.model_path
            }
          } : m
        ));
        toast.success(`${model.name} trained successfully`);
      } else {
        throw new Error(responseData?.detail || responseData?.message || 'Training failed');
      }
    } catch (error: unknown) {
      // Extract error message from various response formats
      let errorMessage = 'Training failed';
      
      const apiError = error as ApiError;
      if (apiError?.response?.data?.detail) {
        errorMessage = apiError.response.data.detail;
      } else if (apiError?.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError?.data?.detail) {
        errorMessage = apiError.data.detail;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Provide helpful context for common errors
      const errorLower = errorMessage.toLowerCase();
      if (errorLower.includes('stan_backend') || errorLower.includes('cmdstanpy') || errorLower.includes('cmdstan')) {
        errorMessage = 'Prophet requires cmdstanpy which is not available. This is a known issue on Windows/Python 3.12. Use alternative models (ARIMA, XGBoost, LSTM) instead.';
      } else if (errorLower.includes('insufficient data') || errorLower.includes('not enough data')) {
        errorMessage = 'Insufficient historical data for training. Please import more data or select a different date range.';
      }

      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, status: 'error', error: errorMessage } : m
      ));
      toast.error(`${model.name} training failed: ${errorMessage}`);
    }
  };

  const trainAllModels = async () => {
    setTrainingAll(true);
    setModels(prev => prev.map(m => ({ ...m, status: 'pending', error: undefined })));

    try {
      const response = await apiClient.trainAllModels(startDate, endDate) as TrainingAllResponse;
      // Handle both axios response format and direct response
      const responseData = response?.data || response;
      const resultsData = (responseData as TrainingAllResponse)?.results || responseData;
      const results: TrainingResults = (typeof resultsData === 'object' && resultsData !== null && 'results' in resultsData) 
        ? (resultsData as { results?: TrainingResults }).results || {} as TrainingResults
        : (resultsData as TrainingResults) || {} as TrainingResults;
      
      // Update model statuses based on results
      setModels(prev => prev.map(model => {
        const metricKey = model.metric === 'expense' ? 'expenses' : 
                         model.metric === 'revenue' ? 'revenue' : 'inventory';
        const methodKey = model.id.includes('arima') ? 'arima' :
                         model.id.includes('prophet') ? 'prophet' :
                         model.id.includes('linear-regression') ? 'linear_regression' :
                         model.id.includes('xgboost') ? 'xgboost' :
                         model.id.includes('lstm') ? 'lstm' :
                         model.id.includes('sarima') ? 'sarima' : '';
        
        let modelResult: TrainingResult | undefined;
        if (metricKey === 'expenses' && results.expenses) {
          modelResult = (results.expenses as Record<string, TrainingResult | undefined>)[methodKey];
        } else if (metricKey === 'revenue' && results.revenue) {
          modelResult = (results.revenue as Record<string, TrainingResult | undefined>)[methodKey];
        } else if (metricKey === 'inventory' && results.inventory) {
          modelResult = (results.inventory as Record<string, TrainingResult | undefined>)[methodKey];
        }
        
        if (modelResult?.status === 'trained') {
          return {
            ...model,
            status: 'trained',
            metrics: {
              mae: modelResult.mae,
              rmse: modelResult.rmse,
              dataPoints: modelResult.data_points,
              modelPath: modelResult.model_path
            }
          };
        } else {
          // Check errors
          const errors: string[] = results.errors || [];
          const error = errors.find((e: string) => 
            e.toLowerCase().includes(model.metric) && 
            e.toLowerCase().includes(methodKey)
          );
          return {
            ...model,
            status: error ? 'error' : 'pending',
            error: error || undefined
          };
        }
      }));

      const trainedCount = Object.values(results).reduce((acc: number, metric: unknown) => {
        if (typeof metric === 'object' && metric !== null) {
          const metricObj = metric as Record<string, TrainingResult | unknown>;
          return acc + Object.values(metricObj).filter((m: unknown) => {
            const trainingResult = m as TrainingResult;
            return trainingResult?.status === 'trained';
          }).length;
        }
        return acc;
      }, 0);

      toast.success(`Training completed! ${trainedCount} models trained successfully`);
    } catch (error: unknown) {
      // Extract error message from various response formats
      let errorMessage = 'Training failed';
      
      const apiError = error as ApiError;
      if (apiError?.response?.data?.detail) {
        errorMessage = apiError.response.data.detail;
      } else if (apiError?.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError?.data?.detail) {
        errorMessage = apiError.data.detail;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // For train all, we might have partial results, so check if we have results structure
      if (apiError?.response?.data?.results) {
        const errorResults = apiError.response.data.results;
        // Update models based on partial results
        setModels(prev => prev.map(model => {
          const metricKey = model.metric === 'expense' ? 'expenses' : 
                           model.metric === 'revenue' ? 'revenue' : 'inventory';
          const methodKey = model.id.includes('arima') ? 'arima' :
                           model.id.includes('prophet') ? 'prophet' :
                           model.id.includes('linear-regression') ? 'linear_regression' :
                           model.id.includes('xgboost') ? 'xgboost' :
                           model.id.includes('lstm') ? 'lstm' :
                           model.id.includes('sarima') ? 'sarima' : '';
          
          let modelResult: TrainingResult | undefined;
          if (metricKey === 'expenses' && errorResults.expenses) {
            modelResult = (errorResults.expenses as Record<string, TrainingResult | undefined>)[methodKey];
          } else if (metricKey === 'revenue' && errorResults.revenue) {
            modelResult = (errorResults.revenue as Record<string, TrainingResult | undefined>)[methodKey];
          } else if (metricKey === 'inventory' && errorResults.inventory) {
            modelResult = (errorResults.inventory as Record<string, TrainingResult | undefined>)[methodKey];
          }
          if (modelResult?.status === 'trained') {
            return {
              ...model,
              status: 'trained',
              metrics: {
                mae: modelResult.mae,
                rmse: modelResult.rmse,
                dataPoints: modelResult.data_points,
                modelPath: modelResult.model_path
              }
            };
          }
          return model;
        }));
      }

      toast.error(`Training completed with errors: ${errorMessage}`);
      // Don't set all models to error, only those that failed (handled above)
    } finally {
      setTrainingAll(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'trained':
        return <CheckCircle size={14} />;
      case 'training':
        return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />;
      case 'error':
        return <XCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <h1>
              <Brain size={36} />
              AI/ML Model Training
            </h1>
            <p>
              Train machine learning models for financial forecasting. Models are used when creating forecasts with AI methods.
            </p>
          </HeaderContainer>

          <InfoBox>
            <Info size={20} style={{ color: '#1e40af', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p>
                <strong>Training Period:</strong> Select the date range for historical data used to train models. 
                More data generally leads to better model performance. 
                Models are saved and can be used for future forecasts.
              </p>
              <p style={{ marginTop: theme.spacing.sm }}>
                <strong>Note:</strong> Training may take several minutes. Large datasets or complex models (LSTM, XGBoost) 
                may require more time. You can train individual models or train all models at once.
              </p>
            </div>
          </InfoBox>

          <TrainingControls>
            <FormGroup>
              <label>Training Data Start Date</label>
              <StyledInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <label>Training Data End Date</label>
              <StyledInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormGroup>
            <Button
              onClick={trainAllModels}
              disabled={trainingAll}
              style={{ height: 'fit-content' }}
            >
              {trainingAll ? (
                <>
                  <Loader2 size={16} style={{ marginRight: theme.spacing.sm, animation: 'spin 1s linear infinite' }} />
                  Training All Models...
                </>
              ) : (
                <>
                  <Play size={16} style={{ marginRight: theme.spacing.sm }} />
                  Train All Models
                </>
              )}
            </Button>
          </TrainingControls>

          <SectionTitle>
            <Brain size={24} />
            Available Models
          </SectionTitle>

          <ModelsGrid>
            {models.map((model) => (
              <ModelCard key={model.id} $status={model.status}>
                <ModelHeader>
                  <h3>
                    {model.icon}
                    {model.name}
                  </h3>
                  <StatusBadge $status={model.status}>
                    {getStatusIcon(model.status)}
                    {model.status || 'Pending'}
                  </StatusBadge>
                </ModelHeader>
                
                <ModelDescription>{model.description}</ModelDescription>

                {model.metrics && (
                  <ModelMetrics>
                    {model.metrics.mae !== undefined && (
                      <MetricItem>
                        <div className="label">MAE</div>
                        <div className="value">
                          {model.metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </MetricItem>
                    )}
                    {model.metrics.rmse !== undefined && (
                      <MetricItem>
                        <div className="label">RMSE</div>
                        <div className="value">
                          {model.metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </MetricItem>
                    )}
                    {model.metrics.dataPoints !== undefined && (
                      <MetricItem>
                        <div className="label">Data Points</div>
                        <div className="value">{model.metrics.dataPoints}</div>
                      </MetricItem>
                    )}
                  </ModelMetrics>
                )}

                {model.error && (
                  <div style={{
                    padding: theme.spacing.md,
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: theme.borderRadius.sm,
                    marginBottom: theme.spacing.md,
                    fontSize: theme.typography.fontSizes.sm,
                    color: '#991b1b',
                    lineHeight: '1.5'
                  }}>
                    <div style={{ fontWeight: theme.typography.fontWeights.medium, marginBottom: theme.spacing.xs }}>
                      Error:
                    </div>
                    <div>{model.error}</div>
                  </div>
                )}

                <ModelActions>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => trainModel(model.id)}
                    disabled={model.status === 'training' || trainingAll}
                  >
                    {model.status === 'training' ? (
                      <>
                        <Loader2 size={14} style={{ marginRight: theme.spacing.xs, animation: 'spin 1s linear infinite' }} />
                        Training...
                      </>
                    ) : (
                      <>
                        <Play size={14} style={{ marginRight: theme.spacing.xs }} />
                        Train
                      </>
                    )}
                  </Button>
                </ModelActions>
              </ModelCard>
            ))}
          </ModelsGrid>

          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default MLTrainingPage;

