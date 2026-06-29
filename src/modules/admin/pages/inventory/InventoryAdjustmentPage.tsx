import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, Snackbar, Alert,
    Skeleton, Pagination, Divider, CircularProgress,
    Tooltip, Tabs, Tab, LinearProgress,
} from '@mui/material';
import {
    Search, Add, Refresh, Visibility, CheckCircle,
    Close, Delete, Send, ThumbDown, Cancel, Assignment,
    FileDownloadOutlined,
} from '@mui/icons-material';
import { adjustmentService, AdjustItemPayload } from '../../../../services/adjustmentService';
import warehouseService from '../../../../services/warehouseService';
import productService from '../../../../services/productService';
import inventoryService from '../../../../services/inventoryService';
import {
    StockAdjustment, StockAdjustmentStatus, Warehouse,
    ProductResponse, Inventory,
} from '../../../../types';
import authService from '../../../../services/authService';
import userService from '../../../../services/userService';

// ── helpers ─────────────────────────────────────────────────
const REASON_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '',                 label: '-- Chọn loại --' },
    { value: 'DAMAGED',          label: 'Hàng hư hỏng' },
    { value: 'LOST',             label: 'Thất lạc' },
    { value: 'THEFT',            label: 'Mất cắp' },
    { value: 'COUNTING_ERROR',   label: 'Đếm nhầm' },
    { value: 'UNRECORDED_RECEIPT', label: 'Nhập chưa ghi sổ' },
    { value: 'EXPIRY',           label: 'Hết hạn' },
    { value: 'OTHER',            label: 'Khác' },
];

const STATUS_MAP: Record<StockAdjustmentStatus, { label: string; color: string; bg: string }> = {
    DRAFT:            { label: 'Nháp',         color: '#888',    bg: '#f5f5f5' },
    PENDING_APPROVAL: { label: 'Chờ duyệt',    color: '#e65100', bg: '#fff3e0' },
    APPROVED:         { label: 'Đã duyệt',     color: '#2e7d32', bg: '#e8f5e9' },
    REJECTED:         { label: 'Bị từ chối',   color: '#d32f2f', bg: '#ffebee' },
    CANCELLED:        { label: 'Đã hủy',       color: '#9e9e9e', bg: '#f5f5f5' },
};

