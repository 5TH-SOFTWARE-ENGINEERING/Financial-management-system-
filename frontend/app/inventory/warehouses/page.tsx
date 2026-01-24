"use client";

import { useState, useEffect } from "react";
import styled, { useTheme, css } from "styled-components";
import {
  Warehouse as WarehouseIcon,
  ArrowRightLeft,
  MapPin,
  Plus,
  Boxes,
  Truck,
  ShieldCheck,
  MoreVertical,
  Pencil,
  Trash,
  Loader2,
  X,
  ChevronRight,
  Building2,
  History
} from "lucide-react";
import { apiClient, Warehouse, StockTransferCreate, InventoryItem, WarehouseCreate, StockTransfer } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";


// --- Styled Components ---

const getThemeColor = (props: any, key: string, fallback: string) => {
  const theme = props?.theme || props;
  return theme?.colors?.[key] || fallback;
};

const PRIMARY_COLOR = (props: any) => getThemeColor(props, 'primary', '#00AA00');
const TEXT_COLOR_DARK = (props: any) => getThemeColor(props, 'textDark', '#0f172a');
const TEXT_COLOR_MUTED = (props: any) => getThemeColor(props, 'textSecondary', '#666');

const BACKGROUND_GRADIENT = (props: any) => {
  const theme = props?.theme || props;
  const mode = theme?.mode || 'light';
  const bg = theme?.colors?.background || '#ffffff';
  return mode === 'dark'
    ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${bg} 100%)`
    : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${bg} 100%)`;
};

const CardShadow = (props: any) => {
  const theme = props?.theme || props;
  return `
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 1px 2px -1px rgba(0, 0, 0, 0.03),
    inset 0 0 0 1px ${theme?.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}
  `;
};

const PageContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme?.spacing?.lg || '24px'};
  background: ${BACKGROUND_GRADIENT};
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme?.spacing?.sm || '8px'};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${props => props.theme?.spacing?.xl || '32px'};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme?.spacing?.md || '16px'};
  }
`;

const TitleSection = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    letter-spacing: -0.025em;
  }
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: 1.125rem;
    margin-top: ${props => props.theme.spacing.xs};
    font-weight: 500;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const StyledButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme?.spacing?.sm || '8px'};
  padding: ${props => props.theme?.spacing?.sm || '8px'} ${props => props.theme?.spacing?.lg || '24px'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  font-weight: bold;
  transition: all 0.2s;
  cursor: pointer;
  
  ${props => props.$variant === 'secondary' ? css`
    background: ${props.theme?.colors?.card || '#fff'};
    color: ${TEXT_COLOR_DARK};
    border: 1px solid ${props.theme?.colors?.border || '#ddd'};
    box-shadow: ${CardShadow};
    
    &:hover {
      transform: translateY(-2px);
    }
  ` : css`
    background: ${TEXT_COLOR_DARK};
    color: ${props.theme?.colors?.background || '#fff'};
    border: none;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${props => props.theme?.spacing?.md || '16px'};
  margin-bottom: ${props => props.theme?.spacing?.xl || '32px'};
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.card || '#fff'};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#ddd'};
  box-shadow: ${CardShadow};
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`;

const StatIconWrapper = styled.div`
  position: absolute;
  right: -1rem;
  bottom: -1rem;
  width: 8rem;
  height: 8rem;
  opacity: 0.1;
  transition: transform 0.5s ease;
  
  ${StatCard}:hover & {
    transform: scale(1.1);
  }
`;

const StatLabel = styled.h3`
  color: ${TEXT_COLOR_MUTED};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
`;

const StatValue = styled.div`
  font-size: 2.25rem;
  font-weight: 900;
  color: ${TEXT_COLOR_DARK};
  margin-bottom: 0.25rem;
`;

const StatSubtext = styled.p`
  color: ${TEXT_COLOR_MUTED};
  font-size: 0.875rem;
  font-weight: 500;
