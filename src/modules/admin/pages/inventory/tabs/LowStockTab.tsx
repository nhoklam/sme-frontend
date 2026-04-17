import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, InputAdornment, Chip, Select, MenuItem, FormControl,
    Skeleton, Alert, Button, Typography, LinearProgress,
} from '@mui/material';
import { Search, Refresh, FileDownloadOutlined } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import inventoryService from '../../../../../services/inventoryService';
import productService from '../../../../../services/productService';
import categoryService from '../../../../../services/categoryService';
import { exportToExcel } from '../../../../../utils/excelExport';
import { LowStockItem, Warehouse, ProductResponse } from '../../../../../types';

interface Props { warehouses: Warehouse[] }

const LowStockTab: React.FC<Props> = ({ warehouses }) => {
    const [items, setItems] = useState<LowStockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getAll });
    const { data: products = [] } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productService.search({ size: 1000, isActive: true }).then(r => r.content),
    });

    const productMap = React.useMemo(() => {
        const m = new Map<string, ProductResponse>();
        products.forEach(p => m.set(p.id, p));
        return m;
    }, [products]);

    // accessible warehouses
    const accessibleWarehouseIds = React.useMemo(() => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        try {
            const u = JSON.parse(userStr ?? '{}');
            if (u?.user?.role === 'ROLE_ADMIN') return warehouses.filter(w => w.isActive).map(w => w.id);
            const wid = u?.user?.warehouseId;
            return wid ? [wid] : [];
        } catch { return []; }
    }, [warehouses]);

    const isAdmin = React.useMemo(() => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        try { return JSON.parse(userStr ?? '{}')?.user?.role === 'ROLE_ADMIN'; } catch { return false; }
    }, []);

    const load = useCallback(async () => {
        if (!accessibleWarehouseIds.length) { setItems([]); return; }
        setLoading(true);
        try {
            const all = await Promise.all(accessibleWarehouseIds.map(id => inventoryService.getLowStock(id).catch(() => [])));
            setItems(all.flat());
        } catch { setItems([]); }
        finally { setLoading(false); }
    }, [accessibleWarehouseIds]);

    useEffect(() => { load(); }, [load]);

    // filter
    const filtered = items.filter(item => {
        if (selectedWarehouse && item.warehouseId !== selectedWarehouse) return false;
        const p = productMap.get(item.productId);
        if (selectedCategory && p?.categoryId !== selectedCategory) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            if (!item.productName.toLowerCase().includes(q) && !(item.productSku ?? '').toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleExport = () => {
        exportToExcel(filtered.map(item => ({
            ...item,
            categoryName: productMap.get(item.productId)?.categoryName ?? '',
        })), [
            { header: 'Tên sản phẩm', key: 'productName', width: 40 },
            { header: 'SKU', key: 'productSku', width: 15 },
            { header: 'Danh mục', key: 'categoryName', width: 18 },
            { header: 'Chi nhánh', key: 'warehouseName', width: 25 },
            { header: 'Tồn hiện tại', key: 'quantity', width: 14 },
            { header: 'Định mức tối thiểu', key: 'minQuantity', width: 20 },
            { header: 'Đã giữ chỗ', key: 'reservedQuantity', width: 14 },
            {
                header: 'Mức tồn (%)', key: 'quantity', width: 14,
                formatter: (v, row) => {
                    const r = row as typeof filtered[0];
                    return r.minQuantity > 0 ? Math.round((r.quantity / r.minQuantity) * 100) : 0;
                }
            },
        ], 'canh-bao-ton-kho', 'Cảnh Báo Tồn Kho');
    };

    const clearFilters = () => { setSearch(''); setSelectedWarehouse(''); setSelectedCategory(''); };
    const activeCount = [search, selectedWarehouse, selectedCategory].filter(Boolean).length;

    return (
        <Box>
            {items.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    ⚠️ Có <strong>{items.length}</strong> sản phẩm sắp hết hàng. Vui lòng liên hệ hoặc tạo phiếu nhập kho.
                </Alert>
            )}

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" placeholder="Tìm theo tên, SKU..." value={search} onChange={e => setSearch(e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment> }} />

                {isAdmin && (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả kho</MenuItem>
                            {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                )}

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} displayEmpty>
                        <MenuItem value="">Tất cả danh mục</MenuItem>
                        {categories.filter(c => c.isActive).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                </FormControl>

                <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />}
                    onClick={load} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>
                    Làm mới
                </Button>

                <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                    onClick={handleExport} sx={{ textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32' }}>
                    Excel ({filtered.length})
                </Button>

                {activeCount > 0 && (
                    <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none', color: '#d32f2f', fontSize: 12 }}>
                        Xóa bộ lọc ({activeCount})
                    </Button>
                )}
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Sản phẩm', 'SKU', 'Danh mục', 'Chi nhánh', 'Tồn hiện tại', 'Định mức', 'Mức tồn', 'Đã giữ chỗ'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>{c.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7, 8].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                            ) : filtered.length > 0 ? filtered.map((item, idx) => {
                                const pct = item.minQuantity > 0 ? Math.min((item.quantity / item.minQuantity) * 100, 100) : 0;
                                const p = productMap.get(item.productId);
                                return (
                                    <TableRow key={item.inventoryId} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                {p?.imageUrl && <Box component="img" src={p.imageUrl} alt={item.productName}
                                                    sx={{ width: 36, height: 48, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />}
                                                <Typography variant="body2" fontWeight={600} fontSize={13}>{item.productName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Typography variant="caption" fontFamily="monospace" color="#888">{item.productSku || '—'}</Typography></TableCell>
                                        <TableCell>
                                            {p?.categoryName
                                                ? <Chip label={p.categoryName} size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                                                : <Typography variant="caption" color="#bbb">—</Typography>}
                                        </TableCell>
                                        <TableCell><Typography variant="caption" color="#555">{item.warehouseName}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={800} color={item.quantity === 0 ? '#d32f2f' : '#e65100'}>
                                                {item.quantity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell><Typography variant="body2" color="#555">{item.minQuantity}</Typography></TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>
                                            <LinearProgress variant="determinate" value={pct}
                                                sx={{ height: 6, borderRadius: 3, bgcolor: '#ffcdd2', '& .MuiLinearProgress-bar': { bgcolor: item.quantity === 0 ? '#d32f2f' : '#f57c00' } }} />
                                            <Typography variant="caption" color="#aaa" fontSize={10}>{pct.toFixed(0)}%</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="#7b1fa2" fontWeight={600}>{item.reservedQuantity || 0}</Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={36} mb={1}>✅</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {items.length === 0 ? 'Tồn kho ổn định, không có cảnh báo' : 'Không tìm thấy mục nào'}
                                        </Typography>
                                        {activeCount > 0 && items.length > 0 && (
                                            <Button size="small" variant="outlined" onClick={clearFilters} sx={{ mt: 1, textTransform: 'none' }}>Xóa bộ lọc</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default LowStockTab;