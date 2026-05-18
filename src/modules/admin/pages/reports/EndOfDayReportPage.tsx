// src/modules/admin/pages/reports/EndOfDayReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button,
    Select, MenuItem, FormControl, Skeleton, Paper,
    CircularProgress, Alert, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, SelectChangeEvent
} from '@mui/material';
import {
    Refresh
} from '@mui/icons-material';

import reportService from '../../../../services/reportService';
import warehouseService from '../../../../services/warehouseService';
import type { Warehouse, InvoiceResponse } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────
const toISO = (d: Date) => d.toISOString();

const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from: Date;
    let to = new Date();
    switch (filter) {
        case 'today':
            from = today; break;
        case 'yesterday':
            from = new Date(today.getTime() - 86400000);
            to = today; break;
        case 'last7days': case '7days':
            from = new Date(today.getTime() - 7 * 86400000); break;
        case '30days':
            from = new Date(today.getTime() - 30 * 86400000); break;
        case '90days':
            from = new Date(today.getTime() - 90 * 86400000); break;
        case 'thisMonth':
            from = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'thisYear': case '1year':
            from = new Date(now.getFullYear(), 0, 1); break;
        default:
            from = today;
    }
    return { from, to };
};

// ─── Components ────────────────────────────────────────────────
const MetricCard = ({ title, value, valueColor = '#333', loading }: any) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 1.5 }}>
        <CardContent sx={{ p: '16px !important', textAlign: 'center' }}>
            <Typography variant="body2" color="#8c8c8c" fontWeight={600} mb={1}>
                {title}
            </Typography>
            {loading ? <Skeleton width="60%" height={32} sx={{ mx: 'auto' }} /> : (
                <Typography variant="h6" fontWeight={800} color={valueColor}>
                    {value}
                </Typography>
            )}
        </CardContent>
    </Card>
);

const PaymentBlock = ({ title, value, bgColor, loading }: any) => (
    <Box sx={{ bgcolor: bgColor, borderRadius: 2, p: 2, flex: 1, minWidth: 150 }}>
        <Typography variant="body2" color="#666" fontWeight={600} mb={0.5}>{title}</Typography>
        {loading ? <Skeleton width="80%" /> : <Typography variant="subtitle1" fontWeight={800} color="#111">{value}</Typography>}
    </Box>
);

const getPaymentMethodLabel = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m === 'cash' || m.includes('tiền mặt')) return 'Tiền mặt';
    if (m === 'bank_transfer' || m.includes('chuyển khoản')) return 'Chuyển khoản';
    if (m === 'card' || m.includes('thẻ')) return 'Thẻ POS';
    if (m === 'e_wallet' || m === 'momo' || m === 'vnpay' || m.includes('ví')) return 'Ví điện tử';
    if (m === 'points' || m.includes('điểm')) return 'Điểm tích lũy';
    return method || 'Tiền mặt';
};

const isPaymentCash = (method: string) => {
    const m = (method || '').toLowerCase();
    return m === 'cash' || m.includes('tiền mặt');
};
const isPaymentTransfer = (method: string) => {
    const m = (method || '').toLowerCase();
    return m === 'bank_transfer' || m.includes('chuyển khoản');
};
const isPaymentCard = (method: string) => {
    const m = (method || '').toLowerCase();
    return m === 'card' || m.includes('thẻ');
};
const isPaymentEwallet = (method: string) => {
    const m = (method || '').toLowerCase();
    return m === 'e_wallet' || m === 'momo' || m === 'vnpay' || m.includes('ví');
};