// ══════════════════════════════════════════════════════════════
// DETAIL DIALOG
// ══════════════════════════════════════════════════════════════
const AdjDetailDialog: React.FC<{
    open: boolean;
    adj: StockAdjustment | null;
    warehouses: Warehouse[];
    products: Map<string, ProductResponse>;
    userMap: Map<string, string>;
    onClose: () => void;
    onSubmit: () => void;
    onApprove: () => void;
    onReject: () => void;
    onCancel: () => void;
    loading: boolean;
    isAdmin: boolean;
    currentUser: any;
}> = ({ open, adj, warehouses, products, userMap, onClose, onSubmit, onApprove, onReject, onCancel, loading, isAdmin, currentUser }) => {
    const warehouse = warehouses.find(w => w.id === adj?.warehouseId);
    const statusInfo = adj ? STATUS_MAP[adj.status] : { label: '', color: '', bg: '' };
    const isCreator = currentUser?.id === adj?.createdByUser;

    const fmtDt = (d?: string) => d ? new Date(d).toLocaleString('vi-VN') : '—';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography fontWeight={800} fontSize={15}>Chi tiết: {adj?.code}</Typography>
                    {adj && <Chip label={statusInfo.label} size="small"
                        sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700, height: 22 }} />}
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ px: 3, pt: 2 }}>
                <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        {[
                            ['Kho', warehouse?.name || adj?.warehouseId],
                            ['Ngày tạo', fmtDt(adj?.createdAt)],
                            ['Người tạo', adj?.createdByUser ? (userMap.get(adj.createdByUser) || adj.createdByUser.slice(0, 8) + '...') : '—'],
                        ].map(([label, value]) => (
                            <Box key={label} sx={{ display: 'flex', mb: 0.75 }}>
                                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 110, color: '#475569' }}>{label}:</Typography>
                                <Typography variant="body2">{value}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        {adj?.approvedAt && (
                            <Box sx={{ display: 'flex', mb: 0.75 }}>
                                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 110, color: '#475569' }}>Duyệt lúc:</Typography>
                                <Typography variant="body2">{fmtDt(adj.approvedAt)}</Typography>
                            </Box>
                        )}
                        {adj?.rejectionReason && (
                            <Box sx={{ p: 1.5, bgcolor: '#ffebee', borderRadius: 1.5, border: '1px solid #ffcdd2' }}>
                                <Typography variant="caption" fontWeight={700} color="#d32f2f">Lý do từ chối:</Typography>
                                <Typography variant="body2" color="#d32f2f" mt={0.5}>{adj.rejectionReason}</Typography>
                            </Box>
                        )}
                        {adj?.cancelReason && (
                            <Box sx={{ p: 1.5, bgcolor: '#ffebee', borderRadius: 1.5, border: '1px solid #ffcdd2', mt: 1 }}>
                                <Typography variant="caption" fontWeight={700} color="#d32f2f">Lý do hủy:</Typography>
                                <Typography variant="body2" color="#d32f2f" mt={0.5}>{adj.cancelReason}</Typography>
                            </Box>
                        )}
                        {adj?.note && (
                            <Box sx={{ display: 'flex', mb: 0.75 }}>
                                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 110, color: '#475569' }}>Ghi chú:</Typography>
                                <Typography variant="body2" color="#555">{adj.note}</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Danh sách kiểm kê</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Sản phẩm', 'SL hệ thống', 'SL thực tế', 'Chênh lệch', 'Ghi chú'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {adj?.items.map((item, idx) => {
                                const p = products.get(item.productId);
                                const diff = item.actualQty - item.systemQty;
                                return (
                                    <TableRow key={item.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} fontSize={12.5}>
                                                {p?.name || item.productId.slice(0, 8)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center"><Typography fontWeight={700}>{item.systemQty}</Typography></TableCell>
                                        <TableCell align="center"><Typography fontWeight={700}>{item.actualQty}</Typography></TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight={800}
                                                color={diff > 0 ? '#2e7d32' : diff < 0 ? '#d32f2f' : '#888'}>
                                                {diff > 0 ? `+${diff}` : diff}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="#666">{item.reason || '—'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                <Box sx={{ flex: 1 }} />

                {/* DRAFT: chỉ người tạo (Manager) mới gửi duyệt / hủy */}
                {adj?.status === 'DRAFT' && !isAdmin && isCreator && (
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

                {/* PENDING_APPROVAL: Admin duyệt/từ chối; Manager (creator) hủy */}
                {adj?.status === 'PENDING_APPROVAL' && (
                    <>
                        {isAdmin && (
                            <>
                                <Button onClick={() => onApprove()} variant="contained" disabled={loading} startIcon={<CheckCircle />}
                                    sx={{ textTransform: 'none', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
                                    Duyệt & Điều chỉnh kho
                                </Button>
                                <Button onClick={() => onReject()} variant="contained" disabled={loading} startIcon={<ThumbDown />}
                                    sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
                                    Từ chối
                                </Button>
                            </>
                        )}
                        {!isAdmin && isCreator && (
                            <Button onClick={() => onCancel()} variant="outlined" color="error" disabled={loading} sx={{ textTransform: 'none' }}>
                                Hủy phiếu
                            </Button>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// CREATE DIALOG
// ══════════════════════════════════════════════════════════════
interface AdjCartItem {
    productId: string;
    productName: string;
    systemQty: number;
    actualQty: number;
    reason: string;
    reasonType: string;
}

const CreateAdjDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    warehouses: Warehouse[];
    currentUser: any;
    isAdmin: boolean;
}> = ({ open, onClose, onCreated, warehouses, currentUser, isAdmin }) => {
    const [warehouseId, setWarehouseId] = useState('');
    const [note, setNote] = useState('');
    const [cart, setCart] = useState<AdjCartItem[]>([]);
    const [searchKw, setSearchKw] = useState('');
    const [searchResults, setSearchResults] = useState<ProductResponse[]>([]);
    const [searching, setSearching] = useState(false);
    const [invMap, setInvMap] = useState<Map<string, Inventory>>(new Map());
    const [productMap, setProductMap] = useState<Map<string, ProductResponse>>(new Map());
    const [creating, setCreating] = useState(false);
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        if (!open) {
            setNote(''); setCart([]); setSearchKw(''); setSearchResults([]);
            setTab(0);
            if (isAdmin) setWarehouseId('');
        } else if (!isAdmin && currentUser?.warehouseId) {
            setWarehouseId(String(currentUser.warehouseId));
        }
    }, [open, isAdmin, currentUser]);

    useEffect(() => {
        if (warehouseId && open) {
            inventoryService.getByWarehouse(warehouseId)
                .then(data => {
                    const map = new Map<string, Inventory>();
                    data.forEach(i => map.set(i.productId, i));
                    setInvMap(map);
                }).catch(() => setInvMap(new Map()));
            productService.search({ size: 2000, isActive: true })
                .then(res => {
                    const map = new Map<string, ProductResponse>();
                    res.content.forEach(p => map.set(p.id, p));
                    setProductMap(map);
                }).catch(() => {});
        } else { setInvMap(new Map()); }
    }, [warehouseId, open]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (searchKw.trim().length >= 2 && open) {
                setSearching(true);
                productService.search({ keyword: searchKw, size: 10, isActive: true })
                    .then(res => setSearchResults(res.content.filter(p => !cart.some(c => c.productId === p.id))))
                    .catch(() => setSearchResults([]))
                    .finally(() => setSearching(false));
            } else { setSearchResults([]); }
        }, 400);
        return () => clearTimeout(t);
    }, [searchKw, open, cart]);

    const addProduct = (p: ProductResponse) => {
        const inv = invMap.get(p.id);
        const systemQty = inv?.quantity || 0;
        setCart(prev => [...prev, {
            productId: p.id, productName: p.name,
            systemQty, actualQty: systemQty, reason: '', reasonType: '',
        }]);
        setSearchKw(''); setSearchResults([]);
    };

    const loadAllInventory = async () => {
        if (!warehouseId) return;
        const [data, productsRes] = await Promise.all([
            inventoryService.getByWarehouse(warehouseId),
            productService.search({ size: 2000, isActive: true }),
        ]);
        const freshMap = new Map<string, ProductResponse>();
        productsRes.content.forEach(p => freshMap.set(p.id, p));
        if (freshMap.size > 0) setProductMap(freshMap);
        setCart(prev => data.map(inv => {
            const existing = prev.find(c => c.productId === inv.productId);
            if (existing) return existing;
            const p = freshMap.get(inv.productId);
            return { productId: inv.productId, productName: p?.name || inv.productId.slice(0, 8), systemQty: inv.quantity, actualQty: inv.quantity, reason: '', reasonType: '' };
        }));
    };

    const updateItem = (productId: string, field: keyof AdjCartItem, value: any) => {
        setCart(prev => prev.map(i => i.productId === productId ? { ...i, [field]: value } : i));
    };

    const removeItem = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId));

    // ── computed ──────────────────────────────────────────────
    const diffItems = cart.filter(i => i.actualQty !== i.systemQty);
    const matchedItems = cart.filter(i => i.actualQty === i.systemQty);
    const totalPlus = diffItems.filter(i => i.actualQty > i.systemQty).reduce((s, i) => s + (i.actualQty - i.systemQty), 0);
    const totalMinus = diffItems.filter(i => i.actualQty < i.systemQty).reduce((s, i) => s + (i.systemQty - i.actualQty), 0);
    const totalActual = cart.reduce((s, i) => s + i.actualQty, 0);
    const warehouseName = warehouses.find(w => w.id === warehouseId)?.name;

    const unchecked = Array.from(invMap.entries())
        .filter(([pid]) => !cart.some(c => c.productId === pid))
        .map(([pid, inv]) => ({ productId: pid, systemQty: inv.quantity }));

    const filteredCart = tab === 0 ? cart : tab === 1 ? matchedItems : tab === 2 ? diffItems : [];
    const TAB_COUNTS = [cart.length, matchedItems.length, diffItems.length, unchecked.length];

    const handleCreate = async () => {
        if (!warehouseId) { setSnack({ msg: 'Vui lòng chọn kho', sev: 'error' }); return; }
        if (!cart.length) { setSnack({ msg: 'Vui lòng thêm sản phẩm', sev: 'error' }); return; }
        setCreating(true);
        try {
            const items: AdjustItemPayload[] = cart.map(i => ({
                productId: i.productId,
                systemQty: i.systemQty,
                actualQty: i.actualQty,
                reason: i.reason || undefined,
                reasonType: i.reasonType || undefined,
            }));
            await adjustmentService.create({ warehouseId, items, note: note || undefined });
            setSnack({ msg: 'Tạo phiếu kiểm kê thành công! Gửi duyệt khi sẵn sàng.', sev: 'success' });
            onCreated(); onClose();
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Tạo phiếu kiểm kê thất bại', sev: 'error' });
        } finally { setCreating(false); }
    };

    const checkedCount = cart.filter(i => i.actualQty !== i.systemQty || i.reason || i.reasonType).length;
    const progressPct = cart.length > 0 ? Math.round((checkedCount / cart.length) * 100) : 0;

    const handleExport = async () => {
        const XLSX = await import('xlsx');
        const rows = cart.map((item, idx) => {
            const diff = item.actualQty - item.systemQty;
            const barcode = productMap.get(item.productId)?.isbnBarcode || '';
            return {
                STT: idx + 1,
                'Mã hàng': barcode,
                'Tên hàng': item.productName,
                ĐVT: 'cuốn',
                'Tồn kho HT': item.systemQty,
                'Thực tế': item.actualQty,
                'SL lệch': diff === 0 ? 0 : diff,
                'Loại nguyên nhân': REASON_TYPE_OPTIONS.find(o => o.value === item.reasonType)?.label || '',
                'Ghi chú': item.reason || '',
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 5 }, { wch: 16 }, { wch: 36 }, { wch: 7 },
            { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 28 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kiểm kê');
        XLSX.writeFile(wb, `kiem-ke-${warehouseName || 'kho'}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // ── render ────────────────────────────────────────────────
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, height: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>

            {/* ══ HEADER ══ */}
            <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: '1px solid #e2e8f0', bgcolor: '#fff', flexShrink: 0 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Assignment sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Typography fontWeight={800} fontSize={15} color="#1e293b" flex={1}>Kiểm kê kho</Typography>

                {/* Search bar in header */}
                {warehouseId && (
                    <Box sx={{ width: 380, position: 'relative' }}>
                        <TextField size="small" fullWidth placeholder="Tìm theo mã hàng, barcode, tên để thêm..."
                            value={searchKw} onChange={e => setSearchKw(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#bbb' }} /></InputAdornment>,
                                endAdornment: searching && <CircularProgress size={14} />,
                                sx: { borderRadius: 2, fontSize: 13 }
                            }} />
                        {searchResults.length > 0 && (
                            <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1400,
                                maxHeight: 260, overflowY: 'auto', borderRadius: 1.5, mt: 0.5 }}>
                                {searchResults.map(p => {
                                    const inv = invMap.get(p.id);
                                    return (
                                        <Box key={p.id} onClick={() => addProduct(p)} sx={{
                                            px: 2, py: 1, cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            '&:hover': { bgcolor: '#f0f7ff' },
                                        }}>
                                            <Box>
                                                <Typography fontWeight={600} fontSize={12.5}>{p.name}</Typography>
                                                <Typography variant="caption" color="#888" fontFamily="monospace">{p.isbnBarcode}</Typography>
                                            </Box>
                                            <Chip label={`Tồn: ${inv?.quantity ?? 0}`} size="small"
                                                sx={{ height: 18, fontSize: 10, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
                                        </Box>
                                    );
                                })}
                            </Paper>
                        )}
                    </Box>
                )}
                <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}><Close sx={{ fontSize: 18 }} /></IconButton>
            </Box>

            {/* ══ BODY: Left panel + Right panel ══ */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ─── LEFT PANEL ─── */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Tabs */}
                    <Box sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#fff', flexShrink: 0 }}>
                        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 42, px: 1.5 }}
                            TabIndicatorProps={{ sx: { height: 2, borderRadius: 1 } }}>
                            {['Tất cả', 'Khớp', 'Lệch', 'Chưa kiểm'].map((label, i) => (
                                <Tab key={label} label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <span>{label}</span>
                                        <Box sx={{
                                            px: 0.75, lineHeight: '18px', minWidth: 20, textAlign: 'center',
                                            bgcolor: tab === i ? '#2563eb' : '#e2e8f0', borderRadius: 10,
                                            fontSize: 10, fontWeight: 700, color: tab === i ? '#fff' : '#64748b',
                                        }}>
                                            {TAB_COUNTS[i]}
                                        </Box>
                                    </Box>
                                } sx={{ minHeight: 42, fontSize: 12.5, textTransform: 'none', fontWeight: 600, py: 0 }} />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Table */}
                    {!warehouseId ? (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                            <Assignment sx={{ fontSize: 52, mb: 1 }} />
                            <Typography fontSize={13} color="#94a3b8">
                                {isAdmin ? 'Chọn kho ở bên phải để bắt đầu kiểm kê' : 'Đang tải thông tin kho...'}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {[
                                            { label: 'STT', w: 44, align: 'center' as const },
                                            { label: 'MÃ HÀNG', w: '11%', align: 'left' as const },
                                            { label: 'TÊN HÀNG', w: undefined, align: 'left' as const },
                                            { label: 'ĐVT', w: 52, align: 'center' as const },
                                            { label: 'TỒN KHO', w: 80, align: 'center' as const },
                                            { label: 'THỰC TẾ', w: 100, align: 'center' as const },
                                            { label: 'SL LỆCH', w: 80, align: 'center' as const },
                                            { label: 'LOẠI NN', w: '14%', align: 'left' as const },
                                            { label: 'GHI CHÚ', w: '16%', align: 'left' as const },
                                            { label: '', w: 36, align: 'center' as const },
                                        ].map(col => (
                                            <TableCell key={col.label} align={col.align} width={col.w}
                                                sx={{ fontWeight: 700, fontSize: 10, bgcolor: '#f8fafc', color: '#64748b',
                                                    borderBottom: '2px solid #e2e8f0', py: 1, letterSpacing: 0.4 }}>
                                                {col.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* Tab 0-2: counted items */}
                                    {tab !== 3 && filteredCart.map((item, idx) => {
                                        const diff = item.actualQty - item.systemQty;
                                        const hasDiff = diff !== 0;
                                        const barcode = productMap.get(item.productId)?.isbnBarcode;
                                        return (
                                            <TableRow key={item.productId} sx={{
                                                bgcolor: hasDiff ? (diff > 0 ? '#f0fdf4' : '#fff5f5') : idx % 2 === 0 ? '#fff' : '#fafbfc',
                                                '&:hover': { bgcolor: hasDiff ? (diff > 0 ? '#dcfce7' : '#fee2e2') : '#eff6ff' },
                                            }}>
                                                <TableCell align="center" sx={{ color: '#94a3b8', fontSize: 11, py: 0.75 }}>{idx + 1}</TableCell>
                                                <TableCell sx={{ py: 0.75 }}>
                                                    <Typography variant="caption" fontFamily="monospace" color="#64748b" fontSize={11}>
                                                        {barcode || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.75, maxWidth: 200 }}>
                                                    <Tooltip title={item.productName} placement="top" arrow enterDelay={400}>
                                                        <Typography fontWeight={600} fontSize={12.5} color="#1e293b"
                                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.productName}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}>
                                                    <Typography variant="caption" color="#94a3b8">cuốn</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}>
                                                    <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.25, bgcolor: '#f1f5f9', borderRadius: 1 }}>
                                                        <Typography fontWeight={700} color="#475569" fontSize={13}>{item.systemQty}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}>
                                                    <TextField size="small" value={item.actualQty}
                                                        onChange={e => {
                                                            const v = parseInt(e.target.value);
                                                            updateItem(item.productId, 'actualQty', isNaN(v) ? 0 : Math.max(0, v));
                                                        }}
                                                        onFocus={e => e.target.select()}
                                                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { textAlign: 'center', width: 60, padding: '4px 6px' } }}
                                                        sx={{ '& .MuiOutlinedInput-root': {
                                                            bgcolor: hasDiff ? (diff > 0 ? '#dcfce7' : '#fee2e2') : '#fff',
                                                            borderRadius: 1.5,
                                                        }}} />
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}>
                                                    {hasDiff ? (
                                                        <Box sx={{ display: 'inline-flex', px: 1, py: 0.2,
                                                            borderRadius: 1, bgcolor: diff > 0 ? '#e8f5e9' : '#ffebee' }}>
                                                            <Typography fontWeight={800} fontSize={12}
                                                                color={diff > 0 ? '#2e7d32' : '#d32f2f'}>
                                                                {diff > 0 ? `+${diff}` : diff}
                                                            </Typography>
                                                        </Box>
                                                    ) : <Typography color="#d1d5db">—</Typography>}
                                                </TableCell>
                                                <TableCell sx={{ py: 0.75 }}>
                                                    <FormControl size="small" fullWidth>
                                                        <Select value={item.reasonType}
                                                            onChange={e => updateItem(item.productId, 'reasonType', e.target.value)}
                                                            displayEmpty sx={{ fontSize: 11, borderRadius: 1.5 }}>
                                                            {REASON_TYPE_OPTIONS.map(opt => (
                                                                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 12 }}>{opt.label}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.75 }}>
                                                    <TextField size="small" fullWidth placeholder="Ghi chú..."
                                                        value={item.reason}
                                                        onChange={e => updateItem(item.productId, 'reason', e.target.value)}
                                                        inputProps={{ style: { padding: '4px 8px', fontSize: 12 } }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}>
                                                    <IconButton size="small" onClick={() => removeItem(item.productId)}
                                                        sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                        <Delete sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {/* Tab 3: Chưa kiểm */}
                                    {tab === 3 && unchecked.map((item, idx) => {
                                        const p = productMap.get(item.productId);
                                        return (
                                            <TableRow key={item.productId} sx={{ opacity: 0.65, '&:hover': { bgcolor: '#f8fafc', opacity: 1 } }}>
                                                <TableCell align="center" sx={{ color: '#94a3b8', fontSize: 11, py: 0.75 }}>{idx + 1}</TableCell>
                                                <TableCell sx={{ py: 0.75 }}>
                                                    <Typography variant="caption" fontFamily="monospace" color="#94a3b8" fontSize={11}>
                                                        {p?.isbnBarcode || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.75, maxWidth: 200 }}>
                                                    <Tooltip title={p?.name || ''} placement="top" arrow enterDelay={400}>
                                                        <Typography fontSize={12.5} color="#94a3b8"
                                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {p?.name || item.productId.slice(0, 14)}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="center"><Typography variant="caption" color="#c8d3e0">cuốn</Typography></TableCell>
                                                <TableCell align="center">
                                                    <Typography fontWeight={700} color="#94a3b8" fontSize={13}>{item.systemQty}</Typography>
                                                </TableCell>
                                                <TableCell align="center" colSpan={4}>
                                                    <Typography variant="caption" color="#cbd5e1" fontStyle="italic">Chưa kiểm đếm</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}>
                                                    <Button size="small" variant="outlined" onClick={() => { if (p) addProduct(p); }}
                                                        sx={{ fontSize: 10, py: 0.25, px: 0.75, textTransform: 'none', minWidth: 52, borderRadius: 1 }}>
                                                        + Thêm
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {/* Empty state */}
                                    {((tab !== 3 && filteredCart.length === 0) || (tab === 3 && unchecked.length === 0)) && (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                                <CheckCircle sx={{ fontSize: 36, color: '#a3e635', mb: 0.75, display: 'block', mx: 'auto' }} />
                                                <Typography color="#94a3b8" fontSize={13}>
                                                    {tab === 3 ? 'Tất cả sản phẩm đã được kiểm' : warehouseId ? 'Không có sản phẩm nào — tìm hoặc tải toàn bộ' : ''}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>

                {/* ─── RIGHT PANEL ─── */}
                <Box sx={{ width: 268, flexShrink: 0, borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', bgcolor: '#fafbfc', overflowY: 'auto' }}>
                    {/* Kho info */}
                    <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography fontWeight={700} fontSize={13.5} color="#1e293b" flex={1} noWrap>
                                {warehouseName || 'Chưa chọn kho'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="#94a3b8" fontSize={11}>
                            {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Box>

                    {/* Kho selector (admin) or locked (manager) */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" fontWeight={700} color="#64748b" display="block" mb={0.75}
                            fontSize={10} textTransform="uppercase" letterSpacing={0.4}>Kho kiểm kê *</Typography>
                        {isAdmin ? (
                            <FormControl fullWidth size="small">
                                <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty
                                    sx={{ borderRadius: 1.5, fontSize: 13 }}>
                                    <MenuItem value="">-- Chọn kho --</MenuItem>
                                    {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id} sx={{ fontSize: 13 }}>{w.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.85,
                                bgcolor: '#e8f5e9', borderRadius: 1.5, border: '1px solid #a5d6a7' }}>
                                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#4caf50', flexShrink: 0 }} />
                                <Typography fontWeight={700} color="#1b5e20" fontSize={12.5}>{warehouseName || '—'}</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Mã phiếu + trạng thái */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                        <Box sx={{ mb: 1.25 }}>
                            <Typography variant="caption" color="#94a3b8" display="block" mb={0.25} fontSize={11}>Mã kiểm kho</Typography>
                            <Typography variant="body2" color="#bbb" fontStyle="italic" fontSize={12}>Mã tự động tạo</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="#94a3b8" display="block" mb={0.25} fontSize={11}>Trạng thái</Typography>
                            <Chip label="Phiếu tạm" size="small"
                                sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 700, height: 22, fontSize: 11, borderRadius: 1 }} />
                        </Box>
                    </Box>

                    {/* Stats */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                        {[
                            { label: 'Tổng SL thực tế', val: totalActual, color: '#1e293b' },
                            { label: 'SP lệch', val: diffItems.length, color: diffItems.length > 0 ? '#d97706' : '#64748b' },
                            { label: 'Tổng thừa', val: totalPlus > 0 ? `+${totalPlus}` : 0, color: totalPlus > 0 ? '#16a34a' : '#94a3b8' },
                            { label: 'Tổng thiếu', val: totalMinus > 0 ? `-${totalMinus}` : 0, color: totalMinus > 0 ? '#dc2626' : '#94a3b8' },
                        ].map(s => (
                            <Box key={s.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                <Typography variant="caption" color="#64748b" fontSize={11.5}>{s.label}</Typography>
                                <Typography variant="caption" fontWeight={700} color={s.color} fontSize={13}>{s.val}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Progress bar */}
                    {cart.length > 0 && (
                        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="caption" color="#64748b" fontSize={11}>Tiến trình kiểm</Typography>
                                <Typography variant="caption" fontWeight={700} color="#1e293b" fontSize={11}>
                                    {checkedCount}/{cart.length} SP
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={progressPct}
                                sx={{ height: 6, borderRadius: 3,
                                    bgcolor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        bgcolor: progressPct === 100 ? '#16a34a' : '#2563eb',
                                    }
                                }} />
                            <Typography variant="caption" color={progressPct === 100 ? '#16a34a' : '#94a3b8'} fontSize={10} mt={0.5} display="block">
                                {progressPct === 100 ? '✓ Đã điền đầy đủ' : `${progressPct}% đã xử lý`}
                            </Typography>
                        </Box>
                    )}

                    {/* Load all + Export buttons */}
                    {warehouseId && (
                        <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <Button fullWidth variant="outlined" size="small" onClick={loadAllInventory}
                                sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 12 }}>
                                Tải toàn bộ hàng hóa ({invMap.size} SP)
                            </Button>
                            {cart.length > 0 && (
                                <Button fullWidth variant="outlined" size="small"
                                    startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                                    onClick={handleExport}
                                    sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 12,
                                        borderColor: '#16a34a', color: '#16a34a',
                                        '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' } }}>
                                    Xuất Excel
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* Global note */}
                    <Box sx={{ px: 2, py: 1.5, flex: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="#64748b" display="block" mb={0.75}
                            fontSize={10} textTransform="uppercase" letterSpacing={0.4}>Ghi chú phiếu</Typography>
                        <TextField fullWidth size="small" multiline rows={4}
                            placeholder="Ghi chú kiểm kê..."
                            value={note} onChange={e => setNote(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff', fontSize: 13 } }} />
                    </Box>

                    {/* Kiểm gần đây placeholder */}
                    <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" fontWeight={700} color="#64748b" display="block" mb={0.75}
                            fontSize={10} textTransform="uppercase" letterSpacing={0.4}>Kiểm gần đây</Typography>
                        <Typography variant="caption" color="#cbd5e1" fontSize={11.5}>Chưa có mục nào</Typography>
                    </Box>

                    {/* Action buttons */}
                    <Box sx={{ px: 2, py: 1.75, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button onClick={handleCreate} variant="contained" fullWidth
                            disabled={creating || !warehouseId || cart.length === 0}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#2563eb',
                                '&:hover': { bgcolor: '#1d4ed8' }, fontSize: 13 }}>
                            {creating
                                ? <><CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} />Đang tạo...</>
                                : `Tạo phiếu (${cart.length} SP)`}
                        </Button>
                        <Button onClick={onClose} variant="outlined" fullWidth
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 13 }}>
                            Hủy
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)}>{snack.msg}</Alert> : <div />}
            </Snackbar>
        </Dialog>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const InventoryAdjustmentPage: React.FC = () => {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [keyword, setKeyword] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<StockAdjustment | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [products, setProducts] = useState<Map<string, ProductResponse>>(new Map());
    const PAGE_SIZE = 15;

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Deep-link: ?open={id} từ trang Lịch sử kho
    useEffect(() => {
        const openId = searchParams.get('open');
        if (!openId) return;
        adjustmentService.getById(openId)
            .then(adj => { setSelected(adj); setDetailOpen(true); })
            .catch(() => {})
            .finally(() => setSearchParams(p => { p.delete('open'); return p; }, { replace: true }));
    }, []);

    // Manager chỉ được xem kho của mình
    useEffect(() => {
        if (!isAdmin && currentUser?.warehouseId) {
            setWarehouseFilter(String(currentUser.warehouseId));
        }
    }, [isAdmin, currentUser?.warehouseId]);

    const { data: adjData, isLoading, refetch } = useQuery({
        queryKey: ['stock-adjustments', page, statusFilter, keyword, warehouseFilter],
        queryFn: () => adjustmentService.getAll({
            page, size: PAGE_SIZE,
            status: statusFilter || undefined,
            keyword: keyword || undefined,
            warehouseId: warehouseFilter || undefined,
        }),
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: warehouseService.getAll });
    const { data: allUsers = [] } = useQuery({ queryKey: ['users-all'], queryFn: () => userService.getAll() });

    useEffect(() => {
        productService.search({ size: 1000, isActive: true }).then(res => {
            const map = new Map<string, ProductResponse>();
            res.content.forEach(p => map.set(p.id, p));
            setProducts(map);
        }).catch(() => {});
    }, []);

    const userMap = React.useMemo(() => {
        const m = new Map<string, string>();
        allUsers.forEach(u => m.set(u.id, u.fullName));
        return m;
    }, [allUsers]);

    const warehouseMap = React.useMemo(() => {
        const m = new Map<string, Warehouse>();
        warehouses.forEach(w => m.set(w.id, w));
        return m;
    }, [warehouses]);

    const handleSubmit = async (adjId?: string) => {
        const id = adjId ?? selected?.id;
        if (!id) return;
        setActionLoading(true);
        try {
            await adjustmentService.submit(id);
            setSnack({ msg: 'Đã gửi phiếu kiểm kê để duyệt!', sev: 'success' });
            setDetailOpen(false); refetch();
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Gửi duyệt thất bại', sev: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleApprove = async (adjId?: string) => {
        const id = adjId ?? selected?.id;
        if (!id) return;
        setActionLoading(true);
        try {
            await adjustmentService.approve(id);
            setSnack({ msg: 'Duyệt & điều chỉnh tồn kho thành công!', sev: 'success' });
            setDetailOpen(false); refetch();
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Duyệt thất bại', sev: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleRejectConfirm = async () => {
        if (!selected || !rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await adjustmentService.reject(selected.id, rejectReason);
            setSnack({ msg: 'Đã từ chối phiếu kiểm kê.', sev: 'success' });
            setRejectOpen(false); setRejectReason(''); setDetailOpen(false); refetch();
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Thất bại', sev: 'error' });
        } finally { setActionLoading(false); }
    };

    const handleCancel = async () => {
        if (!selected || !cancelReason.trim()) return;
        setActionLoading(true);
        try {
            await adjustmentService.cancel(selected.id, cancelReason);
            setSnack({ msg: 'Đã hủy phiếu kiểm kê.', sev: 'success' });
            setCancelOpen(false); setCancelReason(''); setDetailOpen(false); refetch();
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Hủy thất bại', sev: 'error' });
        } finally { setActionLoading(false); }
    };

    const adjs = adjData?.content || [];
    const totalPages = adjData?.totalPages || 0;

    // ── Phát hiện thay đổi trạng thái phiếu → toast real-time ─
    const prevStatusRef = useRef<Map<string, string>>(new Map());
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        if (!adjs.length) return;
        if (isFirstLoadRef.current) {
            // Lần đầu load: chỉ ghi nhớ trạng thái, không toast
            const m = new Map<string, string>();
            adjs.forEach(a => m.set(a.id, a.status));
            prevStatusRef.current = m;
            isFirstLoadRef.current = false;
            return;
        }
        const prev = prevStatusRef.current;
        adjs.forEach(adj => {
            const oldStatus = prev.get(adj.id);
            if (!oldStatus || oldStatus === adj.status) return;
            if (!isAdmin && adj.status === 'APPROVED') {
                toast.success(`Phiếu ${adj.code} đã được duyệt!`, { duration: 6000, icon: '✅' });
                qc.invalidateQueries({ queryKey: ['inventory-all'] });
                qc.invalidateQueries({ queryKey: ['inventory-stats'] });
            } else if (!isAdmin && adj.status === 'REJECTED') {
                toast.error(`Phiếu ${adj.code} bị từ chối`, { duration: 6000, icon: '❌' });
            } else if (isAdmin && adj.status === 'PENDING_APPROVAL') {
                toast(`Phiếu ${adj.code} đang chờ duyệt`, { duration: 5000, icon: '📋' });
            }
        });
        const m = new Map<string, string>();
        adjs.forEach(a => m.set(a.id, a.status));
        prevStatusRef.current = m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjs]);

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>Kho / <strong>Kiểm kê</strong></Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>Kiểm kê Kho hàng</Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>So sánh tồn kho thực tế vs hệ thống · Quy trình duyệt 2 bước</Typography>
                </Box>
                {!isAdmin && (
                    <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                        Tạo phiếu kiểm kê
                    </Button>
                )}
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Tìm theo mã phiếu..."
                        value={keyword} onChange={e => setKeyword(e.target.value)} sx={{ minWidth: 200 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
                    {isAdmin ? (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} displayEmpty>
                                <MenuItem value="">Tất cả kho</MenuItem>
                                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.85,
                            bgcolor: '#e8f5e9', borderRadius: 1.5, border: '1px solid #a5d6a7' }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#4caf50' }} />
                            <Typography fontSize={13} fontWeight={600} color="#1b5e20">
                                {warehouseMap.get(warehouseFilter)?.name || 'Kho của bạn'}
                            </Typography>
                        </Box>
                    )}
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="DRAFT">Nháp</MenuItem>
                            <MenuItem value="PENDING_APPROVAL">Chờ duyệt</MenuItem>
                            <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                            <MenuItem value="REJECTED">Bị từ chối</MenuItem>
                            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                        </Select>
                    </FormControl>
                    <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={() => refetch()}>Làm mới</Button>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Mã phiếu', 'Kho', 'Số mặt hàng', 'Lệch +', 'Lệch −', 'Trạng thái', 'Ngày tạo', 'Hành động'].map(col => (
                                    <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>{col.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7, 8].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>
                                ))
                            ) : adjs.length === 0 ? (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#999' }}>
                                    <Assignment sx={{ fontSize: 36, color: '#ccc', mb: 1, display: 'block', mx: 'auto' }} />
                                    Chưa có phiếu kiểm kê nào
                                </TableCell></TableRow>
                            ) : adjs.map(adj => {
                                const statusInfo = STATUS_MAP[adj.status];
                                const warehouse = warehouseMap.get(adj.warehouseId);
                                const plusCount = adj.items.filter(i => i.actualQty > i.systemQty).length;
                                const minusCount = adj.items.filter(i => i.actualQty < i.systemQty).length;
                                const isCreatorRow = currentUser?.id === adj.createdByUser;
                                return (
                                    <TableRow key={adj.id} hover sx={{ cursor: 'pointer' }}
                                        onClick={() => { setSelected(adj); setDetailOpen(true); }}>
                                        <TableCell><Typography fontWeight={600} fontFamily="monospace" fontSize={12}>{adj.code}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" fontSize={12}>{warehouse?.name || adj.warehouseId.slice(0, 8)}</Typography></TableCell>
                                        <TableCell><Typography fontWeight={700}>{adj.items.length}</Typography></TableCell>
                                        <TableCell>
                                            {plusCount > 0
                                                ? <Chip label={`+${plusCount}`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, height: 20, fontSize: 10 }} />
                                                : <Typography variant="caption" color="#ccc">—</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            {minusCount > 0
                                                ? <Chip label={`-${minusCount}`} size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700, height: 20, fontSize: 10 }} />
                                                : <Typography variant="caption" color="#ccc">—</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={statusInfo.label} size="small"
                                                sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700, height: 22, fontSize: 10 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontFamily="monospace" fontSize={11}>
                                                {adj.createdAt ? new Date(adj.createdAt).toLocaleDateString('vi-VN') : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Chi tiết">
                                                    <IconButton size="small" onClick={() => { setSelected(adj); setDetailOpen(true); }}
                                                        sx={{ color: '#3b82f6', '&:hover': { bgcolor: '#eff6ff' } }}>
                                                        <Visibility sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {adj.status === 'DRAFT' && !isAdmin && isCreatorRow && (
                                                    <Tooltip title="Gửi duyệt">
                                                        <IconButton size="small" onClick={() => { setSelected(adj); handleSubmit(adj.id); }}
                                                            sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fffbeb' } }}>
                                                            <Send sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {adj.status === 'PENDING_APPROVAL' && isAdmin && (
                                                    <Tooltip title="Duyệt">
                                                        <IconButton size="small" onClick={() => { setSelected(adj); handleApprove(adj.id); }}
                                                            sx={{ color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                            <CheckCircle sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {(adj.status === 'DRAFT' || adj.status === 'PENDING_APPROVAL') && !isAdmin && isCreatorRow && (
                                                    <Tooltip title="Hủy">
                                                        <IconButton size="small" onClick={() => { setSelected(adj); setCancelOpen(true); }}
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
            <AdjDetailDialog
                open={detailOpen} adj={selected} warehouses={warehouses} products={products}
                userMap={userMap}
                onClose={() => setDetailOpen(false)}
                onSubmit={handleSubmit} onApprove={handleApprove}
                onReject={() => setRejectOpen(true)} onCancel={() => setCancelOpen(true)}
                loading={actionLoading} isAdmin={isAdmin} currentUser={currentUser} />

            {/* Create Dialog */}
            <CreateAdjDialog open={createOpen} onClose={() => setCreateOpen(false)}
                onCreated={() => refetch()} warehouses={warehouses}
                currentUser={currentUser} isAdmin={isAdmin} />

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Từ chối phiếu kiểm kê</DialogTitle>
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
            <Dialog open={cancelOpen} onClose={() => { setCancelOpen(false); setCancelReason(''); }} maxWidth="xs" fullWidth>
                <DialogTitle>Hủy phiếu kiểm kê</DialogTitle>
                <DialogContent>
                    <TextField fullWidth multiline rows={3} label="Lý do hủy *" value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)} margin="normal"
                        error={cancelReason.trim().length === 0}
                        helperText={cancelReason.trim().length === 0 ? 'Vui lòng nhập lý do hủy' : ''} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCancelOpen(false); setCancelReason(''); }}>Đóng</Button>
                    <Button onClick={handleCancel} variant="contained" color="error"
                        disabled={!cancelReason.trim() || actionLoading}>Xác nhận hủy</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)}>{snack.msg}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

export default InventoryAdjustmentPage;
