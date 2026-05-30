// src/modules/admin/pages/inventory/tabs/InventoryListTab.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, InputAdornment, Chip, IconButton, Select, MenuItem,
    FormControl, Tooltip, Skeleton, Alert, Button, Grid, Card, CardContent,
    Snackbar, Typography, Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
    Search, Edit, History, Refresh, FilterList,
    Category as CategoryIcon, Warehouse as WarehouseIcon,
    FileDownloadOutlined, ImageNotSupported, CheckCircle, Cancel, Warning,
    Assignment, Visibility, ContentCopy, Close
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import inventoryService from '../../../../../services/inventoryService';
import productService from '../../../../../services/productService';
import categoryService from '../../../../../services/categoryService';
import { exportToExcel, fmtVnd } from '../../../../../utils/excelExport';
import AdjustInventoryModal from '../components/AdjustInventoryModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import { purchaseService } from '../../../../../services/purchaseService';
import { StockCountTab, SavedReceipt } from './StockCountTab';
import useAuth from '../../../../../store/hooks/useAuth';
import {
    Warehouse, ProductResponse, InventoryWithMeta, StockStatusFilter,
} from '../../../../../types';

// ── helpers ──────────────────────────────────────────────────
const fmtCurrency = (n?: number) =>
    n == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const getStockStatus = (qty: number, minQty: number) => {
    if (qty === 0) return { label: 'Hết hàng', color: '#ef4444', bg: '#fef2f2', icon: <Cancel sx={{ fontSize: 12 }} /> };
    if (minQty > 0 && qty <= minQty) return { label: 'Sắp hết', color: '#f59e0b', bg: '#fffbeb', icon: <Warning sx={{ fontSize: 12 }} /> };
    return { label: 'Còn hàng', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle sx={{ fontSize: 12 }} /> };
};

const STOCK_STATUS_OPTIONS: { value: StockStatusFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'in_stock', label: 'Còn hàng' },
    { value: 'low_stock', label: 'Sắp hết' },
    { value: 'out_of_stock', label: 'Hết hàng' },
];

const PAGE_SIZE = 30;

