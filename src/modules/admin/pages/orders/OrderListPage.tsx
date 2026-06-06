// src/modules/admin/pages/orders/OrderListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import axiosInstance from '../../../../services/axiosConfig';
import {
    OrderResponse, OrderStatus, PaymentStatus,
    CreateOrderRequest, Customer, Warehouse, ProductResponse
} from '../../../../types';
import productService from '../../../../services/productService';
import InlineCustomerSearch from '../../../employee/components/pos/InlineCustomerSearch';
import POSProductSearchBar from '../../../employee/components/pos/POSProductSearchBar';
import PrintInvoiceDialog from '../../../employee/components/pos/PrintInvoiceDialog';
import PrintShippingLabelDialog from './PrintShippingLabelDialog';
import { useAuth } from '../../../../store/hooks/useAuth';
import { useShippingCoordinates } from '../../../../hooks/useShippingCoordinates';

// ── Memoized OrderRow ──────────────────────────────────────────
const OrderRow = React.memo(({
    order, idx, page, PAGE_SIZE, onClick, onAction
}: {
    order: OrderResponse, idx: number, page: number, PAGE_SIZE: number,
    onClick: (order: OrderResponse) => void, onAction: (action: string, order: OrderResponse) => void
}) => {
    const status = STATUS_MAP[order.status as OrderStatus] || { label: order.status, color: '#666', bg: '#f3f4f6', step: 0 };
    const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus as PaymentStatus] || { label: order.paymentStatus, color: '#888' };
    const typeInfo = TYPE_MAP[order.type || ''] || { label: order.type, color: '#555', bg: '#f5f5f5' };
    const provinceName = getProvinceName(order.provinceCode);
    const isCancelled = order.status === 'CANCELLED';

    return (
        <TableRow hover
            sx={{ bgcolor: isCancelled ? '#fff0f0' : idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#f5f9ff' }, cursor: 'pointer' }}
            onClick={() => onClick(order)}>
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
            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="body2" fontWeight={600} fontSize={12} color="#1a1a2e">
                    {order.createdByName || (order as any).cashierName || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Nhân viên</Typography>
            </TableCell>
            <TableCell align="right" sx={{ py: 1.5 }}>
                <Typography variant="body2" fontWeight={700} fontSize={13} color="#1a1a2e">
                    {fmt(order.finalAmount)}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
                {order.paymentMethod && (
                    <Chip label={order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : order.paymentMethod === 'CASH' ? 'Tiền mặt' : order.paymentMethod === 'MOMO' ? 'MoMo' : order.paymentMethod === 'VNPAY' ? 'VNPay' : order.paymentMethod === 'PAYOS' ? 'PayOS' : order.paymentMethod}
                        size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#f0f4ff', color: '#1976d2' }} />
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
                <RowMenu order={order} onAction={onAction} />
            </TableCell>
        </TableRow>
    );
});

// ── Helpers ────────────────────────────────────────────────
const fmt = (n?: number) => {
    if (n == null || n === 0) return '0 đ';
    return n.toLocaleString('vi-VN') + ' đ';
};

const STATUS_MAP: Record<OrderStatus | string, { label: string; color: string; bg: string; step: number }> = {
    PAYMENT_PENDING: { label: 'Chờ thanh toán', color: '#b45309', bg: '#fef3c7', step: 0 },
    PENDING: { label: 'Chờ xử lý', color: '#1d4ed8', bg: '#dbeafe', step: 1 },
    WAITING_FOR_CONSOLIDATION: { label: 'Đang gom hàng', color: '#c2410c', bg: '#ffedd5', step: 1 },
    PACKING: { label: 'Đóng gói', color: '#6d28d9', bg: '#ede9fe', step: 2 },
    SHIPPING: { label: 'Đang giao', color: '#15803d', bg: '#dcfce3', step: 3 },
    DELIVERED: { label: 'Hoàn thành', color: '#166534', bg: '#d1fae5', step: 4 },
    CANCELLED: { label: 'Đã hủy', color: '#6b7280', bg: '#f3f4f6', step: -1 },
    RETURNED: { label: 'Hoàn trả', color: '#b91c1c', bg: '#fef2f2', step: -1 },
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; color: string }> = {
    UNPAID: { label: 'Chưa thu', color: '#d32f2f' },
    PAID: { label: 'Đã thu', color: '#2e7d32' },
    REFUNDED: { label: 'Đã hoàn', color: '#888' },
};

const TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DELIVERY: { label: 'Giao hàng', color: '#0277bd', bg: '#e1f5fe' },
    BOPIS: { label: 'Tại quầy', color: '#558b2f', bg: '#f1f8e9' },
    POS: { label: 'Bán tại quầy', color: '#6a1b9a', bg: '#f3e5f5' },
    RETURN: { label: 'Trả hàng', color: '#d32f2f', bg: '#ffebee' },
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Tất cả' },
    { value: 'PAYMENT_PENDING', label: 'Chờ thanh toán' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'WAITING_FOR_CONSOLIDATION', label: 'Đang gom hàng' },
    { value: 'PACKING', label: 'Đóng gói' },
    { value: 'SHIPPING', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'RETURNED', label: 'Hoàn trả' },
];

// Danh sách tỉnh thành Việt Nam (dự phòng)
export const PROVINCES = [
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

let globalProvincesCache: Record<string, string> = {};
const fetchProvinces = async () => {
    if (Object.keys(globalProvincesCache).length > 0) return;
    try {
        const res = await fetch('https://provinces.open-api.vn/api/?depth=1');
        const data = await res.json();
        data.forEach((p: any) => {
            globalProvincesCache[p.code.toString()] = p.name.replace('Thành phố ', 'TP. ').replace('Tỉnh ', '');
        });
    } catch (e) {
        console.error('Failed to fetch provinces', e);
    }
};
// Trigger fetch immediately
fetchProvinces();

export const getProvinceName = (code: string) => {
    if (!code) return '—';
    if (globalProvincesCache[code]) return globalProvincesCache[code];
    const local = PROVINCES.find(p => p.code === code);
    return local ? local.name : code;
};

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
    { value: 'PAYOS', label: 'PayOS' },
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
                    { label: 'Xác nhận đóng gói', action: 'packing', show: status === 'PENDING' && order.type !== 'BOPIS' },
                    { label: 'Xác nhận giao hàng', action: 'shipping', show: status === 'PACKING' && order.type !== 'BOPIS' },
                    { label: order.type === 'BOPIS' ? 'Khách đã lấy hàng' : 'Đã giao', action: 'delivered', show: status === 'SHIPPING' || (status === 'PENDING' && order.type === 'BOPIS') },
                    {
                        label: 'Hủy đơn', action: 'cancel', color: '#ef4444',
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

const OrderDetailDialog: React.FC<{
    order: OrderResponse | null;
    open: boolean;
    onClose: () => void;
    onStatusChange: (order: OrderResponse, newStatus: string) => void;
    onPrint?: () => void;
}> = ({ order, open, onClose, onStatusChange, onPrint }) => {
    const [itemsPage, setItemsPage] = useState(0);
    const ITEMS_PER_PAGE = 10;
    
    useEffect(() => { setItemsPage(0); }, [order]);

    if (!order) return null;
    const status = STATUS_MAP[order.status as OrderStatus] || { label: order.status, color: '#666', bg: '#f3f4f6', step: 0 };
    const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus as PaymentStatus] || { label: order.paymentStatus, color: '#888' };
    const STEPS = ['Chờ xử lý', 'Đóng gói', 'Đang giao', 'Hoàn thành'];
    const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';

    const isOffline = (order as any)._source === 'OFFLINE';
    const nextActions: { label: string; action: string; color: string }[] = [];
    if (!isOffline) {
        if (order.type === 'BOPIS') {
            if (order.status === 'PENDING') nextActions.push({ label: 'Khách đã lấy hàng', action: 'DELIVERED', color: '#16a34a' });
        } else {
            if (order.status === 'PENDING') nextActions.push({ label: 'Xác nhận đóng gói', action: 'PACKING', color: '#2563eb' });
            if (order.status === 'PACKING') nextActions.push({ label: 'Xác nhận giao hàng', action: 'SHIPPING', color: '#8b5cf6' });
            if (order.status === 'SHIPPING') nextActions.push({ label: 'Xác nhận đã giao', action: 'DELIVERED', color: '#16a34a' });
        }
        if (!isCancelled && order.status !== 'DELIVERED') {
            nextActions.push({ label: 'Hủy đơn', action: 'CANCELLED', color: '#ef4444' });
        }
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
                        {order.cashierName && ` · Thu ngân: ${order.cashierName}`}
                        {order.createdByName && ` · Người tạo: ${order.createdByName}`}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1.5 }} />

            <DialogContent sx={{ px: 3, py: 2 }}>
                {/* Timeline trạng thái */}
                {!isCancelled && !isOffline && (
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
                            {isOffline ? 'Hóa đơn' : 'Đơn hàng'} {order.status === 'CANCELLED' ? 'đã bị hủy' : 'đã được hoàn trả'}
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
                    {!isOffline && (
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
                    )}

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
                    {!isOffline && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <LocalShipping sx={{ fontSize: 16, color: '#6a1b9a' }} />
                                    <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3}>VẬN CHUYỂN</Typography>
                                </Box>
                                {[
                                    { label: 'Kho đóng gói', value: order.assignedWarehouseName || 'Chờ gán kho' },
                                    { label: 'Nhân viên đóng gói', value: order.packedByName || '—' },
                                    { label: 'Loại đơn', value: TYPE_MAP[order.type]?.label || order.type },
                                    { label: 'Mã vận đơn', value: order.trackingCode || '—' },
                                    { label: 'Đơn vị vận chuyển', value: order.shippingProvider || '—' },
                                    { label: 'Khu vực', value: getProvinceName(order.provinceCode) },
                                ].map(row => (
                                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                                        <Typography variant="caption" fontWeight={600} color="#333">{row.value}</Typography>
                                    </Box>
                                ))}
                            </Paper>
                        </Grid>
                    )}

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
                                        {order.items.slice(itemsPage * ITEMS_PER_PAGE, (itemsPage + 1) * ITEMS_PER_PAGE).map((item, idx) => (
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
                                {Math.ceil(order.items.length / ITEMS_PER_PAGE) > 1 && (
                                    <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                                        <Pagination 
                                            size="small" 
                                            count={Math.ceil(order.items.length / ITEMS_PER_PAGE)} 
                                            page={itemsPage + 1} 
                                            onChange={(_, p) => setItemsPage(p - 1)} 
                                        />
                                    </Box>
                                )}
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
                                                        {h.changedByName && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>({h.changedByName})</Typography>}
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
                <Box sx={{ flex: 1 }}>
                    {onPrint && (
                        <Button onClick={onPrint} variant="outlined" startIcon={<FileDownloadOutlined />}
                            sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#1a1a2e', borderRadius: 1.5, fontWeight: 700 }}>
                            {isOffline ? 'In hóa đơn (K80)' : 'In tem dán (A6)'}
                        </Button>
                    )}
                </Box>
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
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [shippingName, setShippingName] = useState('');
    const [shippingPhone, setShippingPhone] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [assignedWarehouseId, setAssignedWarehouseId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const coordinates = useShippingCoordinates(undefined);

    useEffect(() => {
        if (!open) {
            setCustomer(null);
            setCartItems([]);
            setShippingName(''); setShippingPhone('');
            setShippingAddress(''); setProvinceCode(''); setPaymentMethod('COD');
            setAssignedWarehouseId(''); setError('');
        }
    }, [open]);

    const addProduct = (p: ProductResponse) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.productId === p.id);
            if (existing) return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { productId: p.id, productName: p.name, quantity: 1, unitPrice: p.retailPrice }];
        });
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
                // NV-1: Tọa độ tự động tra cứu từ tên Quận/Huyện.
                shippingLatitude: coordinates?.lat,
                shippingLongitude: coordinates?.lng,
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2.5, maxHeight: '90vh' } }}>
            <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={800} fontSize={17} color="#1a1a2e">Tạo đơn hàng mới</Typography>
                    <Typography variant="caption" color="text.secondary">Bán hàng qua điện thoại / Zalo — Tạo đơn giao hàng cho khách</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1.5 }} />
            <DialogContent sx={{ px: 3, py: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                <Grid container spacing={3}>
                    {/* LEFT: KH + SP */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3} display="block" mb={1}>KHÁCH HÀNG</Typography>
                            <InlineCustomerSearch
                                customer={customer}
                                onSelect={(c) => {
                                    setCustomer(c);
                                    if (c) {
                                        setShippingName(c.fullName);
                                        setShippingPhone(c.phoneNumber);
                                        setShippingAddress(c.address || '');
                                    } else {
                                        setShippingName('');
                                        setShippingPhone('');
                                        setShippingAddress('');
                                    }
                                }}
                            />
                        </Paper>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3} display="block" mb={1}>SẢN PHẨM</Typography>
                            <Box sx={{ mb: 1.5 }}>
                                <POSProductSearchBar onAdd={addProduct} />
                            </Box>
                            {cartItems.length > 0 ? (
                                <Box sx={{ border: '1px solid #f0f0f0', borderRadius: 1.5, overflow: 'hidden' }}>
                                    {cartItems.map((item, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: '1px solid #f5f5f5', '&:last-child': { borderBottom: 0 } }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" fontWeight={600} fontSize={12} noWrap>{item.productName}</Typography><Typography variant="caption" color="text.secondary">{fmt(item.unitPrice)}</Typography></Box>
                                            <TextField size="small" type="number" value={item.quantity} onChange={e => setCartItems(prev => prev.map((i, ii) => ii === idx ? { ...i, quantity: Math.max(1, +e.target.value) } : i))} sx={{ width: 56 }} inputProps={{ min: 1, style: { textAlign: 'center', fontSize: 12, padding: '4px' } }} />
                                            <Typography variant="body2" fontWeight={700} color="#1976d2" fontSize={12} sx={{ minWidth: 80, textAlign: 'right' }}>{fmt(item.quantity * item.unitPrice)}</Typography>
                                            <IconButton size="small" onClick={() => setCartItems(prev => prev.filter((_, ii) => ii !== idx))}><Close sx={{ fontSize: 14, color: '#d32f2f' }} /></IconButton>
                                        </Box>
                                    ))}
                                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#fafafa', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" fontWeight={600} fontSize={12}>{cartItems.length} sản phẩm</Typography>
                                        <Typography variant="body1" fontWeight={800} color="#d32f2f">{fmt(totalAmount)}</Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 3, color: '#bbb' }}><Inventory2Outlined sx={{ fontSize: 36, mb: 0.5 }} /><Typography variant="caption" display="block">Chưa có sản phẩm</Typography></Box>
                            )}
                        </Paper>
                    </Grid>
                    {/* RIGHT: Giao hàng + TT */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3} display="block" mb={1.5}>THÔNG TIN GIAO HÀNG</Typography>
                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 6 }}><TextField fullWidth size="small" label="Người nhận *" value={shippingName} onChange={e => setShippingName(e.target.value)} /></Grid>
                                <Grid size={{ xs: 6 }}><TextField fullWidth size="small" label="SĐT nhận *" value={shippingPhone} onChange={e => setShippingPhone(e.target.value)} /></Grid>
                                <Grid size={{ xs: 12 }}><FormControl fullWidth size="small"><Select value={provinceCode} onChange={e => setProvinceCode(e.target.value)} displayEmpty sx={{ fontSize: 13 }}><MenuItem value="">Chọn tỉnh/thành *</MenuItem>{Object.entries(globalProvincesCache).length > 0 ? Object.entries(globalProvincesCache).map(([code, name]) => <MenuItem key={code} value={code} sx={{ fontSize: 13 }}>{name}</MenuItem>) : PROVINCES.map(p => <MenuItem key={p.code} value={p.code} sx={{ fontSize: 13 }}>{p.name}</MenuItem>)}</Select></FormControl></Grid>
                            </Grid>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3} display="block" mb={1.5}>THANH TOÁN & KHO</Typography>
                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 6 }}><FormControl fullWidth size="small"><Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} sx={{ fontSize: 13 }}>{[{ v: 'COD', l: 'COD' }, { v: 'BANK_TRANSFER', l: 'Chuyển khoản' }, { v: 'MOMO', l: 'MoMo' }, { v: 'VNPAY', l: 'VNPay' }, { v: 'PAYOS', l: 'PayOS' }].map(m => <MenuItem key={m.v} value={m.v} sx={{ fontSize: 13 }}>{m.l}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid size={{ xs: 6 }}><FormControl fullWidth size="small"><Select value={assignedWarehouseId} onChange={e => setAssignedWarehouseId(e.target.value)} displayEmpty sx={{ fontSize: 13 }}><MenuItem value="">Kho tự động</MenuItem>{warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id} sx={{ fontSize: 13 }}>{w.name}</MenuItem>)}</Select></FormControl></Grid>
                            </Grid>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e7ff', bgcolor: '#f8faff' }}>
                            <Typography variant="caption" fontWeight={700} color="#555" letterSpacing={0.3} display="block" mb={1}>TÓM TẮT</Typography>
                            {[{ l: 'Khách hàng', v: customer?.fullName || '—' }, { l: 'Sản phẩm', v: `${cartItems.length} mặt hàng` }, { l: 'Thanh toán', v: paymentMethod }, { l: 'Kho', v: warehouses.find(w => w.id === assignedWarehouseId)?.name || 'Tự động' }].map(r => (
                                <Box key={r.l} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="caption" color="text.secondary">{r.l}</Typography><Typography variant="caption" fontWeight={600}>{r.v}</Typography></Box>
                            ))}
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={700}>Tổng cộng</Typography>
                                <Typography variant="h6" fontWeight={800} color="#d32f2f">{fmt(totalAmount)}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1, borderTop: '1px solid #f0f0f0' }}>
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                <Button variant="contained" onClick={handleCreate} disabled={saving || !customer || cartItems.length === 0} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, px: 3 }}>{saving ? 'Đang tạo...' : 'Tạo đơn hàng'}</Button>
            </DialogActions>
        </Dialog>
    );
};


// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const OrderListPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: urlOrderId } = useParams<{ id: string }>();
    const { user, isAdmin, isManager, warehouseId: userWarehouseId } = useAuth();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [dateRange, setDateRange] = useState('last_30_days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const [orders, setOrders] = useState<any[]>([]);
    const [source, setSource] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [stats, setStats] = useState({ totalCount: 0, pendingCount: 0, paidCount: 0, totalRevenue: 0 });
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);
    const [detailOrder, setDetailOrder] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [printInvoice, setPrintInvoice] = useState<any>(null);
    const [printOpen, setPrintOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const PAGE_SIZE = 10;

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    useEffect(() => {
        setWarehouseFilter(userWarehouseId || '');
    }, [userWarehouseId]);

    useEffect(() => {
        if (urlOrderId) {
            const loadUrlOrder = async () => {
                try {
                    const full = await orderService.getById(urlOrderId);
                    setDetailOrder({ ...full, _source: 'ONLINE' });
                    setDetailOpen(true);
                } catch {
                    try {
                        const res = await axiosInstance.get(`/pos/invoices/code/${urlOrderId}`);
                        const inv = res.data?.data;
                        if (inv) {
                            const mapped = {
                                id: inv.id, code: inv.code,
                                items: inv.items, discountAmount: inv.discountAmount,
                                assignedWarehouseName: inv.warehouseName,
                                shippingAddress: 'Bán tại quầy',
                                paymentMethod: inv.payments?.[0]?.method || 'Tiền mặt',
                                payments: inv.payments,
                                _source: 'OFFLINE', cashierName: inv.cashierName,
                                totalAmount: inv.totalAmount, finalAmount: inv.finalAmount,
                                status: 'DELIVERED', createdAt: inv.createdAt,
                                customerName: inv.customerName, customerPhone: inv.customerPhone
                            };
                            setDetailOrder(mapped);
                            setDetailOpen(true);
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            };
            loadUrlOrder();
        }
    }, [urlOrderId]);

    const handleCloseDetail = useCallback(() => {
        setDetailOpen(false);
        if (urlOrderId) {
            navigate('/admin/orders', { replace: true });
        }
    }, [urlOrderId, navigate]);

    const loadOrders = useCallback(async () => {
        setLoading(true); setError('');
        try {
            let finalOrders: any[] = [];
            let tPages = 0;
            let tElements = 0;

            let fromDate: string | undefined = undefined;
            let toDate: string | undefined = undefined;

            const now = new Date();
            if (dateRange !== 'all') {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (dateRange === 'today') {
                    fromDate = today.toISOString();
                    toDate = new Date(today.getTime() + 86400000 - 1).toISOString();
                } else if (dateRange === 'yesterday') {
                    const yesterday = new Date(today.getTime() - 86400000);
                    fromDate = yesterday.toISOString();
                    toDate = new Date(yesterday.getTime() + 86400000 - 1).toISOString();
                } else if (dateRange === 'this_week') {
                    const firstDayOfWeek = new Date(today.getTime());
                    firstDayOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                    fromDate = firstDayOfWeek.toISOString();
                    toDate = new Date(today.getTime() + 86400000 - 1).toISOString();
                } else if (dateRange === 'last_week') {
                    const firstDayOfLastWeek = new Date(today.getTime());
                    firstDayOfLastWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) - 7);
                    fromDate = firstDayOfLastWeek.toISOString();
                    toDate = new Date(firstDayOfLastWeek.getTime() + 7 * 86400000 - 1).toISOString();
                } else if (dateRange === 'this_month') {
                    fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                    toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
                } else if (dateRange === 'last_month') {
                    fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                    toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
                } else if (dateRange === 'this_year') {
                    fromDate = new Date(now.getFullYear(), 0, 1).toISOString();
                    toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
                } else if (dateRange === 'last_year') {
                    fromDate = new Date(now.getFullYear() - 1, 0, 1).toISOString();
                    toDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).toISOString();
                } else if (dateRange === 'last_30_days') {
                    fromDate = new Date(today.getTime() - 29 * 86400000).toISOString();
                    toDate = new Date(today.getTime() + 86400000 - 1).toISOString();
                } else if (dateRange === 'custom') {
                    if (customStartDate) fromDate = new Date(customStartDate + 'T00:00:00').toISOString();
                    if (customEndDate) toDate = new Date(customEndDate + 'T23:59:59.999').toISOString();
                }
            }

            const isAll = source === 'ALL';
            const fetchPage = isAll ? 0 : page;
            const fetchSize = isAll ? 200 : PAGE_SIZE;

            const params: any = {
                keyword: search.trim() || undefined,
                page: fetchPage, size: fetchSize, 
                fromDate, toDate
            };

            const [onlineRes, offlineRes, statsRes] = await Promise.all([
                // 1. Fetch Online Orders
                (source === 'ONLINE' || source === 'ALL')
                    ? orderService.getOrders({
                        ...params,
                        status: statusFilter || undefined,
                        paymentStatus: paymentStatusFilter || undefined,
                        provinceCode: provinceFilter || undefined,
                        warehouseId: warehouseFilter || undefined,
                    })
                    : Promise.resolve(null),

                // 2. Fetch Offline Invoices
                (source === 'OFFLINE' || source === 'ALL')
                    ? (() => {
                        let shouldFetchOffline = true;
                        let typeParam = '';
                        if (statusFilter) {
                            if (statusFilter === 'DELIVERED') typeParam = '&type=SALE';
                            else if (statusFilter === 'RETURNED') typeParam = '&type=RETURN';
                            else if (statusFilter === 'CANCELLED') typeParam = '&type=VOIDED';
                            else shouldFetchOffline = false;
                        }
                        if (paymentStatusFilter === 'UNPAID') shouldFetchOffline = false;
                        if (provinceFilter) shouldFetchOffline = false;

                        if (!shouldFetchOffline) return Promise.resolve(null);

                        const kwParam = search ? `&keyword=${encodeURIComponent(search)}` : '';
                        const whParam = warehouseFilter ? `&warehouseId=${warehouseFilter}` : '';
                        const fromParam = fromDate ? `&from=${encodeURIComponent(fromDate)}` : '';
                        const toParam = toDate ? `&to=${encodeURIComponent(toDate)}` : '';
                        return axiosInstance.get(`/pos/invoices?page=0&size=9999${kwParam}${typeParam}${whParam}${fromParam}${toParam}`)
                            .then(res => res.data?.data);
                    })()
                    : Promise.resolve(null),

                // 3. Fetch Stats
                orderService.getStats({
                    keyword: search.trim() || undefined,
                    status: statusFilter || undefined,
                    paymentStatus: paymentStatusFilter || undefined,
                    provinceCode: provinceFilter || undefined,
                    warehouseId: warehouseFilter || undefined,
                    source: source,
                    fromDate,
                    toDate
                })
            ]);

            if (onlineRes) {
                const mappedOnline = (onlineRes.content ?? []).map(o => ({ ...o, _source: 'ONLINE' }));
                finalOrders = [...finalOrders, ...mappedOnline];
                tPages = Math.max(tPages, onlineRes.totalPages ?? 0);
                tElements += onlineRes.totalElements ?? 0;
            }

            if (offlineRes) {
                const mappedOffline = (offlineRes.content ?? []).map((inv: any) => {
                    let mappedStatus = 'DELIVERED';
                    if (inv.type === 'RETURN') mappedStatus = 'RETURNED';
                    if (inv.type === 'VOIDED') mappedStatus = 'CANCELLED';

                    return {
                        id: inv.id,
                        code: inv.code,
                        customerName: inv.customerName || 'Khách lẻ',
                        customerPhone: inv.customerPhone || '—',
                        totalAmount: inv.totalAmount,
                        finalAmount: inv.finalAmount,
                        status: mappedStatus,
                        paymentStatus: 'PAID',
                        paymentMethod: inv.payments?.[0]?.method || 'CASH',
                        createdAt: inv.createdAt,
                        assignedWarehouseName: inv.warehouseName,
                        type: inv.type === 'RETURN' ? 'RETURN' : 'POS',
                        _source: 'OFFLINE',
                        cashierName: inv.cashierName,
                        cancelledReason: inv.voidReason
                    };
                });
                finalOrders = [...finalOrders, ...mappedOffline];
                tPages = Math.max(tPages, offlineRes.totalPages ?? 0);
                tElements += offlineRes.totalElements ?? 0;
            }

            // Nếu là 'ALL', sắp xếp lại theo thời gian
            if (isAll) {
                finalOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }

            if (paymentMethodFilter) {
                finalOrders = finalOrders.filter(o => o.paymentMethod?.includes(paymentMethodFilter));
            }

            let paginatedOrders;
            if (isAll) {
                tElements = finalOrders.length;
                tPages = Math.ceil(tElements / PAGE_SIZE);
                paginatedOrders = finalOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
            } else {
                paginatedOrders = finalOrders;
            }

            setOrders(paginatedOrders);
            setTotalPages(tPages);
            setTotalElements(tElements);
            if (statsRes) {
                setStats(statsRes);
            }
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter, warehouseFilter, source, dateRange, customStartDate, customEndDate]);

    useEffect(() => { setPage(0); }, [search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter, warehouseFilter, source, dateRange, customStartDate, customEndDate]);
    useEffect(() => { loadOrders(); }, [loadOrders]);

    const handleAction = React.useCallback(async (action: string, order: OrderResponse) => {
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
    }, [loadOrders]);

    const handleRowClick = React.useCallback(async (order: any) => {
        if (order._source === 'OFFLINE') {
            try {
                const res = await axiosInstance.get(`/pos/invoices/code/${order.code}`);
                const inv = res.data?.data;
                const mapped = {
                    ...order,
                    items: inv.items,
                    discountAmount: inv.discountAmount,
                    assignedWarehouseName: inv.warehouseName || order.assignedWarehouseName,
                    shippingAddress: 'Bán tại quầy',
                    paymentMethod: inv.payments?.[0]?.method || 'Tiền mặt',
                    payments: inv.payments,
                    _source: 'OFFLINE',
                    cashierName: inv.cashierName || order.cashierName
                };
                setDetailOrder(mapped);
            } catch { setDetailOrder(order); }
        } else {
            try {
                const full = await orderService.getById(order.id);
                setDetailOrder({ ...full, _source: 'ONLINE' });
            } catch { setDetailOrder(order); }
        }
        setDetailOpen(true);
    }, []);

    const handlePrintOrder = (order: any) => {
        const invoiceData = {
            id: order.id,
            code: order.code,
            type: order.type,
            totalAmount: order.totalAmount || order.finalAmount,
            discountAmount: order.discountAmount || 0,
            finalAmount: order.finalAmount,
            cashierName: order.cashierName || order.createdByName,
            customerName: order.customerName || order.shippingName,
            customerPhone: order.customerPhone || order.shippingPhone,
            shippingAddress: order.shippingAddress,
            note: order.note,
            createdAt: order.createdAt,
            items: order.items || [],
            payments: [{ method: order.paymentMethod || 'CASH', amount: order.finalAmount }],
            _source: order._source,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus
        };
        setPrintInvoice(invoiceData);
        setPrintOpen(true);
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
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                            Tạo đơn hàng
                        </Button>
                    </Box>
                </Box>
                {/* Tabs chọn nguồn */}
                <Box sx={{ mb: 3 }}>
                    <Tabs value={source} onChange={(_, v) => setSource(v)}
                        sx={{
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#1976d2' },
                            borderBottom: '1px solid #e0e0e0'
                        }}>
                        <Tab label="Tất cả đơn hàng" value="ALL" sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13 }} />
                        <Tab label="Online (Giao hàng)" value="ONLINE" sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13 }} />
                        <Tab label="POS (Tại quầy)" value="OFFLINE" sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13 }} />
                    </Tabs>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 2.5 }}>
                {[
                    { label: 'Tổng đơn', value: stats.totalCount.toLocaleString(), color: '#1a1a2e' },
                    { label: 'Chờ xử lý', value: stats.pendingCount.toLocaleString(), color: '#e65100' },
                    { label: 'Đã thanh toán', value: stats.paidCount.toLocaleString(), color: '#2e7d32' },
                    { label: 'Doanh thu hiển thị', value: `${(stats.totalRevenue / 1_000_000).toFixed(1)}M đ`, color: '#1976d2' },
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
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select value={dateRange} onChange={(e: SelectChangeEvent<string>) => setDateRange(e.target.value)}
                            displayEmpty sx={{ fontSize: 13, bgcolor: '#fff', borderRadius: 1.5 }}>
                            <MenuItem value="all" sx={{ fontSize: 13 }}>Tất cả thời gian</MenuItem>
                            <MenuItem value="today" sx={{ fontSize: 13 }}>Hôm nay</MenuItem>
                            <MenuItem value="yesterday" sx={{ fontSize: 13 }}>Hôm qua</MenuItem>
                            <MenuItem value="this_week" sx={{ fontSize: 13 }}>Tuần này</MenuItem>
                            <MenuItem value="last_week" sx={{ fontSize: 13 }}>Tuần trước</MenuItem>
                            <MenuItem value="this_month" sx={{ fontSize: 13 }}>Tháng này</MenuItem>
                            <MenuItem value="last_month" sx={{ fontSize: 13 }}>Tháng trước</MenuItem>
                            <MenuItem value="this_year" sx={{ fontSize: 13 }}>Năm nay</MenuItem>
                            <MenuItem value="last_year" sx={{ fontSize: 13 }}>Năm trước</MenuItem>
                            <MenuItem value="last_30_days" sx={{ fontSize: 13 }}>30 ngày qua</MenuItem>
                            <MenuItem value="custom" sx={{ fontSize: 13 }}>Tùy chỉnh...</MenuItem>
                        </Select>
                    </FormControl>
                    {dateRange === 'custom' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField type="date" size="small" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} sx={{ width: 130 }} InputProps={{ sx: { fontSize: 13, borderRadius: 1.5 } }} />
                            <TextField type="date" size="small" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} sx={{ width: 130 }} InputProps={{ sx: { fontSize: 13, borderRadius: 1.5 } }} />
                        </Box>
                    )}
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
                                {Object.entries(globalProvincesCache).length > 0 
                                    ? Object.entries(globalProvincesCache).map(([code, name]) => <MenuItem key={code} value={code} sx={{ fontSize: 13 }}>{name}</MenuItem>) 
                                    : PROVINCES.map(p => <MenuItem key={p.code} value={p.code} sx={{ fontSize: 13 }}>{p.name}</MenuItem>)}
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
                        {provinceFilter && <Chip size="small" label={getProvinceName(provinceFilter)} onDelete={() => setProvinceFilter('')} sx={{ bgcolor: '#e1f5fe', color: '#0277bd', fontWeight: 600 }} />}
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
                                    { label: 'Người tạo', width: 130 },
                                    { label: 'Tổng tiền', width: 110, align: 'right' },
                                    { label: 'Hình thức TT', width: 100 },
                                    { label: 'Thanh toán', width: 90, align: 'center' },
                                    { label: 'Trạng thái', width: 100, align: 'center' },
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
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(j => (
                                            <TableCell key={j}><Skeleton height={20} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order, idx) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                        idx={idx}
                                        page={page}
                                        PAGE_SIZE={PAGE_SIZE}
                                        onClick={handleRowClick}
                                        onAction={handleAction}
                                    />
                                ))
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
                onClose={handleCloseDetail}
                onStatusChange={handleStatusChange}
                onPrint={() => handlePrintOrder(detailOrder)}
            />

            {/* CREATE ORDER DIALOG */}
            <CreateOrderDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => { loadOrders(); setSnack({ message: 'Tạo đơn hàng thành công!', severity: 'success' }); }}
                warehouses={warehouses}
            />

            {/* PRINT INVOICE DIALOG */}
            {printInvoice?._source === 'ONLINE' ? (
                <PrintShippingLabelDialog
                    open={printOpen}
                    onClose={() => setPrintOpen(false)}
                    order={printInvoice}
                />
            ) : (
                <PrintInvoiceDialog
                    open={printOpen}
                    onClose={() => setPrintOpen(false)}
                    invoice={printInvoice}
                    cashierDisplayName={printInvoice?.cashierName || user?.fullName}
                />
            )}

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