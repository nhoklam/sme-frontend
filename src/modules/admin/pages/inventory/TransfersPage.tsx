import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, InputAdornment,
    Chip, IconButton, Select, MenuItem, FormControl, Snackbar, Alert,
    Skeleton, Pagination, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Grid, CircularProgress,
} from '@mui/material';
import {
    Search, Add, Refresh, Visibility, Close,
    Delete, LocalShipping, ArrowForward, FileDownloadOutlined,
} from '@mui/icons-material';
import { transferService } from '../../../../services/transferService';
import warehouseService from '../../../../services/warehouseService';
import productService from '../../../../services/productService';
import inventoryService from '../../../../services/inventoryService';
import { exportToExcel } from '../../../../utils/excelExport';
import {
    InternalTransfer, TransferStatus, Warehouse,
    ProductResponse, Inventory, TransferCartItem,
} from '../../../../types';

// ── helpers ────────────────────────────────────────────────────
const STATUS_MAP: Record<TransferStatus, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Nháp', color: '#888', bg: '#f5f5f5' },
    DISPATCHED: { label: 'Đã xuất', color: '#e65100', bg: '#fff3e0' },
    RECEIVED: { label: 'Đã nhận', color: '#2e7d32', bg: '#e8f5e9' },
    CANCELLED: { label: 'Đã hủy', color: '#d32f2f', bg: '#ffebee' },
};

