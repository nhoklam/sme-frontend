// src/modules/admin/pages/inventory/PurchaseOrdersPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Select, MenuItem, FormControl,
    Snackbar, Alert, Skeleton, Pagination,
} from '@mui/material';
import { Add, Refresh, Visibility, CheckCircle, Cancel } from '@mui/icons-material';
import { purchaseService } from '../../../../services/purchaseService';
import supplierService from '../../../../services/supplierService';
import warehouseService from '../../../../services/warehouseService';
import { PurchaseOrder, PurchaseStatus } from '../../../../types';

const STATUS_COLORS: Record<PurchaseStatus, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Nháp', color: '#888', bg: '#f5f5f5' },
    PENDING: { label: 'Chờ duyệt', color: '#e65100', bg: '#fff3e0' },
    COMPLETED: { label: 'Hoàn thành', color: '#2e7d32', bg: '#e8f5e9' },
    CANCELLED: { label: 'Đã hủy', color: '#d32f2f', bg: '#ffebee' },
};

const PurchaseOrdersPage: React.FC = () => {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['purchase-orders', page, statusFilter],
        queryFn: () => purchaseService.getAll({ page, size: 20, status: statusFilter || undefined }),
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers-simple'],
        queryFn: () => supplierService.getAllSimple(),  // ← fixed: was getAll()
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => warehouseService.getAll(),
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => purchaseService.approve(id),
        onSuccess: () => {
            setSnack({ message: 'Duyệt phiếu nhập kho thành công!', severity: 'success' });
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
        },
        onError: (e: any) => setSnack({ message: e.response?.data?.message || 'Duyệt thất bại', severity: 'error' }),
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => purchaseService.cancel(id, reason),
        onSuccess: () => {
            setSnack({ message: 'Đã hủy phiếu nhập kho', severity: 'success' });
            setCancelOpen(false);
            setCancelReason('');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
        },
        onError: (e: any) => setSnack({ message: e.response?.data?.message || 'Hủy thất bại', severity: 'error' }),
    });

    const supplierMap = React.useMemo(() => {
        const map = new Map<string, string>();
        suppliers.forEach(s => map.set(s.id, s.name));  // ← now works: suppliers is Supplier[]
        return map;
    }, [suppliers]);

    const warehouseMap = React.useMemo(() => {
        const map = new Map<string, string>();
        warehouses.forEach(w => map.set(w.id, w.name));
        return map;
    }, [warehouses]);

    const orders = data?.content || [];
    const totalPages = data?.totalPages || 0;

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight={800}>Quản lý Phiếu nhập kho</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
                    Tạo phiếu nhập
                </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty>
                        <MenuItem value="">Tất cả trạng thái</MenuItem>
                        <MenuItem value="DRAFT">Nháp</MenuItem>
                        <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                        <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
                        <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                    </Select>
                </FormControl>
                <Button startIcon={<Refresh />} onClick={() => qc.invalidateQueries({ queryKey: ['purchase-orders'] })}>
                    Làm mới
                </Button>
            </Box>

            {/* Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Mã phiếu</TableCell>
                                <TableCell>Nhà cung cấp</TableCell>
                                <TableCell>Kho nhập</TableCell>
                                <TableCell align="right">Tổng tiền</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell align="center">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7].map(j => (
                                            <TableCell key={j}><Skeleton height={20} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        Chưa có phiếu nhập kho nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map(order => {
                                    const statusInfo = STATUS_COLORS[order.status];
                                    return (
                                        <TableRow key={order.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                                                    {order.code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{supplierMap.get(order.supplierId) || order.supplierId}</TableCell>
                                            <TableCell>{warehouseMap.get(order.warehouseId) || order.warehouseId}</TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight={700}>
                                                    {order.totalAmount?.toLocaleString('vi-VN')}đ
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={statusInfo.label} size="small"
                                                    sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <IconButton size="small" onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}>
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                    {order.status === 'PENDING' && (
                                                        <IconButton size="small" onClick={() => approveMutation.mutate(order.id)}>
                                                            <CheckCircle fontSize="small" sx={{ color: '#2e7d32' }} />
                                                        </IconButton>
                                                    )}
                                                    {(order.status === 'DRAFT' || order.status === 'PENDING') && (
                                                        <IconButton size="small" onClick={() => { setSelectedOrder(order); setCancelOpen(true); }}>
                                                            <Cancel fontSize="small" sx={{ color: '#d32f2f' }} />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} />
                    </Box>
                )}
            </Paper>

            {/* Cancel Dialog */}
            <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Hủy phiếu nhập kho</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth multiline rows={3}
                        label="Lý do hủy"
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelOpen(false)}>Đóng</Button>
                    <Button onClick={() => cancelMutation.mutate({ id: selectedOrder!.id, reason: cancelReason })} variant="contained" color="error">
                        Xác nhận hủy
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Chi tiết phiếu nhập</DialogTitle>
                <DialogContent>
                    <Typography>Đang phát triển...</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Tạo phiếu nhập mới</DialogTitle>
                <DialogContent>
                    <Typography>Đang phát triển...</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
                {snack && <Alert severity={snack.severity}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
};

export default PurchaseOrdersPage;