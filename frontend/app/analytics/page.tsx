'use client';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  CreditCard, Activity, Calendar, Download, RefreshCw,
  AlertCircle, ArrowUpRight, ArrowDownRight, PieChart,
  LineChart, Target
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';

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
  margin-left: calc(-1 * clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl}));
  margin-right: calc(-1 * clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl}));
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const FilterBar = styled.div`
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

const SectionTitle = styled.h2`
  font-size: clamp(20px, 2.2vw, 28px);
  margin: ${theme.spacing.xl} 0 ${theme.spacing.lg};
  color: ${TEXT_COLOR_DARK};
  font-weight: ${theme.typography.fontWeights.bold};
  border-bottom: 2px solid ${PRIMARY_LIGHT};
  padding-bottom: ${theme.spacing.sm};
`;

const KPICard = styled.div<{ $growth?: number }>`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all ${theme.transitions.default};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${CardShadowHover};
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const KPIValue = styled.div`
  font-size: clamp(32px, 4vw, 48px);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: ${theme.spacing.sm} 0;
  line-height: 1.1;
`;

const KPILabel = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: ${theme.spacing.xs};
`;

const GrowthIndicator = styled.div<{ $positive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${props => props.$positive ? '#059669' : '#ef4444'};
  margin-top: ${theme.spacing.sm};
`;

const ChartCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
`;

const ChartTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.lg};
`;

const SimpleBarChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${theme.spacing.xs};
  height: 300px;
  padding: ${theme.spacing.lg} 0;
`;

const Bar = styled.div<{ $height: number; $color: string; $max: number }>`
  flex: 1;
  background: ${props => props.$color};
  height: ${props => `${(props.$height / props.$max) * 100}%`};
  min-height: 4px;
  border-radius: ${theme.borderRadius.sm} ${theme.borderRadius.sm} 0 0;
  position: relative;
  transition: all ${theme.transitions.default};
  
  &:hover {
    opacity: 0.8;
    transform: scaleY(1.05);
  }
  
  &::after {
    content: '${props => `$${props.$height.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: ${theme.typography.fontSizes.xs};
    color: ${TEXT_COLOR_DARK};
    white-space: nowrap;
    margin-bottom: ${theme.spacing.xs};
    opacity: 0;
    transition: opacity ${theme.transitions.default};
  }
  
  &:hover::after {
    opacity: 1;
  }
`;

const ChartLabels = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  margin-top: ${theme.spacing.sm};
`;

const ChartLabel = styled.div`
  flex: 1;
  text-align: center;
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
`;

const LineChartContainer = styled.div`
  position: relative;
  height: 300px;
  margin: ${theme.spacing.lg} 0;
`;

const LineChartSVG = styled.svg`
  width: 100%;
  height: 100%;
`;

const TrendCard = styled.div<{ $trend: 'increasing' | 'decreasing' | 'stable' }>`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  h4 {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${theme.spacing.sm};
  }
  
  .trend-indicator {
    font-size: ${theme.typography.fontSizes.lg};
    margin: ${theme.spacing.md} 0;
    color: ${props => {
      if (props.$trend === 'increasing') return '#059669';
      if (props.$trend === 'decreasing') return '#ef4444';
      return TEXT_COLOR_MUTED;
    }};
  }
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const CategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.sm};
  
  .category-name {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
  }
  
  .category-amount {
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
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

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  
  svg {
    flex-shrink: 0;
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
`;

interface AnalyticsData {
  kpis: any;
  time_series: any;
  category_breakdown: any;
  trends: any;
}

const AnalyticsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadAnalytics();
  }, [user, period, startDate, endDate]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params: any = { period };
      if (period === 'custom' && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await apiClient.getAnalyticsOverview(params);
      setAnalyticsData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load analytics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const renderBarChart = (labels: string[], data: number[], color: string) => {
    if (!data || data.length === 0) return null;
    
    const maxValue = Math.max(...data, 1);
    
    return (
      <>
        <SimpleBarChart>
          {data.map((value, index) => (
            <Bar
              key={index}
              $height={value}
              $color={color}
              $max={maxValue}
            />
          ))}
        </SimpleBarChart>
        <ChartLabels>
          {labels.slice(0, data.length).map((label, index) => (
            <ChartLabel key={index}>{label}</ChartLabel>
          ))}
        </ChartLabels>
      </>
    );
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner />
            <p>Loading analytics...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <h1>
            <BarChart3 size={36} />
            Advanced Analytics
          </h1>
        </HeaderContainer>

        <ContentContainer>
          {error && (
            <ErrorBanner>
              <AlertCircle size={20} />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <FilterBar>
            <Calendar size={20} />
            <span>Period:</span>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('month')}
            >
              Month
            </Button>
            <Button
              variant={period === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('quarter')}
            >
              Quarter
            </Button>
            <Button
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('year')}
            >
              Year
            </Button>
            <Button
              variant={period === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('custom')}
            >
              Custom
            </Button>
            {period === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
            >
              <RefreshCw size={16} />
            </Button>
          </FilterBar>

          {analyticsData && (
            <>
              <SectionTitle>Key Performance Indicators</SectionTitle>
              <KPIGrid>
                <KPICard>
                  <KPILabel>Total Revenue</KPILabel>
                  <KPIValue>
                    {formatCurrency(analyticsData.kpis?.current_period?.revenue || 0)}
                  </KPIValue>
                  {analyticsData.kpis?.growth?.revenue_growth_percent !== undefined && (
                    <GrowthIndicator $positive={analyticsData.kpis.growth.revenue_growth_percent >= 0}>
                      {analyticsData.kpis.growth.revenue_growth_percent >= 0 ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                      {formatPercent(analyticsData.kpis.growth.revenue_growth_percent)} vs previous period
                    </GrowthIndicator>
                  )}
                </KPICard>

                <KPICard>
                  <KPILabel>Total Expenses</KPILabel>
                  <KPIValue>
                    {formatCurrency(analyticsData.kpis?.current_period?.expenses || 0)}
                  </KPIValue>
                  {analyticsData.kpis?.growth?.expense_growth_percent !== undefined && (
                    <GrowthIndicator $positive={analyticsData.kpis.growth.expense_growth_percent <= 0}>
                      {analyticsData.kpis.growth.expense_growth_percent <= 0 ? (
                        <ArrowDownRight size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                      {formatPercent(analyticsData.kpis.growth.expense_growth_percent)} vs previous period
                    </GrowthIndicator>
                  )}
                </KPICard>

                <KPICard>
                  <KPILabel>Net Profit</KPILabel>
                  <KPIValue>
                    {formatCurrency(analyticsData.kpis?.current_period?.profit || 0)}
                  </KPIValue>
                  {analyticsData.kpis?.growth?.profit_growth_percent !== undefined && (
                    <GrowthIndicator $positive={analyticsData.kpis.growth.profit_growth_percent >= 0}>
                      {analyticsData.kpis.growth.profit_growth_percent >= 0 ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                      {formatPercent(analyticsData.kpis.growth.profit_growth_percent)} vs previous period
                    </GrowthIndicator>
                  )}
                </KPICard>

                <KPICard>
                  <KPILabel>Profit Margin</KPILabel>
                  <KPIValue>
                    {analyticsData.kpis?.current_period?.profit_margin?.toFixed(2) || 0}%
                  </KPIValue>
                  <KPILabel style={{ marginTop: '8px' }}>
                    Expense Ratio: {analyticsData.kpis?.current_period?.expense_ratio?.toFixed(2) || 0}%
                  </KPILabel>
                </KPICard>

                <KPICard>
                  <KPILabel>Avg Daily Revenue</KPILabel>
                  <KPIValue>
                    {formatCurrency(analyticsData.kpis?.current_period?.avg_daily_revenue || 0)}
                  </KPIValue>
                </KPICard>

                <KPICard>
                  <KPILabel>Avg Daily Expenses</KPILabel>
                  <KPIValue>
                    {formatCurrency(analyticsData.kpis?.current_period?.avg_daily_expenses || 0)}
                  </KPIValue>
                </KPICard>
              </KPIGrid>

              <SectionTitle>Financial Trends</SectionTitle>
              <TwoColumnGrid>
                <ChartCard>
                  <ChartTitle>Revenue vs Expenses Over Time</ChartTitle>
                  {analyticsData.time_series && analyticsData.time_series.labels && (
                    <>
                      {renderBarChart(
                        analyticsData.time_series.labels,
                        analyticsData.time_series.revenue || [],
                        'rgba(34, 197, 94, 0.6)'
                      )}
                    </>
                  )}
                </ChartCard>

                <TrendCard $trend={analyticsData.trends?.profit?.trend?.direction || 'stable'}>
                  <h4>Profit Trend</h4>
                  <div className="trend-indicator">
                    {analyticsData.trends?.profit?.trend?.direction === 'increasing' && (
                      <TrendingUp size={48} />
                    )}
                    {analyticsData.trends?.profit?.trend?.direction === 'decreasing' && (
                      <TrendingDown size={48} />
                    )}
                    {analyticsData.trends?.profit?.trend?.direction === 'stable' && (
                      <Activity size={48} />
                    )}
                  </div>
                  <p>Trend: {analyticsData.trends?.profit?.trend?.direction || 'stable'}</p>
                  <p>Strength: {analyticsData.trends?.profit?.trend?.strength?.toFixed(1) || 0}%</p>
                  {analyticsData.trends?.profit?.prediction?.next_value && (
                    <p>
                      Predicted next: {formatCurrency(analyticsData.trends.profit.prediction.next_value)}
                    </p>
                  )}
                </TrendCard>
              </TwoColumnGrid>

              <SectionTitle>Category Breakdown</SectionTitle>
              <TwoColumnGrid>
                <ChartCard>
                  <ChartTitle>Revenue by Category</ChartTitle>
                  <CategoryList>
                    {analyticsData.category_breakdown?.revenue_by_category?.map((item: any, index: number) => (
                      <CategoryItem key={index}>
                        <span className="category-name">{item.category || 'Unknown'}</span>
                        <span className="category-amount">
                          {formatCurrency(item.total || 0)}
                        </span>
                      </CategoryItem>
                    ))}
                  </CategoryList>
                </ChartCard>

                <ChartCard>
                  <ChartTitle>Expenses by Category</ChartTitle>
                  <CategoryList>
                    {analyticsData.category_breakdown?.expenses_by_category?.map((item: any, index: number) => (
                      <CategoryItem key={index}>
                        <span className="category-name">{item.category || 'Unknown'}</span>
                        <span className="category-amount">
                          {formatCurrency(item.total || 0)}
                        </span>
                      </CategoryItem>
                    ))}
                  </CategoryList>
                </ChartCard>
              </TwoColumnGrid>
            </>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default AnalyticsPage;

