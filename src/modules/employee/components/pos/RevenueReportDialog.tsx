// src/modules/employee/components/pos/RevenueReportDialog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography,
    IconButton, Button, Tabs, Tab, FormControl, Select,
    MenuItem, TextField, Skeleton, Divider, Paper, Chip,
    Table, TableBody, TableCell, TableHead, TableRow,
    Popover, TablePagination,
    CircularProgress,
} from '@mui/material';
import {
    Close, TrendingUp, ReceiptLong, Inventory2,
    AttachMoney, DateRange, Refresh, FilterList,
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import reportService from '../../../../services/reportService';
import axiosInstance from '../../../../services/axiosConfig';
import { RevenueDataPoint, ReportPeriod } from '../../../../types';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
};

interface Props {
    open: boolean;
    onClose: () => void;
    warehouseId?: string;
}

type TabMode = 'overview' | 'shift' | 'products';

const PERIOD_OPTIONS: { value: ReportPeriod | string; label: string; }[] = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'yesterday', label: 'Hôm qua' },
    { value: 'this_week', label: 'Tuần này' },
    { value: 'last_week', label: 'Tuần trước' },
    { value: 'this_month', label: 'Tháng này' },
    { value: 'last_month', label: 'Tháng trước' },
    { value: 'this_year', label: 'Năm nay' },
    { value: 'last_year', label: 'Năm trước' },
];

const COLOR_PALETTE = ['#1d4ed8', '#059669', '#d97706', '#7c3aed', '#dc2626'];

const PAYMENT_METHODS = [
    { label: 'Tất cả phương thức', value: '' },
    { label: 'Tiền mặt', value: 'CASH' },
    { label: 'Quẹt thẻ / Ví', value: 'CARD' },
    { label: 'Chuyển khoản', value: 'BANK_TRANSFER' },
    { label: 'Ví MoMo', value: 'MOMO' },
    { label: 'VNPay', value: 'VNPAY' },
];

const PAYMENT_MAP: Record<string, string> = {
    'CASH': 'Tiền mặt',
    'BANK_TRANSFER': 'Chuyển khoản',
    'CARD': 'Quẹt thẻ / Ví',
    'MOMO': 'Ví MoMo',
    'VNPAY': 'VNPay'
};

