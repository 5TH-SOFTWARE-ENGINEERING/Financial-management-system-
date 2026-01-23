// app/accounting/journal-entries/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface JournalEntryLine {
    id: number;
    account: {
        code: string;
        name: string;
    };
    debit_amount: number;
    credit_amount: number;
    description?: string;
}

interface JournalEntry {
    id: number;
    entry_number: string;
    entry_id: string;
    entry_date: string;
    description: string;
    reference_type: string;
    reference_id?: number;
    status: "DRAFT" | "POSTED" | "REVERSED";
    lines: JournalEntryLine[];
    created_by: {
        full_name: string;
    };
    posted_at?: string;
    posted_by?: {
        full_name: string;
    };
}

export default function JournalEntriesPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

    const statuses = [
        { value: "ALL", label: "All Entries", color: "bg-gray-500" },
        { value: "DRAFT", label: "Draft", color: "bg-yellow-500" },
        { value: "POSTED", label: "Posted", color: "bg-green-500" },
        { value: "REVERSED", label: "Reversed", color: "bg-red-500" },
    ];

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getAccountingJournalEntries();
                if (response.data) {
                    setEntries(response.data as any[]); // Using any cast temporarily to match specific frontend interface
                }
            } catch (error) {
                console.error("Failed to fetch journal entries:", error);
                toast.error("Failed to load journal entries");
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, []);

    const handlePostEntry = async (entryId: number) => {
        try {
            await apiClient.postAccountingJournalEntry(entryId);
            toast.success("Entry posted successfully");
            // Refresh entries
            const response = await apiClient.getAccountingJournalEntries();
            if (response.data) {
                setEntries(response.data as any[]);
            }
        } catch (error) {
            console.error("Failed to post entry:", error);
            toast.error("Failed to post entry");
        }
    };

    const filteredEntries = selectedStatus === "ALL"
        ? entries
        : entries.filter(entry => entry.status === selectedStatus);

    const getTotalDebits = (lines: JournalEntryLine[]) => {
        return lines.reduce((sum, line) => sum + line.debit_amount, 0);
    };

    const getTotalCredits = (lines: JournalEntryLine[]) => {
        return lines.reduce((sum, line) => sum + line.credit_amount, 0);
    };

    const isBalanced = (lines: JournalEntryLine[]) => {
        return Math.abs(getTotalDebits(lines) - getTotalCredits(lines)) < 0.01;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Journal Entries
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Double-entry bookkeeping journal entries
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                        <Plus className="w-5 h-5" />
                        Manual Entry
                    </button>
                </div>

                {/* Status Filter */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                    {statuses.map((status) => (
                        <button
                            key={status.value}
                            onClick={() => setSelectedStatus(status.value)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${selectedStatus === status.value
                                ? `${status.color} text-white shadow-lg`
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                {/* Journal Entries List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No journal entries found. Entries are automatically created from transactions.
                            </p>
                        </div>
                    ) : (
                        filteredEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                                {/* Entry Header */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                                                    {entry.entry_number}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${entry.status === "POSTED"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    : entry.status === "DRAFT"
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                    }`}>
                                                    {entry.status}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                    {entry.reference_type}
                                                </span>
                                                {isBalanced(entry.lines) ? (
                                                    <span title="Balanced">
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    </span>
                                                ) : (
                                                    <span title="Unbalanced">
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-900 dark:text-white font-medium mb-1">
                                                {entry.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>Created by {entry.created_by.full_name}</span>
                                                {entry.posted_at && entry.posted_by && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Posted by {entry.posted_by.full_name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ${getTotalDebits(entry.lines).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Entry Lines (Expanded) */}
                                {expandedEntry === entry.id && (
                                    <div className="border-t border-gray-200 dark:border-gray-700">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-gray-900">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                            Account
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                            Description
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                            Debit
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                            Credit
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {entry.lines.map((line) => (
                                                        <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                                                        {line.account.code}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {line.account.name}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                                {line.description || "—"}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {line.debit_amount > 0 ? (
                                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                                        ${line.debit_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {line.credit_amount > 0 ? (
                                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                                        ${line.credit_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Totals Row */}
                                                    <tr className="bg-gray-50 dark:bg-gray-900 font-bold">
                                                        <td colSpan={2} className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            TOTALS
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            ${getTotalDebits(entry.lines).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            ${getTotalCredits(entry.lines).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Actions */}
                                        {entry.status === "DRAFT" && (
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                                                <button
                                                    onClick={() => handlePostEntry(entry.id)}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200"
                                                >
                                                    Post Entry
                                                </button>
                                                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors duration-200">
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                        {entry.status === "POSTED" && (
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                                                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200">
                                                    <RotateCcw className="w-4 h-4" />
                                                    Reverse Entry
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
