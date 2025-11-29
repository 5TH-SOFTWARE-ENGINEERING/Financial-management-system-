'use client';
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calculator, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { Loader2, Save } from 'lucide-react';

// ──────────────────────────────────────────
// Styled Components
// ──────────────────────────────────────────
const LayoutWrapper = styled.div`
  display: flex;
  background: #f5f6fa;
  min-height: 100vh;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background: var(--card);
  border-right: 1px solid var(--border);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: auto;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding-left: 250px;
  display: flex;
  flex-direction: column;
`;

const InnerContent = styled.div`
  padding: 32px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted-foreground);
  font-size: 14px;
  margin-bottom: 16px;
  transition: 0.2s;

  &:hover {
    color: var(--foreground);
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: var(--muted-foreground);
  margin-bottom: 24px;
`;

const FormCard = styled.div`
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 24px;
`;

const ItemCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ItemTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
`;

const DeleteButton = styled.button`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #fecaca;
    border-color: #f87171;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldError = styled.p`
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
`;

const HelperText = styled.div`
  color: var(--muted-foreground);
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.5;
  
  strong {
    color: var(--foreground);
    font-weight: 600;
  }
  
  ul {
    margin: 8px 0 0 20px;
    padding: 0;
    list-style-type: disc;
  }
  
  li {
    margin: 4px 0;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #e5e7eb;
`;

const ResultItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ResultLabel = styled.span`
  font-size: 12px;
  color: var(--muted-foreground);
  font-weight: 500;
`;

interface ResultValueProps {
  $positive?: boolean;
  $negative?: boolean;
  $na?: boolean;
}

const ResultValue = styled.span<ResultValueProps>`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => {
    if (props.$na) return `var(--muted-foreground)`;
    if (props.$positive) return `#059669`;
    if (props.$negative) return `#dc2626`;
    return `var(--foreground)`;
  }};
`;

const SummaryCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-top: 24px;
`;

const SummaryTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SummaryLabel = styled.span`
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
`;

const SummaryValue = styled.span`
  font-size: 24px;
  font-weight: 700;
`;

const AddButton = styled(Button)`
  width: 100%;
  margin-bottom: 24px;
`;

const ResultsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const TableHeader = styled.thead`
  background: #f3f4f6;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f9fafb;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: var(--foreground);
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: var(--foreground);
`;

const TableBody = styled.tbody``;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  background: ${(p) => (p.type === 'error' ? '#fee2e2' : '#d1fae5')};
  border: 1px solid ${(p) => (p.type === 'error' ? '#fecaca' : '#a7f3d0')};
  color: ${(p) => (p.type === 'error' ? '#991b1b' : '#065f46')};
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: var(--foreground);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GlobalSettingsCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const GlobalSettingsTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--foreground);
`;

const SaveButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
`;

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
interface ExpenseItem {
  id: string;
  itemName: string;
  expenseAmount: number | '';
  buyAtPrice: number | '';
  soldAtPrice: number | '';
}

