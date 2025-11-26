// lib/validation.ts
import { z } from 'zod';

// ==============================
export const UserRole = z.enum(['ADMIN', 'FINANCE_ADMIN', 'ACCOUNTANT', 'EMPLOYEE']);
export type UserRole = z.infer<typeof UserRole>;

export const TransactionStatus = z.enum(['pending', 'approved', 'rejected']);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const NotificationType = z.enum(['info', 'success', 'warning', 'error']);
export type NotificationType = z.infer<typeof NotificationType>;

export const ReportFormat = z.enum(['pdf', 'csv', 'excel']);
export type ReportFormat = z.infer<typeof ReportFormat>;

export const LoginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Username or email is required")
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

        // If it's a valid email → allow
        if (isEmail) return true;

        // Otherwise treat as username → allow ANY characters
        return val.length >= 3;
      },
      { message: "Enter a valid username or email" }
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// REGISTER
export const RegisterSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: UserRole.default('EMPLOYEE'),
  phone: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;


// REVENUE & EXPENSE
export const RevenueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(['sales', 'services', 'investment', 'rental', 'other']),
  source: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  isRecurring: z.boolean(),
  recurringFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  attachmentUrl: z.string().url('Invalid attachment URL').optional().or(z.literal('')),
});

export type RevenueInput = z.infer<typeof RevenueSchema>;

export const ExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  vendor: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  attachmentUrl: z.string().url('Invalid attachment URL').optional().or(z.literal('')),
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordOTPSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const ResetPasswordNewSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordOTPInput = z.infer<typeof ResetPasswordOTPSchema>;
export type ResetPasswordNewInput = z.infer<typeof ResetPasswordNewSchema>;

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  full_name: z.string(),
  phone: z.string().nullable().optional(),
  role: UserRole,
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  last_login: z.string().datetime().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['revenue', 'expense']),
  amount: z.number(),
  description: z.string(),
  category: z.string(),
  date: z.string().pipe(z.coerce.date()),
  status: TransactionStatus,
  submittedBy: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  receipt: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  createdAt: z.string().pipe(z.coerce.date()),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: NotificationType,
  isRead: z.boolean().default(false),
  userId: z.string(),
  createdAt: z.string().pipe(z.coerce.date()),
  actionUrl: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

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
  generatedAt: z.string().pipe(z.coerce.date()),
  fileUrl: z.string().url().optional(),
});

export type Report = z.infer<typeof ReportSchema>;

export const DashboardDataSchema = z.object({
  totalRevenue: z.number().nonnegative(),
  totalExpenses: z.number().nonnegative(),
  netProfit: z.number(),
  pendingApprovals: z.number().nonnegative(),
  recentTransactions: z.array(TransactionSchema),
  monthlyData: z.array(
    z.object({
      month: z.string(),
      revenue: z.number().nonnegative(),
      expenses: z.number().nonnegative(),
    })
  ),
  categoryBreakdown: z.array(
    z.object({
      category: z.string(),
      amount: z.number().nonnegative(),
      percentage: z.number().min(0).max(100),
    })
  ),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  managerId: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.string().pipe(z.coerce.date()),
});

export type Department = z.infer<typeof DepartmentSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  departmentId: z.string(),
  assignedUsers: z.array(z.string()),
  budget: z.number().nonnegative().optional(),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().pipe(z.coerce.date()),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateUserSchema = RegisterSchema.extend({
  departmentId: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  managerId: z.string().optional(),
});
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  departmentId: z.string(),
  assignedUsers: z.array(z.string()),
  budget: z.number().positive('Budget must be positive').optional(),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const CreateReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string(),
  format: ReportFormat,
  filters: z.object({
    startDate: z.string().pipe(z.coerce.date()).optional(),
    endDate: z.string().pipe(z.coerce.date()).optional(),
    department: z.string().optional(),
    category: z.string().optional(),
    userId: z.string().optional(),
  }),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;