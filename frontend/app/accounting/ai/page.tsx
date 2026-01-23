"use client";

import { useState, useEffect } from "react";
import styled, { css, keyframes } from 'styled-components';
import {
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    Search,
    CheckCircle,
    XCircle,
    LineChart as ChartIcon,
    RefreshCw,
    Info,
    ArrowRight
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// --- Styled Components ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.xl};
`;

const ContentWrapper = styled.div`
  max-width: 1280px; // 7xl
  margin: 0 auto;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xxl};
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 2.5rem; // 4xl
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  letter-spacing: -0.025em;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.125rem; // lg
  font-weight: 500;
`;

const TabGroup = styled.div`
  background-color: ${props => props.theme.colors.card};
  padding: 4px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 4px;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; // sm
  font-weight: 600;
  transition: all 0.2s ease;
  
  ${props => props.$active ? css`
    background-color: ${props => props.theme.colors.text};
    color: ${props => props.theme.colors.background};
    box-shadow: ${props => props.theme.shadows.md};
  ` : css`
    color: ${props => props.theme.colors.textSecondary};
    &:hover {
      color: ${props => props.theme.colors.text};
    }
  `}
`;

const Grid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.lg};
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(${props => props.$cols || 3}, 1fr);
  }
`;

const Card = styled.div`
  background-color: ${props => props.theme.colors.card};
  border-radius: 24px; // 3xl
  padding: ${props => props.theme.spacing.xl};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  position: relative;
  overflow: hidden;
`;

const StatCard = styled(Card)`
  &:hover .icon {
    transform: scale(1.1);
  }
`;

const StatIconWrapper = styled.div`
  position: absolute;
  right: -16px;
  bottom: -16px;
  width: 128px;
  height: 128px;
  transition: transform 0.5s ease;
  
  &.red { color: #fef2f2; } // red-50
  &.green { color: #f0fdf4; } // green-50
  
  // Dark mode overrides (simplified via theme logic or css var if configured, hardcoding for now based on previous pattern)
  @media (prefers-color-scheme: dark) {
     &.red { color: rgba(127, 29, 29, 0.1); }
     &.green { color: rgba(20, 83, 45, 0.1); }
  }
`;

const StatLabel = styled.h3`
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem; // xs
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatValue = styled.div<{ $color?: string }>`
  font-size: 3rem; // 5xl
  font-weight: 900;
  margin-bottom: ${props => props.theme.spacing.xs};
  color: ${props => props.$color || props.theme.colors.text};
`;

const StatSubtext = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem; // sm
  opacity: 0.7; // gray-400
`;

const ActionCard = styled(Card)`
  background-color: ${props => props.theme.colors.text}; // Inverted
  color: ${props => props.theme.colors.background};
  cursor: pointer;
  transition: transform 0.2s;
  text-align: left;
  
  &:hover {
    transform: scale(1.02);
  }
  
  ${StatIconWrapper} {
    color: rgba(255, 255, 255, 0.05);
  }
  
  ${StatLabel}, ${StatSubtext} {
    color: rgba(255, 255, 255, 0.5);
  }
  
  ${StatValue} {
    color: ${props => props.theme.colors.background};
    font-size: 1.875rem; // 3xl
  }
`;

const SuspiciousList = styled(Card)`
  padding: 0;
`;

const ListHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ListTitle = styled.h2`
  font-size: 1.25rem; // xl
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text};
`;

const CountBadge = styled.span`
  background-color: #fee2e2; // red-100
  color: #dc2626; // red-600
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem; // xs
`;

const ListBody = styled.div`
  /* divide-y logic manually */
  & > div:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const EmptyState = styled.div`
  padding: 5rem;
  text-center: center;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  background-color: ${props => props.theme.colors.muted};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.textSecondary};
`;

const ListItem = styled.div`
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.muted};
  }
`;

const ScoreBadge = styled.div`
  width: 48px;
  height: 48px;
  background-color: #fef2f2; // red-50
  border-radius: ${props => props.theme.borderRadius.lg}; // 2xl usually 1rem/16px
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626; // red-600
  font-weight: 700;