interface CalculatedItem extends ExpenseItem {
  revenue: number | null;
  profit: number | null;
  profitMargin: number | null;
  returnOnCost: number | null;
  errors: {
    expenseAmount?: string;
    buyAtPrice?: string;
    soldAtPrice?: string;
  };
}

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function ExpenseItemsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const idCounterRef = useRef(0);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Global settings for all items
  const [globalDate, setGlobalDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [globalCategory, setGlobalCategory] = useState<string>('other');
  const [globalVendor, setGlobalVendor] = useState<string>('');
  
  // Initialize with one item only on client side
  useEffect(() => {
    if (items.length === 0) {
      idCounterRef.current += 1;
      setItems([
        {
          id: `item-${idCounterRef.current}`,
          itemName: '',
          expenseAmount: '',
          buyAtPrice: '',
          soldAtPrice: '',
        },
      ]);
    }
  }, [items.length]);

  // Auto-calculate when items change
  useEffect(() => {
    const calculated = items.map((item) => calculateItem(item));
    setCalculatedItems(calculated);
  }, [items]);

  const calculateItem = (item: ExpenseItem): CalculatedItem => {
    const errors: { expenseAmount?: string; buyAtPrice?: string; soldAtPrice?: string } = {};
    
    // Validate inputs
    const expenseAmount = typeof item.expenseAmount === 'number' ? item.expenseAmount : null;
    const buyAtPrice = typeof item.buyAtPrice === 'number' ? item.buyAtPrice : null;
    const soldAtPrice = typeof item.soldAtPrice === 'number' ? item.soldAtPrice : null;

    if (expenseAmount !== null && (isNaN(expenseAmount) || expenseAmount < 0)) {
      errors.expenseAmount = 'Expense Amount must be a valid positive number';
    }
    if (buyAtPrice !== null && (isNaN(buyAtPrice) || buyAtPrice < 0)) {
      errors.buyAtPrice = 'Buy-at Price must be a valid positive number';
    }
    if (soldAtPrice !== null && (isNaN(soldAtPrice) || soldAtPrice < 0)) {
      errors.soldAtPrice = 'Sold-at Price must be a valid positive number';
    }

    // Calculate Revenue = Sold-at Price - Buy-at Price
    let revenue: number | null = null;
    if (buyAtPrice !== null && soldAtPrice !== null && !isNaN(buyAtPrice) && !isNaN(soldAtPrice)) {
      revenue = soldAtPrice - buyAtPrice;
    }

    // Calculate Profit = Revenue - Expense Amount
    let profit: number | null = null;
    if (revenue !== null && expenseAmount !== null && !isNaN(expenseAmount)) {
      profit = revenue - expenseAmount;
    }

    // Calculate Profit Margin (%) = (Profit / Sold-at Price) × 100
    let profitMargin: number | null = null;
    if (profit !== null && soldAtPrice !== null && soldAtPrice !== 0 && !isNaN(soldAtPrice)) {
      profitMargin = (profit / soldAtPrice) * 100;
    }

    // Calculate Return on Cost (%) = (Profit / Buy-at Price) × 100
    let returnOnCost: number | null = null;
    if (profit !== null && buyAtPrice !== null && buyAtPrice !== 0 && !isNaN(buyAtPrice)) {
      returnOnCost = (profit / buyAtPrice) * 100;
    }

    return {
      ...item,
      revenue,
      profit,
      profitMargin: profitMargin !== null ? Number(profitMargin.toFixed(2)) : null,
      returnOnCost: returnOnCost !== null ? Number(returnOnCost.toFixed(2)) : null,
      errors,
    };
  };

  const addItem = () => {
    idCounterRef.current += 1;
    setItems([
      ...items,
      {
        id: `item-${idCounterRef.current}`,
        itemName: '',
        expenseAmount: '',
        buyAtPrice: '',
        soldAtPrice: '',
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      toast.error('You must have at least one item');
    }
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          // Convert empty string to '' and numeric strings to numbers
          if (field === 'expenseAmount' || field === 'buyAtPrice' || field === 'soldAtPrice') {
            if (value === '' || value === null) {
              return { ...item, [field]: '' };
            }
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return { ...item, [field]: isNaN(numValue) ? '' : numValue };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Calculate totals
  const totals = calculatedItems.reduce(
    (acc, item) => {
      const expenseAmount = typeof item.expenseAmount === 'number' ? item.expenseAmount : 0;
      acc.totalExpense += expenseAmount;
      if (item.revenue !== null) acc.totalRevenue += item.revenue;
      if (item.profit !== null) acc.totalProfit += item.profit;
      if (item.profitMargin !== null) {
        acc.profitMargins.push(item.profitMargin);
      }
      return acc;
    },
    { totalExpense: 0, totalRevenue: 0, totalProfit: 0, profitMargins: [] as number[] }
  );

  const averageProfitMargin =
    totals.profitMargins.length > 0
      ? Number((totals.profitMargins.reduce((a, b) => a + b, 0) / totals.profitMargins.length).toFixed(2))
      : null;

  // Check for errors
  const hasErrors = calculatedItems.some((item) => Object.keys(item.errors).length > 0);
  const hasMissingRequiredFields = calculatedItems.some(
    (item) => !item.buyAtPrice || !item.soldAtPrice || !item.itemName
  );

  // Validate items before saving
  const validateItems = (): boolean => {
    if (calculatedItems.length === 0) {
      setError('Please add at least one item');
      return false;
    }

    if (hasErrors) {
      setError('Please fix validation errors before saving');
      return false;
    }

    if (hasMissingRequiredFields) {
      setError('Please fill in all required fields (Item Name, Buy-at Price, Sold-at Price)');
      return false;
    }

    if (!globalDate) {
      setError('Please select a date');
      return false;
    }

    return true;
  };

  // Save all items as expenses
  const handleSaveAll = async () => {
    setError(null);
    setSuccess(null);

    if (!validateItems()) {
      return;
    }

    setLoading(true);

    try {
      const savePromises: Promise<any>[] = [];
      let revenueCount = 0;

      for (const item of calculatedItems) {
        // Build description with all calculation details
        const expenseAmount = typeof item.expenseAmount === 'number' ? item.expenseAmount : 0;
        const buyAtPrice = typeof item.buyAtPrice === 'number' ? item.buyAtPrice : 0;
        const soldAtPrice = typeof item.soldAtPrice === 'number' ? item.soldAtPrice : 0;
        
        const description = [
          `Item: ${item.itemName}`,
          `Buy-at Price: $${buyAtPrice.toFixed(2)}`,
          `Sold-at Price: $${soldAtPrice.toFixed(2)}`,
          expenseAmount > 0 ? `Expense Amount: $${expenseAmount.toFixed(2)}` : '',
          item.revenue !== null ? `Revenue: $${item.revenue.toFixed(2)}` : '',
          item.profit !== null ? `Profit: $${item.profit.toFixed(2)}` : '',
          item.profitMargin !== null ? `Profit Margin: ${item.profitMargin}%` : '',
          item.returnOnCost !== null ? `Return on Cost: ${item.returnOnCost}%` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // Use expenseAmount if provided, otherwise use buyAtPrice as the expense
        const amount = expenseAmount > 0 ? expenseAmount : buyAtPrice;

        const expenseData = {
          title: item.itemName,
          description: description,
          amount: amount,
          category: globalCategory,
          vendor: globalVendor || null,
          date: new Date(globalDate).toISOString(),
          is_recurring: false,
          recurring_frequency: null,
          attachment_url: null,
        };

        // Save expense
        savePromises.push(apiClient.createExpense(expenseData));

        // If there's revenue, also create a revenue entry
        if (item.revenue !== null && item.revenue > 0) {
          revenueCount++;
          const revenueDescription = [
            `Item Type: ${item.itemName}`,
            `Buy-at Price: $${buyAtPrice.toFixed(2)}`,
            `Sold-at Price: $${soldAtPrice.toFixed(2)}`,
            expenseAmount > 0 ? `Expense Amount: $${expenseAmount.toFixed(2)}` : '',
            item.profit !== null ? `Profit: $${item.profit.toFixed(2)}` : '',
            item.profitMargin !== null ? `Profit Margin: ${item.profitMargin}%` : '',
            item.returnOnCost !== null ? `Return on Cost: ${item.returnOnCost}%` : '',
          ]
            .filter(Boolean)
            .join('\n');

          const revenueData = {
            title: item.itemName,
            description: revenueDescription,
            amount: item.revenue,
            category: 'sales',
            source: globalVendor || 'Sale',
            date: new Date(globalDate).toISOString(),
            is_recurring: false,
            recurring_frequency: null,
            attachment_url: null,
          };

          savePromises.push(apiClient.createRevenue(revenueData));
        }
      }

      await Promise.all(savePromises);
      
      const successMessages = [
        `Successfully saved ${calculatedItems.length} expense${calculatedItems.length > 1 ? 's' : ''}!`,
        revenueCount > 0 ? `${revenueCount} revenue${revenueCount > 1 ? 's' : ''} also created.` : '',
      ].filter(Boolean);
      
      setSuccess(successMessages.join(' '));
      toast.success(successMessages.join(' '));
      
      // Clear form after successful save
      setTimeout(() => {
        idCounterRef.current = 0;
        setItems([{
          id: `item-1`,
          itemName: '',
          expenseAmount: '',
          buyAtPrice: '',
          soldAtPrice: '',
        }]);
        setGlobalDate(new Date().toISOString().split('T')[0]);
        setGlobalCategory('other');
        setGlobalVendor('');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      let errorMessage = 'Failed to save expenses';
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => {
            if (typeof e === 'string') return e;
            if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
            return JSON.stringify(e);
          }).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <ContentArea>
        <Navbar />
        <InnerContent>
          <BackLink href="/expenses/list">
            <ArrowLeft size={16} />
            Back to Expenses
          </BackLink>

          <Title>
            <Calculator className="h-8 w-8 text-primary" />
            Expense Items Calculator
          </Title>
          <Subtitle>Enter multiple expense items with automatic revenue and profit calculations</Subtitle>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              {error}
            </MessageBox>
          )}

          {success && (
            <MessageBox type="success">
              <CheckCircle size={18} />
              {success}
            </MessageBox>
          )}

          {hasErrors && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              Please fix validation errors in the items below
            </MessageBox>
          )}

          {/* Global Settings */}
          <GlobalSettingsCard>
            <GlobalSettingsTitle>Global Settings (Applied to All Items)</GlobalSettingsTitle>
            <FormGrid>
              <FormGroup>
                <Label htmlFor="globalDate">Date *</Label>
                <Input
                  id="globalDate"
                  type="date"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="globalCategory">Category *</Label>
                <Select
                  id="globalCategory"
                  value={globalCategory}
                  onChange={(e) => setGlobalCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="salary">Salary</option>
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="marketing">Marketing</option>
                  <option value="equipment">Equipment</option>
                  <option value="travel">Travel</option>
                  <option value="supplies">Supplies</option>
                  <option value="insurance">Insurance</option>
                  <option value="taxes">Taxes</option>
                  <option value="other">Other</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="globalVendor">Vendor (Optional)</Label>
                <Input
                  id="globalVendor"
                  value={globalVendor}
                  onChange={(e) => setGlobalVendor(e.target.value)}
                  placeholder="Vendor name"
                  disabled={loading}
                />
              </FormGroup>
            </FormGrid>
          </GlobalSettingsCard>

          <FormCard>
            <AddButton type="button" onClick={addItem} variant="outline" disabled={loading}>
              <Plus size={16} className="mr-2" />
              Add New Item
            </AddButton>

            {items.map((item, index) => (
              <ItemCard key={item.id}>
                <ItemHeader>
                  <ItemTitle>Item #{index + 1}</ItemTitle>
                  <DeleteButton
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1 || loading}
                  >
                    <Trash2 size={14} />
                    Remove
                  </DeleteButton>
                </ItemHeader>

                <FormGrid>
                  <FormGroup>
                    <Label htmlFor={`itemName-${item.id}`}>Item Name / Type *</Label>
                    <Input
                      id={`itemName-${item.id}`}
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                      placeholder="e.g., Product A, Service B"
                      disabled={loading}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor={`expenseAmount-${item.id}`}>Expense Amount (Optional)</Label>
                    <Input
                      id={`expenseAmount-${item.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.expenseAmount}
                      onChange={(e) => updateItem(item.id, 'expenseAmount', e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                    />
                    <HelperText>
                      <strong>Purpose:</strong> To record how much it cost you to handle or process this specific item.
                      <br />
                      <br />
                      <strong>Examples of costs to include:</strong>
                      <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                        <li>Cost of shipping</li>
                        <li>Labor cost</li>
                        <li>Packaging cost</li>
                        <li>Operational cost</li>
                        <li>Additional purchase cost</li>
                        <li>Handling fees</li>
                        <li>Repair cost</li>
                        <li>Other related expenses</li>
                      </ul>
                    </HelperText>
                    {calculatedItems.find((ci) => ci.id === item.id)?.errors.expenseAmount && (
                      <FieldError>
                        {calculatedItems.find((ci) => ci.id === item.id)?.errors.expenseAmount}
                      </FieldError>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor={`buyAtPrice-${item.id}`}>Buy-at Price *</Label>
                    <Input
                      id={`buyAtPrice-${item.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.buyAtPrice}
                      onChange={(e) => updateItem(item.id, 'buyAtPrice', e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                    />
                    {calculatedItems.find((ci) => ci.id === item.id)?.errors.buyAtPrice && (
                      <FieldError>
                        {calculatedItems.find((ci) => ci.id === item.id)?.errors.buyAtPrice}
                      </FieldError>
                    )}
                    {!item.buyAtPrice && (
                      <FieldError>Buy-at Price is required</FieldError>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor={`soldAtPrice-${item.id}`}>Sold-at Price *</Label>
                    <Input
                      id={`soldAtPrice-${item.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.soldAtPrice}
                      onChange={(e) => updateItem(item.id, 'soldAtPrice', e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                    />
                    {calculatedItems.find((ci) => ci.id === item.id)?.errors.soldAtPrice && (
                      <FieldError>
                        {calculatedItems.find((ci) => ci.id === item.id)?.errors.soldAtPrice}
                      </FieldError>
                    )}
                    {!item.soldAtPrice && (
                      <FieldError>Sold-at Price is required</FieldError>
                    )}
                  </FormGroup>
                </FormGrid>

                {(() => {
                  const calculated = calculatedItems.find((ci) => ci.id === item.id);
                  if (!calculated) return null;

                  return (
                    <ResultsGrid>
                      <ResultItem>
                        <ResultLabel>Revenue</ResultLabel>
                        <ResultValue>
                          {calculated.revenue !== null
                            ? `$${calculated.revenue.toFixed(2)}`
                            : 'N/A'}
                        </ResultValue>
                      </ResultItem>

                      <ResultItem>
                        <ResultLabel>Profit</ResultLabel>
                        <ResultValue
                          $positive={calculated.profit !== null && calculated.profit > 0}
                          $negative={calculated.profit !== null && calculated.profit < 0}
                          $na={calculated.profit === null}
                        >
                          {calculated.profit !== null
                            ? `$${calculated.profit.toFixed(2)}`
                            : 'N/A'}
                        </ResultValue>
                      </ResultItem>

                      <ResultItem>
                        <ResultLabel>Profit Margin (%)</ResultLabel>
                        <ResultValue
                          $positive={calculated.profitMargin !== null && calculated.profitMargin > 0}
                          $negative={calculated.profitMargin !== null && calculated.profitMargin < 0}
                          $na={calculated.profitMargin === null}
                        >
                          {calculated.profitMargin !== null
                            ? `${calculated.profitMargin}%`
                            : 'N/A'}
                        </ResultValue>
                      </ResultItem>

                      <ResultItem>
                        <ResultLabel>Return on Cost (%)</ResultLabel>
                        <ResultValue
                          $positive={calculated.returnOnCost !== null && calculated.returnOnCost > 0}
                          $negative={calculated.returnOnCost !== null && calculated.returnOnCost < 0}
                          $na={calculated.returnOnCost === null}
                        >
                          {calculated.returnOnCost !== null
                            ? `${calculated.returnOnCost}%`
                            : 'N/A'}
                        </ResultValue>
                      </ResultItem>
                    </ResultsGrid>
                  );
                })()}
              </ItemCard>
            ))}

            <SaveButtonRow>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/expenses/list')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveAll}
                disabled={loading || calculatedItems.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save All Expenses
                  </>
                )}
              </Button>
            </SaveButtonRow>
          </FormCard>

          {/* Results Table */}
          {calculatedItems.some((item) => item.itemName) && (
            <FormCard>
              <Title style={{ fontSize: '20px', marginBottom: '16px' }}>
                <DollarSign size={20} />
                Detailed Results
              </Title>
              <ResultsTable>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Item Name</TableHeaderCell>
                    <TableHeaderCell>Expense</TableHeaderCell>
                    <TableHeaderCell>Buy-at</TableHeaderCell>
                    <TableHeaderCell>Sold-at</TableHeaderCell>
                    <TableHeaderCell>Revenue</TableHeaderCell>
                    <TableHeaderCell>Profit</TableHeaderCell>
                    <TableHeaderCell>Profit Margin (%)</TableHeaderCell>
                    <TableHeaderCell>Return on Cost (%)</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.itemName || '-'}</TableCell>
                      <TableCell>
                        {typeof item.expenseAmount === 'number'
                          ? `$${item.expenseAmount.toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {typeof item.buyAtPrice === 'number' ? `$${item.buyAtPrice.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {typeof item.soldAtPrice === 'number'
                          ? `$${item.soldAtPrice.toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {item.revenue !== null ? `$${item.revenue.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span
                          style={{
                            color:
                              item.profit === null
                                ? 'var(--muted-foreground)'
                                : item.profit >= 0
                                  ? '#059669'
                                  : '#dc2626',
                            fontWeight: 600,
                          }}
                        >
                          {item.profit !== null ? `$${item.profit.toFixed(2)}` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          style={{
                            color:
                              item.profitMargin === null
                                ? 'var(--muted-foreground)'
                                : item.profitMargin >= 0
                                  ? '#059669'
                                  : '#dc2626',
                            fontWeight: 600,
                          }}
                        >
                          {item.profitMargin !== null ? `${item.profitMargin}%` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          style={{
                            color:
                              item.returnOnCost === null
                                ? 'var(--muted-foreground)'
                                : item.returnOnCost >= 0
                                  ? '#059669'
                                  : '#dc2626',
                            fontWeight: 600,
                          }}
                        >
                          {item.returnOnCost !== null ? `${item.returnOnCost}%` : 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ResultsTable>
            </FormCard>
          )}

          {/* Summary Section */}
          {(totals.totalExpense > 0 || totals.totalRevenue !== 0 || totals.totalProfit !== 0) && (
            <SummaryCard>
              <SummaryTitle>
                <Calculator size={20} />
                Summary
              </SummaryTitle>
              <SummaryGrid>
                <SummaryItem>
                  <SummaryLabel>Total Expense</SummaryLabel>
                  <SummaryValue>${totals.totalExpense.toFixed(2)}</SummaryValue>
                </SummaryItem>
                <SummaryItem>
                  <SummaryLabel>Total Revenue</SummaryLabel>
                  <SummaryValue>${totals.totalRevenue.toFixed(2)}</SummaryValue>
                </SummaryItem>
                <SummaryItem>
                  <SummaryLabel>Total Profit</SummaryLabel>
                  <SummaryValue
                    style={{
                      color: totals.totalProfit >= 0 ? '#a7f3d0' : '#fecaca',
                    }}
                  >
                    ${totals.totalProfit.toFixed(2)}
                  </SummaryValue>
                </SummaryItem>
                <SummaryItem>
                  <SummaryLabel>Average Profit Margin</SummaryLabel>
                  <SummaryValue>
                    {averageProfitMargin !== null ? `${averageProfitMargin}%` : 'N/A'}
                  </SummaryValue>
                </SummaryItem>
              </SummaryGrid>
            </SummaryCard>
          )}
        </InnerContent>
      </ContentArea>
    </LayoutWrapper>
  );
}

