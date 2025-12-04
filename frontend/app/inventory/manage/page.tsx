'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Package, Plus, Edit, Trash2, Search, Filter,
  DollarSign, TrendingUp, AlertCircle, CheckCircle,
  Loader2, Eye, EyeOff, Save, X
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
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
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const SearchInput = styled(Input)`
  flex: 1;
  min-width: 200px;
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
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
  gap: ${theme.spacing.md};
  justify-content: flex-end;
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
    if (!user || (user.role !== 'finance_manager' && user.role !== 'admin' && user.role !== 'manager')) {
      router.push('/dashboard');
      return;
    }
    loadItems();
    loadSummary();
  }, [user, router]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await apiClient.getInventoryItems({ limit: 1000 });
      // Handle both direct array response and wrapped response
      const itemsData = Array.isArray(response?.data) 
        ? response.data 
        : (response?.data?.data || []);
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

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  if (!user || (user.role !== 'finance_manager' && user.role !== 'admin' && user.role !== 'manager')) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <HeaderContent>
            <HeaderText>
              <h1>
                <Package size={32} style={{ marginRight: theme.spacing.md, display: 'inline' }} />
                Inventory Management
              </h1>
              <p>Manage inventory items, costs, and pricing (Finance Admin Only)</p>
            </HeaderText>
            <Button onClick={handleCreate}>
              <Plus size={16} style={{ marginRight: theme.spacing.sm }} />
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
                <Package size={24} color={PRIMARY_COLOR} />
              </StatContent>
            </StatCard>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Total Stock</p>
                  <p>{summary.total_quantity_in_stock || 0}</p>
                </StatInfo>
                <Package size={24} color={PRIMARY_COLOR} />
              </StatContent>
            </StatCard>
            {summary.total_cost_value !== undefined && (
              <StatCard>
                <StatContent>
                  <StatInfo>
                    <p>Total Cost Value</p>
                    <p>${Number(summary.total_cost_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </StatInfo>
                  <DollarSign size={24} color="#dc2626" />
                </StatContent>
              </StatCard>
            )}
            {summary.total_selling_value !== undefined && (
              <StatCard>
                <StatContent>
                  <StatInfo>
                    <p>Total Selling Value</p>
                    <p>${Number(summary.total_selling_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </StatInfo>
                  <TrendingUp size={24} color="#16a34a" />
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
                  <TrendingUp size={24} color="#16a34a" />
                </StatContent>
              </StatCard>
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
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </FiltersContainer>

        {loading ? (
          <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
            <Loader2 size={32} className="animate-spin" style={{ color: PRIMARY_COLOR, margin: '0 auto' }} />
            <p style={{ marginTop: theme.spacing.md, color: TEXT_COLOR_MUTED }}>Loading inventory...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
            <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto' }} />
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
                    <Package size={48} style={{ margin: '0 auto', opacity: 0.5, marginBottom: theme.spacing.md }} />
                    <p style={{ margin: 0, marginBottom: theme.spacing.sm }}>No inventory items yet</p>
                    <p style={{ margin: 0, fontSize: theme.typography.fontSizes.sm }}>Click "Add Item" to create your first inventory item</p>
                  </>
                ) : (
                  <>
                    <Search size={48} style={{ margin: '0 auto', opacity: 0.5, marginBottom: theme.spacing.md }} />
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
                        <Edit size={16} />
                      </ActionButton>
                      {item.is_active ? (
                        <ActionButton 
                          onClick={async () => {
                            if (confirm(`Are you sure you want to deactivate "${item.item_name}"?`)) {
                              try {
                                await apiClient.updateInventoryItem(item.id, { is_active: false });
                                toast.success('Item deactivated successfully');
                                await loadItems();
                                await loadSummary();
                              } catch (err: any) {
                                const errorMessage = err.response?.data?.detail || err.message || 'Failed to deactivate item';
                                toast.error(errorMessage);
                              }
                            }
                          }}
                          title="Deactivate"
                          data-destructive="true"
                        >
                          <Trash2 size={16} />
                        </ActionButton>
                      ) : (
                        <ActionButton 
                          onClick={async () => {
                            try {
                              await apiClient.updateInventoryItem(item.id, { is_active: true });
                              toast.success('Item reactivated successfully');
                              await loadItems();
                              await loadSummary();
                            } catch (err: any) {
                              const errorMessage = err.response?.data?.detail || err.message || 'Failed to reactivate item';
                              toast.error(errorMessage);
                            }
                          }}
                          title="Reactivate"
                        >
                          <CheckCircle size={16} />
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
                  <X size={20} />
                </ActionButton>
              </ModalHeader>

              <FormGroup>
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="Enter item name"
                />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="buying_price">Buying Price *</Label>
                  <Input
                    id="buying_price"
                    type="number"
                    step="0.01"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="expense_amount">Expense Amount</Label>
                  <Input
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
                  <Label htmlFor="selling_price">Selling Price *</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="quantity">Initial Stock</Label>
                  <Input
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
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Electronics, Clothing"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Stock Keeping Unit"
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description"
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    fontSize: theme.typography.fontSizes.sm,
                  }}
                />
              </FormGroup>

              <ModalActions>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save size={16} style={{ marginRight: theme.spacing.sm }} />
                  {editingItem ? 'Update' : 'Create'} Item
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </Layout>
  );
}

