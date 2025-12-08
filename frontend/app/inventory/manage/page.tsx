'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Package, Plus, Edit, Trash2, Search, Filter,
  DollarSign, TrendingUp, AlertCircle, CheckCircle,
  Loader2, Eye, EyeOff, Save, X, Power, PowerOff
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Icon color mapping for different icon types
const getIconColor = (iconType: string, active: boolean = false): string => {
    if (active) {
        // Active state colors (brighter)
        const activeColors: Record<string, string> = {
            'package': '#3b82f6',           // Blue
            'plus': '#22c55e',              // Green
            'edit': '#3b82f6',              // Blue
            'trash2': '#ef4444',            // Red
            'search': '#6366f1',            // Indigo
            'filter': '#8b5cf6',            // Purple
            'dollar-sign': '#16a34a',        // Green
            'trending-up': '#22c55e',       // Green
            'alert-circle': '#f59e0b',       // Amber
            'check-circle': '#22c55e',      // Green
            'loader2': '#3b82f6',           // Blue
            'eye': '#6366f1',               // Indigo
            'eye-off': '#6b7280',           // Gray
            'save': '#22c55e',              // Green
            'x': '#6b7280',                 // Gray
            'power': '#22c55e',             // Green
            'power-off': '#f59e0b',         // Amber
        };
        return activeColors[iconType] || '#6b7280';
    } else {
        // Inactive state colors (muted but colorful)
        const inactiveColors: Record<string, string> = {
            'package': '#60a5fa',           // Light Blue
            'plus': '#4ade80',              // Light Green
            'edit': '#60a5fa',              // Light Blue
            'trash2': '#f87171',            // Light Red
            'search': '#818cf8',            // Light Indigo
            'filter': '#a78bfa',            // Light Purple
            'dollar-sign': '#4ade80',        // Light Green
            'trending-up': '#4ade80',       // Light Green
            'alert-circle': '#fbbf24',       // Light Amber
            'check-circle': '#4ade80',      // Light Green
            'loader2': '#60a5fa',           // Light Blue
            'eye': '#818cf8',               // Light Indigo
            'eye-off': '#9ca3af',           // Light Gray
            'save': '#4ade80',              // Light Green
            'x': '#9ca3af',                 // Light Gray
            'power': '#4ade80',             // Light Green
            'power-off': '#fbbf24',         // Light Amber
        };
        return inactiveColors[iconType] || '#9ca3af';
    }
};

// Icon styled components
const IconWrapper = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false) : '#6b7280'};
    opacity: ${props => props.$active ? 1 : 0.8};
    transition: all 0.2s ease;
    
    svg {
        width: ${props => props.$size ? `${props.$size}px` : '20px'};
        height: ${props => props.$size ? `${props.$size}px` : '20px'};
        transition: all 0.2s ease;
    }

    &:hover {
        opacity: 1;
        transform: scale(1.1);
    }
`;

const HeaderIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.md};
`;

const ButtonIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.sm};
`;

const StatIcon = styled(IconWrapper)`
    flex-shrink: 0;
`;

const ActionIcon = styled(IconWrapper)`
    cursor: pointer;
`;

const MessageIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.xs};
    vertical-align: middle;
`;

const ModalIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.sm};
`;

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${CardShadow};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const HeaderText = styled.div`
  h1 {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ParallelStatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.lg};
  grid-column: 1 / -1;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  box-shadow: ${CardShadow};
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  p:first-child {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${theme.spacing.xs};
  }
  p:last-child {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }

  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const SearchInput = styled(StyledInput)`
  flex: 1;
  min-width: 200px;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const ItemsTable = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 80px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  border-bottom: 1px solid ${theme.colors.border};
  font-weight: ${theme.typography.fontWeights.bold};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 80px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  align-items: center;
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.backgroundSecondary};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  padding: ${theme.spacing.xs};
  background: none;
  border: none;
  cursor: pointer;
  color: ${TEXT_COLOR_MUTED};
  transition: color ${theme.transitions.default};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }

  &[data-destructive='true'] {
    color: #dc2626;
    &:hover {
      color: #b91c1c;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.xl};
`;

