import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Chip, Grid, IconButton,
    Divider, Alert, Skeleton, Stepper, Step, StepLabel,
    Table, TableBody, TableCell, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Snackbar, CircularProgress, FormControl,
    InputLabel, Select, MenuItem,
} from '@mui/material';
import {
    ArrowBack, Edit, LocalShipping, Person, LocationOn,
    Payment, Cancel, Inventory2Outlined,
    AccessTime, Refresh, Close,
} from '@mui/icons-material';
import orderService from '../../../../services/orderService';
import warehouseService from '../../../../services/warehouseService';
import { OrderResponse, OrderStatus, PaymentStatus, Warehouse } from '../../../../types';

// ── Helpers ─────────────────────────────────────────────────
const fmt = (n?: number) => {
    if (n == null) return '—';
    return n.toLocaleString('vi-VN') + ' đ';
};

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string; step: number }> = {
    PENDING: { label: 'Chờ xử lý', color: '#e65100', bg: '#fff3e0', step: 0 },
    PACKING: { label: 'Đóng gói', color: '#1976d2', bg: '#e3f2fd', step: 1 },
    SHIPPING: { label: 'Đang giao', color: '#6a1b9a', bg: '#f3e5f5', step: 2 },
    DELIVERED: { label: 'Hoàn thành', color: '#2e7d32', bg: '#e8f5e9', step: 3 },
    CANCELLED: { label: 'Đã hủy', color: '#888', bg: '#f5f5f5', step: -1 },
    RETURNED: { label: 'Hoàn trả', color: '#d32f2f', bg: '#ffebee', step: -1 },
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; color: string }> = {
    UNPAID: { label: 'Chưa thu', color: '#d32f2f' },
    PAID: { label: 'Đã thu', color: '#2e7d32' },
    REFUNDED: { label: 'Đã hoàn', color: '#888' },
};

const PROVINCES: Record<string, string> = {
    HCM: 'TP. Hồ Chí Minh', HN: 'Hà Nội', DN: 'Đà Nẵng',
    CT: 'Cần Thơ', HP: 'Hải Phòng', BD: 'Bình Dương',
};

// ── Info Section ─────────────────────────────────────────────
const InfoSection = ({
    icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box sx={{ color: '#1976d2' }}>{icon}</Box>
            <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>
                {title}
            </Typography>
        </Box>
        {children}
    </Paper>
);

const FieldRow = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={600} color={color || '#333'}>{value}</Typography>
    </Box>
);

