import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, InputAdornment, Chip, Select, MenuItem, FormControl,
    Skeleton, Alert, Button, Typography, LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Divider, CircularProgress, Snackbar,
} from '@mui/material';
import { Search, Refresh, FileDownloadOutlined, Add, Close, ShoppingCart } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import inventoryService from '../../../../../services/inventoryService';
import productService from '../../../../../services/productService';
import categoryService from '../../../../../services/categoryService';
import supplierService from '../../../../../services/supplierService';
import warehouseService from '../../../../../services/warehouseService';
import { purchaseService } from '../../../../../services/purchaseService';
import { exportToExcel } from '../../../../../utils/excelExport';
import useAuth from '../../../../../store/hooks/useAuth';
import { LowStockItem, Warehouse, ProductResponse } from '../../../../../types';

const fmtCurrency = (n?: number) =>
    n == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ══════════════════════════════════════════════════════════════
// QUICK IMPORT DIALOG
// ══════════════════════════════════════════════════════════════
interface QuickImportItem {
    productId: string;
    productName: string;
    isbnBarcode?: string;
    currentStock: number;
    minQuantity: number;
    suggestedQty: number;  // minQty - currentStock (tối thiểu cần nhập)
    quantity: number;      // số lượng người dùng nhập
    importPrice: number;
}

