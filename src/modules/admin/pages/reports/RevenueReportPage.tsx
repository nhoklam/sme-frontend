// src/modules/admin/pages/reports/RevenueReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, ButtonGroup,
    Select, MenuItem, FormControl, Skeleton, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Stack, Paper, Tabs, Tab, CircularProgress,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
    ComposedChart, Area, Line,
} from 'recharts';
import {
    TrendingUp, Inventory2, AttachMoney,
    Assessment, ShowChart, BarChart as BarChartIcon,
    StorefrontOutlined, Refresh,
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

const toISO = (d: Date) => d.toISOString();

const getRangeDefault = (period: string): { from: Date; to: Date } => {
    const to = new Date();
    const from = new Date();
    if (period === 'day') from.setDate(to.getDate() - 29);
    else if (period === 'week') from.setDate(to.getDate() - 83);
    else if (period === 'month') from.setMonth(to.getMonth() - 11);
    else from.setFullYear(to.getFullYear() - 4);
    return { from, to };
};

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
    sub?: string;
    bgColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, loading, sub, bgColor }) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: bgColor || '#fff', height: '100%' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                <Box>
                    <Typography variant="h5" fontWeight={800} color={color} mb={0.25} sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12} fontWeight={600} display="block">
                        {title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={11} sx={{ minHeight: 16, display: 'block' }}>
                        {sub || '\u00A0'}
                    </Typography>
                </Box>
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
            setInventoryValue(data.sort((a: any, b: any) => (b.total_value ?? 0) - (a.total_value ?? 0)));
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

// ─── Merchandise Tab (Hàng hóa) ─────────────────────────────────
const MerchandiseTab: React.FC<{ warehouseId: string; quickFilter: string; customFrom: string; customTo: string }> = ({ warehouseId, quickFilter, customFrom, customTo }) => {
    const [inventoryValue, setInventoryValue] = useState<InventoryValueReport[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let fromDate: Date, toDate: Date;
            if (quickFilter === 'custom' && customFrom && customTo) {
                fromDate = new Date(customFrom);
                toDate = new Date(customTo + 'T23:59:59');
            } else {
                const range = getDateRange(quickFilter);
                fromDate = range.from;
                toDate = range.to;
            }

            const [invData, topData, lowData] = await Promise.all([
                reportService.getInventoryValue(warehouseId || undefined),
                reportService.getTopProducts({ from: toISO(fromDate), to: toISO(toDate), limit: 10, ...(warehouseId ? { warehouseId } : {}) }),
                (async () => { try { const { default: inventoryService } = await import('../../../../services/inventoryService'); return await inventoryService.getLowStock(warehouseId || undefined); } catch { return []; } })(),
            ]);
            setInventoryValue(invData.sort((a: any, b: any) => (b.total_value ?? 0) - (a.total_value ?? 0)));
            setTopProducts(topData);
            setLowStockItems(lowData);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [warehouseId, quickFilter, customFrom, customTo]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalValue = inventoryValue.reduce((s, d) => s + (d.total_value ?? 0), 0);
    const totalQty = inventoryValue.reduce((s, d) => s + (d.total_qty ?? 0), 0);
    const totalSku = inventoryValue.reduce((s, d) => s + (d.sku_count ?? 0), 0);
    const outOfStock = lowStockItems.filter((i: any) => (i.quantity ?? 0) === 0).length;
    const nearOutOfStock = lowStockItems.filter((i: any) => (i.quantity ?? 0) > 0).length;

    return (
        <Box>
            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                    <SummaryCard title="Tổng vốn tồn kho" value={formatCurrency(totalValue)} icon={<AttachMoney />} color="#1976d2" loading={loading} sub={`• ${totalSku.toLocaleString()} mặt hàng`} bgColor="#f0f7ff" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <SummaryCard title="Tổng số lượng tồn" value={totalQty.toLocaleString('vi-VN')} icon={<Inventory2 />} color="#2e7d32" loading={loading} bgColor="#f0fff4" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <SummaryCard title="SP sắp hết hàng" value={String(nearOutOfStock)} icon={<ShowChart />} color="#ed6c02" loading={loading} sub={`${outOfStock} hết hàng`} bgColor="#fff7ed" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <SummaryCard title="Cần nhập hàng" value={String(outOfStock + nearOutOfStock)} icon={<Assessment />} color="#d32f2f" loading={loading} bgColor="#fef2f2" />
                </Grid>
            </Grid>

            {loading ? (
                <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
            ) : (
                <>
                    {/* Charts row */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <Typography variant="subtitle2" fontWeight={700} mb={2}>Cơ cấu vốn theo chi nhánh</Typography>
                                {inventoryValue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart layout="vertical" data={inventoryValue.map(d => ({ name: d.warehouse_name, value: d.total_value ?? 0 }))} margin={{ left: 8, right: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis type="number" tickFormatter={val => `${(val / 1000000).toFixed(0)}tr`} tick={{ fontSize: 11 }} />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fontWeight: 600 }} />
                                            <Tooltip formatter={(val: number) => [formatCurrency(val), 'Giá trị']} contentStyle={{ borderRadius: 8 }} />
                                            <Bar dataKey="value" name="Giá trị tồn kho" fill="#1976d2" radius={[0, 4, 4, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">Không có dữ liệu</Typography></Box>}
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <Typography variant="subtitle2" fontWeight={700} mb={2}>Top 10 sản phẩm bán chạy</Typography>
                                {topProducts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={topProducts.slice(0, 10).map(p => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name, sold: p.total_sold }))} margin={{ top: 10, right: 10, bottom: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} angle={-25} textAnchor="end" interval={0} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip contentStyle={{ borderRadius: 8 }} />
                                            <Bar dataKey="sold" name="Đã bán" radius={[4, 4, 0, 0]}>
                                                {topProducts.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">Không có dữ liệu</Typography></Box>}
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Detail table */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                            <Typography variant="subtitle2" fontWeight={700}>Chi tiết Định mức & Giá trị kho</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>SẢN PHẨM</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>TỒN KHO</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>ĐÃ BÁN</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>DOANH THU</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>TRẠNG THÁI</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {topProducts.length > 0 ? topProducts.map((p, idx) => (
                                        <TableRow key={p.id ?? idx} hover>
                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={600} noWrap sx={{ maxWidth: 280 }}>{p.name}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontSize={13} fontWeight={600}>{(p as any).stock ?? '-'}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontSize={13} fontWeight={700} color="#1976d2">{p.total_sold.toLocaleString('vi-VN')}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontSize={13} fontWeight={700} color="#2e7d32">{formatCurrency((p as any).total_revenue ?? p.total_sold * 100000)}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip size="small" label="Bán chạy" sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: idx < 3 ? '#dcfce7' : '#f0f0f0', color: idx < 3 ? '#16a34a' : '#666', borderRadius: 1 }} />
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Không có dữ liệu</Typography></TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}
        </Box>
    );
};

// ─── Main Component ────────────────────────────────────────────
const RevenueReportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [warehouseId, setWarehouseId] = useState<string>('');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [chartPeriod, setChartPeriod] = useState<'hour' | 'day' | 'dayOfWeek' | 'month' | 'year'>('day');
    const [quickFilter, setQuickFilter] = useState<string>('30days');
    const [customFrom, setCustomFrom] = useState<string>('');
    const [customTo, setCustomTo] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');

    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [loadingRevenue, setLoadingRevenue] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const fetchRevenue = useCallback(async (filter = quickFilter, forcedPeriod = chartPeriod) => {
        setLoadingRevenue(true);
        setError('');
        try {
            let from: Date, to: Date;
            if (filter === 'custom' && customFrom && customTo) {
                from = new Date(customFrom);
                to = new Date(customTo + 'T23:59:59');
            } else {
                const range = getDateRange(filter);
                from = range.from;
                to = range.to;
            }
            const apiPeriod = forcedPeriod === 'dayOfWeek' ? 'day' : forcedPeriod;
            
            const data = await reportService.getRevenue({
                from: toISO(from), to: toISO(to), period: apiPeriod as any,
                ...(warehouseId ? { warehouseId } : {}),
                ...(paymentMethod ? { paymentMethod } : {}),
            });
            setRevenueData(data);
        } catch {
            setError('Không thể tải báo cáo doanh thu');
        } finally {
            setLoadingRevenue(false);
        }
    }, [warehouseId, quickFilter, chartPeriod, customFrom, customTo, paymentMethod]);

    useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

    const handleQuickFilterChange = (filter: any, forcedPeriod?: any) => {
        setQuickFilter(filter);
        let p = forcedPeriod || chartPeriod;
        if (!forcedPeriod) {
            if (filter === 'today' || filter === 'yesterday') p = 'hour';
            else if (filter === 'thisYear' || filter === '90days') p = 'month';
            else p = 'day';
        }
        setChartPeriod(p);
        fetchRevenue(filter, p);
    };

    const totalRevenue = revenueData.reduce((s, d) => s + (d.revenue ?? 0), 0);
    const totalCOGS = revenueData.reduce((s, d) => s + (d.cogs ?? 0), 0);
    const totalProfit = revenueData.reduce((s, d) => s + (d.gross_profit ?? 0), 0);
    const totalInvoices = revenueData.reduce((s, d) => s + (d.invoice_count ?? 0), 0);
    const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    const chartData = (() => {
        if (chartPeriod === 'hour') {
            const result = Array.from({ length: 24 }, (_, i) => ({
                name: `${i.toString().padStart(2, '0')}:00`,
                'Doanh thu': 0, 'Giá vốn': 0, 'Lợi nhuận': 0, 'Số HĐ': 0
            }));
            revenueData.forEach(d => {
                const date = new Date(d.period || '');
                if (!isNaN(date.getTime())) {
                    const hour = date.getHours();
                    result[hour]['Doanh thu'] += (d.revenue ?? 0);
                    result[hour]['Giá vốn'] += (d.cogs ?? 0);
                    result[hour]['Lợi nhuận'] += (d.gross_profit ?? 0);
                    result[hour]['Số HĐ'] += (d.invoice_count ?? 0);
                }
            });
            return result.map(r => ({
                ...r,
                'Doanh thu': r['Doanh thu'],
                'Giá vốn': r['Giá vốn'],
                'Lợi nhuận': r['Lợi nhuận'],
            }));
        }
        if (chartPeriod === 'dayOfWeek') {
            const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
            const result = days.map(d => ({ name: d, 'Doanh thu': 0, 'Giá vốn': 0, 'Lợi nhuận': 0, 'Số HĐ': 0 }));
            revenueData.forEach(d => {
                const date = new Date(d.period || '');
                if (!isNaN(date.getTime())) {
                    const dow = date.getDay(); // 0: CN, 1: T2...
                    const index = dow === 0 ? 6 : dow - 1;
                    result[index]['Doanh thu'] += (d.revenue ?? 0);
                    result[index]['Giá vốn'] += (d.cogs ?? 0);
                    result[index]['Lợi nhuận'] += (d.gross_profit ?? 0);
                    result[index]['Số HĐ'] += (d.invoice_count ?? 0);
                }
            });
            return result.map(r => ({
                ...r,
                'Doanh thu': r['Doanh thu'],
                'Giá vốn': r['Giá vốn'],
                'Lợi nhuận': r['Lợi nhuận'],
            }));
        }

        const sorted = [...revenueData].sort((a, b) => new Date(a.period || '').getTime() - new Date(b.period || '').getTime());
        return sorted.map(d => ({
            name: fmtPeriod(d.period, chartPeriod as any),
            'Doanh thu': d.revenue ?? 0,
            'Giá vốn': d.cogs ?? 0,
            'Lợi nhuận': d.gross_profit ?? 0,
            'Số HĐ': d.invoice_count ?? 0,
        }));
    })();

    const SIDEBAR_TABS = [
        { label: 'Doanh thu', desc: 'Biến động doanh số', icon: <Assessment sx={{ fontSize: 18 }} /> },
        { label: 'Giá trị tồn kho', desc: 'Phân bổ theo kho', icon: <Inventory2 sx={{ fontSize: 18 }} /> },
        { label: 'Hàng tồn động', desc: 'Kiểm soát tồn kho', icon: <BarChartIcon sx={{ fontSize: 18 }} /> },
        { label: 'Hàng hóa', desc: 'Giá trị & Định mức', icon: <TrendingUp sx={{ fontSize: 18 }} /> },
    ];

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: '20px 24px' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>Hệ thống Báo cáo</Typography>
                    <Typography variant="body2" color="#8c8c8c" fontSize={13}>Phân tích chuyên sâu dữ liệu kinh doanh đa chiều</Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
                {/* ── LEFT SIDEBAR ── */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Report Types */}
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <Typography fontWeight={700} fontSize={13} color="#8c8c8c" textTransform="uppercase" mb={2}>Loại báo cáo</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {SIDEBAR_TABS.map((t, i) => (
                                    <Box key={i} onClick={() => setActiveTab(i)} sx={{
                                        p: '12px 16px', borderRadius: 1.5, cursor: 'pointer', transition: '0.2s',
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        bgcolor: activeTab === i ? '#f0f2f5' : 'transparent',
                                        borderLeft: `4px solid ${activeTab === i ? '#1a2e85' : 'transparent'}`,
                                        '&:hover': { bgcolor: '#f0f2f5' },
                                    }}>
                                        <Box sx={{ color: activeTab === i ? '#1a2e85' : '#8c8c8c' }}>{t.icon}</Box>
                                        <Box>
                                            <Typography fontSize={14} fontWeight={activeTab === i ? 700 : 400} color={activeTab === i ? '#1a2e85' : '#262626'} display="block">{t.label}</Typography>
                                            <Typography fontSize={11} color="#8c8c8c">{t.desc}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* Filters */}
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <Typography fontWeight={700} fontSize={13} color="#8c8c8c" textTransform="uppercase" mb={2}>Bộ lọc dữ liệu</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box>
                                    <Typography variant="body2" color="#8c8c8c" fontSize={12} mb={1}>Chi nhánh / Kho</Typography>
                                    <FormControl size="small" fullWidth>
                                        <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                            <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                            {warehouses.map(w => <MenuItem key={w.id} value={w.id} sx={{ fontSize: 13 }}>{w.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="#8c8c8c" fontSize={12} mb={1}>Thời gian báo cáo</Typography>
                                    <FormControl size="small" fullWidth>
                                        <Select value={quickFilter} onChange={e => handleQuickFilterChange(e.target.value as any)} sx={{ fontSize: 13 }}>
                                            <MenuItem value="today">Hôm nay</MenuItem>
                                            <MenuItem value="yesterday">Hôm qua</MenuItem>
                                            <MenuItem value="last7days">7 ngày qua</MenuItem>
                                            <MenuItem value="30days">30 ngày</MenuItem>
                                            <MenuItem value="thisMonth">Tháng này</MenuItem>
                                            <MenuItem value="90days">3 tháng</MenuItem>
                                            <MenuItem value="thisYear">Năm nay</MenuItem>
                                            <MenuItem value="custom">Tùy chỉnh</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {quickFilter === 'custom' ? (
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
                                            <input
                                                type="date"
                                                value={customFrom}
                                                onChange={e => { setCustomFrom(e.target.value); if (customTo && e.target.value) { setQuickFilter('custom'); fetchRevenue('custom', chartPeriod); } }}
                                                style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '12px', fontWeight: 600, color: '#333', outline: 'none' }}
                                            />
                                            <Typography fontSize={12} color="#999">→</Typography>
                                            <input
                                                type="date"
                                                value={customTo}
                                                onChange={e => { setCustomTo(e.target.value); if (customFrom && e.target.value) { setQuickFilter('custom'); fetchRevenue('custom', chartPeriod); } }}
                                                style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '12px', fontWeight: 600, color: '#333', outline: 'none' }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', mt: 1.5 }}>
                                            <Typography variant="body2" color="#666" fontSize={12}>
                                                {(() => { const { from, to } = getDateRange(quickFilter); return `${from.toLocaleDateString('vi-VN')} → ${to.toLocaleDateString('vi-VN')}`; })()}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="#8c8c8c" fontSize={12} mb={1}>Phương thức thanh toán</Typography>
                                    <FormControl size="small" fullWidth>
                                        <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                            <MenuItem value="">Tất cả phương thức</MenuItem>
                                            <MenuItem value="CASH">Tiền mặt</MenuItem>
                                            <MenuItem value="CARD">Thẻ ngân hàng</MenuItem>
                                            <MenuItem value="MOMO">Ví MoMo</MenuItem>
                                            <MenuItem value="VNPAY">VNPay</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<Refresh />}
                                    onClick={() => { setQuickFilter('thisMonth'); setChartPeriod('day'); setWarehouseId(''); setCustomFrom(''); setCustomTo(''); setPaymentMethod(''); }}
                                    sx={{ color: '#666', borderColor: '#e0e0e0', textTransform: 'none', borderRadius: 1.5, mt: 0.5 }}
                                >
                                    Xóa bộ lọc
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                {/* ── RIGHT CONTENT ── */}
                <Grid size={{ xs: 12, md: 9 }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, p: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        {/* ── TAB 0: Tổng quan doanh thu ── */}
                        {activeTab === 0 && (
                            <Box>
                                {/* Summary cards */}
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid size={{ xs: 6, md: 3 }}><SummaryCard title="Tổng doanh thu" value={formatCurrency(totalRevenue)} icon={<AttachMoney />} color="#1976d2" loading={false} /></Grid>
                                    <Grid size={{ xs: 6, md: 3 }}><SummaryCard title="Lợi nhuận gộp" value={formatCurrency(totalProfit)} icon={<TrendingUp />} color="#2e7d32" loading={false} /></Grid>
                                    <Grid size={{ xs: 6, md: 3 }}><SummaryCard title="Biên lợi nhuận" value={`${marginPct}%`} icon={<ShowChart />} color="#9c27b0" loading={false} sub={`Giá vốn: ${formatCurrency(totalCOGS)}`} /></Grid>
                                    <Grid size={{ xs: 6, md: 3 }}><SummaryCard title="Tổng hóa đơn" value={totalInvoices.toLocaleString('vi-VN')} icon={<Assessment />} color="#ed6c02" loading={false} /></Grid>
                                </Grid>

                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>Biểu đồ doanh thu</Typography>
                                            <Typography variant="body2" color="#8c8c8c">Phân tích tăng trưởng và biến động doanh số</Typography>
                                        </Box>
                                        <Box sx={{ ml: 1, pl: 2, borderLeft: '1px solid #e0e0e0' }}>
                                            <Typography variant="body2" color="#8c8c8c" fontSize={12}>Tổng doanh thu</Typography>
                                            <Typography fontWeight={700} fontSize={20} color="#3f8600">{formatCurrency(totalRevenue)}</Typography>
                                        </Box>
                                    </Box>
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
                                </Box>

                                {/* Chart */}
                                <Box sx={{ height: 400, position: 'relative' }}>
                                    {loadingRevenue && (
                                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                                            <CircularProgress size={36} />
                                        </Box>
                                    )}
                                    {chartData.length === 0 && !loadingRevenue ? (
                                        <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Assessment sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                                <Typography color="text.secondary">Chưa có dữ liệu doanh thu</Typography>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <>
                                            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Đơn vị: VNĐ</Typography>
                                            <ResponsiveContainer width="100%" height={360}>
                                                <BarChart data={chartData} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={val => `${(val / 1000).toLocaleString('vi-VN')}k`} />
                                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#0891b2', fontWeight: 600 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#f1f5f9' }}
                                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                                                        formatter={(val: number, name: string) => [
                                                            name === 'Số HĐ' ? val : formatCurrency(val),
                                                            name
                                                        ]}
                                                        labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}
                                                    />
                                                    <Legend align="center" verticalAlign="bottom" iconType="rect" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                                                    <Bar yAxisId="left" name="Doanh thu" dataKey="Doanh thu" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={80} />
                                                    <Bar yAxisId="right" name="Số HĐ" dataKey="Số HĐ" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={80} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* ── TAB 1: Giá trị tồn kho ── */}
                        {activeTab === 1 && <InventoryValueTab warehouseId={warehouseId} />}

                        {/* ── TAB 2: Hàng tồn động ── */}
                        {activeTab === 2 && <DeadStockTab warehouseId={warehouseId} />}

                        {/* ── TAB 3: Hàng hóa ── */}
                        {activeTab === 3 && <MerchandiseTab warehouseId={warehouseId} quickFilter={quickFilter} customFrom={customFrom} customTo={customTo} />}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default RevenueReportPage;
