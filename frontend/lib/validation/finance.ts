// lib/validation/finance.ts
import { z } from 'zod';

export const UserRole = z.enum(['ADMIN', 'FINANCE_ADMIN', 'ACCOUNTANT', 'EMPLOYEE']);
export type UserRole = z.infer<typeof UserRole>;

export const TransactionStatus = z.enum(['pending', 'approved', 'rejected']);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const NotificationType = z.enum(['info', 'success', 'warning', 'error']);
export type NotificationType = z.infer<typeof NotificationType>;

export const ReportFormat = z.enum(['pdf', 'csv', 'excel']);
export type ReportFormat = z.infer<typeof ReportFormat>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: UserRole,
  managerId: z.string().optional(),
});

export const RevenueSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

export const ExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string(),
  receipt: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  full_name: z.string(),
  phone: z.string().optional(),
  role: UserRole,
  managerId: z.string().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string().optional(),
  last_login: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RevenueInput = z.infer<typeof RevenueSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;

export const OTPSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export type OTPInput = z.infer<typeof OTPSchema>;

// Financial transaction schemas
export const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['revenue', 'expense']),
  amount: z.number(),
  description: z.string(),
  category: z.string(),
  date: z.string(),
  status: TransactionStatus,
  submittedBy: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  receipt: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  createdAt: z.string(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Notification schema
export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: NotificationType,
  isRead: z.boolean().default(false),
  userId: z.string(),
  createdAt: z.string(),
  actionUrl: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Report schema
export const ReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  format: ReportFormat,
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    department: z.string().optional(),
    category: z.string().optional(),
    userId: z.string().optional(),
  }),
  generatedBy: z.string(),
  generatedAt: z.string(),
  fileUrl: z.string().optional(),
});

export type Report = z.infer<typeof ReportSchema>;

// Dashboard data schema
export const DashboardDataSchema = z.object({
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  netProfit: z.number(),
  pendingApprovals: z.number(),
  recentTransactions: z.array(TransactionSchema),
  monthlyData: z.array(z.object({
    month: z.string(),
    revenue: z.number(),
    expenses: z.number(),
  })),
  categoryBreakdown: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    percentage: z.number(),
  })),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;

// Department schema
export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  managerId: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});

export type Department = z.infer<typeof DepartmentSchema>;

// Project schema
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  departmentId: z.string(),
  assignedUsers: z.array(z.string()),
  budget: z.number().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

// Create/update schemas
export const CreateUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: UserRole,
  managerId: z.string().optional(),
  departmentId: z.string().optional(),
});

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  managerId: z.string(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  departmentId: z.string(),
  assignedUsers: z.array(z.string()),
  budget: z.number().positive('Budget must be positive').optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const CreateReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string(),
  format: ReportFormat,
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    department: z.string().optional(),
    category: z.string().optional(),
    userId: z.string().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;