// ══════════════════════════════════════════════════════════════
// DETAIL DIALOG
// ══════════════════════════════════════════════════════════════
const TransferDetailDialog: React.FC<{
    open: boolean;
    transfer: InternalTransfer | null;
    warehouses: Warehouse[];
    products: Map<string, ProductResponse>;
    onClose: () => void;
    onDispatch: () => void;
    onReceive: () => void;
    loading: boolean;
}> = ({ open, transfer, warehouses, products, onClose, onDispatch, onReceive, loading }) => {
    const fromWh = warehouses.find(w => w.id === transfer?.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === transfer?.toWarehouseId);
    const info = transfer ? STATUS_MAP[transfer.status] : { label: '', color: '', bg: '' };
    const totalQty = transfer?.items.reduce((s, i) => s + i.quantity, 0) || 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography fontWeight={800} fontSize={16}>Chi tiết phiếu chuyển</Typography>
                        <Typography variant="caption" fontFamily="monospace" color="#1976d2">{transfer?.code}</Typography>
                        {transfer && <Chip label={info.label} size="small" sx={{ bgcolor: info.bg, color: info.color, fontWeight: 700, height: 22 }} />}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Ngày tạo: {transfer?.createdAt ? new Date(transfer.createdAt).toLocaleString('vi-VN') : '—'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />

            <DialogContent sx={{ px: 3, pt: 2 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff3e0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <LocalShipping sx={{ fontSize: 16, color: '#e65100' }} />
                                <Typography variant="caption" fontWeight={700}>KHO XUẤT</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{fromWh?.name || transfer?.fromWarehouseId}</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#e8f5e9' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ArrowForward sx={{ fontSize: 16, color: '#2e7d32' }} />
                                <Typography variant="caption" fontWeight={700}>KHO NHẬP</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{toWh?.name || transfer?.toWarehouseId}</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Box><Typography variant="caption" color="text.secondary">Mặt hàng</Typography><Typography fontWeight={700}>{transfer?.items.length || 0}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">Tổng số lượng</Typography><Typography fontWeight={700}>{totalQty.toLocaleString()}</Typography></Box>
                </Box>

                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                            {['Sản phẩm', 'Mã vạch', 'SL gửi', 'SL nhận'].map(c => (
                                <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transfer?.items.map((item, idx) => {
                            const p = products.get(item.productId);
                            return (
                                <TableRow key={item.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <TableCell sx={{ py: 1.25 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {p?.imageUrl && <Box component="img" src={p.imageUrl} alt={p.name} sx={{ width: 36, height: 48, objectFit: 'contain', borderRadius: 1 }} />}
                                            <Typography variant="body2" fontWeight={600}>{p?.name || item.productId.slice(0, 8)}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell><Typography variant="caption" fontFamily="monospace" color="#888">{p?.isbnBarcode || '—'}</Typography></TableCell>
                                    <TableCell><Typography fontWeight={700}>{item.quantity}</Typography></TableCell>
                                    <TableCell><Typography fontWeight={700} color="#2e7d32">{item.receivedQty || 0}</Typography></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {transfer?.note && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="caption" fontWeight={700}>Ghi chú:</Typography>
                        <Typography variant="body2" color="#555" mt={0.5}>{transfer.note}</Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                {transfer?.status === 'DRAFT' && (
                    <Button onClick={onDispatch} variant="contained" disabled={loading} sx={{ bgcolor: '#e65100' }}>
                        {loading ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
                    </Button>
                )}
                {transfer?.status === 'DISPATCHED' && (
                    <Button onClick={onReceive} variant="contained" disabled={loading} sx={{ bgcolor: '#2e7d32' }}>
                        {loading ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// CREATE DIALOG
// ══════════════════════════════════════════════════════════════
const CreateTransferDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    warehouses: Warehouse[];
}> = ({ open, onClose, onCreated, warehouses }) => {
    const [fromWid, setFromWid] = useState('');
    const [toWid, setToWid] = useState('');
    const [note, setNote] = useState('');
    const [cart, setCart] = useState<TransferCartItem[]>([]);
    const [kw, setKw] = useState('');
    const [results, setResults] = useState<ProductResponse[]>([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const [invMap, setInvMap] = useState<Map<string, Inventory>>(new Map());
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

    useEffect(() => { if (!open) { setFromWid(''); setToWid(''); setNote(''); setCart([]); setKw(''); setResults([]); } }, [open]);
    useEffect(() => {
        if (fromWid && open) inventoryService.getByWarehouse(fromWid).then(d => { const m = new Map<string, Inventory>(); d.forEach(i => m.set(i.productId, i)); setInvMap(m); }).catch(() => setInvMap(new Map()));
        else setInvMap(new Map());
    }, [fromWid, open]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (kw.trim().length >= 2 && fromWid && open) {
                setSearching(true);
                productService.search({ keyword: kw, size: 10, isActive: true })
                    .then(r => setResults(r.content.filter(p => !cart.some(c => c.productId === p.id) && (invMap.get(p.id)?.availableQuantity || 0) > 0)))
                    .catch(() => setResults([]))
                    .finally(() => setSearching(false));
            } else { setResults([]); }
        }, 400);
        return () => clearTimeout(t);
    }, [kw, fromWid, open, cart, invMap]);

    const addProduct = (p: ProductResponse) => {
        const inv = invMap.get(p.id);
        const available = inv?.availableQuantity || 0;
        setCart(prev => {
            const ex = prev.find(i => i.productId === p.id);
            if (ex) return prev.map(i => i.productId === p.id ? { ...i, quantity: Math.min(i.quantity + 1, i.availableStock) } : i);
            return [...prev, { productId: p.id, productName: p.name, isbnBarcode: p.isbnBarcode, sku: p.sku, quantity: 1, availableStock: available, imageUrl: p.imageUrl }];
        });
        setKw(''); setResults([]);
    };

    const updateQty = (id: string, qty: number) => {
        const item = cart.find(i => i.productId === id);
        if (!item) return;
        setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: Math.min(Math.max(1, qty), i.availableStock) } : i));
    };

    const handleCreate = async () => {
        if (!fromWid) { setSnack({ msg: 'Vui lòng chọn kho xuất', sev: 'error' }); return; }
        if (!toWid) { setSnack({ msg: 'Vui lòng chọn kho nhập', sev: 'error' }); return; }
        if (fromWid === toWid) { setSnack({ msg: 'Kho xuất và kho nhập phải khác nhau', sev: 'error' }); return; }
        if (!cart.length) { setSnack({ msg: 'Vui lòng thêm sản phẩm', sev: 'error' }); return; }
        setCreating(true);
        try {
            await transferService.create({ fromWarehouseId: fromWid, toWarehouseId: toWid, items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })), note: note || undefined });
            setSnack({ msg: 'Tạo phiếu chuyển kho thành công!', sev: 'success' });
            onCreated(); onClose();
        } catch (e: any) { setSnack({ msg: e.response?.data?.message || 'Tạo phiếu chuyển thất bại', sev: 'error' }); }
        finally { setCreating(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2.5, height: '85vh' } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography fontWeight={800} fontSize={16}>Tạo Phiếu Chuyển Kho</Typography>
                    <Typography variant="caption" color="text.secondary">Điều chuyển hàng hóa giữa các chi nhánh</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />
            <DialogContent sx={{ px: 3, pt: 2 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700}>Kho xuất <span style={{ color: '#d32f2f' }}>*</span></Typography>
                        <FormControl fullWidth size="small">
                            <Select value={fromWid} onChange={e => setFromWid(e.target.value)} displayEmpty>
                                <MenuItem value="">-- Chọn kho xuất --</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700}>Kho nhập <span style={{ color: '#d32f2f' }}>*</span></Typography>
                        <FormControl fullWidth size="small">
                            <Select value={toWid} onChange={e => setToWid(e.target.value)} displayEmpty>
                                <MenuItem value="">-- Chọn kho nhập --</MenuItem>
                                {warehouses.filter(w => w.isActive && w.id !== fromWid).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {!fromWid ? (
                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 1.5, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Vui lòng chọn kho xuất để tìm sản phẩm.</Typography>
                    </Box>
                ) : (
                    <>
                        <TextField fullWidth size="small" placeholder="Tìm sản phẩm theo tên, ISBN, SKU..."
                            value={kw} onChange={e => setKw(e.target.value)} sx={{ mb: 1.5 }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment>, endAdornment: searching && <CircularProgress size={20} /> }} />
                        {results.length > 0 && (
                            <Paper elevation={2} sx={{ mb: 2, maxHeight: 200, overflowY: 'auto', borderRadius: 1.5 }}>
                                {results.map(p => {
                                    const av = invMap.get(p.id)?.availableQuantity || 0;
                                    return (
                                        <Box key={p.id} onClick={() => addProduct(p)} sx={{ px: 2, py: 1.25, cursor: 'pointer', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', '&:hover': { bgcolor: '#f5f9ff' } }}>
                                            <Box>
                                                <Typography fontWeight={600} fontSize={13}>{p.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.sku} · Tồn: <strong>{av}</strong></Typography>
                                            </Box>
                                            <Button size="small" variant="outlined">Thêm</Button>
                                        </Box>
                                    );
                                })}
                            </Paper>
                        )}
                    </>
                )}

                {cart.length > 0 && (
                    <>
                        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Sản phẩm đã chọn ({cart.length})</Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', mb: 2, maxHeight: 300, overflowY: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        {['Sản phẩm', 'Mã vạch', 'Tồn kho', 'Số lượng', ''].map(c => (
                                            <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cart.map(item => (
                                        <TableRow key={item.productId}>
                                            <TableCell><Typography fontWeight={600} fontSize={13}>{item.productName}</Typography></TableCell>
                                            <TableCell><Typography variant="caption" fontFamily="monospace" color="#888">{item.isbnBarcode || '—'}</Typography></TableCell>
                                            <TableCell><Typography fontWeight={700} color={item.availableStock === 0 ? '#d32f2f' : '#2e7d32'}>{item.availableStock}</Typography></TableCell>
                                            <TableCell>
                                                <TextField size="small" type="number" value={item.quantity}
                                                    onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                                                    inputProps={{ min: 1, max: item.availableStock, style: { width: 70, textAlign: 'center' } }} />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))}>
                                                    <Delete sx={{ color: '#d32f2f', fontSize: 18 }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Typography variant="body2" fontWeight={700}>
                                Tổng số lượng: <strong>{cart.reduce((s, i) => s + i.quantity, 0)}</strong>
                            </Typography>
                        </Box>
                    </>
                )}

                <Typography variant="caption" fontWeight={700}>Ghi chú</Typography>
                <TextField fullWidth size="small" multiline rows={2} placeholder="Ghi chú cho phiếu chuyển..."
                    value={note} onChange={e => setNote(e.target.value)} />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                <Button onClick={handleCreate} variant="contained" disabled={creating || !fromWid || !toWid || !cart.length} sx={{ bgcolor: '#1976d2' }}>
                    {creating ? 'Đang tạo...' : 'Tạo phiếu chuyển'}
                </Button>
            </DialogActions>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)}>{snack.msg}</Alert> : <div />}
            </Snackbar>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const TransfersPage: React.FC = () => {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [keyword, setKeyword] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<InternalTransfer | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
    const PAGE_SIZE = 15;

    const qc = useQueryClient();

    const { data: transfers, isLoading } = useQuery({
        queryKey: ['transfers', page, statusFilter, keyword],
        queryFn: () => transferService.getAll({ page, size: PAGE_SIZE, status: statusFilter || undefined, keyword: keyword || undefined }),
    });

    const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: warehouseService.getAll });

    const { data: productsData = [] } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productService.search({ size: 1000, isActive: true }).then(r => r.content),
    });

    const productMap = React.useMemo(() => {
        const m = new Map<string, ProductResponse>();
        productsData.forEach(p => m.set(p.id, p));
        return m;
    }, [productsData]);

    const warehouseMap = React.useMemo(() => {
        const m = new Map<string, Warehouse>();
        warehouses.forEach(w => m.set(w.id, w));
        return m;
    }, [warehouses]);

    const refresh = () => qc.invalidateQueries({ queryKey: ['transfers'] });

    const handleDispatch = async () => {
        if (!selected) return;
        setActionLoading(true);
        try { await transferService.dispatch(selected.id); setSnack({ msg: 'Xác nhận xuất kho thành công!', sev: 'success' }); setDetailOpen(false); refresh(); }
        catch (e: any) { setSnack({ msg: e.response?.data?.message || 'Thất bại', sev: 'error' }); }
        finally { setActionLoading(false); }
    };

    const handleReceive = async () => {
        if (!selected) return;
        setActionLoading(true);
        try { await transferService.receive(selected.id); setSnack({ msg: 'Xác nhận nhận hàng thành công!', sev: 'success' }); setDetailOpen(false); refresh(); }
        catch (e: any) { setSnack({ msg: e.response?.data?.message || 'Thất bại', sev: 'error' }); }
        finally { setActionLoading(false); }
    };

    // ── Excel export ────────────────────────────────────────────
    const handleExport = async () => {
        try {
            const all = await transferService.getAll({ page: 0, size: 9999, status: statusFilter || undefined, keyword: keyword || undefined });
            const rows = (all.content ?? []).map(t => ({
                code: t.code,
                fromWarehouse: warehouseMap.get(t.fromWarehouseId)?.name ?? t.fromWarehouseId,
                toWarehouse: warehouseMap.get(t.toWarehouseId)?.name ?? t.toWarehouseId,
                status: STATUS_MAP[t.status]?.label ?? t.status,
                itemCount: t.items.length,
                totalQty: t.items.reduce((s, i) => s + i.quantity, 0),
                createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '',
                dispatchedAt: t.dispatchedAt ? new Date(t.dispatchedAt).toLocaleString('vi-VN') : '',
                receivedAt: t.receivedAt ? new Date(t.receivedAt).toLocaleString('vi-VN') : '',
                note: t.note ?? '',
            }));
            exportToExcel(rows, [
                { header: 'Mã phiếu', key: 'code', width: 20 },
                { header: 'Kho xuất', key: 'fromWarehouse', width: 28 },
                { header: 'Kho nhập', key: 'toWarehouse', width: 28 },
                { header: 'Trạng thái', key: 'status', width: 14 },
                { header: 'Số mặt hàng', key: 'itemCount', width: 14 },
                { header: 'Tổng số lượng', key: 'totalQty', width: 14 },
                { header: 'Ngày tạo', key: 'createdAt', width: 22 },
                { header: 'Ngày xuất kho', key: 'dispatchedAt', width: 22 },
                { header: 'Ngày nhận hàng', key: 'receivedAt', width: 22 },
                { header: 'Ghi chú', key: 'note', width: 30 },
            ], 'chuyen-kho', 'Chuyển Kho');
        } catch { /* silent */ }
    };

    const orders = transfers?.content || [];
    const totalPages = transfers?.totalPages || 0;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>Kho / <strong>Chuyển kho</strong></Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>Quản lý Chuyển kho</Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>Điều chuyển hàng hóa giữa các chi nhánh</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                        onClick={handleExport} sx={{ textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32' }}>
                        Excel
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)} sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 700 }}>
                        Tạo phiếu chuyển
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Tìm theo mã phiếu..."
                        value={keyword} onChange={e => setKeyword(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            {Object.entries(STATUS_MAP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={refresh}>Làm mới</Button>
                </Box>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Mã phiếu', 'Kho xuất', 'Kho nhập', 'Mặt hàng', 'Tổng SL', 'Trạng thái', 'Ngày tạo', 'Hành động'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>{c.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7, 8].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                            ) : orders.length === 0 ? (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>Chưa có phiếu chuyển kho nào</TableCell></TableRow>
                            ) : orders.map(t => {
                                const info = STATUS_MAP[t.status];
                                const fromWh = warehouseMap.get(t.fromWarehouseId);
                                const toWh = warehouseMap.get(t.toWarehouseId);
                                const totalQty = t.items.reduce((s, i) => s + i.quantity, 0);
                                return (
                                    <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setSelected(t); setDetailOpen(true); }}>
                                        <TableCell><Typography fontWeight={600} fontFamily="monospace">{t.code}</Typography></TableCell>
                                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocalShipping sx={{ fontSize: 14 }} />{fromWh?.name ?? t.fromWarehouseId.slice(0, 8)}</Box></TableCell>
                                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ArrowForward sx={{ fontSize: 14 }} />{toWh?.name ?? t.toWarehouseId.slice(0, 8)}</Box></TableCell>
                                        <TableCell><Chip label={`${t.items.length} mặt hàng`} size="small" /></TableCell>
                                        <TableCell><Typography fontWeight={700}>{totalQty.toLocaleString()}</Typography></TableCell>
                                        <TableCell><Chip label={info.label} size="small" sx={{ bgcolor: info.bg, color: info.color, fontWeight: 700 }} /></TableCell>
                                        <TableCell>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : '—'}</TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <IconButton size="small" onClick={() => { setSelected(t); setDetailOpen(true); }}><Visibility /></IconButton>
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

            {/* Dialogs */}
            <TransferDetailDialog open={detailOpen} transfer={selected} warehouses={warehouses} products={productMap}
                onClose={() => setDetailOpen(false)} onDispatch={handleDispatch} onReceive={handleReceive} loading={actionLoading} />
            <CreateTransferDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh} warehouses={warehouses} />

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2 }}>{snack.msg}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

export default TransfersPage;