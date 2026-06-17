// src/modules/admin/pages/reports/EndOfDayReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button,
    Select, MenuItem, FormControl, Skeleton, Paper,
    CircularProgress, Alert, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, SelectChangeEvent,
    TablePagination, TextField
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import reportService from '../../../../services/reportService';
import warehouseService from '../../../../services/warehouseService';
import userService from '../../../../services/userService';
import { useAuth } from '../../../../store/hooks/useAuth';
import type { Warehouse, UserResponse } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────
const toISO = (d: Date) => d.toISOString();

const getDateRange = (filter: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from: Date;
    let to = new Date();

    if (filter === 'custom' && customStart && customEnd) {
        from = new Date(customStart);
        to = new Date(customEnd);
        to.setHours(23, 59, 59, 999);
        return { from, to };
    }

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
            {loading ? <Skeleton width="60%" height={28} sx={{ mx: 'auto' }} /> : (
                <Typography variant="subtitle1" fontSize={18} fontWeight={800} color={valueColor}>
                    {value}
                </Typography>
            )}
        </CardContent>
    </Card>
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

// ─── Main Component ────────────────────────────────────────────
const EndOfDayReportPage: React.FC = () => {
    const { user: currentUser, isAdmin } = useAuth();

    const [warehouseId, setWarehouseId] = useState<string>('');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [cashierId, setCashierId] = useState<string>('');
    const [cashiers, setCashiers] = useState<UserResponse[]>([]);

    const [quickFilter, setQuickFilter] = useState<string>('yesterday'); 
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        if (isAdmin) {
            warehouseService.getAll().then(setWarehouses).catch(() => { });
        } else {
            userService.getAll({ warehouseId: currentUser?.warehouseId }).then(setCashiers).catch(() => {});
        }
    }, [isAdmin, currentUser?.warehouseId]);

    const handleQuickFilterChange = (e: SelectChangeEvent) => {
        setQuickFilter(e.target.value);
        setPage(0);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const { from, to } = React.useMemo(() => getDateRange(quickFilter, customStartDate, customEndDate), [quickFilter, customStartDate, customEndDate]);
    const dateRangeStr = `${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}`;

    const queryParams = React.useMemo(() => ({
        from: toISO(from),
        to: toISO(to),
        warehouseId: warehouseId && isAdmin ? warehouseId : undefined,
        cashierId: cashierId && !isAdmin ? cashierId : undefined,
    }), [from, to, warehouseId, isAdmin, cashierId]);

    // ── 1. Fetch Revenue Summary (Parallel) ──
    const { data: revenueData = [], isFetching: loadingRevenue, refetch: refetchRevenue, error: errorRevenue } = useQuery({
        queryKey: ['report-revenue', queryParams, quickFilter],
        queryFn: () => reportService.getRevenue({
            ...queryParams,
            period: ['thisYear', '1year'].includes(quickFilter) ? 'month' : 'day'
        }),
    });

    // ── 2. Fetch Invoices List (Parallel, Server-side pagination) ──
    // Đã bỏ hardcode size=200, chuyển sang phân trang thực sự
    const { data: invoicesData, isFetching: loadingInvoices, refetch: refetchInvoices, error: errorInvoices } = useQuery({
        queryKey: ['report-invoices', queryParams, page, rowsPerPage],
        queryFn: () => reportService.getInvoices({
            ...queryParams,
            page,
            size: rowsPerPage,
        }),
    });

    const loading = loadingRevenue || loadingInvoices;
    const error = errorRevenue || errorInvoices ? 'Không thể tải báo cáo' : '';

    // ── LÝ DO XÓA .reduce(): 
    // Trước đây data bị cắt ở 200 records do hardcode size=200, 
    // làm cho sum bằng JS bị sai hoàn toàn với dữ liệu lớn.
    // Hiện tại lấy đúng dữ liệu aggregate từ backend API.
    const totalRevenue = revenueData.reduce((sum, item: any) => sum + (item.revenue || 0), 0);
    const totalCOGS = revenueData.reduce((sum, item: any) => sum + (item.cogs || 0), 0);
    const profit = revenueData.reduce((sum, item: any) => sum + (item.gross_profit || 0), 0);
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const totalInvoicesCount = revenueData.reduce((sum, item: any) => sum + (item.invoice_count || 0), 0);

    // ── Chart Data Preparation ──
    const barData = revenueData.map((item: any) => {
        const d = new Date(item.period);
        let name = '';
        if (['thisYear', '1year'].includes(quickFilter)) {
            name = `T${d.getMonth() + 1}`;
        } else {
            name = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        return {
            name,
            revenue: item.revenue || 0,
            gross_profit: item.gross_profit || 0,
        };
    });

    const invoices = invoicesData?.content || [];
    const totalElements = invoicesData?.totalElements || 0;

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: '20px 24px' }}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error as string}</Alert>}

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid size={{ xs: 12, md: 3 }} sx={{ position: 'sticky', top: 100, alignSelf: 'flex-start', zIndex: 10 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2.5, mb: 3, border: '1px solid #f0f0f0' }}>
                            <Typography fontWeight={700} fontSize={14} color="#111" mb={2}>Thời gian báo cáo</Typography>

                        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                            <Select value={quickFilter} onChange={handleQuickFilterChange} sx={{ fontSize: 14, borderRadius: 1.5, bgcolor: '#f8f9fa' }}>
                                <MenuItem value="today">Hôm nay</MenuItem>
                                <MenuItem value="yesterday">Hôm qua</MenuItem>
                                <MenuItem value="last7days">7 ngày qua</MenuItem>
                                <MenuItem value="30days">30 ngày qua</MenuItem>
                                <MenuItem value="thisMonth">Tháng này</MenuItem>
                                <MenuItem value="thisYear">Năm nay</MenuItem>
                                <MenuItem value="custom">Tùy chọn</MenuItem>
                            </Select>
                        </FormControl>

                        {quickFilter === 'custom' && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={e => { setCustomStartDate(e.target.value); setPage(0); }}
                                    style={{ flex: 1, minWidth: 0, width: '100%', padding: '7.5px 6px', borderRadius: '6px', border: '1px solid #c4c4c4', fontSize: '13px', fontFamily: 'inherit', color: '#333', outline: 'none' }}
                                />
                                <Typography fontSize={13} color="#999" sx={{ flexShrink: 0 }}>→</Typography>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={e => { setCustomEndDate(e.target.value); setPage(0); }}
                                    style={{ flex: 1, minWidth: 0, width: '100%', padding: '7.5px 6px', borderRadius: '6px', border: '1px solid #c4c4c4', fontSize: '13px', fontFamily: 'inherit', color: '#333', outline: 'none' }}
                                />
                            </Box>
                        )}

                        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', mb: 2 }}>
                            <Typography variant="body2" color="#666" fontSize={13}>{dateRangeStr}</Typography>
                        </Box>

                        {isAdmin && (
                            <>
                                <Typography variant="body2" color="#666" fontSize={13} mb={1}>Chi nhánh / Kho</Typography>
                                <FormControl size="small" fullWidth sx={{ mb: 3 }}>
                                    <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty sx={{ fontSize: 14, borderRadius: 1.5 }}>
                                        <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                        {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </>
                        )}
                        {!isAdmin && (
                            <>
                                <Typography variant="body2" color="#666" fontSize={13} mb={1}>Nhân viên</Typography>
                                <FormControl size="small" fullWidth sx={{ mb: 3 }}>
                                    <Select value={cashierId} onChange={e => setCashierId(e.target.value)} displayEmpty sx={{ fontSize: 14, borderRadius: 1.5 }}>
                                        <MenuItem value="">Tất cả nhân viên</MenuItem>
                                        {cashiers.map(c => <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<Refresh />}
                            onClick={() => { setQuickFilter('yesterday'); setWarehouseId(''); setPage(0); }}
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800} mb={0.25} color="#1e293b">Chốt ca cuối ngày</Typography>
                                <Typography variant="body2" color="#64748b">Tổng hợp doanh thu, đối soát tiền mặt và hình thức thanh toán</Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={() => { refetchRevenue(); refetchInvoices(); }}
                                sx={{ borderRadius: 2, textTransform: 'none', color: '#333', borderColor: '#d9d9d9' }}
                            >
                                Làm mới
                            </Button>
                        </Box>

                        {/* Top Metrics Grid */}
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 6, sm: 4, lg: 3 }}>
                                <MetricCard title="Tổng số đơn" value={totalInvoicesCount} loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 3 }}>
                                <MetricCard title="Doanh thu" value={formatCurrency(totalRevenue)} valueColor="#1976d2" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 3 }}>
                                <MetricCard title="Vốn hàng" value={formatCurrency(totalCOGS)} valueColor="#ed6c02" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4, lg: 3 }}>
                                {/* Đã sửa label Lợi nhuận -> Lợi nhuận gộp */}
                                <MetricCard title="Lợi nhuận gộp" value={formatCurrency(profit)} valueColor="#2e7d32" loading={loading} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="#9c27b0" display="block" textAlign="right">Tỷ suất lợi nhuận gộp: {profitMargin.toFixed(1)}%</Typography>
                            </Grid>
                        </Grid>

                        {/* Payment Details */}
                        {/* TODO: Cần API aggregate payment breakdown từ Backend vì lấy client-side chỉ tính được trên 1 page, dẫn đến sai số liệu */}
                        {/* <Typography variant="subtitle2" fontWeight={700} mb={2}>Chi tiết thanh toán</Typography> ... */}

                        {/* Charts Section */}
                        {!loading && barData.length > 0 && (
                            <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <Typography variant="subtitle2" fontWeight={700} mb={2}>Biểu đồ doanh thu</Typography>
                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `${value / 1000}k`} />
                                            <RechartsTooltip cursor={{ fill: '#f5f5f5' }} formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận gộp']} />
                                            <Legend verticalAlign="top" height={36} />
                                            <Bar dataKey="revenue" name="Doanh thu" fill="#1976d2" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                            <Bar dataKey="gross_profit" name="Lợi nhuận gộp" fill="#2e7d32" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        )}

                        {/* Invoice List */}
                        <Typography variant="subtitle2" fontWeight={700} mb={2}>Danh sách đơn hàng</Typography>
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
                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }} align="right">Lợi nhuận gộp</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                    ) : invoices.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#888' }}>Không có giao dịch nào</TableCell></TableRow>
                                    ) : (
                                        invoices.map((inv: any) => {
                                            const invCogs = inv.items?.reduce((s: number, item: any) => s + ((item.macPrice ?? 0) * Math.abs(item.quantity)), 0) || 0;
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
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={totalElements}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Số dòng:"
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
                        />

                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EndOfDayReportPage;
