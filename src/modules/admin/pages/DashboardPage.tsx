// src/modules/admin/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Grid, Card, CardContent, Typography, Box, Paper,
    Avatar, LinearProgress, Chip, Skeleton, Alert,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Button,
} from '@mui/material';
import {
    TrendingUp, ShoppingCart,
    AttachMoney, Warning, Refresh, ArrowUpward,
    ArrowDownward,
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RTooltip, ResponsiveContainer
} from 'recharts';
import axiosInstance from '../../../services/axiosConfig';
import { OrderResponse, LowStockItem, OrderStatus } from '../../../types';
import { useNavigate } from 'react-router-dom';

// ── Helpers ──────────────────────────────────────────────────
const fmtCurrency = (n?: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0
    }).format(n ?? 0);

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Chờ xử lý', color: '#f59e0b', bg: '#fef3c7' },
    PACKING: { label: 'Đóng gói', color: '#3b82f6', bg: '#eff6ff' },
    SHIPPING: { label: 'Đang giao', color: '#8b5cf6', bg: '#f5f3ff' },
    DELIVERED: { label: 'Đã giao', color: '#10b981', bg: '#d1fae5' },
    CANCELLED: { label: 'Đã hủy', color: '#6b7280', bg: '#f3f4f6' },
    RETURNED: { label: 'Hoàn trả', color: '#ef4444', bg: '#fee2e2' },
};

// ── StatCard ─────────────────────────────────────────────────
interface StatCardProps {
    title: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    color: string;
    trend?: number;
    loading?: boolean;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
    title, value, sub, icon, color, trend, loading, onClick
}) => (
    <Card sx={{
        borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
    }} onClick={onClick}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: `${color}18`, color, width: 44, height: 44, borderRadius: 2 }}>
                    {icon}
                </Avatar>
                {trend !== undefined && (
                    <Chip
                        icon={trend >= 0
                            ? <ArrowUpward sx={{ fontSize: 12 }} />
                            : <ArrowDownward sx={{ fontSize: 12 }} />}
                        label={`${Math.abs(trend)}%`}
                        size="small"
                        sx={{
                            bgcolor: trend >= 0 ? '#d1fae5' : '#fee2e2',
                            color: trend >= 0 ? '#065f46' : '#991b1b',
                            fontWeight: 700, fontSize: 11,
                            '& .MuiChip-icon': { color: 'inherit' },
                        }}
                    />
                )}
            </Box>
            {loading ? (
                <>
                    <Skeleton width="60%" height={28} sx={{ mb: 0.5 }} />
                    <Skeleton width="40%" height={18} />
                </>
            ) : (
                <>
                    <Typography variant="h5" fontWeight={800} sx={{ mb: 0.25, letterSpacing: '-0.5px' }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>{title}</Typography>
                    {sub && <Typography variant="caption" color="text.secondary" fontSize={11}>{sub}</Typography>}
                </>
            )}
        </CardContent>
    </Card>
);

