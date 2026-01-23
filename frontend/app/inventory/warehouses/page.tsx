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
  ChevronRight,
  Loader2,
  X,
  Building2
} from "lucide-react";
import { apiClient, Warehouse, StockTransferCreate, InventoryItem, WarehouseCreate } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";

// --- Styled Components ---

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = (props: any) => props.theme.mode === 'dark' ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${props.theme.colors.background} 100%)` : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${props.theme.colors.background} 100%)`;

const CardShadow = (props: any) => `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px ${props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}
`;

const PageContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
  background: ${BACKGROUND_GRADIENT};
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.md};
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
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: bold;
  transition: all 0.2s;
  cursor: pointer;
  
  ${props => props.$variant === 'secondary' ? css`
    background: ${props.theme.colors.card};
    color: ${TEXT_COLOR_DARK};
    border: 1px solid ${props.theme.colors.border};
    box-shadow: ${CardShadow};
    
    &:hover {
      transform: translateY(-2px);
    }
  ` : css`
    background: ${TEXT_COLOR_DARK};
    color: ${props.theme.colors.background};
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
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${CardShadow};
  position: relative;
  overflow: hidden;
  group: hover;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
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
  gap: ${props => props.theme.spacing.md};
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const WarehouseCard = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: 1.5rem;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    box-shadow: ${CardShadow};
    transform: translateY(-2px);
  }
`;

const IconBox = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff'};
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
    border-left: 1px solid ${props.theme.colors.border};
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

const ArrowButton = styled.button`
  padding: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${TEXT_COLOR_DARK};
    transform: translateX(4px);
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
  background: ${props => props.theme.colors.card};
  width: 100%;
  max-width: 36rem;
  border-radius: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
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
  background: ${props => props.theme.colors.background};
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  outline: none;
  font-weight: 700;
  color: ${TEXT_COLOR_DARK};
  
  &:focus {
    border-color: ${PRIMARY_COLOR};
  }
`;

const StyledInput = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background};
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid ${props => props.theme.colors.border};
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
  background: ${props => props.theme.colors.card};
  border-radius: 1.5rem;
  padding: 5rem;
  border: 1px solid ${props => props.theme.colors.border};
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
  background: ${props => props.theme.colors.background};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: ${props => props.theme.colors.border};
`;

export default function WarehouseDashboard() {
  const theme = useTheme();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer form state
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transferData, setTransferData] = useState<StockTransferCreate>({
    item_id: 0,
    from_warehouse_id: 0,
    to_warehouse_id: 0,
    quantity: 0
  });
  const [submitting, setSubmitting] = useState(false);

  // Create warehouse form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWarehouseData, setNewWarehouseData] = useState<WarehouseCreate>({
    name: "",
    address: "",
    is_active: true,
    is_main: false
  });

  useEffect(() => {
    fetchData();
    fetchItems();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getWarehouses();
      // Ensure we handle both array and object response structures
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

    try {
      setSubmitting(true);
      await apiClient.initiateTransfer(transferData);
      toast.success("Stock transfer initiated");
      setShowTransferForm(false);
      fetchData();
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

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.createWarehouse(newWarehouseData);
      toast.success("Warehouse created successfully");
      setShowCreateForm(false);
      fetchData();
      setNewWarehouseData({
        name: "",
        address: "",
        is_active: true,
        is_main: false
      });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          {/* Header */}
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
              <StyledButton onClick={() => setShowCreateForm(true)}>
                <Plus size={16} />
                New Warehouse
              </StyledButton>
            </ActionButtons>
          </HeaderContainer>

          {/* Quick Stats */}
          <StatsGrid>
            <StatCard>
              <StatIconWrapper>
                <WarehouseIcon size={128} />
              </StatIconWrapper>
              <StatLabel>Total Capacity</StatLabel>
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

            <StatCard style={{ background: theme.mode === 'dark' ? '#0f172a' : '#1e293b' }}>
              <StatIconWrapper>
                <Truck size={128} color="white" style={{ opacity: 0.1 }} />
              </StatIconWrapper>
              <StatLabel style={{ color: 'rgba(255,255,255,0.5)' }}>Live Transfers</StatLabel>
              <StatValue style={{ color: 'white' }}>12</StatValue>
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
            ) : warehouses.map((warehouse) => (
              <WarehouseCard key={warehouse.id}>
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
                      <div>Items</div>
                      <div>{warehouse.total_items || 0}</div>
                    </Metric>
                    <Metric $bordered>
                      <div>Utilization</div>
                      <div>{warehouse.utilization || 0}%</div>
                    </Metric>
                  </MetricsRow>
                </WarehouseInfo>

                <ArrowButton>
                  <ChevronRight size={24} />
                </ArrowButton>
              </WarehouseCard>
            ))}
          </WarehouseGrid>

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
                          onChange={(e) => setTransferData({ ...transferData, from_warehouse_id: parseInt(e.target.value) })}
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
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </StyledSelect>
                      </InputGroup>
                    </FormGrid>

                    <InputGroup style={{ marginBottom: '1.5rem' }}>
                      <label>Inventory Item</label>
                      <StyledSelect
                        required
                        value={transferData.item_id}
                        onChange={(e) => setTransferData({ ...transferData, item_id: parseInt(e.target.value) })}
                      >
                        <option value="0">Select Product</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.item_name} (Current: {i.quantity})</option>)}
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

          {/* Create Warehouse Modal */}
          {showCreateForm && (
            <ModalOverlay onClick={() => setShowCreateForm(false)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                <ModalBody>
                  <ModalHeader>
                    <div>
                      <h2>New Warehouse</h2>
                      <p>Add a new physical storage location</p>
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
                      {submitting ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                      Create Warehouse
                    </SubmitButton>
                  </form>
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
