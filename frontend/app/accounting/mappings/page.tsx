'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
    LayoutDashboard,
    Link as LinkIcon,
    Plus,
    Trash2,
    Settings2,
    Save,
    Search,
    ChevronRight,
    Loader2
} from 'lucide-react';

export default function AccountMappingsPage() {
    const [mappings, setMappings] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        module: 'revenue',
        category: '',
        account_id: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [mappingsRes, accountsRes] = await Promise.all([
                apiClient.getAccountMappings(),
                apiClient.getAccounts()
            ]);
            setMappings(mappingsRes.data);
            setAccounts(accountsRes.data);
        } catch (error) {
            toast.error("Failed to load mappings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.createAccountMapping({
                module: formData.module,
                category: formData.category,
                account_id: parseInt(formData.account_id)
            });
            toast.success("Mapping saved successfully");
            setIsAdding(false);
            setFormData({ module: 'revenue', category: '', account_id: '' });
            loadData();
        } catch (error) {
            toast.error("Failed to save mapping");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this mapping?")) return;
        try {
            await apiClient.deleteAccountMapping(id);
            toast.success("Mapping deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete mapping");
        }
    };

    const moduleColors: any = {
        revenue: 'text-emerald-500 bg-emerald-500/10',
        expense: 'text-rose-500 bg-rose-500/10',
        payroll: 'text-blue-500 bg-blue-500/10',
        inventory: 'text-amber-500 bg-amber-500/10',
        banking: 'text-purple-500 bg-purple-500/10'
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8 space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Dynamic COA Mappings
                    </h1>
                    <p className="text-gray-500">Bridge business operations to your Chart of Accounts dynamically.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                    <Plus size={20} /> New Mapping
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Table Section - Glass Layout */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search mappings..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-xl transition-all"
                        />
                    </div>

                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Source Module</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Category</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Mapped Account</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <Loader2 className="animate-spin inline mr-2 text-indigo-500" size={24} />
                                            <span className="text-gray-400">Syncing with ledger...</span>
                                        </td>
                                    </tr>
                                ) : mappings.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                                            No active mappings found. Use defaults or create mapping.
                                        </td>
                                    </tr>
                                ) : mappings.map((m) => (
                                    <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${moduleColors[m.module] || 'bg-gray-500/10 text-gray-400'}`}>
                                                {m.module}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-300">{m.category}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white">Account {m.account_id}</span>
                                                <span className="text-xs text-gray-500">GL Code Reference</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create/Edit Panel */}
                <div className="space-y-6">
                    <div className={`glass-panel p-8 space-y-6 transition-all transform ${isAdding ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-50 blur-sm pointer-events-none absolute'}`}>
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <Settings2 className="text-indigo-400" />
                            <h2 className="text-xl font-bold">Configure Mapping</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Module</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    value={formData.module}
                                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                                >
                                    <option value="revenue">Revenue Recognition</option>
                                    <option value="expense">Expense Categorization</option>
                                    <option value="payroll">Payroll Control</option>
                                    <option value="inventory">Inventory Asset/Shrinkage</option>
                                    <option value="banking">Banking & Reconcile</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category Key</label>
                                <input
                                    type="text"
                                    placeholder="e.g. software_subs, damage..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target GL Account</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 py-4 rounded-xl font-bold hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all"
                            >
                                <Save size={18} /> Commit Configuration
                            </button>
                        </form>
                    </div>

                    {!isAdding && (
                        <div className="glass-panel p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                <LinkIcon className="text-gray-500" />
                            </div>
                            <h3 className="font-bold text-lg">Smart Linking</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Link your operations to specific ledger accounts to automate the "Gluer" logic.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                }
            `}</style>
        </div>
    );
}
