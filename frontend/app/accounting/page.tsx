// app/accounting/page.tsx
"use client";

import { useRouter } from "next/navigation";
import {
    BookOpen,
    DollarSign,
    Globe,
    Receipt,
    TrendingUp,
    FileText,
    Settings
} from "lucide-react";

export default function AccountingHomePage() {
    const router = useRouter();

    const modules = [
        {
            title: "Chart of Accounts",
            description: "Manage your account structure and hierarchy",
            icon: BookOpen,
            href: "/accounting/accounts",
            color: "bg-blue-500",
        },
        {
            title: "Journal Entries",
            description: "View and manage double-entry journal entries",
            icon: FileText,
            href: "/accounting/journal-entries",
            color: "bg-green-500",
        },
        {
            title: "Tax Configuration",
            description: "Configure tax types and rates",
            icon: Receipt,
            href: "/accounting/taxes",
            color: "bg-purple-500",
        },
        {
            title: "Currency Management",
            description: "Manage currencies and exchange rates",
            icon: Globe,
            href: "/accounting/currencies",
            color: "bg-orange-500",
        },
        {
            title: "Trial Balance",
            description: "View trial balance report",
            icon: TrendingUp,
            href: "/accounting/trial-balance",
            color: "bg-indigo-500",
        },
        {
            title: "General Ledger",
            description: "View general ledger by account",
            icon: DollarSign,
            href: "/accounting/general-ledger",
            color: "bg-teal-500",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Accounting System
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Double-entry bookkeeping with multi-currency and tax support
                    </p>
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => {
                        const Icon = module.icon;
                        return (
                            <button
                                key={module.href}
                                onClick={() => router.push(module.href)}
                                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
                            >
                                {/* Icon */}
                                <div className={`${module.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {module.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {module.description}
                                </p>

                                {/* Hover Arrow */}
                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <svg
                                        className="w-6 h-6 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Accounts</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">--</p>
                            </div>
                            <BookOpen className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Journal Entries</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">--</p>
                            </div>
                            <FileText className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Currencies</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">--</p>
                            </div>
                            <Globe className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tax Rates</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">--</p>
                            </div>
                            <Receipt className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
