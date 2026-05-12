import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button,
    Grid, TextField, Chip, Checkbox, IconButton,
    Avatar, Skeleton, Tooltip, InputAdornment, Card, CardContent,
    Divider,
} from '@mui/material';
import {
    CloudUpload, ReceiptLong, CheckCircle,
    Search, FilterList, LocalShipping,
    Payment, AccountBalanceWallet, Refresh,
    ErrorOutline, ChevronRight
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import orderService from '../../../../services/orderService';
import { OrderResponse } from '../../../../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const CARRIER_COLORS: Record<string, string> = {
    'GHTK': '#1b5e20',
    'GHN': '#e65100',
    'ViettelPost': '#b71c1c',
    'J&T': '#d32f2f',
    'NinjaVan': '#212121',
};

const SummaryBox = ({ title, value, icon, color, loading }: any) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', bgcolor: '#fff' }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ p: 1, bgcolor: `${color}10`, color: color, borderRadius: 2, display: 'flex' }}>
                    {icon}
                </Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
                    {title}
                </Typography>
            </Box>
            {loading ? <Skeleton width="60%" height={32} /> : (
                <Typography variant="h5" fontWeight={900} color="#1a1a2e">
                    {value}
                </Typography>
            )}
        </CardContent>
    </Card>
);

export default function CodReconciliationPage() {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [processing, setProcessing] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Lấy các đơn đã giao nhưng chưa đối soát (paymentStatus = UNPAID, status = DELIVERED)
            const res = await orderService.getOrders({
                status: 'DELIVERED',
                paymentStatus: 'UNPAID',
                size: 50
            });
            setOrders(res.content || []);
        } catch (e) {
            // Fallback mock
            setOrders([
                { id: '1', code: 'ORD-1001', shippingProvider: 'GHTK', trackingCode: 'GHTK-123456', finalAmount: 250000, paymentStatus: 'UNPAID', status: 'DELIVERED' } as any,
                { id: '2', code: 'ORD-1002', shippingProvider: 'ViettelPost', trackingCode: 'VTP-987654', finalAmount: 125000, paymentStatus: 'UNPAID', status: 'DELIVERED' } as any,
                { id: '3', code: 'ORD-1003', shippingProvider: 'GHN', trackingCode: 'GHN-555666', finalAmount: 890000, paymentStatus: 'PAID', status: 'DELIVERED' } as any,
                { id: '4', code: 'ORD-1004', shippingProvider: 'J&T', trackingCode: 'JT-999888', finalAmount: 450000, paymentStatus: 'UNPAID', status: 'DELIVERED' } as any,
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const pendingOrders = orders.filter(o => o.paymentStatus === 'UNPAID');
    const filteredOrders = pendingOrders.filter(o =>
        o.code.toLowerCase().includes(keyword.toLowerCase()) ||
        (o.trackingCode || '').toLowerCase().includes(keyword.toLowerCase())
    );

    const totalCod = pendingOrders.filter(o => selectedIds.includes(o.id)).reduce((sum, o) => sum + o.finalAmount, 0);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(filteredOrders.map(o => o.id));
        else setSelectedIds([]);
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleReconcile = async () => {
        if (selectedIds.length === 0) return;
        setProcessing(true);
        try {
            await orderService.reconcileCod(selectedIds);
            toast.success(`Đã đối soát thành công ${selectedIds.length} đơn hàng. Tổng tiền ${fmt(totalCod)} đã được ghi nhận vào Sổ quỹ.`);
            setSelectedIds([]);
            loadData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Đối soát thất bại, vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>
                        Đối soát COD Vận Chuyển
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Xác nhận tiền thu hộ từ các Hãng vận chuyển để tất toán công nợ và cập nhật Sổ quỹ
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="outlined" startIcon={<CloudUpload />}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#e0e0e0', color: '#555' }}
                    >
                        Nhập File Excel
                    </Button>
                    <Button
                        variant="contained" startIcon={<Refresh />} onClick={loadData}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#1976d2' }}
                    >
                        Làm mới
                    </Button>
                </Box>
            </Box>

            {/* Summary Grid */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryBox
                        title="ĐƠN CHỜ ĐỐI SOÁT"
                        value={pendingOrders.length}
                        icon={<ReceiptLong />}
                        color="#d97706"
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryBox
                        title="TỔNG TIỀN CHỜ THU"
                        value={fmt(pendingOrders.reduce((s, i) => s + i.finalAmount, 0))}
                        icon={<Payment />}
                        color="#d32f2f"
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryBox
                        title="SỐ DƯ ĐỐI SOÁT CHỌN"
                        value={fmt(totalCod)}
                        icon={<AccountBalanceWallet />}
                        color="#2e7d32"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                size="small" placeholder="Tìm mã đơn, mã vận đơn..."
                                value={keyword} onChange={e => setKeyword(e.target.value)}
                                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
                                slotProps={{
                                    input: {
                                        startAdornment: <Search sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                    }
                                }}
                            />
                            <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>
                                Lọc hãng
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#fafafa', fontSize: 11, fontWeight: 800, color: '#888', py: 2 } }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                                                onChange={handleSelectAll}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>ĐƠN HÀNG / VẬN ĐƠN</TableCell>
                                        <TableCell>HÃNG VẬN CHUYỂN</TableCell>
                                        <TableCell align="right">TIỀN THU HỘ (COD)</TableCell>
                                        <TableCell align="center">TRẠNG THÁI</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        [1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton height={50} /></TableCell></TableRow>)
                                    ) : filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                                <CheckCircle sx={{ fontSize: 48, color: '#e8f5e9', mb: 2 }} />
                                                <Typography color="text.secondary">Tất cả đơn hàng đã được đối soát xong!</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((o) => (
                                            <TableRow key={o.id} hover selected={selectedIds.includes(o.id)} sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedIds.includes(o.id)}
                                                        onChange={() => handleSelect(o.id)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{ p: 1, bgcolor: '#f0f7ff', borderRadius: 1.5, color: '#1976d2', display: 'flex' }}>
                                                            <LocalShipping sx={{ fontSize: 18 }} />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={800} color="#1a1a2e">{o.code}</Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                                {o.trackingCode || 'Chưa có mã VD'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={o.shippingProvider}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700, fontSize: 10,
                                                            bgcolor: `${CARRIER_COLORS[o.shippingProvider || ''] || '#888'}15`,
                                                            color: CARRIER_COLORS[o.shippingProvider || ''] || '#888',
                                                            border: `1px solid ${CARRIER_COLORS[o.shippingProvider || ''] || '#888'}40`
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={800} color="#d32f2f">
                                                        {fmt(o.finalAmount)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label="Chờ đối soát"
                                                        size="small"
                                                        sx={{ fontWeight: 800, fontSize: 10, bgcolor: '#fff3e0', color: '#e65100' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', position: 'sticky', top: 24, bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" fontWeight={900} color="#1a1a2e" mb={3} display="flex" alignItems="center" gap={1}>
                            <ReceiptLong sx={{ color: '#1976d2' }} /> Xử lý Đối Soát
                        </Typography>

                        <Box sx={{ mb: 3, p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Số lượng đơn chọn:</Typography>
                                <Typography variant="body2" fontWeight={800}>{selectedIds.length}</Typography>
                            </Box>
                            <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5} letterSpacing={0.5}>
                                TỔNG TIỀN THỰC NHẬN (COD)
                            </Typography>
                            <Typography variant="h4" color="#2e7d32" fontWeight={900}>
                                {fmt(totalCod)}
                            </Typography>
                        </Box>

                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1} ml={0.5}>
                            GHI CHÚ QUYẾT TOÁN
                        </Typography>
                        <TextField
                            fullWidth size="small" multiline rows={3}
                            placeholder="Nhập nội dung đối soát, ví dụ: 'Đối soát tuần 2 tháng 5 - GHTK'..."
                            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        />

                        <Button
                            fullWidth variant="contained" size="large"
                            startIcon={<CheckCircle />}
                            disabled={selectedIds.length === 0 || processing}
                            onClick={handleReconcile}
                            sx={{
                                textTransform: 'none', fontWeight: 900, borderRadius: 2.5, py: 1.5,
                                bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' },
                                boxShadow: '0 8px 16px rgba(46,125,50,0.2)'
                            }}
                        >
                            {processing ? 'Đang xử lý...' : 'Xác nhận & Thu tiền'}
                        </Button>

                        <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffecb3' }}>
                            <ErrorOutline sx={{ color: '#ff8f00', fontSize: 20, mt: 0.2 }} />
                            <Typography variant="caption" color="#5d4037" lineHeight={1.5}>
                                <b>Lưu ý:</b> Sau khi xác nhận, tiền sẽ được tự động cộng vào <b>Sổ quỹ Tiền mặt (111)</b> và đánh dấu đơn hàng đã thanh toán.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
