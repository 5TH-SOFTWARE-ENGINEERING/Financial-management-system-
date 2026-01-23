"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Calendar,
    DollarSign,
    FileText,
    Plus,
    Search,
    ChevronRight,
    CheckCircle2,
    Clock,
    UserPlus,
    Calculator,
    ArrowUpRight
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface Employee {
    id: number;
    employee_id: string;
    job_title: string;
    base_salary: number;
    status: string;
}

interface PayrollPeriod {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    total_net: number;
}

export default function PayrollDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "employees" | "periods">("overview");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, periodRes] = await Promise.all([
                apiClient.getEmployees(),
                apiClient.getPayrollPeriods()
            ]);
            if (empRes.data) setEmployees(empRes.data);
            if (periodRes.data) setPeriods(periodRes.data);
        } catch (error) {
            console.error("Failed to fetch payroll data:", error);
            toast.error("Failed to load payroll information");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePeriod = async () => {
        try {
            const name = `Payroll - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
            const today = new Date().toISOString().split('T')[0];
            await apiClient.createPayrollPeriod({
                name,
                start_date: today,
                end_date: today, // Simplification for demo
            });
            toast.success("Payroll period created");
            fetchData();
        } catch (error) {
            toast.error("Failed to create payroll period");
        }
    };

    const handleGeneratePayslips = async (id: number) => {
        try {
            await apiClient.generatePayslips(id);
            toast.success("Payslips generated successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to generate payslips");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Payroll Management</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage employees and process monthly payroll</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-5 py-2.5 rounded-xl font-bold border border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 transition-all">
                            <UserPlus className="w-4 h-4" />
                            Add Employee
                        </button>
                        <button
                            onClick={handleCreatePeriod}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            New Period
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 dark:border-gray-800 mb-8">
                    {["overview", "employees", "periods"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Total Employees</h3>
                                <div className="text-4xl font-black text-gray-900 dark:text-white">{employees.length}</div>
                                <div className="flex items-center gap-1 text-green-600 text-sm font-bold mt-2">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span>+2 this month</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Total Payroll (MTD)</h3>
                                <div className="text-4xl font-black text-gray-900 dark:text-white">
                                    ${periods.reduce((acc, p) => acc + p.total_net, 0).toLocaleString()}
                                </div>
                                <p className="text-gray-400 text-sm font-medium mt-2">Across {periods.length} periods</p>
                            </div>
                        </div>

                        {/* Recent Periods */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                    <h2 className="text-xl font-black">Recent Payroll Periods</h2>
                                    <button className="text-blue-600 font-bold text-sm hover:underline">View All</button>
                                </div>
                                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {periods.length === 0 ? (
                                        <div className="p-20 text-center text-gray-400">No payroll periods found</div>
                                    ) : (
                                        periods.map((period) => (
                                            <div key={period.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{period.name}</h4>
                                                        <p className="text-sm text-gray-400">{period.start_date} - {period.end_date}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="font-black text-gray-900 dark:text-white">${period.total_net.toLocaleString()}</div>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${period.status === "paid" ? "text-green-600" : "text-yellow-600"
                                                            }`}>
                                                            {period.status}
                                                        </div>
                                                    </div>
                                                    {period.status === "draft" ? (
                                                        <button
                                                            onClick={() => handleGeneratePayslips(period.id)}
                                                            className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Calculator className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <div className="p-3 text-green-600">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "employees" && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                            <div className="relative w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                />
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase tracking-widest font-black text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Job Title</th>
                                    <th className="px-6 py-4">Base Salary</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                            {emp.employee_id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium text-sm">
                                            {emp.job_title}
                                        </td>
                                        <td className="px-6 py-4 font-black">
                                            ${emp.base_salary.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