// ── thumbnail component ───────────────────────────────────────
const ProductThumb: React.FC<{ url?: string; name: string }> = ({ url, name }) => {
    const [err, setErr] = useState(false);
    if (!url || err) {
        return (
            <Box sx={{ width: 48, height: 64, bgcolor: '#f5f5f5', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0' }}>
                <ImageNotSupported sx={{ fontSize: 20, color: '#bbb' }} />
            </Box>
        );
    }
    return (
        <Box component="img" src={url} alt={name} onError={() => setErr(true)}
            sx={{ width: 48, height: 64, objectFit: 'contain', borderRadius: 1.5, border: '1px solid #e0e0e0', bgcolor: '#fafafa' }} />
    );
};

interface Props {
    warehouses: Warehouse[];
}

const InventoryListTab: React.FC<Props> = ({ warehouses }) => {
    const { isAdmin, warehouseId: myWarehouseId } = useAuth();
    const qc = useQueryClient();

    // ── Filter state ──────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [stockStatus, setStockStatus] = useState<StockStatusFilter>('all');
    const [page, setPage] = useState(0);

    // ── Modal state ───────────────────────────────────────────
    const [adjustTarget, setAdjustTarget] = useState<InventoryWithMeta | null>(null);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [adjustSaving, setAdjustSaving] = useState(false);
    const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string; image?: string } | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

    // ── Debounce search ───────────────────────────────────────
    React.useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getAll });

    const { data: productsData, isLoading: loadingProducts } = useQuery({
        queryKey: ['products-all', selectedCategory],
        queryFn: () => productService.search({ size: 2000, isActive: true, categoryId: selectedCategory || undefined }).then(r => r.content),
        staleTime: 5 * 60 * 1000,
    });

    const productMap = React.useMemo(() => {
        const m = new Map<string, ProductResponse>();
        productsData?.forEach(p => m.set(p.id, p));
        return m;
    }, [productsData]);

    // Kho được phép truy cập dựa theo role
    const accessibleWarehouses = React.useMemo(() => {
        if (isAdmin) return warehouses.filter(w => w.isActive);
        if (!myWarehouseId) return [];
        const w = warehouses.find(wh => wh.id === myWarehouseId && wh.isActive);
        return w ? [w] : [];
    }, [isAdmin, myWarehouseId, warehouses]);

    // Kho đang chọn để xem (admin: có thể chọn, nhân viên: kho mình)
    const effectiveWarehouseId = React.useMemo(() => {
        if (!isAdmin) return myWarehouseId ?? '';
        return selectedWarehouse;
    }, [isAdmin, myWarehouseId, selectedWarehouse]);

    // ── Fetch tồn kho — server-side, refetch tự động mỗi 30s ──
    const {
        data: allInventories,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['inventory-all', accessibleWarehouses.map(w => w.id), debouncedSearch, selectedCategory, stockStatus, page],
        queryFn: async () => {
            if (!accessibleWarehouses.length) return [] as InventoryWithMeta[];

            // Nếu đã chọn 1 kho cụ thể (admin filter) → chỉ fetch kho đó
            const warehousesToFetch = effectiveWarehouseId
                ? accessibleWarehouses.filter(w => w.id === effectiveWarehouseId)
                : accessibleWarehouses;

            const results = await Promise.all(
                warehousesToFetch.map(wh =>
                    inventoryService.getByWarehouse(wh.id, {
                        keyword: debouncedSearch || undefined,
                        stockStatus: stockStatus !== 'all' ? stockStatus : undefined,
                        categoryId: selectedCategory || undefined,
                        size: 500,
                    }).then(data => ({ wh, data }))
                )
            );

            const enriched: InventoryWithMeta[] = [];
            results.forEach(({ wh, data }) => {
                data.forEach(inv => {
                    const p = productMap.get(inv.productId);
                    enriched.push({
                        ...inv,
                        productName: p?.name ?? inv.productId,
                        productSku: p?.sku,
                        isbnBarcode: p?.isbnBarcode,
                        warehouseName: wh.name,
                        categoryId: p?.categoryId,
                        categoryName: p?.categoryName,
                        imageUrl: p?.imageUrl,
                        retailPrice: p?.retailPrice,
                        macPrice: p?.macPrice,
                        location: inv.location,
                        inTransit: inv.inTransit || 0,
                    });
                });
            });
            return enriched;
        },
        enabled: !loadingProducts && accessibleWarehouses.length > 0,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });

    const inventories = allInventories ?? [];

    // ── Client-side filter + pagination sau khi nhận data ────
    const filtered = React.useMemo(() => {
        return inventories.filter(inv => {
            if (selectedCategory && inv.categoryId !== selectedCategory) return false;
            // stockStatus đã được gửi lên server, nhưng fallback client-side
            if (stockStatus !== 'all') {
                const qty = inv.quantity;
                const minQty = inv.minQuantity;
                if (stockStatus === 'in_stock' && (qty === 0 || (minQty > 0 && qty <= minQty))) return false;
                if (stockStatus === 'low_stock' && !(qty > 0 && minQty > 0 && qty <= minQty)) return false;
                if (stockStatus === 'out_of_stock' && qty !== 0) return false;
            }
            return true;
        });
    }, [inventories, selectedCategory, stockStatus]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    // ── Stats ─────────────────────────────────────────────────
    const stats = {
        total: filtered.length,
        totalQty: filtered.reduce((s, i) => s + (i.quantity || 0), 0),
        lowStock: filtered.filter(i => i.quantity > 0 && i.minQuantity > 0 && i.quantity <= i.minQuantity).length,
        value: filtered.reduce((s, i) => s + (i.quantity || 0) * (i.retailPrice || 0), 0),
    };

    // ── Excel export — xuất tất cả (không bị giới hạn trang) ─
    const handleExport = () => {
        exportToExcel(
            filtered,
            [
                { header: 'Tên sản phẩm', key: 'productName', width: 40 },
                { header: 'SKU', key: 'productSku', width: 15 },
                { header: 'Mã vạch/ISBN', key: 'isbnBarcode', width: 20 },
                { header: 'Danh mục', key: 'categoryName', width: 18 },
                { header: 'Chi nhánh', key: 'warehouseName', width: 25 },
                { header: 'Tồn thực', key: 'quantity', width: 12 },
                { header: 'Đã giữ chỗ', key: 'reservedQuantity', width: 12 },
                { header: 'Khả dụng', key: 'availableQuantity', width: 12 },
                { header: 'Định mức tối thiểu', key: 'minQuantity', width: 18 },
                { header: 'Giá bán lẻ (VND)', key: 'retailPrice', width: 18, formatter: fmtVnd },
                { header: 'Giá vốn MAC (VND)', key: 'macPrice', width: 18, formatter: fmtVnd },
                {
                    header: 'Giá trị tồn kho (VND)',
                    key: 'quantity',
                    width: 22,
                    formatter: (v, row) => fmtVnd((row as InventoryWithMeta).quantity * ((row as InventoryWithMeta).retailPrice ?? 0)),
                },
                {
                    header: 'Trạng thái',
                    key: 'quantity',
                    width: 14,
                    formatter: (_v, row) => {
                        const r = row as InventoryWithMeta;
                        if (r.quantity === 0) return 'Hết hàng';
                        if (r.minQuantity > 0 && r.quantity <= r.minQuantity) return 'Sắp hết';
                        return 'Còn hàng';
                    },
                },
            ],
            'ton-kho',
            'Tồn Kho'
        );
    };

    // ── Handlers ──────────────────────────────────────────────
    const handleAdjust = async (actualQty: number, reason: string) => {
        if (!adjustTarget) return;
        setAdjustSaving(true);
        try {
            await inventoryService.adjust({
                productId: adjustTarget.productId,
                warehouseId: adjustTarget.warehouseId,
                actualQuantity: actualQty,
                reason,
            });
            setSnack({ msg: '✅ Điều chỉnh tồn kho thành công', sev: 'success' });
            setAdjustOpen(false);
            // Invalidate để tất cả tab dùng cùng data đều refresh
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Điều chỉnh thất bại', sev: 'error' });
        } finally {
            setAdjustSaving(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setSelectedCategory('');
        setStockStatus('all');
        setSelectedWarehouse('');
        setPage(0);
    };

    const activeCount = [debouncedSearch, selectedCategory, stockStatus !== 'all', selectedWarehouse].filter(Boolean).length;

    // ── Kiểm kho dialog state ──
    const [stockCountOpen, setStockCountOpen] = useState(false);
    const [viewReceipt, setViewReceipt] = useState<SavedReceipt | null>(null);
    const [editReceipt, setEditReceipt] = useState<SavedReceipt | null>(null);

    // ── Lấy lịch sử kiểm kho từ API thật ──
    const { data: stockCountHistory = [], isLoading: loadingHistory } = useQuery({
        queryKey: ['stock-count-history', warehouses.length, !!productsData, stockCountOpen],
        queryFn: async () => {
            const history = await inventoryService.getHistory({ transactionType: 'ADJUSTMENT', size: 100 });
            const receipts: SavedReceipt[] = [];
            const groups: { [key: string]: SavedReceipt } = {};

            history.content.forEach(tx => {
                const match = tx.note?.match(/\[(PKK-\d+-\d+)\]/);
                const code = match ? match[1] : `PKK-${tx.createdAt.split('T')[0]}-${tx.id.slice(-4)}`;

                if (!groups[code]) {
                    groups[code] = {
                        code,
                        time: new Date(tx.createdAt).toLocaleString('vi-VN'),
                        items: [],
                        warehouseName: warehouses.find(w => w.id === tx.warehouseId)?.name || 'N/A'
                    };
                    receipts.push(groups[code]);
                }

                const htMatch = tx.note?.match(/HT (\d+)/);
                const ttMatch = tx.note?.match(/TT (\d+)/);
                const p = productMap.get(tx.productId);

                groups[code].items.push({
                    productId: tx.productId,
                    productName: p?.name || 'Sản phẩm đã xóa',
                    sku: p?.sku || 'N/A',
                    isbnBarcode: p?.isbnBarcode || 'N/A',
                    unit: p?.unit || 'N/A',
                    systemQty: htMatch ? Number(htMatch[1]) : tx.quantityBefore,
                    actualQty: ttMatch ? Number(ttMatch[1]) : tx.quantityAfter,
                    diff: tx.quantityChange,
                    checked: true
                });
            });
            return receipts;
        },
        enabled: warehouses.length > 0 && !!productsData
    });

    // ── Lấy lịch sử nhập kho từ API thật ──
    const { data: importHistory = [], isLoading: loadingImports } = useQuery({
        queryKey: ['import-history-real'],
        queryFn: async () => {
            const res = await purchaseService.getAll({ size: 20 });
            return res.content;
        }
    });

    console.log("StockCountTab component:", StockCountTab);

    // ── Render ────────────────────────────────────────────────
    return (
        <Box>
            {/* Stats */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                    { label: 'Mặt hàng', value: stats.total, color: '#1e293b' },
                    { label: 'Tổng tồn kho', value: stats.totalQty.toLocaleString(), color: '#2563eb' },
                    { label: 'Sắp hết hàng', value: stats.lowStock, color: '#f59e0b' },
                    { label: 'Giá trị tồn kho', value: fmtCurrency(stats.value), color: '#ef4444' },
                ].map(s => (
                    <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                                {isLoading || loadingProducts ? (
                                    <Skeleton height={30} />
                                ) : (
                                    <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, SKU, mã vạch..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment>,
                        }}
                    />
                    {isAdmin && (
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select
                                value={selectedWarehouse}
                                onChange={e => { setSelectedWarehouse(e.target.value); setPage(0); }}
                                displayEmpty
                                startAdornment={<WarehouseIcon sx={{ fontSize: 16, color: '#bbb', mr: 0.5 }} />}
                            >
                                <MenuItem value="">Tất cả kho</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w => (
                                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                        <Select
                            value={selectedCategory}
                            onChange={e => { setSelectedCategory(e.target.value); setPage(0); }}
                            displayEmpty
                            startAdornment={<CategoryIcon sx={{ fontSize: 16, color: '#bbb', mr: 0.5 }} />}
                        >
                            <MenuItem value="">Tất cả danh mục</MenuItem>
                            {categories.filter(c => c.isActive).map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                            value={stockStatus}
                            onChange={e => { setStockStatus(e.target.value as StockStatusFilter); setPage(0); }}
                            displayEmpty
                            startAdornment={<FilterList sx={{ fontSize: 16, color: '#bbb', mr: 0.5 }} />}
                        >
                            {STOCK_STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />}
                        onClick={() => refetch()}
                        sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5, height: 36 }}>
                        Làm mới
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                        onClick={handleExport}
                        sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a', borderRadius: 1.5, height: 36, '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' } }}>
                        Excel ({filtered.length})
                    </Button>
                    <Button size="small" variant="contained" startIcon={<Assignment sx={{ fontSize: 15 }} />}
                        onClick={() => setStockCountOpen(true)}
                        sx={{ textTransform: 'none', bgcolor: '#2563eb', borderRadius: 1.5, height: 36, fontWeight: 700, '&:hover': { bgcolor: '#1d4ed8' } }}>
                        Kiểm kho
                    </Button>
                    {activeCount > 0 && (
                        <Button size="small" onClick={clearFilters}
                            sx={{ textTransform: 'none', color: '#ef4444', fontSize: 12 }}>
                            Xóa bộ lọc ({activeCount})
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Sản phẩm', 'Danh mục', 'Chi nhánh', 'Đang về', 'Khả dụng', 'Thực tế', 'Min', 'Trạng thái', 'Thao tác'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 800, fontSize: 11, color: '#888', py: 1.5, letterSpacing: 0.3, bgcolor: '#fafafa' }}>
                                        {c.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading || loadingProducts ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                            ) : paged.length > 0 ? (
                                paged.map((inv, idx) => {
                                    const ss = getStockStatus(inv.quantity, inv.minQuantity);
                                    const available = inv.availableQuantity ?? inv.quantity - inv.reservedQuantity;
                                    return (
                                        <TableRow key={`${inv.id}-${idx}`} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <ProductThumb url={inv.imageUrl} name={inv.productName ?? ''} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600} fontSize={13}>{inv.productName}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary">{inv.categoryName || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={600} color="#1a1a2e">{inv.warehouseName}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                {inv.inTransit > 0 ? (
                                                    <Tooltip title="Số lượng hàng đang nhập về">
                                                        <Typography variant="body2" fontWeight={800} color="#2563eb">+{inv.inTransit}</Typography>
                                                    </Tooltip>
                                                ) : <Typography variant="caption" color="#bbb">0</Typography>}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={800} color="#1a1a2e">
                                                    {available.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={700}
                                                    color={inv.quantity === 0 ? '#ef4444' : inv.quantity <= inv.minQuantity ? '#f59e0b' : '#16a34a'}>
                                                    {(inv.quantity ?? 0).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="caption" color="#888">{(inv.minQuantity ?? 0).toLocaleString()}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip icon={ss.icon} label={ss.label} size="small"
                                                    sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: ss.bg, color: ss.color }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Điều chỉnh tồn kho">
                                                        <IconButton size="small"
                                                            onClick={() => { setAdjustTarget(inv); setAdjustOpen(true); }}
                                                            sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}>
                                                            <Edit sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Lịch sử giao dịch">
                                                        <IconButton size="small"
                                                            onClick={() => { setHistoryTarget({ id: inv.id, name: inv.productName ?? inv.productId, image: inv.imageUrl }); setHistoryOpen(true); }}
                                                            sx={{ color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' } }}>
                                                            <History sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={36} mb={1}>📦</Typography>
                                        <Typography variant="body2" color="text.secondary">Không tìm thấy sản phẩm nào</Typography>
                                        {activeCount > 0 && (
                                            <Button size="small" variant="outlined" onClick={clearFilters} sx={{ mt: 1, textTransform: 'none' }}>
                                                Xóa bộ lọc
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Footer: count + pagination */}
                <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Hiển thị <strong>{paged.length}</strong> / <strong>{filtered.length}</strong> mặt hàng
                        {activeCount > 0 && ' (đang lọc)'}
                    </Typography>
                    {totalPages > 1 && (
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} size="small" />
                    )}
                </Box>
            </Paper>

            {/* Lịch sử phiếu kiểm kho */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <History sx={{ color: '#6b7280' }} />
                    <Typography variant="h6" fontSize={16} fontWeight={800} color="#111">Lịch sử phiếu kiểm kho</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Mã phiếu</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Thời gian</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Kho</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Sản phẩm lệch</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569', textAlign: 'right' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingHistory ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Skeleton variant="text" width="60%" /></TableCell></TableRow>
                            ) : stockCountHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="#9ca3af">Chưa có lịch sử kiểm kho nào</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : stockCountHistory.map((h, i) => (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700} color="#2563eb">{h.code}</Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{h.time}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{h.warehouseName}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {h.items.length} <span style={{ color: '#6b7280', fontWeight: 400 }}>sản phẩm</span>
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Xem chi tiết">
                                            <IconButton size="small" onClick={() => setViewReceipt(h)} sx={{ color: '#1976d2' }}>
                                                <Visibility sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Sửa (Kiểm lại)">
                                            <IconButton size="small" onClick={() => { setEditReceipt(h); setStockCountOpen(true); }} sx={{ color: '#f59e0b' }}>
                                                <Edit sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Sao chép phiếu">
                                            <IconButton size="small" onClick={() => {
                                                const text = `${h.code}\n${h.time}\n\n` +
                                                    h.items.map((it: any) => `${it.productName} | ${it.sku} | Tồn: ${it.systemQty} | TT: ${it.actualQty} | Lệch: ${it.diff}`).join('\n');
                                                navigator.clipboard.writeText(text);
                                                setSnack({ msg: 'Đã sao chép phiếu', sev: 'success' });
                                            }} sx={{ color: '#6b7280' }}>
                                                <ContentCopy sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Lịch sử phiếu nhập kho */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Assignment sx={{ color: '#059669' }} />
                    <Typography variant="h6" fontSize={16} fontWeight={800} color="#111">Lịch sử phiếu nhập hàng (Gần đây)</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#065f46' }}>Mã phiếu</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#065f46' }}>Thời gian</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#065f46' }}>Kho nhập</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#065f46' }}>Tổng tiền</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#065f46' }}>Trạng thái</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingImports ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Skeleton variant="text" width="80%" /></TableCell></TableRow>
                            ) : importHistory.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Typography variant="body2" color="#9ca3af">Chưa có lịch sử nhập hàng</Typography></TableCell></TableRow>
                            ) : importHistory.map((h, i) => (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f0fdf4' } }}>
                                    <TableCell><Typography variant="body2" fontWeight={700} color="#059669">{h.code}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{new Date(h.createdAt).toLocaleString('vi-VN')}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{warehouses.find(w => w.id === h.warehouseId)?.name || 'N/A'}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" fontWeight={700}>{fmtVnd(h.totalAmount)}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={h.status === 'COMPLETED' ? 'Hoàn thành' : h.status === 'PENDING' ? 'Chờ duyệt' : 'Đã hủy'}
                                            size="small"
                                            sx={{
                                                fontSize: 10, fontWeight: 800,
                                                bgcolor: h.status === 'COMPLETED' ? '#dcfce7' : h.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                                                color: h.status === 'COMPLETED' ? '#166534' : h.status === 'PENDING' ? '#92400e' : '#991b1b'
                                            }} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modals */}
            <AdjustInventoryModal
                open={adjustOpen}
                inventory={adjustTarget}
                onClose={() => setAdjustOpen(false)}
                onConfirm={handleAdjust}
                saving={adjustSaving}
            />
            <TransactionHistoryModal
                open={historyOpen}
                inventoryId={historyTarget?.id ?? null}
                productName={historyTarget?.name ?? ''}
                productImage={historyTarget?.image}
                onClose={() => setHistoryOpen(false)}
            />

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? (
                    <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
                ) : <div />}
            </Snackbar>

            {/* Kiểm kho Dialog */}
            {stockCountOpen && (
                <StockCountTab warehouses={warehouses} onClose={() => { setStockCountOpen(false); setEditReceipt(null); refetch(); }} initialReceipt={editReceipt ?? undefined} />
            )}

            {/* Xem chi tiết phiếu */}
            <Dialog open={!!viewReceipt} onClose={() => setViewReceipt(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Chi tiết phiếu kiểm kho: {viewReceipt?.code}
                    <IconButton size="small" onClick={() => setViewReceipt(null)}><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <Typography variant="body2">Thời gian: <strong>{viewReceipt?.time}</strong> | Kho: <strong>{viewReceipt?.warehouseName}</strong></Typography>
                    </Box>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#fff' }}>
                            <TableRow>
                                <TableCell>Sản phẩm</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell align="center">Tồn hệ thống</TableCell>
                                <TableCell align="center">Thực tế</TableCell>
                                <TableCell align="center">Lệch</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {viewReceipt?.items?.map((it: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell><Typography variant="body2" fontWeight={600}>{it.productName}</Typography></TableCell>
                                    <TableCell><Typography variant="caption" fontFamily="monospace">{it.sku}</Typography></TableCell>
                                    <TableCell align="center">{it.systemQty}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>{it.actualQty}</TableCell>
                                    <TableCell align="center">
                                        <Typography fontWeight={700} color={it.diff > 0 ? '#16a34a' : it.diff < 0 ? '#dc2626' : '#6b7280'}>
                                            {it.diff > 0 ? '+' : ''}{it.diff}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default InventoryListTab;