// app/accounting/accounts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface Account {
    id: number;
    code: string;
    name: string;
    account_type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    description?: string;
    parent_account_id?: number;
    currency_code?: string;
    is_active: boolean;
    is_system_account: boolean;
}

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedType, setSelectedType] = useState<string>("ALL");

    const accountTypes = [
        { value: "ALL", label: "All Accounts", color: "bg-gray-500" },
        { value: "ASSET", label: "Assets", color: "bg-blue-500" },
        { value: "LIABILITY", label: "Liabilities", color: "bg-red-500" },
        { value: "EQUITY", label: "Equity", color: "bg-purple-500" },
        { value: "REVENUE", label: "Revenue", color: "bg-green-500" },
        { value: "EXPENSE", label: "Expenses", color: "bg-orange-500" },
    ];

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getAccountingAccounts();
                if (response.data) {
                    // Normalise backend date to match frontend expected types (e.g. uppercase enum)
                    const normalizedAccounts = (response.data as any[]).map(acc => ({
                        ...acc,
                        account_type: acc.account_type?.toUpperCase()
                    }));
                    setAccounts(normalizedAccounts);
                }
            } catch (error) {
                console.error("Failed to fetch accounts:", error);
                toast.error("Failed to load accounts");
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    const filteredAccounts = selectedType === "ALL"
        ? accounts
        : accounts.filter(acc => acc.account_type === selectedType);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Chart of Accounts
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage your account structure and hierarchy
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        New Account
                    </button>
                </div>

                {/* Account Type Filter */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                    {accountTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setSelectedType(type.value)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${selectedType === type.value
                                ? `${type.color} text-white shadow-lg`
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Accounts Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Account Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Currency
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No accounts found. Create your first account to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((account) => (
                                        <tr
                                            key={account.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                                    {account.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {account.name}
                                                    </span>
                                                    {account.is_system_account && (
                                                        <span className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                            System
                                                        </span>
                                                    )}
                                                </div>
                                                {account.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {account.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${account.account_type === "ASSET" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                                    account.account_type === "LIABILITY" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                                        account.account_type === "EQUITY" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                                                            account.account_type === "REVENUE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                                                "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                                    }`}>
                                                    {account.account_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                                                {account.currency_code || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${account.is_active
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                    }`}>
                                                    {account.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    {!account.is_system_account && (
                                                        <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                    {accountTypes.slice(1).map((type) => {
                        const count = accounts.filter(acc => acc.account_type === type.value).length;
                        return (
                            <div
                                key={type.value}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                            >
                                <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center mb-2`}>
                                    <span className="text-white font-bold text-lg">{count}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
