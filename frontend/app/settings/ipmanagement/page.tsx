"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldAlert,
    Search,
    Plus,
    Trash2,
    Edit,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
        if (!authLoading && user && user.userType !== UserType.ADMIN) {
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

    if (authLoading || (user && user.role !== 'admin')) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">IP Management</h1>
                    <p className="text-muted-foreground">
                        Control access to the system by whitelisting or blacklisting IP addresses.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchRestrictions(true)}
                        disabled={isDataRefreshing}
                        className={isDataRefreshing ? 'animate-spin' : ''}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => {
                        setIpForm({ ip_address: '', description: '', status: 'allowed' });
                        setIsAddDialogOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add IP Restriction
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by IP address or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {filteredRestrictions.length} of {ipRestrictions.length} records
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading IP restrictions...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredRestrictions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <ShieldAlert className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="font-medium">No IP restrictions found</p>
                                        <p className="text-sm text-muted-foreground">
                                            {searchQuery ? 'Try adjusting your search query' : 'Add your first IP restriction to secure the system'}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRestrictions.map((item) => (
                                <TableRow key={item.id} className="group transition-colors hover:bg-muted/50">
                                    <TableCell className="font-mono font-medium">
                                        {item.ip_address}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-muted-foreground truncate max-w-[300px] block">
                                            {item.description || 'No description'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={item.status === 'allowed' ? 'success' : 'destructive'}
                                            className="capitalize"
                                        >
                                            {item.status === 'allowed' ? (
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                            ) : (
                                                <XCircle className="mr-1 h-3 w-3" />
                                            )}
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Switch
                                                checked={item.status === 'allowed'}
                                                onCheckedChange={() => toggleStatus(item)}
                                                title={item.status === 'allowed' ? 'Block IP' : 'Allow IP'}
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteDialog(item)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete entry
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
            </div>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add IP Restriction</DialogTitle>
                        <DialogDescription>
                            Whitelist or blacklist a specific IP address to control system access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ip">IP Address</Label>
                            <Input
                                id="ip"
                                placeholder="e.g. 192.168.1.1"
                                value={ipForm.ip_address}
                                onChange={(e) => setIpForm({ ...ipForm, ip_address: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Default Status</Label>
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant={ipForm.status === 'allowed' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setIpForm({ ...ipForm, status: 'allowed' })}
                                >
                                    Allowed
                                </Button>
                                <Button
                                    type="button"
                                    variant={ipForm.status === 'blocked' ? 'destructive' : 'outline'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setIpForm({ ...ipForm, status: 'blocked' })}
                                >
                                    Blocked
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Reason for restriction or owner of the IP..."
                                value={ipForm.description}
                                onChange={(e) => setIpForm({ ...ipForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateIP} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Restriction
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit IP Restriction</DialogTitle>
                        <DialogDescription>
                            Update the status or description for {selectedIP?.ip_address}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-ip">IP Address</Label>
                            <Input
                                id="edit-ip"
                                value={ipForm.ip_address}
                                onChange={(e) => setIpForm({ ...ipForm, ip_address: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant={ipForm.status === 'allowed' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setIpForm({ ...ipForm, status: 'allowed' })}
                                >
                                    Allowed
                                </Button>
                                <Button
                                    type="button"
                                    variant={ipForm.status === 'blocked' ? 'destructive' : 'outline'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setIpForm({ ...ipForm, status: 'blocked' })}
                                >
                                    Blocked
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={ipForm.description}
                                onChange={(e) => setIpForm({ ...ipForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateIP} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove the restriction for <span className="font-mono font-bold text-foreground">{selectedIP?.ip_address}</span>?
                            This action cannot be undone and will allow/block access based on default system rules.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteIP} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Restriction
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold text-primary">Security Tip</p>
                    <p className="text-muted-foreground">
                        IP restrictions are applied at the network layer. Ensure you have at least one allowed IP (your current one)
                        to avoid being locked out of the administration panel.
                    </p>
                </div>
            </div>
        </div>
    );
}
