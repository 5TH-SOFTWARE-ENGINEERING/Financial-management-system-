'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  ShoppingCart, Package, Plus, Receipt,
  Loader2,
  X, Printer
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import useUserStore from '@/store/userStore';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';

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

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  box-shadow: ${CardShadow};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const CardTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const ItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: ${theme.spacing.md};
`;

const ItemCard = styled.div<{ selected?: boolean }>`
  background: ${props => props.selected ? PRIMARY_COLOR + '15' : theme.colors.background};
  border: 2px solid ${props => props.selected ? PRIMARY_COLOR : theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  &:hover {
    border-color: ${PRIMARY_COLOR};
    box-shadow: ${CardShadow};
  }
`;

const ItemInfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ItemName = styled.div`
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  flex: 1;
  min-width: 0;
  font-size: ${theme.typography.fontSizes.sm};
`;

const ItemPrice = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${PRIMARY_COLOR};
  white-space: nowrap;
`;

const ItemStock = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const Badge = styled.span<{ $variant: 'success' | 'warning' | 'danger' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;
  ${(p) => {
    switch (p.$variant) {
      case 'success':
        return 'background-color: #dcfce7; color: #166534;';
      case 'warning':
        return 'background-color: #fef3c7; color: #92400e;';
      case 'danger':
        return 'background-color: #fee2e2; color: #991b1b;';
    }
  }}
`;

const SaleForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
  }
`;

const SummaryCard = styled.div`
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  margin-top: ${theme.spacing.md};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
    padding-top: ${theme.spacing.sm};
    border-top: 1px solid ${theme.colors.border};
    font-weight: ${theme.typography.fontWeights.bold};
    font-size: ${theme.typography.fontSizes.lg};
  }
`;

const ReceiptModal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ReceiptContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const CustomerInfoSection = styled.div`
  margin-top: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;


const StyledInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  transition: all ${theme.transitions.default};
  box-sizing: border-box;
  margin: 0;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR}80;
  }

  &:disabled {
    background: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  transition: all ${theme.transitions.default};
  box-sizing: border-box;
  margin: 0;
  min-height: 60px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR}80;
  }

  &:disabled {
    background: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const StyledLabel = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
`;

const FormGroup = styled.div`
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};

  label {
    margin-bottom: 0;
  }
`;

const HelpText = styled.p`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  margin: 0;
  margin-top: ${theme.spacing.xs};
`;

const CompleteSaleButton = styled(Button).withConfig({
  shouldForwardProp: (prop) => !['variant', 'size'].includes(prop),
})`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
`;

interface InventoryItem {
  id: number;
  item_name: string;
  selling_price: number;
  quantity: number;
  category?: string;
  sku?: string;
  created_by_id?: number;
  createdBy?: number;
  created_by?: number;
}

interface SaleItem {
  item_id: number;
  item_name: string;
  quantity: number;
  selling_price: number;
  total: number;
}

interface Subordinate {
  id: number | string;
}

interface ReceiptData {
  id?: number;
  receipt_number?: string;
  item_name?: string;
  quantity_sold?: number;
  selling_price?: number;
  total_sale?: number;
  customer_name?: string;
  customer_email?: string;
  created_at?: string;
}

export default function SalesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const storeUser = useUserStore((state) => state.user);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [accessibleUserIds, setAccessibleUserIds] = useState<number[] | null>(null);

  const loadItems = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.getInventoryItems({ limit: 1000, is_active: true });
      const rawData = response?.data as unknown;
      let itemsData: InventoryItem[] = [];

      if (Array.isArray(rawData)) {
        itemsData = rawData as InventoryItem[];
      } else if (rawData && typeof rawData === 'object' && Array.isArray((rawData as { data?: unknown }).data)) {
        itemsData = (rawData as { data: InventoryItem[] }).data;
      }
      
      // Apply role-based filtering
      const userRole = user?.role?.toLowerCase() || '';
      const isFinanceAdmin = userRole === 'finance_manager' || userRole === 'finance_admin';
      const isAccountant = userRole === 'accountant';
      const isEmployee = userRole === 'employee';
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';
      
      if (isAdmin) {
        // Admin sees all items - no filtering needed
      } else if (isFinanceAdmin && accessibleUserIds && accessibleUserIds.length > 0) {
        // Finance Admin: See items created by themselves and their subordinates
        itemsData = itemsData.filter((item: InventoryItem) => {
          const createdById = item.created_by_id || item.createdBy || item.created_by;
          if (!createdById) return false;
          const createdByIdNum = typeof createdById === 'string' ? parseInt(createdById, 10) : createdById;
          return accessibleUserIds.includes(createdByIdNum);
        });
      } else if ((isAccountant || isEmployee) && accessibleUserIds && accessibleUserIds.length > 0) {
        // Employee/Accountant: See items created by their Finance Admin's team (Finance Admin + all subordinates)
        itemsData = itemsData.filter((item: InventoryItem) => {
          const createdById = item.created_by_id || item.createdBy || item.created_by;
          if (!createdById) return false;
          const createdByIdNum = typeof createdById === 'string' ? parseInt(createdById, 10) : createdById;
          return accessibleUserIds.includes(createdByIdNum);
        });
      } else if (isAccountant || isEmployee) {
        // Employee/Accountant without manager or accessibleUserIds: See no items
        itemsData = [];
      }
      
      setItems(itemsData);
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.detail
          : undefined) || (err instanceof Error ? err.message : 'Failed to load items');
      toast.error(errorMessage);
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  }, [accessibleUserIds, user]);

  useEffect(() => {
    if (!user) {
      router.push('/dashboard');
      return;
    }
    
    // Allow Admin, Finance Admin, Accountant, and Employee to access sales page
    const userRole = user?.role?.toLowerCase() || '';
    const allowedRoles = ['admin', 'super_admin', 'finance_manager', 'finance_admin', 'accountant', 'employee'];
    
    if (!allowedRoles.includes(userRole)) {
      router.push('/dashboard');
      return;
    }
    
    // Initialize accessible user IDs based on role
    const initializeAccess = async () => {
      // Admin: See all items (no filtering needed)
      if (userRole === 'admin' || userRole === 'super_admin') {
        setAccessibleUserIds(null);
        loadItems();
        return;
      }
      
      // Finance Admin/Manager: Get their own subordinates
      if (userRole === 'finance_manager' || userRole === 'finance_admin') {
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        try {
          const subordinatesRes = await apiClient.getSubordinates(userId);
          const subordinates = Array.isArray(subordinatesRes?.data) ? (subordinatesRes.data as Subordinate[]) : [];
          const userIds = [userId, ...subordinates.map((sub) => {
            const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
            return subId;
          })];
          setAccessibleUserIds(userIds);
        } catch (err) {
          console.error('Failed to fetch subordinates for Finance Admin:', err);
          setAccessibleUserIds([userId]);
        }
        return;
      }
      
      // Employee/Accountant: Get their Finance Admin's (manager's) subordinates
      if (userRole === 'employee' || userRole === 'accountant') {
        const employeeId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
        let managerIdValue: number | null = null;
        
        // Try to get managerId from storeUser first
        const managerIdStr = storeUser?.managerId;
        if (managerIdStr) {
          managerIdValue = typeof managerIdStr === 'string' ? parseInt(managerIdStr, 10) : Number(managerIdStr);
        } else {
          // If not in storeUser, try to fetch current user profile from API
          try {
            const currentUserRes = await apiClient.getCurrentUser();
            const currentUserData = currentUserRes?.data;
            if (currentUserData?.manager_id !== undefined && currentUserData?.manager_id !== null) {
              managerIdValue = typeof currentUserData.manager_id === 'string' 
                ? parseInt(currentUserData.manager_id, 10) 
                : Number(currentUserData.manager_id);
            }
          } catch (err) {
            console.warn('Failed to fetch current user profile for manager_id:', err);
          }
        }
        
        if (managerIdValue) {
          try {
            const financeAdminId = managerIdValue;
            
            // Get all subordinates of the Finance Admin (including the Finance Admin themselves)
            const subordinatesRes = await apiClient.getSubordinates(financeAdminId);
            const subordinates = Array.isArray(subordinatesRes?.data) ? (subordinatesRes.data as Subordinate[]) : [];
            
            // Include the Finance Admin themselves and all their subordinates
            const userIds = [financeAdminId, ...subordinates.map((sub) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
              return subId;
            })];
            
            setAccessibleUserIds(userIds);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`${userRole === 'employee' ? 'Employee' : 'Accountant'} - Accessible User IDs (from Finance Admin):`, {
                userId: employeeId,
                financeAdminId: financeAdminId,
                subordinatesCount: subordinates.length,
                accessibleUserIds: userIds
              });
            }
          } catch (err) {
            console.error(`Failed to fetch Finance Admin subordinates for ${userRole}:`, err);
            // Fallback: if we can't get subordinates, at least try to show items from the Finance Admin
            const fallbackUserIds = [managerIdValue];
            setAccessibleUserIds(fallbackUserIds);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`${userRole === 'employee' ? 'Employee' : 'Accountant'} - Using fallback (Finance Admin only):`, {
                userId: employeeId,
                financeAdminId: managerIdValue,
                accessibleUserIds: fallbackUserIds
              });
            }
          }
        } else {
          // Employee/Accountant has no manager assigned - show no items
          console.warn(`${userRole === 'employee' ? 'Employee' : 'Accountant'} has no manager (Finance Admin) assigned`);
          setAccessibleUserIds([]);
        }
        return;
      }
    };
    
    initializeAccess();
  }, [user, storeUser, router, loadItems]);

  // Reload items when accessibleUserIds changes (for Finance Admin, Accountant, Employee)
  useEffect(() => {
    if (user && accessibleUserIds !== null) {
      loadItems();
    }
  }, [accessibleUserIds, loadItems, user]);
  

  const handleAddToSale = () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (qty > selectedItem.quantity) {
      toast.error(`Only ${selectedItem.quantity} units available`);
      return;
    }

    const existingIndex = saleItems.findIndex(item => item.item_id === selectedItem.id);
    const sellingPrice = Number(selectedItem.selling_price) || 0;
    const total = sellingPrice * qty;

    if (existingIndex >= 0) {
      const updated = [...saleItems];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].total = updated[existingIndex].quantity * sellingPrice;
      setSaleItems(updated);
    } else {
      setSaleItems([...saleItems, {
        item_id: selectedItem.id,
        item_name: selectedItem.item_name,
        quantity: qty,
        selling_price: sellingPrice,
        total,
      }]);
    }

    setQuantity('1');
    setSelectedItem(null);
    toast.success('Item added to sale');
  };

  const handleRemoveFromSale = (itemId: number) => {
    setSaleItems(saleItems.filter(item => item.item_id !== itemId));
    toast.success('Item removed from sale');
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    
    const item = items.find(i => i.id === itemId);
    if (item && newQuantity > item.quantity) {
      toast.error(`Only ${item.quantity} units available`);
      return;
    }

    setSaleItems(saleItems.map(item => 
      item.item_id === itemId 
        ? { ...item, quantity: newQuantity, total: Number(item.selling_price) * newQuantity }
        : item
    ));
  };

  const handleCompleteSale = async () => {
    if (saleItems.length === 0) {
      toast.error('Please add items to the sale');
      return;
    }

    setProcessing(true);
    try {
      // Process each sale item sequentially to avoid race conditions
      const sales: ReceiptData[] = [];
      for (const item of saleItems) {
        try {
          const saleResponse = await apiClient.createSale({
            item_id: item.item_id,
            quantity_sold: item.quantity,
            customer_name: customerName || undefined,
            customer_email: customerEmail || undefined,
            notes: notes || undefined,
          });
          const saleData = (saleResponse?.data as unknown) ?? (saleResponse as unknown);
          sales.push((saleData as ReceiptData) || {});
        } catch (err: unknown) {
          const errorMessage =
            (typeof err === 'object' && err !== null && 'response' in err
              ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
              : undefined) ||
            (err instanceof Error ? err.message : `Failed to create sale for ${item.item_name}`);
          toast.error(errorMessage);
          throw err; // Stop processing if one sale fails
        }
      }

      // Get receipt for the first sale
      if (sales.length > 0 && sales[0]?.id) {
        try {
          const receiptResponse = await apiClient.getReceipt(sales[0].id as number);
          const receipt = (receiptResponse?.data as unknown) ?? (receiptResponse as unknown);
          setReceiptData(receipt as ReceiptData);
          setShowReceipt(true);
        } catch (err: unknown) {
          console.warn('Failed to load receipt, but sale was successful:', err);
          // Sale was successful, just show success message
          toast.success('Sale completed successfully!');
        }
      }

      // Reset form
      setSaleItems([]);
      setCustomerName('');
      setCustomerEmail('');
      setNotes('');
      setQuantity('1');
      setSelectedItem(null);

      // Reload items to update stock
      await loadItems();

      if (!showReceipt) {
        toast.success('Sale completed successfully!');
      }
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (err instanceof Error ? err.message : 'Failed to complete sale');
      toast.error(errorMessage);
      console.error('Error completing sale:', err);
    } finally {
      setProcessing(false);
    }
  };

  const totalSale = saleItems.reduce((sum, item) => sum + item.total, 0);

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Allow Admin, Finance Admin, Accountant, and Employee to access sales page
  const userRole = user?.role?.toLowerCase() || '';
  const allowedRoles = ['admin', 'super_admin', 'finance_manager', 'finance_admin', 'accountant', 'employee'];
  
  if (!user || !userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <HeaderContent>
            <HeaderText>
              <h1>
                <ShoppingCart size={32} style={{ marginRight: theme.spacing.md, display: 'inline' }} />
                Sales
              </h1>
              <p>Sell items and generate receipts</p>
            </HeaderText>
          </HeaderContent>
        </HeaderContainer>

        <TwoColumnLayout>
          <Card>
            <CardTitle>Available Items</CardTitle>
            <StyledInput
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
                <Loader2 size={32} className="animate-spin" style={{ color: PRIMARY_COLOR, margin: '0 auto' }} />
              </div>
            ) : (
              <ItemsGrid>
                {filteredItems.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: theme.spacing.xxl, color: TEXT_COLOR_MUTED }}>
                    <Package size={48} style={{ margin: '0 auto', opacity: 0.5, marginBottom: theme.spacing.md }} />
                    <p>No items available</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      selected={selectedItem?.id === item.id}
                      onClick={() => {
                        if (item.quantity > 0) {
                          setSelectedItem(item);
                          setQuantity('1');
                        } else {
                          toast.error('This item is out of stock');
                        }
                      }}
                      style={{ 
                        opacity: item.quantity === 0 ? 0.6 : 1,
                        cursor: item.quantity === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                    <ItemInfoRow>
                      <ItemName>{item.item_name}</ItemName>
                      <ItemPrice>
                        <span style={{ color: '#dc2626' }}>selling price:</span> ${Number(item.selling_price).toFixed(2)}
                      </ItemPrice>
                      <ItemStock>
                        <span>Stock:</span>
                        <Badge $variant={item.quantity < 10 ? 'danger' : item.quantity < 50 ? 'warning' : 'success'}>
                          {item.quantity}
                        </Badge>
                      </ItemStock>
                    </ItemInfoRow>
                    {item.quantity === 0 && (
                      <div style={{ marginTop: theme.spacing.xs, fontSize: theme.typography.fontSizes.xs, color: '#dc2626' }}>
                        Out of Stock
                      </div>
                    )}
                  </ItemCard>
                  ))
                )}
              </ItemsGrid>
            )}
          </Card>

          <Card>
            <CardTitle>Current Sale</CardTitle>
            {selectedItem && (
              <SaleForm>
                <FormGroup>
                  <StyledLabel>Selected Item: {selectedItem.item_name}</StyledLabel>
                  <HelpText>
                    Price: ${Number(selectedItem.selling_price).toFixed(2)} | Available: {selectedItem.quantity}
                  </HelpText>
                </FormGroup>
                <FormRow>
                  <FormGroup>
                    <StyledLabel htmlFor="quantity">Quantity</StyledLabel>
                    <StyledInput
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </FormGroup>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button onClick={handleAddToSale} style={{ width: '100%' }}>
                      <Plus size={16} style={{ marginRight: theme.spacing.sm }} />
                      Add to Sale
                    </Button>
                  </div>
                </FormRow>
              </SaleForm>
            )}

            {saleItems.length > 0 && (
              <>
                <FormGroup>
                  <StyledLabel>Sale Items</StyledLabel>
                  <div style={{ marginTop: theme.spacing.sm }}>
                    {saleItems.map((item) => (
                      <div
                        key={item.item_id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: theme.spacing.sm,
                          background: theme.colors.backgroundSecondary,
                          borderRadius: theme.borderRadius.md,
                          marginBottom: theme.spacing.xs,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: theme.spacing.xs }}>{item.item_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <StyledInput
                              type="number"
                              min="1"
                              max={items.find(i => i.id === item.item_id)?.quantity || item.quantity}
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.item_id, parseInt(e.target.value) || 1)}
                              style={{ width: '80px', padding: theme.spacing.xs }}
                            />
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                              × ${Number(item.selling_price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <div style={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>
                            ${item.total.toFixed(2)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFromSale(item.item_id)}
                            title="Remove item"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </FormGroup>

                <SummaryCard>
                  <SummaryRow>
                    <span>Subtotal:</span>
                    <span>${totalSale.toFixed(2)}</span>
                  </SummaryRow>
                  <SummaryRow>
                    <span>Total:</span>
                    <span style={{ color: PRIMARY_COLOR }}>${totalSale.toFixed(2)}</span>
                  </SummaryRow>
                </SummaryCard>

                <CustomerInfoSection>
                  <FormGroup>
                    <StyledLabel htmlFor="customer_name">Customer Name (Optional)</StyledLabel>
                    <StyledInput
                      id="customer_name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </FormGroup>
                  <FormGroup>
                    <StyledLabel htmlFor="customer_email">Customer Email (Optional)</StyledLabel>
                    <StyledInput
                      id="customer_email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter customer email"
                    />
                  </FormGroup>
                  <FormGroup>
                    <StyledLabel htmlFor="notes">Notes (Optional)</StyledLabel>
                    <StyledTextarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes about this sale..."
                    />
                  </FormGroup>
                  <CompleteSaleButton
                    onClick={handleCompleteSale}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Receipt size={16} />
                        Complete Sale
                      </>
                    )}
                  </CompleteSaleButton>
                </CustomerInfoSection>
              </>
            )}
          </Card>
        </TwoColumnLayout>

        {/* Receipt Modal */}
        {showReceipt && receiptData && (
          <ReceiptModal onClick={() => setShowReceipt(false)}>
            <ReceiptContent onClick={(e) => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
                <h2 style={{ margin: 0, marginBottom: theme.spacing.sm }}>Receipt</h2>
                <p style={{ color: TEXT_COLOR_MUTED, margin: 0 }}>#{receiptData.receipt_number}</p>
              </div>
              <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
                <div style={{ marginBottom: theme.spacing.md }}>
                  <div style={{ fontWeight: 'bold', marginBottom: theme.spacing.xs }}>
                    {receiptData.item_name || 'Sale Items'}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                    Quantity: {receiptData.quantity_sold || 0} × ${Number(receiptData.selling_price || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: theme.typography.fontSizes.lg, paddingTop: theme.spacing.md, borderTop: `1px solid ${theme.colors.border}` }}>
                  <span>Total:</span>
                  <span style={{ color: PRIMARY_COLOR }}>${Number(receiptData.total_sale || 0).toFixed(2)}</span>
                </div>
                {receiptData.customer_name && (
                  <div style={{ marginTop: theme.spacing.md, fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                    Customer: {receiptData.customer_name}
                  </div>
                )}
                {receiptData.customer_email && (
                  <div style={{ marginTop: theme.spacing.xs, fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                    Email: {receiptData.customer_email}
                  </div>
                )}
                <div style={{ marginTop: theme.spacing.md, fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                  Date: {receiptData.created_at ? new Date(receiptData.created_at).toLocaleString() : new Date().toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg, justifyContent: 'space-between' }}>
                <Button variant="outline" onClick={() => setShowReceipt(false)} style={{ flex: 1 }}>
                  Close
                </Button>
                <Button onClick={() => window.print()} style={{ flex: 1 }}>
                  <Printer size={16} style={{ marginRight: theme.spacing.sm }} />
                  Print
                </Button>
              </div>
            </ReceiptContent>
          </ReceiptModal>
        )}
      </PageContainer>
    </Layout>
  );
}

