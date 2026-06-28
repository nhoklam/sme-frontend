// src/modules/admin/pages/inventory/tabs/InventoryListTab.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, InputAdornment, Chip, IconButton, Select, MenuItem,
    FormControl, Tooltip, Skeleton, Alert, Button, Grid, Card, CardContent,
    Snackbar, Typography, Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
    TablePagination, Popover, CircularProgress,
} from '@mui/material';
import {
    Search, Edit, History, Refresh, FilterList,
    Category as CategoryIcon, Warehouse as WarehouseIcon,
    FileDownloadOutlined, ImageNotSupported, CheckCircle, Cancel, Warning,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import inventoryService from '../../../../../services/inventoryService';
import productService from '../../../../../services/productService';
import categoryService from '../../../../../services/categoryService';
import { exportToExcel, fmtVnd } from '../../../../../utils/excelExport';
import AdjustInventoryModal from '../components/AdjustInventoryModal';
import { buildCategoryTreeFlat } from '../../../../../utils/categoryUtils';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import { purchaseService } from '../../../../../services/purchaseService';
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
    const [pageSize, setPageSize] = useState(10);

    // ── Modal state ───────────────────────────────────────────
    const [adjustTarget, setAdjustTarget] = useState<InventoryWithMeta | null>(null);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [adjustSaving, setAdjustSaving] = useState(false);
    const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string; image?: string } | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

    // ── Min Quantity Edit state ─────────────────────────────────
    const [minQtyAnchor, setMinQtyAnchor] = useState<HTMLElement | null>(null);
    const [minQtyTarget, setMinQtyTarget] = useState<InventoryWithMeta | null>(null);
    const [minQtyValue, setMinQtyValue] = useState('');
    const [minQtySaving, setMinQtySaving] = useState(false);

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
        data: inventoryPageData,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['inventory-all', effectiveWarehouseId, debouncedSearch, selectedCategory, stockStatus, page, pageSize],
        queryFn: async () => {
            if (!accessibleWarehouses.length) return null;

            const res = await inventoryService.getByWarehousePaged(effectiveWarehouseId || null, {
                keyword: debouncedSearch || undefined,
                stockStatus: stockStatus !== 'all' ? stockStatus : undefined,
                categoryId: selectedCategory || undefined,
                page,
                size: pageSize,
            });

            // Enriched
            const enriched = res.content.map(inv => {
                const p = productMap.get(inv.productId);
                return {
                    ...inv,
                    productName: p?.name ?? inv.productName ?? inv.productId,
                    productSku: p?.sku ?? inv.productSku,
                    isbnBarcode: p?.isbnBarcode ?? inv.isbnBarcode,
                    // warehouseName is already in inv because of new backend DTO
                    categoryId: p?.categoryId ?? inv.categoryId,
                    categoryName: p?.categoryName ?? inv.categoryName,
                    imageUrl: p?.imageUrl ?? inv.productImageUrl,
                    retailPrice: p?.retailPrice,
                    macPrice: p?.macPrice,
                    location: (inv as any).location,
                    inTransit: inv.inTransit || 0,
                } as InventoryWithMeta;
            });

            return {
                ...res,
                content: enriched
            };
        },
        enabled: !loadingProducts && accessibleWarehouses.length > 0,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });

    const paged = inventoryPageData?.content ?? [];
    const totalPages = inventoryPageData?.totalPages ?? 0;
    const totalElements = inventoryPageData?.totalElements ?? 0;

    // ── Stats query — fetch toàn bộ inventory (không lọc) để tính thống kê ──
    const { data: allInventoryData, isLoading: loadingStats } = useQuery({
        queryKey: ['inventory-stats', effectiveWarehouseId],
        queryFn: () => inventoryService.getByWarehousePaged(effectiveWarehouseId || null, { size: 10000 }),
        enabled: accessibleWarehouses.length > 0,
        staleTime: 60_000,
    });

    const stats = React.useMemo(() => {
        const items: any[] = allInventoryData?.content ?? [];
        const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
        const lowStock = items.filter(i => {
            const min = i.minQuantity || 0;
            return i.quantity > 0 && min > 0 && i.quantity <= min;
        }).length;
        const value = items.reduce((s, i) => {
            const price = productMap.get(i.productId)?.retailPrice || i.retailPrice || 0;
            return s + (i.quantity || 0) * price;
        }, 0);
        return {
            total: allInventoryData?.totalElements ?? totalElements,
            totalQty,
            lowStock,
            value,
        };
    }, [allInventoryData, totalElements, productMap]);

    // ── Excel export — xuất tất cả (vượt qua phân trang) ─
    const handleExport = async () => {
        try {
            setSnack({ msg: 'Đang chuẩn bị dữ liệu xuất Excel...', sev: 'success' });
            // Lấy toàn bộ dữ liệu khớp với bộ lọc
            const res = await inventoryService.getByWarehousePaged(effectiveWarehouseId || null, {
                keyword: debouncedSearch || undefined,
                stockStatus: stockStatus !== 'all' ? stockStatus : undefined,
                categoryId: selectedCategory || undefined,
                page: 0,
                size: 10000, // Số lượng lớn để lấy tất cả
            });

            const enriched = res.content.map(inv => {
                const p = productMap.get(inv.productId);
                return {
                    ...inv,
                    productName: p?.name ?? inv.productName ?? inv.productId,
                    productSku: p?.sku ?? inv.productSku,
                    isbnBarcode: p?.isbnBarcode ?? inv.isbnBarcode,
                    categoryName: p?.categoryName ?? inv.categoryName,
                    warehouseName: warehouses.find(w => w.id === inv.warehouseId)?.name ?? inv.warehouseId,
                    retailPrice: p?.retailPrice ?? 0,
                    macPrice: p?.macPrice ?? 0,
                } as InventoryWithMeta;
            });

            exportToExcel(
                enriched,
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
        } catch (error) {
            setSnack({ msg: 'Xuất Excel thất bại', sev: 'error' });
        }
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

    const handleMinQtyClick = (e: React.MouseEvent<HTMLElement>, inv: InventoryWithMeta) => {
        setMinQtyAnchor(e.currentTarget);
        setMinQtyTarget(inv);
        setMinQtyValue(String(inv.minQuantity ?? 0));
    };

    const handleMinQtySave = async () => {
        if (!minQtyTarget) return;
        setMinQtySaving(true);
        try {
            await inventoryService.updateMinQuantity(minQtyTarget.id, Number(minQtyValue) || 0);
            setSnack({ msg: `✅ Cập nhật định mức tối thiểu thành công`, sev: 'success' });
            setMinQtyAnchor(null);
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Cập nhật thất bại', sev: 'error' });
        } finally {
            setMinQtySaving(false);
        }
    };

    const activeCount = [debouncedSearch, selectedCategory, stockStatus !== 'all', selectedWarehouse].filter(Boolean).length;

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
                                {isLoading || loadingProducts || loadingStats ? (
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
                            {buildCategoryTreeFlat(categories.filter((c: any) => c.isActive)).map(c => (
                                <MenuItem key={c.id} value={c.id} sx={{ pl: c.level * 2 + 2 }}>
                                    {c.level > 0 ? '— ' : ''}{c.name}
                                </MenuItem>
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
                        Excel
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
                                                <Tooltip title="Nhấn để chỉnh định mức tối thiểu" arrow>
                                                    <Typography variant="caption" color="#888"
                                                        onClick={(e) => handleMinQtyClick(e, inv)}
                                                        sx={{ cursor: 'pointer', '&:hover': { color: '#2563eb', textDecoration: 'underline' } }}>
                                                        {(inv.minQuantity ?? 0).toLocaleString()}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip icon={ss.icon} label={ss.label} size="small"
                                                    sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: ss.bg, color: ss.color }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {!isAdmin && (
                                                        <Tooltip title="Điều chỉnh tồn kho">
                                                            <IconButton size="small"
                                                                onClick={() => { setAdjustTarget(inv); setAdjustOpen(true); }}
                                                                sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}>
                                                                <Edit sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
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
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
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
                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(e) => {
                        setPageSize(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Số dòng/trang:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    sx={{ borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}
                />
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

            {/* Popover chỉnh minQuantity */}
            <Popover
                open={Boolean(minQtyAnchor)}
                anchorEl={minQtyAnchor}
                onClose={() => setMinQtyAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { p: 2, borderRadius: 2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 240 } }}
            >
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>
                    Định mức tối thiểu
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    {minQtyTarget?.productName} · {minQtyTarget?.warehouseName}
                </Typography>
                <TextField
                    fullWidth size="small" type="number" label="Số lượng tối thiểu"
                    value={minQtyValue}
                    onChange={e => setMinQtyValue(e.target.value)}
                    inputProps={{ min: 0 }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleMinQtySave(); }}
                    sx={{ mb: 1.5 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={() => setMinQtyAnchor(null)} sx={{ textTransform: 'none', color: '#888' }}>Hủy</Button>
                    <Button size="small" variant="contained" onClick={handleMinQtySave} disabled={minQtySaving}
                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', borderRadius: 1.5, '&:hover': { bgcolor: '#1d4ed8' } }}>
                        {minQtySaving ? <CircularProgress size={16} color="inherit" /> : 'Lưu'}
                    </Button>
                </Box>
            </Popover>

        </Box>
    );
};

export default InventoryListTab;