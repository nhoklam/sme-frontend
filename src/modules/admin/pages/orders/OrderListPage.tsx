// src/modules/admin/pages/orders/OrderListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Select, MenuItem,
    FormControl, Chip, IconButton, Menu,
    Snackbar, Alert, Tooltip, Pagination, Skeleton,
    Collapse, SelectChangeEvent, Dialog, DialogTitle,
    DialogContent, DialogActions, Grid, Divider,
    Avatar, Tab, Tabs, Stepper, Step, StepLabel,
} from '@mui/material';
import {
    Search, Add, MoreVert, FileDownloadOutlined,
    Refresh, KeyboardArrowDown, KeyboardArrowUp,
    Close, ArrowBack, LocalShipping, Person,
    LocationOn, Payment, CheckCircle, Cancel,
    Inventory2Outlined, AccessTime,
} from '@mui/icons-material';
import orderService from '../../../../services/orderService';
import customerService from '../../../../services/customerService';
import warehouseService from '../../../../services/warehouseService';
import {
    OrderResponse, OrderStatus, PaymentStatus,
    CreateOrderRequest, Customer, Warehouse, ProductResponse,
} from '../../../../types';
import productService from '../../../../services/productService';

// ── Helpers ────────────────────────────────────────────────
const fmt = (n?: number) => {
    if (n == null || n === 0) return '0 đ';
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

const TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DELIVERY: { label: 'Giao hàng', color: '#0277bd', bg: '#e1f5fe' },
    BOPIS: { label: 'Tại quầy', color: '#558b2f', bg: '#f1f8e9' },
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'PACKING', label: 'Đóng gói' },
    { value: 'SHIPPING', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'RETURNED', label: 'Hoàn trả' },
];

// Danh sách tỉnh thành Việt Nam (rút gọn)
const PROVINCES = [
    { code: 'HCM', name: 'TP. Hồ Chí Minh' },
    { code: 'HN', name: 'Hà Nội' },
    { code: 'DN', name: 'Đà Nẵng' },
    { code: 'CT', name: 'Cần Thơ' },
    { code: 'HP', name: 'Hải Phòng' },
    { code: 'BD', name: 'Bình Dương' },
    { code: 'BDT', name: 'Bà Rịa - Vũng Tàu' },
    { code: 'LA', name: 'Long An' },
    { code: 'DL', name: 'Đắk Lắk' },
    { code: 'NT', name: 'Nha Trang' },
    { code: 'BN', name: 'Bắc Ninh' },
    { code: 'HB', name: 'Hải Dương' },
    { code: 'TH', name: 'Thanh Hóa' },
    { code: 'NA', name: 'Nghệ An' },
    { code: 'QNI', name: 'Quảng Ngãi' },
];

const PAYMENT_OPTIONS = [
    { value: '', label: 'Tất cả thanh toán' },
    { value: 'UNPAID', label: 'Chưa thu' },
    { value: 'PAID', label: 'Đã thu' },
    { value: 'REFUNDED', label: 'Đã hoàn' },
];

