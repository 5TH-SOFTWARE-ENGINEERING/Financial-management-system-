
'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styled, { keyframes, css } from 'styled-components';
import {
    ShieldAlert,
    Search,
    Plus,
    Trash2,
    Edit,
    MoreHorizontal,
    CheckCircle2,
    X,
    Loader2,
    Network,
    RefreshCw,
    XCircle,
    Filter,
    Info
} from 'lucide-react';

import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { UserType } from '@/lib/rbac/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { theme } from '@/components/common/theme';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

// Styled Components
const PageWrapper = styled.div`
    padding: ${theme.spacing.xl};
    max-width: 1200px;
    margin: 0 auto;
    animation: ${fadeIn} 0.5s ease-out;
`;

const HeaderSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.md};
    margin-bottom: ${theme.spacing.xl};
    
    @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
`;

const TitleGroup = styled.div`
    h1 {
        font-size: 2.5rem;
        font-weight: 800;
        color: ${theme.colors.text};
        margin: 0;
        display: flex;
        align-items: center;
        gap: ${theme.spacing.sm};
        
        svg {
            color: ${theme.colors.primary};
        }
    }
    
    p {
        color: ${theme.colors.textSecondary};
        font-size: 1.1rem;
        margin-top: ${theme.spacing.xs};
    }
`;

const ActionButtons = styled.div`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
`;

const GlassCard = styled.div`
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 170, 0, 0.1);
    border-radius: ${theme.borderRadius.lg};
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
`;

const SearchContainer = styled(GlassCard)`
    padding: ${theme.spacing.md};
    margin-bottom: ${theme.spacing.lg};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    
    .search-wrapper {
        position: relative;
        flex: 1;
        
        svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: ${theme.colors.textSecondary};
            width: 18px;
            height: 18px;
        }
        
        input {
            padding-left: 40px;
            height: 48px;
            border-radius: ${theme.borderRadius.md};
            border: 1px solid transparent;
            background: rgba(0, 0, 0, 0.03);
            transition: all ${theme.transitions.default};
            
            &:focus {
                background: white;
                border-color: ${theme.colors.primary};
                box-shadow: 0 0 0 2px rgba(0, 170, 0, 0.1);
            }
        }
    }
    
    .stats {
        font-size: 0.9rem;
        color: ${theme.colors.textSecondary};
        font-weight: 500;
        white-space: nowrap;
    }
`;

const StyledTableContainer = styled(GlassCard)`
    overflow: hidden;
    
    table {
        width: 100%;
    }
    
    th {
        background: rgba(0, 170, 0, 0.02);
        color: ${theme.colors.textSecondary};
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        padding: ${theme.spacing.lg};
        border-bottom: 2px solid rgba(0, 170, 0, 0.05);
    }
    
    td {
        padding: ${theme.spacing.lg};
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        vertical-align: middle;
    }
    
    tr:last-child td {
        border-bottom: none;
    }
    
    tr:hover td {
        background: rgba(0, 170, 0, 0.01);
    }
`;

const IPBadge = styled.span<{ $status: 'allowed' | 'blocked' }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: capitalize;
    
    ${props => props.$status === 'allowed' ? css`
        background: rgba(0, 170, 0, 0.1);
        color: #008800;
        border: 1px solid rgba(0, 170, 0, 0.2);
    ` : css`
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
    `}
    
    svg {
        width: 14px;
        height: 14px;
    }
`;

const InfoBox = styled.div`
    background: linear-gradient(135deg, rgba(0, 170, 0, 0.05), rgba(0, 170, 0, 0.1));
    border: 1px solid rgba(0, 170, 0, 0.2);
    border-radius: ${theme.borderRadius.lg};
    padding: ${theme.spacing.lg};
    display: flex;
    gap: ${theme.spacing.md};
    margin-top: ${theme.spacing.xl};
    
    .icon {
        color: ${theme.colors.primary};
        flex-shrink: 0;
    }
    
    .content {
        h4 {
            margin: 0;
            color: ${theme.colors.primary};
            font-weight: 700;
            font-size: 1rem;
        }
        p {
            margin: 4px 0 0;
            color: ${theme.colors.textSecondary};
            font-size: 0.9rem;
            line-height: 1.5;
        }
    }
`;

