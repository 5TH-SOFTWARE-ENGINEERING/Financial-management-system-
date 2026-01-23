"use client";

import { useState, useEffect } from "react";
import {
    Warehouse as WarehouseIcon,
    ArrowRightLeft,
    MapPin,
    Plus,
    Package,
    Search,
    ShieldCheck,
    Truck,
    Boxes,
    ChevronRight,
    Loader2
} from "lucide-react";
import { apiClient, Warehouse, StockTransfer, InventoryItem } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";


export default function WarehouseDashboard() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"warehouses" | "transfers">("warehouses");

    // Transfer form state
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [transferData, setTransferData] = useState({
        item_id: 0,
        from_warehouse_id: 0,
        to_warehouse_id: 0,
        quantity: 0
    });

    useEffect(() => {
        fetchData();
        fetchItems();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getWarehouses();
            if (res.data) setWarehouses(res.data);
        } catch (error) {
            console.error("Failed to fetch warehouses:", error);
            toast.error("Failed to load warehouses");
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        try {
            const res = await apiClient.getInventoryItems();
            if (res.data && Array.isArray(res.data)) {
                setItems(res.data);
            }
        } catch (error) { }
    };

    const handleCreateTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.initiateTransfer(transferData);
            toast.success("Stock transfer initiated");
            setShowTransferForm(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Transfer failed");
        }
    };

    return (
        <Layout>
        <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Multi-Warehouse</h1>
                        <p className="text-gray-500 text-lg mt-1 font-medium">Manage stock across multiple physical locations</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowTransferForm(true)}
                            className="flex items-center gap-2 bg-white dark:bg-gray-900 px-5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 font-bold shadow-sm hover:translate-y-[-2px] transition-all"
                        >
                            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                            Transfer Stock
                        </button>
                        <button className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl font-bold shadow-xl hover:translate-y-[-2px] transition-all">
                            <Plus className="w-4 h-4" />
                            New Warehouse
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                        <WarehouseIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-50 dark:text-blue-900/10 group-hover:scale-110 transition-transform duration-500" />
                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-4">Total Capacity</h3>
                        <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">{warehouses.length}</div>
                        <p className="text-gray-400 text-sm font-medium">Active Warehouses</p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                        <Boxes className="absolute -right-4 -bottom-4 w-32 h-32 text-orange-50 dark:text-orange-900/10 group-hover:scale-110 transition-transform duration-500" />
                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-4">Stock Value</h3>
                        <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">$450.2k</div>
                        <p className="text-gray-400 text-sm font-medium">Across all locations</p>
                    </div>

                    <div className="bg-gray-900 dark:bg-white p-8 rounded-3xl shadow-2xl shadow-blue-500/10 relative overflow-hidden group">
                        <Truck className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 dark:text-gray-900/5 group-hover:scale-110 transition-transform duration-500" />
                        <h3 className="text-white/50 dark:text-gray-900/50 font-bold uppercase tracking-widest text-[10px] mb-4">Live Transfers</h3>
                        <div className="text-4xl font-black text-white dark:text-gray-900 mb-1">12</div>
                        <p className="text-white/50 dark:text-gray-900/50 text-sm font-medium">In-transit movements</p>
                    </div>
                </div>

                {/* Warehouse List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        </div>
                    ) : warehouses.length === 0 ? (
                        <div className="col-span-full bg-white dark:bg-gray-900 rounded-3xl p-20 border border-gray-100 dark:border-gray-800 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <WarehouseIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Warehouses Configured</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">Create your first physical storage location to start tracking stock across multiple areas.</p>
                        </div>
                    ) : warehouses.map((warehouse) => (
                        <div key={warehouse.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 flex items-center gap-6 hover:shadow-lg transition-all group">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 font-bold relative">
                                <WarehouseIcon className="w-8 h-8" />
                                {warehouse.is_main && (
                                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg">
                                        <ShieldCheck className="w-3 h-3" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white">{warehouse.name}</h4>
                                    {warehouse.is_main && <span className="bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Main HQ</span>}
                                </div>
                                <div className="flex items-center gap-1 text-gray-400 text-sm font-medium mb-3">
                                    <MapPin className="w-3 h-3" />
                                    {warehouse.address || "No address set"}
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</div>
                                        <div className="font-bold">124</div>
                                    </div>
                                    <div className="border-l border-gray-100 dark:border-gray-800 pl-4">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Utilization</div>
                                        <div className="font-bold">68%</div>
                                    </div>
                                </div>
                            </div>

                            <button className="p-3 text-gray-300 hover:text-gray-900 dark:hover:text-white group-hover:translate-x-1 transition-all">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Transfer Modal */}
                {showTransferForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                            <div className="p-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight">Transfer Stock</h2>
                                        <p className="text-gray-500 font-medium mt-1">Move inventory between locations</p>
                                    </div>
                                    <button onClick={() => setShowTransferForm(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">✕</button>
                                </div>

                                <form onSubmit={handleCreateTransfer} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Source Warehouse</label>
                                            <select
                                                required
                                                onChange={(e) => setTransferData({ ...transferData, from_warehouse_id: parseInt(e.target.value) })}
                                                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none outline-none font-bold"
                                            >
                                                <option value="">Select Origin</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Destination</label>
                                            <select
                                                required
                                                onChange={(e) => setTransferData({ ...transferData, to_warehouse_id: parseInt(e.target.value) })}
                                                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none outline-none font-bold"
                                            >
                                                <option value="">Select Target</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inventory Item</label>
                                        <select
                                            required
                                            onChange={(e) => setTransferData({ ...transferData, item_id: parseInt(e.target.value) })}
                                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none outline-none font-bold"
                                        >
                                            <option value="">Select Product</option>
                                            {items.map(i => <option key={i.id} value={i.id}>{i.item_name} (Current Total: {i.quantity})</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transfer Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="0"
                                            onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })}
                                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none outline-none font-bold text-xl"
                                        />
                                    </div>

                                    <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                                        <ArrowRightLeft className="w-5 h-5" />
                                        Initiate Transfer
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </Layout>
    );
}