// ── DashboardPage ─────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number; orders: number }>>([]);
    const [topProducts, setTopProducts] = useState<Array<{ id: string; name: string; total_sold: number }>>([]);
    const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [summaryStats, setSummaryStats] = useState({
        monthRevenue: 0,
        pendingOrders: 0,
        lowStockCount: 0,
        topProductName: '—',
        topProductSold: 0,
    });

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const getMonthRange = () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        return { from, to };
    };

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setErrors({});
        const { from, to } = getMonthRange();
        const newErrors: Record<string, string> = {};

        // 1. Revenue
        let revenueArr: any[] = [];
        try {
            const res = await axiosInstance.get(`/reports/revenue?from=${from}&to=${to}&period=day`);
            revenueArr = res.data?.data ?? [];
            setRevenueData(revenueArr.map((r: any) => ({
                date: String(r.period ?? r.date ?? '').slice(5, 10),
                revenue: Number(r.revenue ?? 0),
                orders: Number(r.invoice_count ?? 0),
            })));
        } catch {
            newErrors.revenue = 'Không thể tải dữ liệu doanh thu';
        }

        // 2. Top products
        let topArr: any[] = [];
        try {
            const res = await axiosInstance.get(`/reports/top-products?from=${from}&to=${to}&limit=5`);
            topArr = res.data?.data ?? [];
            setTopProducts(topArr);
        } catch {
            newErrors.topProducts = 'Không thể tải top sản phẩm';
        }

        // 3. Recent orders
        let ordersArr: OrderResponse[] = [];
        try {
            const res = await axiosInstance.get('/orders?page=0&size=8');
            ordersArr = res.data?.data?.content ?? [];
            setRecentOrders(ordersArr);
        } catch {
            newErrors.orders = 'Không thể tải đơn hàng gần đây';
        }

        // 4. Low stock
        let stockArr: LowStockItem[] = [];
        try {
            const res = await axiosInstance.get('/inventory/low-stock');
            stockArr = res.data?.data ?? [];
            setLowStock(stockArr);
        } catch (e: any) {
            console.warn('Low stock API error:', e?.response?.status, e?.response?.data?.message);
            setLowStock([]);
        }

        // 5. Summary
        const monthRevenue = revenueArr.reduce((s: number, r: any) => s + Number(r.revenue ?? 0), 0);
        const pendingOrders = ordersArr.filter(o => o.status === 'PENDING').length;

        setSummaryStats({
            monthRevenue,
            pendingOrders,
            lowStockCount: stockArr.length,
            topProductName: topArr[0]?.name ?? '—',
            topProductSold: Number(topArr[0]?.total_sold ?? 0),
        });

        if (Object.keys(newErrors).length > 0) setErrors(newErrors);
        setLoading(false);
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const stats: StatCardProps[] = [
        {
            title: 'Doanh thu tháng này',
            value: fmtCurrency(summaryStats.monthRevenue),
            icon: <AttachMoney />, color: '#3b82f6', trend: 12,
            onClick: () => navigate('/admin/reports'),
        },
        {
            title: 'Đơn hàng chờ xử lý',
            value: summaryStats.pendingOrders,
            icon: <ShoppingCart />, color: '#f59e0b',
            onClick: () => navigate('/admin/orders?status=PENDING'),
        },
        {
            title: 'Cảnh báo tồn kho',
            value: summaryStats.lowStockCount,
            icon: <Warning />, color: '#ef4444',
            onClick: () => navigate('/admin/inventory/alerts'),
        },
        {
            title: 'Sản phẩm bán chạy nhất',
            value: summaryStats.topProductName.length > 20
                ? summaryStats.topProductName.slice(0, 20) + '...'
                : summaryStats.topProductName,
            sub: summaryStats.topProductSold > 0
                ? `${summaryStats.topProductSold} đã bán`
                : undefined,
            icon: <TrendingUp />, color: '#10b981',
        },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#fafaf9', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="#111" letterSpacing="-0.5px">
                        Tổng quan hệ thống
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12} mt={0.25}>
                        {new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </Typography>
                </Box>
                <Tooltip title="Làm mới dữ liệu">
                    <IconButton
                        onClick={loadDashboard}
                        disabled={loading}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                    >
                        <Refresh sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {Object.keys(errors).length > 0 && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    Một số dữ liệu không thể tải. Vui lòng kiểm tra kết nối server.
                </Alert>
            )}

            {/* Stats cards — Grid v2: dùng size thay vì item/xs/sm/md */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stats.map((s, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard {...s} loading={loading} />
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2.5}>
                {/* Revenue Chart */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{
                        p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>Biểu đồ doanh thu</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Theo ngày trong tháng hiện tại
                                </Typography>
                            </Box>
                            <Button
                                size="small" variant="text"
                                onClick={() => navigate('/admin/reports')}
                                sx={{ textTransform: 'none', color: '#3b82f6', fontSize: 12 }}
                            >
                                Xem chi tiết →
                            </Button>
                        </Box>

                        {loading ? (
                            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                        ) : revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        tickLine={false} axisLine={false} interval={2}
                                    />
                                    <YAxis
                                        tickFormatter={v => `${(v / 1e6).toFixed(0)}M`}
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        tickLine={false} axisLine={false}
                                    />
                                    <RTooltip
                                        formatter={(v: any) => [fmtCurrency(v), 'Doanh thu']}
                                        contentStyle={{
                                            borderRadius: 8, border: '1px solid #e5e7eb',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12
                                        }}
                                    />
                                    <Area
                                        type="monotone" dataKey="revenue" stroke="#3b82f6"
                                        strokeWidth={2} fill="url(#colorRev)"
                                        dot={false} activeDot={{ r: 4 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{
                                height: 220, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 1
                            }}>
                                <Typography fontSize={36}>📊</Typography>
                                <Typography color="text.secondary" fontSize={13}>
                                    Chưa có dữ liệu doanh thu trong tháng này
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Low Stock Alerts */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{
                        p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                        boxShadow: 'none', height: '100%'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning sx={{ color: '#ef4444', fontSize: 18 }} />
                                <Typography variant="subtitle1" fontWeight={700}>Cảnh báo tồn kho</Typography>
                            </Box>
                            {lowStock.length > 0 && (
                                <Chip
                                    label={lowStock.length}
                                    size="small"
                                    sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 11 }}
                                />
                            )}
                        </Box>

                        {loading ? (
                            [1, 2, 3].map(i => (
                                <Skeleton key={i} height={52} sx={{ mb: 1, borderRadius: 1.5 }} />
                            ))
                        ) : lowStock.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {lowStock.slice(0, 6).map((item, i) => (
                                    <Box key={item.inventoryId ?? i} sx={{
                                        p: 1.5, bgcolor: '#fff7ed', borderRadius: 2,
                                        border: '1px solid #fed7aa'
                                    }}>
                                        <Typography variant="body2" fontWeight={600} fontSize={12} noWrap>
                                            {item.productName}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.warehouseName}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} color="#ef4444">
                                                {item.quantity}/{item.minQuantity}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min((item.quantity / Math.max(item.minQuantity, 1)) * 100, 100)}
                                            sx={{
                                                mt: 0.75, height: 4, borderRadius: 2,
                                                bgcolor: '#fed7aa',
                                                '& .MuiLinearProgress-bar': { bgcolor: '#f97316' }
                                            }}
                                        />
                                    </Box>
                                ))}
                                {lowStock.length > 6 && (
                                    <Button
                                        size="small" variant="text"
                                        onClick={() => navigate('/admin/inventory/alerts')}
                                        sx={{ textTransform: 'none', fontSize: 12 }}
                                    >
                                        Xem thêm {lowStock.length - 6} sản phẩm...
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography fontSize={32} mb={1}>✅</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tồn kho ổn định
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Không có sản phẩm nào dưới mức tối thiểu
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Orders */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{
                        borderRadius: 3, border: '1px solid', borderColor: 'divider',
                        boxShadow: 'none', overflow: 'hidden'
                    }}>
                        <Box sx={{
                            px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <Typography variant="subtitle1" fontWeight={700}>Đơn hàng gần đây</Typography>
                            <Button
                                size="small" variant="text"
                                onClick={() => navigate('/admin/orders')}
                                sx={{ textTransform: 'none', color: '#3b82f6', fontSize: 12 }}
                            >
                                Xem tất cả →
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fafaf9' }}>
                                        {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map(c => (
                                            <TableCell key={c} sx={{
                                                fontWeight: 600, fontSize: 11,
                                                color: '#6b7280', py: 1.5
                                            }}>
                                                {c}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <TableRow key={i}>
                                                {[1, 2, 3, 4].map(j => (
                                                    <TableCell key={j}>
                                                        <Skeleton height={20} />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : recentOrders.length > 0 ? (
                                        recentOrders.slice(0, 8).map((o, i) => {
                                            const st = STATUS_MAP[o.status as OrderStatus]
                                                || { label: o.status, color: '#666', bg: '#f3f4f6' };
                                            return (
                                                <TableRow
                                                    key={o.id}
                                                    hover
                                                    sx={{
                                                        bgcolor: i % 2 === 0 ? '#fff' : '#fafaf9',
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: '#f0f9ff' }
                                                    }}
                                                    onClick={() => navigate(`/admin/orders/${o.id}`)}
                                                >
                                                    <TableCell sx={{
                                                        fontSize: 12, fontFamily: 'monospace',
                                                        color: '#3b82f6', fontWeight: 600
                                                    }}>
                                                        {o.code}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 12 }}>
                                                        <Typography variant="body2" fontWeight={600} fontSize={12}>
                                                            {o.customerName || o.shippingName || 'Khách lẻ'}
                                                        </Typography>
                                                        {o.customerPhone && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {o.customerPhone}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
                                                        {fmtCurrency(o.finalAmount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={st.label} size="small"
                                                            sx={{
                                                                bgcolor: st.bg, color: st.color,
                                                                fontWeight: 600, fontSize: 11, height: 22
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                                <Typography fontSize={36} mb={1}>📋</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Chưa có đơn hàng nào
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Top Products */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{
                        p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700}>Top sản phẩm bán chạy</Typography>
                        </Box>

                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} height={48} sx={{ mb: 1, borderRadius: 1.5 }} />
                            ))
                        ) : topProducts.length > 0 ? (
                            topProducts.slice(0, 5).map((p, i) => {
                                const maxSold = Number(topProducts[0]?.total_sold || 1);
                                const colors = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe'];
                                const textColors = ['#1d4ed8', '#15803d', '#b45309', '#be185d', '#7c3aed'];
                                const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

                                return (
                                    <Box key={p.id ?? i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                        <Avatar sx={{
                                            width: 28, height: 28, fontSize: 12, fontWeight: 700,
                                            bgcolor: colors[i], color: textColors[i],
                                        }}>
                                            {i + 1}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} fontSize={12} noWrap>
                                                {p.name}
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(Number(p.total_sold) / maxSold) * 100}
                                                sx={{
                                                    mt: 0.5, height: 4, borderRadius: 2, bgcolor: '#f3f4f6',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: barColors[i], borderRadius: 2
                                                    }
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ minWidth: 30, textAlign: 'right' }}>
                                            {p.total_sold}
                                        </Typography>
                                    </Box>
                                );
                            })
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography fontSize={32} mb={1}>📦</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Chưa có dữ liệu bán hàng
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;