'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    is_read: boolean;
    is_email_sent?: boolean;
    action_url?: string | null;
    created_at: string;
    read_at?: string | null;
    expires_at?: string | null;
    display_type?: 'success' | 'error' | 'warning' | 'info';
    user_name?: string;
    user_email?: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    isInitialized: boolean;
    lastSynced: Date;
    error: string | null;
    accessibleUserIds: number[] | null;

    // Actions
    setAccessibleUserIds: (ids: number[] | null) => void;
    fetchNotifications: (showLoading?: boolean) => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: number) => Promise<void>;
    clearNotifications: () => void;
    setNotifications: (notifications: Notification[] | ((prev: Notification[]) => Notification[])) => void;
    fetchUnreadCount: () => Promise<void>;
}

const mapNotificationType = (type: string, title?: string, message?: string): 'success' | 'error' | 'warning' | 'info' => {
    const normalized = type?.toLowerCase() || 'system_alert';
    const titleLower = (title || '').toLowerCase();
    const messageLower = (message || '').toLowerCase();

    if (
        normalized === 'approval_decision' ||
        normalized === 'expense_approved' ||
        normalized === 'revenue_approved' ||
        normalized === 'sale_posted' ||
        normalized === 'forecast_created' ||
        normalized === 'ml_training_complete' ||
        normalized === 'inventory_created' ||
        normalized === 'inventory_updated' ||
        normalized === 'report_ready' ||
        normalized.includes('approved') ||
        normalized.includes('completed') ||
        normalized.includes('confirmed') ||
        normalized.includes('posted') ||
        normalized.includes('success') ||
        (normalized === 'system_alert' && (titleLower.includes('welcome') || titleLower.includes('user created') || messageLower.includes('welcome'))) ||
        (normalized === 'approval_decision' && (titleLower.includes('approved') || messageLower.includes('approved')))
    ) {
        return 'success';
    }

    if (
        normalized === 'budget_exceeded' ||
        normalized === 'expense_rejected' ||
        normalized === 'revenue_rejected' ||
        normalized.includes('rejected') ||
        normalized.includes('error') ||
        normalized.includes('failed') ||
        normalized.includes('cancelled') ||
        normalized.includes('denied') ||
        normalized.includes('alert') ||
        (normalized === 'approval_decision' && (titleLower.includes('rejected') || messageLower.includes('rejected')))
    ) {
        return 'error';
    }

    if (
        normalized === 'approval_request' ||
        normalized === 'deadline_reminder' ||
        normalized === 'inventory_low' ||
        normalized === 'expense_created' ||
        normalized === 'revenue_created' ||
        normalized === 'sale_created' ||
        normalized.includes('pending') ||
        normalized.includes('reminder') ||
        normalized.includes('required') ||
        normalized.includes('warning') ||
        (normalized === 'system_alert' && (titleLower.includes('approval required') || messageLower.includes('approval required'))) ||
        (normalized === 'system_alert' && (titleLower.includes('pending approval') || messageLower.includes('pending approval')))
    ) {
        return 'warning';
    }

    return 'info';
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isInitialized: false,
    lastSynced: new Date(),
    error: null,
    accessibleUserIds: null,

    setAccessibleUserIds: (ids) => set({ accessibleUserIds: ids, isInitialized: true }),

    fetchNotifications: async (showLoading = false) => {
        if (showLoading) set({ isLoading: true });

        try {
            const response = await apiClient.getNotifications();
            const notificationsData = Array.isArray(response?.data)
                ? response.data
                : (response?.data && typeof response.data === 'object' && response.data !== null && 'data' in response.data
                    ? (response.data as { data: unknown[] }).data
                    : []);

            const { accessibleUserIds } = get();

            const mappedNotifications = (notificationsData || []).map((notif: any) => ({
                id: notif.id || 0,
                user_id: notif.user_id || 0,
                type: notif.type || 'system_alert',
                priority: notif.priority || 'medium',
                title: notif.title || 'Notification',
                message: notif.message || '',
                is_read: notif.is_read || false,
                is_email_sent: notif.is_email_sent || false,
                created_at: notif.created_at || new Date().toISOString(),
                read_at: notif.read_at || null,
                expires_at: notif.expires_at || null,
                action_url: notif.action_url || null,
                display_type: mapNotificationType(notif.type, notif.title, notif.message),
            })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Client-side filtering if IDs are provided
            const filteredNotifications = accessibleUserIds
                ? mappedNotifications.filter(n => accessibleUserIds.includes(n.user_id))
                : mappedNotifications;

            set({
                notifications: filteredNotifications,
                unreadCount: filteredNotifications.filter(n => !n.is_read).length,
                lastSynced: new Date(),
                error: null
            });
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch notifications' });
        } finally {
            if (showLoading) set({ isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await apiClient.getUnreadCount();
            const count = (response as any)?.unread_count ?? (response as any)?.data?.unread_count ?? 0;
            if (count !== get().unreadCount) {
                set({ unreadCount: count });
                // If count changed, it's worth fetching full notifications too
                get().fetchNotifications(false);
            }
        } catch (err) {
            console.warn('Failed to fetch unread count:', err);
        }
    },

    markAsRead: async (notificationId) => {
        try {
            await apiClient.markNotificationAsRead(notificationId);
            set((state) => {
                const updatedNotifications = state.notifications.map((n) =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                );
                return {
                    notifications: updatedNotifications,
                    unreadCount: updatedNotifications.filter((n) => !n.is_read).length,
                };
            });
        } catch (err: any) {
            console.error('Failed to mark notification as read:', err);
        }
    },

    markAllAsRead: async () => {
        try {
            await apiClient.markAllNotificationsAsRead();
            set((state) => {
                const updatedNotifications = state.notifications.map((n) => ({ ...n, is_read: true }));
                return {
                    notifications: updatedNotifications,
                    unreadCount: 0,
                };
            });
        } catch (err: any) {
            console.error('Failed to mark all notifications as read:', err);
        }
    },

    deleteNotification: async (notificationId) => {
        try {
            await apiClient.deleteNotification(notificationId);
            set((state) => {
                const updatedNotifications = state.notifications.filter((n) => n.id !== notificationId);
                return {
                    notifications: updatedNotifications,
                    unreadCount: updatedNotifications.filter((n) => !n.is_read).length,
                };
            });
        } catch (err: any) {
            console.error('Failed to delete notification:', err);
            throw err;
        }
    },

    clearNotifications: () => set({ notifications: [], unreadCount: 0, isInitialized: false }),

    setNotifications: (update) => set((state) => {
        const newNotifications = typeof update === 'function' ? update(state.notifications) : update;
        return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.is_read).length
        };
    }),
}));

export default useNotificationStore;
