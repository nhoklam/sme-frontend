import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, ButtonGroup,
    Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Paper, IconButton
} from '@mui/material';
import {
    AttachMoney, Assessment, TrendingUp, ShowChart, ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import reportService from '../../../services/reportService';
import authService from '../../../services/authService';
import { formatCurrency } from '../../../utils/formatters';

type DateFilter = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month';

const getFilterRange = (filter: DateFilter): { from: Date; to: Date } => {
    const from = new Date();
    const to = new Date();

    // Đặt giờ phút giây
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    if (filter === 'today') {
        // Mặc định là hôm nay
    } else if (filter === 'yesterday') {
        from.setDate(from.getDate() - 1);
        to.setDate(to.getDate() - 1);
    } else if (filter === 'this_week') {
        const day = from.getDay();
        const diff = from.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 đầu tuần
        from.setDate(diff);
    } else if (filter === 'last_week') {
        const day = from.getDay();
        const diff = from.getDate() - day + (day === 0 ? -6 : 1);
        from.setDate(diff - 7);
        to.setDate(diff - 1);
    } else if (filter === 'this_month') {
        from.setDate(1);
    }
    return { from, to };
};

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; loading: boolean }> = ({ title, value, icon, color, loading }) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ color }}>{icon}</Box>
                </Box>
            </Box>
            {loading ? (
                <>
                    <Skeleton width={120} height={36} />
                    <Skeleton width={80} height={18} />
                </>
            ) : (
                <>
                    <Typography variant="h5" fontWeight={800} color={color} mb={0.25}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12} fontWeight={600} display="block">{title}</Typography>
                </>
            )}
        </CardContent>
    </Card>
);

const EmployeeRevenuePage: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<DateFilter>('today');
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const currentUser = authService.getCurrentUser()?.user;
    const warehouseId = currentUser?.warehouseId || '';

    const fetchRevenue = useCallback(async () => {
        if (!warehouseId) return;
        setLoading(true);
        setError('');
        try {
            const { from, to } = getFilterRange(filter);
            const data = await reportService.getRevenue({
                from: from.toISOString(),
                to: to.toISOString(),
                period: 'day', // Backend group theo ngày
                warehouseId
            });
            setRevenueData(data);
        } catch {
            setError('Không thể tải báo cáo doanh thu');
        } finally {
            setLoading(false);
        }
    }, [filter, warehouseId]);

    useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

    const totalRevenue = revenueData.reduce((s, d) => s + (d.revenue ?? 0), 0);
    const totalCOGS = revenueData.reduce((s, d) => s + (d.cogs ?? 0), 0);
    const totalProfit = revenueData.reduce((s, d) => s + (d.gross_profit ?? 0), 0);
    const totalInvoices = revenueData.reduce((s, d) => s + (d.invoice_count ?? 0), 0);
    const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    const chartData = revenueData.map(d => ({
        name: new Date(d.period).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        'Doanh thu': Math.round((d.revenue ?? 0) / 1_000_000),
        'Lợi nhuận': Math.round((d.gross_profit ?? 0) / 1_000_000),
        'Số HĐ': d.invoice_count ?? 0,
    }));

    const filters: { label: string, value: DateFilter }[] = [
        { label: 'Hôm nay', value: 'today' },
        { label: 'Hôm qua', value: 'yesterday' },
        { label: 'Tuần này', value: 'this_week' },
        { label: 'Tuần trước', value: 'last_week' },
        { label: 'Tháng này', value: 'this_month' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/pos')} sx={{ mr: 2, bgcolor: '#fff', border: '1px solid #f0f0f0' }}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e">
                        Báo cáo doanh thu (Thu ngân)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Theo dõi kết quả bán hàng của kho hiện tại
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700}>Thời gian báo cáo</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {filters.map(f => (
                            <Button key={f.value} size="small" onClick={() => setFilter(f.value)}
                                sx={{
                                    textTransform: 'none', fontSize: 13, fontWeight: 600, px: 2, borderRadius: 1.5,
                                    bgcolor: filter === f.value ? '#1976d2' : 'transparent',
                                    color: filter === f.value ? '#fff' : '#555',
                                    border: '1px solid', borderColor: filter === f.value ? '#1976d2' : '#e0e0e0',
                                    '&:hover': { bgcolor: filter === f.value ? '#1565c0' : '#f5f5f5' }
                                }}>
                                {f.label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                    <Box>
                        <SummaryCard title="Tổng doanh thu" value={formatCurrency(totalRevenue)} icon={<AttachMoney />} color="#1976d2" loading={loading} />
                    </Box>
                    <Box>
                        <SummaryCard title="Lợi nhuận gộp" value={formatCurrency(totalProfit)} icon={<TrendingUp />} color="#2e7d32" loading={loading} />
                    </Box>
                    <Box>
                        <SummaryCard title="Biên lợi nhuận" value={`${marginPct}%`} icon={<ShowChart />} color="#9c27b0" loading={loading} />
                    </Box>
                    <Box>
                        <SummaryCard title="Số hóa đơn" value={totalInvoices.toLocaleString('vi-VN')} icon={<Assessment />} color="#ed6c02" loading={loading} />
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>Biểu đồ doanh thu</Typography>
                {loading ? (
                    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                ) : chartData.length === 0 ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                        <Typography color="text.secondary">Không có dữ liệu trong khoảng thời gian này</Typography>
                    </Box>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip formatter={(v: number, n: string) => n === 'Số HĐ' ? [v, n] : [`${v}M đ`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                            <Area yAxisId="left" type="monotone" dataKey="Doanh thu" fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} />
                            <Line yAxisId="left" type="monotone" dataKey="Số HĐ" stroke="#f59e0b" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </Paper>
        </Box>
    );
};

export default EmployeeRevenuePage;