const PAYMENT_METHOD_OPTIONS = [
    { value: '', label: 'Tất cả hình thức' },
    { value: 'COD', label: 'COD' },
    { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
    { value: 'CASH', label: 'Tiền mặt' },
    { value: 'MOMO', label: 'MoMo' },
    { value: 'VNPAY', label: 'VNPay' },
];

// ── Row action menu ────────────────────────────────────────
const RowMenu: React.FC<{
    order: OrderResponse;
    onAction: (action: string, order: OrderResponse) => void;
}> = ({ order, onAction }) => {
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);
    const status = order.status as OrderStatus;
    return (
        <>
            <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
                <MoreVert sx={{ fontSize: 17 }} />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
                PaperProps={{ sx: { minWidth: 160, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', py: 0.5 } }}>
                {[
                    { label: 'Xem chi tiết', action: 'view' },
                    { label: 'Xác nhận đóng gói', action: 'packing', show: status === 'PENDING' },
                    { label: 'Xác nhận giao hàng', action: 'shipping', show: status === 'PACKING' },
                    { label: 'Đã giao', action: 'delivered', show: status === 'SHIPPING' },
                    {
                        label: 'Hủy đơn', action: 'cancel', color: '#d32f2f',
                        show: status !== 'CANCELLED' && status !== 'DELIVERED' && status !== 'RETURNED'
                    },
                ].filter(i => i.show !== false).map(item => (
                    <MenuItem key={item.action}
                        onClick={() => { onAction(item.action, order); setAnchor(null); }}
                        sx={{ fontSize: 13, color: item.color || '#333', py: 0.75 }}>
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

// ── ORDER DETAIL DIALOG ──────────────────────────────────
const OrderDetailDialog: React.FC<{
    order: OrderResponse | null;
    open: boolean;
    onClose: () => void;
    onStatusChange: (order: OrderResponse, newStatus: string) => void;
}> = ({ order, open, onClose, onStatusChange }) => {
    if (!order) return null;
    const status = STATUS_MAP[order.status as OrderStatus] || { label: order.status, color: '#666', bg: '#f3f4f6', step: 0 };
    const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus as PaymentStatus] || { label: order.paymentStatus, color: '#888' };
    const STEPS = ['Chờ xử lý', 'Đóng gói', 'Đang giao', 'Hoàn thành'];
    const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';

    const nextActions: { label: string; action: string; color: string }[] = [];
    if (order.status === 'PENDING') nextActions.push({ label: 'Xác nhận đóng gói', action: 'PACKING', color: '#1976d2' });
    if (order.status === 'PACKING') nextActions.push({ label: 'Xác nhận giao hàng', action: 'SHIPPING', color: '#6a1b9a' });
    if (order.status === 'SHIPPING') nextActions.push({ label: 'Xác nhận đã giao', action: 'DELIVERED', color: '#2e7d32' });
    if (!isCancelled && order.status !== 'DELIVERED') {
        nextActions.push({ label: 'Hủy đơn', action: 'CANCELLED', color: '#d32f2f' });
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' } }}>
            <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography fontWeight={800} fontSize={17} color="#1a1a2e">
                            Chi tiết đơn hàng
                        </Typography>
                        <Typography fontFamily="monospace" fontWeight={700} color="#1976d2" fontSize={15}>
                            {order.code}
                        </Typography>
                        <Chip label={status.label} size="small"
                            sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: status.bg, color: status.color }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Tạo lúc: {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1.5 }} />

            <DialogContent sx={{ px: 3, py: 2 }}>
                {/* Timeline trạng thái */}
                {!isCancelled && (
                    <Box sx={{ mb: 3 }}>
                        <Stepper activeStep={status.step} alternativeLabel>
                            {STEPS.map(s => (
                                <Step key={s}>
                                    <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 12 } }}>{s}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                )}
                {isCancelled && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid #ffcdd2', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Cancel sx={{ color: '#d32f2f', fontSize: 18 }} />
                        <Typography variant="body2" fontWeight={700} color="#d32f2f">
                            Đơn hàng {order.status === 'CANCELLED' ? 'đã bị hủy' : 'đã được hoàn trả'}
                            {order.cancelledReason ? ` — ${order.cancelledReason}` : ''}
                        </Typography>
                    </Box>
                )}

                <Grid container spacing={2}>
                    {/* Thông tin khách hàng */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Person sx={{ fontSize: 16, color: '#1976d2' }} />
                                <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>KHÁCH HÀNG</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{order.customerName || order.shippingName || 'Khách lẻ'}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">{order.customerPhone || order.shippingPhone || '—'}</Typography>
                        </Paper>
                    </Grid>

                    {/* Địa chỉ giao hàng */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <LocationOn sx={{ fontSize: 16, color: '#d32f2f' }} />
                                <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>ĐỊA CHỈ GIAO HÀNG</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={600}>{order.shippingName}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">{order.shippingPhone}</Typography>
                            <Typography variant="body2" color="#555" fontSize={12} mt={0.5}>{order.shippingAddress}</Typography>
                        </Paper>
                    </Grid>

                    {/* Thông tin đơn hàng */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Payment sx={{ fontSize: 16, color: '#2e7d32' }} />
                                <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>THANH TOÁN</Typography>
                            </Box>
                            {[
                                { label: 'Hình thức', value: order.paymentMethod },
                                { label: 'Trạng thái', value: payStatus.label, color: payStatus.color },
                                { label: 'Tạm tính', value: fmt(order.totalAmount) },
                                { label: 'Phí ship', value: fmt(order.shippingFee) },
                                { label: 'Giảm giá', value: fmt(order.discountAmount) },
                            ].map(row => (
                                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                                    <Typography variant="caption" fontWeight={600} color={row.color || '#333'}>{row.value}</Typography>
                                </Box>
                            ))}
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" fontWeight={700}>Tổng cộng</Typography>
                                <Typography variant="body2" fontWeight={800} color="#d32f2f">{fmt(order.finalAmount)}</Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Kho & vận chuyển */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <LocalShipping sx={{ fontSize: 16, color: '#6a1b9a' }} />
                                <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>VẬN CHUYỂN</Typography>
                            </Box>
                            {[
                                { label: 'Kho đóng gói', value: order.assignedWarehouseName || 'Chờ gán kho' },
                                { label: 'Loại đơn', value: TYPE_MAP[order.type]?.label || order.type },
                                { label: 'Mã vận đơn', value: order.trackingCode || '—' },
                                { label: 'Đơn vị vận chuyển', value: order.shippingProvider || '—' },
                                { label: 'Khu vực', value: PROVINCES.find(p => p.code === order.provinceCode)?.name || order.provinceCode || '—' },
                            ].map(row => (
                                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                                    <Typography variant="caption" fontWeight={600} color="#333">{row.value}</Typography>
                                </Box>
                            ))}
                        </Paper>
                    </Grid>

                    {/* Danh sách sản phẩm */}
                    {order.items && order.items.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>
                                        SẢN PHẨM ({order.items.length} mặt hàng)
                                    </Typography>
                                </Box>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                                            {['Sản phẩm', 'Mã vạch', 'Số lượng', 'Đơn giá', 'Thành tiền'].map(c => (
                                                <TableCell key={c} sx={{ fontSize: 11, fontWeight: 700, color: '#888', py: 1 }}>{c}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {order.items.map((item, idx) => (
                                            <TableRow key={idx} sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell sx={{ py: 1.25 }}>
                                                    <Typography variant="body2" fontWeight={600} fontSize={13}>
                                                        {item.productName || item.productId}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.25 }}>
                                                    <Typography variant="caption" fontFamily="monospace" color="#888">
                                                        {item.isbnBarcode || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.25 }}>
                                                    <Typography variant="body2" fontWeight={600}>{item.quantity}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.25 }}>
                                                    <Typography variant="body2" fontSize={12}>{fmt(item.unitPrice)}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.25 }}>
                                                    <Typography variant="body2" fontWeight={700} color="#1976d2">{fmt(item.subtotal)}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                    )}

                    {/* Lịch sử trạng thái */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <AccessTime sx={{ fontSize: 16, color: '#888' }} />
                                    <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>LỊCH SỬ TRẠNG THÁI</Typography>
                                </Box>
                                {order.statusHistory.map((h, idx) => {
                                    const ns = STATUS_MAP[h.newStatus as OrderStatus];
                                    return (
                                        <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'flex-start' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ns?.color || '#bbb', mt: 0.75, flexShrink: 0 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" fontWeight={600} fontSize={12} color={ns?.color || '#333'}>
                                                        {ns?.label || h.newStatus}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {h.createdAt ? new Date(h.createdAt).toLocaleString('vi-VN') : ''}
                                                    </Typography>
                                                </Box>
                                                {h.note && <Typography variant="caption" color="#888">{h.note}</Typography>}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>
                    Đóng
                </Button>
                {nextActions.map(a => (
                    <Button key={a.action} variant="contained"
                        onClick={() => { onStatusChange(order, a.action); onClose(); }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: a.color, '&:hover': { filter: 'brightness(0.9)' } }}>
                        {a.label}
                    </Button>
                ))}
            </DialogActions>
        </Dialog>
    );
};

// ── CREATE ORDER DIALOG ──────────────────────────────────
interface CartItem { productId: string; productName: string; quantity: number; unitPrice: number }

const CreateOrderDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    warehouses: Warehouse[];
}> = ({ open, onClose, onCreated, warehouses }) => {
    const [step, setStep] = useState(0);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [shippingName, setShippingName] = useState('');
    const [shippingPhone, setShippingPhone] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [assignedWarehouseId, setAssignedWarehouseId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            setStep(0); setCustomerPhone(''); setCustomer(null);
            setCartItems([]); setShippingName(''); setShippingPhone('');
            setShippingAddress(''); setProvinceCode(''); setPaymentMethod('COD');
            setAssignedWarehouseId(''); setError('');
        }
    }, [open]);

    useEffect(() => {
        if (productSearch.trim().length >= 2) {
            productService.search({ keyword: productSearch, page: 0, size: 8, isActive: true })
                .then(r => setProducts(r.content))
                .catch(() => { });
        } else {
            setProducts([]);
        }
    }, [productSearch]);

    const lookupCustomer = async () => {
        if (!customerPhone.trim()) return;
        setLookupError('');
        try {
            const c = await customerService.lookupByPhone(customerPhone.trim());
            setCustomer(c);
            setShippingName(c.fullName);
            setShippingPhone(c.phoneNumber);
            setShippingAddress(c.address || '');
        } catch {
            setLookupError('Không tìm thấy khách hàng. Nhập thủ công bên dưới.');
            setCustomer(null);
        }
    };

    const addProduct = (p: ProductResponse) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.productId === p.id);
            if (existing) return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { productId: p.id, productName: p.name, quantity: 1, unitPrice: p.retailPrice }];
        });
        setProductSearch('');
        setProducts([]);
    };

    const totalAmount = cartItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    const handleCreate = async () => {
        if (!shippingName || !shippingPhone || !shippingAddress || !provinceCode) {
            setError('Vui lòng điền đầy đủ thông tin giao hàng'); return;
        }
        if (cartItems.length === 0) { setError('Giỏ hàng chưa có sản phẩm'); return; }
        setSaving(true); setError('');
        try {
            const payload: CreateOrderRequest = {
                customerId: customer?.id || cartItems[0]?.productId,
                shippingName, shippingPhone, shippingAddress, provinceCode,
                items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
                paymentMethod,
                assignedWarehouseId: assignedWarehouseId || undefined,
                note: '',
            };
            // customerId bắt buộc — nếu không có customer thì tạo mới hoặc dùng guest
            if (!customer) {
                setError('Vui lòng tra cứu khách hàng trước khi tạo đơn'); setSaving(false); return;
            }
            payload.customerId = customer.id;
            await orderService.create(payload);
            onCreated();
            onClose();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Tạo đơn hàng thất bại');
        } finally {
            setSaving(false);
        }
    };

    const STEPS_LABEL = ['Khách hàng', 'Sản phẩm', 'Giao hàng', 'Xác nhận'];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={800} fontSize={17} color="#1a1a2e">Tạo đơn hàng mới</Typography>
                    <Typography variant="caption" color="text.secondary">Điền thông tin để tạo đơn hàng Online</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Box sx={{ px: 3, pt: 2 }}>
                <Stepper activeStep={step} alternativeLabel>
                    {STEPS_LABEL.map(s => <Step key={s}><StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 12 } }}>{s}</StepLabel></Step>)}
                </Stepper>
            </Box>
            <Divider sx={{ mx: 3, mt: 2 }} />
            <DialogContent sx={{ px: 3, py: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                {/* STEP 0: Khách hàng */}
                {step === 0 && (
                    <Box>
                        <Typography variant="body2" fontWeight={700} mb={1.5}>Tra cứu khách hàng theo SĐT</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                            <TextField fullWidth size="small" placeholder="Nhập số điện thoại khách hàng"
                                value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && lookupCustomer()} />
                            <Button variant="contained" onClick={lookupCustomer}
                                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1976d2', whiteSpace: 'nowrap' }}>
                                Tra cứu
                            </Button>
                        </Box>
                        {lookupError && <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>{lookupError}</Alert>}
                        {customer && (
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #c8e6c9', bgcolor: '#e8f5e9' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight={700}>{customer.fullName}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {customer.phoneNumber} · {customer.loyaltyPoints} điểm · Hạng {customer.customerTier}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        )}
                        {!customer && (
                            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                                Tra cứu SĐT để tự động điền thông tin. Khách hàng phải tồn tại trong hệ thống.
                            </Alert>
                        )}
                    </Box>
                )}

                {/* STEP 1: Sản phẩm */}
                {step === 1 && (
                    <Box>
                        <Typography variant="body2" fontWeight={700} mb={1.5}>Tìm kiếm và thêm sản phẩm</Typography>
                        <TextField fullWidth size="small" placeholder="Nhập tên sách, ISBN..."
                            value={productSearch} onChange={e => setProductSearch(e.target.value)}
                            sx={{ mb: 1 }} />
                        {products.length > 0 && (
                            <Paper elevation={2} sx={{ mb: 2, maxHeight: 200, overflowY: 'auto', borderRadius: 1.5 }}>
                                {products.map(p => (
                                    <Box key={p.id} onClick={() => addProduct(p)} sx={{
                                        px: 2, py: 1.25, cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                                        '&:hover': { bgcolor: '#f5f9ff' }, display: 'flex', justifyContent: 'space-between',
                                    }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} fontSize={13}>{p.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{p.isbnBarcode}</Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={700} color="#d32f2f">{fmt(p.retailPrice)}</Typography>
                                    </Box>
                                ))}
                            </Paper>
                        )}
                        {cartItems.length > 0 && (
                            <Paper elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 1.5, overflow: 'hidden' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                                            {['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền', ''].map(c => (
                                                <TableCell key={c} sx={{ fontSize: 11, fontWeight: 700, color: '#888', py: 1 }}>{c}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cartItems.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Typography variant="body2" fontWeight={600} fontSize={12}>{item.productName}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <TextField size="small" type="number" value={item.quantity}
                                                        onChange={e => setCartItems(prev => prev.map((i, ii) =>
                                                            ii === idx ? { ...i, quantity: Math.max(1, +e.target.value) } : i))}
                                                        sx={{ width: 60 }} inputProps={{ min: 1 }} />
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Typography variant="caption">{fmt(item.unitPrice)}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Typography variant="body2" fontWeight={700} color="#1976d2">
                                                        {fmt(item.quantity * item.unitPrice)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <IconButton size="small" onClick={() => setCartItems(prev => prev.filter((_, ii) => ii !== idx))}>
                                                        <Close sx={{ fontSize: 15, color: '#d32f2f' }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Box sx={{ px: 2, py: 1.5, bgcolor: '#fafafa', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
                                    <Typography variant="body1" fontWeight={800} color="#d32f2f">Tổng: {fmt(totalAmount)}</Typography>
                                </Box>
                            </Paper>
                        )}
                    </Box>
                )}

                {/* STEP 2: Giao hàng */}
                {step === 2 && (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                Tên người nhận <span style={{ color: '#d32f2f' }}>*</span>
                            </Typography>
                            <TextField fullWidth size="small" value={shippingName} onChange={e => setShippingName(e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                SĐT người nhận <span style={{ color: '#d32f2f' }}>*</span>
                            </Typography>
                            <TextField fullWidth size="small" value={shippingPhone} onChange={e => setShippingPhone(e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                Địa chỉ giao hàng <span style={{ color: '#d32f2f' }}>*</span>
                            </Typography>
                            <TextField fullWidth size="small" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                Tỉnh / Thành phố <span style={{ color: '#d32f2f' }}>*</span>
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select value={provinceCode} onChange={e => setProvinceCode(e.target.value)} displayEmpty>
                                    <MenuItem value="">Chọn tỉnh/thành</MenuItem>
                                    {PROVINCES.map(p => <MenuItem key={p.code} value={p.code} sx={{ fontSize: 13 }}>{p.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Phương thức thanh toán</Typography>
                            <FormControl fullWidth size="small">
                                <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    {['COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY'].map(m => (
                                        <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>{m}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Kho đóng gói (tuỳ chọn)</Typography>
                            <FormControl fullWidth size="small">
                                <Select value={assignedWarehouseId} onChange={e => setAssignedWarehouseId(e.target.value)} displayEmpty>
                                    <MenuItem value="">Tự động (Smart Routing)</MenuItem>
                                    {warehouses.filter(w => w.isActive).map(w => (
                                        <MenuItem key={w.id} value={w.id} sx={{ fontSize: 13 }}>{w.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                )}

                {/* STEP 3: Xác nhận */}
                {step === 3 && (
                    <Box>
                        <Typography variant="body2" fontWeight={700} mb={2}>Xác nhận thông tin đơn hàng</Typography>
                        <Grid container spacing={2}>
                            {[
                                { label: 'Khách hàng', value: customer?.fullName || '—' },
                                { label: 'SĐT', value: shippingPhone },
                                { label: 'Địa chỉ', value: shippingAddress },
                                { label: 'Khu vực', value: PROVINCES.find(p => p.code === provinceCode)?.name || '—' },
                                { label: 'Thanh toán', value: paymentMethod },
                                { label: 'Kho đóng gói', value: warehouses.find(w => w.id === assignedWarehouseId)?.name || 'Tự động' },
                            ].map(row => (
                                <Grid size={{ xs: 12, sm: 6 }} key={row.label}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>{row.label}:</Typography>
                                        <Typography variant="caption" fontWeight={600}>{row.value}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" fontWeight={700} mb={1}>Sản phẩm ({cartItems.length})</Typography>
                        {cartItems.map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="caption">{item.productName} × {item.quantity}</Typography>
                                <Typography variant="caption" fontWeight={700}>{fmt(item.quantity * item.unitPrice)}</Typography>
                            </Box>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={700}>Tổng cộng</Typography>
                            <Typography variant="body1" fontWeight={800} color="#d32f2f">{fmt(totalAmount)}</Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
                {step > 0 && (
                    <Button onClick={() => setStep(s => s - 1)} startIcon={<ArrowBack />}
                        sx={{ textTransform: 'none', color: '#555' }}>
                        Quay lại
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>
                    Hủy
                </Button>
                {step < 3 ? (
                    <Button variant="contained" onClick={() => setStep(s => s + 1)}
                        disabled={step === 0 && !customer}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}>
                        Tiếp theo
                    </Button>
                ) : (
                    <Button variant="contained" onClick={handleCreate} disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
                        {saving ? 'Đang tạo...' : 'Tạo đơn hàng'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const OrderListPage: React.FC = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);
    const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const PAGE_SIZE = 20;

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const loadOrders = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const data = await orderService.getOrders({
                keyword: search.trim() || undefined,
                status: statusFilter || undefined,
                paymentStatus: paymentStatusFilter || undefined,
                page, size: PAGE_SIZE,
            });
            let content = data?.content ?? [];
            if (paymentMethodFilter) content = content.filter(o => o.paymentMethod === paymentMethodFilter);
            if (provinceFilter) content = content.filter(o => o.provinceCode === provinceFilter);
            setOrders(content);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter]);

    useEffect(() => { setPage(0); }, [search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter]);
    useEffect(() => { loadOrders(); }, [loadOrders]);

    const handleAction = async (action: string, order: OrderResponse) => {
        if (action === 'view') {
            setDetailOrder(order); setDetailOpen(true); return;
        }
        const statusMap: Record<string, OrderStatus> = {
            packing: 'PACKING', shipping: 'SHIPPING', delivered: 'DELIVERED', cancel: 'CANCELLED',
        };
        const newStatus = statusMap[action];
        if (!newStatus) return;
        try {
            await orderService.updateStatus(order.id, newStatus);
            setSnack({ message: `Đã cập nhật đơn ${order.code} → ${STATUS_MAP[newStatus]?.label}`, severity: 'success' });
            loadOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Cập nhật thất bại', severity: 'error' });
        }
    };

    const handleStatusChange = async (order: OrderResponse, newStatus: string) => {
        try {
            await orderService.updateStatus(order.id, newStatus);
            setSnack({ message: `Đã cập nhật trạng thái đơn ${order.code}`, severity: 'success' });
            loadOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Cập nhật thất bại', severity: 'error' });
        }
    };

    const clearFilters = () => {
        setSearch(''); setStatusFilter(''); setPaymentStatusFilter('');
        setPaymentMethodFilter(''); setProvinceFilter('');
    };

    const activeFilterCount = [search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter].filter(Boolean).length;
    const totalRevenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + (o.finalAmount || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const paidCount = orders.filter(o => o.paymentStatus === 'PAID').length;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="#aaa" fontSize={11}>
                    Dashboard / <strong style={{ color: '#555' }}>Đơn hàng</strong>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1a1a2e">Quản lý Đơn hàng</Typography>
                        <Typography variant="body2" color="text.secondary" fontSize={12}>
                            Quản lý và theo dõi đơn hàng bán hàng
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Làm mới">
                            <IconButton onClick={loadOrders} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Refresh sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <Button variant="outlined" size="small" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#e0e0e0', color: '#555' }}>
                            Export Excel
                        </Button>
                        <Button variant="contained" size="small" startIcon={<Add sx={{ fontSize: 15 }} />}
                            onClick={() => setCreateOpen(true)}
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}>
                            Tạo đơn hàng
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 2.5 }}>
                {[
                    { label: 'Tổng đơn', value: totalElements.toLocaleString(), color: '#1a1a2e' },
                    { label: 'Chờ xử lý', value: pendingCount, color: '#e65100' },
                    { label: 'Đã thanh toán', value: paidCount, color: '#2e7d32' },
                    { label: 'Doanh thu hiển thị', value: `${(totalRevenue / 1_000_000).toFixed(1)}M đ`, color: '#1976d2' },
                ].map(s => (
                    <Paper key={s.label} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                        <Typography variant="caption" color="text.secondary" fontSize={11} fontWeight={600} letterSpacing={0.3} display="block">
                            {s.label.toUpperCase()}
                        </Typography>
                        {loading ? <Skeleton height={32} /> : (
                            <Typography variant="h5" fontWeight={800} color={s.color} mt={0.5}>{s.value}</Typography>
                        )}
                    </Paper>
                ))}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Filter Panel */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', mb: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Tìm theo mã đơn, tên KH, SĐT..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        sx={{ flex: 1, minWidth: 220 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment> }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map(opt => (
                            <Button key={opt.value} size="small" onClick={() => setStatusFilter(opt.value)}
                                sx={{
                                    textTransform: 'none', fontSize: 12, fontWeight: 600,
                                    px: 1.5, py: 0.5, borderRadius: 1.5, border: '1px solid',
                                    borderColor: statusFilter === opt.value ? '#1976d2' : '#e0e0e0',
                                    bgcolor: statusFilter === opt.value ? '#e3f2fd' : 'transparent',
                                    color: statusFilter === opt.value ? '#1976d2' : '#555',
                                    '&:hover': { borderColor: '#1976d2', bgcolor: '#e3f2fd' },
                                }}>
                                {opt.label}
                            </Button>
                        ))}
                    </Box>
                    <Button size="small"
                        endIcon={showAdvanced ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        sx={{
                            textTransform: 'none', color: showAdvanced ? '#1976d2' : '#555',
                            border: '1px solid', borderColor: showAdvanced ? '#1976d2' : '#e0e0e0',
                            borderRadius: 1.5, bgcolor: showAdvanced ? '#e3f2fd' : 'transparent',
                        }}>
                        Bộ lọc nâng cao
                        {activeFilterCount > 0 && (
                            <Box component="span" sx={{ ml: 0.5, px: 0.75, borderRadius: 1, bgcolor: '#1976d2', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                                {activeFilterCount}
                            </Box>
                        )}
                    </Button>
                </Box>

                <Collapse in={showAdvanced}>
                    <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', borderTop: '1px solid #f5f5f5', pt: 1.5, bgcolor: '#fafafa' }}>
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select value={paymentStatusFilter}
                                onChange={(e: SelectChangeEvent<string>) => setPaymentStatusFilter(e.target.value)}
                                displayEmpty sx={{ fontSize: 13 }}>
                                {PAYMENT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select value={paymentMethodFilter}
                                onChange={(e: SelectChangeEvent<string>) => setPaymentMethodFilter(e.target.value)}
                                displayEmpty sx={{ fontSize: 13 }}>
                                {PAYMENT_METHOD_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        {/* Lọc theo khu vực/tỉnh thành */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select value={provinceFilter}
                                onChange={(e: SelectChangeEvent<string>) => setProvinceFilter(e.target.value)}
                                displayEmpty sx={{ fontSize: 13 }}>
                                <MenuItem value="">Tất cả khu vực</MenuItem>
                                {PROVINCES.map(p => <MenuItem key={p.code} value={p.code} sx={{ fontSize: 13 }}>{p.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        {activeFilterCount > 0 && (
                            <Button size="small" onClick={clearFilters}
                                sx={{ textTransform: 'none', color: '#d32f2f', fontSize: 12, fontWeight: 600 }}>
                                Xóa bộ lọc ({activeFilterCount})
                            </Button>
                        )}
                    </Box>
                </Collapse>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                    <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Đang lọc:</Typography>
                        {search && <Chip size="small" label={`"${search}"`} onDelete={() => setSearch('')} sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }} />}
                        {statusFilter && <Chip size="small" label={STATUS_OPTIONS.find(o => o.value === statusFilter)?.label} onDelete={() => setStatusFilter('')} sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }} />}
                        {paymentStatusFilter && <Chip size="small" label={PAYMENT_OPTIONS.find(o => o.value === paymentStatusFilter)?.label} onDelete={() => setPaymentStatusFilter('')} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }} />}
                        {paymentMethodFilter && <Chip size="small" label={paymentMethodFilter} onDelete={() => setPaymentMethodFilter('')} sx={{ bgcolor: '#f3e5f5', color: '#6a1b9a', fontWeight: 600 }} />}
                        {provinceFilter && <Chip size="small" label={PROVINCES.find(p => p.code === provinceFilter)?.name} onDelete={() => setProvinceFilter('')} sx={{ bgcolor: '#e1f5fe', color: '#0277bd', fontWeight: 600 }} />}
                    </Box>
                )}
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {[
                                    { label: 'STT', width: 48 },
                                    { label: 'Mã đơn & Loại', width: 170 },
                                    { label: 'Khách hàng', width: 170 },
                                    { label: 'Khu vực', width: 130 },
                                    { label: 'Kho đóng gói', width: 130 },
                                    { label: 'Ngày tạo', width: 100 },
                                    { label: 'Tổng tiền', width: 110, align: 'right' },
                                    { label: 'Thanh toán', width: 100, align: 'center' },
                                    { label: 'Trạng thái', width: 110, align: 'center' },
                                    { label: '', width: 50, align: 'center' },
                                ].map(col => (
                                    <TableCell key={col.label} align={(col.align as any) || 'left'}
                                        sx={{ fontWeight: 700, fontSize: 11, color: '#888', width: col.width, py: 1.5, letterSpacing: 0.3 }}>
                                        {col.label.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                                            <TableCell key={j}><Skeleton height={20} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order, idx) => {
                                    const status = STATUS_MAP[order.status as OrderStatus] || { label: order.status, color: '#666', bg: '#f3f4f6', step: 0 };
                                    const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus as PaymentStatus] || { label: order.paymentStatus, color: '#888' };
                                    const typeInfo = TYPE_MAP[order.type || ''] || { label: order.type, color: '#555', bg: '#f5f5f5' };
                                    const provinceName = PROVINCES.find(p => p.code === order.provinceCode)?.name || order.provinceCode || '—';
                                    const isCancelled = order.status === 'CANCELLED';
                                    return (
                                        <TableRow key={order.id} hover
                                            sx={{ bgcolor: isCancelled ? '#fafafa' : idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#f5f9ff' }, opacity: isCancelled ? 0.7 : 1, cursor: 'pointer' }}
                                            onClick={() => { setDetailOrder(order); setDetailOpen(true); }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="caption" color="#bbb" fontWeight={600}>{page * PAGE_SIZE + idx + 1}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="caption" fontFamily="monospace" fontWeight={700} color="#1976d2" display="block">{order.code}</Typography>
                                                {order.type && (
                                                    <Chip label={typeInfo.label} size="small"
                                                        sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: typeInfo.bg, color: typeInfo.color, mt: 0.25 }} />
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={700} fontSize={13}>
                                                    {order.customerName || order.shippingName || 'Khách lẻ'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {order.customerPhone || order.shippingPhone || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="caption" color="#555" fontSize={12}>{provinceName}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                {order.assignedWarehouseName ? (
                                                    <Typography variant="caption" color="#555" fontSize={12}>{order.assignedWarehouseName}</Typography>
                                                ) : (
                                                    <Chip label="Chờ gán kho" size="small"
                                                        sx={{ height: 18, fontSize: 10, bgcolor: '#fff8e1', color: '#f57c00', fontWeight: 600 }} />
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontSize={12} color="#555">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={700} fontSize={13} color={isCancelled ? '#bbb' : '#1a1a2e'}>
                                                    {fmt(order.finalAmount)}
                                                </Typography>
                                                {order.paymentMethod && (
                                                    <Typography variant="caption" color="text.secondary">{order.paymentMethod}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.5 }}>
                                                <Typography variant="caption" fontWeight={700} color={payStatus.color}>{payStatus.label}</Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.5 }}>
                                                <Chip label={status.label} size="small"
                                                    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: status.bg, color: status.color }} />
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.5 }} onClick={e => e.stopPropagation()}>
                                                <RowMenu order={order} onAction={handleAction} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={36} mb={1}>🔍</Typography>
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            Không tìm thấy đơn hàng nào
                                        </Typography>
                                        {activeFilterCount > 0 && (
                                            <Button size="small" variant="outlined" onClick={clearFilters} sx={{ mt: 1, textTransform: 'none', fontSize: 12 }}>
                                                Xóa bộ lọc
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                    <Typography variant="caption" color="text.secondary">
                        Hiển thị <strong>{orders.length}</strong> / <strong>{totalElements}</strong> đơn hàng
                    </Typography>
                    {totalPages > 1 && (
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)}
                            color="primary" shape="rounded" size="small" />
                    )}
                </Box>
            </Paper>

            {/* ORDER DETAIL DIALOG */}
            <OrderDetailDialog
                order={detailOrder}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                onStatusChange={handleStatusChange}
            />

            {/* CREATE ORDER DIALOG */}
            <CreateOrderDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => { loadOrders(); setSnack({ message: 'Tạo đơn hàng thành công!', severity: 'success' }); }}
                warehouses={warehouses}
            />

            {/* Snackbar */}
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

export default OrderListPage;