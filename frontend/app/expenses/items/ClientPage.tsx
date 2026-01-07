'use client';
import { useState, useEffect, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calculator, DollarSign, AlertCircle, CheckCircle, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

// ──────────────────────────────────────────
// Theme-aware Constants
// ──────────────────────────────────────────
const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_CARD = (props: any) => props.theme.colors.background || '#ffffff';
const BACKGROUND_PAGE = (props: any) => props.theme.colors.backgroundSecondary || '#f5f6fa';

const CardShadow = (props: any) => props.theme.mode === 'dark'
  ? '0 4px 20px rgba(0,0,0,0.4)'
  : `
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 1px 2px -1px rgba(0, 0, 0, 0.03),
    inset 0 0 0 1px rgba(0, 0, 0, 0.02)
  `;

const CardShadowHover = (props: any) => props.theme.mode === 'dark'
  ? '0 8px 30px rgba(0,0,0,0.5)'
  : `
    0 8px 12px -2px rgba(0, 0, 0, 0.08),
    0 4px 6px -2px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px rgba(0, 0, 0, 0.03)
  `;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  transition: color ${props => props.theme.transitions.default};

  &:hover {
    color: ${PRIMARY_COLOR};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0 0 ${props => props.theme.spacing.xs};
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.md};
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.md};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }

  svg {
    width: 32px;
    height: 32px;
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.mode === 'dark' ? '#6ee7b7' : '#059669'};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const FormCard = styled.div`
  background: ${BACKGROUND_CARD};
  padding: ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
  margin-bottom: ${props => props.theme.spacing.lg};
  transition: box-shadow ${props => props.theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const GlobalSettingsCard = styled.div`
  background: ${BACKGROUND_PAGE};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: ${CardShadow};
`;

const GlobalSettingsTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  margin: 0 0 ${props => props.theme.spacing.md};
  color: ${TEXT_COLOR_DARK};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const ItemCard = styled.div`
  background: ${BACKGROUND_PAGE};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  position: relative;
  transition: box-shadow ${props => props.theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadow};
  }
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ItemTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const DeleteButton = styled.button`
  background: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)'};
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  transition: all ${props => props.theme.transitions.default};

  &:hover:not(:disabled) {
    background: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'};
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.5)'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FieldError = styled.p`
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  margin-top: ${props => props.theme.spacing.xs};
  margin: 0;
`;

const HelperText = styled.div`
  color: ${TEXT_COLOR_MUTED};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  margin-top: ${props => props.theme.spacing.xs};
  line-height: 1.5;
  
  strong {
    color: ${TEXT_COLOR_DARK};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
  }
  
  ul {
    margin: ${props => props.theme.spacing.sm} 0 0 ${props => props.theme.spacing.xl};
    padding: 0;
    list-style-type: disc;
  }
  
  li {
    margin: ${props => props.theme.spacing.xs} 0;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 2px solid ${BORDER_COLOR};
`;

const ResultItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const ResultLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
`;

interface ResultValueProps {
  $positive?: boolean;
  $negative?: boolean;
  $na?: boolean;
}

const ResultValue = styled.span<ResultValueProps>`
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${(props) => {
    if (props.$na) return TEXT_COLOR_MUTED;
    if (props.$positive) return props.theme.mode === 'dark' ? '#6ee7b7' : '#059669';
    if (props.$negative) return props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626';
    return TEXT_COLOR_DARK;
  }};
`;

const AddButton = styled(Button)`
  width: 100%;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SaveButtonRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing.lg};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 2px solid ${BORDER_COLOR};
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${BORDER_COLOR};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${BACKGROUND_CARD};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
  }

  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  &[type="date"] {
    cursor: pointer;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${BORDER_COLOR};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    background: ${BACKGROUND_CARD};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
  }

  &:disabled {
    background-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
  }
`;

const ResultsTableContainer = styled.div`
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
  overflow: hidden;
  margin-top: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  margin: 0 0 ${props => props.theme.spacing.md};
  color: ${TEXT_COLOR_DARK};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  svg {
    width: 20px;
    height: 20px;
    color: ${PRIMARY_COLOR};
  }
`;

const ResultsTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  background: ${BACKGROUND_PAGE};
  border-bottom: 2px solid ${BORDER_COLOR};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${BORDER_COLOR};
  transition: background-color ${props => props.theme.transitions.default};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${BACKGROUND_PAGE};
  }
