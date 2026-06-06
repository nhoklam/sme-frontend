import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Grid, Button, TextField,
    Select, MenuItem,
    FormControl, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Skeleton, Alert, Snackbar,
    LinearProgress,
    Avatar,
} from '@mui/material';
import {
    FileDownloadOutlined, Upload, Refresh, CheckCircle,
    Error as ErrorIcon, Description,
    PieChart as PieChartIcon,
    TrendingUp, Inventory2, Business,
    Category, BarChart as BarChartIcon, Receipt,
} from '@mui/icons-material';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import axiosInstance from '../../../../services/axiosConfig';
import warehouseService from '../../../../services/warehouseService';
import { Warehouse } from '../../../../types';

const fmtCurrency = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtShort = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
};

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const lastMonthStart = () => new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10);

const PIE_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
    '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#6366f1',
];

// Hàm export Excel đơn giản (nếu chưa có util)
const downloadExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <Paper elevation={3} sx={{ p: 1.5, borderRadius: 1.5, fontSize: 12 }}>
            <Typography fontWeight={700} fontSize={12}>{d.name}</Typography>
            <Typography color="#374151" fontSize={12}>{fmtCurrency(d.value)}</Typography>
            <Typography color="#9ca3af" fontSize={11}>{d.percent}% tổng giá trị</Typography>
        </Paper>
    );
};

interface ImportResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
}

interface ImportTabProps {
    title: string;
    description: string;
    templateColumns: string[];
    templateSampleRow: Record<string, any>;
    templateFilename: string;
    onImport: (file: File) => Promise<ImportResult>;
    color: string;
    icon: React.ReactNode;
    tips: string[];
}

