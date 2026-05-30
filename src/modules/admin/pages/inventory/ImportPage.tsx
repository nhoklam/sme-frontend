import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, Snackbar, Alert,
    Skeleton, Pagination, Divider, CircularProgress,
    Grid, Avatar, Collapse, Tooltip,
} from '@mui/material';
import {
    Search, Add, Refresh, Visibility, CheckCircle, Cancel,
    Close, Delete, Business, LocalShipping, ExpandMore, ExpandLess,
    QrCode, Warning, Print, ContentCopy,
} from '@mui/icons-material';
import { purchaseService } from '../../../../services/purchaseService';
import supplierService from '../../../../services/supplierService';
import warehouseService from '../../../../services/warehouseService';
import productService from '../../../../services/productService';
import inventoryService from '../../../../services/inventoryService';
import {
    CreatePurchaseOrderRequest,
    PurchaseOrder,
    PurchaseStatus,
    Supplier,
    Warehouse,
    ProductResponse,
    Inventory,
} from '../../../../types';

// ── Helper ─────────────────────────────────────────────────────
const fmtCurrency = (n?: number) => {
    if (n == null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
};

const STATUS_COLORS: Record<PurchaseStatus, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Nháp', color: '#888', bg: '#f5f5f5' },
    PENDING: { label: 'Chờ duyệt', color: '#e65100', bg: '#fff3e0' },
    COMPLETED: { label: 'Hoàn thành', color: '#2e7d32', bg: '#e8f5e9' },
    CANCELLED: { label: 'Đã hủy', color: '#d32f2f', bg: '#ffebee' },
};

// ── Cart Item với Batch fields ─────────────────────────────────
interface CartItem {
    productId: string;
    productName: string;
    isbnBarcode: string;
    quantity: number;
    importPrice: number;
    subtotal: number;
    imageUrl?: string;
    sku?: string;
    currentStock?: number;
    macPrice?: number;
    // Batch / Lot
    batchNumber?: string;
    lotNumber?: string;
    expiryDate?: string;
    manufacturingDate?: string;
    showBatchFields: boolean;
}

// ── Expiry warning helper ──────────────────────────────────────
const getExpiryWarning = (expiryDate?: string): { label: string; color: string } | null => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Đã hết hạn!', color: '#d32f2f' };
    if (diffDays < 90) return { label: `Còn ${diffDays} ngày`, color: '#e65100' };
    if (diffDays < 180) return { label: `Còn ${diffDays} ngày`, color: '#f59e0b' };
    return null;
};

// ── Import price vs MAC warning ────────────────────────────────
const getPriceWarning = (importPrice: number, macPrice?: number): boolean => {
    if (!macPrice || macPrice === 0) return false;
    return importPrice < macPrice * 0.9;
};