`;

const WarehouseGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme?.spacing?.md || '16px'};
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const WarehouseCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.card || '#fff'};
  backdrop-filter: blur(8px);
  border-radius: 1.5rem;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#ddd'};
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;

  &:hover {
    box-shadow: ${CardShadow};
    transform: translateY(-4px) scale(1.01);
    border-color: ${PRIMARY_COLOR};
  }
`;

const IconBox = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${props => props.theme?.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff'};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  position: relative;
`;

const WarehouseInfo = styled.div`
  flex: 1;
`;

const WarehouseName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  
  h4 {
    font-size: 1.125rem;
    font-weight: 900;
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const MainBadge = styled.span`
  background: #dbeafe;
  color: #2563eb;
  font-size: 0.625rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
`;

const AddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${TEXT_COLOR_MUTED};
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;

const MetricsRow = styled.div`
  display: flex;
  gap: 1rem;
`;

const Metric = styled.div<{ $bordered?: boolean }>`
  ${props => props.$bordered && css`
    border-left: 1px solid ${props.theme?.colors?.border || '#ddd'};
    padding-left: 1rem;
  `}
  
  div:first-child {
    font-size: 0.625rem;
    font-weight: 700;
    color: ${TEXT_COLOR_MUTED};
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  div:last-child {
    font-weight: 700;
    color: ${TEXT_COLOR_DARK};
  }
`;

const ActionMenuButton = styled.button`
  padding: 0.5rem;
  color: ${props => props.theme?.colors?.textSecondary || '#666'};
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme?.colors?.border || '#ddd'};
    color: ${TEXT_COLOR_DARK};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: ${props => props.theme?.colors?.card || '#fff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#ddd'};
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 0.5rem;
  z-index: 1000;
  min-width: 14rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transform-origin: top right;
  animation: fadeIn scaleIn 0.2s ease-out;

  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const DropdownItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  border: none;
  background: transparent;
  color: ${props => props.$danger ? '#ef4444' : props.theme?.colors?.textDark || '#0f172a'};
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$danger ? '#fef2f2' : props.theme?.colors?.background || '#f9fafb'};
  }
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${props => props.theme?.colors?.card || '#fff'};
  width: 100%;
  max-width: 36rem;
  border-radius: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid ${props => props.theme?.colors?.border || '#ddd'};
`;

const ModalBody = styled.div`
  padding: 2.5rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.875rem;
    font-weight: 900;
    letter-spacing: -0.025em;
    margin: 0;
    color: ${TEXT_COLOR_DARK};
  }
  p {
    color: ${TEXT_COLOR_MUTED};
    font-weight: 500;
    margin-top: 0.25rem;
  }
`;

const CloseButton = styled.button`
  color: ${TEXT_COLOR_MUTED};
  background: transparent;
  border: none;
  cursor: pointer;
  &:hover { color: ${TEXT_COLOR_DARK}; }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.75rem;
    font-weight: 700;
    color: ${TEXT_COLOR_MUTED};
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  background: ${props => props.theme?.colors?.background || '#fff'};
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#ddd'};
  outline: none;
  font-weight: 700;
  color: ${TEXT_COLOR_DARK};
  
  &:focus {
    border-color: ${PRIMARY_COLOR};
  }
