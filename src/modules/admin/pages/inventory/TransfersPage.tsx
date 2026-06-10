import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, InputAdornment,
    Chip, IconButton, Select, MenuItem, FormControl, Snackbar, Alert,
    Skeleton, Pagination, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Grid, CircularProgress, Tooltip,
} from '@mui/material';
import {
    Search, Add, Refresh, Visibility, Close,
    Delete, LocalShipping, ArrowForward, FileDownloadOutlined,
    CheckCircle, Warning,
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
import authService from '../../../../services/authService';

// ── helpers ────────────────────────────────────────────────────
const STATUS_MAP: Record<TransferStatus, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Nháp', color: '#888', bg: '#f5f5f5' },
    DISPATCHED: { label: 'Đã xuất', color: '#e65100', bg: '#fff3e0' },
    RECEIVED: { label: 'Đã nhận', color: '#2e7d32', bg: '#e8f5e9' },
    CANCELLED: { label: 'Đã hủy', color: '#d32f2f', bg: '#ffebee' },
};

// ══════════════════════════════════════════════════════════════
// DETAIL DIALOG — có nhập SL thực nhận từng món khi DISPATCHED
// ══════════════════════════════════════════════════════════════
const TransferDetailDialog: React.FC<{
    open: boolean;
    transfer: InternalTransfer | null;
    warehouses: Warehouse[];
    products: Map<string, ProductResponse>;
    onClose: () => void;
    onDispatch: () => void;
    onReceive: (items: Array<{ productId: string; receivedQty: number }>) => void;
    loading: boolean;
    currentUser: any;
    isAdmin: boolean;
}> = ({ open, transfer, warehouses, products, onClose, onDispatch, onReceive, loading, currentUser, isAdmin }) => {
    const fromWh = warehouses.find(w => w.id === transfer?.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === transfer?.toWarehouseId);
    const info = transfer ? STATUS_MAP[transfer.status] : { label: '', color: '', bg: '' };
    const totalQty = transfer?.items.reduce((s, i) => s + i.quantity, 0) || 0;

    // State nhập số lượng thực nhận — khởi tạo bằng số lượng gốc
    const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

    React.useEffect(() => {
        if (open && transfer) {
            const init: Record<string, number> = {};
            transfer.items.forEach(item => {
                init[item.id] = item.quantity; // mặc định = số lượng gửi
            });
            setReceivedQtys(init);
        }
    }, [open, transfer]);

    const updateReceivedQty = (itemId: string, qty: number, maxQty: number) => {
        setReceivedQtys(prev => ({ ...prev, [itemId]: Math.min(Math.max(0, qty), maxQty) }));
    };

    const handleConfirmReceive = () => {
        if (!transfer) return;
        const items = transfer.items.map(item => ({
            productId: item.productId,
            receivedQty: receivedQtys[item.id] ?? item.quantity,
        }));
        onReceive(items);
    };

    const hasShortage = transfer?.items.some(item => (receivedQtys[item.id] ?? item.quantity) < item.quantity);
    const totalReceived = Object.values(receivedQtys).reduce((s, v) => s + v, 0);

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
                {/* Thông tin kho xuất / nhập */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff3e0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <LocalShipping sx={{ fontSize: 16, color: '#e65100' }} />
                                <Typography variant="caption" fontWeight={700}>KHO XUẤT</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{fromWh?.name || transfer?.fromWarehouseId}</Typography>
                            {transfer?.dispatchedAt && (
                                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                    Xuất lúc: {new Date(transfer.dispatchedAt).toLocaleString('vi-VN')}
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#e8f5e9' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ArrowForward sx={{ fontSize: 16, color: '#2e7d32' }} />
                                <Typography variant="caption" fontWeight={700}>KHO NHẬP</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{toWh?.name || transfer?.toWarehouseId}</Typography>
                            {transfer?.receivedAt && (
                                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                    Nhận lúc: {new Date(transfer.receivedAt).toLocaleString('vi-VN')}
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Tóm tắt */}
                <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box><Typography variant="caption" color="text.secondary">Mặt hàng</Typography><Typography fontWeight={700}>{transfer?.items.length || 0}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">SL gửi</Typography><Typography fontWeight={700}>{totalQty.toLocaleString()}</Typography></Box>
                    {transfer?.status === 'DISPATCHED' && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">SL sẽ nhận</Typography>
                            <Typography fontWeight={700} color={hasShortage ? '#e65100' : '#2e7d32'}>{totalReceived.toLocaleString()}</Typography>
                        </Box>
                    )}
                </Box>

                {/* Thông báo nếu nhận thiếu */}
                {transfer?.status === 'DISPATCHED' && hasShortage && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
                        Một số mặt hàng nhận số lượng ít hơn số gửi — hệ thống sẽ chỉ cộng tồn kho theo SL thực nhận.
                    </Alert>
                )}

                {/* Bảng sản phẩm */}
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Danh sách hàng hóa</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 1.5 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Sản phẩm</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Mã vạch</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>SL gửi</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>
                                    {transfer?.status === 'DISPATCHED' ? 'SL thực nhận' : 'SL đã nhận'}
                                </TableCell>
                                {transfer?.status !== 'DRAFT' && (
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>Tình trạng</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transfer?.items.map((item, idx) => {
                                const p = products.get(item.productId);
                                const receivedQty = transfer.status === 'RECEIVED'
                                    ? item.receivedQty
                                    : (receivedQtys[item.id] ?? item.quantity);
                                const isShort = receivedQty < item.quantity;
                                const isExact = receivedQty === item.quantity;

                                return (
                                    <TableRow key={item.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                {p?.imageUrl && (
                                                    <Box component="img" src={p.imageUrl} alt={p.name}
                                                        sx={{ width: 36, height: 48, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />
                                                )}
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600} fontSize={13}>
                                                        {p?.name || item.productId.slice(0, 8)}
                                                    </Typography>
                                                    {p?.sku && (
                                                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                                            {p.sku}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontFamily="monospace" color="#888">
                                                {p?.isbnBarcode || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight={700}>{item.quantity}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {transfer.status === 'DISPATCHED' ? (
                                                // Cho nhập số lượng thực nhận
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={receivedQtys[item.id] ?? item.quantity}
                                                    onChange={e => updateReceivedQty(item.id, parseInt(e.target.value) || 0, item.quantity)}
                                                    inputProps={{ min: 0, max: item.quantity, style: { width: 70, textAlign: 'center' } }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            bgcolor: isShort ? '#fff3e0' : '#f0fff4',
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography fontWeight={700} color="#2e7d32">{item.receivedQty || 0}</Typography>
                                            )}
                                        </TableCell>
                                        {transfer.status !== 'DRAFT' && (
                                            <TableCell align="center">
                                                {transfer.status === 'RECEIVED' ? (
                                                    item.receivedQty >= item.quantity ? (
                                                        <Chip label="Đủ" size="small" icon={<CheckCircle sx={{ fontSize: 12 }} />}
                                                            sx={{ height: 22, fontSize: 10, bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
                                                    ) : (
                                                        <Chip label={`Thiếu ${item.quantity - item.receivedQty}`} size="small"
                                                            icon={<Warning sx={{ fontSize: 12 }} />}
                                                            sx={{ height: 22, fontSize: 10, bgcolor: '#fff3e0', color: '#e65100', fontWeight: 700 }} />
                                                    )
                                                ) : transfer.status === 'DISPATCHED' ? (
                                                    isShort ? (
                                                        <Typography variant="caption" color="#e65100" fontWeight={700}>
                                                            Thiếu {item.quantity - (receivedQtys[item.id] ?? item.quantity)}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="#2e7d32" fontWeight={700}>Đủ</Typography>
                                                    )
                                                ) : null}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {transfer?.note && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="caption" fontWeight={700}>Ghi chú:</Typography>
                        <Typography variant="body2" color="#555" mt={0.5}>{transfer.note}</Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                {transfer?.status === 'DRAFT' && (isAdmin || (currentUser?.warehouseId && transfer?.fromWarehouseId && String(currentUser.warehouseId).toLowerCase() === String(transfer.fromWarehouseId).toLowerCase())) && (
                    <Button onClick={onDispatch} variant="contained" disabled={loading} sx={{ bgcolor: '#e65100' }}>
                        {loading ? <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} /> : null}
                        {loading ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
                    </Button>
                )}
                {transfer?.status === 'DISPATCHED' && (isAdmin || (currentUser?.warehouseId && transfer?.toWarehouseId && String(currentUser.warehouseId).toLowerCase() === String(transfer.toWarehouseId).toLowerCase())) && (
                    <Button onClick={handleConfirmReceive} variant="contained" disabled={loading} sx={{ bgcolor: '#2e7d32' }}>
                        {loading ? <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} /> : null}
                        {loading ? 'Đang xử lý...' : hasShortage ? `Nhận hàng (${totalReceived} / ${totalQty})` : 'Xác nhận nhận hàng đủ'}
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
    products: ProductResponse[];
    currentUser: any;
    isAdmin: boolean;
}> = ({ open, onClose, onCreated, warehouses, products, currentUser, isAdmin }) => {
    const [fromWid, setFromWid] = useState('');
    const [toWid, setToWid] = useState('');
    const [note, setNote] = useState('');
    const [cart, setCart] = useState<TransferCartItem[]>([]);
    const [kw, setKw] = useState('');
    const [creating, setCreating] = useState(false);
    const [invMap, setInvMap] = useState<Map<string, Inventory>>(new Map());
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

    React.useEffect(() => {
        if (!open) { 
            if (!isAdmin && currentUser?.warehouseId) {
                setFromWid(currentUser.warehouseId);
            } else {
                setFromWid(''); 
            }
            setToWid(''); setNote(''); setCart([]); setKw(''); 
        } else if (!isAdmin && currentUser?.warehouseId) {
            setFromWid(currentUser.warehouseId);
        }
    }, [open, isAdmin, currentUser]);

    React.useEffect(() => {
        if (fromWid && open) {
            inventoryService.getByWarehouse(fromWid)
                .then(d => { const m = new Map<string, Inventory>(); d.forEach(i => m.set(i.productId, i)); setInvMap(m); })
                .catch(() => setInvMap(new Map()));
        } else { setInvMap(new Map()); }
    }, [fromWid, open]);

    const availableProducts = React.useMemo(() => {
        if (!fromWid) return [];
        let list = products.filter(p => {
            const av = invMap.get(p.id)?.availableQuantity || 0;
            return av > 0 && !cart.some(c => c.productId === p.id);
        });
        if (kw.trim()) {
            const lowerKw = kw.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(lowerKw) || 
                                     p.sku?.toLowerCase().includes(lowerKw) || 
                                     p.isbnBarcode?.toLowerCase().includes(lowerKw));
        }
        return list;
    }, [fromWid, invMap, cart, kw, products]);

    const addProduct = (p: ProductResponse) => {
        const inv = invMap.get(p.id);
        const available = inv?.availableQuantity || 0;
        setCart(prev => {
            const ex = prev.find(i => i.productId === p.id);
            if (ex) return prev.map(i => i.productId === p.id ? { ...i, quantity: Math.min(i.quantity + 1, i.availableStock) } : i);
            return [...prev, { productId: p.id, productName: p.name, isbnBarcode: p.isbnBarcode, sku: p.sku, quantity: 1, availableStock: available, imageUrl: p.imageUrl }];
        });
        setKw('');

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
            await transferService.create({
                fromWarehouseId: fromWid,
                toWarehouseId: toWid,
                items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
                note: note || undefined,
            });
            setSnack({ msg: 'Tạo phiếu chuyển kho thành công!', sev: 'success' });
            onCreated(); onClose();
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Tạo phiếu chuyển thất bại', sev: 'error' });
        } finally { setCreating(false); }
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
                            <Select value={fromWid} onChange={e => setFromWid(e.target.value)} displayEmpty disabled={!isAdmin}>
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
                        <Typography variant="body2" color="text.secondary">Vui lòng chọn kho xuất để tải danh sách sản phẩm.</Typography>
                    </Box>
                ) : (
                    <>
                        <TextField fullWidth size="small" placeholder="Tìm sản phẩm theo tên, ISBN, SKU..."
                            value={kw} onChange={e => setKw(e.target.value)} sx={{ mb: 1.5 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#999' }} /></InputAdornment>,
                            }} />
                        <Paper elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 1.5, mb: 2, maxHeight: 220, overflowY: 'auto' }}>
                            {availableProducts.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">Không tìm thấy sản phẩm nào có sẵn trong kho này.</Typography>
                                </Box>
                            ) : (
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                                            {['Sản phẩm', 'Mã vạch', 'Tồn kho', 'Thao tác'].map(c => (
                                                <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11 }}>{c}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {availableProducts.slice(0, 50).map(p => {
                                            const av = invMap.get(p.id)?.availableQuantity || 0;
                                            return (
                                                <TableRow key={p.id} hover>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            {p.imageUrl && (
                                                                <Box component="img" src={p.imageUrl} alt={p.name}
                                                                    sx={{ width: 32, height: 42, objectFit: 'contain', borderRadius: 0.5, border: '1px solid #e0e0e0' }} />
                                                            )}
                                                            <Tooltip title={p.name} arrow placement="top">
                                                                <Typography variant="body2" fontWeight={600} fontSize={13} sx={{
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    maxWidth: 350
                                                                }}>
                                                                    {p.name}
                                                                </Typography>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Typography variant="caption" fontFamily="monospace" color="#888">{p.isbnBarcode || p.sku}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Typography variant="body2" fontWeight={700} color="#2e7d32">{av}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Button size="small" variant="outlined" onClick={() => addProduct(p)}>Thêm</Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </Paper>
                    </>
                )}

                {cart.length > 0 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700}>Sản phẩm đã chọn ({cart.length})</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Tổng: <strong>{cart.reduce((s, i) => s + i.quantity, 0)}</strong> sản phẩm
                            </Typography>
                        </Box>
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
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {item.imageUrl && (
                                                        <Box component="img" src={item.imageUrl} alt={item.productName}
                                                            sx={{ width: 32, height: 42, objectFit: 'contain', borderRadius: 0.5 }} />
                                                    )}
                                                    <Tooltip title={item.productName} arrow placement="top">
                                                        <Typography fontWeight={600} fontSize={13} sx={{
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: 300
                                                        }}>
                                                            {item.productName}
                                                        </Typography>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontFamily="monospace" color="#888">{item.isbnBarcode || '—'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={700} color={item.availableStock === 0 ? '#d32f2f' : '#2e7d32'}>
                                                    {item.availableStock}
                                                </Typography>
                                            </TableCell>
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
                    </>
                )}

                <Typography variant="caption" fontWeight={700}>Ghi chú</Typography>
                <TextField fullWidth size="small" multiline rows={2} placeholder="Ghi chú cho phiếu chuyển..."
                    value={note} onChange={e => setNote(e.target.value)} />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                <Button onClick={handleCreate} variant="contained"
                    disabled={creating || !fromWid || !toWid || !cart.length}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    {creating ? <><CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />Đang tạo...</> : 'Tạo phiếu chuyển'}
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

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const qc = useQueryClient();

    const { data: transfers, isLoading } = useQuery({
        queryKey: ['transfers', page, statusFilter, keyword],
        queryFn: () => transferService.getAll({ page, size: PAGE_SIZE, status: statusFilter || undefined, keyword: keyword || undefined }),
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });

    const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: warehouseService.getAll });

    const { data: productsData = [] } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productService.search({ size: 2000, isActive: true }).then(r => r.content),
        staleTime: 5 * 60 * 1000,
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
        try {
            await transferService.dispatch(selected.id);
            setSnack({ msg: 'Xác nhận xuất kho thành công!', sev: 'success' });
            setDetailOpen(false);
            refresh();
            // Cập nhật tồn kho sau khi xuất
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Thất bại', sev: 'error' });
        } finally { setActionLoading(false); }
    };

    // Nhận hàng với số lượng thực nhận từng món
    const handleReceive = async (items: Array<{ productId: string; receivedQty: number }>) => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await transferService.receive(selected.id, items);
            setSnack({ msg: 'Xác nhận nhận hàng thành công!', sev: 'success' });
            setDetailOpen(false);
            refresh();
            // Cập nhật tồn kho sau khi nhận
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Thất bại', sev: 'error' });
        } finally { setActionLoading(false); }
    };

    // Excel export
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
                totalReceived: t.items.reduce((s, i) => s + (i.receivedQty || 0), 0),
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
                { header: 'SL gửi', key: 'totalQty', width: 12 },
                { header: 'SL đã nhận', key: 'totalReceived', width: 12 },
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
                    <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
                        sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1d4ed8' } }}>
                        Tạo phiếu chuyển
                    </Button>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Tìm theo mã phiếu..."
                        value={keyword} onChange={e => setKeyword(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            {Object.entries(STATUS_MAP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={refresh}>Làm mới</Button>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Mã phiếu', 'Kho xuất', 'Kho nhập', 'Mặt hàng', 'SL gửi', 'SL nhận', 'Trạng thái', 'Ngày tạo', 'Hành động'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>
                                        {c.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>Chưa có phiếu chuyển kho nào</TableCell></TableRow>
                            ) : orders.map(t => {
                                const info = STATUS_MAP[t.status];
                                const fromWh = warehouseMap.get(t.fromWarehouseId);
                                const toWh = warehouseMap.get(t.toWarehouseId);
                                const totalQty = t.items.reduce((s, i) => s + i.quantity, 0);
                                const totalReceived = t.items.reduce((s, i) => s + (i.receivedQty || 0), 0);
                                const hasShortage = t.status === 'RECEIVED' && totalReceived < totalQty;
                                return (
                                    <TableRow key={t.id} hover sx={{ cursor: 'pointer' }}
                                        onClick={() => { setSelected(t); setDetailOpen(true); }}>
                                        <TableCell>
                                            <Typography fontWeight={600} fontFamily="monospace">{t.code}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <LocalShipping sx={{ fontSize: 13, color: '#e65100' }} />
                                                <Typography variant="body2" fontSize={12}>{fromWh?.name ?? t.fromWarehouseId.slice(0, 8)}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <ArrowForward sx={{ fontSize: 13, color: '#2e7d32' }} />
                                                <Typography variant="body2" fontSize={12}>{toWh?.name ?? t.toWarehouseId.slice(0, 8)}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={`${t.items.length} món`} size="small" sx={{ height: 20, fontSize: 10 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight={700}>{totalQty.toLocaleString()}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {t.status === 'RECEIVED' ? (
                                                <Typography fontWeight={700} color={hasShortage ? '#e65100' : '#2e7d32'}>
                                                    {totalReceived.toLocaleString()}
                                                    {hasShortage && <Typography component="span" variant="caption" color="#e65100" ml={0.5}>(thiếu)</Typography>}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="#bbb">—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={info.label} size="small" sx={{ bgcolor: info.bg, color: info.color, fontWeight: 700, height: 22, fontSize: 10 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontFamily="monospace" fontSize={11}>
                                                {t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <IconButton size="small" onClick={() => { setSelected(t); setDetailOpen(true); }} sx={{ color: '#3b82f6', '&:hover': { bgcolor: '#eff6ff' } }}>
                                                <Visibility sx={{ fontSize: 16 }} />
                                            </IconButton>
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

            <TransferDetailDialog
                open={detailOpen}
                transfer={selected}
                warehouses={warehouses}
                products={productMap}
                onClose={() => setDetailOpen(false)}
                onDispatch={handleDispatch}
                onReceive={handleReceive}
                loading={actionLoading}
                currentUser={currentUser}
                isAdmin={isAdmin}
            />
            <CreateTransferDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh} warehouses={warehouses} products={productsData} currentUser={currentUser} isAdmin={isAdmin} />

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2 }}>{snack.msg}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

export default TransfersPage;