// ══════════════════════════════════════════════════════════════
// DETAIL DIALOG (giữ nguyên từ bản cũ, không thay đổi)
// ══════════════════════════════════════════════════════════════
const PurchaseOrderDetailDialog: React.FC<{
    open: boolean;
    order: PurchaseOrder | null;
    onClose: () => void;
    onApprove: () => void;
    onCancel: () => void;
    loading: boolean;
}> = ({ open, order, onClose, onApprove, onCancel, loading }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Map<string, ProductResponse>>(new Map());
    const printRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            supplierService.getAllSimple().then(setSuppliers).catch(() => { });
            warehouseService.getAll().then(setWarehouses).catch(() => { });
            productService.search({ size: 1000, isActive: true })
                .then(res => {
                    const map = new Map<string, ProductResponse>();
                    res.content.forEach(p => map.set(p.id, p));
                    setProducts(map);
                })
                .catch(() => { });
        }
    }, [open]);

    const supplier = suppliers.find(s => s.id === order?.supplierId);
    const warehouse = warehouses.find(w => w.id === order?.warehouseId);
    const statusInfo = order ? STATUS_COLORS[order.status] : { label: '', color: '', bg: '' };
    const totalQty = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html><head><title>Phiếu nhập hàng - ${order?.code || ''}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Times New Roman', serif; font-size: 13px; color: #000; padding: 20px; }
                .header { text-align: center; margin-bottom: 16px; }
                .header h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
                .header .sub { font-size: 12px; color: #555; display: block; margin-top: 4px; }
                .info-grid { display: flex; gap: 24px; margin-bottom: 16px; }
                .info-grid .col { flex: 1; }
                .info-row { display: flex; margin-bottom: 4px; }
                .info-label { font-weight: bold; min-width: 130px; }
                .info-value { flex: 1; }
                .status-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 12px; }
                th { background: #f5f5f5; font-weight: bold; text-align: center; }
                td.right { text-align: right; }
                td.center { text-align: center; }
                .total-row td { font-weight: bold; border-top: 2px solid #333; }
                .signatures { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; }
                .signatures .sig { flex: 1; }
                .signatures .title { font-weight: bold; margin-bottom: 60px; }
                .signatures .note { font-size: 11px; color: #888; font-style: italic; }
                @media print { body { padding: 10px; } }
            </style>
            </head><body>
            ${printContent.innerHTML}
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
            </body></html>
        `);
        printWindow.document.close();
    };

    const handleCopyCode = () => {
        if (order?.code) {
            navigator.clipboard.writeText(order.code);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            {/* Dialog Header (not printed) */}
            <DialogTitle sx={{ pb: 0.5, pt: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography fontWeight={800} fontSize={15}>Chi tiết phiếu nhập: {order?.code}</Typography>
                    <IconButton size="small" onClick={handleCopyCode} sx={{ color: '#94a3b8' }}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                    </IconButton>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider />

            {/* Printable Content */}
            <DialogContent sx={{ px: 3, pt: 2 }}>
                <Box ref={printRef}>
                    {/* Receipt Header */}
                    <Box className="header" sx={{ textAlign: 'center', mb: 2.5, '@media print': { mb: 1 } }}>
                        <Typography component="h1" fontWeight={900} fontSize={20} letterSpacing={1} color="#1a1a2e">
                            PHIẾU NHẬP HÀNG
                        </Typography>
                        <Typography className="sub" variant="caption" color="#64748b" display="block" fontSize={12}>
                            Số phiếu: {order?.code}
                        </Typography>
                        <Typography className="sub" variant="caption" color="#64748b" display="block" fontSize={12}>
                            Ngày: {formatDate(order?.createdAt)}
                        </Typography>
                    </Box>

                    {/* Info Grid */}
                    <Box className="info-grid" sx={{ display: 'flex', gap: 3, mb: 2.5, flexWrap: 'wrap' }}>
                        <Box className="col" sx={{ flex: 1, minWidth: 260 }}>
                            <Box className="info-row" sx={{ display: 'flex', mb: 0.75, alignItems: 'baseline' }}>
                                <Typography className="info-label" variant="body2" fontWeight={700} sx={{ minWidth: 130 }} color="#475569">Mã phiếu:</Typography>
                                <Typography className="info-value" variant="body2" fontWeight={700} fontFamily="monospace" color="#1976d2">{order?.code}</Typography>
                            </Box>
                            <Box className="info-row" sx={{ display: 'flex', mb: 0.75, alignItems: 'baseline' }}>
                                <Typography className="info-label" variant="body2" fontWeight={700} sx={{ minWidth: 130 }} color="#475569">Nhà cung cấp:</Typography>
                                <Typography className="info-value" variant="body2" fontWeight={600}>{supplier?.name || order?.supplierId}</Typography>
                            </Box>
                            <Box className="info-row" sx={{ display: 'flex', mb: 0.75, alignItems: 'baseline' }}>
                                <Typography className="info-label" variant="body2" fontWeight={700} sx={{ minWidth: 130 }} color="#475569">Ngày tạo:</Typography>
                                <Typography className="info-value" variant="body2">{formatDateTime(order?.createdAt)}</Typography>
                            </Box>
                            <Box className="info-row" sx={{ display: 'flex', mb: 0.75, alignItems: 'baseline' }}>
                                <Typography className="info-label" variant="body2" fontWeight={700} sx={{ minWidth: 130 }} color="#475569">Kho nhập:</Typography>
                                <Typography className="info-value" variant="body2" fontWeight={600}>{warehouse?.name || order?.warehouseId}</Typography>
                            </Box>
                        </Box>
                        <Box className="col" sx={{ flex: 1, minWidth: 200 }}>
                            <Box className="info-row" sx={{ display: 'flex', mb: 0.75, alignItems: 'center' }}>
                                <Typography className="info-label" variant="body2" fontWeight={700} sx={{ minWidth: 100 }} color="#475569">Trạng thái:</Typography>
                                <Chip label={statusInfo.label} size="small"
                                    sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700, height: 24, fontSize: 12 }} />
                            </Box>
                            {order?.note && (
                                <Box className="info-row" sx={{ display: 'flex', mb: 0.75, alignItems: 'baseline' }}>
                                    <Typography className="info-label" variant="body2" fontWeight={700} sx={{ minWidth: 100 }} color="#475569">Ghi chú:</Typography>
                                    <Typography className="info-value" variant="body2" color="#555">{order.note}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Separator */}
                    <Divider sx={{ mb: 2 }} />

                    {/* Items table header */}
                    <Typography variant="subtitle2" fontWeight={800} mb={1.5} textAlign="center" fontSize={14} color="#1a1a2e">
                        Danh sách hàng nhập
                    </Typography>

                    {/* Items Table */}
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #d0d0d0', mb: 2, borderRadius: 1 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'center', borderBottom: '2px solid #aaa', width: 200 }}>Sản phẩm</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'center', borderBottom: '2px solid #aaa', width: 100 }}>SKU</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'center', borderBottom: '2px solid #aaa', width: 60 }}>SL</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'right', borderBottom: '2px solid #aaa', width: 110 }}>Giá nhập</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'right', borderBottom: '2px solid #aaa', width: 120 }}>Thành tiền</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order?.items.map((item, idx) => {
                                    const product = products.get(item.productId);
                                    return (
                                        <TableRow key={item.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="body2" fontWeight={600} fontSize={12.5}>
                                                    {product?.name || item.productId.slice(0, 8)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Typography variant="caption" fontFamily="monospace" color="#555" fontSize={11}>
                                                    {product?.sku || product?.isbnBarcode || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Typography variant="body2" fontWeight={700}>{item.quantity}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" fontSize={12}>{fmtCurrency(item.importPrice)}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" fontWeight={700} color="#1976d2" fontSize={12}>
                                                    {fmtCurrency(item.quantity * item.importPrice)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {/* Total Row */}
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ borderTop: '2px solid #333' }} />
                                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, borderTop: '2px solid #333', fontSize: 13 }}>
                                        {totalQty}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, borderTop: '2px solid #333', fontSize: 13 }}>
                                        Tổng cộng
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, borderTop: '2px solid #333', color: '#d32f2f', fontSize: 14 }}>
                                        {fmtCurrency(order?.totalAmount)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Signatures */}
                    <Box className="signatures" sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, textAlign: 'center' }}>
                        <Box className="sig" sx={{ flex: 1 }}>
                            <Typography className="title" variant="body2" fontWeight={700} mb={0.5}>Người lập phiếu</Typography>
                            <Typography className="note" variant="caption" color="#94a3b8" fontStyle="italic">(Ký và ghi rõ họ tên)</Typography>
                        </Box>
                        <Box className="sig" sx={{ flex: 1 }}>
                            <Typography className="title" variant="body2" fontWeight={700} mb={0.5}>Người giao hàng</Typography>
                            <Typography className="note" variant="caption" color="#94a3b8" fontStyle="italic">(Ký và ghi rõ họ tên)</Typography>
                        </Box>
                        <Box className="sig" sx={{ flex: 1 }}>
                            <Typography className="title" variant="body2" fontWeight={700} mb={0.5}>Thủ kho</Typography>
                            <Typography className="note" variant="caption" color="#94a3b8" fontStyle="italic">(Ký và ghi rõ họ tên)</Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={handlePrint} variant="contained" startIcon={<Print />}
                    sx={{ textTransform: 'none', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
                    In phiếu nhập
                </Button>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>Đóng</Button>
                <Box sx={{ flex: 1 }} />
                {order?.status === 'PENDING' && (
                    <Button onClick={onApprove} variant="contained" disabled={loading}
                        sx={{ textTransform: 'none', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
                        {loading ? 'Đang xử lý...' : '✓ Duyệt phiếu'}
                    </Button>
                )}
                {(order?.status === 'DRAFT' || order?.status === 'PENDING') && (
                    <Button onClick={onCancel} variant="contained" disabled={loading}
                        sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
                        ✕ Hủy phiếu
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// CREATE ORDER DIALOG — với Batch/Lot Number
// ══════════════════════════════════════════════════════════════
const CreatePurchaseDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    warehouses: Warehouse[];
    suppliers: Supplier[];
}> = ({ open, onClose, onCreated, warehouses, suppliers }) => {
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [note, setNote] = useState('');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<ProductResponse[]>([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
    const [supplierProducts, setSupplierProducts] = useState<ProductResponse[]>([]);
    const [loadingSupplierProducts, setLoadingSupplierProducts] = useState(false);
    const [inventoryMap, setInventoryMap] = useState<Map<string, Inventory>>(new Map());

    useEffect(() => {
        if (!open) {
            setSupplierId(''); setWarehouseId(''); setNote(''); setCartItems([]);
            setSearchKeyword(''); setSearchResults([]); setSupplierProducts([]); setInventoryMap(new Map());
        }
    }, [open]);

    useEffect(() => {
        if (supplierId && open) {
            setLoadingSupplierProducts(true);
            productService.search({ size: 100, isActive: true })
                .then(res => setSupplierProducts(res.content.filter(p => p.supplierId === supplierId)))
                .catch(() => setSupplierProducts([]))
                .finally(() => setLoadingSupplierProducts(false));
        } else { setSupplierProducts([]); }
    }, [supplierId, open]);

    useEffect(() => {
        if (warehouseId && open) {
            inventoryService.getByWarehouse(warehouseId)
                .then(data => { const map = new Map<string, Inventory>(); data.forEach(inv => map.set(inv.productId, inv)); setInventoryMap(map); })
                .catch(() => setInventoryMap(new Map()));
        } else { setInventoryMap(new Map()); }
    }, [warehouseId, open]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (searchKeyword.trim().length >= 2 && open) {
                setSearching(true);
                productService.search({ keyword: searchKeyword, size: 10, isActive: true })
                    .then(res => setSearchResults(res.content.filter(p => !cartItems.some(i => i.productId === p.id))))
                    .catch(() => setSearchResults([]))
                    .finally(() => setSearching(false));
            } else { setSearchResults([]); }
        }, 400);
        return () => clearTimeout(t);
    }, [searchKeyword, open, cartItems]);

    const addToCart = (product: ProductResponse) => {
        const inventory = inventoryMap.get(product.id);
        const currentStock = inventory?.quantity || 0;
        setCartItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id
                    ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.importPrice } : i);
            }
            const importPrice = product.wholesalePrice || product.macPrice || product.retailPrice * 0.7;
            return [...prev, {
                productId: product.id, productName: product.name, isbnBarcode: product.isbnBarcode,
                quantity: 1, importPrice, subtotal: importPrice,
                imageUrl: product.imageUrl, sku: product.sku, currentStock,
                macPrice: product.macPrice,
                showBatchFields: false,
            }];
        });
        setSearchKeyword(''); setSearchResults([]);
    };

    const updateField = (productId: string, field: keyof CartItem, value: any) => {
        setCartItems(prev => prev.map(item => {
            if (item.productId !== productId) return item;
            const updated = { ...item, [field]: value };
            if (field === 'quantity') updated.subtotal = (value || 1) * item.importPrice;
            if (field === 'importPrice') updated.subtotal = item.quantity * (value || 0);
            return updated;
        }));
    };

    const removeFromCart = (productId: string) => setCartItems(prev => prev.filter(i => i.productId !== productId));

    const totalAmount = cartItems.reduce((s, i) => s + i.subtotal, 0);
    const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
    const priceWarnings = cartItems.filter(i => getPriceWarning(i.importPrice, i.macPrice)).length;
    const expiryWarnings = cartItems.filter(i => {
        const w = getExpiryWarning(i.expiryDate);
        return w && (w.color === '#e65100' || w.color === '#d32f2f');
    }).length;

    const handleCreate = async () => {
        if (!supplierId) { setSnack({ message: 'Vui lòng chọn nhà cung cấp', severity: 'error' }); return; }
        if (!warehouseId) { setSnack({ message: 'Vui lòng chọn kho nhập', severity: 'error' }); return; }
        if (!cartItems.length) { setSnack({ message: 'Vui lòng thêm sản phẩm', severity: 'error' }); return; }
        setCreating(true);
        try {
            const payload: CreatePurchaseOrderRequest = {
                supplierId, warehouseId,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    importPrice: item.importPrice,
                    batchNumber: item.batchNumber || undefined,
                    lotNumber: item.lotNumber || undefined,
                    expiryDate: item.expiryDate || undefined,
                    manufacturingDate: item.manufacturingDate || undefined,
                })),
                note: note || undefined,
            };
            await purchaseService.create(payload);
            setSnack({ message: 'Tạo phiếu nhập thành công!', severity: 'success' });
            onCreated(); onClose();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Tạo phiếu nhập thất bại', severity: 'error' });
        } finally { setCreating(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2.5, height: '90vh' } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={800} fontSize={16}>Tạo Phiếu Nhập Kho Mới</Typography>
                    <Typography variant="caption" color="text.secondary">Quản lý nhập hàng từ Nhà cung cấp · Hỗ trợ Batch/Lô số</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {priceWarnings > 0 && (
                        <Chip icon={<Warning sx={{ fontSize: 13 }} />}
                            label={`${priceWarnings} giá thấp`} size="small"
                            sx={{ height: 22, fontSize: 10, bgcolor: '#fff3e0', color: '#e65100', fontWeight: 700 }} />
                    )}
                    {expiryWarnings > 0 && (
                        <Chip icon={<Warning sx={{ fontSize: 13 }} />}
                            label={`${expiryWarnings} sắp hết hạn`} size="small"
                            sx={{ height: 22, fontSize: 10, bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }} />
                    )}
                    <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
                </Box>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />
            <DialogContent sx={{ px: 3, pt: 2 }}>
                {/* NCC + Kho */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                            Nhà cung cấp <span style={{ color: '#d32f2f' }}>*</span>
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select value={supplierId} onChange={e => setSupplierId(e.target.value)} displayEmpty>
                                <MenuItem value="">-- Chọn Nhà cung cấp --</MenuItem>
                                {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                            Kho nhập <span style={{ color: '#d32f2f' }}>*</span>
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty>
                                <MenuItem value="">-- Chọn kho --</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Danh sách hàng hóa</Typography>

                {!supplierId ? (
                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 1.5, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Vui lòng chọn Nhà cung cấp để xem danh sách sản phẩm.</Typography>
                    </Box>
                ) : loadingSupplierProducts ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
                ) : (
                    <>
                        <Paper elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 1.5, mb: 2, maxHeight: 220, overflowY: 'auto' }}>
                            {supplierProducts.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">Nhà cung cấp này chưa có sản phẩm nào.</Typography>
                                </Box>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                                            {['Sản phẩm', 'Mã vạch', 'Giá bán', 'Thao tác'].map(c => (
                                                <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {supplierProducts.map(product => (
                                            <TableRow key={product.id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        {product.imageUrl && (
                                                            <Box component="img" src={product.imageUrl} alt={product.name}
                                                                sx={{ width: 32, height: 42, objectFit: 'contain', borderRadius: 0.5 }} />
                                                        )}
                                                        <Typography variant="body2" fontWeight={600} fontSize={13}>{product.name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" fontFamily="monospace" color="#888">{product.isbnBarcode}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={700} color="#1976d2">{fmtCurrency(product.retailPrice)}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Button size="small" variant="outlined"
                                                        disabled={cartItems.some(i => i.productId === product.id)}
                                                        onClick={() => addToCart(product)}>
                                                        {cartItems.some(i => i.productId === product.id) ? 'Đã thêm' : 'Thêm'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Paper>
                        <TextField fullWidth size="small"
                            placeholder="Hoặc tìm thêm sản phẩm theo tên, ISBN, SKU..."
                            value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment>,
                                endAdornment: searching && <CircularProgress size={20} />,
                            }}
                            sx={{ mb: 1.5 }} />
                        {searchResults.length > 0 && (
                            <Paper elevation={2} sx={{ mb: 2, maxHeight: 200, overflowY: 'auto', borderRadius: 1.5 }}>
                                {searchResults.map(product => (
                                    <Box key={product.id} onClick={() => addToCart(product)} sx={{
                                        px: 2, py: 1.25, cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        '&:hover': { bgcolor: '#f5f9ff' },
                                    }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} fontSize={13}>{product.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{product.isbnBarcode}</Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={700} color="#1976d2">{fmtCurrency(product.retailPrice)}</Typography>
                                    </Box>
                                ))}
                            </Paper>
                        )}
                    </>
                )}

                {/* Cart — với Batch fields */}
                {cartItems.length > 0 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                Sản phẩm đã chọn ({cartItems.length})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Tổng số lượng: {totalQty}</Typography>
                        </Box>

                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', mb: 2, maxHeight: 400, overflowY: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        {['Sản phẩm', 'Số lượng', 'Giá nhập', 'Thành tiền', 'Batch/Lô', ''].map(c => (
                                            <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cartItems.map(item => {
                                        const priceWarn = getPriceWarning(item.importPrice, item.macPrice);
                                        const expiryWarn = getExpiryWarning(item.expiryDate);
                                        return (
                                            <React.Fragment key={item.productId}>
                                                <TableRow sx={{ bgcolor: priceWarn ? '#fff8f0' : 'inherit' }}>
                                                    <TableCell sx={{ py: 1.25, minWidth: 180 }}>
                                                        <Typography variant="body2" fontWeight={600} fontSize={13}>{item.productName}</Typography>
                                                        {item.currentStock !== undefined && (
                                                            <Typography variant="caption" color={item.currentStock === 0 ? '#d32f2f' : '#888'}>
                                                                Tồn: {item.currentStock}
                                                            </Typography>
                                                        )}
                                                        {priceWarn && (
                                                            <Tooltip title={`Giá nhập thấp hơn giá vốn MAC (${fmtCurrency(item.macPrice)}) trên 10%`}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                                    <Warning sx={{ fontSize: 12, color: '#e65100' }} />
                                                                    <Typography variant="caption" color="#e65100" fontSize={10}>Giá thấp</Typography>
                                                                </Box>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        <TextField size="small" type="number" value={item.quantity}
                                                            onChange={e => updateField(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                                                            inputProps={{ min: 1, style: { width: 70, textAlign: 'center' } }} />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.25 }}>
                                                        <TextField size="small" type="number" value={item.importPrice}
                                                            onChange={e => updateField(item.productId, 'importPrice', parseInt(e.target.value) || 0)}
                                                            inputProps={{ min: 0, style: { width: 110, textAlign: 'right' } }}
                                                            InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
                                                            sx={{ '& .MuiOutlinedInput-root': { borderColor: priceWarn ? '#e65100' : undefined } }} />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.25 }}>
                                                        <Typography variant="body2" fontWeight={700} color="#1976d2">{fmtCurrency(item.subtotal)}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.25 }}>
                                                        {/* Batch toggle */}
                                                        <Button size="small" variant="text"
                                                            startIcon={item.showBatchFields ? <ExpandLess sx={{ fontSize: 14 }} /> : <QrCode sx={{ fontSize: 14 }} />}
                                                            onClick={() => updateField(item.productId, 'showBatchFields', !item.showBatchFields)}
                                                            sx={{
                                                                textTransform: 'none', fontSize: 11, py: 0.25,
                                                                color: item.batchNumber || item.expiryDate ? '#1976d2' : '#888',
                                                            }}>
                                                            {item.showBatchFields ? 'Ẩn' : 'Lô/HSD'}
                                                            {(item.batchNumber || item.expiryDate) && (
                                                                <Chip label="✓" size="small"
                                                                    sx={{ ml: 0.5, height: 16, fontSize: 9, bgcolor: '#e3f2fd', color: '#1565c0' }} />
                                                            )}
                                                        </Button>
                                                        {expiryWarn && (
                                                            <Typography variant="caption" display="block" color={expiryWarn.color} fontSize={10}>
                                                                {expiryWarn.label}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1.25 }}>
                                                        <IconButton size="small" onClick={() => removeFromCart(item.productId)}>
                                                            <Delete fontSize="small" sx={{ color: '#d32f2f' }} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>

                                                {/* ── Batch fields (expand) ── */}
                                                <TableRow>
                                                    <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                                        <Collapse in={item.showBatchFields} unmountOnExit>
                                                            <Box sx={{
                                                                display: 'flex', gap: 1.5, p: 1.5, flexWrap: 'wrap',
                                                                bgcolor: '#f0f7ff', borderBottom: '1px solid #e3f2fd',
                                                            }}>
                                                                <Box sx={{ flex: 1, minWidth: 140 }}>
                                                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>
                                                                        Số lô (Batch)
                                                                    </Typography>
                                                                    <TextField size="small" fullWidth
                                                                        placeholder="VD: LOT-2024-001"
                                                                        value={item.batchNumber || ''}
                                                                        onChange={e => updateField(item.productId, 'batchNumber', e.target.value)} />
                                                                </Box>
                                                                <Box sx={{ flex: 1, minWidth: 140 }}>
                                                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>
                                                                        Mã lô (Lot)
                                                                    </Typography>
                                                                    <TextField size="small" fullWidth
                                                                        placeholder="VD: L240815"
                                                                        value={item.lotNumber || ''}
                                                                        onChange={e => updateField(item.productId, 'lotNumber', e.target.value)} />
                                                                </Box>
                                                                <Box sx={{ flex: 1, minWidth: 150 }}>
                                                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>
                                                                        Ngày sản xuất
                                                                    </Typography>
                                                                    <TextField size="small" fullWidth type="date"
                                                                        value={item.manufacturingDate || ''}
                                                                        onChange={e => updateField(item.productId, 'manufacturingDate', e.target.value)}
                                                                        inputProps={{ max: new Date().toISOString().slice(0, 10) }} />
                                                                </Box>
                                                                <Box sx={{ flex: 1, minWidth: 150 }}>
                                                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>
                                                                        Hạn sử dụng <span style={{ color: '#d32f2f' }}>*</span>
                                                                    </Typography>
                                                                    <TextField size="small" fullWidth type="date"
                                                                        value={item.expiryDate || ''}
                                                                        onChange={e => updateField(item.productId, 'expiryDate', e.target.value)}
                                                                        inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                                                                        error={!!getExpiryWarning(item.expiryDate)}
                                                                        helperText={getExpiryWarning(item.expiryDate)?.label}
                                                                        FormHelperTextProps={{ sx: { color: getExpiryWarning(item.expiryDate)?.color } }} />
                                                                </Box>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                                <Typography variant="body2" fontWeight={700}>
                                    Tổng tiền: <strong style={{ color: '#d32f2f' }}>{fmtCurrency(totalAmount)}</strong>
                                </Typography>
                            </Paper>
                        </Box>
                    </>
                )}

                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Ghi chú</Typography>
                <TextField fullWidth size="small" multiline rows={2} placeholder="Ghi chú cho phiếu nhập kho..."
                    value={note} onChange={e => setNote(e.target.value)} />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                <Button onClick={handleCreate} variant="contained"
                    disabled={creating || !supplierId || !warehouseId || cartItems.length === 0}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    {creating ? 'Đang tạo...' : 'Tạo phiếu nhập'}
                </Button>
            </DialogActions>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
            </Snackbar>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE (không đổi logic, chỉ pass suppliers đúng type)
// ══════════════════════════════════════════════════════════════
const ImportPage: React.FC = () => {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const PAGE_SIZE = 15;

    const { data: purchaseOrders, isLoading: loadingOrders, refetch: refetchOrders } = useQuery({
        queryKey: ['purchase-orders', page, statusFilter],
        queryFn: () => purchaseService.getAll({ page, size: PAGE_SIZE, status: statusFilter || undefined }),
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers-simple'],
        queryFn: () => supplierService.getAllSimple(),
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => warehouseService.getAll(),
    });

    const handleApprove = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await purchaseService.approve(selectedOrder.id);
            setSnack({ message: 'Duyệt phiếu nhập thành công!', severity: 'success' });
            setDetailOpen(false);
            refetchOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Duyệt thất bại', severity: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleCancel = async () => {
        if (!selectedOrder || !cancelReason.trim()) return;
        setActionLoading(true);
        try {
            await purchaseService.cancel(selectedOrder.id, cancelReason);
            setSnack({ message: 'Đã hủy phiếu nhập kho', severity: 'success' });
            setCancelOpen(false); setCancelReason(''); setDetailOpen(false);
            refetchOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Hủy thất bại', severity: 'error' });
        } finally { setActionLoading(false); }
    };

    const supplierMap = React.useMemo(() => {
        const map = new Map<string, Supplier>();
        suppliers.forEach(s => map.set(s.id, s));
        return map;
    }, [suppliers]);

    const warehouseMap = React.useMemo(() => {
        const map = new Map<string, Warehouse>();
        warehouses.forEach(w => map.set(w.id, w));
        return map;
    }, [warehouses]);

    const orders = purchaseOrders?.content || [];
    const totalPages = purchaseOrders?.totalPages || 0;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>Kho / <strong>Nhập kho</strong></Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>Phiếu nhập kho</Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>Quản lý nhập hàng từ Nhà cung cấp · Hỗ trợ Batch/Lô số</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    Tạo phiếu nhập
                </Button>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="DRAFT">Nháp</MenuItem>
                            <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                            <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
                            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                        </Select>
                    </FormControl>
                    <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={() => refetchOrders()}>Làm mới</Button>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Mã phiếu', 'Nhà cung cấp', 'Kho nhập', 'Số lượng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Hành động'].map(col => (
                                    <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>{col.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingOrders ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7, 8].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>Chưa có phiếu nhập kho nào</TableCell></TableRow>
                            ) : orders.map(order => {
                                const statusInfo = STATUS_COLORS[order.status];
                                const supplier = supplierMap.get(order.supplierId);
                                const warehouse = warehouseMap.get(order.warehouseId);
                                const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                                return (
                                    <TableRow key={order.id} hover sx={{ cursor: 'pointer' }}
                                        onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}>
                                        <TableCell><Typography fontWeight={600} fontFamily="monospace">{order.code}</Typography></TableCell>
                                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Business sx={{ fontSize: 14 }} />{supplier?.name || order.supplierId.slice(0, 8)}</Box></TableCell>
                                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocalShipping sx={{ fontSize: 14 }} />{warehouse?.name || order.warehouseId.slice(0, 8)}</Box></TableCell>
                                        <TableCell>{totalQty}</TableCell>
                                        <TableCell><Typography fontWeight={700} color="#1976d2">{fmtCurrency(order.totalAmount)}</Typography></TableCell>
                                        <TableCell><Chip label={statusInfo.label} size="small" sx={{ bgcolor: statusInfo.bg, color: statusInfo.color }} /></TableCell>
                                        <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}</TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton size="small" onClick={() => { setSelectedOrder(order); setDetailOpen(true); }} sx={{ color: '#3b82f6', '&:hover': { bgcolor: '#eff6ff' } }}><Visibility /></IconButton>
                                                {order.status === 'PENDING' && (
                                                    <IconButton size="small" onClick={() => { setSelectedOrder(order); handleApprove(); }} sx={{ color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}><CheckCircle /></IconButton>
                                                )}
                                                {(order.status === 'DRAFT' || order.status === 'PENDING') && (
                                                    <IconButton size="small" onClick={() => { setSelectedOrder(order); setCancelOpen(true); }} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}><Cancel /></IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #f0f0f0' }}>
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} size="small" />
                    </Box>
                )}
            </Paper>

            <PurchaseOrderDetailDialog open={detailOpen} order={selectedOrder} onClose={() => setDetailOpen(false)}
                onApprove={handleApprove} onCancel={() => setCancelOpen(true)} loading={actionLoading} />

            <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Hủy phiếu nhập kho</DialogTitle>
                <DialogContent>
                    <TextField fullWidth multiline rows={3} label="Lý do hủy" value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)} margin="normal" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelOpen(false)}>Đóng</Button>
                    <Button onClick={handleCancel} variant="contained" color="error">Xác nhận hủy</Button>
                </DialogActions>
            </Dialog>

            <CreatePurchaseDialog open={createOpen} onClose={() => setCreateOpen(false)}
                onCreated={() => refetchOrders()} warehouses={warehouses} suppliers={suppliers} />

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
};

export default ImportPage;