const Badge = styled.span<{ variant: 'success' | 'warning' | 'danger' | 'info' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;
  ${(p) => {
    switch (p.variant) {
      case 'success':
        return 'background-color: #dcfce7; color: #166534;';
      case 'warning':
        return 'background-color: #fef3c7; color: #92400e;';
      case 'danger':
        return 'background-color: #fee2e2; color: #991b1b;';
      default:
        return 'background-color: #dbeafe; color: #1e40af;';
    }
  }}
`;

interface InventoryItem {
  id: number;
  item_name: string;
  buying_price?: number;
  expense_amount?: number;
  total_cost?: number;
  selling_price: number;
  quantity: number;
  description?: string;
  category?: string;
  sku?: string;
  is_active: boolean;
  profit_per_unit?: number;
  profit_margin?: number;
  created_at: string;
  updated_at?: string;
  created_by_id?: number;
}

export default function InventoryManagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showActivateDeactivateModal, setShowActivateDeactivateModal] = useState(false);
  const [itemToActivateDeactivate, setItemToActivateDeactivate] = useState<InventoryItem | null>(null);
  const [activateDeactivatePassword, setActivateDeactivatePassword] = useState('');
  const [activateDeactivatePasswordError, setActivateDeactivatePasswordError] = useState<string | null>(null);
  const [activatingDeactivating, setActivatingDeactivating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [accessibleUserIds, setAccessibleUserIds] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    buying_price: '',
    expense_amount: '0',
    selling_price: '',
    quantity: '0',
    description: '',
    category: '',
    sku: '',
    is_active: true,
  });

  useEffect(() => {
    if (!user || (user.role !== 'finance_manager' && user.role !== 'admin' && user.role !== 'manager' && user.role !== 'finance_admin')) {
      router.push('/dashboard');
      return;
    }
    loadItems();
    loadSummary();
  }, [user, router]);

  const loadItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.getInventoryItems({ limit: 1000 });
      // Handle both direct array response and wrapped response
      let itemsData = Array.isArray(response?.data) 
        ? response.data 
        : (response?.data?.data || []);

      // Get accessible user IDs for finance admins (themselves + subordinates)
      // IMPORTANT: Subordinates (accountants/employees) should ONLY see their own items
      // They should NOT see items from other finance admins' subordinates
      const isFinanceAdminRole = user?.role?.toLowerCase() === 'finance_admin';
      const currentUserRole = user?.role?.toLowerCase();
      const isSubordinateRole = currentUserRole === 'accountant' || currentUserRole === 'employee';
      let currentAccessibleUserIds: number[] = [];

      if (isFinanceAdminRole && user?.id) {
        try {
          // Get subordinates - backend already filters to return only accountants and employees under this finance admin
          const financeAdminId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
          const subordinatesRes = await apiClient.getSubordinates(financeAdminId);
          const subordinates = subordinatesRes?.data || [];
          // Include the finance admin themselves
          currentAccessibleUserIds = [financeAdminId, ...subordinates.map((sub: any) => {
            const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
            return subId;
          })];

          // Store in state for use in action handlers
          setAccessibleUserIds(currentAccessibleUserIds);

          if (process.env.NODE_ENV === 'development') {
            console.log('Finance Admin - Accessible User IDs for Inventory:', {
              financeAdminId: financeAdminId,
              subordinatesCount: subordinates.length,
              accessibleUserIds: currentAccessibleUserIds
            });
          }
        } catch (err) {
          console.warn('Failed to fetch subordinates, using only finance admin ID:', err);
          const financeAdminId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
          currentAccessibleUserIds = [financeAdminId];
          setAccessibleUserIds(currentAccessibleUserIds);
        }
      } else if (user?.id) {
        // For subordinates (accountants/employees) and other non-finance-admin roles:
        // They can ONLY see their own items, NOT items from other finance admins' subordinates
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
        currentAccessibleUserIds = [userId];
        setAccessibleUserIds(currentAccessibleUserIds);

        if (process.env.NODE_ENV === 'development' && isSubordinateRole) {
          console.log('Subordinate User - Can only access own inventory items:', {
            userId: userId,
            role: currentUserRole,
            accessibleUserIds: currentAccessibleUserIds
          });
        }
      }

      // Filter items based on access control
      if (isFinanceAdminRole && currentAccessibleUserIds.length > 0) {
        // Finance admin: show items from themselves and their subordinates only
        itemsData = itemsData.filter((item: InventoryItem) => {
          const createdById = item.created_by_id;
          return createdById && currentAccessibleUserIds.includes(createdById);
        });
      } else if (user?.id) {
        // For subordinates and other roles: ONLY show their own items
        // This prevents subordinates from seeing other finance admins' subordinates' items
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
        itemsData = itemsData.filter((item: InventoryItem) => {
          return item.created_by_id === userId;
        });
      }

      setItems(itemsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load inventory items';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response: any = await apiClient.getInventorySummary();
      // Handle both direct object response and wrapped response
      const summaryData = response?.data || response;
      setSummary(summaryData);
    } catch (err: any) {
      // Silently fail - summary is optional
      console.warn('Failed to load inventory summary:', err);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      item_name: '',
      buying_price: '',
      expense_amount: '0',
      selling_price: '',
      quantity: '0',
      description: '',
      category: '',
      sku: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: InventoryItem) => {
    // Check access control for finance admins - can only edit items created by themselves or their subordinates
    const isFinanceAdminRole = user?.role?.toLowerCase() === 'finance_admin';
    if (isFinanceAdminRole && accessibleUserIds.length > 0) {
      const createdById = item.created_by_id;
      if (createdById && !accessibleUserIds.includes(createdById)) {
        toast.error('You can only edit items created by yourself or your subordinates');
        return;
      }
    } else if (user?.id && item.created_by_id) {
      // For subordinates and other roles: can only edit their own items
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      if (item.created_by_id !== userId) {
        toast.error('You can only edit your own items');
        return;
      }
    }

    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      buying_price: item.buying_price?.toString() || '',
      expense_amount: item.expense_amount?.toString() || '0',
      selling_price: item.selling_price.toString(),
      quantity: item.quantity.toString(),
      description: item.description || '',
      category: item.category || '',
      sku: item.sku || '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.item_name || !formData.buying_price || !formData.selling_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const itemPayload = {
        item_name: formData.item_name,
        buying_price: parseFloat(formData.buying_price),
        expense_amount: parseFloat(formData.expense_amount || '0'),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseInt(formData.quantity || '0'),
        description: formData.description || undefined,
        category: formData.category || undefined,
        sku: formData.sku || undefined,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await apiClient.updateInventoryItem(editingItem.id, itemPayload);
        toast.success('Item updated successfully');
      } else {
        await apiClient.createInventoryItem(itemPayload);
        toast.success('Item created successfully');
      }

      setShowModal(false);
      await loadItems();
      await loadSummary();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save item';
      toast.error(errorMessage);
      console.error('Error saving item:', err);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    // Check access control for finance admins - can only delete items created by themselves or their subordinates
    const isFinanceAdminRole = user?.role?.toLowerCase() === 'finance_admin';
    if (isFinanceAdminRole && accessibleUserIds.length > 0) {
      const createdById = itemToDelete.created_by_id;
      if (createdById && !accessibleUserIds.includes(createdById)) {
        setDeletePasswordError('You can only delete items created by yourself or your subordinates');
        toast.error('You can only delete items created by yourself or your subordinates');
        return;
      }
    } else if (user?.id && itemToDelete.created_by_id) {
      // For subordinates and other roles: can only delete their own items
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      if (itemToDelete.created_by_id !== userId) {
        setDeletePasswordError('You can only delete your own items');
        toast.error('You can only delete your own items');
        return;
      }
    }

    setDeleting(true);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteInventoryItem(itemToDelete.id, deletePassword.trim());
      toast.success('Item deleted successfully');
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeletePassword('');
      await loadItems();
      await loadSummary();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete item';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleActivateDeactivate = async () => {
    if (!itemToActivateDeactivate || !activateDeactivatePassword.trim()) {
      setActivateDeactivatePasswordError('Password is required');
      return;
    }

    // Check access control for finance admins - can only activate/deactivate items created by themselves or their subordinates
    const isFinanceAdminRole = user?.role?.toLowerCase() === 'finance_admin';
    if (isFinanceAdminRole && accessibleUserIds.length > 0) {
      const createdById = itemToActivateDeactivate.created_by_id;
      if (createdById && !accessibleUserIds.includes(createdById)) {
        setActivateDeactivatePasswordError('You can only activate/deactivate items created by yourself or your subordinates');
        toast.error('You can only activate/deactivate items created by yourself or your subordinates');
        return;
      }
    } else if (user?.id && itemToActivateDeactivate.created_by_id) {
      // For subordinates and other roles: can only activate/deactivate their own items
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      if (itemToActivateDeactivate.created_by_id !== userId) {
        setActivateDeactivatePasswordError('You can only activate/deactivate your own items');
        toast.error('You can only activate/deactivate your own items');
        return;
      }
    }

    setActivatingDeactivating(true);
    setActivateDeactivatePasswordError(null);

    try {
      if (isActivating) {
        await apiClient.activateInventoryItem(itemToActivateDeactivate.id, activateDeactivatePassword.trim());
        toast.success('Item activated successfully');
      } else {
        await apiClient.deactivateInventoryItem(itemToActivateDeactivate.id, activateDeactivatePassword.trim());
        toast.success('Item deactivated successfully');
      }
      setShowActivateDeactivateModal(false);
      setItemToActivateDeactivate(null);
      setActivateDeactivatePassword('');
      await loadItems();
      await loadSummary();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || `Failed to ${isActivating ? 'activate' : 'deactivate'} item`;
      setActivateDeactivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActivatingDeactivating(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  if (!user || (user.role !== 'finance_manager' && user.role !== 'admin' && user.role !== 'manager' && user.role !== 'finance_admin')) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <HeaderContent>
            <HeaderText>
              <h1>
                <HeaderIcon $iconType="package" $size={32} $active={true}>
                  <Package size={32} />
                </HeaderIcon>
                Inventory Management
              </h1>
              <p>Manage inventory items, costs, and pricing (Finance Admin Only)</p>
            </HeaderText>
            <Button onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <ButtonIcon $iconType="plus" $size={16} $active={true}>
                <Plus size={16} />
              </ButtonIcon>
              Add Item
            </Button>
          </HeaderContent>
        </HeaderContainer>

        {summary && (
          <StatsGrid>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Total Items</p>
                  <p>{summary.total_unique_items || summary.total_items || 0}</p>
                </StatInfo>
                <StatIcon $iconType="package" $size={24} $active={true}>
                  <Package size={24} />
                </StatIcon>
              </StatContent>
            </StatCard>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Total Stock</p>
                  <p>{summary.total_quantity_in_stock || 0}</p>
                </StatInfo>
                <StatIcon $iconType="package" $size={24} $active={true}>
                  <Package size={24} />
                </StatIcon>
              </StatContent>
            </StatCard>
            {summary.total_cost_value !== undefined && (
              <StatCard>
                <StatContent>
                  <StatInfo>
                    <p>Total Cost Value</p>
                    <p>${Number(summary.total_cost_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </StatInfo>
                  <StatIcon $iconType="dollar-sign" $size={24} $active={true}>
                    <DollarSign size={24} />
                  </StatIcon>
                </StatContent>
              </StatCard>
            )}
            {(summary.total_selling_value !== undefined || summary.potential_profit !== undefined) && (
              <ParallelStatsContainer>
                {summary.total_selling_value !== undefined && (
                  <StatCard>
                    <StatContent>
                      <StatInfo>
                        <p>Total Selling Value</p>
                        <p>${Number(summary.total_selling_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </StatInfo>
                      <StatIcon $iconType="trending-up" $size={24} $active={true}>
                        <TrendingUp size={24} />
                      </StatIcon>
                    </StatContent>
                  </StatCard>
                )}
                {summary.potential_profit !== undefined && (
                  <StatCard>
                    <StatContent>
                      <StatInfo>
                        <p>Potential Profit</p>
                        <p style={{ color: '#16a34a' }}>
                          ${Number(summary.potential_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </StatInfo>
                      <StatIcon $iconType="trending-up" $size={24} $active={true}>
                        <TrendingUp size={24} />
                      </StatIcon>
                    </StatContent>
                  </StatCard>
                )}
              </ParallelStatsContainer>
            )}
          </StatsGrid>
        )}

        <FiltersContainer>
          <SearchInput
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          <StyledSelect value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </StyledSelect>
        </FiltersContainer>

        {loading ? (
          <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
            <IconWrapper $iconType="loader2" $size={32} $active={true}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} />
            </IconWrapper>
            <p style={{ marginTop: theme.spacing.md, color: TEXT_COLOR_MUTED }}>Loading inventory...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
            <MessageIcon $iconType="alert-circle" $size={32} $active={true}>
              <AlertCircle size={32} style={{ margin: '0 auto' }} />
            </MessageIcon>
            <p style={{ marginTop: theme.spacing.md, color: '#dc2626' }}>{error}</p>
          </div>
        ) : (
          <ItemsTable>
            <TableHeader>
              <div>Item Name</div>
              <div>Buying Price</div>
              <div>Expense</div>
              <div>Total Cost</div>
              <div>Selling Price</div>
              <div>Stock</div>
              <div>Profit/Unit</div>
              <div>Margin %</div>
              <div>Status</div>
              <div>Actions</div>
            </TableHeader>
            {filteredItems.length === 0 ? (
              <div style={{ padding: theme.spacing.xxl, textAlign: 'center', color: TEXT_COLOR_MUTED }}>
                {items.length === 0 ? (
                  <>
                    <IconWrapper $iconType="package" $size={48} $active={false} style={{ margin: '0 auto', opacity: 0.5, marginBottom: theme.spacing.md }}>
                      <Package size={48} />
                    </IconWrapper>
                    <p style={{ margin: 0, marginBottom: theme.spacing.sm }}>No inventory items yet</p>
                    <p style={{ margin: 0, fontSize: theme.typography.fontSizes.sm }}>Click "Add Item" to create your first inventory item</p>
                  </>
                ) : (
                  <>
                    <IconWrapper $iconType="search" $size={48} $active={false} style={{ margin: '0 auto', opacity: 0.5, marginBottom: theme.spacing.md }}>
                      <Search size={48} />
                    </IconWrapper>
                    <p style={{ margin: 0 }}>No items match your search criteria</p>
                  </>
                )}
              </div>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.item_name}</div>
                      {item.sku && <div style={{ fontSize: '12px', color: TEXT_COLOR_MUTED }}>SKU: {item.sku}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.buying_price !== undefined && item.buying_price !== null 
                      ? `$${Number(item.buying_price).toFixed(2)}` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.expense_amount !== undefined && item.expense_amount !== null 
                      ? `$${Number(item.expense_amount).toFixed(2)}` 
                      : '$0.00'}
                  </TableCell>
                  <TableCell>
                    {item.total_cost !== undefined && item.total_cost !== null 
                      ? `$${Number(item.total_cost).toFixed(2)}` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>${Number(item.selling_price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={item.quantity < 10 ? 'danger' : item.quantity < 50 ? 'warning' : 'success'}>
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.profit_per_unit !== undefined && item.profit_per_unit !== null
                      ? `$${Number(item.profit_per_unit).toFixed(2)}` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.profit_margin !== undefined && item.profit_margin !== null
                      ? `${Number(item.profit_margin).toFixed(1)}%` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? 'success' : 'danger'}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                      <ActionButton onClick={() => handleEdit(item)} title="Edit">
                        <ActionIcon $iconType="edit" $size={16} $active={true}>
                          <Edit size={16} />
                        </ActionIcon>
                      </ActionButton>
                      <ActionButton 
                        onClick={() => {
                          setItemToDelete(item);
                          setShowDeleteModal(true);
                          setDeletePassword('');
                          setDeletePasswordError(null);
                        }}
                        title="Delete"
                        data-destructive="true"
                      >
                        <ActionIcon $iconType="trash2" $size={16} $active={true}>
                          <Trash2 size={16} />
                        </ActionIcon>
                      </ActionButton>
                      {item.is_active ? (
                        <ActionButton 
                          onClick={() => {
                            setItemToActivateDeactivate(item);
                            setIsActivating(false);
                            setShowActivateDeactivateModal(true);
                            setActivateDeactivatePassword('');
                            setActivateDeactivatePasswordError(null);
                          }}
                          title="Deactivate"
                        >
                          <ActionIcon $iconType="power-off" $size={16} $active={true}>
                            <PowerOff size={16} />
                          </ActionIcon>
                        </ActionButton>
                      ) : (
                        <ActionButton 
                          onClick={() => {
                            setItemToActivateDeactivate(item);
                            setIsActivating(true);
                            setShowActivateDeactivateModal(true);
                            setActivateDeactivatePassword('');
                            setActivateDeactivatePasswordError(null);
                          }}
                          title="Activate"
                        >
                          <ActionIcon $iconType="power" $size={16} $active={true}>
                            <Power size={16} />
                          </ActionIcon>
                        </ActionButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </ItemsTable>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <ModalOverlay onClick={() => setShowModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                <ActionButton onClick={() => setShowModal(false)}>
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </ActionButton>
              </ModalHeader>

              <FormGroup>
                <Label htmlFor="item_name">Item Name :</Label>
                <StyledInput
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="Enter item name"
                />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="buying_price">Buying Price: </Label>
                  <StyledInput
                    id="buying_price"
                    type="number"
                    step="0.01"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="expense_amount">Expense Amount: </Label>
                  <StyledInput
                    id="expense_amount"
                    type="number"
                    step="0.01"
                    value={formData.expense_amount}
                    onChange={(e) => setFormData({ ...formData, expense_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="selling_price">Selling Price: </Label>
                  <StyledInput
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="quantity">Initial Stock: </Label>
                  <StyledInput
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="category">Category: </Label>
                  <StyledInput
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Electronics, Clothing"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="sku">SKU: </Label>
                  <StyledInput
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Stock Keeping Unit"
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="description">Description: </Label>
                <StyledTextarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description"
                  rows={4}
                />
              </FormGroup>

              <ModalActions>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <ButtonIcon $iconType="save" $size={16} $active={true}>
                    <Save size={16} />
                  </ButtonIcon>
                  {editingItem ? 'Update' : 'Create'} Item
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && itemToDelete && (
          <ModalOverlay onClick={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
            setDeletePassword('');
            setDeletePasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>Delete Inventory Item</h2>
                <ActionButton onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                  setDeletePassword('');
                  setDeletePasswordError(null);
                }}>
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </ActionButton>
              </ModalHeader>

              <div style={{ 
                padding: theme.spacing.md, 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.lg
              }}>
                <p style={{ margin: 0, color: '#dc2626', fontSize: theme.typography.fontSizes.sm, display: 'flex', alignItems: 'center' }}>
                  <MessageIcon $iconType="alert-circle" $size={16} $active={true}>
                    <AlertCircle size={16} />
                  </MessageIcon>
                  You are about to permanently delete <strong>"{itemToDelete.item_name}"</strong>. This action cannot be undone.
                </p>
              </div>

              <FormGroup>
                <Label htmlFor="delete-password">
                  Enter your password to confirm deletion:
                </Label>
                <StyledInput
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deletePassword.trim() && !deleting) {
                      handleDelete();
                    }
                  }}
                />
                {deletePasswordError && (
                  <p style={{ color: '#dc2626', fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.xs, margin: 0 }}>
                    {deletePasswordError}
                  </p>
                )}
              </FormGroup>

              <ModalActions>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                    setDeletePassword('');
                    setDeletePasswordError(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!deletePassword.trim() || deleting}
                >
                  {deleting ? (
                    <>
                      <ButtonIcon $iconType="loader2" $size={16} $active={true}>
                        <Loader2 size={16} className="animate-spin" />
                      </ButtonIcon>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <ButtonIcon $iconType="trash2" $size={16} $active={true}>
                        <Trash2 size={16} />
                      </ButtonIcon>
                      Delete Item
                    </>
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Activate/Deactivate Confirmation Modal */}
        {showActivateDeactivateModal && itemToActivateDeactivate && (
          <ModalOverlay onClick={() => {
            setShowActivateDeactivateModal(false);
            setItemToActivateDeactivate(null);
            setActivateDeactivatePassword('');
            setActivateDeactivatePasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>{isActivating ? 'Activate Inventory Item' : 'Deactivate Inventory Item'}</h2>
                <ActionButton onClick={() => {
                  setShowActivateDeactivateModal(false);
                  setItemToActivateDeactivate(null);
                  setActivateDeactivatePassword('');
                  setActivateDeactivatePasswordError(null);
                }}>
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </ActionButton>
              </ModalHeader>

              <div style={{ 
                padding: theme.spacing.md, 
                background: isActivating ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)', 
                border: isActivating ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.lg
              }}>
                <p style={{ margin: 0, color: isActivating ? '#059669' : '#d97706', fontSize: theme.typography.fontSizes.sm, display: 'flex', alignItems: 'center' }}>
                  <MessageIcon $iconType="alert-circle" $size={16} $active={true}>
                    <AlertCircle size={16} />
                  </MessageIcon>
                  You are about to {isActivating ? 'activate' : 'deactivate'} <strong>"{itemToActivateDeactivate.item_name}"</strong>.
                  {!isActivating && ' Deactivated items will not be available for sale.'}
                </p>
              </div>

              <FormGroup>
                <Label htmlFor="activate-deactivate-password">
                  Enter your password to confirm:
                </Label>
                <StyledInput
                  id="activate-deactivate-password"
                  type="password"
                  value={activateDeactivatePassword}
                  onChange={(e) => {
                    setActivateDeactivatePassword(e.target.value);
                    setActivateDeactivatePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && activateDeactivatePassword.trim() && !activatingDeactivating) {
                      handleActivateDeactivate();
                    }
                  }}
                />
                {activateDeactivatePasswordError && (
                  <p style={{ color: '#dc2626', fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.xs, margin: 0 }}>
                    {activateDeactivatePasswordError}
                  </p>
                )}
              </FormGroup>

              <ModalActions>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowActivateDeactivateModal(false);
                    setItemToActivateDeactivate(null);
                    setActivateDeactivatePassword('');
                    setActivateDeactivatePasswordError(null);
                  }}
                  disabled={activatingDeactivating}
                >
                  Cancel
                </Button>
                <Button 
                  variant={isActivating ? 'default' : 'destructive'}
                  onClick={handleActivateDeactivate}
                  disabled={!activateDeactivatePassword.trim() || activatingDeactivating}
                >
                  {activatingDeactivating ? (
                    <>
                      <ButtonIcon $iconType="loader2" $size={16} $active={true}>
                        <Loader2 size={16} className="animate-spin" />
                      </ButtonIcon>
                      {isActivating ? 'Activating...' : 'Deactivating...'}
                    </>
                  ) : (
                    <>
                      {isActivating ? (
                        <ButtonIcon $iconType="power" $size={16} $active={true}>
                          <Power size={16} />
                        </ButtonIcon>
                      ) : (
                        <ButtonIcon $iconType="power-off" $size={16} $active={true}>
                          <PowerOff size={16} />
                        </ButtonIcon>
                      )}
                      {isActivating ? 'Activate' : 'Deactivate'} Item
                    </>
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </Layout>
  );
}

