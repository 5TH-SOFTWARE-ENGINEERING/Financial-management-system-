
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
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
    max-width: 100%;
    margin: 20px auto;
    min-height: 100vh;
    background-color: #f0f2f5;
    animation: ${fadeIn} 0.5s ease-out;
`;

const HeaderSection = styled.div`
    max-width: 1200px;
    margin: 0 auto ${theme.spacing.lg};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.md};
    
    @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
`;

const TitleGroup = styled.div`
    h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1c1e21;
        margin: 0;
        display: flex;
        align-items: center;
        gap: ${theme.spacing.sm};
        letter-spacing: -0.01em;
        
        svg {
            color: ${theme.colors.primary};
            width: 28px;
            height: 28px;
        }
    }
    
    p {
        color: #65676b;
        font-size: 0.95rem;
        margin-top: 4px;
        line-height: 1.4;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
`;

const Card = styled.div`
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05);
    margin: 0 auto;
    max-width: 1200px; 
`;

const SearchContainer = styled.div`
    padding: ${theme.spacing.md};
    border-bottom: 1px solid #dfe3e8;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    background: #fff;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    
    .search-wrapper {
        position: relative;
        flex: 1;
        max-width: 400px;
        
        svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #65676b;
            width: 16px;
            height: 16px;
        }
        
        input {
            padding-left: 36px;
            height: 36px;
            font-size: 0.95rem;
            border-radius: 20px;
            border: 1px solid #ccd0d5; // Facebook gray border
            background: #f0f2f5;
            transition: all 0.2s ease;
            width: 100%;
            
            &:focus {
                background: white;
                border-color: ${theme.colors.primary};
                box-shadow: 0 0 0 2px rgba(0, 170, 0, 0.1);
                outline: none;
            }
        }
    }
    
    .stats {
        margin-left: auto;
        font-size: 0.9rem;
        color: #65676b;
        font-weight: 500;
    }
`;

const StyledTableContainer = styled.div`
    overflow: hidden;
    
    table {
        width: 100%;
        border-collapse: collapse;
    }
    
    th {
        background: #f0f2f5; // Header bg
        color: #65676b;
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 12px 16px;
        border-bottom: 1px solid #dfe3e8;
        border-top: 1px solid #dfe3e8;
        text-align: left;
    }
    
    td {
        padding: 16px;
        border-bottom: 1px solid #dfe3e8;
        vertical-align: middle;
        color: #1c1e21;
        font-size: 0.95rem;
    }
    
    tr:last-child td {
        border-bottom: none;
    }
    
    tr:hover td {
        background: #f2f2f2;
    }
`;

const IPBadge = styled.span<{ $status: 'allowed' | 'blocked' }>`
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 4px; // Square tag style
    font-weight: 600;
    font-size: 0.8rem;
    line-height: 1;
    
    ${props => props.$status === 'allowed' ? css`
        background: #e7f3ff;
        color: #1877f2; // FB Blue-ish
    ` : css`
        background: #fde8e8;
        color: #c00;
    `}