`;

const ItemContent = styled.div`
  flex: 1;
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: 4px;
`;

const SourceId = styled.span`
  font-size: 0.875rem; // sm
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.colors.textSecondary};
`;

const StatusTag = styled.span<{ $status: string }>`
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  
  ${props => {
        switch (props.$status) {
            case 'pending': return css`background: #fef9c3; color: #a16207;`; // yellow-100/700
            case 'confirmed': return css`background: #fee2e2; color: #b91c1c;`; // red-100/700
            default: return css`background: #dcfce7; color: #15803d;`; // green-100/700
        }
    }}
`;

const ItemReason = styled.p`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const ItemDate = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem; // sm
  margin-top: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  opacity: 0;
  transition: opacity 0.2s;
  
  ${ListItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.textSecondary};
  transition: all 0.2s;
  
  &:hover {
    &.approve {
      background-color: #f0fdf4;
      color: #16a34a;
    }
    &.reject {
      background-color: #fef2f2;
      color: #dc2626;
    }
  }
`;

// Scenarios styled components
const ScenarioLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.xl};
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 2fr;
  }
`;

const ControlCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ControlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ControlLabel = styled.label`
  font-size: 0.875rem; // sm
  font-weight: 700;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ControlValue = styled.span`
   background-color: ${props => props.theme.colors.primary}1A; // alpha 10%
   color: ${props => props.theme.colors.primary};
   padding: 4px 12px;
   border-radius: ${props => props.theme.borderRadius.md};
   font-size: 0.875rem;
   font-weight: 900;
`;

const RangeInput = styled.input.attrs({ type: 'range' })`
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
  
  &:focus {
    outline: none;
  }
  
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background: ${props => props.theme.colors.border};
    border-radius: 10px;
  }
  
  &::-webkit-slider-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary};
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -7px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
`;

const StyledInput = styled.input`
  width: 100%;
  background-color: ${props => props.theme.colors.muted};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: none;
  outline: none;
  font-size: 0.875rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const UpdateButton = styled.button`
  width: 100%;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
  box-shadow: 0 10px 15px -3px ${props => props.theme.colors.primary}33; // shadow-blue-500/20
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary};
    filter: brightness(0.9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NetImpactCard = styled(Card)`
  margin-top: ${props => props.theme.spacing.lg};
`;

const NetImpactValue = styled.div<{ $positive: boolean }>`
  font-size: 2.25rem; // 4xl
  font-weight: 900;
  color: ${props => props.$positive ? '#16a34a' : '#dc2626'};
  margin-top: ${props => props.theme.spacing.sm};
`;

const ChartCard = styled(Card)`
  height: 600px;
  display: flex;
  flex-direction: column;
`;

const ChartHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${props => props.theme.colors.text};
`;

const LegendContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${props => props.theme.colors.textSecondary};
`;

const LegendItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Dot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.$color};
`;

// --- Interfaces ---

interface FraudFlag {
    id: number;
    source_type: string;
    source_id: number;
    fraud_score: number;
    reason: string;
    status: string;
    created_at: string;
}

interface SimulationResult {
    dates: string[];
    base_revenue: number[];
    base_expenses: number[];
    projected_revenue: number[];
    projected_expenses: number[];
    net_impact: number;
}

