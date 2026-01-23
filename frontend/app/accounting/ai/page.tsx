"use client";

import { useState, useEffect } from "react";
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
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

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
        <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Applied AI</h1>
                        <p className="text-gray-500 text-lg mt-1 font-medium">Fraud detection and predictive scenario modeling</p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex gap-1">
                        <button
                            onClick={() => setActiveTab("fraud")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "fraud"
                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            Fraud Detection
                        </button>
                        <button
                            onClick={() => setActiveTab("scenarios")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "scenarios"
                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            Scenario Modeling
                        </button>
                    </div>
                </div>

                {activeTab === "fraud" ? (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                                <AlertTriangle className="absolute -right-4 -bottom-4 w-32 h-32 text-red-50 dark:text-red-900/10 group-hover:scale-110 transition-transform duration-500" />
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">Pending Flags</h3>
                                <div className="text-5xl font-black text-red-600 mb-2">
                                    {flags.filter(f => f.status === "pending").length}
                                </div>
                                <p className="text-gray-400 text-sm">Need immediate review</p>
                            </div>

                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                className="bg-gray-900 dark:bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group text-left hover:scale-[1.02] transition-transform"
                            >
                                <RefreshCw className={`absolute -right-4 -bottom-4 w-32 h-32 text-white/5 dark:text-gray-900/5 ${scanning ? "animate-spin" : "group-hover:rotate-45 transition-transform duration-700"}`} />
                                <h3 className="text-white/50 dark:text-gray-900/50 font-bold uppercase tracking-widest text-xs mb-4">AI Scanner</h3>
                                <div className="text-3xl font-black text-white dark:text-gray-900 mb-2">
                                    {scanning ? "Scanning..." : "Start Global Scan"}
                                </div>
                                <p className="text-white/50 dark:text-gray-900/50 text-sm">Analyze all transactions for anomalies</p>
                            </button>

                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                                <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-green-50 dark:text-green-900/10" />
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">Detection Mode</h3>
                                <div className="text-3xl font-black text-green-600 mb-2">Active</div>
                                <p className="text-gray-400 text-sm font-medium">Hybrid: Rule + ML Engine</p>
                            </div>
                        </div>

                        {/* Flags List */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Suspicious Transactions
                                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{flags.length} total</span>
                                </h2>
                                <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {flags.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                            <ShieldCheck className="w-8 h-8" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No suspicious transactions detected</p>
                                    </div>
                                ) : (
                                    flags.map((flag) => (
                                        <div key={flag.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 font-bold">
                                                {Math.round(flag.fraud_score * 100)}%
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-sm font-bold uppercase tracking-widest text-gray-400">{flag.source_type} #{flag.source_id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${flag.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                        flag.status === "confirmed" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                                        }`}>
                                                        {flag.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-900 dark:text-white font-semibold">{flag.reason}</p>
                                                <p className="text-gray-400 text-sm mt-1">{new Date(flag.created_at).toLocaleString()}</p>
                                            </div>

                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleUpdateFlag(flag.id, "dismissed")}
                                                    className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateFlag(flag.id, "confirmed")}
                                                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Contols */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ChartIcon className="w-5 h-5 text-blue-600" />
                                    Simulation Parameters
                                </h3>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Revenue Growth</label>
                                            <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 px-3 py-1 rounded-lg text-sm font-black">
                                                {(scenario.revenue_multiplier - 1) * 100 > 0 ? "+" : ""}{((scenario.revenue_multiplier - 1) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="0.5" max="2.0" step="0.05"
                                            value={scenario.revenue_multiplier}
                                            onChange={(e) => setScenario({ ...scenario, revenue_multiplier: parseFloat(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Expense Impact</label>
                                            <span className="bg-orange-50 text-orange-600 dark:bg-orange-900/20 px-3 py-1 rounded-lg text-sm font-black">
                                                {(scenario.expense_multiplier - 1) * 100 > 0 ? "+" : ""}{((scenario.expense_multiplier - 1) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="0.5" max="2.0" step="0.05"
                                            value={scenario.expense_multiplier}
                                            onChange={(e) => setScenario({ ...scenario, expense_multiplier: parseFloat(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 dark:border-gray-800 space-y-4">
                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <Info className="w-4 h-4" />
                                            Advanced Modifiers
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="number" placeholder="Rev Offset"
                                                onChange={(e) => setScenario({ ...scenario, fixed_revenue_offset: parseFloat(e.target.value) || 0 })}
                                                className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border-none outline-none text-sm font-bold"
                                            />
                                            <input
                                                type="number" placeholder="Exp Offset"
                                                onChange={(e) => setScenario({ ...scenario, fixed_expense_offset: parseFloat(e.target.value) || 0 })}
                                                className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border-none outline-none text-sm font-bold"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={runSimulation}
                                        disabled={simulating}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {simulating ? "Calculating..." : "Update Forecast"}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Net Impact</h3>
                                <div className={`text-4xl font-black ${simulation?.net_impact && simulation.net_impact > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {simulation?.net_impact ? (simulation.net_impact > 0 ? "+" : "") : ""}
                                    {simulation ? `$${Math.round(simulation.net_impact).toLocaleString()}` : "$0"}
                                </div>
                                <p className="text-gray-400 text-sm mt-1 underline decoration-dotted">Total projected difference</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm h-[600px]">
                                <h2 className="text-xl font-bold mb-8 flex items-center justify-between">
                                    Projected Profit Growth
                                    <div className="flex gap-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-100" /> Base</span>
                                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-600" /> Projected</span>
                                    </div>
                                </h2>

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
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                input[type=range] {
                    -webkit-appearance: none;
                    background: transparent;
                }
                input[type=range]:focus {
                    outline: none;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 6px;
                    cursor: pointer;
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                input[type=range]::-webkit-slider-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #2563eb;
                    cursor: pointer;
                    -webkit-appearance: none;
                    margin-top: -7px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                }
                .dark input[type=range]::-webkit-slider-runnable-track {
                    background: #1e293b;
                }
            `}</style>
        </div>
    );
}