`;

const TableHeaderCell = styled.th`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  text-align: left;
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
`;

const TableBody = styled.tbody``;

const SummaryCard = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: white;
  padding: ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-top: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const SummaryTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  margin: 0 0 ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: #ffffff;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const SummaryLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  opacity: 0.9;
  font-weight: ${props => props.theme.typography.fontWeights.medium};
`;

const SummaryValue = styled.span`
  font-size: clamp(20px, 3vw, 24px);
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: #ffffff;
`;

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

export default function ExpenseItemsPage() {
  const theme = useTheme();
  const router = useRouter();
  const idCounterRef = useRef(0);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [globalDate, setGlobalDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [globalCategory, setGlobalCategory] = useState<string>('other');
  const [globalVendor, setGlobalVendor] = useState<string>('');

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

  useEffect(() => {
    const calculated = items.map((item) => calculateItem(item));
    setCalculatedItems(calculated);
  }, [items]);

  const calculateItem = (item: ExpenseItem): CalculatedItem => {
    const errors: { expenseAmount?: string; buyAtPrice?: string; soldAtPrice?: string } = {};

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

    let revenue: number | null = null;
    if (buyAtPrice !== null && soldAtPrice !== null && !isNaN(buyAtPrice) && !isNaN(soldAtPrice)) {
      revenue = soldAtPrice - buyAtPrice;
    }

    let profit: number | null = null;
    if (revenue !== null && expenseAmount !== null && !isNaN(expenseAmount)) {
      profit = revenue - expenseAmount;
    }

    let profitMargin: number | null = null;
    if (profit !== null && soldAtPrice !== null && soldAtPrice !== 0 && !isNaN(soldAtPrice)) {
      profitMargin = (profit / soldAtPrice) * 100;
    }

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

  const hasErrors = calculatedItems.some((item) => Object.keys(item.errors).length > 0);
  const hasMissingRequiredFields = calculatedItems.some(
    (item) => !item.buyAtPrice || !item.soldAtPrice || !item.itemName
  );

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

  const handleSaveAll = async () => {
    setError(null);
    setSuccess(null);

    if (!validateItems()) {
      return;
    }

    setLoading(true);

    try {
      const savePromises: Promise<unknown>[] = [];
      let revenueCount = 0;

      for (const item of calculatedItems) {
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

        savePromises.push(apiClient.createExpense(expenseData));

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
    } catch (err: unknown) {
      let errorMessage = 'Failed to save expenses';

      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { detail?: unknown } } }).response;
        const detail = response?.data?.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: unknown) => {
            if (typeof e === 'string') return e;
            if (e && typeof e === 'object' && 'msg' in e) {
              const obj = e as { msg?: string; loc?: unknown };
              const loc = Array.isArray(obj.loc) ? obj.loc.join('.') : 'Field';
              return `${loc}: ${obj.msg ?? 'Invalid value'}`;
            }
            try {
              return JSON.stringify(e);
            } catch {
              return 'Unknown error';
            }
          }).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href="/expenses/list">
            <ArrowLeft />
            Back to Expenses
          </BackLink>

          <HeaderContainer>
            <h1>
              <Calculator />
              Expense Items Calculator
            </h1>
            <p>Enter multiple expense items with automatic revenue and profit calculations</p>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          {success && (
            <SuccessBanner>
              <CheckCircle />
              <span>{success}</span>
            </SuccessBanner>
          )}

          {hasErrors && (
            <ErrorBanner>
              <AlertCircle />
              <span>Please fix validation errors in the items below</span>
            </ErrorBanner>
          )}

          <GlobalSettingsCard>
            <GlobalSettingsTitle>Global Settings (Applied to All Items)</GlobalSettingsTitle>
            <FormGrid>
              <FormGroup>
                <Label htmlFor="globalDate">Date </Label>
                <StyledInput
                  id="globalDate"
                  type="date"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="globalCategory">Category </Label>
                <StyledSelect
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
                </StyledSelect>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="globalVendor">Vendor (Optional)</Label>
                <StyledInput
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
              <Plus size={16} style={{ marginRight: theme.spacing.xs }} />
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
                    <Trash2 />
                    Remove
                  </DeleteButton>
                </ItemHeader>

                <FormGrid>
                  <FormGroup>
                    <Label htmlFor={`itemName-${item.id}`}>Item Name / Type </Label>
                    <StyledInput
                      id={`itemName-${item.id}`}
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                      placeholder="e.g., Product A, Service B"
                      disabled={loading}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor={`expenseAmount-${item.id}`}>Expense Amount (Opt)</Label>
                    <StyledInput
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
                      <ul>
                        <li>Cost of shipping</li>
                        <li>Labor cost</li>
                        <li>Packaging cost</li>
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
                    <Label htmlFor={`buyAtPrice-${item.id}`}>Buy-at Price </Label>
                    <StyledInput
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
                    <Label htmlFor={`soldAtPrice-${item.id}`}>Sold-at Price </Label>
                    <StyledInput
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

          {calculatedItems.some((item) => item.itemName) && (
            <FormCard>
              <SectionTitle>
                <DollarSign />
                Detailed Results
              </SectionTitle>
              <ResultsTableContainer>
                <div style={{ overflowX: 'auto' }}>
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
                          <TableCell style={{ whiteSpace: 'nowrap' }}>{item.itemName || '-'}</TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            {typeof item.expenseAmount === 'number'
                              ? `$${item.expenseAmount.toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            {typeof item.buyAtPrice === 'number' ? `$${item.buyAtPrice.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            {typeof item.soldAtPrice === 'number'
                              ? `$${item.soldAtPrice.toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            {item.revenue !== null ? `$${item.revenue.toFixed(2)}` : 'N/A'}
                          </TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                color:
                                  item.profit === null
                                    ? TEXT_COLOR_MUTED({ theme })
                                    : item.profit >= 0
                                      ? (theme.mode === 'dark' ? '#6ee7b7' : '#059669')
                                      : (theme.mode === 'dark' ? '#fca5a5' : '#dc2626'),
                                fontWeight: theme.typography.fontWeights.bold,
                              }}
                            >
                              {item.profit !== null ? `$${item.profit.toFixed(2)}` : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                color:
                                  item.profitMargin === null
                                    ? TEXT_COLOR_MUTED({ theme })
                                    : item.profitMargin >= 0
                                      ? (theme.mode === 'dark' ? '#6ee7b7' : '#059669')
                                      : (theme.mode === 'dark' ? '#fca5a5' : '#dc2626'),
                                fontWeight: theme.typography.fontWeights.bold,
                              }}
                            >
                              {item.profitMargin !== null ? `${item.profitMargin}%` : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                color:
                                  item.returnOnCost === null
                                    ? TEXT_COLOR_MUTED({ theme })
                                    : item.returnOnCost >= 0
                                      ? (theme.mode === 'dark' ? '#6ee7b7' : '#059669')
                                      : (theme.mode === 'dark' ? '#fca5a5' : '#dc2626'),
                                fontWeight: theme.typography.fontWeights.bold,
                              }}
                            >
                              {item.returnOnCost !== null ? `${item.returnOnCost}%` : 'N/A'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </ResultsTable>
                </div>
              </ResultsTableContainer>
            </FormCard>
          )}

          {(totals.totalExpense > 0 || totals.totalRevenue !== 0 || totals.totalProfit !== 0) && (
            <SummaryCard>
              <SummaryTitle>
                <Calculator />
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
                      color: totals.totalProfit >= 0 ? (theme.mode === 'dark' ? '#6ee7b7' : '#a7f3d0') : (theme.mode === 'dark' ? '#fca5a5' : '#fecaca'),
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
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
