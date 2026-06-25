import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, Snackbar, Alert,
    Skeleton, Pagination, Divider, CircularProgress,
    Grid, Collapse, Tooltip,
} from '@mui/material';
import {
    Search, Add, Refresh, Visibility, CheckCircle, Cancel,
    Close, Delete, Business, LocalShipping, ExpandMore, ExpandLess,
    QrCode, Warning, Print, ContentCopy, Send, ThumbDown,
    Inventory2, FileUploadOutlined, FileDownloadOutlined,
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
    PurchaseItem,
} from '../../../../types';
import authService from '../../../../services/authService';

// ── helpers ────────────────────────────────────────────────────
const fmtCurrency = (n?: number) => {
    if (n == null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
};

const STATUS_COLORS: Record<PurchaseStatus, { label: string; color: string; bg: string }> = {
    DRAFT:            { label: 'Nháp',         color: '#888',    bg: '#f5f5f5' },
    PENDING_APPROVAL: { label: 'Chờ duyệt',    color: '#e65100', bg: '#fff3e0' },
    APPROVED:         { label: 'Đã duyệt',     color: '#1565c0', bg: '#e3f2fd' },
    REJECTED:         { label: 'Bị từ chối',   color: '#d32f2f', bg: '#ffebee' },
    COMPLETED:        { label: 'Hoàn thành',   color: '#2e7d32', bg: '#e8f5e9' },
    CANCELLED:        { label: 'Đã hủy',       color: '#9e9e9e', bg: '#f5f5f5' },
};

const canApproveOrder = (order: PurchaseOrder, user: any): boolean => {
    if (!user || !order.creatorRole) return false;
    if (user.id === order.createdByUserId) return false;
    if (order.creatorRole === 'ROLE_MANAGER' && user.role === 'ROLE_ADMIN') return true;
    if (order.creatorRole === 'ROLE_ADMIN' && user.role === 'ROLE_MANAGER') {
        return !!user.warehouseId && String(user.warehouseId).toLowerCase() === String(order.warehouseId).toLowerCase();
    }
    return false;
};

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
    batchNumber?: string;
    lotNumber?: string;
    expiryDate?: string;
    manufacturingDate?: string;
    showBatchFields: boolean;
}

const getExpiryWarning = (expiryDate?: string): { label: string; color: string } | null => {
    if (!expiryDate) return null;
    const diffDays = Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    if (diffDays < 0) return { label: 'Đã hết hạn!', color: '#d32f2f' };
    if (diffDays < 90) return { label: `Còn ${diffDays} ngày`, color: '#e65100' };
    if (diffDays < 180) return { label: `Còn ${diffDays} ngày`, color: '#f59e0b' };
    return null;
};

const getPriceWarning = (importPrice: number, macPrice?: number) =>
    !!(macPrice && macPrice > 0 && importPrice < macPrice * 0.9);

