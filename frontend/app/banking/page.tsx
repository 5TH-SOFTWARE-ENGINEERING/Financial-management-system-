"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Plus, TrendingUp, Upload, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { ComponentGate } from '@/lib/rbac';
import { useAuthorization } from '@/lib/rbac/use-authorization';
import Layout from "@/components/layout";

// Styled Components

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.backgroundSecondary};
  padding: ${props => props.theme.spacing.lg};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 940px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderText = styled.div``;

const Title = styled.h1`
  font-size: 1.875rem; /* 3xl */
  font-weight: 700;
  color: ${props => props.theme.colors.textDark};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-top: ${props => props.theme.spacing.xs};
`;

const ConnectButton = styled.button`
  background-color: #2563eb; /* blue-600 */
  &:hover {
    background-color: #1d4ed8; /* blue-700 */
  }
  color: white;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md}; /* rounded-lg */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
`;

const ChartCard = styled.div`
  background-color: ${props => props.theme.colors.card};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};
`;

const ChartHeader = styled.h2`
  font-size: 1.25rem; /* xl */
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.textDark};
`;

const ChartContainerWrapper = styled.div`
  height: 300px;
  width: 100%;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.lg};

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const AccountCard = styled.div`
  background-color: ${props => props.theme.colors.card};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};
`;

const AccountHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const IconWrapper = styled.div`
  padding: 0.75rem;
  background-color: #eff6ff; /* blue-50 */
  border-radius: ${props => props.theme.borderRadius.md};
  color: #2563eb; /* blue-600 */
`;

const StatusBadge = styled.span`
  font-size: 0.875rem; /* sm */
  padding: 0.25rem 0.5rem;
  background-color: #dcfce7; /* green-100 */
  color: #15803d; /* green-700 */
  border-radius: 9999px; /* rounded-full */
  font-weight: 500;
`;

const AccountName = styled.h3`
  font-size: 1.125rem; /* lg */
  font-weight: 700;
  color: ${props => props.theme.colors.textDark};
`;

const AccountDetails = styled.p`
  font-size: 0.875rem; /* sm */
  color: ${props => props.theme.colors.textSecondary};
`;

const ActionGroup = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  display: flex;
  gap: 0.5rem;
`;

const UploadLabel = styled.label`
  flex: 1;
  cursor: pointer;
  background-color: #f3f4f6; /* gray-100 */
  &:hover {
    background-color: #e5e7eb; /* gray-200 */
  }
  color: #374151; /* gray-700 */
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  text-align: center;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const SecondaryButton = styled.button`
  flex: 1;
  border: 1px solid ${props => props.theme.colors.border};
  &:hover {
    background-color: ${props => props.theme.colors.muted};
  }
  color: ${props => props.theme.colors.text};
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const SimulateGroup = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
`;

const SimulateSyncButton = styled.button`
  flex: 1;
  background-color: #eff6ff; /* blue-50 */
  &:hover {
    background-color: #dbeafe; /* blue-100 */
  }
  color: #1d4ed8; /* blue-700 */
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
`;

const WebhookButton = styled.button`
  flex: 1;
  background-color: #faf5ff; /* purple-50 */
  &:hover {
    background-color: #f3e8ff; /* purple-100 */
  }
  color: #7e22ce; /* purple-700 */
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
`;

const AddAccountButton = styled.button`
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px; /* approximates the height of other cards */

  &:hover {
    color: #2563eb; /* blue-600 */
    border-color: #3b82f6; /* blue-500 */
  }
`;

const AddAccountText = styled.span`
  font-weight: 500;
`;

export default function BankingPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [forecast, setForecast] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accountsRes, forecastRes] = await Promise.all([
                apiClient.getBankAccounts(),
                apiClient.getCashFlowForecast(30)
            ]);

            if (accountsRes.data) setAccounts(accountsRes.data);
            if (forecastRes.data && forecastRes.data.forecast) setForecast(forecastRes.data.forecast);

        } catch (error) {
            console.error("Failed to load banking data", error);
            toast.error("Failed to load banking dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpload = async (accountId: number, file: File) => {
        try {
            await apiClient.uploadBankStatement(accountId, file);
            toast.success("Statement uploaded successfully");
            loadData();
        } catch (error) {
            toast.error("Failed to upload statement");
        }
    };

    const handleSimulateFetch = async (accountId: number) => {
        try {
            const res = await apiClient.simulateBankFetch(accountId);
            toast.success(`Fetched ${res.data.length} simulated transactions`);
            loadData();
        } catch (error) {
            toast.error("Failed to simulate fetch");
        }
    };

    const handleSimulateWebhook = async (accountId: number) => {
        try {
            const payload = {
                amount: -(Math.random() * 100).toFixed(2),
                description: "Simulation Webhook Meal",
                date: new Date().toISOString()
            };
            await apiClient.simulateBankWebhook(accountId, payload);
            toast.success("Simulated webhook processed");
            loadData();
        } catch (error) {
            toast.error("Failed to simulate webhook");
        }
    };

    return (
        <Layout>
        <PageWrapper>
            <ContentContainer>
                {/* Header */}
                <Header>
                    <HeaderText>
                        <Title>Banking & Cash Flow</Title>
                        <Subtitle>Manage bank feeds and view AI-powered cash forecasts</Subtitle>
                    </HeaderText>
                    <ConnectButton>
                        <Plus size={20} /> Connect Account
                    </ConnectButton>
                </Header>

                {/* Cash Flow Forecast Chart */}
                <ChartCard>
                    <ChartHeader>
                        <TrendingUp className="text-green-500" /> 30-Day Cash Flow Forecast
                    </ChartHeader>
                    <ChartContainerWrapper>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecast}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="predicted_amount"
                                    stroke="#10b981"
                                    name="Predicted Net Cash Flow"
                                    strokeWidth={3}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainerWrapper>
                </ChartCard>

                {/* Bank Accounts Grid */}
                <GridContainer>
                    {accounts.map(account => (
                        <AccountCard key={account.id}>
                            <AccountHeader>
                                <IconWrapper>
                                    <DollarSign />
                                </IconWrapper>
                                <StatusBadge>Active</StatusBadge>
                            </AccountHeader>

                            <AccountName>{account.account_name}</AccountName>
                            <AccountDetails>{account.bank_name} •••• {account.account_number_last4}</AccountDetails>

                            <ActionGroup>
                                <UploadLabel>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".csv"
                                        onChange={(e) => e.target.files?.[0] && handleUpload(account.id, e.target.files[0])}
                                    />
                                    <Upload size={16} /> Upload CSV
                                </UploadLabel>
                                <SecondaryButton>
                                    View Txns
                                </SecondaryButton>
                            </ActionGroup>

                            <SimulateGroup>
                                <SimulateSyncButton onClick={() => handleSimulateFetch(account.id)}>
                                    Simulate Sync
                                </SimulateSyncButton>
                                <WebhookButton onClick={() => handleSimulateWebhook(account.id)}>
                                    Webhook (Mock)
                                </WebhookButton>
                            </SimulateGroup>
                        </AccountCard>
                    ))}

                    {/* Add New Placeholder */}
                    <AddAccountButton>
                        <Plus size={40} style={{ marginBottom: '0.5rem' }} />
                        <AddAccountText>Connect New Bank</AddAccountText>
                    </AddAccountButton>
                </GridContainer>
            </ContentContainer>
        </PageWrapper>
        </Layout>
    );
}
