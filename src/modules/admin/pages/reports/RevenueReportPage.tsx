// src/modules/admin/pages/reports/RevenueReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, ButtonGroup,
    Select, MenuItem, FormControl, Skeleton, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Stack, Paper, Tabs, Tab,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
    ComposedChart, Area, Line,
} from 'recharts';
import {
    TrendingUp, Inventory2, AttachMoney,
    Assessment, ShowChart, BarChart as BarChartIcon,
    StorefrontOutlined,
} from '@mui/icons-material';
import reportService from '../../../../services/reportService';
import warehouseService from '../../../../services/warehouseService';
import type {
    RevenueDataPoint, TopProduct, InventoryValueReport,
    ReportPeriod, DeadStockItem,
} from '../../../../types/index';
import type { Warehouse } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────
const fmtPeriod = (period: string, type: ReportPeriod) => {
    if (!period) return '';
    try {
        const d = new Date(period);
        if (type === 'day') return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        if (type === 'week') return `T${d.getDate()}/${d.getMonth() + 1}`;
        if (type === 'month') return d.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
        return String(d.getFullYear());
    } catch {
        return period;
    }
};

const getRangeDefault = (period: ReportPeriod): { from: Date; to: Date } => {
    const to = new Date();
    const from = new Date();
    if (period === 'day') from.setDate(to.getDate() - 29);
    else if (period === 'week') from.setDate(to.getDate() - 83);
    else if (period === 'month') from.setMonth(to.getMonth() - 11);
    else from.setFullYear(to.getFullYear() - 4);
    return { from, to };
};

const toISO = (d: Date) => d.toISOString();

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f', '#388e3c', '#f57c00'];

// ─── Summary Card ──────────────────────────────────────────────
interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    loading: boolean;
    sub?: string;
    bgColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, loading, sub, bgColor }) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: bgColor || '#fff' }}>
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
                        <Typography variant="caption" color="text.secondary" fontSize={11}>
                            {sub}
                        </Typography>
                    )}
                </>
            )}
        </CardContent>
    </Card>
);

// ─── Tab Panel ─────────────────────────────────────────────────
const TabPanel: React.FC<{ value: number; index: number; children: React.ReactNode }> = ({ value, index, children }) =>
    value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;

