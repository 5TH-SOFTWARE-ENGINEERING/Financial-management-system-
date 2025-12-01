'use client';
import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Calculator, History, ArrowRight
} from 'lucide-react';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';
import Link from 'next/link';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
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
  max-width: 1200px;
  margin: 0 auto;
  padding: ${theme.spacing.lg};
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

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const OptionCard = styled(Link)`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  text-decoration: none;
  color: ${TEXT_COLOR_DARK};
  transition: all ${theme.transitions.default};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  
  &:hover {
    box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    border-color: ${PRIMARY_COLOR};
  }
  
  .icon {
    width: 48px;
    height: 48px;
    background: ${PRIMARY_COLOR}15;
    border-radius: ${theme.borderRadius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${PRIMARY_COLOR};
  }
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0;
    flex: 1;
  }
  
  .link {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    color: ${PRIMARY_COLOR};
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    margin-top: ${theme.spacing.sm};
  }
`;

const VariancePage: React.FC = () => {
  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <h1>
              <BarChart3 size={36} />
              Variance Analysis
            </h1>
            <p style={{ marginTop: theme.spacing.sm, opacity: 0.9 }}>
              Monitor and analyze budget performance against actuals
            </p>
          </HeaderContainer>

          <OptionsGrid>
            <OptionCard href="/variance/calculatevariance">
              <div className="icon">
                <Calculator size={24} />
              </div>
              <h2>Calculate Variance</h2>
              <p>
                Compare budgeted amounts with actual revenue and expenses for a specific period. 
                Calculate variance metrics including revenue, expense, and profit variances.
              </p>
              <div className="link">
                Calculate Variance <ArrowRight size={16} />
              </div>
            </OptionCard>

            <OptionCard href="/variance/variancehistory">
              <div className="icon">
                <History size={24} />
              </div>
              <h2>Variance History</h2>
              <p>
                View historical variance calculations for budgets. Track variance trends over time 
                and analyze performance across multiple periods.
              </p>
              <div className="link">
                View History <ArrowRight size={16} />
              </div>
            </OptionCard>

            <OptionCard href="/variance/variancesummery">
              <div className="icon">
                <BarChart3 size={24} />
              </div>
              <h2>Variance Summary</h2>
              <p>
                Get an overview of budget variance performance across all periods. 
                View overall statistics and period-by-period summaries.
              </p>
              <div className="link">
                View Summary <ArrowRight size={16} />
              </div>
            </OptionCard>
          </OptionsGrid>
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default VariancePage;