export default function AIDashboard() {
    const [activeTab, setActiveTab] = useState<"fraud" | "scenarios">("fraud");
    const [flags, setFlags] = useState<FraudFlag[]>([]);
    const [loadingFlags, setLoadingFlags] = useState(false);
    const [scanning, setScanning] = useState(false);

    // Scenario state
    const [scenario, setScenario] = useState({
        period_months: 12,
        revenue_multiplier: 1.0,
        expense_multiplier: 1.0,
        fixed_revenue_offset: 0,
        fixed_expense_offset: 0
    });
    const [simulation, setSimulation] = useState<SimulationResult | null>(null);
    const [simulating, setSimulating] = useState(false);

    useEffect(() => {
        if (activeTab === "fraud") fetchFlags();
        if (activeTab === "scenarios") runSimulation();
    }, [activeTab]);

    const fetchFlags = async () => {
        try {
            setLoadingFlags(true);
            const res = await apiClient.getFraudFlags();
            if (res.data) setFlags(res.data);
        } catch (error) {
            console.error("Failed to fetch fraud flags:", error);
        } finally {
            setLoadingFlags(false);
        }
    };

    const handleScan = async () => {
        try {
            setScanning(true);
            const res = await apiClient.runFraudScan();
            toast.success(`Scan complete: ${res.data.new_flags_found} new flags found`);
            fetchFlags();
        } catch (error) {
            toast.error("Failed to run fraud scan");
        } finally {
            setScanning(false);
        }
    };

    const handleUpdateFlag = async (id: number, status: string) => {
        try {
            await apiClient.updateFraudFlag(id, { status });
            toast.success(`Flag ${status}`);
            setFlags(flags.map(f => f.id === id ? { ...f, status } : f));
        } catch (error) {
            toast.error("Failed to update flag");
        }
    };

    const runSimulation = async () => {
        try {
            setSimulating(true);
            const res = await apiClient.runScenarioSimulation(scenario);
            if (res.data) setSimulation(res.data);
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setSimulating(false);
        }
    };

    const chartData = simulation ? simulation.dates.map((date, i) => ({
        name: date,
        "Base Profit": simulation.base_revenue[i] - simulation.base_expenses[i],
        "Projected Profit": simulation.projected_revenue[i] - simulation.projected_expenses[i],
    })) : [];

    return (
        <Layout>
            <PageContainer>
                <ContentWrapper>
                    {/* Header */}
                    <Header>
                        <TitleSection>
                            <Title>Applied AI</Title>
                            <Subtitle>Fraud detection and predictive scenario modeling</Subtitle>
                        </TitleSection>

                        <TabGroup>
                            <TabButton
                                $active={activeTab === "fraud"}
                                onClick={() => setActiveTab("fraud")}
                            >
                                Fraud Detection
                            </TabButton>
                            <TabButton
                                $active={activeTab === "scenarios"}
                                onClick={() => setActiveTab("scenarios")}
                            >
                                Scenario Modeling
                            </TabButton>
                        </TabGroup>
                    </Header>

                    {activeTab === "fraud" ? (
                        <Grid>
                            {/* Summary Cards */}
                            <StatCard>
                                <StatIconWrapper className="red">
                                    <AlertTriangle style={{ width: '100%', height: '100%' }} />
                                </StatIconWrapper>
                                <StatLabel>Pending Flags</StatLabel>
                                <StatValue $color="#dc2626">
                                    {flags.filter(f => f.status === "pending").length}
                                </StatValue>
                                <StatSubtext>Need immediate review</StatSubtext>
                            </StatCard>

                            <ActionCard onClick={handleScan}>
                                <StatIconWrapper>
                                    <RefreshCw
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            animation: scanning ? `${spin} 1s linear infinite` : 'none'
                                        }}
                                    />
                                </StatIconWrapper>
                                <StatLabel>AI Scanner</StatLabel>
                                <StatValue>
                                    {scanning ? "Scanning..." : "Start Global Scan"}
                                </StatValue>
                                <StatSubtext>Analyze all transactions for anomalies</StatSubtext>
                            </ActionCard>

                            <StatCard>
                                <StatIconWrapper className="green">
                                    <ShieldCheck style={{ width: '100%', height: '100%' }} />
                                </StatIconWrapper>
                                <StatLabel>Detection Mode</StatLabel>
                                <StatValue $color="#16a34a">Active</StatValue>
                                <StatSubtext>Hybrid: Rule + ML Engine</StatSubtext>
                            </StatCard>

                            {/* Flags List */}
                            <SuspiciousList style={{ gridColumn: '1 / -1' }}>
                                <ListHeader>
                                    <ListTitle>
                                        Suspicious Transactions
                                        <CountBadge>{flags.length} total</CountBadge>
                                    </ListTitle>
                                </ListHeader>

                                <ListBody>
                                    {flags.length === 0 ? (
                                        <EmptyState>
                                            <EmptyIcon>
                                                <ShieldCheck size={32} />
                                            </EmptyIcon>
                                            <p style={{ color: '#6b7280', fontWeight: 500 }}>No suspicious transactions detected</p>
                                        </EmptyState>
                                    ) : (
                                        flags.map((flag) => (
                                            <ListItem key={flag.id}>
                                                <ScoreBadge>
                                                    {Math.round(flag.fraud_score * 100)}%
                                                </ScoreBadge>

                                                <ItemContent>
                                                    <ItemHeader>
                                                        <SourceId>{flag.source_type} #{flag.source_id}</SourceId>
                                                        <StatusTag $status={flag.status}>
                                                            {flag.status}
                                                        </StatusTag>
                                                    </ItemHeader>
                                                    <ItemReason>{flag.reason}</ItemReason>
                                                    <ItemDate>{new Date(flag.created_at).toLocaleString()}</ItemDate>
                                                </ItemContent>

                                                <ActionButtons>
                                                    <ActionButton
                                                        className="approve"
                                                        onClick={() => handleUpdateFlag(flag.id, "dismissed")}
                                                        title="Dismiss"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </ActionButton>
                                                    <ActionButton
                                                        className="reject"
                                                        onClick={() => handleUpdateFlag(flag.id, "confirmed")}
                                                        title="Confirm Fraud"
                                                    >
                                                        <XCircle size={20} />
                                                    </ActionButton>
                                                </ActionButtons>
                                            </ListItem>
                                        ))
                                    )}
                                </ListBody>
                            </SuspiciousList>
                        </Grid>
                    ) : (
                        <ScenarioLayout>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <ControlCard>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ChartIcon size={20} color="#2563eb" />
                                        Simulation Parameters
                                    </h3>

                                    <ControlGroup>
                                        <ControlHeader>
                                            <ControlLabel>Revenue Growth</ControlLabel>
                                            <ControlValue>
                                                {(scenario.revenue_multiplier - 1) * 100 > 0 ? "+" : ""}{((scenario.revenue_multiplier - 1) * 100).toFixed(0)}%
                                            </ControlValue>
                                        </ControlHeader>
                                        <RangeInput
                                            min="0.5" max="2.0" step="0.05"
                                            value={scenario.revenue_multiplier}
                                            onChange={(e) => setScenario({ ...scenario, revenue_multiplier: parseFloat(e.target.value) })}
                                        />
                                    </ControlGroup>

                                    <ControlGroup>
                                        <ControlHeader>
                                            <ControlLabel>Expense Impact</ControlLabel>
                                            <ControlValue>
                                                {(scenario.expense_multiplier - 1) * 100 > 0 ? "+" : ""}{((scenario.expense_multiplier - 1) * 100).toFixed(0)}%
                                            </ControlValue>
                                        </ControlHeader>
                                        <RangeInput
                                            min="0.5" max="2.0" step="0.05"
                                            value={scenario.expense_multiplier}
                                            onChange={(e) => setScenario({ ...scenario, expense_multiplier: parseFloat(e.target.value) })}
                                        />
                                    </ControlGroup>

                                    <div style={{ paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Info size={16} />
                                            Advanced Modifiers
                                        </div>
                                        <InputGrid>
                                            <StyledInput
                                                type="number"
                                                placeholder="Rev Offset"
                                                onChange={(e) => setScenario({ ...scenario, fixed_revenue_offset: parseFloat(e.target.value) || 0 })}
                                            />
                                            <StyledInput
                                                type="number"
                                                placeholder="Exp Offset"
                                                onChange={(e) => setScenario({ ...scenario, fixed_expense_offset: parseFloat(e.target.value) || 0 })}
                                            />
                                        </InputGrid>
                                    </div>

                                    <UpdateButton onClick={runSimulation} disabled={simulating}>
                                        {simulating ? "Calculating..." : "Update Forecast"}
                                        <ArrowRight size={16} />
                                    </UpdateButton>
                                </ControlCard>

                                <NetImpactCard>
                                    <StatLabel>Net Impact</StatLabel>
                                    <NetImpactValue $positive={!!simulation?.net_impact && simulation.net_impact > 0}>
                                        {simulation?.net_impact ? (simulation.net_impact > 0 ? "+" : "") : ""}
                                        {simulation ? `$${Math.round(simulation.net_impact).toLocaleString()}` : "$0"}
                                    </NetImpactValue>
                                    <StatSubtext>Total projected difference</StatSubtext>
                                </NetImpactCard>
                            </div>

                            <ChartCard>
                                <ChartHeader>
                                    Projected Profit Growth
                                    <LegendContainer>
                                        <LegendItem><Dot $color="#bfdbfe" /> Base</LegendItem>
                                        <LegendItem><Dot $color="#2563eb" /> Projected</LegendItem>
                                    </LegendContainer>
                                </ChartHeader>

                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                                interval={Math.floor((simulation?.dates?.length ?? 0) / 6)}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="Base Profit" stroke="#94a3b8" strokeWidth={2} fill="transparent" />
                                            <Area type="monotone" dataKey="Projected Profit" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorProj)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </ScenarioLayout>
                    )}
                </ContentWrapper>
            </PageContainer>
        </Layout>
    );
}