`;

const InfoBox = styled(Card)` // Reusing Card style
    padding: ${theme.spacing.lg};
    display: flex;
    gap: ${theme.spacing.md};
    margin-top: ${theme.spacing.lg};
    border-left: 4px solid ${theme.colors.primary};
    background: #fff;
    border-radius: 4px;
    
    .icon {
        color: ${theme.colors.primary};
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .content {
        h4 {
            margin: 0 0 4px 0;
            color: #1c1e21;
            font-weight: 600;
            font-size: 0.95rem;
        }
        p {
            margin: 0;
            color: #65676b;
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
    padding: 60px 0;
    color: #65676b;
    
    svg {
        width: 40px;
        height: 40px;
        margin-bottom: ${theme.spacing.md};
        color: #1877f2;
    }

    span {
        font-size: 1rem;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    text-align: center;
    
    svg {
        width: 60px;
        height: 60px;
        color: #bcc0c4;
        margin-bottom: ${theme.spacing.md};
    }
    
    h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1c1e21;
        margin: 0;
    }
    
    p {
        color: #65676b;
        max-width: 400px;
        margin: 8px 0 0;
        line-height: 1.5;
        font-size: 0.9rem;
    }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8); // Light overlay like Meta
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1); // Meta shadow
  padding: 0;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #dfe3e8;
  background: white;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1c1e21;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ModalCloseButton = styled.button`
    background: #e4e6eb; // Light gray circle
    border: none;
    cursor: pointer;
    color: #606770;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #d8dadf;
    }
`;

const ModalFooter = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #dfe3e8;
    background: white;
`;

const ModalBody = styled.div`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #f0f2f5; // Slight contrast for form body
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
                        size="default" // Standard size
                        style={{ background: PRIMARY_COLOR, color: 'white', fontWeight: 600, borderRadius: '6px' }}
                        onClick={() => {
                            setIpForm({ ip_address: '', description: '', status: 'allowed' });
                            setIsAddDialogOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Create Rule
                    </Button>
                    {/* Add Modal */}
                    <ModalOverlay $isOpen={isAddDialogOpen} onClick={() => setIsAddDialogOpen(false)}>
                        <ModalContent onClick={e => e.stopPropagation()}>
                            <ModalHeader>
                                <ModalTitle>
                                    <div style={{ background: `${PRIMARY_COLOR}15`, padding: '8px', borderRadius: '8px', display: 'flex' }}>
                                        <ShieldAlert size={20} color={PRIMARY_COLOR} />
                                    </div>
                                    Add New IP Address
                                </ModalTitle>
                                <ModalCloseButton onClick={() => setIsAddDialogOpen(false)}>
                                    <X size={20} />
                                </ModalCloseButton>
                            </ModalHeader>
                            <ModalBody>
                                <p style={{ color: TEXT_COLOR_MUTED, fontSize: '0.95rem', margin: 0 }}>
                                    Define a new access rule for a specific network address. This will immediately affect incoming traffic.
                                </p>
                                <div className="grid gap-2">
                                    <Label htmlFor="ip">IP Address</Label>
                                    <Input
                                        id="ip"
                                        placeholder="0.0.0.0"
                                        style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.05em' }}
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
                                            className="flex-1"
                                            style={ipForm.status === 'allowed' ? {
                                                background: PRIMARY_COLOR,
                                                fontSize: '1rem',
                                                padding: '24px'
                                            } : { padding: '24px' }}
                                            onClick={() => setIpForm({ ...ipForm, status: 'allowed' })}
                                        >
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Explicit Allow
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={ipForm.status === 'blocked' ? 'destructive' : 'outline'}
                                            className="flex-1"
                                            style={{ padding: '24px', fontSize: '1rem' }}
                                            onClick={() => setIpForm({ ...ipForm, status: 'blocked' })}
                                        >
                                            <XCircle className="mr-2 h-5 w-5" />
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
                                        className="resize-none"
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Discard</Button>
                                <Button
                                    style={{ background: PRIMARY_COLOR, color: 'white', fontWeight: 600, borderRadius: '6px' }}
                                    onClick={handleCreateIP}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </ModalOverlay>
                </ActionButtons>
            </HeaderSection>

            <Card>
                <SearchContainer>
                    <div className="search-wrapper">
                        <Search />
                        <Input
                            placeholder="Search by IP or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="stats">
                        {filteredRestrictions.length} active rules
                    </div>
                </SearchContainer>

                <StyledTableContainer>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <LoadingState>
                                            <Loader2 className="animate-spin" />
                                            <span>Loading data...</span>
                                        </LoadingState>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRestrictions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <EmptyState>
                                            <ShieldAlert />
                                            <h3>No restrictions found</h3>
                                            <p>
                                                {searchQuery ? "Try adjusting your search terms." : "Your IP access list is currently empty."}
                                            </p>
                                            {!searchQuery && (
                                                <Button
                                                    className="mt-4"
                                                    style={{ background: PRIMARY_COLOR, color: 'white', fontWeight: 600 }}
                                                    onClick={() => setIsAddDialogOpen(true)}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add First IP
                                                </Button>
                                            )}
                                        </EmptyState>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRestrictions.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.95rem', color: TEXT_COLOR_DARK }}>
                                                {item.ip_address}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div style={{ color: TEXT_COLOR_MUTED }}>
                                                {item.description || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <IPBadge $status={item.status}>
                                                {item.status}
                                            </IPBadge>
                                        </TableCell>
                                        <TableCell>
                                            <div style={{ fontSize: '0.9rem', color: TEXT_COLOR_MUTED }}>
                                                {new Date(item.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded">
                                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" style={{ width: '180px' }}>
                                                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toggleStatus(item)}>
                                                            {item.status === 'allowed' ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                            {item.status === 'allowed' ? 'Block IP' : 'Allow IP'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => openDeleteDialog(item)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
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
            </Card>

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

            {/* Edit Modal */}
            <ModalOverlay $isOpen={isEditDialogOpen} onClick={() => setIsEditDialogOpen(false)}>
                <ModalContent onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        <ModalTitle>Modify Rule</ModalTitle>
                        <ModalCloseButton onClick={() => setIsEditDialogOpen(false)}>
                            <X size={20} />
                        </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <p style={{ color: TEXT_COLOR_MUTED, fontSize: '0.95rem', margin: 0 }}>
                            Updating configuration for <span style={{ fontFamily: 'monospace', fontWeight: 700, color: TEXT_COLOR_DARK }}>{selectedIP?.ip_address}</span>
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
                                    className="flex-1"
                                    style={ipForm.status === 'allowed' ? {
                                        background: PRIMARY_COLOR,
                                        fontSize: '1rem',
                                        padding: '24px'
                                    } : { padding: '24px' }}
                                    onClick={() => setIpForm({ ...ipForm, status: 'allowed' })}
                                >
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                    Explicit Allow
                                </Button>
                                <Button
                                    type="button"
                                    variant={ipForm.status === 'blocked' ? 'destructive' : 'outline'}
                                    className="flex-1"
                                    style={{ padding: '24px', fontSize: '1rem' }}
                                    onClick={() => setIpForm({ ...ipForm, status: 'blocked' })}
                                >
                                    <XCircle className="mr-2 h-5 w-5" />
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
                                className="resize-none"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button
                            style={{ background: PRIMARY_COLOR, color: 'white', fontWeight: 600, borderRadius: '6px' }}
                            onClick={handleUpdateIP}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </ModalOverlay>

            {/* Delete Modal */}
            <ModalOverlay $isOpen={isDeleteDialogOpen} onClick={() => setIsDeleteDialogOpen(false)}>
                <ModalContent style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                    <ModalHeader className="bg-red-50 border-red-100">
                        <ModalTitle className="text-red-700">
                            <ShieldAlert className="mr-2" size={20} />
                            Remove Rule?
                        </ModalTitle>
                        <ModalCloseButton onClick={() => setIsDeleteDialogOpen(false)}>
                            <X size={20} />
                        </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <p style={{ color: theme.colors.textSecondary, fontSize: '1rem', lineHeight: 1.6 }}>
                            You are about to remove the access rule for <span className="font-mono font-bold text-foreground bg-slate-100 px-2 py-1 rounded">{selectedIP?.ip_address}</span>.
                            <br /><br />
                            This will revert traffic from this address to default system rules.
                        </p>
                    </ModalBody>
                    <ModalFooter className="bg-red-50 border-red-100">
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="hover:bg-red-100 hover:text-red-700">No, Keep it</Button>
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