// ─── Main Component ────────────────────────────────────────────
const EndOfDayReportPage: React.FC = () => {
    const [warehouseId, setWarehouseId] = useState<string>('');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [quickFilter, setQuickFilter] = useState<string>('yesterday'); // default to yesterday to match screenshot example

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const fetchData = useCallback(async (filter = quickFilter) => {
        setLoading(true);
        setError('');
        try {
            const { from, to } = getDateRange(filter);
            // Lấy nhiều invoices để tổng hợp (size=200)
            const invoiceRes = await reportService.getInvoices({
                from: toISO(from), to: toISO(to),
                size: 200,
                ...(warehouseId ? { warehouseId } : {}),
            });
            setInvoices(invoiceRes.content || []);
        } catch (e) {
            console.error(e);
            setError('Không thể tải báo cáo cuối ngày');
        } finally {
            setLoading(false);
        }
    }, [warehouseId, quickFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleQuickFilterChange = (e: SelectChangeEvent) => {
        setQuickFilter(e.target.value);
        fetchData(e.target.value);
    };

    // Calculate metrics
    const validInvoices = invoices.filter(inv => inv.type === 'SALE');
    const returnInvoices = invoices.filter(inv => inv.type === 'RETURN');
    const voidInvoices = invoices.filter(inv => inv.type === 'VOIDED');

    const totalRevenue = validInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
    // Tính giá vốn = sum(macPrice * quantity) từ items của mỗi hóa đơn
    const totalCOGS = validInvoices.reduce((sum, inv) => {
        const invCogs = inv.items?.reduce((s, item) => s + ((item.macPrice ?? 0) * Math.abs(item.quantity)), 0) || 0;
        return sum + invCogs;
    }, 0);
    const profit = totalRevenue - totalCOGS;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Payment breakdown
    let cashTotal = 0;
    let transferTotal = 0;
    let posTotal = 0;
    let ewalletTotal = 0;

    validInvoices.forEach(inv => {
        if (inv.payments && inv.payments.length > 0) {
            inv.payments.forEach(payment => {
                const m = String(payment.method || '');
                if (isPaymentCash(m)) cashTotal += payment.amount;
                else if (isPaymentTransfer(m)) transferTotal += payment.amount;
                else if (isPaymentCard(m)) posTotal += payment.amount;
                else if (isPaymentEwallet(m)) ewalletTotal += payment.amount;
                else cashTotal += payment.amount; // fallback
            });
        }
    });

    const { from, to } = getDateRange(quickFilter);
    const dateRangeStr = `${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}`;

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: '20px 24px' }}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, p: 2.5, mb: 3, border: '1px solid #f0f0f0' }}>
                        <Typography fontWeight={700} fontSize={14} color="#111" mb={2}>Thời gian báo cáo</Typography>

                        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                            <Select value={quickFilter} onChange={handleQuickFilterChange} sx={{ fontSize: 14, borderRadius: 1.5, bgcolor: '#f8f9fa' }}>
                                <MenuItem value="today">Hôm nay</MenuItem>
                                <MenuItem value="yesterday">Hôm qua</MenuItem>
                                <MenuItem value="last7days">7 ngày qua</MenuItem>
                                <MenuItem value="30days">30 ngày qua</MenuItem>
                                <MenuItem value="thisMonth">Tháng này</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', mb: 2 }}>
                            <Typography variant="body2" color="#666" fontSize={13}>{dateRangeStr}</Typography>
                        </Box>

                        {/* Thêm Lọc Kho ở đây */}
                        <Typography variant="body2" color="#666" fontSize={13} mb={1}>Chi nhánh / Kho</Typography>
                        <FormControl size="small" fullWidth sx={{ mb: 3 }}>
                            <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty sx={{ fontSize: 14, borderRadius: 1.5 }}>
                                <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<Refresh />}
                            onClick={() => { setQuickFilter('yesterday'); setWarehouseId(''); }}
                            sx={{ color: '#666', borderColor: '#e0e0e0', textTransform: 'none', borderRadius: 1.5 }}
                        >
                            Xóa bộ lọc
                        </Button>
                    </Paper>
                </Grid>

                {/* Right Column */}
                <Grid size={{ xs: 12, md: 9 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff' }}>

                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Box>
                                <Typography variant="h5" fontWeight={800} mb={0.5}>Chốt ca cuối ngày</Typography>
                                <Typography variant="body2" color="#8c8c8c">Tổng hợp doanh thu, đối soát tiền mặt và hình thức thanh toán theo ngày</Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={() => fetchData()}
                                sx={{ borderRadius: 2, textTransform: 'none', color: '#333', borderColor: '#d9d9d9' }}
                            >
                                Làm mới
                            </Button>
                        </Box>

                        {/* Top Metrics Grid */}
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Đơn hoàn tất" value={validInvoices.length} loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Đơn hủy" value={voidInvoices.length} valueColor="#d32f2f" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Trả hàng" value={returnInvoices.length} valueColor="#ed6c02" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Tổng số đơn" value={invoices.length} loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Doanh thu" value={formatCurrency(totalRevenue)} valueColor="#1976d2" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Vốn hàng" value={formatCurrency(totalCOGS)} valueColor="#ed6c02" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Lợi nhuận" value={formatCurrency(profit)} valueColor="#2e7d32" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                                <MetricCard title="Tỷ suất LN" value={`${profitMargin.toFixed(1)}%`} valueColor="#9c27b0" loading={loading} />
                            </Grid>
                        </Grid>

                        {/* Payment Details */}
                        <Typography variant="subtitle2" fontWeight={700} mb={2}>Chi tiết thanh toán</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                            <PaymentBlock title="Tiền mặt" value={formatCurrency(cashTotal)} bgColor="#e3f2fd" loading={loading} />
                            <PaymentBlock title="Chuyển khoản" value={formatCurrency(transferTotal)} bgColor="#e8f5e9" loading={loading} />
                            <PaymentBlock title="Thẻ POS" value={formatCurrency(posTotal)} bgColor="#f3e5f5" loading={loading} />
                            <PaymentBlock title="Ví điện tử" value={formatCurrency(ewalletTotal)} bgColor="#fff8e1" loading={loading} />
                        </Box>

                        {/* Invoice List */}
                        <Typography variant="subtitle2" fontWeight={700} mb={2}>Danh sách đơn hàng trong ngày</Typography>
                        <TableContainer sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Mã đơn</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Thời gian</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Khách hàng</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Thanh toán</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Trạng thái</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }} align="right">Tổng tiền</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }} align="right">Lợi nhuận</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                    ) : invoices.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#888' }}>Không có giao dịch nào</TableCell></TableRow>
                                    ) : (
                                        invoices.map(inv => {
                                            // Tính giá vốn từ items (macPrice * quantity)
                                            const invCogs = inv.items?.reduce((s, item) => s + ((item.macPrice ?? 0) * Math.abs(item.quantity)), 0) || 0;
                                            const invProfit = inv.type === 'SALE' ? inv.finalAmount - invCogs : 0;
                                            const primaryPayment = String(inv.payments?.[0]?.method || 'Tiền mặt');

                                            return (
                                                <TableRow key={inv.id} hover>
                                                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{inv.code}</TableCell>
                                                    <TableCell sx={{ fontSize: 13 }}>
                                                        {new Date(inv.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} {new Date(inv.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 13 }}>{inv.customerName || 'Khách lẻ'}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" sx={{ color: '#1976d2', bgcolor: '#e3f2fd', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                                                            {getPaymentMethodLabel(primaryPayment)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" sx={{ color: inv.type === 'SALE' ? '#2e7d32' : inv.type === 'VOIDED' ? '#d32f2f' : '#ed6c02', fontWeight: 600 }}>
                                                            {inv.type === 'SALE' ? 'Hoàn tất' : inv.type === 'VOIDED' ? 'Đã hủy' : 'Trả hàng'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600, color: inv.type === 'VOIDED' ? '#888' : 'inherit', textDecoration: inv.type === 'VOIDED' ? 'line-through' : 'none' }}>
                                                        {formatCurrency(inv.finalAmount)}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600, color: invProfit > 0 ? '#2e7d32' : 'inherit' }}>
                                                        {inv.type === 'SALE' ? formatCurrency(invProfit) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EndOfDayReportPage;
