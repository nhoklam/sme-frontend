// src/modules/admin/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Typography, Paper, Chip, Avatar,
    Skeleton, IconButton, Button,
    Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
    Tooltip, Divider, Card, CardContent, CardHeader,
} from '@mui/material';
import {
    TrendingUp, ShoppingCart, Warning, Schedule,
    Refresh, ArrowForward, CheckCircle,
    Inventory2, AttachMoney, People, History,
    KeyboardArrowRight, BarChart as BarChartIcon,
    Timer, NotificationsPaused,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RTooltip, ResponsiveContainer, Cell,
    Legend,
    LabelList,
} from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import dashboardService, { DashboardStats, RevenueTrendPoint } from '../../../services/dashboardService';
import authService from '../../../services/authService';
import inventoryService from '../../../services/inventoryService';
import reportService from '../../../services/reportService';
import { useWebSocket } from '../../../store/hooks/useWebSocket';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtCurrency = (n: number | null | undefined) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
};

// ── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
    title: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    loading?: boolean;
    trend?: number;
    onClick?: () => void;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, iconBg, iconColor, loading, trend, onClick, color }) => (
    <Paper elevation={0} onClick={onClick} sx={{
        p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', bgcolor: '#fff',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderColor: '#d1d5db' } : {},
        height: '100%',
    }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </Box>
            {trend !== undefined && !loading && (
                <Chip size="small" label={`${trend >= 0 ? '+' : ''}${trend}%`}
                    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: trend >= 0 ? '#dcfce7' : '#fee2e2', color: trend >= 0 ? '#16a34a' : '#dc2626' }} />
            )}
        </Box>
        {loading ? (
            <>
                <Skeleton width="60%" height={32} sx={{ mb: 0.5 }} />
                <Skeleton width="40%" height={16} />
            </>
        ) : (
            <>
                <Typography variant="h5" fontWeight={800} color={color || "#111"} sx={{ mb: 0.25, letterSpacing: '-0.5px' }}>{value}</Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12} fontWeight={600}>{title}</Typography>
                {sub && <Typography variant="caption" color="#9ca3af" fontSize={11} display="block" mt={0.5} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</Typography>}
            </>
        )}
    </Paper>
);

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const currentUser = authService.getCurrentUser()?.user;
    const displayName = currentUser?.fullName || 'Quản trị viên';
    const isStaff = currentUser?.role === 'ROLE_CASHIER';

    // UI state
    const [chartPeriod, setChartPeriod] = useState<'hour' | 'day' | 'dayOfWeek' | 'month' | 'year'>('day');

    // Data state
    const [stats, setStats] = useState<any>(null);
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
    const [quickFilter, setQuickFilter] = useState<'today' | 'yesterday' | 'last7days' | 'thisMonth' | '30days' | '90days' | 'thisYear'>('30days');
    const [topData, setTopData] = useState<any>({ topProducts: [], topCustomers: [] });
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [allLowStockItems, setAllLowStockItems] = useState<any[]>([]);
    const [uniqueLowStockCount, setUniqueLowStockCount] = useState(0);
    const [pendingShiftsCount, setPendingShiftsCount] = useState(0);
    
    // Pagination state for low stock items
    const [lowStockPage, setLowStockPage] = useState(0);
    const [lowStockRowsPerPage, setLowStockRowsPerPage] = useState(5);

    // Top chart filter state
    const [topProductPeriod, setTopProductPeriod] = useState('30days');
    const [topProductMetric, setTopProductMetric] = useState<'sold' | 'revenue'>('revenue');
    const [topCustomerPeriod, setTopCustomerPeriod] = useState('30days');
    const [topCustomerMetric, setTopCustomerMetric] = useState<'revenue' | 'orders'>('revenue');

    // Loading state
    const [loading, setLoading] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);

    // ── WebSocket handler ──────────────────────────────────────
    const handleWsMessage = useCallback((payload: any) => {
        if (payload.type === 'LOW_STOCK') {
            qc.invalidateQueries({ queryKey: ['low-stock-dashboard'] });
            toast(`⚠️ ${payload.productName || 'Sản phẩm'} sắp hết hàng!`, {
                icon: '📦', duration: 5000,
                style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
            });
        }
    }, [qc]);

    const { isConnected } = useWebSocket({
        warehouseId: currentUser?.warehouseId,
        onMessage: handleWsMessage,
        enabled: !isStaff,
    });

    // ── Load all dashboard data ───────────────────────────────
    const loadData = useCallback(async () => {
        if (isStaff) return;
        setLoading(true);

        // 1. Tải thống kê tổng hợp (Doanh thu ngày/tuần/tháng/năm)
        try {
            const extStats = await dashboardService.getExtendedStats(currentUser?.warehouseId);
            setStats(extStats);
        } catch (err) {
            console.error("Lỗi tải thống kê doanh thu:", err);
        }

        // 2. Tải dữ liệu top sản phẩm/khách hàng
        try {
            const tData = await dashboardService.getTopData(currentUser?.warehouseId);
            setTopData(tData);
        } catch (err) {
            console.error("Lỗi tải top dữ liệu bán hàng:", err);
        }

        // 3. Tải danh sách sản phẩm sắp hết hàng
        try {
            const lowStock = await inventoryService.getLowStock(currentUser?.warehouseId);
            setAllLowStockItems(lowStock);
            // Tính số lượng sản phẩm duy nhất sắp hết hàng
            const uniqueIds = new Set(lowStock.map(item => item.productId));
            setUniqueLowStockCount(uniqueIds.size);
        } catch (err) {
            console.error("Lỗi tải cảnh báo hết hàng:", err);
        }

        // 4. Tải dữ liệu biểu đồ xu hướng doanh thu
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const from = new Date(today.getTime() - 30 * 86400000).toISOString();
            const trend = await dashboardService.getRevenueByRange(from, now.toISOString(), 'day', currentUser?.warehouseId);
            setRevenueTrend(trend);
            setChartPeriod('day');
        } catch (err) {
            console.error("Lỗi tải biểu đồ doanh thu:", err);
        }

        setLoading(false);
    }, [isStaff, currentUser?.warehouseId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Helper: tính from/to từ tên bộ lọc
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

    const handleQuickFilterChange = async (filter: typeof quickFilter, forcedPeriod?: typeof chartPeriod) => {
        setQuickFilter(filter);
        const { from, to } = getDateRange(filter);
        let period: typeof chartPeriod = forcedPeriod || 'day';

        if (!forcedPeriod) {
            if (filter === 'today' || filter === 'yesterday') period = 'hour';
            else if (filter === 'thisYear' || filter === '90days') period = 'month';
            else period = 'day';
        }

        setLoadingChart(true);
        try {
            const apiPeriod = period === 'dayOfWeek' ? 'day' : period;
            const trend = await dashboardService.getRevenueByRange(from.toISOString(), to.toISOString(), apiPeriod, currentUser?.warehouseId);
            setRevenueTrend(trend);
            setChartPeriod(period);
        } finally {
            setLoadingChart(false);
        }
    };

    // Handler cho top charts khi thay đổi bộ lọc thời gian
    const handleTopProductPeriodChange = async (period: string) => {
        setTopProductPeriod(period);
        const { from, to } = getDateRange(period);
        try {
            const products = await reportService.getTopProducts({ from: from.toISOString(), to: to.toISOString(), warehouseId: currentUser?.warehouseId, limit: 20 });
            const rawProducts = Array.isArray(products) ? products : [];
            setTopData((prev: any) => ({
                ...prev,
                topProducts: rawProducts.map((p: any) => {
                    const sold = p.total_sold !== undefined ? p.total_sold : (p.totalSold !== undefined ? p.totalSold : 0);
                    const rev = p.total_revenue !== undefined ? p.total_revenue : (p.totalRevenue !== undefined ? p.totalRevenue : 0);
                    return {
                        productName: String(p.name || p.productName || ''),
                        totalSold: Number(sold),
                        totalRevenue: Number(rev),
                    };
                }),
            }));
        } catch (e) { console.error(e); }
    };

    const handleTopCustomerPeriodChange = async (period: string) => {
        setTopCustomerPeriod(period);
        try {
            const tData = await dashboardService.getTopData(currentUser?.warehouseId, period, topCustomerMetric);
            setTopData((prev: any) => ({ ...prev, topCustomers: tData.topCustomers }));
        } catch (e) { console.error(e); }
    };

    const handleTopCustomerMetricChange = async (metric: string) => {
        setTopCustomerMetric(metric as any);
        try {
            const tData = await dashboardService.getTopData(currentUser?.warehouseId, topCustomerPeriod, metric);
            setTopData((prev: any) => ({ ...prev, topCustomers: tData.topCustomers }));
        } catch (e) { console.error(e); }
    };

    const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (isStaff) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
                <Typography variant="h5" fontWeight={800} color="#111">Xin chào, {displayName} 👋</Typography>
                <Typography variant="body2" color="#6b7280" mt={0.25}>{todayStr}</Typography>
                <Paper sx={{ p: 6, textAlign: 'center', mt: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} color="#374151" mb={1}>Bạn đang đăng nhập với quyền <strong>Thu ngân</strong></Typography>
                    <Typography variant="body2" color="#6b7280" mb={3}>Vui lòng điều hướng tới màn hình Bán hàng (POS) để thực hiện nghiệp vụ.</Typography>
                    <Button variant="contained" onClick={() => navigate('/admin/pos')} sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 700, px: 4 }}>Đi đến POS</Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* ── HEADER ── */}
            <Paper elevation={0} sx={{
                p: 3, mb: 3, borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} color="#1e293b" letterSpacing="-1px" sx={{ mb: 0.5 }}>
                        Xin chào, {displayName} 👋
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Timer sx={{ fontSize: 16, color: '#64748b' }} />
                            <Typography variant="body2" color="#64748b" fontWeight={600}>{todayStr}</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
                        <Tooltip title={isConnected ? 'Dữ liệu thời gian thực đang hoạt động' : 'Kết nối thời gian thực đang chờ'}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 2s infinite' }} />
                                <Typography fontSize={11} fontWeight={800} color={'#166534'}>ONLINE</Typography>
                            </Box>
                        </Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadData}
                        sx={{
                            borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                            borderColor: '#e2e8f0', color: '#64748b', bgcolor: '#fff',
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                        }}
                    >
                        Làm mới
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<History />}
                        onClick={() => navigate('/admin/inventory/history')}
                        sx={{
                            borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                            bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }
                        }}
                    >
                        Nhật ký
                    </Button>
                </Box>
            </Paper>

            {/* ── LOW STOCK ALERT BANNER ── */}
            {!loading && allLowStockItems.length > 0 && (() => {
                const uniqueOutOfStockCount = new Set(allLowStockItems.filter(i => (i.quantity ?? 0) === 0).map(i => i.productId)).size;
                const uniqueLowStockCountNotZero = new Set(allLowStockItems.filter(i => (i.quantity ?? 0) > 0).map(i => i.productId)).size;

                if (uniqueOutOfStockCount === 0 && uniqueLowStockCountNotZero === 0) return null;

                return (
                    <Paper elevation={0} sx={{
                        p: 2, mb: 2, borderRadius: 3,
                        bgcolor: '#fef2f2', border: '1px solid #fecaca',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Warning sx={{ color: '#ef4444', fontSize: 24 }} />
                            <Box>
                                <Typography fontWeight={700} fontSize={14} color="#991b1b">
                                    {uniqueOutOfStockCount > 0
                                        ? `⚠️ ${uniqueOutOfStockCount} sản phẩm hết hàng`
                                        : ''}
                                    {uniqueOutOfStockCount > 0 && uniqueLowStockCountNotZero > 0 ? ' và ' : ''}
                                    {uniqueLowStockCountNotZero > 0
                                        ? `${uniqueLowStockCountNotZero} sản phẩm sắp hết hàng`
                                        : ''}
                                </Typography>
                                <Typography fontSize={12} color="#b91c1c">Vui lòng nhập hàng bổ sung để đảm bảo hoạt động bán hàng</Typography>
                            </Box>
                        </Box>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate('/admin/inventory/alerts')}
                            sx={{ bgcolor: '#ef4444', textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#dc2626' } }}
                        >
                            Xem chi tiết
                        </Button>
                    </Paper>
                );
            })()}

            {/* ── ROW 1: REVENUE STATS ── */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {[
                    { title: 'Doanh thu hôm nay', value: fmtCurrency(stats?.todayRevenue), icon: <AttachMoney />, iconBg: '#dbeafe', iconColor: '#2563eb', color: '#2563eb' },
                    { title: 'Doanh thu tuần này', value: fmtCurrency(stats?.weekRevenue), icon: <TrendingUp />, iconBg: '#fef3c7', iconColor: '#d97706' },
                    { title: 'Doanh thu tháng này', value: fmtCurrency(stats?.monthRevenue), icon: <BarChartIcon />, iconBg: '#dcfce7', iconColor: '#16a34a' },
                    { title: 'Doanh thu năm nay', value: fmtCurrency(stats?.yearRevenue), icon: <History />, iconBg: '#ede9fe', iconColor: '#7c3aed' },
                ].map((card, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <StatCard {...card} loading={loading} />
                    </Grid>
                ))}
            </Grid>

            {/* ── ROW 2: OPERATIONAL STATS ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { title: 'Đơn hàng hôm nay', value: stats?.todayOrders ?? 0, icon: <ShoppingCart />, iconBg: '#eff6ff', iconColor: '#3b82f6' },
                    { title: 'Khách hàng mới', value: topData.topCustomers.length, icon: <People />, iconBg: '#faf5ff', iconColor: '#8b5cf6' },
                    { title: 'Sản phẩm sắp hết hàng', value: uniqueLowStockCount, icon: <Warning />, iconBg: '#fffbeb', iconColor: '#f59e0b', color: '#f59e0b', onClick: () => navigate('/admin/inventory/alerts') },
                    { title: 'Ca chờ duyệt', value: pendingShiftsCount, icon: <Schedule />, iconBg: '#ede9fe', iconColor: '#7c3aed' },
                ].map((card, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <StatCard {...card} loading={loading} />
                    </Grid>
                ))}
            </Grid>

            {/* ── MAIN CHART ── */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                            <Typography variant="subtitle1" fontWeight={800} color="#1e293b">Biểu đồ doanh thu</Typography>
                            {!loading && (
                                <Typography variant="h6" fontWeight={900} color="#16a34a">
                                    {fmtCurrency(revenueTrend.reduce((acc, curr) => acc + curr.revenue, 0))}
                                </Typography>
                            )}
                        </Box>
                    }
                    action={
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
                                        onClick={() => handleQuickFilterChange(quickFilter, p.id as any)}
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
                                onChange={(e) => handleQuickFilterChange(e.target.value as any)}
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
                                <option value="90days">90 ngày</option>
                                <option value="thisMonth">Tháng này</option>
                                <option value="thisYear">1 năm</option>
                            </select>
                        </Box>
                    }
                />
                <CardContent sx={{ height: 350, pt: 0, position: 'relative' }}>
                    {loadingChart && (
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', mx: 'auto', mb: 1 }} />
                                <Typography fontSize={12} color="#64748b" fontWeight={600}>Đang tải biểu đồ...</Typography>
                            </Box>
                        </Box>
                    )}
                    {loading ? <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} /> :
                        (() => {
                            const data = (() => {
                                if (chartPeriod === 'hour') {
                                    const result = Array.from({ length: 24 }, (_, i) => ({
                                        date: `${i.toString().padStart(2, '0')}:00`,
                                        revenue: 0,
                                        orders: 0
                                    }));
                                    revenueTrend.forEach(item => {
                                        const d = new Date(item.date);
                                        if (!isNaN(d.getTime())) {
                                            const hour = d.getHours();
                                            result[hour].revenue += item.revenue;
                                            result[hour].orders += item.orders;
                                        }
                                    });
                                    return result;
                                }
                                if (chartPeriod === 'dayOfWeek') {
                                    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
                                    const result = days.map(d => ({ date: d, revenue: 0, orders: 0 }));
                                    revenueTrend.forEach(item => {
                                        const d = new Date(item.date);
                                        if (!isNaN(d.getTime())) {
                                            const dow = d.getDay(); // 0: CN, 1: T2...
                                            const index = dow === 0 ? 6 : dow - 1;
                                            result[index].revenue += item.revenue;
                                            result[index].orders += item.orders;
                                        }
                                    });
                                    return result;
                                }
                                return [...revenueTrend].sort((a, b) => a.date.localeCompare(b.date));
                            })();

                            const maxOrders = Math.max(...data.map(d => d.orders), 1);
                            return data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                            tickFormatter={(val) => {
                                                if (chartPeriod === 'dayOfWeek' || chartPeriod === 'hour') return val;
                                                try {
                                                    const d = new Date(val);
                                                    if (isNaN(d.getTime())) return val;
                                                    if (chartPeriod === 'day') return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                                                    if (chartPeriod === 'month') return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                                    return `${d.getFullYear()}`;
                                                } catch { return val; }
                                            }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false} tickLine={false}
                                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                            tickFormatter={fmtShort}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false} tickLine={false}
                                            tick={{ fontSize: 11, fill: '#3b82f6', fontWeight: 600 }}
                                            domain={[0, Math.ceil(maxOrders * 1.2)]}
                                        />
                                        <RTooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                                            formatter={(val: number, name: string) => [
                                                name === 'Doanh thu' ? fmtCurrency(val) : val,
                                                name
                                            ]}
                                            labelFormatter={(label) => {
                                                if (chartPeriod === 'dayOfWeek' || chartPeriod === 'hour') return label;
                                                try {
                                                    const d = new Date(label);
                                                    if (isNaN(d.getTime())) return label;
                                                    if (chartPeriod === 'day') return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                                    if (chartPeriod === 'month') return `Tháng ${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                                    return `Năm ${d.getFullYear()}`;
                                                } catch { return label; }
                                            }}
                                            labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}
                                        />
                                        <Legend align="center" verticalAlign="bottom" iconType="rect" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                                        <Bar yAxisId="left" name="Doanh thu" dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={80} />
                                        <Bar yAxisId="right" name="Số đơn" dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={80} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="#94a3b8" fontSize={14}>Chưa có dữ liệu giao dịch</Typography>
                                </Box>
                            );
                        })()
                    }
                </CardContent>
            </Card>

            {/* ── TOP CHARTS ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                        <CardHeader
                            title={<Typography variant="subtitle2" fontWeight={800} color="#1e293b">Top 10 sản phẩm bán chạy</Typography>}
                            action={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <select
                                        value={topProductMetric}
                                        onChange={(e) => setTopProductMetric(e.target.value as any)}
                                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        <option value="revenue">Theo doanh thu thuần</option>
                                        <option value="sold">Theo số lượng</option>
                                    </select>
                                    <select
                                        value={topProductPeriod}
                                        onChange={(e) => handleTopProductPeriodChange(e.target.value)}
                                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        <option value="last7days">7 ngày</option>
                                        <option value="30days">30 ngày</option>
                                        <option value="90days">90 ngày</option>
                                        <option value="thisYear">1 năm</option>
                                    </select>
                                </Box>
                            }
                        />
                        <CardContent sx={{ height: 500 }}>
                            {loading ? <Skeleton variant="rectangular" height="100%" /> : (
                                (() => {
                                    const products = [...topData.topProducts].sort((a, b) => {
                                        const key = topProductMetric === 'revenue' ? 'totalRevenue' : 'totalSold';
                                        return (Number(b[key]) || 0) - (Number(a[key]) || 0);
                                    }).slice(0, 10);

                                    return products.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={products} layout="vertical" margin={{ left: 10, right: 70, top: 5, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    type="number"
                                                    dataKey={topProductMetric === 'revenue' ? 'totalRevenue' : 'totalSold'}
                                                    tickFormatter={fmtShort}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                />
                                                <YAxis
                                                    dataKey="productName"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                                                    width={140}
                                                    tickFormatter={(val: string) => val.length > 20 ? val.substring(0, 20) + '...' : val}
                                                />
                                                <RTooltip
                                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    formatter={(val: any) => [
                                                        topProductMetric === 'revenue' ? fmtCurrency(val) : `${Number(val).toLocaleString()} sp`,
                                                        topProductMetric === 'revenue' ? 'Doanh thu' : 'Số lượng bán'
                                                    ]}
                                                />
                                                <Bar
                                                    dataKey={topProductMetric === 'revenue' ? 'totalRevenue' : 'totalSold'}
                                                    name={topProductMetric === 'revenue' ? 'Doanh thu' : 'Số lượng bán'}
                                                    fill="#4285F4"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={22}
                                                >
                                                    <LabelList
                                                        dataKey={topProductMetric === 'revenue' ? 'totalRevenue' : 'totalSold'}
                                                        position="right"
                                                        style={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                                                        formatter={(v: any) => topProductMetric === 'revenue' ? fmtShort(v) : `${v} sp`}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography color="#94a3b8" fontSize={14}>Chưa có dữ liệu sản phẩm</Typography>
                                        </Box>
                                    );
                                })()
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                        <CardHeader
                            title={<Typography variant="subtitle2" fontWeight={800} color="#1e293b">Top 10 khách hàng mua nhiều nhất</Typography>}
                            action={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <select
                                        value={topCustomerMetric}
                                        onChange={(e) => handleTopCustomerMetricChange(e.target.value)}
                                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        <option value="revenue">Doanh thu</option>
                                        <option value="orders">Số lượng đơn</option>
                                    </select>
                                    <select
                                        value={topCustomerPeriod}
                                        onChange={(e) => handleTopCustomerPeriodChange(e.target.value)}
                                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        <option value="last7days">7 ngày</option>
                                        <option value="30days">30 ngày</option>
                                        <option value="90days">90 ngày</option>
                                        <option value="thisYear">1 năm</option>
                                    </select>
                                </Box>
                            }
                        />
                        <CardContent sx={{ height: 500 }}>
                            {loading ? <Skeleton variant="rectangular" height="100%" /> : (
                                topData.topCustomers.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[...topData.topCustomers].sort((a, b) => {
                                            const key = topCustomerMetric === 'revenue' ? 'totalPurchase' : 'totalOrders';
                                            return (Number(b[key]) || 0) - (Number(a[key]) || 0);
                                        })} layout="vertical" margin={{ left: 10, right: 110, top: 5, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide domain={[0, 'dataMax * 1.3']} />
                                            <YAxis
                                                dataKey="fullName"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                                                width={120}
                                            />
                                            <RTooltip
                                                formatter={(val: any) => [
                                                    topCustomerMetric === 'revenue' ? fmtCurrency(val) : `${Number(val).toLocaleString()} đơn`,
                                                    topCustomerMetric === 'revenue' ? 'Tổng chi tiêu' : 'Số lượng đơn'
                                                ]}
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar
                                                dataKey={topCustomerMetric === 'revenue' ? 'totalPurchase' : 'totalOrders'}
                                                name={topCustomerMetric === 'revenue' ? 'Tổng chi tiêu' : 'Số lượng đơn'}
                                                fill="#1A2E85"
                                                radius={[0, 4, 4, 0]}
                                                barSize={22}
                                            >
                                                <LabelList
                                                    dataKey={topCustomerMetric === 'revenue' ? 'totalPurchase' : 'totalOrders'}
                                                    position="right"
                                                    style={{ fill: '#1A2E85', fontSize: 11, fontWeight: 700 }}
                                                    formatter={(v: any) => topCustomerMetric === 'revenue'
                                                        ? (Number(v) > 1000000 ? fmtShort(v) : fmtCurrency(v))
                                                        : `${Number(v).toLocaleString()} đơn`
                                                    }
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="#94a3b8" fontSize={14}>Chưa có dữ liệu khách hàng</Typography>
                                    </Box>
                                )
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ── BOTTOM SECTION ── */}
            <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <CardHeader
                            title={<Typography variant="subtitle2" fontWeight={800} color="#1e293b">Sản phẩm sắp hết hàng</Typography>}
                            action={
                                <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} onClick={() => navigate('/admin/inventory/alerts')} sx={{ textTransform: 'none', fontWeight: 700, color: '#2563eb', bgcolor: '#eff6ff', borderRadius: 2, px: 2, py: 0.5, '&:hover': { bgcolor: '#dbeafe' } }}>
                                    Xem chi tiết
                                </Button>
                            }
                            sx={{ borderBottom: '1px solid #f8fafc', py: 2 }}
                        />
                        <Table size="medium">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Sản phẩm</TableCell>
                                    {!isStaff && !currentUser?.warehouseId && (
                                        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kho</TableCell>
                                    )}
                                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tồn kho</TableCell>
                                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tối thiểu</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trạng thái</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allLowStockItems.length > 0 ? allLowStockItems.slice(lowStockPage * lowStockRowsPerPage, lowStockPage * lowStockRowsPerPage + lowStockRowsPerPage).map((item, i) => (
                                    <TableRow key={i} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{item.productName}</TableCell>
                                        {!isStaff && !currentUser?.warehouseId && (
                                            <TableCell sx={{ fontSize: 13, color: '#64748b' }}>{item.warehouseName || '—'}</TableCell>
                                        )}
                                        <TableCell align="right" sx={{ fontSize: 14, color: '#ef4444', fontWeight: 900 }}>{item.quantity}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{item.minQuantity}</TableCell>
                                        <TableCell align="center">
                                            <Chip label="Cần nhập hàng" size="small" sx={{ height: 24, fontSize: 11, fontWeight: 800, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: 1.5, border: '1px solid #fecaca' }} />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <Inventory2 sx={{ fontSize: 40, color: '#cbd5e1' }} />
                                                <Typography color="#94a3b8" fontSize={14} fontWeight={600}>Đầy đủ hàng trong kho ✨</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {allLowStockItems.length > 0 && (
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 20]}
                                component="div"
                                count={allLowStockItems.length}
                                rowsPerPage={lowStockRowsPerPage}
                                page={lowStockPage}
                                onPageChange={(_, newPage) => setLowStockPage(newPage)}
                                onRowsPerPageChange={(e) => {
                                    setLowStockRowsPerPage(parseInt(e.target.value, 10));
                                    setLowStockPage(0);
                                }}
                                labelRowsPerPage="Số dòng:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                            />
                        )}
                    </Card>
                </Grid>
            </Grid>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </Box>
    );
};

export default DashboardPage;