// ─── Inventory Value Tab ────────────────────────────────────────
const InventoryValueTab: React.FC<{ warehouseId: string }> = ({ warehouseId }) => {
    const [inventoryValue, setInventoryValue] = useState<InventoryValueReport[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await reportService.getInventoryValue(warehouseId || undefined);
            setInventoryValue(data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [warehouseId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalValue = inventoryValue.reduce((s, d) => s + (d.total_value ?? 0), 0);
    const totalQty = inventoryValue.reduce((s, d) => s + (d.total_qty ?? 0), 0);
    const totalSku = inventoryValue.reduce((s, d) => s + (d.sku_count ?? 0), 0);

    return (
        <Box>
            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryCard
                        title="Tổng giá trị tồn kho"
                        value={formatCurrency(totalValue)}
                        icon={<AttachMoney />}
                        color="#1976d2"
                        loading={loading}
                        bgColor="#f0f7ff"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryCard
                        title="Tổng số lượng tồn"
                        value={totalQty.toLocaleString('vi-VN')}
                        icon={<Inventory2 />}
                        color="#2e7d32"
                        loading={loading}
                        bgColor="#f0fff4"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryCard
                        title="Tổng mã hàng (SKU)"
                        value={totalSku.toLocaleString('vi-VN')}
                        icon={<StorefrontOutlined />}
                        color="#9c27b0"
                        loading={loading}
                        bgColor="#fdf4ff"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                        <Typography variant="subtitle1" fontWeight={700} mb={2}>
                            Giá trị tồn kho theo chi nhánh
                        </Typography>
                        {loading ? (
                            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
                        ) : inventoryValue.length === 0 ? (
                            <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                                <Typography color="text.secondary">Không có dữ liệu</Typography>
                            </Box>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={inventoryValue.map(d => ({
                                        name: d.warehouse_name?.length > 12 ? d.warehouse_name.slice(0, 12) + '...' : d.warehouse_name,
                                        'Giá trị (M)': Math.round((d.total_value ?? 0) / 1_000_000),
                                        fullName: d.warehouse_name,
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            formatter={(v: number) => [`${v.toLocaleString('vi-VN')}M đ`, 'Giá trị']}
                                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                        />
                                        <Bar dataKey="Giá trị (M)" radius={[4, 4, 0, 0]}>
                                            {inventoryValue.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>

                                <TableContainer sx={{ mt: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                {['Chi nhánh', 'SKU', 'Tổng SL', 'Giá trị'].map(c => (
                                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {inventoryValue.map((iv, i) => (
                                                <TableRow key={i} hover>
                                                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{iv.warehouse_name}</TableCell>
                                                    <TableCell>
                                                        <Chip label={iv.sku_count} size="small" sx={{ height: 20, fontSize: 11 }} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 12 }}>{iv.total_qty?.toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 12 }}>
                                                        {formatCurrency(iv.total_value)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </Paper>
                </Grid>
                {/* Phân bổ theo kho */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={700} mb={2}>
                            📊 Phân bổ theo kho
                        </Typography>
                        {!loading && inventoryValue.length > 0 && (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={inventoryValue}
                                            dataKey="total_value"
                                            nameKey="warehouse_name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            label={false}
                                        >
                                            {inventoryValue.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={COLORS[i % COLORS.length]}
                                                    stroke="#fff"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(v: number) => formatCurrency(v)}
                                            contentStyle={{
                                                borderRadius: 8,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                border: 'none',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Chi tiết phân bổ dạng thanh ngang */}
                                <Box sx={{ mt: 1, pt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1.5} display="block">
                                        🔹 Chi tiết phân bổ
                                    </Typography>
                                    {inventoryValue.map((iv, i) => {
                                        const percent = ((iv.total_value / totalValue) * 100);
                                        return (
                                            <Box key={i} sx={{ mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                                                        <Typography variant="body2" fontSize={12} fontWeight={500}>
                                                            {iv.warehouse_name}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={700} fontSize={12}>
                                                        {formatCurrency(iv.total_value)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ height: 6, bgcolor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                                                    <Box sx={{
                                                        height: '100%',
                                                        width: `${percent}%`,
                                                        bgcolor: COLORS[i % COLORS.length],
                                                        borderRadius: 3,
                                                    }} />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" fontSize={10} sx={{ mt: 0.25, display: 'block' }}>
                                                    {percent.toFixed(1)}% · {iv.sku_count} SKU · {iv.total_qty?.toLocaleString()} SP
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </>
                        )}
                        {!loading && inventoryValue.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Inventory2 sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                <Typography color="text.secondary" fontSize={13}>Không có dữ liệu</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// ─── Dead Stock Tab ─────────────────────────────────────────────
const DeadStockTab: React.FC<{ warehouseId: string }> = ({ warehouseId }) => {
    const [deadStock, setDeadStock] = useState<DeadStockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [days, setDays] = useState(90);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await reportService.getDeadStock(days, warehouseId || undefined);
            setDeadStock(data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [days, warehouseId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Hàng tồn kho chậm luân chuyển</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Sản phẩm còn tồn kho nhưng không phát sinh giao dịch trong khoảng thời gian chọn
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Không giao dịch:</Typography>
                    <ButtonGroup size="small" variant="outlined">
                        {[30, 60, 90, 180].map(d => (
                            <Button key={d}
                                variant={days === d ? 'contained' : 'outlined'}
                                onClick={() => setDays(d)}
                                sx={{ textTransform: 'none', fontSize: 12 }}>
                                {d} ngày
                            </Button>
                        ))}
                    </ButtonGroup>
                </Box>
            </Box>

            {loading ? (
                [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={52} sx={{ mb: 1, borderRadius: 2 }} />)
            ) : deadStock.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px solid #f0f0f0' }}>
                    <Inventory2 sx={{ fontSize: 64, color: '#c8e6c9', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>
                        Không có hàng tồn động
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Tất cả sản phẩm đều có giao dịch trong {days} ngày qua
                    </Typography>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    <Box sx={{ px: 2.5, py: 1.75, bgcolor: '#fff8e1', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={700} color="#e65100">
                            ⚠️ {deadStock.length} sản phẩm không có giao dịch trong {days} ngày
                        </Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 480 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#fafafa' }}>
                                    {['#', 'Tên sản phẩm', 'Barcode / ISBN', 'Tồn kho hiện tại'].map(c => (
                                        <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', bgcolor: '#fafafa' }}>
                                            {c}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {deadStock.map((d, idx) => (
                                    <TableRow key={d.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <TableCell sx={{ py: 1.25, color: '#bbb', fontWeight: 600, fontSize: 12 }}>
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography variant="body2" fontWeight={600} fontSize={13}>
                                                {d.product_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography variant="caption" fontFamily="monospace" color="#888">
                                                {d.isbn_barcode}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Chip
                                                label={d.quantity}
                                                size="small"
                                                color={d.quantity > 50 ? 'warning' : 'default'}
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

// ─── Top Products Tab ───────────────────────────────────────────
const TopProductsTab: React.FC<{ warehouseId: string }> = ({ warehouseId }) => {
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<ReportPeriod>('month');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { from, to } = getRangeDefault(period);
            const data = await reportService.getTopProducts({
                from: toISO(from), to: toISO(to),
                limit: 20,
                ...(warehouseId ? { warehouseId } : {}),
            });
            setTopProducts(data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [period, warehouseId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const maxSold = topProducts[0]?.total_sold ?? 1;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700}>Top sản phẩm bán chạy</Typography>
                <ButtonGroup size="small" variant="outlined">
                    {(['day', 'week', 'month', 'year'] as ReportPeriod[]).map(p => (
                        <Button key={p} variant={period === p ? 'contained' : 'outlined'}
                            onClick={() => setPeriod(p)}
                            sx={{ textTransform: 'none', fontSize: 12 }}>
                            {{ day: 'Ngày', week: 'Tuần', month: 'Tháng', year: 'Năm' }[p]}
                        </Button>
                    ))}
                </ButtonGroup>
            </Box>

            {loading ? (
                [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={52} sx={{ mb: 1, borderRadius: 2 }} />)
            ) : topProducts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <TrendingUp sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                    <Typography color="text.secondary">Không có dữ liệu bán hàng</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#888', width: 40 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>SẢN PHẨM</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>ĐÃ BÁN</TableCell>
                                            <TableCell sx={{ width: 120 }}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {topProducts.map((p, idx) => {
                                            const pct = Math.round((p.total_sold / maxSold) * 100);
                                            return (
                                                <TableRow key={p.id ?? idx} hover sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                                                    <TableCell>
                                                        <Box sx={{
                                                            width: 28, height: 28, borderRadius: '50%',
                                                            bgcolor: idx < 3 ? COLORS[idx] : '#f5f5f5',
                                                            color: idx < 3 ? '#fff' : '#888',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: 12,
                                                        }}>
                                                            {idx + 1}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} fontSize={13} noWrap sx={{ maxWidth: 260 }}>
                                                            {p.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {p.total_sold.toLocaleString('vi-VN')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ height: 6, bgcolor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                                                            <Box sx={{
                                                                height: '100%', width: `${pct}%`,
                                                                bgcolor: COLORS[idx % COLORS.length],
                                                                borderRadius: 3,
                                                            }} />
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                                Top 10 biểu đồ cột
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    layout="vertical"
                                    data={topProducts.slice(0, 10).map(p => ({
                                        name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
                                        sold: p.total_sold,
                                    }))}
                                    margin={{ left: 8, right: 16 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                    <Bar dataKey="sold" name="Đã bán" radius={[0, 4, 4, 0]}>
                                        {topProducts.slice(0, 10).map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

// ─── Main Component ────────────────────────────────────────────
const RevenueReportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [period, setPeriod] = useState<ReportPeriod>('day');
    const [warehouseId, setWarehouseId] = useState<string>('');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [loadingRevenue, setLoadingRevenue] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const fetchRevenue = useCallback(async () => {
        setLoadingRevenue(true);
        setError('');
        try {
            const { from, to } = getRangeDefault(period);
            const data = await reportService.getRevenue({
                from: toISO(from), to: toISO(to), period,
                ...(warehouseId ? { warehouseId } : {}),
            });
            setRevenueData(data);
        } catch {
            setError('Không thể tải báo cáo doanh thu');
        } finally {
            setLoadingRevenue(false);
        }
    }, [period, warehouseId]);

    useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

    const totalRevenue = revenueData.reduce((s, d) => s + (d.revenue ?? 0), 0);
    const totalCOGS = revenueData.reduce((s, d) => s + (d.cogs ?? 0), 0);
    const totalProfit = revenueData.reduce((s, d) => s + (d.gross_profit ?? 0), 0);
    const totalInvoices = revenueData.reduce((s, d) => s + (d.invoice_count ?? 0), 0);
    const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    const chartData = revenueData.map(d => ({
        name: fmtPeriod(d.period, period),
        'Doanh thu': Math.round((d.revenue ?? 0) / 1_000_000),
        'Giá vốn': Math.round((d.cogs ?? 0) / 1_000_000),
        'Lợi nhuận': Math.round((d.gross_profit ?? 0) / 1_000_000),
        'Số HĐ': d.invoice_count ?? 0,
    }));

    const PERIOD_OPTIONS = [
        { label: '30 ngày qua', value: 'day' as ReportPeriod },
        { label: '12 tuần', value: 'week' as ReportPeriod },
        { label: '12 tháng', value: 'month' as ReportPeriod },
        { label: 'Các năm', value: 'year' as ReportPeriod },
    ];

    const TAB_LABELS = [
        { label: 'Tổng quan', icon: <Assessment sx={{ fontSize: 16 }} /> },
        { label: 'Giá trị tồn kho', icon: <Inventory2 sx={{ fontSize: 16 }} /> },
        { label: 'Hàng tồn động', icon: <BarChartIcon sx={{ fontSize: 16 }} /> },
        { label: 'Sản phẩm bán chạy', icon: <TrendingUp sx={{ fontSize: 16 }} /> },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>
                        Dashboard / <strong style={{ color: '#555' }}>Báo cáo</strong>
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>
                        Báo cáo & Phân tích
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                        Theo dõi các chỉ số kinh doanh và tồn kho theo thời gian thực
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <Select
                            value={warehouseId}
                            onChange={e => setWarehouseId(e.target.value)}
                            displayEmpty
                            sx={{ fontSize: 13 }}
                        >
                            <MenuItem value="">Toàn hệ thống (Tất cả chi nhánh)</MenuItem>
                            {warehouses.map(w => (
                                <MenuItem key={w.id} value={w.id} sx={{ fontSize: 13 }}>
                                    {w.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Tabs */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: '1px solid #f0f0f0', px: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none', fontWeight: 600, fontSize: 13,
                                minHeight: 48, px: 2,
                            },
                            '& .MuiTabs-indicator': { bgcolor: '#1976d2', height: 2 },
                            '& .Mui-selected': { color: '#1976d2 !important' },
                        }}
                    >
                        {TAB_LABELS.map((t, i) => (
                            <Tab key={i} icon={t.icon} iconPosition="start" label={t.label} />
                        ))}
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* ── TAB 0: Tổng quan ── */}
                    <TabPanel value={activeTab} index={0}>
                        {/* Period selector */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700}>Biến động Doanh thu</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {PERIOD_OPTIONS.map(opt => (
                                    <Button key={opt.value} size="small"
                                        onClick={() => setPeriod(opt.value)}
                                        sx={{
                                            textTransform: 'none', fontSize: 12, fontWeight: 600,
                                            px: 1.5, borderRadius: 1.5,
                                            bgcolor: period === opt.value ? '#1976d2' : 'transparent',
                                            color: period === opt.value ? '#fff' : '#555',
                                            border: '1px solid',
                                            borderColor: period === opt.value ? '#1976d2' : '#e0e0e0',
                                            '&:hover': { bgcolor: period === opt.value ? '#1565c0' : '#f5f5f5' },
                                        }}>
                                        {opt.label}
                                    </Button>
                                ))}
                            </Box>
                        </Box>

                        {/* Summary stats */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <SummaryCard
                                    title="Tổng doanh thu"
                                    value={formatCurrency(totalRevenue)}
                                    icon={<AttachMoney />}
                                    color="#1976d2"
                                    loading={loadingRevenue}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <SummaryCard
                                    title="Lợi nhuận gộp"
                                    value={formatCurrency(totalProfit)}
                                    icon={<TrendingUp />}
                                    color="#2e7d32"
                                    loading={loadingRevenue}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <SummaryCard
                                    title="Biên lợi nhuận"
                                    value={`${marginPct}%`}
                                    icon={<ShowChart />}
                                    color="#9c27b0"
                                    loading={loadingRevenue}
                                    sub={`Giá vốn: ${formatCurrency(totalCOGS)}`}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <SummaryCard
                                    title="Tổng hóa đơn"
                                    value={totalInvoices.toLocaleString('vi-VN')}
                                    icon={<Assessment />}
                                    color="#ed6c02"
                                    loading={loadingRevenue}
                                />
                            </Grid>
                        </Grid>

                        {/* Chart */}
                        {loadingRevenue ? (
                            <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
                        ) : chartData.length === 0 ? (
                            <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Assessment sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                    <Typography color="text.secondary">Chưa có dữ liệu doanh thu</Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                                    Đơn vị: Triệu VNĐ (M)
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            formatter={(v: number, name: string) => {
                                                if (name === 'Số HĐ') return [v, name];
                                                return [`${v.toLocaleString('vi-VN')}M đ`, name];
                                            }}
                                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                        />
                                        <Legend />
                                        <Area yAxisId="left" type="monotone" dataKey="Doanh thu" fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} dot={false} />
                                        <Area yAxisId="left" type="monotone" dataKey="Lợi nhuận" fill="#e8f5e9" stroke="#2e7d32" strokeWidth={2} dot={false} />
                                        <Line yAxisId="right" type="monotone" dataKey="Số HĐ" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </Paper>
                        )}

                        {/* Revenue table */}
                        {!loadingRevenue && chartData.length > 0 && (
                            <Paper elevation={0} sx={{ mt: 2, borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                <Box sx={{ px: 2.5, py: 1.75, bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                    <Typography variant="caption" fontWeight={700} color="#555">CHI TIẾT THEO KỲ</Typography>
                                </Box>
                                <TableContainer sx={{ maxHeight: 280, overflow: 'auto' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                {['Kỳ', 'Doanh thu', 'Giá vốn', 'Lợi nhuận gộp', 'Biên LN', 'Số HĐ'].map(c => (
                                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', bgcolor: '#fafafa' }}>
                                                        {c}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {revenueData.map((d, idx) => {
                                                const margin = d.revenue > 0 ? ((d.gross_profit / d.revenue) * 100).toFixed(1) : '0';
                                                return (
                                                    <TableRow key={idx} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                                                            {fmtPeriod(d.period, period)}
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#1976d2', fontWeight: 600, fontSize: 12 }}>
                                                            {formatCurrency(d.revenue)}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: 12 }}>{formatCurrency(d.cogs)}</TableCell>
                                                        <TableCell sx={{ color: '#2e7d32', fontWeight: 600, fontSize: 12 }}>
                                                            {formatCurrency(d.gross_profit)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={`${margin}%`}
                                                                size="small"
                                                                sx={{
                                                                    height: 20, fontSize: 10, fontWeight: 700,
                                                                    bgcolor: Number(margin) >= 20 ? '#e8f5e9' : '#fff8e1',
                                                                    color: Number(margin) >= 20 ? '#2e7d32' : '#e65100',
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
                                                            {d.invoice_count}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}
                    </TabPanel>

                    {/* ── TAB 1: Giá trị tồn kho ── */}
                    <TabPanel value={activeTab} index={1}>
                        <InventoryValueTab warehouseId={warehouseId} />
                    </TabPanel>

                    {/* ── TAB 2: Hàng tồn động ── */}
                    <TabPanel value={activeTab} index={2}>
                        <DeadStockTab warehouseId={warehouseId} />
                    </TabPanel>

                    {/* ── TAB 3: Sản phẩm bán chạy ── */}
                    <TabPanel value={activeTab} index={3}>
                        <TopProductsTab warehouseId={warehouseId} />
                    </TabPanel>
                </Box>
            </Paper>
        </Box>
    );
};

export default RevenueReportPage;