const RevenueReportDialog: React.FC<Props> = ({ open, onClose, warehouseId }) => {
    const [tab, setTab] = useState<TabMode>('overview');
    const [period, setPeriod] = useState<ReportPeriod | string>('today');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [useCustomDate, setUseCustomDate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [loadingShifts, setLoadingShifts] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
    const [paymentMethod, setPaymentMethodState] = useState('');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Tính date range mặc định
    const getDefaultRange = (p: string) => {
        const to = new Date();
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        if (p === 'today') {
            // Hôm nay
        } else if (p === 'yesterday') {
            from.setDate(from.getDate() - 1);
            to.setDate(to.getDate() - 1);
        } else if (p === 'this_week') {
            const day = from.getDay();
            const diff = from.getDate() - day + (day === 0 ? -6 : 1);
            from.setDate(diff);
        } else if (p === 'last_week') {
            const day = from.getDay();
            const diff = from.getDate() - day + (day === 0 ? -6 : 1);
            from.setDate(diff - 7);
            to.setDate(diff - 1);
        } else if (p === 'this_month') {
            from.setDate(1);
        } else if (p === 'last_month') {
            from.setMonth(from.getMonth() - 1);
            from.setDate(1);
            to.setDate(0);
            to.setHours(23, 59, 59, 999);
        } else if (p === 'this_year') {
            from.setMonth(0, 1);
        } else if (p === 'last_year') {
            from.setFullYear(from.getFullYear() - 1, 0, 1);
            to.setFullYear(to.getFullYear() - 1, 11, 31);
        }
        return { from: from.toISOString(), to: to.toISOString() };
    };

    const loadRevenue = useCallback(async () => {
        setLoading(true);
        try {
            let from: string, to: string;
            if (useCustomDate && dateFrom && dateTo) {
                from = new Date(dateFrom).toISOString();
                to = new Date(dateTo + 'T23:59:59').toISOString();
            } else {
                const range = getDefaultRange(period);
                from = range.from; to = range.to;
            }
            const data = await reportService.getRevenue({
                from, to,
                period: (useCustomDate || period !== 'month' && period !== 'year') ? 'day' : period as ReportPeriod,
                ...(warehouseId ? { warehouseId } : {}),
                paymentMethod: paymentMethod || undefined,
            });
            setRevenueData(data);

            // Load detailed invoices
            setLoadingInvoices(true);
            try {
                const invData = await reportService.getInvoices({ 
                    from, 
                    to, 
                    warehouseId, 
                    paymentMethod: paymentMethod || undefined,
                    page,
                    size: 10
                });
                setInvoices(invData.content || []);
                setTotalElements(invData.totalElements || 0);
            } catch { 
                setInvoices([]); 
                setTotalElements(0);
            }
            finally { setLoadingInvoices(false); }

        } catch { setRevenueData([]); }
        finally { setLoading(false); }
    }, [period, dateFrom, dateTo, useCustomDate, warehouseId, paymentMethod, page]);

    const loadTopProducts = useCallback(async () => {
        setLoadingProducts(true);
        try {
            let from: string, to: string;
            if (useCustomDate && dateFrom && dateTo) {
                from = new Date(dateFrom).toISOString();
                to = new Date(dateTo + 'T23:59:59').toISOString();
            } else {
                const range = getDefaultRange(period);
                from = range.from; to = range.to;
            }
            const data = await reportService.getTopProducts({
                from, to, limit: 10,
                ...(warehouseId ? { warehouseId } : {}),
                paymentMethod: paymentMethod || undefined
            });
            setTopProducts(data);
        } catch { setTopProducts([]); }
        finally { setLoadingProducts(false); }
    }, [period, dateFrom, dateTo, useCustomDate, warehouseId, paymentMethod]);

    const loadShifts = useCallback(async () => {
        setLoadingShifts(true);
        try {
            const res = await axiosInstance.get('/pos/shifts?page=0&size=20');
            setShifts(res.data?.data?.content ?? []);
        } catch { setShifts([]); }
        finally { setLoadingShifts(false); }
    }, []);

    useEffect(() => {
        if (open) {
            if (tab === 'overview') loadRevenue();
            if (tab === 'products') loadTopProducts();
            if (tab === 'shift') loadShifts();
        }
    }, [open, tab, period, useCustomDate, dateFrom, dateTo]);

    useEffect(() => {
        if (!open) { setTab('overview'); setPeriod('today'); setUseCustomDate(false); setDateFrom(''); setDateTo(''); }
    }, [open]);

    // Computed stats
    const totalRevenue = revenueData.reduce((s, d) => s + (d.revenue ?? 0), 0);
    const totalProfit = revenueData.reduce((s, d) => s + (d.gross_profit ?? 0), 0);
    const totalCOGS = revenueData.reduce((s, d) => s + (d.cogs ?? 0), 0);
    const totalInvoices = revenueData.reduce((s, d) => s + (d.invoice_count ?? 0), 0);
    const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    const chartData = revenueData.map(d => ({
        name: (() => {
            try {
                const dt = new Date(d.period ?? '');
                if (period === 'month') return dt.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
                if (period === 'year') return String(dt.getFullYear());
                return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            } catch { return d.period ?? ''; }
        })(),
        'Doanh thu': Math.round((d.revenue ?? 0) / 1_000_000),
        'Lợi nhuận': Math.round((d.gross_profit ?? 0) / 1_000_000),
        'Hóa đơn': d.invoice_count ?? 0,
    }));

    const StatCard: React.FC<{ label: string; value: string; sub?: string; color: string; bg: string }> = ({ label, value, sub, color, bg }) => (
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: bg, border: `1px solid ${color}22`, flex: 1 }}>
            <Typography variant="caption" color="#64748b" fontWeight={600} display="block" fontSize={10.5} letterSpacing={0.3}>{label}</Typography>
            {loading ? <Skeleton height={32} width={120} /> : (
                <>
                    <Typography fontWeight={800} color={color} fontSize={17} lineHeight={1.2}>{value}</Typography>
                    {sub && <Typography variant="caption" color="#94a3b8" fontSize={10.5}>{sub}</Typography>}
                </>
            )}
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, height: '90vh', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' } }}>

            {/* Header */}
            <Box sx={{ bgcolor: '#0f172a', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 38, height: 38, bgcolor: '#059669', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={800} color="#f1f5f9" fontSize={16}>Báo cáo Doanh thu</Typography>
                        <Typography variant="caption" color="#475569" fontSize={11}>Theo dõi doanh số và lợi nhuận</Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#64748b', '&:hover': { color: '#f1f5f9', bgcolor: '#1e293b' } }}><Close /></IconButton>
            </Box>

            {/* Tabs */}
            <Box sx={{ bgcolor: '#1e293b', px: 3, borderBottom: '1px solid #334155' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 12.5, color: '#64748b', minHeight: 44 },
                        '& .Mui-selected': { color: '#22c55e !important' },
                        '& .MuiTabs-indicator': { bgcolor: '#22c55e', height: 2 },
                    }}>
                    <Tab value="overview" label="Tổng quan doanh thu" icon={<TrendingUp sx={{ fontSize: 15 }} />} iconPosition="start" />
                    <Tab value="products" label="Top sản phẩm" icon={<Inventory2 sx={{ fontSize: 15 }} />} iconPosition="start" />
                    <Tab value="shift" label="Lịch sử ca" icon={<ReceiptLong sx={{ fontSize: 15 }} />} iconPosition="start" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* OVERVIEW TAB */}
                {tab === 'overview' && (
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0' } }}>
                        {/* Period selector - compact button + popover */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, alignItems: 'center' }}>
                            <Button size="small" startIcon={<FilterList sx={{ fontSize: 16 }} />}
                                onClick={e => setFilterAnchor(e.currentTarget)}
                                variant="outlined"
                                sx={{
                                    textTransform: 'none', fontSize: 12.5, fontWeight: 700,
                                    px: 2, py: 0.75, borderRadius: 2, borderColor: '#e2e8f0',
                                    color: '#334155', bgcolor: '#fff',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                                }}>
                                {useCustomDate ? `${dateFrom || '...'} → ${dateTo || '...'}` : PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Lọc theo doanh thu'}
                            </Button>
                            <Popover open={Boolean(filterAnchor)} anchorEl={filterAnchor}
                                onClose={() => setFilterAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                slotProps={{ paper: { sx: { mt: 0.75, borderRadius: 2.5, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', p: 2, width: 340 } } }}>
                                <Typography fontSize={12} fontWeight={700} color="#334155" mb={1.5}>Chọn khoảng thời gian</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mb: 2 }}>
                                    {PERIOD_OPTIONS.map(opt => (
                                        <Button key={opt.value} size="small" fullWidth
                                            onClick={() => { 
                                                setPeriod(opt.value as ReportPeriod); 
                                                setUseCustomDate(false); 
                                                setFilterAnchor(null); 
                                                setPage(0);
                                            }}
                                            variant={!useCustomDate && period === opt.value ? 'contained' : 'outlined'}
                                            sx={{
                                                textTransform: 'none', fontSize: 12, fontWeight: 600,
                                                py: 0.75, borderRadius: 1.5,
                                                bgcolor: !useCustomDate && period === opt.value ? '#1d4ed8' : 'transparent',
                                                borderColor: !useCustomDate && period === opt.value ? '#1d4ed8' : '#e2e8f0',
                                                color: !useCustomDate && period === opt.value ? '#fff' : '#64748b',
                                            }}>
                                            {opt.label}
                                        </Button>
                                    ))}
                                </Box>
                                <Divider sx={{ mb: 1.5 }} />
                                <Typography fontSize={11} fontWeight={600} color="#94a3b8" mb={1}>Phương thức thanh toán</Typography>
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                    <Select
                                        value={paymentMethod}
                                        onChange={e => { 
                                            setPaymentMethodState(e.target.value);
                                            setPage(0);
                                        }}
                                        displayEmpty
                                        sx={{ fontSize: 12, borderRadius: 1.5 }}
                                    >
                                        {PAYMENT_METHODS.map(m => (
                                            <MenuItem key={m.value} value={m.value} sx={{ fontSize: 12 }}>{m.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Divider sx={{ mb: 1.5 }} />
                                <Typography fontSize={11} fontWeight={600} color="#94a3b8" mb={1}>Hoặc chọn ngày cụ thể</Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField size="small" type="date" label="Từ" value={dateFrom}
                                        onChange={e => { setDateFrom(e.target.value); setUseCustomDate(true); setPage(0); }}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: 12 } }} />
                                    <TextField size="small" type="date" label="Đến" value={dateTo}
                                        onChange={e => { setDateTo(e.target.value); setUseCustomDate(true); setPage(0); }}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: 12 } }} />
                                </Box>
                                {(useCustomDate || paymentMethod !== '') && (
                                <Button size="small" variant="contained" fullWidth onClick={() => { setPage(0); loadRevenue(); setFilterAnchor(null); }}
                                        sx={{ mt: 1.5, textTransform: 'none', fontSize: 12, bgcolor: '#1d4ed8', fontWeight: 700, borderRadius: 1.5 }}>
                                        Áp dụng
                                    </Button>
                                )}
                            </Popover>
                            <Button size="small" startIcon={<Refresh sx={{ fontSize: 14 }} />} onClick={loadRevenue}
                                sx={{ textTransform: 'none', fontSize: 12, color: '#64748b', ml: 'auto' }}>
                                Làm mới
                            </Button>
                        </Box>

                        {/* Stat cards */}
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                            <StatCard label="DOANH THU" value={fmt(totalRevenue)} sub={`${totalInvoices.toLocaleString()} hóa đơn`} color="#1d4ed8" bg="#eff6ff" />
                            {/* Ẩn LỢI NHUẬN và GIÁ VỐN cho nhân viên */}
                            {/* <StatCard label="LỢI NHUẬN GỘP" value={fmt(totalProfit)} sub={`Biên LN: ${marginPct}%`} color="#059669" bg="#f0fdf4" />
                            <StatCard label="GIÁ VỐN" value={fmt(totalCOGS)} color="#d97706" bg="#fffbeb" /> */}
                            <StatCard label="SỐ HÓA ĐƠN" value={totalInvoices.toLocaleString()} sub={`TB: ${fmt(totalRevenue / Math.max(1, totalInvoices))}/HĐ`} color="#7c3aed" bg="#faf5ff" />
                        </Box>

                        {/* Chart */}
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={0.5} color="#1e293b">Biểu đồ doanh thu</Typography>
                            <Typography variant="caption" color="#94a3b8" display="block" mb={2} fontSize={11}>Đơn vị: Triệu VNĐ (M)</Typography>
                            {loading ? <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1 }} /> :
                                chartData.length === 0 ? (
                                    <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="#94a3b8" fontSize={13}>Không có dữ liệu trong khoảng thời gian này</Typography>
                                    </Box>
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                            <defs>
                                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                            <YAxis tickFormatter={v => fmtShort(v * 1_000_000)} tick={{ fontSize: 10.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                formatter={(v: any, name: string) => [
                                                    name === 'Hóa đơn' ? v : `${(v as number).toLocaleString('vi-VN')}M đ`,
                                                    name,
                                                ]}
                                                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                            <Area type="monotone" dataKey="Doanh thu" stroke="#1d4ed8" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                                            {/* Ẩn dòng lợi nhuận cho nhân viên */}
                                            {/* <Area type="monotone" dataKey="Lợi nhuận" stroke="#059669" strokeWidth={2} fill="url(#profGrad)" dot={false} /> */}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                        </Paper>

                        {/* Detail table (Invoice List) */}
                        {!loading && (
                            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <Box sx={{ px: 2.5, py: 1.25, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" fontWeight={700} color="#64748b" letterSpacing={0.3} fontSize={10.5}>DANH SÁCH HÓA ĐƠN</Typography>
                                    {loadingInvoices && <CircularProgress size={14} />}
                                </Box>
                                <Box sx={{ maxHeight: 300, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0' } }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 10.5, color: '#94a3b8', py: 1 } }}>
                                                <TableCell>Mã HĐ</TableCell>
                                                <TableCell>Thời gian</TableCell>
                                                <TableCell>Khách hàng</TableCell>
                                                <TableCell>Thanh toán</TableCell>
                                                <TableCell align="right">Tổng tiền</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invoices.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>Không có dữ liệu hóa đơn</TableCell>
                                                </TableRow>
                                            ) : invoices.map((inv, idx) => (
                                                <TableRow key={idx} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: '#1d4ed8' }}>{inv.code}</TableCell>
                                                    <TableCell sx={{ fontSize: 11 }}>{new Date(inv.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</TableCell>
                                                    <TableCell sx={{ fontSize: 11.5 }}>{inv.customerName || 'Khách lẻ'}</TableCell>
                                                    <TableCell>
                                                        {inv.payments?.map((p: any, i: number) => (
                                                            <Chip key={i} label={PAYMENT_MAP[p.method] || p.method} size="small" 
                                                                sx={{ height: 20, fontSize: 10, fontWeight: 700, mr: 0.5, bgcolor: '#f1f5f9', color: '#475569' }} />
                                                        ))}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 12.5, color: inv.type === 'RETURN' ? '#dc2626' : '#1e293b' }}>
                                                        {inv.type === 'RETURN' ? '-' : ''}{fmt(inv.finalAmount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                                <TablePagination
                                    component="div"
                                    count={totalElements}
                                    page={page}
                                    onPageChange={(e, newPage) => setPage(newPage)}
                                    rowsPerPage={10}
                                    rowsPerPageOptions={[10]}
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                                />
                            </Paper>
                        )}
                    </Box>
                )}

                {/* TOP PRODUCTS TAB */}
                {tab === 'products' && (
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0' } }}>
                        {/* Period selector */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, alignItems: 'center' }}>
                            <Button size="small" startIcon={<FilterList sx={{ fontSize: 16 }} />}
                                onClick={e => setFilterAnchor(e.currentTarget)}
                                variant="outlined"
                                sx={{
                                    textTransform: 'none', fontSize: 12.5, fontWeight: 700,
                                    px: 2, py: 0.75, borderRadius: 2, borderColor: '#e2e8f0',
                                    color: '#334155', bgcolor: '#fff',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                                }}>
                                {useCustomDate ? `${dateFrom || '...'} → ${dateTo || '...'}` : PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Lọc'}
                            </Button>
                        </Box>

                        {loadingProducts ? (
                            [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={56} sx={{ mb: 1, borderRadius: 1.5 }} />)
                        ) : topProducts.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Inventory2 sx={{ fontSize: 52, color: '#e2e8f0', mb: 1.5 }} />
                                <Typography color="#94a3b8" fontSize={13}>Không có dữ liệu sản phẩm</Typography>
                            </Box>
                        ) : (
                            <Box>
                                {/* Bar chart */}
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', mb: 2.5 }}>
                                    <Typography variant="subtitle2" fontWeight={700} mb={2} color="#1e293b">Top 10 sản phẩm bán chạy</Typography>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={topProducts.slice(0, 10).map(p => ({ name: p.name?.slice(0, 20) + (p.name?.length > 20 ? '...' : ''), sold: p.total_sold }))} layout="vertical" margin={{ left: 8, right: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis type="number" tick={{ fontSize: 10.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                            <Bar dataKey="sold" name="Đã bán" radius={[0, 4, 4, 0]}>
                                                {topProducts.slice(0, 10).map((_, i) => (
                                                    <Cell key={i} fill={COLOR_PALETTE[i % COLOR_PALETTE.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>

                                {/* Table */}
                                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10.5, color: '#94a3b8', width: 40, py: 1 }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10.5, color: '#94a3b8', py: 1 }}>SẢN PHẨM</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 10.5, color: '#94a3b8', py: 1 }}>ĐÃ BÁN</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {topProducts.map((p, idx) => (
                                                <TableRow key={idx} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: idx < 3 ? COLOR_PALETTE[idx] : '#f1f5f9', color: idx < 3 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                                                            {idx + 1}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 12.5, fontWeight: 600, py: 1.25 }}>{p.name}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13, color: COLOR_PALETTE[idx % COLOR_PALETTE.length], py: 1.25 }}>{p.total_sold?.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                )}

                {/* SHIFT HISTORY TAB */}
                {tab === 'shift' && (
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Lịch sử ca làm việc</Typography>
                            <Button size="small" startIcon={<Refresh sx={{ fontSize: 14 }} />} onClick={loadShifts}
                                sx={{ textTransform: 'none', fontSize: 12, color: '#64748b' }}>Làm mới</Button>
                        </Box>

                        {loadingShifts ? (
                            [1, 2, 3].map(i => <Skeleton key={i} height={72} sx={{ mb: 1, borderRadius: 1.5 }} />)
                        ) : shifts.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <ReceiptLong sx={{ fontSize: 52, color: '#e2e8f0', mb: 1.5 }} />
                                <Typography color="#94a3b8" fontSize={13}>Chưa có ca làm việc</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                {shifts.map((shift: any, idx: number) => {
                                    const statusInfo = shift.status === 'OPEN' ? { label: 'Đang mở', color: '#22c55e', bg: '#dcfce7' } :
                                        shift.status === 'CLOSED' ? { label: 'Đã đóng', color: '#64748b', bg: '#f1f5f9' } :
                                            { label: 'Đã duyệt', color: '#1d4ed8', bg: '#dbeafe' };
                                    return (
                                        <Box key={shift.id} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#fff', '&:hover': { borderColor: '#2563eb', bgcolor: '#f8fafc' }, transition: 'all 0.12s' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography fontFamily="monospace" fontWeight={700} color="#1d4ed8" fontSize={12.5}>Ca #{shift.id?.slice(0, 8).toUpperCase()}</Typography>
                                                        <Chip label={statusInfo.label} size="small"
                                                            sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: statusInfo.bg, color: statusInfo.color }} />
                                                    </Box>
                                                    <Typography variant="caption" color="#64748b" fontSize={11}>
                                                        {shift.openedAt ? new Date(shift.openedAt).toLocaleString('vi-VN') : ''}
                                                        {shift.closedAt ? ` → ${new Date(shift.closedAt).toLocaleString('vi-VN')}` : ''}
                                                    </Typography>
                                                    <Typography variant="caption" color="#94a3b8" display="block" fontSize={10.5}>
                                                        Tiền đầu ca: {fmt(shift.startingCash)}
                                                        {shift.reportedCash ? ` · Kết ca: ${fmt(shift.reportedCash)}` : ''}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    {shift.totalRevenue != null && (
                                                        <>
                                                            <Typography fontWeight={800} color="#15803d" fontSize={14}>{fmt(shift.totalRevenue)}</Typography>
                                                            <Typography variant="caption" color="#94a3b8" fontSize={10.5}>{shift.invoiceCount || 0} hóa đơn</Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RevenueReportDialog;