const ImportTab: React.FC<ImportTabProps> = ({
    title, description, templateColumns, templateSampleRow, templateFilename,
    onImport, color, icon, tips,
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [err, setErr] = useState('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f); setResult(null); setErr('');

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target?.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data: any[] = XLSX.utils.sheet_to_json(ws);
                setPreview(data.slice(0, 5));
            } catch {
                setErr('Không đọc được file Excel. Vui lòng dùng đúng template.');
            }
        };
        reader.readAsBinaryString(f);
        e.target.value = '';
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true); setErr('');
        try {
            const res = await onImport(file);
            setResult(res);
            if (res.success > 0) setFile(null);
        } catch (e: any) {
            setErr(e.response?.data?.message || 'Import thất bại. Vui lòng kiểm tra lại file.');
        } finally { setImporting(false); }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([templateSampleRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `${templateFilename}.xlsx`);
    };

    const reset = () => { setFile(null); setPreview([]); setResult(null); setErr(''); };

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Left: Upload area */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        {/* Header */}
                        <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${color}15, ${color}05)`, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${color}20`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {icon}
                            </Box>
                            <Box>
                                <Typography fontWeight={800} fontSize={15} color="#111">{title}</Typography>
                                <Typography variant="caption" color="#6b7280">{description}</Typography>
                            </Box>
                            <Box sx={{ ml: 'auto' }}>
                                <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 14 }} />}
                                    onClick={downloadTemplate}
                                    sx={{ textTransform: 'none', fontSize: 11, borderColor: color, color: color, borderRadius: 1.5 }}>
                                    Tải template
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setErr('')}>{err}</Alert>}

                            {/* Result */}
                            {result && (
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                                        <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                            <CheckCircle sx={{ color: '#16a34a', fontSize: 28, display: 'block', mx: 'auto', mb: 0.5 }} />
                                            <Typography fontWeight={800} fontSize={22} color="#16a34a">{result.success}</Typography>
                                            <Typography variant="caption" color="#166534">Thành công</Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                                            <ErrorIcon sx={{ color: '#dc2626', fontSize: 28, display: 'block', mx: 'auto', mb: 0.5 }} />
                                            <Typography fontWeight={800} fontSize={22} color="#dc2626">{result.failed}</Typography>
                                            <Typography variant="caption" color="#991b1b">Lỗi</Typography>
                                        </Box>
                                    </Box>
                                    {result.errors.length > 0 && (
                                        <Paper elevation={0} sx={{ border: '1px solid #fecaca', borderRadius: 1.5, maxHeight: 160, overflowY: 'auto', bgcolor: '#fef2f2' }}>
                                            {result.errors.slice(0, 20).map((e, i) => (
                                                <Box key={i} sx={{ px: 2, py: 0.75, borderBottom: '1px solid #fee2e2', display: 'flex', gap: 1 }}>
                                                    <Typography variant="caption" color="#9ca3af" sx={{ minWidth: 50 }}>Dòng {e.row}</Typography>
                                                    <Typography variant="caption" color="#dc2626">{e.message}</Typography>
                                                </Box>
                                            ))}
                                        </Paper>
                                    )}
                                    <Button variant="outlined" size="small" onClick={reset} sx={{ mt: 1.5, textTransform: 'none', borderColor: '#e0e0e0', color: '#6b7280' }}>
                                        Import thêm
                                    </Button>
                                </Box>
                            )}

                            {/* Drop zone */}
                            {!result && (
                                <>
                                    <Box onClick={() => fileRef.current?.click()} sx={{
                                        border: `2px dashed ${file ? color : '#d1d5db'}`, borderRadius: 2, p: 4, textAlign: 'center',
                                        cursor: 'pointer', transition: 'all 0.2s', bgcolor: file ? `${color}08` : '#fafafa',
                                        '&:hover': { borderColor: color, bgcolor: `${color}08` },
                                    }}>
                                        {file ? (
                                            <>
                                                <Description sx={{ fontSize: 40, color: color, display: 'block', mx: 'auto', mb: 1 }} />
                                                <Typography fontWeight={700} color={color}>{file.name}</Typography>
                                                <Typography variant="caption" color="#6b7280">{(file.size / 1024).toFixed(1)} KB · Click để chọn lại</Typography>
                                            </>
                                        ) : (
                                            <>
                                                <Upload sx={{ fontSize: 40, color: '#9ca3af', display: 'block', mx: 'auto', mb: 1 }} />
                                                <Typography fontWeight={600} color="#374151" mb={0.5}>Kéo thả hoặc click để chọn file</Typography>
                                                <Typography variant="caption" color="#9ca3af">Hỗ trợ .xlsx, .xls · Tối đa 10MB</Typography>
                                            </>
                                        )}
                                    </Box>
                                    <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFileSelect} />
                                </>
                            )}

                            {/* Preview */}
                            {preview.length > 0 && !result && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1}>
                                        Xem trước ({preview.length} dòng đầu):
                                    </Typography>
                                    <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, maxHeight: 200 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                                    {Object.keys(preview[0] ?? {}).map(k => (
                                                        <TableCell key={k} sx={{ fontSize: 10, fontWeight: 700, color: '#6b7280', py: 1 }}>{k}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {preview.map((row, i) => (
                                                    <TableRow key={i}>
                                                        {Object.values(row).map((v: any, j) => (
                                                            <TableCell key={j} sx={{ fontSize: 11, py: 0.75 }}>{String(v ?? '')}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}

                            {/* Actions */}
                            {file && !result && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                    <Button variant="outlined" onClick={reset} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#6b7280', borderRadius: 1.5 }}>Hủy</Button>
                                    <Button variant="contained" onClick={handleImport} disabled={importing}
                                        sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: color, '&:hover': { filter: 'brightness(0.9)' } }}>
                                        {importing ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                Đang import...
                                            </Box>
                                        ) : `Import ${preview.length > 0 ? `(${preview.length}+ dòng)` : 'file'}`}
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right: Tips + Columns */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', mb: 2 }}>
                        <Typography fontWeight={700} fontSize={13} color="#374151" mb={1.5}>📋 Cột yêu cầu trong file Excel</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            {templateColumns.map((col, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: `${color}20`, color: color, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {i + 1}
                                    </Box>
                                    <Typography variant="caption" fontFamily="monospace" fontSize={12} color="#374151">{col}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${color}30`, bgcolor: `${color}05` }}>
                        <Typography fontWeight={700} fontSize={13} color={color} mb={1.5}>💡 Lưu ý khi import</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {tips.map((tip, i) => (
                                <Typography key={i} variant="caption" color="#374151" lineHeight={1.6}>• {tip}</Typography>
                            ))}
                        </Box>
                    </Paper>
                    <Box sx={{ mt: 2 }}>
                        <Button fullWidth variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                            onClick={downloadTemplate}
                            sx={{ textTransform: 'none', borderColor: color, color: color, fontWeight: 600, borderRadius: 2, py: 1.25 }}>
                            Tải file mẫu ({templateFilename}.xlsx)
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// ── TAB 1: DOANH THU ─────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
const RevenueTab: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    const [params, setParams] = useState({ from: monthStart(), to: today(), warehouseId: '', groupBy: 'day' });
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ revenue: 0, orders: 0, avgOrder: 0, grossProfit: 0 });
    const [loading, setLoading] = useState(false);
    const [topProducts, setTopProducts] = useState<any[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                from: new Date(params.from).toISOString(),
                to: new Date(params.to + 'T23:59:59').toISOString(),
                groupBy: params.groupBy,
                ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
            });
            const [revenueRes, topRes] = await Promise.all([
                axiosInstance.get(`/reports/revenue?${q}`),
                axiosInstance.get(`/reports/top-products?${q}&limit=10`),
            ]);
            const rows = revenueRes.data?.data ?? [];
            setData(rows);
            const totalRevenue = rows.reduce((s: number, r: any) => s + (r.revenue ?? 0), 0);
            const totalOrders = rows.reduce((s: number, r: any) => s + (r.orders ?? 0), 0);
            const totalProfit = rows.reduce((s: number, r: any) => s + (r.grossProfit ?? 0), 0);
            setSummary({ revenue: totalRevenue, orders: totalOrders, avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0, grossProfit: totalProfit });
            setTopProducts(topRes.data?.data ?? []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [params]);

    useEffect(() => { load(); }, [load]);

    const chartData = data.map(d => ({
        label: (() => {
            try {
                const date = new Date(d.date ?? d.label);
                if (params.groupBy === 'month') return date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
                return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            } catch { return d.date ?? d.label; }
        })(),
        revenue: d.revenue ?? 0,
        orders: d.orders ?? 0,
        grossProfit: d.grossProfit ?? 0,
    }));

    const handleExport = () => {
        downloadExcel(data.map(d => ({
            'Thời gian': d.date ?? d.label,
            'Doanh thu': d.revenue,
            'Số đơn': d.orders,
            'Lãi gộp': d.grossProfit,
        })), `bao-cao-doanh-thu-${params.from}-${params.to}`);
    };

    const maxTop = topProducts[0]?.total_sold ?? 1;

    return (
        <Box>
            {/* Summary cards */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {[
                    { label: 'Tổng doanh thu', value: fmtCurrency(summary.revenue), icon: '💰', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                    { label: 'Số đơn hàng', value: summary.orders.toLocaleString(), icon: '🛒', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
                    { label: 'Đơn hàng trung bình', value: fmtCurrency(summary.avgOrder), icon: '📊', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
                    { label: 'Lãi gộp', value: fmtCurrency(summary.grossProfit), icon: '📈', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                ].map(c => (
                    <Grid size={{ xs: 6, md: 3 }} key={c.label}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${c.border}`, bgcolor: c.bg }}>
                            <Typography fontSize={24} display="block" mb={0.5}>{c.icon}</Typography>
                            {loading ? <Skeleton height={28} /> : <Typography fontWeight={800} fontSize={17} color={c.color}>{c.value}</Typography>}
                            <Typography variant="caption" color="#6b7280" fontSize={11}>{c.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" type="date" label="Từ ngày" value={params.from}
                        onChange={e => setParams(p => ({ ...p, from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />
                    <TextField size="small" type="date" label="Đến ngày" value={params.to}
                        onChange={e => setParams(p => ({ ...p, to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select value={params.warehouseId} onChange={e => setParams(p => ({ ...p, warehouseId: e.target.value }))} displayEmpty>
                            <MenuItem value="">Tất cả chi nhánh</MenuItem>
                            {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select value={params.groupBy} onChange={e => setParams(p => ({ ...p, groupBy: e.target.value }))}>
                            <MenuItem value="day">Theo ngày</MenuItem>
                            <MenuItem value="week">Theo tuần</MenuItem>
                            <MenuItem value="month">Theo tháng</MenuItem>
                        </Select>
                    </FormControl>
                    {/* Quick range */}
                    {[
                        { label: 'Tháng này', from: monthStart(), to: today() },
                        { label: 'Tháng trước', from: lastMonthStart(), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10) },
                        { label: '7 ngày', from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), to: today() },
                    ].map(r => (
                        <Button key={r.label} size="small" variant="outlined" onClick={() => setParams(p => ({ ...p, from: r.from, to: r.to }))}
                            sx={{ textTransform: 'none', fontSize: 11, borderColor: '#e0e0e0', color: '#6b7280', py: 0.5 }}>{r.label}</Button>
                    ))}
                    <Box sx={{ flex: 1 }} />
                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />} onClick={load} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />} onClick={handleExport}
                        sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a' }}>Excel</Button>
                </Box>
            </Paper>

            <Grid container spacing={2}>
                {/* Area chart */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#374151" mb={2}>Biểu đồ doanh thu theo thời gian</Typography>
                        {loading ? <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1.5 }} /> :
                            chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                        <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                        <RTooltip
                                            formatter={(v: any, name: string) => [
                                                name === 'revenue' ? fmtCurrency(v) : name === 'grossProfit' ? fmtCurrency(v) : v,
                                                name === 'revenue' ? 'Doanh thu' : name === 'grossProfit' ? 'Lãi gộp' : 'Đơn hàng',
                                            ]}
                                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                        />
                                        <Legend formatter={v => v === 'revenue' ? 'Doanh thu' : v === 'grossProfit' ? 'Lãi gộp' : 'Đơn hàng'} />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gRev)" dot={false} activeDot={{ r: 5 }} />
                                        <Area type="monotone" dataKey="grossProfit" stroke="#10b981" strokeWidth={2} fill="url(#gProfit)" dot={false} activeDot={{ r: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                                    <TrendingUp sx={{ fontSize: 48, color: '#e5e7eb' }} />
                                    <Typography color="#9ca3af" fontSize={13}>Không có dữ liệu trong khoảng thời gian này</Typography>
                                </Box>
                            )}
                    </Paper>
                </Grid>

                {/* Order bar chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#374151" mb={2}>Số đơn hàng</Typography>
                        {loading ? <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1.5 }} /> :
                            chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={chartData.slice(-10)} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                        <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v: any) => [v, 'Đơn hàng']} />
                                        <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                                            {chartData.slice(-10).map((_, i) => (
                                                <Cell key={i} fill={`hsl(${38 + i * 4}, 90%, ${55 + i * 2}%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="#9ca3af" fontSize={13}>Không có dữ liệu</Typography>
                                </Box>
                            )}
                    </Paper>
                </Grid>

                {/* Top products */}
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#374151">🏆 Top sản phẩm bán chạy trong kỳ</Typography>
                            <Button size="small" startIcon={<FileDownloadOutlined sx={{ fontSize: 14 }} />}
                                onClick={() => downloadExcel(topProducts, 'top-san-pham')}
                                sx={{ textTransform: 'none', fontSize: 11, color: '#6b7280' }}>Export</Button>
                        </Box>
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} height={44} sx={{ mb: 1, borderRadius: 1.5 }} />)
                        ) : topProducts.length > 0 ? (
                            <Grid container spacing={1.5}>
                                {topProducts.map((p, i) => {
                                    const pct = Math.round(((p.total_sold ?? 0) / maxTop) * 100);
                                    return (
                                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: i < 3 ? '#fffbeb' : '#fafafa', border: `1px solid ${i < 3 ? '#fde68a' : '#f3f4f6'}` }}>
                                                <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 800, bgcolor: PIE_COLORS[i % PIE_COLORS.length] + '20', color: PIE_COLORS[i % PIE_COLORS.length] }}>
                                                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" fontWeight={600} fontSize={12.5} noWrap>{p.name}</Typography>
                                                        <Typography variant="caption" fontWeight={800} color={PIE_COLORS[i % PIE_COLORS.length]}>{(p.total_sold ?? 0).toLocaleString()}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: PIE_COLORS[i % PIE_COLORS.length] + '20', '& .MuiLinearProgress-bar': { bgcolor: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3 } }} />
                                                        <Typography variant="caption" color="#9ca3af" fontSize={10}>{fmtCurrency(p.total_revenue)}</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ) : (
                            <Typography color="#9ca3af" textAlign="center" py={4} fontSize={13}>Không có dữ liệu sản phẩm</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// ── TAB 4: PHÂN BỔ KHO ───────────────────────────────────────
// ─────────────────────────────────────────────────────────────
const InventoryDistributionTab: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    const [warehouseId, setWarehouseId] = useState('');
    const [byCategoryData, setByCategoryData] = useState<any[]>([]);
    const [byWarehouseData, setByWarehouseData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const q = warehouseId ? `?warehouseId=${warehouseId}` : '';
            const [catRes, whRes] = await Promise.all([
                axiosInstance.get(`/reports/inventory/by-category${q}`),
                axiosInstance.get(`/reports/inventory/by-warehouse`),
            ]);

            const catRaw = catRes.data?.data ?? [];
            const totalCatValue = catRaw.reduce((s: number, r: any) => s + (r.totalValue ?? 0), 0);
            setByCategoryData(catRaw.map((r: any) => ({
                name: r.categoryName ?? r.category ?? 'Chưa phân loại',
                value: r.totalValue ?? 0,
                quantity: r.totalQuantity ?? 0,
                percent: totalCatValue > 0 ? Math.round((r.totalValue / totalCatValue) * 100) : 0,
            })).sort((a: any, b: any) => b.value - a.value));

            const whRaw = whRes.data?.data ?? [];
            const totalWhValue = whRaw.reduce((s: number, r: any) => s + (r.totalValue ?? 0), 0);
            setByWarehouseData(whRaw.map((r: any) => ({
                name: r.warehouseName ?? r.warehouse ?? 'Kho chính',
                value: r.totalValue ?? 0,
                quantity: r.totalQuantity ?? 0,
                percent: totalWhValue > 0 ? Math.round((r.totalValue / totalWhValue) * 100) : 0,
            })).sort((a: any, b: any) => b.value - a.value));
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [warehouseId]);

    useEffect(() => { load(); }, [load]);

    const totalCatValue = byCategoryData.reduce((s, r) => s + r.value, 0);
    const totalWhValue = byWarehouseData.reduce((s, r) => s + r.value, 0);

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.04) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
                {`${Math.round(percent * 100)}%`}
            </text>
        );
    };

    return (
        <Box>
            {/* Summary */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {[
                    { label: 'Tổng giá trị tồn kho', value: fmtCurrency(totalWhValue), icon: '💎', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                    { label: 'Số danh mục', value: byCategoryData.length, icon: '🏷️', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
                    { label: 'Số chi nhánh', value: byWarehouseData.length, icon: '🏪', color: '#0891b2', bg: '#f0fdfa', border: '#a7f3d0' },
                    {
                        label: 'Danh mục lớn nhất', icon: '📦', color: '#d97706', bg: '#fef3c7', border: '#fde68a',
                        value: byCategoryData[0]?.name ?? '—',
                    },
                ].map(c => (
                    <Grid size={{ xs: 6, md: 3 }} key={c.label}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${c.border}`, bgcolor: c.bg }}>
                            <Typography fontSize={24} display="block" mb={0.5}>{c.icon}</Typography>
                            {loading ? <Skeleton height={28} /> : (
                                <Typography fontWeight={800} fontSize={typeof c.value === 'string' && c.value.length > 12 ? 13 : 17} color={c.color} noWrap>{c.value}</Typography>
                            )}
                            <Typography variant="caption" color="#6b7280" fontSize={11}>{c.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filter */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả chi nhánh (pie danh mục)</MenuItem>
                            {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 14 }} />} onClick={load} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 14 }} />}
                        onClick={() => downloadExcel([...byCategoryData, ...byWarehouseData.map(r => ({ ...r, name: `[Chi nhánh] ${r.name}` }))], 'phan-bo-kho')}
                        sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a' }}>Export Excel</Button>
                </Box>
            </Paper>

            <Grid container spacing={2}>
                {/* PIE: By Category */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <PieChartIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#374151">Phân bổ theo danh mục sản phẩm</Typography>
                                <Typography variant="caption" color="#9ca3af">Theo giá trị tồn kho · Tổng: {fmtCurrency(totalCatValue)}</Typography>
                            </Box>
                        </Box>
                        {loading ? <Skeleton variant="circular" width={260} height={260} sx={{ mx: 'auto', display: 'block' }} /> :
                            byCategoryData.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <ResponsiveContainer width={220} height={240}>
                                        <PieChart>
                                            <Pie data={byCategoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                                dataKey="value" labelLine={false} label={renderCustomLabel}
                                                onMouseEnter={(_, i) => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}>
                                                {byCategoryData.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                                                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.6}
                                                        stroke={activeIndex === i ? '#fff' : 'none'} strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <RTooltip content={<PieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75, justifyContent: 'center', maxHeight: 240, overflowY: 'auto' }}>
                                        {byCategoryData.map((d, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: 0.75, borderRadius: 1, bgcolor: activeIndex === i ? PIE_COLORS[i % PIE_COLORS.length] + '12' : 'transparent', cursor: 'default' }}
                                                onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="caption" fontWeight={600} fontSize={11} noWrap>{d.name}</Typography>
                                                    <Typography variant="caption" color="#9ca3af" fontSize={10} display="block">{fmtCurrency(d.value)}</Typography>
                                                </Box>
                                                <Typography variant="caption" fontWeight={800} fontSize={11} color={PIE_COLORS[i % PIE_COLORS.length]}>{d.percent}%</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                                    <Category sx={{ fontSize: 48, color: '#e5e7eb' }} />
                                    <Typography color="#9ca3af" fontSize={13}>Không có dữ liệu tồn kho</Typography>
                                </Box>
                            )}
                    </Paper>
                </Grid>

                {/* BAR: By Warehouse */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Business sx={{ fontSize: 18, color: '#0891b2' }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#374151">Phân bổ theo chi nhánh / kho</Typography>
                                <Typography variant="caption" color="#9ca3af">Giá trị & số lượng tồn kho · Tổng: {fmtCurrency(totalWhValue)}</Typography>
                            </Box>
                        </Box>
                        {loading ? <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1.5 }} /> :
                            byWarehouseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={byWarehouseData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                        <XAxis type="number" tickFormatter={v => fmtShort(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} width={100} />
                                        <RTooltip formatter={(v: any) => [fmtCurrency(v), 'Giá trị']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {byWarehouseData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                                    <Business sx={{ fontSize: 48, color: '#e5e7eb' }} />
                                    <Typography color="#9ca3af" fontSize={13}>Không có dữ liệu kho</Typography>
                                </Box>
                            )}
                    </Paper>
                </Grid>

                {/* Detail table: by category */}
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden', bgcolor: '#fff' }}>
                        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#374151">Chi tiết phân bổ theo danh mục</Typography>
                            <Typography variant="caption" color="#9ca3af">{byCategoryData.length} danh mục</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                        {['#', 'Danh mục', 'Số lượng', 'Giá trị tồn', 'Tỷ lệ'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#6b7280', py: 1.25 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        [1, 2, 3].map(i => <TableRow key={i}>{[1, 2, 3, 4, 5].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                                    ) : byCategoryData.length > 0 ? (
                                        byCategoryData.map((d, i) => (
                                            <TableRow key={i} hover sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: PIE_COLORS[i % PIE_COLORS.length] + '20', color: PIE_COLORS[i % PIE_COLORS.length], fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {i + 1}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                                        <Typography fontSize={13} fontWeight={600}>{d.name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={13}>{(d.quantity ?? 0).toLocaleString()} sp</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={700}>{fmtCurrency(d.value)}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 160 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <LinearProgress variant="determinate" value={d.percent}
                                                            sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: PIE_COLORS[i % PIE_COLORS.length] + '20', '& .MuiLinearProgress-bar': { bgcolor: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3 } }} />
                                                        <Typography variant="caption" fontWeight={700} color={PIE_COLORS[i % PIE_COLORS.length]} sx={{ minWidth: 32 }}>{d.percent}%</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                                <Inventory2 sx={{ fontSize: 40, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                                                <Typography color="#9ca3af" fontSize={13}>Không có dữ liệu tồn kho</Typography>
                                            </TableCell>
                                        </TableRow>
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

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const ReportsPage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [snack, setSnack] = useState('');

    useEffect(() => { warehouseService.getAll().then(setWarehouses).catch(() => { }); }, []);

    // Import handlers
    const handleImportSupplier = async (file: File): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axiosInstance.post('/suppliers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return {
            success: res.data?.data?.success ?? 0,
            failed: res.data?.data?.failed ?? 0,
            errors: res.data?.data?.errors ?? [],
        };
    };

    const handleImportProduct = async (file: File): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axiosInstance.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return {
            success: res.data?.data?.success ?? 0,
            failed: res.data?.data?.failed ?? 0,
            errors: res.data?.data?.errors ?? [],
        };
    };

    const SIDEBAR_TABS = [
        { key: 'revenue', label: 'Doanh thu', desc: 'Biến động doanh số', icon: <BarChartIcon sx={{ fontSize: 18 }} /> },
        { key: 'topProducts', label: 'Sản phẩm bán chạy', desc: 'Hiệu quả kinh doanh', icon: <PieChartIcon sx={{ fontSize: 18 }} /> },
        { key: 'orders', label: 'Đơn hàng', desc: 'Chi tiết giao dịch', icon: <Receipt sx={{ fontSize: 18 }} /> },
        { key: 'inventory', label: 'Tồn kho chi nhánh', desc: 'Quản lý nhiều kho', icon: <Business sx={{ fontSize: 18 }} /> },
        { key: 'merchandise', label: 'Hàng hóa', desc: 'Giá trị & Định mức', icon: <Category sx={{ fontSize: 18 }} /> },
        { key: 'import', label: 'Nhập liệu', desc: 'Import từ Excel', icon: <Upload sx={{ fontSize: 18 }} /> },
    ];

    const renderContent = () => {
        switch (tab) {
            case 0: return <RevenueTab warehouses={warehouses} />;
            case 1: case 2: return <RevenueTab warehouses={warehouses} />;
            case 3: return <InventoryDistributionTab warehouses={warehouses} />;
            case 4: return <InventoryDistributionTab warehouses={warehouses} />;
            case 5: return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <ImportTab title="Import Nhà Cung Cấp từ Excel" description="Nhập hàng loạt danh mục nhà cung cấp" templateFilename="mau-nha-cung-cap" color="#7c3aed" icon={<Business />} onImport={handleImportSupplier}
                        templateColumns={['name (Tên NCC) *', 'phone (Số điện thoại) *', 'email (Email)', 'address (Địa chỉ)', 'taxCode (Mã số thuế)', 'contactPerson (Người liên hệ)', 'bankAccount (Số tài khoản)', 'bankName (Tên ngân hàng)', 'paymentTermDays (Hạn công nợ, ngày)', 'notes (Ghi chú)']}
                        templateSampleRow={{ name: 'Công ty TNHH XYZ', phone: '0901234567', email: 'contact@xyz.com', address: '123 Lê Văn Lương, Hà Nội', taxCode: '0123456789', contactPerson: 'Nguyễn Văn A', bankAccount: '1234567890', bankName: 'VietcomBank', paymentTermDays: 30, notes: '' }}
                        tips={['Cột name và phone là bắt buộc.', 'Nếu NCC đã tồn tại (trùng phone), hệ thống sẽ cập nhật.', 'paymentTermDays: số ngày được nợ.', 'Không đổi tên các cột trong file template.', 'Tối đa 500 dòng mỗi lần import.']} />
                    <ImportTab title="Import Sản Phẩm / Hàng Hóa từ Excel" description="Nhập hàng loạt sản phẩm và cập nhật tồn kho" templateFilename="mau-san-pham" color="#16a34a" icon={<Inventory2 />} onImport={handleImportProduct}
                        templateColumns={['sku (Mã SKU) *', 'name (Tên sản phẩm) *', 'categoryName (Tên danh mục) *', 'unit (Đơn vị tính) *', 'costPrice (Giá nhập)', 'retailPrice (Giá bán lẻ) *', 'wholesalePrice (Giá bán sỉ)', 'warehouseName (Tên chi nhánh) *', 'openingQuantity (Tồn kho đầu kỳ)', 'minStock (Ngưỡng cảnh báo)', 'barcode (Mã vạch)', 'description (Mô tả)']}
                        templateSampleRow={{ sku: 'SP-001', name: 'Áo thun nam cổ tròn', categoryName: 'Áo', unit: 'cái', costPrice: 80000, retailPrice: 150000, wholesalePrice: 120000, warehouseName: 'Kho Hà Nội', openingQuantity: 50, minStock: 5, barcode: '8938505012345', description: '' }}
                        tips={['SKU phải là duy nhất trong hệ thống.', 'categoryName phải khớp chính xác với danh mục đã có.', 'warehouseName phải khớp với tên chi nhánh/kho.', 'Giá bán sỉ phải nhỏ hơn hoặc bằng giá bán lẻ.', 'Tối đa 1000 dòng mỗi lần import.']} />
                </Box>
            );
            default: return <RevenueTab warehouses={warehouses} />;
        }
    };

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: '20px 24px' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ m: 0 }}>Hệ thống Báo cáo</Typography>
                    <Typography variant="body2" color="#8c8c8c" fontSize={13}>Phân tích chuyên sâu dữ liệu kinh doanh đa chiều</Typography>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
                {/* ── LEFT SIDEBAR ── */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Report Types */}
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <Typography fontWeight={700} fontSize={13} color="#8c8c8c" textTransform="uppercase" mb={2}>Loại báo cáo</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {SIDEBAR_TABS.map((t, i) => (
                                    <Box key={t.key} onClick={() => setTab(i)} sx={{
                                        p: '12px 16px', borderRadius: 1.5, cursor: 'pointer', transition: '0.2s',
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        bgcolor: tab === i ? '#f0f2f5' : 'transparent',
                                        borderLeft: `4px solid ${tab === i ? '#1a2e85' : 'transparent'}`,
                                        '&:hover': { bgcolor: '#f0f2f5' },
                                    }}>
                                        <Box sx={{ color: tab === i ? '#1a2e85' : '#8c8c8c' }}>{t.icon}</Box>
                                        <Box>
                                            <Typography fontSize={14} fontWeight={tab === i ? 700 : 400} color={tab === i ? '#1a2e85' : '#262626'} display="block">{t.label}</Typography>
                                            <Typography fontSize={11} color="#8c8c8c">{t.desc}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* Filters */}
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <Typography fontWeight={700} fontSize={13} color="#8c8c8c" textTransform="uppercase" mb={2}>Bộ lọc dữ liệu</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="#8c8c8c" fontSize={12} mb={1}>Chi nhánh / Kho</Typography>
                                    <FormControl size="small" fullWidth>
                                        <Select displayEmpty defaultValue="">
                                            <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                            {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="#8c8c8c" fontSize={12} mb={1}>Thời gian báo cáo</Typography>
                                    <FormControl size="small" fullWidth>
                                        <Select defaultValue="thisMonth">
                                            <MenuItem value="today">Hôm nay</MenuItem>
                                            <MenuItem value="7days">7 ngày gần đây</MenuItem>
                                            <MenuItem value="thisMonth">Tháng này</MenuItem>
                                            <MenuItem value="lastMonth">Tháng trước</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Button variant="outlined" fullWidth sx={{ mt: 1, textTransform: 'none', borderColor: '#d9d9d9', color: '#595959' }} startIcon={<Refresh sx={{ fontSize: 14 }} />}>
                                    Xóa bộ lọc
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                {/* ── RIGHT CONTENT ── */}
                <Grid size={{ xs: 12, md: 9 }}>
                    {renderContent()}
                </Grid>
            </Grid>

            <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

export default ReportsPage;
