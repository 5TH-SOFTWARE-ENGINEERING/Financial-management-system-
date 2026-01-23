"use client";

import { useState, useEffect } from "react";
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

export default function BankingPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [forecast, setForecast] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        loadData();
    }, []);

    const handleUpload = async (accountId: number, file: File) => {
        try {
            await apiClient.uploadBankStatement(accountId, file);
            toast.success("Statement uploaded successfully");
            // Reload logic could go here
        } catch (error) {
            toast.error("Failed to upload statement");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Banking & Cash Flow</h1>
                        <p className="text-gray-500 mt-1">Manage bank feeds and view AI-powered cash forecasts</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <Plus size={20} /> Connect Account
                    </button>
                </div>

                {/* Cash Flow Forecast Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-green-500" /> 30-Day Cash Flow Forecast
                    </h2>
                    <div className="h-[300px] w-full">
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
                    </div>
                </div>

                {/* Bank Accounts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map(account => (
                        <div key={account.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <DollarSign className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Active</span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{account.account_name}</h3>
                            <p className="text-sm text-gray-500">{account.bank_name} •••• {account.account_number_last4}</p>

                            <div className="mt-6 flex gap-2">
                                <label className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".csv"
                                        onChange={(e) => e.target.files?.[0] && handleUpload(account.id, e.target.files[0])}
                                    />
                                    <Upload size={16} className="inline mr-2" /> Upload CSV
                                </label>
                                <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                                    View Txns
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder */}
                    <button className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-500 transition-colors">
                        <Plus size={40} className="mb-2" />
                        <span className="font-medium">Connect New Bank</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
