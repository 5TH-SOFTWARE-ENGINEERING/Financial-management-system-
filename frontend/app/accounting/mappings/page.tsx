'use client';

import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import Layout from '@/components/layout';
import {
    LayoutDashboard,
    Link as LinkIcon,
    Plus,
    Trash2,
    Settings2,
    Save,
    Search,
    ChevronRight,
    Loader2
} from 'lucide-react';

// Styled Components Definitions

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #0a0a0a;
  color: #f3f4f6; /* text-gray-100 */
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 940px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-size: 1.875rem; /* 3xl */
  font-weight: 700; /* bold */
  letter-spacing: -0.025em; /* tracking-tight */
  background: linear-gradient(to right, #ffffff, #9ca3af);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
`;

const Subtitle = styled.p`
  color: #6b7280; /* text-gray-500 */
`;

const NewMappingButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4f46e5; /* indigo-600 */
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem; /* rounded-xl */
  font-weight: 500; /* font-medium */
  transition: all 0.2s;
  box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #6366f1; /* indigo-500 */
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MainContent = styled.div`
  grid-column: span 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 1024px) {
    grid-column: span 2;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  &:focus-within svg {
    color: #818cf8; /* indigo-400 */
  }
`;

const StyledSearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280; /* text-gray-500 */
  transition: color 0.2s;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem; /* rounded-2xl */
  padding: 1rem;
  padding-left: 3rem;
  padding-right: 1rem;
  color: inherit;
  backdrop-filter: blur(24px); /* backdrop-blur-xl */
  transition: all 0.2s;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5); /* ring-indigo-500/50 */
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const GlassPanel = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const Th = styled.th`
  padding: 1rem 1.5rem;
  font-size: 0.75rem; /* xs */
  font-weight: 600; /* font-semibold */
  text-transform: uppercase;
  letter-spacing: 0.05em; /* tracking-wider */
  color: #9ca3af; /* text-gray-400 */
`;

const Tbody = styled.tbody`
  & > tr:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const Tr = styled.tr`
  transition: background-color 0.2s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  color: #6b7280; /* text-gray-500 */
  border-radius: 0.5rem; /* rounded-lg */
  transition: all 0.2s;
  opacity: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  ${Tr}:hover & {
    opacity: 1;
  }

  &:hover {
    color: #f43f5e; /* rose-500 */
    background-color: rgba(244, 63, 94, 0.1); /* bg-rose-500/10 */
  }
`;

const Badge = styled.span<{ $colorClass?: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  /* We'll handle the colors via style prop or a mapping function since Tailwind classes were used dynamically */
  ${props => props.$colorClass === 'revenue' && css`color: #10b981; background-color: rgba(16, 185, 129, 0.1);`}
  ${props => props.$colorClass === 'expense' && css`color: #f43f5e; background-color: rgba(244, 63, 94, 0.1);`}
  ${props => props.$colorClass === 'payroll' && css`color: #3b82f6; background-color: rgba(59, 130, 246, 0.1);`}
  ${props => props.$colorClass === 'inventory' && css`color: #f59e0b; background-color: rgba(245, 158, 11, 0.1);`}
  ${props => props.$colorClass === 'banking' && css`color: #a855f7; background-color: rgba(168, 85, 247, 0.1);`}
  ${props => !props.$colorClass && css`color: #9ca3af; background-color: rgba(107, 114, 128, 0.1);`}
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CreatePanel = styled(GlassPanel) <{ $isVisible: boolean }>`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: all 0.3s;
  transform: ${props => props.$isVisible ? 'translateX(0)' : 'translateX(2.5rem)'};
  opacity: ${props => props.$isVisible ? 1 : 0.5};
  filter: ${props => props.$isVisible ? 'none' : 'blur(4px)'};
  pointer-events: ${props => props.$isVisible ? 'auto' : 'none'};
  position: ${props => props.$isVisible ? 'static' : 'absolute'};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`;

const PanelTitle = styled.h2`
  font-size: 1.25rem; /* xl */
  font-weight: 700;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.75rem; /* xs */
  font-weight: 600;
  color: #9ca3af; /* text-gray-400 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Select = styled.select`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem; /* rounded-xl */
  padding: 0.75rem 1rem;
  color: inherit;
  outline: none;
  
  &:focus {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5); /* ring-indigo-500/50 */
  }

  option {
    background-color: #1f2937; /* dark mode dropdown bg */
    color: #f3f4f6;
  }
`;

const Input = styled.input`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem; /* rounded-xl */
  padding: 0.75rem 1rem;
  color: inherit;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5); /* ring-indigo-500/50 */
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(to right, #4f46e5, #7c3aed); /* indigo-600 to violet-600 */
  padding: 1rem;
  border-radius: 0.75rem; /* rounded-xl */
  font-weight: 700;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 25px rgba(79, 70, 229, 0.4);
  }
`;

const InfoPanel = styled(GlassPanel)`
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const IconCircle = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

const InfoTitle = styled.h3`
  font-weight: 700;
  font-size: 1.125rem; /* lg */
`;

