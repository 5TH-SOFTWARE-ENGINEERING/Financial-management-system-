"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building2, Calculator, Calendar, MapPin, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";

interface FixedAsset {
    id: number;
    name: string;
    asset_category: string;
    purchase_date: string;
    purchase_cost: number;
    salvage_value: number;
    useful_life_years: number;
    accumulated_depreciation: number;
    current_book_value: number;
    status: string;
    location?: string;
}

export default function FixedAssetsPage() {
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getFixedAssets();
            if (res.data) setAssets(res.data);
        } catch (error) {
            console.error("Failed to fetch fixed assets:", error);
            toast.error("Failed to load fixed assets");
        } finally {
            setLoading(false);
        }
    };

    const handleDepreciate = async (id: number) => {
        try {
            await apiClient.depreciateFixedAsset(id);
            toast.success("Depreciation processed successfully");
            fetchAssets(); // Refresh data
        } catch (error) {
            console.error("Failed to depreciate asset:", error);
            toast.error("Failed to process depreciation");
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Fixed Assets
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage and depreciate long-term assets
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                        <Plus className="w-5 h-5" />
                        Register Asset
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search assets by name or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                </div>

                {/* Asset Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssets.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No assets found</p>
                            </div>
                        ) : (
                            filteredAssets.map((asset) => (
                                <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 group hover:shadow-xl transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${asset.status === 'active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {asset.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{asset.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{asset.asset_category}</p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Purchased: {new Date(asset.purchase_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {asset.location || 'Unknown Location'}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-gray-500">Book Value</span>
                                            <span className="font-bold text-gray-900 dark:text-white">${asset.current_book_value.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${(asset.current_book_value / asset.purchase_cost) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] text-gray-400 uppercase tracking-wider">
                                            <span>Depreciated: {((asset.accumulated_depreciation / asset.purchase_cost) * 100).toFixed(1)}%</span>
                                            <span>Cost: ${asset.purchase_cost.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDepreciate(asset.id)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                                        >
                                            <Calculator className="w-4 h-4" />
                                            Depreciate
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
        </Layout>
    );
}