const LoadingState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing.xxl};
    color: ${theme.colors.textSecondary};
    
    svg {
        width: 48px;
        height: 48px;
        margin-bottom: ${theme.spacing.md};
        color: ${theme.colors.primary};
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing.xxl};
    text-align: center;
    
    svg {
        width: 64px;
        height: 64px;
        color: rgba(0, 0, 0, 0.1);
        margin-bottom: ${theme.spacing.lg};
    }
    
    
    h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: ${theme.colors.text};
        margin: 0;
    }
    
    p {
        color: ${theme.colors.textSecondary};
        max-width: 400px;
        margin: ${theme.spacing.sm} 0 0;
    }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
`;

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ModalCloseButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: ${theme.colors.textSecondary};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    
    &:hover {
      background: ${theme.colors.backgroundSecondary};
      color: ${theme.colors.text};
    }
`;

const ModalFooter = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: ${theme.spacing.md};
    margin-top: ${theme.spacing.lg};
    padding-top: ${theme.spacing.md};
    border-top: 1px solid ${theme.colors.border};
`;

interface IPRestriction {
    id: number;
    ip_address: string;
    description: string | null;
    status: 'allowed' | 'blocked';
    created_at: string;
    updated_at?: string;
}

export default function IPManagementPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [ipRestrictions, setIpRestrictions] = useState<IPRestriction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDataRefreshing, setIsDataRefreshing] = useState(false);

    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedIP, setSelectedIP] = useState<IPRestriction | null>(null);

    // Form states
    const [ipForm, setIpForm] = useState({
        ip_address: '',
        description: '',
        status: 'allowed' as 'allowed' | 'blocked'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if not admin
    useEffect(() => {
        const checkAdmin = user?.userType === UserType.ADMIN || user?.role?.toLowerCase() === 'admin';
        if (!authLoading && user && !checkAdmin) {
            toast.error('Access denied. Admin privileges required.');
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const fetchRestrictions = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsDataRefreshing(true);

        try {
            const response = await apiClient.getAdminIPRestrictions();
            setIpRestrictions(response.data);
        } catch (error) {
            console.error('Failed to fetch IP restrictions:', error);
            toast.error('Failed to load IP restrictions');
        } finally {
            setIsLoading(false);
            setIsDataRefreshing(false);
        }
    };

    useEffect(() => {
        if (user && user.userType === UserType.ADMIN) {
            fetchRestrictions();
        }
    }, [user]);

    const filteredRestrictions = useMemo(() => {
        return ipRestrictions.filter(item =>
            item.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [ipRestrictions, searchQuery]);

    const handleCreateIP = async () => {
        if (!ipForm.ip_address) {
            toast.error('IP Address is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.createAdminIPRestriction(ipForm);
            toast.success('IP restriction created successfully');
            setIsAddDialogOpen(false);
            setIpForm({ ip_address: '', description: '', status: 'allowed' });
            fetchRestrictions(true);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create IP restriction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateIP = async () => {
        if (!selectedIP) return;

        setIsSubmitting(true);
        try {
            await apiClient.updateAdminIPRestriction(selectedIP.id, ipForm);
            toast.success('IP restriction updated successfully');
            setIsEditDialogOpen(false);
            setSelectedIP(null);
            fetchRestrictions(true);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to update IP restriction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteIP = async () => {
        if (!selectedIP) return;

        setIsSubmitting(true);
        try {
            await apiClient.deleteAdminIPRestriction(selectedIP.id);
            toast.success('IP restriction deleted successfully');
            setIsDeleteDialogOpen(false);
            setSelectedIP(null);
            fetchRestrictions(true);
        } catch (error: any) {
            toast.error('Failed to delete IP restriction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditDialog = (ip: IPRestriction) => {
        setSelectedIP(ip);
        setIpForm({
            ip_address: ip.ip_address,
            description: ip.description || '',
            status: ip.status
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (ip: IPRestriction) => {
        setSelectedIP(ip);
        setIsDeleteDialogOpen(true);
    };

    const toggleStatus = async (ip: IPRestriction) => {
        const newStatus = ip.status === 'allowed' ? 'blocked' : 'allowed';
        try {
            await apiClient.updateAdminIPRestriction(ip.id, { status: newStatus });
            toast.success(`IP ${ip.ip_address} is now ${newStatus}`);
            fetchRestrictions(true);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const isAdmin = user?.userType === UserType.ADMIN || user?.role?.toLowerCase() === 'admin';

    if (authLoading || (user && !isAdmin)) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <PageWrapper>
            <HeaderSection>
                <TitleGroup>
                    <h1>
                        <Network />
                        IP Management
                    </h1>
                    <p>Advanced security controls for system access via IP filtering</p>
                </TitleGroup>
                <ActionButtons>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchRestrictions(true)}
                        disabled={isDataRefreshing}
                        className={isDataRefreshing ? 'animate-spin' : ''}
                    >
                        <RefreshCw className="h-5 w-5" />
                    </Button>

                    <Button
                        size="lg"
                        style={{ background: theme.colors.primary, fontWeight: 700 }}
                        onClick={() => {
                            setIpForm({ ip_address: '', description: '', status: 'allowed' });
                            setIsAddDialogOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        New Restriction
                    </Button>
                    {/* Add Modal */}
                    <ModalOverlay $isOpen={isAddDialogOpen} onClick={() => setIsAddDialogOpen(false)}>
                        <ModalContent onClick={e => e.stopPropagation()}>
                            <ModalHeader>
                                <ModalTitle style={{ color: theme.colors.primary }}>Add New IP Address</ModalTitle>
                                <ModalCloseButton onClick={() => setIsAddDialogOpen(false)}>
                                    <X className="h-5 w-5" />
                                </ModalCloseButton>
                            </ModalHeader>
                            <div className="grid gap-6">
                                <p style={{ color: theme.colors.textSecondary, fontSize: '0.9rem', marginTop: '-10px' }}>
                                    Define a new access rule for a specific network address.
                                </p>
                                <div className="grid gap-2">
                                    <Label htmlFor="ip">IP Address</Label>
                                    <Input
                                        id="ip"
                                        placeholder="0.0.0.0"
                                        style={{ fontFamily: 'monospace' }}
                                        value={ipForm.ip_address}
                                        onChange={(e) => setIpForm({ ...ipForm, ip_address: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Access Policy</Label>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant={ipForm.status === 'allowed' ? 'default' : 'outline'}
                                            className="flex-1 font-bold"
                                            style={ipForm.status === 'allowed' ? { background: theme.colors.primary } : {}}
                                            onClick={() => setIpForm({ ...ipForm, status: 'allowed' })}
                                        >
                                            Explicit Allow
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={ipForm.status === 'blocked' ? 'destructive' : 'outline'}
                                            className="flex-1 font-bold"
                                            onClick={() => setIpForm({ ...ipForm, status: 'blocked' })}
                                        >
                                            Explicit Block
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Rule Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Why is this restriction needed?"
                                        value={ipForm.description}
                                        onChange={(e) => setIpForm({ ...ipForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <ModalFooter>
                                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Discard</Button>
                                <Button
                                    style={{ background: theme.colors.primary, fontWeight: 700 }}
                                    onClick={handleCreateIP}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Apply Rule
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </ModalOverlay>
                </ActionButtons>
            </HeaderSection>

            <SearchContainer>
                <div className="search-wrapper">
                    <Search />
                    <Input
                        placeholder="Search IP address or purpose..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="stats">
                    <Filter className="h-4 w-4 inline mr-2 text-primary" />
                    {filteredRestrictions.length} / {ipRestrictions.length} Entries
                </div>
            </SearchContainer>

            <StyledTableContainer>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>System Entry Point</TableHead>
                            <TableHead>Purpose / Description</TableHead>
                            <TableHead>Access Status</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <LoadingState>
                                        <Loader2 className="animate-spin" />
                                        <span>Syncing with gateway...</span>
                                    </LoadingState>
                                </TableCell>
                            </TableRow>
                        ) : filteredRestrictions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <EmptyState>
                                        <ShieldAlert />
                                        <h3>No restrictions active</h3>
                                        <p>
                                            {searchQuery ? "We couldn't find any restrictions matching your search." : "Your system is currently open to default access rules. Add a restriction to enhance security."}
                                        </p>
                                    </EmptyState>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRestrictions.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', color: theme.colors.primary }}>
                                            {item.ip_address}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ color: theme.colors.textSecondary, fontStyle: item.description ? 'normal' : 'italic' }}>
                                            {item.description || 'No purpose defined'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <IPBadge $status={item.status}>
                                            {item.status === 'allowed' ? <CheckCircle2 /> : <XCircle />}
                                            {item.status}
                                        </IPBadge>
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ fontSize: '0.85rem', color: theme.colors.textSecondary }}>
                                            {new Date(item.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <Switch
                                                checked={item.status === 'allowed'}
                                                onCheckedChange={() => toggleStatus(item)}
                                                style={{ scale: '0.8' }}
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" style={{ borderRadius: theme.borderRadius.md, border: `1px solid ${theme.colors.border}` }}>
                                                    <DropdownMenuLabel>Gateway Controls</DropdownMenuLabel>
                                                    <DropdownMenuSeparator style={{ background: theme.colors.border }} />
                                                    <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modify Entry
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => openDeleteDialog(item)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove Rule
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </StyledTableContainer>

            <InfoBox>
                <Info className="icon" />
                <div className="content">
                    <h4>Security Best Practice</h4>
                    <p>
                        IP restrictions operate at the network layer before application logic.
                        Always ensure your administrative IP is whitelisted to maintain access.
                        Changes are applied immediately to all incoming traffic.
                    </p>
                </div>
            </InfoBox>

            {/* Dialogs with enhanced styling */}



            {/* Edit Modal */}
            <ModalOverlay $isOpen={isEditDialogOpen} onClick={() => setIsEditDialogOpen(false)}>
                <ModalContent onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        <ModalTitle style={{ color: theme.colors.primary }}>Modify Rule</ModalTitle>
                        <ModalCloseButton onClick={() => setIsEditDialogOpen(false)}>
                            <X className="h-5 w-5" />
                        </ModalCloseButton>
                    </ModalHeader>
                    <div className="grid gap-6">
                        <p style={{ color: theme.colors.textSecondary, fontSize: '0.9rem', marginTop: '-10px' }}>
                            Updating configuration for <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedIP?.ip_address}</span>
                        </p>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-ip">IP Address</Label>
                            <Input
                                id="edit-ip"
                                style={{ fontFamily: 'monospace' }}
                                value={ipForm.ip_address}
                                onChange={(e) => setIpForm({ ...ipForm, ip_address: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Access Policy</Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant={ipForm.status === 'allowed' ? 'default' : 'outline'}
                                    className="flex-1 font-bold"
                                    style={ipForm.status === 'allowed' ? { background: theme.colors.primary } : {}}
                                    onClick={() => setIpForm({ ...ipForm, status: 'allowed' })}
                                >
                                    Explicit Allow
                                </Button>
                                <Button
                                    type="button"
                                    variant={ipForm.status === 'blocked' ? 'destructive' : 'outline'}
                                    className="flex-1 font-bold"
                                    onClick={() => setIpForm({ ...ipForm, status: 'blocked' })}
                                >
                                    Explicit Block
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Rule Description</Label>
                            <Textarea
                                id="edit-description"
                                value={ipForm.description}
                                onChange={(e) => setIpForm({ ...ipForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button
                            style={{ background: theme.colors.primary, fontWeight: 700 }}
                            onClick={handleUpdateIP}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Configuration
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </ModalOverlay>

            {/* Delete Modal */}
            <ModalOverlay $isOpen={isDeleteDialogOpen} onClick={() => setIsDeleteDialogOpen(false)}>
                <ModalContent style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        <ModalTitle className="text-destructive">Remove Rule?</ModalTitle>
                        <ModalCloseButton onClick={() => setIsDeleteDialogOpen(false)}>
                            <X className="h-5 w-5" />
                        </ModalCloseButton>
                    </ModalHeader>
                    <div className="grid gap-6">
                        <p style={{ color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
                            You are about to remove the access rule for <span className="font-mono font-bold text-foreground">{selectedIP?.ip_address}</span>.
                            This will revert traffic from this address to default system rules.
                        </p>
                    </div>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>No, Keep it</Button>
                        <Button variant="destructive" onClick={handleDeleteIP} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Remove Rule
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </ModalOverlay>
        </PageWrapper>
    );
}