const QuickImportDialog: React.FC<{
    open: boolean;
    items: LowStockItem[];           // danh sách sản phẩm được pre-fill
    productMap: Map<string, ProductResponse>;
    onClose: () => void;
    onCreated: () => void;
}> = ({ open, items, productMap, onClose, onCreated }) => {
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [note, setNote] = useState('');
    const [creating, setCreating] = useState(false);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    // Build cart từ items được truyền vào
    const [cart, setCart] = useState<QuickImportItem[]>([]);

    useEffect(() => {
        if (open) {
            const newCart = items.map(item => {
                const p = productMap.get(item.productId);
                const suggested = Math.max(item.minQuantity - item.quantity, 1);
                const importPrice = p?.wholesalePrice ?? p?.macPrice ?? Math.round((p?.retailPrice ?? 0) * 0.7);
                return {
                    productId: item.productId,
                    productName: item.productName,
                    isbnBarcode: p?.isbnBarcode,
                    currentStock: item.quantity,
                    minQuantity: item.minQuantity,
                    suggestedQty: suggested,
                    quantity: suggested,
                    importPrice,
                };
            });
            setCart(newCart);
            setSupplierId(''); setWarehouseId(''); setNote('');
        }
    }, [open, items, productMap]);

    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers-simple'],
        queryFn: () => supplierService.getAllSimple(),
        enabled: open,
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: warehouseService.getAll,
        enabled: open,
    });

    const updateQty = (productId: string, qty: number) => {
        setCart(prev => prev.map(i => i.productId === productId
            ? { ...i, quantity: Math.max(1, qty) } : i));
    };

    const updatePrice = (productId: string, price: number) => {
        setCart(prev => prev.map(i => i.productId === productId
            ? { ...i, importPrice: Math.max(0, price) } : i));
    };

    const removeItem = (productId: string) => {
        setCart(prev => prev.filter(i => i.productId !== productId));
    };

    const totalAmount = cart.reduce((s, i) => s + i.quantity * i.importPrice, 0);
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

    const handleCreate = async () => {
        if (!supplierId) { setSnack({ message: 'Vui lòng chọn nhà cung cấp', severity: 'error' }); return; }
        if (!warehouseId) { setSnack({ message: 'Vui lòng chọn kho nhập', severity: 'error' }); return; }
        if (cart.length === 0) { setSnack({ message: 'Không có sản phẩm nào', severity: 'error' }); return; }
        setCreating(true);
        try {
            await purchaseService.create({
                supplierId,
                warehouseId,
                items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, importPrice: i.importPrice })),
                note: note || `Nhập hàng từ cảnh báo tồn kho thấp - ${new Date().toLocaleDateString('vi-VN')}`,
            });
            setSnack({ message: `Tạo phiếu nhập thành công! ${cart.length} sản phẩm`, severity: 'success' });
            onCreated();
            onClose();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Tạo phiếu nhập thất bại', severity: 'error' });
        } finally { setCreating(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, maxHeight: '90vh' } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <ShoppingCart sx={{ fontSize: 18, color: '#2563eb' }} />
                        <Typography fontWeight={800} fontSize={16}>Tạo phiếu nhập nhanh</Typography>
                        <Chip label={`${cart.length} sản phẩm`} size="small"
                            sx={{ height: 22, fontSize: 10, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Từ danh sách cảnh báo tồn kho thấp · Có thể điều chỉnh SL và giá nhập
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />

            <DialogContent sx={{ px: 3, pt: 2 }}>
                {/* NCC + Kho */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                            Nhà cung cấp <span style={{ color: '#ef4444' }}>*</span>
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select value={supplierId} onChange={e => setSupplierId(e.target.value)} displayEmpty>
                                <MenuItem value="">-- Chọn nhà cung cấp --</MenuItem>
                                {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                            Kho nhập <span style={{ color: '#ef4444' }}>*</span>
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty>
                                <MenuItem value="">-- Chọn kho --</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w =>
                                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                {/* Bảng sản phẩm */}
                <Paper elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 1.5, mb: 2, maxHeight: 340, overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Sản phẩm', 'Tồn hiện tại', 'Định mức', 'Cần nhập (gợi ý)', 'Số lượng nhập', 'Giá nhập', 'Thành tiền', ''].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 10, color: '#888', py: 1.25, whiteSpace: 'nowrap' }}>
                                        {c.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cart.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">Không còn sản phẩm nào</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : cart.map(item => (
                                <TableRow key={item.productId}>
                                    <TableCell sx={{ py: 1.25, minWidth: 160 }}>
                                        <Typography variant="body2" fontWeight={600} fontSize={12}>{item.productName}</Typography>
                                        {item.isbnBarcode && (
                                            <Typography variant="caption" color="#888" fontFamily="monospace" fontSize={10}>
                                                {item.isbnBarcode}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1.25 }}>
                                        <Typography variant="body2" fontWeight={700}
                                            color={item.currentStock === 0 ? '#ef4444' : '#f59e0b'}>
                                            {item.currentStock}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1.25 }}>
                                        <Typography variant="body2" color="#555">{item.minQuantity}</Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1.25 }}>
                                        <Chip
                                            label={`+${item.suggestedQty}`}
                                            size="small"
                                            sx={{ height: 20, fontSize: 10, bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1.25 }}>
                                        <TextField
                                            size="small" type="number"
                                            value={item.quantity}
                                            onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                                            inputProps={{ min: 1, style: { width: 65, textAlign: 'center' } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.25 }}>
                                        <TextField
                                            size="small" type="number"
                                            value={item.importPrice}
                                            onChange={e => updatePrice(item.productId, parseInt(e.target.value) || 0)}
                                            inputProps={{ min: 0, style: { width: 100, textAlign: 'right' } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.25 }}>
                                        <Typography variant="body2" fontWeight={700} color="#2563eb">
                                            {fmtCurrency(item.quantity * item.importPrice)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1.25 }}>
                                        <IconButton size="small" onClick={() => removeItem(item.productId)}>
                                            <Close sx={{ fontSize: 14, color: '#ef4444' }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>

                {/* Tổng tiền */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Tổng số lượng: <strong>{totalQty.toLocaleString()}</strong>
                    </Typography>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="body2" fontWeight={700}>
                            Tổng tiền: <strong style={{ color: '#ef4444' }}>{fmtCurrency(totalAmount)}</strong>
                        </Typography>
                    </Paper>
                </Box>

                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Ghi chú</Typography>
                <TextField fullWidth size="small" multiline rows={2}
                    placeholder="Ghi chú cho phiếu nhập kho..."
                    value={note} onChange={e => setNote(e.target.value)} />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>Đóng</Button>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    disabled={creating || !supplierId || !warehouseId || cart.length === 0}
                    startIcon={creating ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Add />}
                    sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, height: 36 }}
                >
                    {creating ? 'Đang tạo...' : `Tạo phiếu nhập (${cart.length} SP)`}
                </Button>
            </DialogActions>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
            </Snackbar>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN TAB
// ══════════════════════════════════════════════════════════════
interface Props {
    warehouses: Warehouse[];
}

const LowStockTab: React.FC<Props> = ({ warehouses }) => {
    const { isAdmin, warehouseId: myWarehouseId } = useAuth();

    const [items, setItems] = useState<LowStockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // ── NEW: Quick Import state ──
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importPrefilledItems, setImportPrefilledItems] = useState<LowStockItem[]>([]);
    const [snack, setSnack] = useState<string>('');

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

    const accessibleWarehouseIds = React.useMemo(() => {
        if (isAdmin) return warehouses.filter(w => w.isActive).map(w => w.id);
        if (!myWarehouseId) return [];
        return [myWarehouseId];
    }, [isAdmin, myWarehouseId, warehouses]);

    const load = useCallback(async () => {
        if (!accessibleWarehouseIds.length || !products.length) { setItems([]); return; }
        setLoading(true);
        try {
            const allInventories = await Promise.all(
                accessibleWarehouseIds.map(id =>
                    inventoryService.getByWarehouse(id).catch(() => [])
                )
            );

            const lowStockItems: LowStockItem[] = [];
            accessibleWarehouseIds.forEach((wId, i) => {
                const w = warehouses.find(wh => wh.id === wId);
                if (!w) return;
                const invs = allInventories[i] as any[];
                const invMap = new Map<string, any>(invs.map(inv => [inv.productId, inv]));

                products.forEach(p => {
                    const inv = invMap.get(p.id);
                    const qty = inv ? Number(inv.availableQuantity) : 0;
                    const minQty = inv ? Number(inv.minQuantity) : 0; // Defaults to 0

                    if (qty <= minQty) {
                        lowStockItems.push({
                            inventoryId: inv ? inv.id : '',
                            productId: p.id,
                            productName: p.name,
                            productSku: p.sku,
                            warehouseId: w.id,
                            warehouseName: w.name,
                            quantity: qty,
                            minQuantity: minQty,
                            reservedQuantity: inv ? Number(inv.reservedQuantity || 0) : 0
                        });
                    }
                });
            });
            setItems(lowStockItems);
        } catch {
            setItems([]);
        } finally { setLoading(false); }
    }, [accessibleWarehouseIds, products, warehouses]);

    useEffect(() => { load(); }, [load]);

    const filtered = items.filter(item => {
        if (selectedWarehouse && item.warehouseId !== selectedWarehouse) return false;
        const p = productMap.get(item.productId);
        if (selectedCategory && p?.categoryId !== selectedCategory) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            if (!item.productName.toLowerCase().includes(q) && !(item.productSku ?? '').toLowerCase().includes(q))
                return false;
        }
        return true;
    });

    const handleExport = () => {
        exportToExcel(
            filtered.map(item => ({
                ...item,
                categoryName: productMap.get(item.productId)?.categoryName ?? '',
            })),
            [
                { header: 'Tên sản phẩm', key: 'productName', width: 40 },
                { header: 'SKU', key: 'productSku', width: 15 },
                { header: 'Danh mục', key: 'categoryName', width: 18 },
                { header: 'Chi nhánh', key: 'warehouseName', width: 25 },
                { header: 'Tồn hiện tại', key: 'quantity', width: 14 },
                { header: 'Định mức tối thiểu', key: 'minQuantity', width: 20 },
                { header: 'Đã giữ chỗ', key: 'reservedQuantity', width: 14 },
                {
                    header: 'Mức tồn (%)',
                    key: 'quantity',
                    width: 14,
                    formatter: (_v: any, row: any) =>
                        row.minQuantity > 0 ? Math.round((row.quantity / row.minQuantity) * 100) : 0,
                },
            ],
            'canh-bao-ton-kho',
            'Cảnh Báo Tồn Kho'
        );
    };

    // ── NEW: Open quick import with all filtered items ──
    const handleCreateImportAll = () => {
        setImportPrefilledItems(filtered);
        setImportDialogOpen(true);
    };

    // ── NEW: Open quick import with single item ──
    const handleCreateImportOne = (item: LowStockItem) => {
        setImportPrefilledItems([item]);
        setImportDialogOpen(true);
    };

    const clearFilters = () => { setSearch(''); setSelectedWarehouse(''); setSelectedCategory(''); };
    const activeCount = [search, selectedWarehouse, selectedCategory].filter(Boolean).length;

    return (
        <Box>
            {items.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}
                    action={
                        // ── NEW: Action button trong Alert ──
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<Add sx={{ fontSize: 14 }} />}
                            onClick={handleCreateImportAll}
                            sx={{
                                bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' },
                                textTransform: 'none', fontWeight: 700,
                                fontSize: 11, whiteSpace: 'nowrap',
                                borderRadius: 1.5, height: 28,
                            }}
                        >
                            Nhập hàng tất cả ({filtered.length})
                        </Button>
                    }
                >
                    ⚠️ Có <strong>{items.length}</strong> sản phẩm sắp hết hàng.
                </Alert>
            )}

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Tìm theo tên, SKU..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ fontSize: 17, color: '#bbb' }} />
                            </InputAdornment>
                        ),
                    }}
                />
                {isAdmin && (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả kho</MenuItem>
                            {warehouses.filter(w => w.isActive).map(w => (
                                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} displayEmpty>
                        <MenuItem value="">Tất cả danh mục</MenuItem>
                        {categories.filter(c => c.isActive).map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />}
                    onClick={load} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5, height: 36 }}>
                    Làm mới
                </Button>
                <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                    onClick={handleExport} sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a', borderRadius: 1.5, height: 36 }}>
                    Excel ({filtered.length})
                </Button>
                {activeCount > 0 && (
                    <Button size="small" onClick={clearFilters}
                        sx={{ textTransform: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
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
                                {['Sản phẩm', 'SKU', 'Danh mục', 'Chi nhánh', 'Tồn hiện tại', 'Định mức', 'Mức tồn', 'Đã giữ chỗ', 'Thao tác'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>
                                        {c.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                            ) : filtered.length > 0 ? (
                                filtered.map((item, idx) => {
                                    const pct = item.minQuantity > 0
                                        ? Math.min((item.quantity / item.minQuantity) * 100, 100) : 0;
                                    const p = productMap.get(item.productId);
                                    return (
                                        <TableRow key={item.inventoryId} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {p?.imageUrl && (
                                                        <Box component="img" src={p.imageUrl} alt={item.productName}
                                                            sx={{ width: 36, height: 48, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />
                                                    )}
                                                    <Typography variant="body2" fontWeight={600} fontSize={13}>{item.productName}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontFamily="monospace" color="#888">{item.productSku || '—'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {p?.categoryName ? (
                                                    <Chip label={p.categoryName} size="small"
                                                        sx={{ height: 20, fontSize: 10, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} />
                                                ) : <Typography variant="caption" color="#bbb">—</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="#555">{item.warehouseName}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={800}
                                                    color={item.quantity === 0 ? '#ef4444' : '#f59e0b'}>
                                                    {item.quantity}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="#555">{item.minQuantity}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 120 }}>
                                                <LinearProgress variant="determinate" value={pct}
                                                    sx={{
                                                        height: 6, borderRadius: 3, bgcolor: '#f1f5f9',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: item.quantity === 0 ? '#ef4444' : '#f59e0b',
                                                        },
                                                    }} />
                                                <Typography variant="caption" color="#aaa" fontSize={10}>{pct.toFixed(0)}%</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="#7b1fa2" fontWeight={600}>
                                                    {item.reservedQuantity || 0}
                                                </Typography>
                                            </TableCell>
                                            {/* ── NEW: Nút tạo phiếu nhập nhanh cho từng dòng ── */}
                                            <TableCell sx={{ py: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<Add sx={{ fontSize: 13 }} />}
                                                    onClick={() => handleCreateImportOne(item)}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontSize: 11,
                                                        py: 0.4,
                                                        px: 1.25,
                                                        borderColor: '#f59e0b',
                                                        color: '#f59e0b',
                                                        whiteSpace: 'nowrap',
                                                        borderRadius: 1.5,
                                                        height: 28,
                                                        fontWeight: 700,
                                                        '&:hover': { bgcolor: '#fffbeb', borderColor: '#d97706', color: '#d97706' },
                                                    }}
                                                >
                                                    Nhập hàng
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={36} mb={1}>✅</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {items.length === 0 ? 'Tồn kho ổn định, không có cảnh báo' : 'Không tìm thấy mục nào'}
                                        </Typography>
                                        {activeCount > 0 && items.length > 0 && (
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
            </Paper>

            {/* Quick Import Dialog */}
            <QuickImportDialog
                open={importDialogOpen}
                items={importPrefilledItems}
                productMap={productMap}
                onClose={() => setImportDialogOpen(false)}
                onCreated={() => {
                    setSnack('✅ Phiếu nhập đã được tạo! Vào "Phiếu nhập kho" để duyệt.');
                    load();
                }}
            />

            <Snackbar open={!!snack} autoHideDuration={5000} onClose={() => setSnack('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? (
                    <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2 }}>{snack}</Alert>
                ) : <div />}
            </Snackbar>
        </Box>
    );
};

export default LowStockTab;