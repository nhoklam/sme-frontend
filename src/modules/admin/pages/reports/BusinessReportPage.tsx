// src/modules/admin/pages/reports/BusinessReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button,
    Select, MenuItem, FormControl, Skeleton, Paper,
    CircularProgress, Alert, Tooltip as MuiTooltip
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, Line, ComposedChart,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, AttachMoney, AccountBalanceWallet,
    ShowChart, ReceiptLong, LocalOffer
} from '@mui/icons-material';

import reportService from '../../../../services/reportService';
import financeService from '../../../../services/financeService';
import warehouseService from '../../../../services/warehouseService';
import type { Warehouse } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────
const fmtPeriod = (period: string, type: string) => {
    if (!period) return '';
    try {
        const d = new Date(period);
        if (type === 'day' || type === 'dayOfWeek') return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        if (type === 'week') return `T${d.getDate()}/${d.getMonth() + 1}`;
        if (type === 'month') return d.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
        if (type === 'hour') return `${d.getHours()}:00`;
        return String(d.getFullYear());
    } catch {
        return period;
    }
};

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
            from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { from, to };
};

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f', '#388e3c', '#f57c00'];

// ─── Summary Card ──────────────────────────────────────────────
interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    loading: boolean;
    sub?: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, loading, sub }) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff', height: '100%' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
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
                    <Typography variant="h5" fontWeight={800} color={color} mb={0.25}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12} fontWeight={600} display="block">
                        {title}
                    </Typography>
                    {sub && (
                        <Box mt={0.5}>
                            {sub}
                        </Box>
                    )}
                </>
            )}
        </CardContent>
    </Card>
);