const InfoText = styled.p`
  font-size: 0.875rem; /* sm */
  color: #6b7280; /* text-gray-500 */
  line-height: 1.625;
`;

export default function AccountMappingsPage() {
    const [mappings, setMappings] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        module: 'revenue',
        category: '',
        account_id: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [mappingsRes, accountsRes] = await Promise.all([
                apiClient.getAccountMappings(),
                apiClient.getAccountingAccounts()
            ]);
            setMappings(mappingsRes.data);
            setAccounts(accountsRes.data);
        } catch (error) {
            toast.error("Failed to load mappings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.createAccountMapping({
                module: formData.module,
                category: formData.category,
                account_id: parseInt(formData.account_id)
            });
            toast.success("Mapping saved successfully");
            setIsAdding(false);
            setFormData({ module: 'revenue', category: '', account_id: '' });
            loadData();
        } catch (error) {
            toast.error("Failed to save mapping");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this mapping?")) return;
        try {
            await apiClient.deleteAccountMapping(id);
            toast.success("Mapping deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete mapping");
        }
    };

    return (
        <Layout>
            <PageContainer>
                <ContentContainer>
                {/* Header */}
                <Header>
                    <HeaderContent>
                        <Title>Dynamic COA Mappings</Title>
                        <Subtitle>Bridge business operations to your Chart of Accounts dynamically.</Subtitle>
                    </HeaderContent>
                    <NewMappingButton onClick={() => setIsAdding(!isAdding)}>
                        <Plus size={20} /> New Mapping
                    </NewMappingButton>
                </Header>

                <MainGrid>
                    {/* Main Table Section */}
                    <MainContent>
                        <SearchWrapper>
                            <StyledSearchIcon size={18} />
                            <SearchInput
                                type="text"
                                placeholder="Search mappings..."
                            />
                        </SearchWrapper>

                        <GlassPanel>
                            <Table>
                                <Thead>
                                    <tr>
                                        <Th>Source Module</Th>
                                        <Th>Category</Th>
                                        <Th>Mapped Account</Th>
                                        <Th>Actions</Th>
                                    </tr>
                                </Thead>
                                <Tbody>
                                    {loading ? (
                                        <tr>
                                            <Td colSpan={4} style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Loader2 className="animate-spin" size={24} color="#6366f1" />
                                                    <span style={{ color: '#9ca3af' }}>Syncing with ledger...</span>
                                                </div>
                                            </Td>
                                        </tr>
                                    ) : mappings.length === 0 ? (
                                        <tr>
                                            <Td colSpan={4} style={{ textAlign: 'center', padding: '5rem 1.5rem', color: '#6b7280' }}>
                                                No active mappings found. Use defaults or create mapping.
                                            </Td>
                                        </tr>
                                    ) : mappings.map((m) => (
                                        <Tr key={m.id}>
                                            <Td>
                                                <Badge $colorClass={m.module}>
                                                    {m.module}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <span style={{ fontWeight: 500, color: '#d1d5db' }}>{m.category}</span>
                                            </Td>
                                            <Td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: 'white' }}>Account {m.account_id}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>GL Code Reference</span>
                                                </div>
                                            </Td>
                                            <Td>
                                                <ActionButton onClick={() => handleDelete(m.id)}>
                                                    <Trash2 size={16} />
                                                </ActionButton>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </GlassPanel>
                    </MainContent>

                    {/* Create/Edit Panel */}
                    <SidePanel>
                        <CreatePanel $isVisible={isAdding}>
                            <PanelHeader>
                                <Settings2 className="text-indigo-400" size={20} color="#818cf8" />
                                <PanelTitle>Configure Mapping</PanelTitle>
                            </PanelHeader>

                            <Form onSubmit={handleSubmit}>
                                <FormGroup>
                                    <Label>Module</Label>
                                    <Select
                                        value={formData.module}
                                        onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                                    >
                                        <option value="revenue">Revenue Recognition</option>
                                        <option value="expense">Expense Categorization</option>
                                        <option value="payroll">Payroll Control</option>
                                        <option value="inventory">Inventory Asset/Shrinkage</option>
                                        <option value="banking">Banking & Reconcile</option>
                                    </Select>
                                </FormGroup>

                                <FormGroup>
                                    <Label>Category Key</Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. software_subs, damage..."
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label>Target GL Account</Label>
                                    <Select
                                        value={formData.account_id}
                                        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Account...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </Select>
                                </FormGroup>

                                <SubmitButton type="submit">
                                    <Save size={18} /> Commit Configuration
                                </SubmitButton>
                            </Form>
                        </CreatePanel>

                        {!isAdding && (
                            <InfoPanel>
                                <IconCircle>
                                    <LinkIcon color="#6b7280" size={24} />
                                </IconCircle>
                                <InfoTitle>Smart Linking</InfoTitle>
                                <InfoText>
                                    Link your operations to specific ledger accounts to automate the "Gluer" logic.
                                </InfoText>
                            </InfoPanel>
                        )}
                    </SidePanel>
                </MainGrid>
                </ContentContainer>
            </PageContainer>
        </Layout>
    );
}