// ── Assign Warehouse Dialog ───────────────────────────────────
const AssignWarehouseDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onConfirm: (whId: string) => void;
    loading: boolean;
}> = ({ open, onClose, onConfirm, loading }) => {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selected, setSelected] = useState('');
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (open) {
            setFetching(true);
            warehouseService.getAll().then(setWarehouses).finally(() => setFetching(false));
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={800}>Chỉ định kho xử lý</Typography>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ py: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Chọn chi nhánh/kho sẽ chịu trách nhiệm đóng gói và giao đơn hàng này.
                </Typography>
                {fetching ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={24} /></Box>
                ) : (
                    <FormControl fullWidth size="small">
                        <InputLabel>Chọn kho</InputLabel>
                        <Select
                            value={selected}
                            onChange={(e) => setSelected(e.target.value as string)}
                            label="Chọn kho"
                        >
                            {warehouses.map(w => (
                                <MenuItem key={w.id} value={w.id}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <Typography variant="body2" fontWeight={600}>{w.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{w.provinceCode}</Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderRadius: 1.5 }}>Hủy</Button>
                <Button
                    variant="contained"
                    disabled={loading || !selected || fetching}
                    onClick={() => onConfirm(selected)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#1976d2' }}
                >
                    {loading ? 'Đang gán...' : 'Gán đơn hàng'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Update Status Dialog ──────────────────────────────────────
const UpdateStatusDialog: React.FC<{
    open: boolean;
    currentStatus: OrderStatus;
    onClose: () => void;
    onConfirm: (newStatus: string, note: string, trackingCode: string, shippingProvider: string) => void;
    loading: boolean;
}> = ({ open, currentStatus, onClose, onConfirm, loading }) => {
    const [note, setNote] = useState('');
    const [trackingCode, setTrackingCode] = useState('');
    const [shippingProvider, setShippingProvider] = useState('');

    const nextActions: { label: string; action: string; color: string }[] = [];
    if (currentStatus === 'PENDING') nextActions.push({ label: 'Xác nhận đóng gói', action: 'PACKING', color: '#1976d2' });
    if (currentStatus === 'PACKING') nextActions.push({ label: 'Xác nhận giao hàng', action: 'SHIPPING', color: '#6a1b9a' });
    if (currentStatus === 'SHIPPING') nextActions.push({ label: 'Xác nhận đã giao', action: 'DELIVERED', color: '#2e7d32' });
    const canCancel = !['CANCELLED', 'DELIVERED', 'RETURNED'].includes(currentStatus);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={800} fontSize={16}>Cập nhật trạng thái</Typography>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />
            <DialogContent sx={{ px: 3, pt: 2 }}>
                {nextActions.length > 0 && (
                    <>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                            Ghi chú
                        </Typography>
                        <TextField fullWidth size="small" multiline rows={2}
                            placeholder="Ghi chú khi chuyển trạng thái..."
                            value={note} onChange={e => setNote(e.target.value)} sx={{ mb: 2 }} />

                        {currentStatus === 'PACKING' && (
                            <>
                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                    Mã vận đơn
                                </Typography>
                                <TextField fullWidth size="small" placeholder="VD: GHN12345678"
                                    value={trackingCode} onChange={e => setTrackingCode(e.target.value)} sx={{ mb: 2 }} />

                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                    Đơn vị vận chuyển
                                </Typography>
                                <TextField fullWidth size="small" placeholder="GHN / GHTK / Viettel Post..."
                                    value={shippingProvider} onChange={e => setShippingProvider(e.target.value)} />
                            </>
                        )}
                    </>
                )}
                {nextActions.length === 0 && !canCancel && (
                    <Alert severity="info">Đơn hàng đã ở trạng thái cuối cùng, không thể cập nhật thêm.</Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1, flexWrap: 'wrap' }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>
                    Đóng
                </Button>
                {nextActions.map(a => (
                    <Button key={a.action} variant="contained" disabled={loading}
                        onClick={() => onConfirm(a.action, note, trackingCode, shippingProvider)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: a.color, '&:hover': { filter: 'brightness(0.9)' } }}>
                        {loading ? 'Đang xử lý...' : a.label}
                    </Button>
                ))}
                {canCancel && (
                    <Button variant="outlined" disabled={loading}
                        onClick={() => onConfirm('CANCELLED', note, '', '')}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}>
                        Hủy đơn
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const OrderDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const loadOrder = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const data = await orderService.getById(id);
            setOrder(data);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadOrder(); }, [loadOrder]);

    const handleStatusUpdate = async (newStatus: string, note: string, trackingCode: string, shippingProvider: string) => {
        if (!order) return;
        setUpdating(true);
        try {
            const updated = await orderService.updateStatus(order.id, newStatus, note || undefined);
            setOrder(updated);
            setUpdateDialogOpen(false);
            setSnack({ message: `Đã cập nhật trạng thái → ${STATUS_MAP[newStatus as OrderStatus]?.label || newStatus}`, severity: 'success' });
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Cập nhật thất bại', severity: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignWarehouse = async (warehouseId: string) => {
        if (!order) return;
        setAssigning(true);
        try {
            const updated = await orderService.assignWarehouse(order.id, warehouseId);
            setOrder(updated);
            setAssignDialogOpen(false);
            setSnack({ message: 'Đã gán kho xử lý thành công', severity: 'success' });
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Gán kho thất bại', severity: 'error' });
        } finally {
            setAssigning(false);
        }
    };

    // ── Loading skeleton ─────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
                <Skeleton width={300} height={40} sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
                    </Grid>
                    {[1, 2, 3, 4].map(i => (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                    <Grid size={{ xs: 12 }}>
                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    // ── Error ─────────────────────────────────────────────────
    if (error || !order) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography fontSize={48} mb={1}>😕</Typography>
                <Typography variant="h6" fontWeight={700} color="#333">{error || 'Không tìm thấy đơn hàng'}</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>ID: {id}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={loadOrder}
                        sx={{ textTransform: 'none' }}>Thử lại</Button>
                    <Button variant="contained" onClick={() => navigate('/admin/orders')}
                        sx={{ bgcolor: '#1976d2', textTransform: 'none' }}>Quay lại danh sách</Button>
                </Box>
            </Box>
        );
    }

    const status = STATUS_MAP[order.status as OrderStatus] || { label: order.status, color: '#666', bg: '#f3f4f6', step: 0 };
    const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus as PaymentStatus] || { label: order.paymentStatus, color: '#888' };
    const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';
    const STEPS = ['Chờ xử lý', 'Đóng gói', 'Đang giao', 'Hoàn thành'];

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* ── HEADER ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton size="small" onClick={() => navigate('/admin/orders')}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, bgcolor: '#fff' }}>
                        <ArrowBack sx={{ fontSize: 17 }} />
                    </IconButton>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.3 }}>
                            <Typography variant="caption" color="#aaa"
                                sx={{ cursor: 'pointer', '&:hover': { color: '#1976d2' } }}
                                onClick={() => navigate('/admin/orders')}>
                                Đơn hàng
                            </Typography>
                            <Typography variant="caption" color="#ddd">/</Typography>
                            <Typography variant="caption" color="#666" fontWeight={600}>Chi tiết</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" fontWeight={800} color="#1a1a2e">
                                {order.code}
                            </Typography>
                            <Chip label={status.label} size="small"
                                sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: status.bg, color: status.color }} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />}
                        onClick={loadOrder}
                        sx={{ textTransform: 'none', fontSize: 13, borderColor: '#e0e0e0', color: '#555' }}>
                        Làm mới
                    </Button>
                    {!isCancelled && (
                        <Button size="small" variant="contained" startIcon={<Edit sx={{ fontSize: 15 }} />}
                            onClick={() => setUpdateDialogOpen(true)}
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}>
                            Cập nhật trạng thái
                        </Button>
                    )}
                </Box>
            </Box>

            {/* ── STATUS STEPPER ── */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2, bgcolor: '#fff' }}>
                {!isCancelled ? (
                    <Stepper activeStep={status.step} alternativeLabel>
                        {STEPS.map(s => (
                            <Step key={s}>
                                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 12 } }}>{s}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Cancel sx={{ color: '#d32f2f', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={700} color="#d32f2f">
                            Đơn hàng {order.status === 'CANCELLED' ? 'đã bị hủy' : 'đã hoàn trả'}
                            {order.cancelledReason ? ` — ${order.cancelledReason}` : ''}
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* ── METADATA ── */}
            <Paper elevation={0} sx={{ px: 2.5, py: 1.5, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Ngày tạo</Typography>
                        <Typography variant="body2" fontWeight={600} fontSize={13}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                        </Typography>
                    </Box>
                    {order.updatedAt && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">Cập nhật lần cuối</Typography>
                            <Typography variant="body2" fontWeight={600} fontSize={13}>
                                {new Date(order.updatedAt).toLocaleString('vi-VN')}
                            </Typography>
                        </Box>
                    )}
                    <Box>
                        <Typography variant="caption" color="text.secondary">Thanh toán</Typography>
                        <Typography variant="body2" fontWeight={700} fontSize={13} color={payStatus.color}>
                            {payStatus.label} · {order.paymentMethod}
                        </Typography>
                    </Box>
                    {order.codReconciled && (
                        <Chip label="COD Đã đối soát" size="small"
                            sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                    )}
                    <Box>
                        <Typography variant="caption" color="text.secondary">Loại đơn</Typography>
                        <Typography variant="body2" fontWeight={600} fontSize={13}>
                            {order.type === 'BOPIS' ? '🏪 Tại quầy (BOPIS)' : '🚚 Giao hàng'}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Khách hàng */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoSection icon={<Person sx={{ fontSize: 16 }} />} title="KHÁCH HÀNG">
                        <Typography variant="body2" fontWeight={700}>{order.customerName || order.shippingName || 'Khách lẻ'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{order.customerPhone || '—'}</Typography>
                    </InfoSection>
                </Grid>

                {/* Địa chỉ giao hàng */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoSection icon={<LocationOn sx={{ fontSize: 16 }} />} title="ĐỊA CHỈ GIAO HÀNG">
                        <Typography variant="body2" fontWeight={600}>{order.shippingName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{order.shippingPhone}</Typography>
                        <Typography variant="body2" fontSize={12} color="#555">{order.shippingAddress}</Typography>
                        <Typography variant="caption" color="#888">
                            {PROVINCES[order.provinceCode] || order.provinceCode}
                        </Typography>
                    </InfoSection>
                </Grid>

                {/* Thanh toán */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoSection icon={<Payment sx={{ fontSize: 16 }} />} title="THANH TOÁN">
                        <FieldRow label="Tạm tính" value={fmt(order.totalAmount)} />
                        <FieldRow label="Phí ship" value={fmt(order.shippingFee)} />
                        {(order.discountAmount || 0) > 0 && (
                            <FieldRow label="Giảm giá" value={`-${fmt(order.discountAmount)}`} color="#2e7d32" />
                        )}
                        <Divider sx={{ my: 0.75 }} />
                        <FieldRow label="Tổng cộng" value={fmt(order.finalAmount)} color="#d32f2f" />
                    </InfoSection>
                </Grid>

                {/* Vận chuyển */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InfoSection icon={<LocalShipping sx={{ fontSize: 16 }} />} title="VẬN CHUYỂN">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Kho đóng gói</Typography>
                            {!isCancelled && order.status === 'PENDING' && (
                                <IconButton size="small" onClick={() => setAssignDialogOpen(true)}
                                    sx={{ p: 0.25, color: '#1976d2', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}>
                                    <Edit sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                        </Box>
                        <Typography variant="body2" fontWeight={700} color={order.assignedWarehouseId ? '#333' : '#d32f2f'}>
                            {order.assignedWarehouseName || 'Chưa gán'}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            <FieldRow label="Mã vận đơn" value={order.trackingCode || '—'} />
                            <FieldRow label="Đơn vị VC" value={order.shippingProvider || '—'} />
                            {order.packedAt && (
                                <FieldRow label="Đóng gói lúc"
                                    value={new Date(order.packedAt).toLocaleDateString('vi-VN')} />
                            )}
                        </Box>
                    </InfoSection>
                </Grid>
            </Grid>

            {/* ── ITEMS TABLE ── */}
            {order.items && order.items.length > 0 && (
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', mb: 2, overflow: 'hidden' }}>
                    <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Inventory2Outlined sx={{ fontSize: 16, color: '#888' }} />
                        <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>
                            SẢN PHẨM ({order.items.length} mặt hàng)
                        </Typography>
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Sản phẩm', 'ISBN / Mã vạch', 'Số lượng', 'Đơn giá', 'Thành tiền'].map(c => (
                                    <TableCell key={c} sx={{ fontSize: 11, fontWeight: 700, color: '#888', py: 1.25 }}>{c}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {order.items.map((item, idx) => (
                                <TableRow key={idx} sx={{ '&:last-child td': { border: 0 }, bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2" fontWeight={600} fontSize={13}>
                                            {item.productName || item.productId}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="caption" fontFamily="monospace" color="#888">
                                            {item.isbnBarcode || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2" fontWeight={700}>{item.quantity}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2" fontSize={12}>{fmt(item.unitPrice)}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2" fontWeight={700} color="#1976d2">{fmt(item.subtotal)}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f9f9f9', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">Tổng giá trị đơn hàng</Typography>
                            <Typography variant="h6" fontWeight={800} color="#d32f2f">{fmt(order.finalAmount)}</Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* ── STATUS HISTORY ── */}
            {order.statusHistory && order.statusHistory.length > 0 && (
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 16, color: '#888' }} />
                        <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>
                            LỊCH SỬ TRẠNG THÁI
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                        {order.statusHistory.map((h, idx) => {
                            const ns = STATUS_MAP[h.newStatus as OrderStatus];
                            return (
                                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'flex-start' }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ns?.color || '#bbb', mt: 0.75, flexShrink: 0 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} fontSize={13} color={ns?.color || '#333'}>
                                                    {ns?.label || h.newStatus}
                                                </Typography>
                                                {h.changedBy && (
                                                    <Typography variant="caption" color="#888">bởi {h.changedBy}</Typography>
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {h.createdAt ? new Date(h.createdAt).toLocaleString('vi-VN') : ''}
                                            </Typography>
                                        </Box>
                                        {h.note && (
                                            <Typography variant="caption" color="#555" display="block" mt={0.25}>
                                                💬 {h.note}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* ── Assign Warehouse Dialog ── */}
            <AssignWarehouseDialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                onConfirm={handleAssignWarehouse}
                loading={assigning}
            />

            {/* ── Update Status Dialog ── */}
            <UpdateStatusDialog
                open={updateDialogOpen}
                currentStatus={order.status as OrderStatus}
                onClose={() => setUpdateDialogOpen(false)}
                onConfirm={handleStatusUpdate}
                loading={updating}
            />

            {/* ── Snackbar ── */}
            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? (
                    <Alert onClose={() => setSnack(null)} severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {snack.message}
                    </Alert>
                ) : <div />}
            </Snackbar>
        </Box>
    );
};

export default OrderDetailPage;