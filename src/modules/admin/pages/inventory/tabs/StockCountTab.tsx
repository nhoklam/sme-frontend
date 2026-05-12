import React, { useState } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, InputAdornment,
    Chip, Select, MenuItem, FormControl, Snackbar, Alert,
    Skeleton, LinearProgress, CircularProgress, Grid,
} from '@mui/material';
import {
    Search, Refresh, Save, FileDownloadOutlined, Inventory2,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axiosInstance from '../../../../../services/axiosConfig';
import productService from '../../../../../services/productService';
import { Warehouse as WarehouseType, ProductResponse } from '../../../../../types';

// ── Types ─────────────────────────────────────────────────────
interface StockCountItem {
    productId: string;
    sku: string;
    productName: string;
    unit: string;
    systemQty: number;
    actualQty: number | '';
    diff: number;
    checked: boolean;
}

interface Props {
    warehouses: WarehouseType[];
}

// ── Component ─────────────────────────────────────────────────
const StockCountTab: React.FC<Props> = ({ warehouses }) => {
    const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
    const [items, setItems] = useState<StockCountItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterDiff, setFilterDiff] = useState<'all' | 'diff' | 'match'>('all');
    const [snack, setSnack] = useState('');

    const activeWarehouses = warehouses.filter(w => w.isActive);

    const loadInventory = React.useCallback(async (wh: WarehouseType) => {
        setLoading(true);
        setItems([]);
        try {
            const [invRes, prodRes] = await Promise.all([
                axiosInstance.get(`/inventory/warehouse/${wh.id}/search?page=0&size=1000`),
                productService.search({ size: 1000, isActive: true }),
            ]);
            const raw: any[] = invRes.data?.data ?? [];
            const prodMap = new Map<string, ProductResponse>();
            prodRes.content.forEach((p: ProductResponse) => prodMap.set(p.id, p));

            setItems(
                raw.map((it: any) => {
                    const prod = prodMap.get(it.productId ?? it.id);
                    return {
                        productId: it.productId ?? it.id,
                        sku: it.productSku ?? it.sku ?? prod?.sku ?? prod?.isbnBarcode ?? '',
                        productName: it.productName ?? it.name ?? prod?.name ?? `SP-${(it.productId ?? it.id)?.slice(0, 8)}`,
                        unit: it.unit ?? prod?.unit ?? '',
                        systemQty: it.availableQuantity ?? it.quantity ?? 0,
                        actualQty: '',
                        diff: 0,
                        checked: false,
                    };
                })
            );
        } catch {
            setSnack('❌ Không thể tải tồn kho');
        } finally {
            setLoading(false);
        }
    }, []);

    const selectWarehouse = (wh: WarehouseType) => {
        setSelectedWarehouse(wh);
        setSearch('');
        setFilterDiff('all');
        loadInventory(wh);
    };

    const goBack = () => {
        setSelectedWarehouse(null);
        setItems([]);
        setSearch('');
        setFilterDiff('all');
    };

    const updateActual = (idx: number, val: string) => {
        setItems(prev =>
            prev.map((it, i) => {
                if (i !== idx) return it;
                const actual = val === '' ? '' : Number(val);
                const diff = actual === '' ? 0 : (actual as number) - it.systemQty;
                return { ...it, actualQty: actual, diff, checked: actual !== '' };
            })
        );
    };

    const handleSave = async () => {
        if (!selectedWarehouse) return;
        const adjusted = items.filter(it => it.actualQty !== '' && it.diff !== 0);
        if (!adjusted.length) {
            setSnack('⚠️ Không có chênh lệch nào cần điều chỉnh');
            return;
        }
        setSaving(true);
        try {
            await Promise.all(
                adjusted.map(it =>
                    axiosInstance.post('/inventory/adjust', {
                        productId: it.productId,
                        warehouseId: selectedWarehouse.id,
                        actualQuantity: Number(it.actualQty),
                        reason: `Kiểm kê kho: hệ thống ${it.systemQty}, thực tế ${it.actualQty} (chênh lệch ${it.diff > 0 ? '+' : ''}${it.diff})`,
                    })
                )
            );
            setSnack(`✅ Lưu kiểm kê thành công! ${adjusted.length} sản phẩm được điều chỉnh`);
            loadInventory(selectedWarehouse);
        } catch (e: any) {
            setSnack(`❌ ${e.response?.data?.message ?? 'Lưu kiểm kê thất bại'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        const data = filtered.map(it => ({
            SKU: it.sku,
            'Tên sản phẩm': it.productName,
            ĐVT: it.unit,
            'Hệ thống': it.systemQty,
            'Thực tế': it.actualQty === '' ? '' : it.actualQty,
            'Chênh lệch': it.actualQty === '' ? '' : it.diff,
            'Ghi chú': it.diff > 0 ? 'Thừa' : it.diff < 0 ? 'Thiếu' : it.checked ? 'Khớp' : '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kiểm kê');
        XLSX.writeFile(wb, `kiem-ke-kho-${selectedWarehouse?.name ?? ''}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const filtered = items.filter(it => {
        if (search && !it.productName.toLowerCase().includes(search.toLowerCase()) && !it.sku.toLowerCase().includes(search.toLowerCase()))
            return false;
        if (filterDiff === 'diff') return it.checked && it.diff !== 0;
        if (filterDiff === 'match') return it.checked && it.diff === 0;
        return true;
    });

    const checkedCount = items.filter(it => it.checked).length;
    const diffCount = items.filter(it => it.diff !== 0 && it.checked).length;

    // ── STEP 1: Chọn kho ─────────────────────────────────────
    if (!selectedWarehouse) {
        return (
            <Box>
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                    Chọn chi nhánh để bắt đầu kiểm kê tồn kho thực tế
                </Typography>
                {activeWarehouses.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px dashed #e5e7eb' }}>
                        <Inventory2 sx={{ fontSize: 56, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography color="#9ca3af" fontSize={13}>Không có chi nhánh nào đang hoạt động</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {activeWarehouses.map(wh => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={wh.id}>
                                <Paper elevation={0} onClick={() => selectWarehouse(wh)}
                                    sx={{
                                        p: 2.5, borderRadius: 2, cursor: 'pointer',
                                        border: '1.5px solid #e5e7eb', bgcolor: '#fff',
                                        transition: 'all 0.15s',
                                        '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff', boxShadow: '0 4px 16px rgba(29,78,216,0.12)', transform: 'translateY(-2px)' },
                                    }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 1.5 }}>
                                            <Inventory2 sx={{ fontSize: 22, color: '#1d4ed8' }} />
                                        </Box>
                                        <Chip label="Hoạt động" size="small"
                                            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#dcfce7', color: '#16a34a' }} />
                                    </Box>
                                    <Typography fontWeight={800} color="#1a1a2e" fontSize={15}>{wh.name}</Typography>
                                    {wh.address && (
                                        <Typography variant="caption" color="#6b7280" display="block" mt={0.5} noWrap>📍 {wh.address}</Typography>
                                    )}
                                    {wh.phone && (
                                        <Typography variant="caption" color="#9ca3af" display="block">📞 {wh.phone}</Typography>
                                    )}
                                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="#1d4ed8" fontWeight={700}>Bắt đầu kiểm kê →</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
                <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    {snack ? <Alert severity={snack.startsWith('✅') ? 'success' : 'error'} sx={{ borderRadius: 2 }}>{snack}</Alert> : <div />}
                </Snackbar>
            </Box>
        );
    }

    // ── STEP 2: Kiểm kê chi tiết ─────────────────────────────
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button size="small" variant="text" onClick={goBack}
                        sx={{ textTransform: 'none', color: '#6b7280', p: 0, minWidth: 0 }}>
                        ← Quay lại
                    </Button>
                    <Typography color="#9ca3af" fontSize={12}>/</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Inventory2 sx={{ fontSize: 16, color: '#1d4ed8' }} />
                        <Typography fontWeight={700} color="#374151" fontSize={14}>
                            Kiểm kê: {selectedWarehouse.name}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 14 }} />}
                        onClick={() => loadInventory(selectedWarehouse)}
                        sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', fontSize: 11 }}>
                        Tải lại
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 14 }} />}
                        onClick={handleExport}
                        sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a', fontSize: 11 }}>
                        Excel
                    </Button>
                    <Button variant="contained"
                        startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Save />}
                        onClick={handleSave} disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontSize: 11 }}>
                        Lưu điều chỉnh ({diffCount})
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" placeholder="Tìm SKU, tên sản phẩm..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment> }}
                    sx={{ flex: 1, minWidth: 180 }} />
                <FormControl size="small" sx={{ minWidth: 170 }}>
                    <Select value={filterDiff} onChange={e => setFilterDiff(e.target.value as any)}>
                        <MenuItem value="all">Tất cả ({items.length})</MenuItem>
                        <MenuItem value="diff">Có chênh lệch ({diffCount})</MenuItem>
                        <MenuItem value="match">Khớp ({checkedCount - diffCount})</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Progress summary */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                    { label: 'Tổng SP', v: items.length, color: '#374151', bg: '#f9fafb' },
                    { label: 'Đã kiểm', v: checkedCount, color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Chênh lệch', v: diffCount, color: diffCount > 0 ? '#d97706' : '#16a34a', bg: diffCount > 0 ? '#fef3c7' : '#f0fdf4' },
                ].map(s => (
                    <Box key={s.label} sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: s.bg }}>
                        <Typography fontWeight={800} color={s.color} display="inline" mr={0.75}>{s.v}</Typography>
                        <Typography variant="caption" color={s.color}>{s.label}</Typography>
                    </Box>
                ))}
                <LinearProgress variant="determinate"
                    value={items.length > 0 ? (checkedCount / items.length) * 100 : 0}
                    sx={{ flex: 1, height: 8, borderRadius: 4, minWidth: 120, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: '#1d4ed8' } }} />
                <Typography variant="caption" color="#9ca3af">
                    {items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0}%
                </Typography>
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                {['SKU', 'Tên sản phẩm', 'ĐVT', 'Hệ thống', 'Thực tế', 'Chênh lệch', 'Tình trạng'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#6b7280', py: 1.25, bgcolor: '#f9fafb' }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                            ) : filtered.length > 0 ? (
                                filtered.map((item, idx) => {
                                    const hasActual = item.actualQty !== '';
                                    const rowBg = !hasActual ? '#fff'
                                        : item.diff === 0 ? '#f0fdf4'
                                            : item.diff > 0 ? '#eff6ff'
                                                : '#fef3c7';
                                    return (
                                        <TableRow key={idx} sx={{ bgcolor: rowBg }}>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: '#2563eb', py: 1 }}>
                                                {item.sku || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontSize={12} fontWeight={600}>{item.productName}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="#6b7280">{item.unit || '—'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontSize={12} fontWeight={700}>{item.systemQty.toLocaleString()}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 90 }}>
                                                <TextField size="small" type="number" placeholder="Nhập..."
                                                    value={item.actualQty}
                                                    onChange={e => updateActual(items.indexOf(item), e.target.value)}
                                                    sx={{ width: 80, '& .MuiOutlinedInput-root': { fontSize: 12, bgcolor: '#fff' } }} />
                                            </TableCell>
                                            <TableCell>
                                                {hasActual ? (
                                                    <Typography fontSize={13} fontWeight={800}
                                                        color={item.diff === 0 ? '#16a34a' : item.diff > 0 ? '#2563eb' : '#d97706'}>
                                                        {item.diff > 0 ? '+' : ''}{item.diff.toLocaleString()}
                                                    </Typography>
                                                ) : <Typography variant="caption" color="#c4c9d4">—</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                {!hasActual ? (
                                                    <Chip label="Chưa kiểm" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#f9fafb', color: '#9ca3af' }} />
                                                ) : item.diff === 0 ? (
                                                    <Chip label="Khớp" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#f0fdf4', color: '#16a34a' }} />
                                                ) : item.diff > 0 ? (
                                                    <Chip label={`Thừa ${item.diff}`} size="small"
                                                        sx={{ height: 20, fontSize: 10, bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700 }} />
                                                ) : (
                                                    <Chip label={`Thiếu ${Math.abs(item.diff)}`} size="small"
                                                        sx={{ height: 20, fontSize: 10, bgcolor: '#fef3c7', color: '#d97706', fontWeight: 700 }} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                        <Typography color="#9ca3af" fontSize={13}>Không tìm thấy sản phẩm nào</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? (
                    <Alert severity={snack.startsWith('✅') ? 'success' : snack.startsWith('⚠️') ? 'warning' : 'error'}
                        sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {snack}
                    </Alert>
                ) : <div />}
            </Snackbar>
        </Box>
    );
};

export default StockCountTab;