// ══════════════════════════════════════════════════════════════
// RECEIVE DIALOG — nhập SL thực nhận khi APPROVED
// ══════════════════════════════════════════════════════════════
const ReceiveDialog: React.FC<{
    open: boolean;
    order: PurchaseOrder | null;
    products: Map<string, ProductResponse>;
    onClose: () => void;
    onReceive: (items: Array<{ productId: string; receivedQty: number }>) => void;
    loading: boolean;
}> = ({ open, order, products, onClose, onReceive, loading }) => {
    const [qtys, setQtys] = useState<Record<string, number>>({});

    useEffect(() => {
        if (open && order) {
            const init: Record<string, number> = {};
            order.items.forEach(i => { init[i.id] = i.quantity; });
            setQtys(init);
        }
    }, [open, order]);

    const handleConfirm = () => {
        if (!order) return;
        onReceive(order.items.map(i => ({
            productId: i.productId,
            receivedQty: qtys[i.id] ?? i.quantity,
        })));
    };

    const hasShortage = order?.items.some(i => (qtys[i.id] ?? i.quantity) < i.quantity);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={800} fontSize={15}>Xác nhận nhận hàng</Typography>
                    <Typography variant="caption" color="text.secondary">Nhập số lượng thực nhận cho từng sản phẩm</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
                {hasShortage && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
                        Một số sản phẩm nhận ít hơn số đặt — tồn kho sẽ được cập nhật theo số lượng thực nhận.
                    </Alert>
                )}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>SL đặt</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>SL thực nhận</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Tình trạng</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {order?.items.map(item => {
                                const p = products.get(item.productId);
                                const receivedQty = qtys[item.id] ?? item.quantity;
                                const isShort = receivedQty < item.quantity;
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{p?.name || item.productId.slice(0, 8)}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight={700}>{item.quantity}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <TextField size="small" type="number"
                                                value={receivedQty}
                                                onChange={e => setQtys(prev => ({ ...prev, [item.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                                inputProps={{ min: 0, max: item.quantity, style: { width: 80, textAlign: 'center' } }}
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: isShort ? '#fff3e0' : '#f0fff4' } }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            {isShort
                                                ? <Chip label={`Thiếu ${item.quantity - receivedQty}`} size="small"
                                                    sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 700, height: 22, fontSize: 10 }} />
                                                : <Chip label="Đủ" size="small" icon={<CheckCircle sx={{ fontSize: 12 }} />}
                                                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, height: 22, fontSize: 10 }} />
                                            }
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                <Button onClick={handleConfirm} variant="contained" disabled={loading}
                    sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
                    {loading ? 'Đang xử lý...' : `Xác nhận nhận hàng${hasShortage ? ' (một phần)' : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// DETAIL DIALOG
// ══════════════════════════════════════════════════════════════
const PurchaseOrderDetailDialog: React.FC<{
    open: boolean;
    order: PurchaseOrder | null;
    onClose: () => void;
    onSubmit: () => void;
    onApprove: () => void;
    onReject: () => void;
    onReceive: () => void;
    onCancel: () => void;
    loading: boolean;
    isAdmin: boolean;
    currentUser: any;
}> = ({ open, order, onClose, onSubmit, onApprove, onReject, onReceive, onCancel, loading, isAdmin, currentUser }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Map<string, ProductResponse>>(new Map());
    const printRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            supplierService.getAllSimple().then(setSuppliers).catch(() => {});
            warehouseService.getAll().then(setWarehouses).catch(() => {});
            productService.search({ size: 1000, isActive: true })
                .then(res => {
                    const map = new Map<string, ProductResponse>();
                    res.content.forEach(p => map.set(p.id, p));
                    setProducts(map);
                }).catch(() => {});
        }
    }, [open]);

    const supplier = suppliers.find(s => s.id === order?.supplierId);
    const warehouse = warehouses.find(w => w.id === order?.warehouseId);
    const statusInfo = order ? STATUS_COLORS[order.status] : { label: '', color: '', bg: '' };
    const totalQty = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open('', '_blank', 'width=800,height=600');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><title>Phiếu nhập - ${order?.code}</title>
        <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:serif;font-size:13px;padding:20px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;font-size:12px}
        th{background:#f5f5f5;font-weight:bold;text-align:center}</style></head><body>
        ${content.innerHTML}<script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
        win.document.close();
    };

    const fmtDt = (d?: string) => d ? new Date(d).toLocaleString('vi-VN') : '—';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography fontWeight={800} fontSize={15}>Chi tiết: {order?.code}</Typography>
                    {order && <Chip label={statusInfo.label} size="small"
                        sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700, height: 22 }} />}
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ px: 3, pt: 2 }}>
                <Box ref={printRef}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography fontWeight={900} fontSize={18} color="#1a1a2e">PHIẾU NHẬP HÀNG</Typography>
                        <Typography variant="caption" color="#64748b">Số phiếu: {order?.code}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            {[
                                ['Nhà cung cấp', supplier?.name || order?.supplierId],
                                ['Kho nhập', warehouse?.name || order?.warehouseId],
                                ['Ngày tạo', fmtDt(order?.createdAt)],
                            ].map(([label, value]) => (
                                <Box key={label} sx={{ display: 'flex', mb: 0.75 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 130, color: '#475569' }}>{label}:</Typography>
                                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            {order?.approvedAt && (
                                <Box sx={{ display: 'flex', mb: 0.75 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 130, color: '#475569' }}>Duyệt lúc:</Typography>
                                    <Typography variant="body2">{fmtDt(order.approvedAt)}</Typography>
                                </Box>
                            )}
                            {order?.rejectionReason && (
                                <Box sx={{ p: 1.5, bgcolor: '#ffebee', borderRadius: 1.5, border: '1px solid #ffcdd2' }}>
                                    <Typography variant="caption" fontWeight={700} color="#d32f2f">Lý do từ chối:</Typography>
                                    <Typography variant="body2" color="#d32f2f" mt={0.5}>{order.rejectionReason}</Typography>
                                </Box>
                            )}
                            {order?.note && (
                                <Box sx={{ display: 'flex', mb: 0.75 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 130, color: '#475569' }}>Ghi chú:</Typography>
                                    <Typography variant="body2" color="#555">{order.note}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #d0d0d0', mb: 2, borderRadius: 1 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>Sản phẩm</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'center' }}>SL đặt</TableCell>
                                    {order?.status === 'COMPLETED' && (
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'center' }}>SL nhận</TableCell>
                                    )}
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'right' }}>Giá nhập</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 12, textAlign: 'right' }}>Thành tiền</TableCell>
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
                                                <Typography variant="body2" fontWeight={700}>{item.quantity}</Typography>
                                            </TableCell>
                                            {order?.status === 'COMPLETED' && (
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" fontWeight={700}
                                                        color={item.receivedQty < item.quantity ? '#e65100' : '#2e7d32'}>
                                                        {item.receivedQty}
                                                    </Typography>
                                                </TableCell>
                                            )}
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
                                <TableRow>
                                    <TableCell colSpan={order?.status === 'COMPLETED' ? 3 : 2} />
                                    <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>Tổng cộng</TableCell>
                                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#d32f2f', fontSize: 14 }}>
                                        {fmtCurrency(order?.totalAmount)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'wrap', borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={handlePrint} variant="contained" startIcon={<Print />}
                    sx={{ textTransform: 'none', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
                    In phiếu
                </Button>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>Đóng</Button>
                <Box sx={{ flex: 1 }} />

                {/* DRAFT: người tạo gửi duyệt / hủy */}
                {order?.status === 'DRAFT' && currentUser?.id === order?.createdByUserId && (
                    <>
                        <Button onClick={() => onSubmit()} variant="contained" disabled={loading} startIcon={<Send />}
                            sx={{ textTransform: 'none', bgcolor: '#f59e0b', color: '#fff', '&:hover': { bgcolor: '#d97706' } }}>
                            Gửi duyệt
                        </Button>
                        <Button onClick={() => onCancel()} variant="outlined" color="error" disabled={loading} sx={{ textTransform: 'none' }}>
                            Hủy phiếu
                        </Button>
                    </>
                )}

                {/* PENDING_APPROVAL: duyệt chéo (Manager tạo→Admin duyệt / Admin tạo→Manager kho duyệt) */}
                {order?.status === 'PENDING_APPROVAL' && (
                    <>
                        {order && canApproveOrder(order, currentUser) && (
                            <>
                                <Button onClick={() => onApprove()} variant="contained" disabled={loading} startIcon={<CheckCircle />}
                                    sx={{ textTransform: 'none', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
                                    Duyệt phiếu
                                </Button>
                                <Button onClick={() => onReject()} variant="contained" disabled={loading} startIcon={<ThumbDown />}
                                    sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
                                    Từ chối
                                </Button>
                            </>
                        )}
                        {!isAdmin && currentUser?.id === order?.createdByUserId && (
                            <Button onClick={() => onCancel()} variant="outlined" color="error" disabled={loading} sx={{ textTransform: 'none' }}>
                                Hủy phiếu
                            </Button>
                        )}
                    </>
                )}

                {/* APPROVED: chỉ Manager kho mới nhận hàng */}
                {order?.status === 'APPROVED' && !isAdmin && (
                    <Button onClick={() => onReceive()} variant="contained" disabled={loading} startIcon={<Inventory2 />}
                        sx={{ textTransform: 'none', bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}>
                        Nhận hàng
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// CREATE DIALOG
// ══════════════════════════════════════════════════════════════
const CreatePurchaseDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    warehouses: Warehouse[];
    suppliers: Supplier[];
    currentUser: any;
    isAdmin: boolean;
}> = ({ open, onClose, onCreated, warehouses, suppliers, currentUser, isAdmin }) => {
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [note, setNote] = useState('');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<ProductResponse[]>([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);
    const [supplierProducts, setSupplierProducts] = useState<ProductResponse[]>([]);
    const [loadingSupplierProducts, setLoadingSupplierProducts] = useState(false);
    const [inventoryMap, setInventoryMap] = useState<Map<string, Inventory>>(new Map());
    const [allProductsByBarcode, setAllProductsByBarcode] = useState<Map<string, ProductResponse>>(new Map());
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setSupplierId(''); setNote(''); setCartItems([]);
            setSearchKeyword(''); setSearchResults([]); setSupplierProducts([]);
            if (isAdmin) setWarehouseId('');
        } else if (!isAdmin && currentUser?.warehouseId) {
            setWarehouseId(String(currentUser.warehouseId));
        }
    }, [open, isAdmin, currentUser]);

    useEffect(() => {
        if (open) {
            productService.search({ size: 5000, isActive: true }).then(res => {
                const map = new Map<string, ProductResponse>();
                res.content.forEach(p => {
                    if (p.isbnBarcode) map.set(p.isbnBarcode.trim().toLowerCase(), p);
                    if (p.sku) map.set(p.sku.trim().toLowerCase(), p);
                });
                setAllProductsByBarcode(map);
            }).catch(() => {});
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
                .then(data => {
                    const map = new Map<string, Inventory>();
                    data.forEach(inv => map.set(inv.productId, inv));
                    setInventoryMap(map);
                }).catch(() => setInventoryMap(new Map()));
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

    const addToCart = (product: ProductResponse, qty = 1, forcePrice?: number) => {
        const inventory = inventoryMap.get(product.id);
        const currentStock = inventory?.quantity || 0;
        setCartItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                const newQty = existing.quantity + qty;
                return prev.map(i => i.productId === product.id
                    ? { ...i, quantity: newQty, subtotal: newQty * i.importPrice } : i);
            }
            const importPrice = forcePrice || product.wholesalePrice || product.macPrice || Math.round(product.retailPrice * 0.7) || 0;
            return [...prev, {
                productId: product.id, productName: product.name, isbnBarcode: product.isbnBarcode,
                quantity: qty, importPrice, subtotal: qty * importPrice,
                imageUrl: product.imageUrl, sku: product.sku, currentStock,
                macPrice: product.macPrice, showBatchFields: false,
            }];
        });
        setSearchKeyword(''); setSearchResults([]);
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        try {
            const XLSX = await import('xlsx');
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

            let matched = 0;
            const unmatched: string[] = [];

            for (const row of rows) {
                const vals = Object.values(row);
                const barcode = String(
                    row['Mã vạch'] ?? row['ISBN'] ?? row['Barcode'] ?? row['barcode'] ??
                    row['isbn'] ?? row['SKU'] ?? row['sku'] ?? vals[0] ?? ''
                ).trim();
                if (!barcode) continue;

                const qty = Math.max(1, parseInt(String(
                    row['Số lượng'] ?? row['SL'] ?? row['Quantity'] ?? vals[1] ?? '1'
                )) || 1);
                const price = parseFloat(String(
                    row['Giá nhập'] ?? row['Giá'] ?? row['Price'] ?? vals[2] ?? '0'
                ).replace(/[^0-9.]/g, '')) || 0;

                const product = allProductsByBarcode.get(barcode.toLowerCase());
                if (product) {
                    addToCart(product, qty, price || undefined);
                    matched++;
                } else {
                    unmatched.push(barcode);
                }
            }

            if (matched === 0 && unmatched.length === 0) {
                setSnack({ message: 'File Excel trống hoặc không đọc được dữ liệu.', severity: 'warning' });
            } else if (unmatched.length > 0) {
                setSnack({ message: `Đã thêm ${matched} SP. Không tìm thấy ${unmatched.length} mã: ${unmatched.slice(0, 3).join(', ')}${unmatched.length > 3 ? '...' : ''}`, severity: 'warning' });
            } else {
                setSnack({ message: `Đã nhập ${matched} sản phẩm từ Excel thành công!`, severity: 'success' });
            }
        } catch {
            setSnack({ message: 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng.', severity: 'error' });
        }
    };

    const downloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.aoa_to_sheet([
            ['Mã vạch (ISBN/Barcode/SKU)', 'Số lượng', 'Giá nhập (VNĐ)'],
            ['978-1234567890', 10, 50000],
            ['978-9876543210', 5, 120000],
        ]);
        ws['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 20 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Nhập kho');
        XLSX.writeFile(wb, 'template_nhap_kho.xlsx');
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
            setSnack({ message: 'Tạo phiếu nhập thành công! Vui lòng gửi duyệt khi sẵn sàng.', severity: 'success' });
            onCreated(); onClose();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Tạo phiếu nhập thất bại', severity: 'error' });
        } finally { setCreating(false); }
    };

    const warehouseName = warehouses.find(w => w.id === warehouseId)?.name;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
            PaperProps={{ sx: { borderRadius: 3, height: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>

            {/* ── Gradient Header ── */}
            <Box sx={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #1565c0 100%)', px: 3, pt: 2.5, pb: cartItems.length > 0 ? 1.5 : 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography fontWeight={800} fontSize={17} color="#fff">Tạo Phiếu Nhập Kho Mới</Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.72)">
                            Nhập hàng từ Nhà cung cấp · NHÁP → Gửi duyệt → Duyệt → Nhận hàng
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: '#fff', mt: -0.5 }}><Close sx={{ fontSize: 18 }} /></IconButton>
                </Box>
                {cartItems.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 1.75 }}>
                        {[
                            { label: 'Mặt hàng', val: cartItems.length, color: '#fff' },
                            { label: 'Tổng SL', val: totalQty, color: '#bfdbfe' },
                            { label: 'Tổng tiền', val: fmtCurrency(totalAmount), color: '#fde68a' },
                        ].map(s => (
                            <Box key={s.label} sx={{ textAlign: 'center', px: 2, py: 0.75, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 1.5 }}>
                                <Typography variant="caption" color="rgba(255,255,255,0.6)" display="block" fontSize={10}>{s.label}</Typography>
                                <Typography fontWeight={800} color={s.color} fontSize={15}>{s.val}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* ── Toolbar ── */}
            <Box sx={{ px: 3, py: 2, bgcolor: '#fafbfc', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: supplierId ? 2 : 0 }}>
                    {/* Supplier */}
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="caption" fontWeight={700} color="#64748b" display="block" mb={0.75}
                            fontSize={10} textTransform="uppercase" letterSpacing={0.5}>Nhà cung cấp *</Typography>
                        <FormControl fullWidth size="small">
                            <Select value={supplierId} onChange={e => setSupplierId(e.target.value)} displayEmpty
                                sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                <MenuItem value="">-- Chọn Nhà cung cấp --</MenuItem>
                                {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Warehouse */}
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="caption" fontWeight={700} color="#64748b" display="block" mb={0.75}
                            fontSize={10} textTransform="uppercase" letterSpacing={0.5}>Kho nhập *</Typography>
                        {isAdmin ? (
                            <FormControl fullWidth size="small">
                                <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty
                                    sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                    <MenuItem value="">-- Chọn kho --</MenuItem>
                                    {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25,
                                bgcolor: '#e8f5e9', borderRadius: 1.5, border: '1px solid #a5d6a7' }}>
                                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#4caf50', flexShrink: 0 }} />
                                <Box>
                                    <Typography variant="body2" fontWeight={700} color="#1b5e20" fontSize={13}>{warehouseName || '—'}</Typography>
                                    <Typography variant="caption" color="#388e3c" fontSize={10}>Kho của bạn · không thể thay đổi</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Search + Excel buttons — chỉ hiện khi đã chọn NCC */}
                {supplierId && (
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 280, position: 'relative' }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" display="block" mb={0.75}
                                fontSize={10} textTransform="uppercase" letterSpacing={0.5}>Tìm & thêm sản phẩm</Typography>
                            <TextField fullWidth size="small" placeholder="Tìm theo tên, ISBN, SKU..."
                                value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
                                sx={{ bgcolor: '#fff' }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment>,
                                    endAdornment: searching && <CircularProgress size={16} />,
                                    sx: { borderRadius: 1.5 }
                                }} />
                            {searchResults.length > 0 && (
                                <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                                    maxHeight: 220, overflowY: 'auto', borderRadius: 1.5, mt: 0.5 }}>
                                    {searchResults.map(product => (
                                        <Box key={product.id} onClick={() => addToCart(product)} sx={{
                                            px: 2, py: 1.25, cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            '&:hover': { bgcolor: '#f0f7ff' },
                                        }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600} fontSize={13}>{product.name}</Typography>
                                                <Typography variant="caption" color="#888" fontFamily="monospace">{product.isbnBarcode}</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={700} color="#1976d2">{fmtCurrency(product.retailPrice)}</Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            )}
                        </Box>

                        {/* Excel buttons */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', pb: 0 }}>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx,.xls,.csv"
                                onChange={handleExcelUpload} />
                            <Tooltip title="Nhập danh sách sản phẩm từ file Excel (.xlsx) — cột: Mã vạch, Số lượng, Giá nhập">
                                <Button variant="contained" size="small" onClick={() => fileInputRef.current?.click()}
                                    startIcon={<FileUploadOutlined sx={{ fontSize: 16 }} />}
                                    sx={{ textTransform: 'none', borderRadius: 1.5, bgcolor: '#16a34a',
                                        '&:hover': { bgcolor: '#15803d' }, whiteSpace: 'nowrap', height: 36 }}>
                                    Nhập Excel
                                </Button>
                            </Tooltip>
                            <Tooltip title="Tải file mẫu Excel (Mã vạch, Số lượng, Giá nhập)">
                                <Button variant="outlined" size="small" onClick={downloadTemplate}
                                    startIcon={<FileDownloadOutlined sx={{ fontSize: 16 }} />}
                                    sx={{ textTransform: 'none', borderRadius: 1.5, whiteSpace: 'nowrap', height: 36 }}>
                                    Tải mẫu
                                </Button>
                            </Tooltip>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* ── Content ── */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pt: 2 }}>
                {!supplierId ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                        <Business sx={{ fontSize: 64, color: '#e0e0e0', mb: 1.5 }} />
                        <Typography color="#bbb" fontSize={14}>Chọn Nhà cung cấp để bắt đầu tạo phiếu</Typography>
                    </Box>
                ) : (
                    <>
                        {/* Supplier products */}
                        {loadingSupplierProducts ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
                        ) : supplierProducts.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="#64748b" fontSize={10}
                                    textTransform="uppercase" letterSpacing={0.5}>
                                    Sản phẩm của NCC này ({supplierProducts.length})
                                </Typography>
                                <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, mt: 0.75, maxHeight: 190, overflowY: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                {['Sản phẩm', 'Mã vạch', 'Giá bán', ''].map(c => (
                                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1 }}>{c}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {supplierProducts.map(product => (
                                                <TableRow key={product.id} hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {product.imageUrl && (
                                                                <Box component="img" src={product.imageUrl} alt={product.name}
                                                                    sx={{ width: 28, height: 36, objectFit: 'contain', borderRadius: 0.5 }} />
                                                            )}
                                                            <Typography variant="body2" fontWeight={600} fontSize={12.5}>{product.name}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell><Typography variant="caption" fontFamily="monospace" color="#888">{product.isbnBarcode}</Typography></TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={700} color="#1976d2" fontSize={12}>{fmtCurrency(product.retailPrice)}</Typography></TableCell>
                                                    <TableCell align="center">
                                                        <Button size="small" variant="outlined" onClick={() => addToCart(product)}
                                                            disabled={cartItems.some(i => i.productId === product.id)}
                                                            sx={{ textTransform: 'none', fontSize: 11, borderRadius: 1, minWidth: 70, py: 0.25 }}>
                                                            {cartItems.some(i => i.productId === product.id) ? '✓ Đã thêm' : '+ Thêm'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Paper>
                            </Box>
                        )}

                        {/* Cart */}
                        {cartItems.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" fontWeight={700} color="#64748b" fontSize={10}
                                        textTransform="uppercase" letterSpacing={0.5}>
                                        Danh sách hàng nhập ({cartItems.length} SP · SL: {totalQty})
                                    </Typography>
                                    <Typography variant="body2" fontWeight={800} color="#d32f2f">{fmtCurrency(totalAmount)}</Typography>
                                </Box>
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {['Sản phẩm', 'Số lượng', 'Giá nhập', 'Thành tiền', 'Lô/HSD', ''].map(c => (
                                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, bgcolor: '#f1f5f9',
                                                        color: '#64748b', borderBottom: '2px solid #e2e8f0', py: 1.25 }}>{c}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {cartItems.map(item => {
                                                const priceWarn = getPriceWarning(item.importPrice, item.macPrice);
                                                const expiryWarn = getExpiryWarning(item.expiryDate);
                                                return (
                                                    <React.Fragment key={item.productId}>
                                                        <TableRow sx={{ bgcolor: priceWarn ? '#fff8f0' : 'inherit', '&:hover': { bgcolor: '#f8faff' } }}>
                                                            <TableCell sx={{ py: 1.25, minWidth: 170 }}>
                                                                <Typography variant="body2" fontWeight={600} fontSize={13}>{item.productName}</Typography>
                                                                {item.currentStock !== undefined && (
                                                                    <Typography variant="caption" display="block"
                                                                        color={item.currentStock === 0 ? '#d32f2f' : '#888'}>
                                                                        Tồn kho: {item.currentStock}
                                                                    </Typography>
                                                                )}
                                                                {priceWarn && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <Warning sx={{ fontSize: 11, color: '#e65100' }} />
                                                                        <Typography variant="caption" color="#e65100" fontSize={10}>Giá thấp hơn MAC</Typography>
                                                                    </Box>
                                                                )}
                                                            </TableCell>
                                                            <TableCell sx={{ minWidth: 110 }}>
                                                                <TextField size="small" type="number" value={item.quantity}
                                                                    onChange={e => updateField(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                                                                    inputProps={{ min: 1, style: { width: 80, textAlign: 'center' } }}
                                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                                            </TableCell>
                                                            <TableCell sx={{ minWidth: 140 }} align="right">
                                                                <TextField size="small" type="number" value={item.importPrice}
                                                                    onChange={e => updateField(item.productId, 'importPrice', parseInt(e.target.value) || 0)}
                                                                    inputProps={{ min: 0, style: { width: 100, textAlign: 'right' } }}
                                                                    InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment>, sx: { borderRadius: 1.5 } }} />
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Typography variant="body2" fontWeight={700} color="#1565c0">{fmtCurrency(item.subtotal)}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button size="small" variant="text"
                                                                    startIcon={item.showBatchFields ? <ExpandLess sx={{ fontSize: 14 }} /> : <QrCode sx={{ fontSize: 14 }} />}
                                                                    onClick={() => updateField(item.productId, 'showBatchFields', !item.showBatchFields)}
                                                                    sx={{ textTransform: 'none', fontSize: 11, borderRadius: 1,
                                                                        color: item.batchNumber || item.expiryDate ? '#1976d2' : '#888' }}>
                                                                    {item.showBatchFields ? 'Ẩn' : 'Lô/HSD'}
                                                                </Button>
                                                                {expiryWarn && (
                                                                    <Typography variant="caption" display="block" color={expiryWarn.color} fontSize={10}>{expiryWarn.label}</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <IconButton size="small" onClick={() => removeFromCart(item.productId)}
                                                                    sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                                    <Delete sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                                                <Collapse in={item.showBatchFields} unmountOnExit>
                                                                    <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, flexWrap: 'wrap',
                                                                        bgcolor: '#f0f7ff', borderBottom: '1px solid #e3f2fd' }}>
                                                                        {[
                                                                            { label: 'Số lô (Batch)', field: 'batchNumber', placeholder: 'LOT-2024-001' },
                                                                            { label: 'Mã lô (Lot)', field: 'lotNumber', placeholder: 'L240815' },
                                                                        ].map(({ label, field, placeholder }) => (
                                                                            <Box key={field} sx={{ flex: 1, minWidth: 140 }}>
                                                                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>{label}</Typography>
                                                                                <TextField size="small" fullWidth placeholder={placeholder}
                                                                                    value={(item as any)[field] || ''}
                                                                                    onChange={e => updateField(item.productId, field as keyof CartItem, e.target.value)}
                                                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                                                            </Box>
                                                                        ))}
                                                                        <Box sx={{ flex: 1, minWidth: 150 }}>
                                                                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>Ngày sản xuất</Typography>
                                                                            <TextField size="small" fullWidth type="date"
                                                                                value={item.manufacturingDate || ''}
                                                                                onChange={e => updateField(item.productId, 'manufacturingDate', e.target.value)}
                                                                                inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                                                        </Box>
                                                                        <Box sx={{ flex: 1, minWidth: 150 }}>
                                                                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>Hạn sử dụng</Typography>
                                                                            <TextField size="small" fullWidth type="date"
                                                                                value={item.expiryDate || ''}
                                                                                onChange={e => updateField(item.productId, 'expiryDate', e.target.value)}
                                                                                inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                                                                                error={!!getExpiryWarning(item.expiryDate)}
                                                                                helperText={getExpiryWarning(item.expiryDate)?.label}
                                                                                FormHelperTextProps={{ sx: { color: getExpiryWarning(item.expiryDate)?.color } }}
                                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
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
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* ── Footer ── */}
            <Box sx={{ px: 3, py: 2, bgcolor: '#fafbfc', borderTop: '1px solid #e2e8f0' }}>
                <TextField fullWidth size="small" multiline rows={2}
                    placeholder="Ghi chú cho phiếu nhập kho (không bắt buộc)..."
                    value={note} onChange={e => setNote(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1.5, textTransform: 'none' }}>Đóng</Button>
                    <Button onClick={handleCreate} variant="contained"
                        disabled={creating || !supplierId || !warehouseId || cartItems.length === 0}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, minWidth: 200,
                            bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}>
                        {creating
                            ? <><CircularProgress size={15} sx={{ color: '#fff', mr: 1 }} />Đang tạo...</>
                            : `Tạo phiếu nháp (${cartItems.length} SP)`}
                    </Button>
                </Box>
            </Box>

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert> : <div />}
            </Snackbar>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const ImportPage: React.FC = () => {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [products, setProducts] = useState<Map<string, ProductResponse>>(new Map());
    const PAGE_SIZE = 15;

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

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

    useEffect(() => {
        productService.search({ size: 1000, isActive: true })
            .then(res => {
                const map = new Map<string, ProductResponse>();
                res.content.forEach(p => map.set(p.id, p));
                setProducts(map);
            }).catch(() => {});
    }, []);

    const handleSubmit = async (orderId?: string) => {
        const id = orderId ?? selectedOrder?.id;
        if (!id) return;
        setActionLoading(true);
        try {
            await purchaseService.submit(id);
            setSnack({ message: 'Đã gửi phiếu để duyệt!', severity: 'success' });
            setDetailOpen(false); refetchOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Gửi duyệt thất bại', severity: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleApprove = async (orderId?: string) => {
        const id = orderId ?? selectedOrder?.id;
        if (!id) return;
        setActionLoading(true);
        try {
            await purchaseService.approve(id);
            setSnack({ message: 'Duyệt phiếu nhập thành công!', severity: 'success' });
            setDetailOpen(false); refetchOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Duyệt thất bại', severity: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleRejectConfirm = async () => {
        if (!selectedOrder || !rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await purchaseService.reject(selectedOrder.id, rejectReason);
            setSnack({ message: 'Đã từ chối phiếu nhập.', severity: 'success' });
            setRejectOpen(false); setRejectReason(''); setDetailOpen(false); refetchOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Thất bại', severity: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleReceive = async (items: Array<{ productId: string; receivedQty: number }>) => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await purchaseService.receive(selectedOrder.id, items);
            setSnack({ message: 'Nhận hàng và nhập kho thành công!', severity: 'success' });
            setReceiveOpen(false); setDetailOpen(false); refetchOrders();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || 'Thất bại', severity: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleCancel = async () => {
        if (!selectedOrder || !cancelReason.trim()) return;
        setActionLoading(true);
        try {
            await purchaseService.cancel(selectedOrder.id, cancelReason);
            setSnack({ message: 'Đã hủy phiếu nhập kho.', severity: 'success' });
            setCancelOpen(false); setCancelReason(''); setDetailOpen(false); refetchOrders();
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
                    <Typography variant="body2" color="text.secondary" fontSize={12}>Quản lý nhập hàng từ Nhà cung cấp · Quy trình duyệt 2 bước</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    Tạo phiếu nhập
                </Button>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="DRAFT">Nháp</MenuItem>
                            <MenuItem value="PENDING_APPROVAL">Chờ duyệt</MenuItem>
                            <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                            <MenuItem value="REJECTED">Bị từ chối</MenuItem>
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
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#999' }}>Chưa có phiếu nhập kho nào</TableCell></TableRow>
                            ) : orders.map(order => {
                                const statusInfo = STATUS_COLORS[order.status];
                                const supplier = supplierMap.get(order.supplierId);
                                const warehouse = warehouseMap.get(order.warehouseId);
                                const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                                return (
                                    <TableRow key={order.id} hover sx={{ cursor: 'pointer' }}
                                        onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}>
                                        <TableCell><Typography fontWeight={600} fontFamily="monospace" fontSize={12}>{order.code}</Typography></TableCell>
                                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Business sx={{ fontSize: 14, color: '#888' }} /><Typography variant="body2" fontSize={12}>{supplier?.name || order.supplierId.slice(0, 8)}</Typography></Box></TableCell>
                                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocalShipping sx={{ fontSize: 14, color: '#888' }} /><Typography variant="body2" fontSize={12}>{warehouse?.name || order.warehouseId.slice(0, 8)}</Typography></Box></TableCell>
                                        <TableCell><Typography fontWeight={700}>{totalQty}</Typography></TableCell>
                                        <TableCell><Typography fontWeight={700} color="#1976d2" fontSize={12}>{fmtCurrency(order.totalAmount)}</Typography></TableCell>
                                        <TableCell>
                                            <Chip label={statusInfo.label} size="small"
                                                sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700, height: 22, fontSize: 10 }} />
                                        </TableCell>
                                        <TableCell><Typography variant="caption" fontFamily="monospace" fontSize={11}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}</Typography></TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Chi tiết">
                                                    <IconButton size="small" onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                                                        sx={{ color: '#3b82f6', '&:hover': { bgcolor: '#eff6ff' } }}>
                                                        <Visibility sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {order.status === 'DRAFT' && currentUser?.id === order.createdByUserId && (
                                                    <Tooltip title="Gửi duyệt">
                                                        <IconButton size="small" onClick={() => { setSelectedOrder(order); handleSubmit(order.id); }}
                                                            sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fffbeb' } }}>
                                                            <Send sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {order.status === 'PENDING_APPROVAL' && canApproveOrder(order, currentUser) && (
                                                    <Tooltip title="Duyệt">
                                                        <IconButton size="small" onClick={() => { setSelectedOrder(order); handleApprove(order.id); }}
                                                            sx={{ color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                            <CheckCircle sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {order.status === 'APPROVED' && !isAdmin && (
                                                    <Tooltip title="Nhận hàng">
                                                        <IconButton size="small" onClick={() => { setSelectedOrder(order); setReceiveOpen(true); }}
                                                            sx={{ color: '#1565c0', '&:hover': { bgcolor: '#e3f2fd' } }}>
                                                            <Inventory2 sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {(order.status === 'DRAFT' || order.status === 'PENDING_APPROVAL') && !isAdmin && currentUser?.id === order.createdByUserId && (
                                                    <Tooltip title="Hủy">
                                                        <IconButton size="small" onClick={() => { setSelectedOrder(order); setCancelOpen(true); }}
                                                            sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                                                            <Cancel sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
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

            {/* Detail Dialog */}
            <PurchaseOrderDetailDialog
                open={detailOpen} order={selectedOrder} onClose={() => setDetailOpen(false)}
                onSubmit={handleSubmit} onApprove={handleApprove}
                onReject={() => setRejectOpen(true)} onReceive={() => setReceiveOpen(true)}
                onCancel={() => setCancelOpen(true)} loading={actionLoading} isAdmin={isAdmin}
                currentUser={currentUser} />

            {/* Receive Dialog */}
            <ReceiveDialog open={receiveOpen} order={selectedOrder} products={products}
                onClose={() => setReceiveOpen(false)} onReceive={handleReceive} loading={actionLoading} />

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Từ chối phiếu nhập kho</DialogTitle>
                <DialogContent>
                    <TextField fullWidth multiline rows={3} label="Lý do từ chối *" value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)} margin="normal"
                        error={rejectReason.trim().length === 0}
                        helperText={rejectReason.trim().length === 0 ? 'Vui lòng nhập lý do' : ''} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectOpen(false)}>Đóng</Button>
                    <Button onClick={handleRejectConfirm} variant="contained" color="error"
                        disabled={!rejectReason.trim() || actionLoading}>Xác nhận từ chối</Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Hủy phiếu nhập kho</DialogTitle>
                <DialogContent>
                    <TextField fullWidth multiline rows={3} label="Lý do hủy *" value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)} margin="normal" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelOpen(false)}>Đóng</Button>
                    <Button onClick={handleCancel} variant="contained" color="error"
                        disabled={!cancelReason.trim() || actionLoading}>Xác nhận hủy</Button>
                </DialogActions>
            </Dialog>

            {/* Create Dialog */}
            <CreatePurchaseDialog open={createOpen} onClose={() => setCreateOpen(false)}
                onCreated={() => refetchOrders()} warehouses={warehouses} suppliers={suppliers}
                currentUser={currentUser} isAdmin={isAdmin} />

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
};

export default ImportPage;
