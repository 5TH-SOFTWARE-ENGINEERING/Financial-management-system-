'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  ShoppingCart, Package, Search, Plus, Receipt,
  Loader2, AlertCircle, CheckCircle, DollarSign,
  X, Printer
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
`;

const CardTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.lg};
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

  &:hover {
    border-color: ${PRIMARY_COLOR};
    box-shadow: ${CardShadow};
  }
`;

const ItemName = styled.div`
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.xs};
`;

const ItemPrice = styled.div`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${PRIMARY_COLOR};
  margin-bottom: ${theme.spacing.xs};
`;

const ItemStock = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
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
  gap: ${theme.spacing.md};
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
`;

const FormField = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const NotesTextarea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  min-height: 60px;
  font-family: inherit;
  font-size: ${theme.typography.fontSizes.sm};
  margin-bottom: ${theme.spacing.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  resize: vertical;
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const CompleteSaleButton = styled(Button)`
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
}

interface SaleItem {
  item_id: number;
  item_name: string;
  quantity: number;
  selling_price: number;
  total: number;
}

export default function SalesPage() {
  const router = useRouter();
  const { user } = useAuth();
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
  const [receiptData, setReceiptData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'employee') {
      router.push('/dashboard');
      return;
    }
    loadItems();
  }, [user, router]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.getInventoryItems({ limit: 1000, is_active: true });
      // Handle both direct array response and wrapped response
      const itemsData = Array.isArray(response?.data) 
        ? response.data 
        : (response?.data?.data || []);
      setItems(itemsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load items';
      toast.error(errorMessage);
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

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
      const sales: any[] = [];
      for (const item of saleItems) {
        try {
          const saleResponse: any = await apiClient.createSale({
            item_id: item.item_id,
            quantity_sold: item.quantity,
            customer_name: customerName || undefined,
            customer_email: customerEmail || undefined,
            notes: notes || undefined,
          });
          const saleData = saleResponse?.data || saleResponse;
          sales.push(saleData);
        } catch (err: any) {
          const errorMessage = err.response?.data?.detail || err.message || `Failed to create sale for ${item.item_name}`;
          toast.error(errorMessage);
          throw err; // Stop processing if one sale fails
        }
      }

      // Get receipt for the first sale
      if (sales.length > 0 && sales[0]?.id) {
        try {
          const receiptResponse: any = await apiClient.getReceipt(sales[0].id);
          const receiptData = receiptResponse?.data || receiptResponse;
          setReceiptData(receiptData);
          setShowReceipt(true);
        } catch (err: any) {
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to complete sale';
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

  if (!user || user.role !== 'employee') {
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
              <p>Sell items and generate receipts (Employee Access)</p>
            </HeaderText>
          </HeaderContent>
        </HeaderContainer>

        <TwoColumnLayout>
          <Card>
            <CardTitle>Available Items</CardTitle>
            <Input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: theme.spacing.md }}
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
                    <ItemName>{item.item_name}</ItemName>
                    <ItemPrice>${Number(item.selling_price).toFixed(2)}</ItemPrice>
                    <ItemStock>
                      Stock: <Badge $variant={item.quantity < 10 ? 'danger' : item.quantity < 50 ? 'warning' : 'success'}>
                        {item.quantity}
                      </Badge>
                    </ItemStock>
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
                <div>
                  <Label>Selected Item: {selectedItem.item_name}</Label>
                  <p style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED, margin: `${theme.spacing.xs} 0` }}>
                    Price: ${Number(selectedItem.selling_price).toFixed(2)} | Available: {selectedItem.quantity}
                  </p>
                </div>
                <FormRow>
                  <div style={{ marginBottom: theme.spacing.md }}>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: theme.spacing.md }}>
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
                <div style={{ marginTop: theme.spacing.lg }}>
                  <Label>Sale Items</Label>
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
                            <Input
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
                </div>

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
                  <FormField>
                    <Label htmlFor="customer_name">Customer Name (Optional)</Label>
                    <Input
                      id="customer_name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </FormField>
                  <FormField>
                    <Label htmlFor="customer_email">Customer Email (Optional)</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </FormField>
                  <FormField>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <NotesTextarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes about this sale..."
                    />
                  </FormField>
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
              <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
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