`;

const StyledInput = styled.input`
  width: 100%;
  background: ${props => props.theme?.colors?.background || '#fff'};
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#ddd'};
  outline: none;
  font-weight: 700;
  font-size: 1.25rem;
  color: ${TEXT_COLOR_DARK};
  
  &:focus {
    border-color: ${PRIMARY_COLOR};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background: #2563eb;
  color: white;
  padding: 1.25rem;
  border-radius: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
  
  &:hover {
    background: #1d4ed8;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  background: ${props => props.theme?.colors?.card || '#fff'};
  border-radius: 1.5rem;
  padding: 5rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#ddd'};
  text-align: center;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${TEXT_COLOR_DARK};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    max-width: 24rem;
    margin: 0 auto;
  }
`;

const EmptyIconWrapper = styled.div`
  width: 5rem;
  height: 5rem;
  background: ${props => props.theme?.colors?.background || '#f9fafb'};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: ${props => props.theme?.colors?.border || '#ddd'};
`;

export default function WarehouseDashboard() {
  const theme = useTheme();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  // New Modals State
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Transfer form state
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [transferData, setTransferData] = useState<StockTransferCreate>({
    item_id: 0,
    from_warehouse_id: 0,
    to_warehouse_id: 0,
    quantity: 0
  });
  const [submitting, setSubmitting] = useState(false);

  // Create/Edit warehouse form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [newWarehouseData, setNewWarehouseData] = useState<WarehouseCreate>({
    name: "",
    address: "",
    is_active: true,
    is_main: false
  });

  // Fetch stocks when filtering source
  const handleSourceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = parseInt(e.target.value);
    setTransferData({ ...transferData, from_warehouse_id: warehouseId, item_id: 0 });

    if (warehouseId === 0) {
      setWarehouseItems([]);
      return;
    }

    try {
      setLoadingItems(true);
      const res = await apiClient.getWarehouseStocks(warehouseId);
      const stocks = Array.isArray(res.data) ? res.data : [];
      setWarehouseItems(stocks);
    } catch (error) {
      console.error("Failed to fetch warehouse stocks:", error);
      toast.error("Could not load available items for this warehouse");
      setWarehouseItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchItems();
    fetchTransfers();

    // Close menu on click outside
    const handleClickOutside = (e: MouseEvent) => {
      // Check if the click was on a morevertical button or menu
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await apiClient.getTransfers();
      const data = Array.isArray(res.data) ? res.data : [];
      setTransfers(data);
    } catch (error) {
      console.error("Failed to fetch transfers:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getWarehouses();
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.data || [];

      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
      toast.error("Failed to load warehouses");
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await apiClient.getInventoryItems();
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.data || [];
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.item_id || !transferData.from_warehouse_id || !transferData.to_warehouse_id || !transferData.quantity) {
      toast.error("Please fill all fields");
      return;
    }

    if (transferData.from_warehouse_id === transferData.to_warehouse_id) {
      toast.error("Source and destination must be different");
      return;
    }

    // New validation: check against available stock
    const selectedItemStock = warehouseItems.find(s => s.item_id === transferData.item_id);
    if (selectedItemStock && transferData.quantity > selectedItemStock.quantity) {
      toast.error(`Insufficient stock. Available: ${selectedItemStock.quantity}`);
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.initiateTransfer(transferData);
      toast.success("Stock transfer initiated");
      setShowTransferForm(false);
      fetchData();
      fetchTransfers();
      setTransferData({
        item_id: 0,
        from_warehouse_id: 0,
        to_warehouse_id: 0,
        quantity: 0
      });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShipTransfer = async (transferId: number) => {
    try {
      setSubmitting(true);
      await apiClient.shipTransfer(transferId);
      toast.success("Stock shipped");
      fetchData();
      fetchTransfers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveTransfer = async (transferId: number) => {
    try {
      setSubmitting(true);
      await apiClient.receiveTransfer(transferId);
      toast.success("Stock received and updated");
      fetchData();
      fetchTransfers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await apiClient.updateWarehouse(editingId, newWarehouseData);
        toast.success("Warehouse updated successfully");
      } else {
        await apiClient.createWarehouse(newWarehouseData);
        toast.success("Warehouse created successfully");
      }
      setShowCreateForm(false);
      setEditingId(null);
      fetchData();
      setNewWarehouseData({
        name: "",
        address: "",
        is_active: true,
        is_main: false
      });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setNewWarehouseData({
      name: warehouse.name,
      address: warehouse.address,
      is_active: warehouse.is_active,
      is_main: warehouse.is_main
    });
    setShowCreateForm(true);
    setActiveMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;

    try {
      await apiClient.deleteWarehouse(id);
      toast.success("Warehouse deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete warehouse");
    }
    setActiveMenuId(null);
  };

  const openNewWarehouseModal = () => {
    setEditingId(null);
    setNewWarehouseData({
      name: "",
      address: "",
      is_active: true,
      is_main: false
    });
    setShowCreateForm(true);
  };

  const openInventoryModal = async (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowInventoryModal(true);
    setActiveMenuId(null);
    try {
      setModalLoading(true);
      const res = await apiClient.getWarehouseStocks(warehouse.id);
      setModalData(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setModalLoading(false);
    }
  };

  const openAuditModal = async (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowAuditModal(true);
    setActiveMenuId(null);
    try {
      setModalLoading(true);
      const res = await apiClient.getTransfers(undefined, warehouse.id);
      setModalData(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Failed to load audit history");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <TitleSection>
              <h1>Multi-Warehouse</h1>
              <p>Manage stock across multiple physical locations</p>
            </TitleSection>

            <ActionButtons>
              <StyledButton
                $variant="secondary"
                onClick={() => setShowTransferForm(true)}
              >
                <ArrowRightLeft size={16} color="#2563eb" />
                Transfer Stock
              </StyledButton>
              <StyledButton onClick={openNewWarehouseModal}>
                <Plus size={16} />
                New Warehouse
              </StyledButton>
            </ActionButtons>
          </HeaderContainer>

          <StatsGrid>
            <StatCard>
              <StatIconWrapper>
                <WarehouseIcon size={128} />
              </StatIconWrapper>
              <StatLabel>Stock Volume</StatLabel>
              <StatValue>{warehouses.reduce((acc, w) => acc + (w.total_items || 0), 0)}</StatValue>
              <StatSubtext>Total Items Stored</StatSubtext>
            </StatCard>

            <StatCard>
              <StatIconWrapper>
                <Boxes size={128} />
              </StatIconWrapper>
              <StatLabel>Stock Value</StatLabel>
              <StatValue>${(warehouses.reduce((acc, w) => acc + (w.total_value || 0), 0) / 1000).toFixed(1)}k</StatValue>
              <StatSubtext>Across all locations</StatSubtext>
            </StatCard>

            <StatCard
              style={{ background: theme?.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.9)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatIconWrapper>
                <Truck size={128} color="white" style={{ opacity: 0.1 }} />
              </StatIconWrapper>
              <StatLabel style={{ color: 'rgba(255,255,255,0.5)' }}>Live Transfers</StatLabel>
              <StatValue style={{ color: 'white' }}>
                {transfers.filter(t => t.status === 'pending' || t.status === 'shipped').length}
              </StatValue>
              <StatSubtext style={{ color: 'rgba(255,255,255,0.5)' }}>In-transit movements</StatSubtext>
            </StatCard>
          </StatsGrid>

          {/* Warehouse List */}
          <WarehouseGrid>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <Loader2 className="animate-spin text-blue-500" size={40} />
              </div>
            ) : warehouses.length === 0 ? (
              <EmptyState>
                <EmptyIconWrapper>
                  <WarehouseIcon size={40} />
                </EmptyIconWrapper>
                <h3>No Warehouses Configured</h3>
                <p>Create your first physical storage location to start tracking stock across multiple areas.</p>
              </EmptyState>
            ) : (
              <AnimatePresence>
                {warehouses.map((warehouse, index) => (
                  <WarehouseCard
                    key={warehouse.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <IconBox>
                      <WarehouseIcon size={32} />
                      {warehouse.is_main && (
                        <div style={{ position: 'absolute', top: -8, right: -8, background: '#2563eb', color: 'white', padding: 4, borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                          <ShieldCheck size={12} />
                        </div>
                      )}
                    </IconBox>

                    <WarehouseInfo>
                      <WarehouseName>
                        <h4>{warehouse.name}</h4>
                        {warehouse.is_main && <MainBadge>Main HQ</MainBadge>}
                      </WarehouseName>
                      <AddressRow>
                        <MapPin size={12} />
                        {warehouse.address || "No address set"}
                      </AddressRow>
                      <MetricsRow>
                        <Metric>
                          <div>Stock</div>
                          <div>{warehouse.total_items || 0}</div>
                        </Metric>
                        <Metric $bordered>
                          <div>Utilization</div>
                          <div>{warehouse.utilization || 0}%</div>
                        </Metric>
                        {(() => {
                          const incomingCount = transfers
                            .filter(t => t.to_warehouse_id === warehouse.id && (t.status === 'pending' || t.status === 'shipped'))
                            .reduce((sum, t) => sum + t.quantity, 0);

                          return incomingCount > 0 ? (
                            <Metric $bordered>
                              <div style={{ color: '#2563eb' }}>Incoming</div>
                              <div style={{ color: '#2563eb' }}>+{incomingCount}</div>
                            </Metric>
                          ) : null;
                        })()}
                      </MetricsRow>
                    </WarehouseInfo>

                    <div className="action-menu-container" style={{ position: 'relative' }}>
                      <ActionMenuButton onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === warehouse.id ? null : warehouse.id);
                      }}>
                        <MoreVertical size={20} />
                      </ActionMenuButton>

                      {activeMenuId === warehouse.id && (
                        <DropdownMenu onClick={e => e.stopPropagation()}>
                          <DropdownItem onClick={() => openInventoryModal(warehouse)}>
                            <Boxes size={18} /> <span>View Inventory</span>
                          </DropdownItem>
                          <DropdownItem onClick={() => openAuditModal(warehouse)}>
                            <History size={18} /> <span>Audit History</span>
                          </DropdownItem>
                          <div style={{ height: '1px', background: theme?.colors?.border || '#ddd', margin: '8px 4px', opacity: 0.5 }} />
                          <DropdownItem onClick={() => startEdit(warehouse)}>
                            <Pencil size={18} /> <span>Edit Warehouse</span>
                          </DropdownItem>
                          <DropdownItem $danger onClick={() => handleDelete(warehouse.id)}>
                            <Trash size={18} /> <span>Delete Warehouse</span>
                          </DropdownItem>
                        </DropdownMenu>
                      )}
                    </div>
                  </WarehouseCard>
                ))}
              </AnimatePresence>
            )}
          </WarehouseGrid>

          {/* Movements Section */}
          <div style={{ marginTop: '4rem' }}>
            <HeaderContainer>
              <TitleSection>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: TEXT_COLOR_DARK(theme as any) }}>Stock Movements</h2>
                <p>Track in-transit items and pending actions</p>
              </TitleSection>
            </HeaderContainer>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {transfers.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: (theme as any)?.colors?.card || '#fff', borderRadius: '1.5rem', border: `1px solid ${(theme as any)?.colors?.border || '#ddd'}` }}>
                  <p style={{ color: TEXT_COLOR_MUTED(theme as any) }}>No recent stock movements</p>
                </div>
              ) : (
                transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    style={{
                      background: (theme as any)?.colors?.card || '#fff',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '1.25rem',
                      border: `1px solid ${(theme as any)?.colors?.border || '#ddd'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem'
                    }}
                  >
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: transfer.status === 'received' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: transfer.status === 'received' ? '#22c55e' : '#2563eb'
                    }}>
                      {transfer.status === 'received' ? <ShieldCheck size={20} /> : <Truck size={20} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: TEXT_COLOR_DARK(theme as any), fontSize: '1.05rem' }}>
                        {transfer.quantity}x {transfer.item_name || `Item #${transfer.item_id}`}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: TEXT_COLOR_MUTED(theme as any), display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {transfer.from_warehouse_name} <ArrowRightLeft size={12} /> {transfer.to_warehouse_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '0.625rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: transfer.status === 'received' ? '#22c55e' : (transfer.status === 'shipped' ? '#f59e0b' : '#2563eb'),
                          background: transfer.status === 'received' ? 'rgba(34, 197, 94, 0.1)' : (transfer.status === 'shipped' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(37, 99, 235, 0.1)'),
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px'
                        }}>
                          {transfer.status}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: TEXT_COLOR_MUTED(theme as any), marginTop: '0.4rem', fontWeight: 600 }}>
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {transfer.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShipTransfer(transfer.id)}
                          disabled={submitting}
                          style={{ fontWeight: 800, borderRadius: '0.75rem' }}
                        >
                          Ship
                        </Button>
                      )}
                      {transfer.status === 'shipped' && (
                        <Button
                          size="sm"
                          onClick={() => handleReceiveTransfer(transfer.id)}
                          disabled={submitting}
                          style={{ fontWeight: 800, borderRadius: '0.75rem', background: '#2563eb' }}
                        >
                          Receive
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transfer Modal */}
          {showTransferForm && (
            <ModalOverlay onClick={() => setShowTransferForm(false)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                <ModalBody>
                  <ModalHeader>
                    <div>
                      <h2>Transfer Stock</h2>
                      <p>Move inventory between locations</p>
                    </div>
                    <CloseButton onClick={() => setShowTransferForm(false)}>
                      <X size={24} />
                    </CloseButton>
                  </ModalHeader>

                  <form onSubmit={handleCreateTransfer}>
                    <FormGrid>
                      <InputGroup>
                        <label>Source Warehouse</label>
                        <StyledSelect
                          required
                          value={transferData.from_warehouse_id}
                          onChange={handleSourceChange}
                        >
                          <option value="0">Select Origin</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </StyledSelect>
                      </InputGroup>
                      <InputGroup>
                        <label>Destination</label>
                        <StyledSelect
                          required
                          value={transferData.to_warehouse_id}
                          onChange={(e) => setTransferData({ ...transferData, to_warehouse_id: parseInt(e.target.value) })}
                        >
                          <option value="0">Select Target</option>
                          {warehouses
                            .filter(w => w.id !== transferData.from_warehouse_id)
                            .map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </StyledSelect>
                      </InputGroup>
                    </FormGrid>

                    <InputGroup style={{ marginBottom: '1.5rem' }}>
                      <label>Inventory Item</label>
                      <StyledSelect
                        required
                        value={transferData.item_id}
                        onChange={(e) => setTransferData({ ...transferData, item_id: parseInt(e.target.value) })}
                        disabled={!transferData.from_warehouse_id || loadingItems}
                      >
                        <option value="0">
                          {loadingItems ? "Loading items..." : (!transferData.from_warehouse_id ? "Select Source First" : "Select Product")}
                        </option>
                        {warehouseItems.map(stock => (
                          <option key={stock.item_id} value={stock.item_id}>
                            {stock.item?.item_name || `Item #${stock.item_id}`} (Available: {stock.quantity})
                          </option>
                        ))}
                      </StyledSelect>
                    </InputGroup>

                    <InputGroup style={{ marginBottom: '1.5rem' }}>
                      <label>Transfer Quantity</label>
                      <StyledInput
                        type="number"
                        required
                        placeholder="0"
                        min="1"
                        value={transferData.quantity || ''}
                        onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })}
                      />
                    </InputGroup>

                    <SubmitButton type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="animate-spin" /> : <ArrowRightLeft size={20} />}
                      Initiate Transfer
                    </SubmitButton>
                  </form>
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          )}

          {/* Create/Edit Warehouse Modal */}
          {showCreateForm && (
            <ModalOverlay onClick={() => setShowCreateForm(false)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                <ModalBody>
                  <ModalHeader>
                    <div>
                      <h2>{editingId ? 'Edit Warehouse' : 'New Warehouse'}</h2>
                      <p>{editingId ? 'Update status and details' : 'Add a new physical storage location'}</p>
                    </div>
                    <CloseButton onClick={() => setShowCreateForm(false)}>
                      <X size={24} />
                    </CloseButton>
                  </ModalHeader>

                  <form onSubmit={handleCreateWarehouse}>
                    <InputGroup style={{ marginBottom: '1.5rem' }}>
                      <label>Warehouse Name</label>
                      <StyledInput
                        required
                        placeholder="e.g. Downtown Hub"
                        value={newWarehouseData.name}
                        onChange={(e) => setNewWarehouseData({ ...newWarehouseData, name: e.target.value })}
                      />
                    </InputGroup>

                    <InputGroup style={{ marginBottom: '1.5rem' }}>
                      <label>Address</label>
                      <StyledInput
                        placeholder="Physical address"
                        value={newWarehouseData.address || ''}
                        onChange={(e) => setNewWarehouseData({ ...newWarehouseData, address: e.target.value })}
                        style={{ fontSize: '1rem' }}
                      />
                    </InputGroup>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input
                          type="checkbox"
                          checked={newWarehouseData.is_main}
                          onChange={(e) => setNewWarehouseData({ ...newWarehouseData, is_main: e.target.checked })}
                          style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                        Main HQ
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input
                          type="checkbox"
                          checked={newWarehouseData.is_active}
                          onChange={(e) => setNewWarehouseData({ ...newWarehouseData, is_active: e.target.checked })}
                          style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                        Active
                      </label>
                    </div>

                    <SubmitButton type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="animate-spin" /> : (editingId ? <Pencil size={20} /> : <Plus size={20} />)}
                      {editingId ? 'Update Warehouse' : 'Create Warehouse'}
                    </SubmitButton>
                  </form>
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          )}

          {/* Inventory View Modal */}
          {showInventoryModal && (
            <ModalOverlay onClick={() => setShowInventoryModal(false)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                <ModalBody>
                  <ModalHeader>
                    <div>
                      <h2>{selectedWarehouse?.name} Inventory</h2>
                      <p>Current stock levels at this location</p>
                    </div>
                    <CloseButton onClick={() => setShowInventoryModal(false)}>
                      <X size={24} />
                    </CloseButton>
                  </ModalHeader>

                  <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {modalLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                      </div>
                    ) : modalData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <Boxes size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p style={{ color: TEXT_COLOR_MUTED(theme as any) }}>Empty inventory</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {modalData.map((stock: any) => (
                          <div key={stock.item_id} style={{ padding: '1rem', background: (theme as any)?.colors?.background || '#fff', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${(theme as any)?.colors?.border || '#ddd'}` }}>
                            <div>
                              <div style={{ fontWeight: 800, color: TEXT_COLOR_DARK(theme as any) }}>{stock.item?.item_name || `Item #${stock.item_id}`}</div>
                              <div style={{ fontSize: '0.75rem', color: TEXT_COLOR_MUTED(theme as any) }}>ID: {stock.item_id}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563eb' }}>{stock.quantity}</div>
                              <div style={{ fontSize: '0.625rem', color: TEXT_COLOR_MUTED(theme as any), fontWeight: 700 }}>UNITS</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          )}

          {/* Audit History Modal */}
          {showAuditModal && (
            <ModalOverlay onClick={() => setShowAuditModal(false)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                <ModalBody>
                  <ModalHeader>
                    <div>
                      <h2>Activity History</h2>
                      <p>Transfer logs for {selectedWarehouse?.name}</p>
                    </div>
                    <CloseButton onClick={() => setShowAuditModal(false)}>
                      <X size={24} />
                    </CloseButton>
                  </ModalHeader>

                  <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {modalLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                      </div>
                    ) : modalData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <History size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p style={{ color: TEXT_COLOR_MUTED(theme as any) }}>No activity found</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {modalData.map((log: any) => (
                          <div key={log.id} style={{ padding: '1rem', background: (theme as any)?.colors?.background || '#fff', borderRadius: '1rem', border: `1px solid ${(theme as any)?.colors?.border || '#ddd'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <div style={{ fontWeight: 800 }}>{log.item_name}</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: log.status === 'received' ? '#22c55e' : '#2563eb' }}>{log.status}</div>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: TEXT_COLOR_MUTED(theme as any), display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {log.from_warehouse_name} <ArrowRightLeft size={10} /> {log.to_warehouse_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: TEXT_COLOR_MUTED(theme as any), marginTop: '0.5rem' }}>
                              {new Date(log.created_at).toLocaleString()} • Qty: {log.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