// ─── Main Component ────────────────────────────────────────────
const BusinessReportPage: React.FC = () => {
    const [warehouseId, setWarehouseId] = useState<string>('');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [chartPeriod, setChartPeriod] = useState<'hour' | 'day' | 'dayOfWeek' | 'month' | 'year'>('day');
    const [quickFilter, setQuickFilter] = useState<'today' | 'yesterday' | 'last7days' | 'thisMonth' | '30days' | '90days' | 'thisYear'>('thisMonth');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCOGS: 0,
        operatingExpense: 0,
    });
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const fetchData = useCallback(async (filter = quickFilter, forcedPeriod = chartPeriod) => {
        setLoading(true);
        setError('');
        try {
            const { from, to } = getDateRange(filter);
            const apiPeriod = forcedPeriod === 'dayOfWeek' ? 'day' : forcedPeriod;

            // 1. Lấy dữ liệu doanh thu & giá vốn
            const revenueRes = await reportService.getRevenue({
                from: toISO(from), to: toISO(to), period: apiPeriod as any,
                ...(warehouseId ? { warehouseId } : {}),
            });

            // 2. Lấy dữ liệu chi phí vận hành từ sổ quỹ (Phiếu chi)
            const cashbookRes = await financeService.searchCashbook({
                from: toISO(from), to: toISO(to),
                transactionType: 'OUT',
                size: 1000,
                ...(warehouseId ? { warehouseId } : {}),
            });

            const totalRev = revenueRes.reduce((s, d) => s + (d.revenue ?? 0), 0);
            const totalCogs = revenueRes.reduce((s, d) => s + (d.cogs ?? 0), 0);
            const opExpense = cashbookRes.content.reduce((s, tx) => s + tx.amount, 0);

            setStats({
                totalRevenue: totalRev,
                totalCOGS: totalCogs,
                operatingExpense: opExpense,
            });

            // Ước tính chi phí vận hành phân bổ đều qua các kỳ (vì sổ quỹ không trả theo kỳ, cách tiếp cận đơn giản: chia đều)
            const count = revenueRes.length || 1;
            const avgOpExp = opExpense / count;

            const cData = (() => {
                if (forcedPeriod === 'hour') {
                    const result = Array.from({ length: 24 }, (_, i) => ({
                        name: `${i.toString().padStart(2, '0')}:00`,
                        rev: 0, cogs: 0
                    }));
                    revenueRes.forEach(d => {
                        const date = new Date(d.period || '');
                        if (!isNaN(date.getTime())) {
                            const hour = date.getHours();
                            result[hour].rev += d.revenue ?? 0;
                            result[hour].cogs += d.cogs ?? 0;
                        }
                    });
                    const avgHourExp = opExpense / 24;
                    return result.map(r => ({
                        name: r.name,
                        'Doanh thu': r.rev,
                        'Chi phí': r.cogs + avgHourExp,
                        'Lợi nhuận': r.rev - r.cogs - avgHourExp,
                    }));
                }
                if (forcedPeriod === 'dayOfWeek') {
                    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
                    const result = days.map(d => ({ name: d, rev: 0, cogs: 0 }));
                    revenueRes.forEach(d => {
                        const date = new Date(d.period || '');
                        if (!isNaN(date.getTime())) {
                            const dow = date.getDay(); // 0: CN, 1: T2...
                            const index = dow === 0 ? 6 : dow - 1;
                            result[index].rev += d.revenue ?? 0;
                            result[index].cogs += d.cogs ?? 0;
                        }
                    });
                    const avgDayExp = opExpense / 7;
                    return result.map(r => ({
                        name: r.name,
                        'Doanh thu': r.rev,
                        'Chi phí': r.cogs + avgDayExp,
                        'Lợi nhuận': r.rev - r.cogs - avgDayExp,
                    }));
                }

                const sorted = [...revenueRes].sort((a, b) => new Date(a.period || '').getTime() - new Date(b.period || '').getTime());
                return sorted.map(d => {
                    const rev = d.revenue ?? 0;
                    const cogs = d.cogs ?? 0;
                    const profit = rev - cogs - avgOpExp;
                    return {
                        name: fmtPeriod(d.period || '', forcedPeriod),
                        'Doanh thu': rev,
                        'Chi phí': cogs + avgOpExp,
                        'Lợi nhuận': profit,
                    };
                });
            })();

            setChartData(cData);

        } catch (e) {
            console.error(e);
            setError('Không thể tải báo cáo kinh doanh');
        } finally {
            setLoading(false);
        }
    }, [warehouseId, quickFilter, chartPeriod]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleQuickFilterChange = (filter: any, forcedPeriod?: any) => {
        setQuickFilter(filter);
        let p = forcedPeriod || chartPeriod;
        if (!forcedPeriod) {
            if (filter === 'today' || filter === 'yesterday') p = 'hour';
            else if (filter === 'thisYear' || filter === '90days') p = 'month';
            else p = 'day';
        }
        setChartPeriod(p);
        fetchData(filter, p);
    };

    const { totalRevenue, totalCOGS, operatingExpense } = stats;
    const totalExpense = totalCOGS + operatingExpense;
    const netProfit = totalRevenue - totalExpense;
    const marginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    const costPieData = [
        { name: 'Giá vốn hàng bán', value: totalCOGS },
        { name: 'Chi phí vận hành', value: operatingExpense },
    ].filter(d => d.value > 0);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: '20px 24px' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>Báo cáo Kinh doanh</Typography>
                    <Typography variant="body2" color="#8c8c8c" fontSize={13}>Hiệu quả hoạt động, chi phí và lợi nhuận thuần</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff' }}>
                        <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả chi nhánh</MenuItem>
                            {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Tổng doanh thu"
                        value={formatCurrency(totalRevenue)}
                        icon={<AttachMoney />}
                        color="#1976d2"
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Tổng chi phí"
                        value={formatCurrency(totalExpense)}
                        icon={<ReceiptLong />}
                        color="#d32f2f"
                        loading={loading}
                        sub={
                            <Typography variant="caption" color="text.secondary" fontSize={11}>
                                Giá vốn: {formatCurrency(totalCOGS)}<br />
                                Vận hành: {formatCurrency(operatingExpense)}
                            </Typography>
                        }
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Lợi nhuận thuần"
                        value={formatCurrency(netProfit)}
                        icon={<AccountBalanceWallet />}
                        color={netProfit >= 0 ? "#2e7d32" : "#d32f2f"}
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Tỷ suất lợi nhuận"
                        value={`${marginPct}%`}
                        icon={<TrendingUp />}
                        color="#9c27b0"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            {/* Chart Area */}
            <Paper elevation={0} sx={{ borderRadius: 2, p: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>Xu hướng Lợi nhuận</Typography>
                        <Typography variant="body2" color="#8c8c8c">So sánh Doanh thu, Chi phí và Lợi nhuận thuần</Typography>
                    </Box>

                    {/* Dashboard style filters */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: '#f1f5f9', p: 0.5, borderRadius: 2 }}>
                            {[
                                { id: 'hour', label: 'Theo giờ' },
                                { id: 'day', label: 'Theo ngày' },
                                { id: 'dayOfWeek', label: 'Theo thứ' },
                                { id: 'month', label: 'Theo tháng' },
                                { id: 'year', label: 'Theo năm' }
                            ].map(p => (
                                <Button
                                    key={p.id}
                                    size="small"
                                    onClick={() => handleQuickFilterChange(quickFilter, p.id)}
                                    sx={{
                                        textTransform: 'none', fontSize: 11, borderRadius: 1.5,
                                        fontWeight: 700, px: 1.5, minWidth: 0,
                                        color: chartPeriod === p.id ? '#2563eb' : '#64748b',
                                        bgcolor: chartPeriod === p.id ? '#fff' : 'transparent',
                                        boxShadow: chartPeriod === p.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        '&:hover': { bgcolor: chartPeriod === p.id ? '#fff' : 'rgba(0,0,0,0.04)' }
                                    }}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </Box>
                        <select
                            value={quickFilter}
                            onChange={(e) => handleQuickFilterChange(e.target.value)}
                            style={{
                                padding: '6px 32px 6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                fontSize: '13px', fontWeight: 700, color: '#1e293b', outline: 'none',
                                cursor: 'pointer', backgroundColor: '#fff', appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px'
                            }}
                        >
                            <option value="today">Hôm nay</option>
                            <option value="yesterday">Hôm qua</option>
                            <option value="last7days">7 ngày</option>
                            <option value="30days">30 ngày</option>
                            <option value="thisMonth">Tháng này</option>
                            <option value="90days">3 tháng</option>
                            <option value="thisYear">Năm nay</option>
                        </select>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* Main Chart */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box sx={{ height: 400, position: 'relative' }}>
                            {loading && (
                                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                                    <CircularProgress size={36} />
                                </Box>
                            )}
                            {chartData.length === 0 && !loading ? (
                                <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <ShowChart sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Đơn vị: VNĐ</Typography>
                                    <ResponsiveContainer width="100%" height={360}>
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={val => `${(val / 1000).toLocaleString('vi-VN')}k`} />
                                            <Tooltip
                                                cursor={{ fill: '#f1f5f9' }}
                                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                                formatter={(val: number) => [formatCurrency(val)]}
                                                labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}
                                            />
                                            <Legend align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                                            <Bar dataKey="Doanh thu" fill="#1976d2" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                            <Bar dataKey="Chi phí" fill="#d32f2f" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                            <Line type="monotone" dataKey="Lợi nhuận" stroke="#2e7d32" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </>
                            )}
                        </Box>
                    </Grid>

                    {/* Cost Structure Pie */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ height: 400, position: 'relative', borderLeft: { xs: 'none', md: '1px solid #f0f0f0' }, pl: { xs: 0, md: 3 } }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#1e293b">
                                Cơ cấu chi phí
                            </Typography>
                            {loading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : costPieData.length === 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, bgcolor: '#fafafa', borderRadius: 2 }}>
                                    <Typography color="text.secondary" variant="body2">Không phát sinh chi phí</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={costPieData}
                                            cx="50%" cy="45%"
                                            innerRadius={60} outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {costPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#ffb74d' : '#ef5350'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val: number) => formatCurrency(val)}
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default BusinessReportPage;
