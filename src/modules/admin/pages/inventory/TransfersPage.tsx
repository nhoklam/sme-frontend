import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
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
    CheckCircle, Send, ThumbDown, Cancel, Block,
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

// ── types ──────────────────────────────────────────────────────
type SupplementData = {
    sourceCode: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: Array<{
        productId: string;
        productName: string;
        discrepancyQty: number;
        isbnBarcode?: string;
        sku?: string;
        imageUrl?: string;
    }>;
};

// ── helpers ────────────────────────────────────────────────────
const STATUS_MAP: Record<TransferStatus, { label: string; color: string; bg: string }> = {
    DRAFT:                { label: 'Nháp',              color: '#888',    bg: '#f5f5f5' },
    PENDING_APPROVAL:     { label: 'Chờ duyệt',         color: '#e65100', bg: '#fff3e0' },
    APPROVED:             { label: 'Đã duyệt',          color: '#1565c0', bg: '#e3f2fd' },
    REJECTED:             { label: 'Bị từ chối',        color: '#d32f2f', bg: '#ffebee' },
    DISPATCHED:           { label: 'Đã xuất',           color: '#7c3aed', bg: '#ede9fe' },
    RECEIVED:             { label: 'Đã nhận',           color: '#2e7d32', bg: '#e8f5e9' },
    RECEIVED_PARTIAL:     { label: 'Nhận thiếu',        color: '#e65100', bg: '#fff3e0' },
    REJECTED_BY_RECEIVER: { label: 'Kho nhập từ chối', color: '#d32f2f', bg: '#ffebee' },
    CANCELLED:            { label: 'Đã hủy',            color: '#9e9e9e', bg: '#f5f5f5' },
};

const canApproveTransfer = (transfer: InternalTransfer, user: any): boolean => {
    if (!user || !transfer.creatorRole) return false;
    if (user.id === transfer.createdByUserId) return false;
    if (transfer.creatorRole === 'ROLE_MANAGER' && user.role === 'ROLE_ADMIN') return true;
    if (transfer.creatorRole === 'ROLE_ADMIN' && user.role === 'ROLE_MANAGER') {
        return !!user.warehouseId && String(user.warehouseId).toLowerCase() === String(transfer.fromWarehouseId).toLowerCase();
    }
    return false;
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
    onSubmit: () => void;
    onApprove: () => void;
    onReject: () => void;
    onDispatch: () => void;
    onReceive: (items: Array<{ productId: string; receivedQty: number; discrepancyReason?: string }>) => void;
    onRejectReceive: () => void;
    onCancel: () => void;
    onCreateSupplement: (transfer: InternalTransfer) => void;
    loading: boolean;
    currentUser: any;
    isAdmin: boolean;
}> = ({ open, transfer, warehouses, products, onClose, onSubmit, onApprove, onReject, onDispatch, onReceive, onRejectReceive, onCancel, onCreateSupplement, loading, currentUser, isAdmin }) => {
    const isAutoTransfer = !!transfer?.referenceOrderId;
    const userWarehouseId = currentUser?.warehouseId;
    const isFromWarehouse = !isAdmin && (userWarehouseId && transfer?.fromWarehouseId && String(userWarehouseId).toLowerCase() === String(transfer.fromWarehouseId).toLowerCase());
    const isToWarehouse = !isAdmin && (userWarehouseId && transfer?.toWarehouseId && String(userWarehouseId).toLowerCase() === String(transfer.toWarehouseId).toLowerCase());
    const isCreator = currentUser?.id === transfer?.createdByUserId;
    const fromWh = warehouses.find(w => w.id === transfer?.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === transfer?.toWarehouseId);
    const info = transfer ? (STATUS_MAP[transfer.status] ?? { label: transfer.status, color: '#888', bg: '#f5f5f5' }) : { label: '', color: '', bg: '' };
    const totalQty = transfer?.items.reduce((s, i) => s + i.quantity, 0) || 0;

    const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
    const [discrepancyReasons, setDiscrepancyReasons] = useState<Record<string, string>>({});

    React.useEffect(() => {
        if (open && transfer) {
            const init: Record<string, number> = {};
            transfer.items.forEach(item => { init[item.id] = item.quantity; });
            setReceivedQtys(init);
            setDiscrepancyReasons({});
        }
    }, [open, transfer]);

    const updateReceivedQty = (itemId: string, qty: number, maxQty: number) => {
        setReceivedQtys(prev => ({ ...prev, [itemId]: Math.min(Math.max(0, qty), maxQty) }));
    };

    const handleConfirmReceive = () => {
        if (!transfer) return;
        const items = transfer.items.map(item => {
            const receivedQty = receivedQtys[item.id] ?? item.quantity;
            const isShortItem = receivedQty < item.quantity;
            return {
                productId: item.productId,
                receivedQty,
                ...(isShortItem && discrepancyReasons[item.id]?.trim()
                    ? { discrepancyReason: discrepancyReasons[item.id].trim() }
                    : {}),
            };
        });
        onReceive(items);
    };

    const hasShortage = transfer?.items.some(item => (receivedQtys[item.id] ?? item.quantity) < item.quantity);
    const totalReceived = Object.values(receivedQtys).reduce((s, v) => s + v, 0);
    const isReceivedState = transfer?.status === 'RECEIVED' || transfer?.status === 'RECEIVED_PARTIAL';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5, maxHeight: '92vh' } }}>
            {/* ── Header ── */}
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography fontWeight={800} fontSize={17} color="#0f172a">Chi tiết phiếu chuyển</Typography>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={600} color="#1976d2" fontSize={13}>
                                {transfer?.code}
                            </Typography>
                            {transfer && (
                                <Chip label={info.label} size="small"
                                    sx={{ bgcolor: info.bg, color: info.color, fontWeight: 700, height: 22, fontSize: 11 }} />
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" mt={0.25} display="block">
                            Ngày tạo: {transfer?.createdAt ? new Date(transfer.createdAt).toLocaleString('vi-VN') : '—'}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}><Close /></IconButton>
                </Box>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ px: 3, py: 2.5 }}>
                {/* ── Kho xuất / kho nhập ── */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ p: 2, borderRadius: 2, border: '1.5px solid #fed7aa', bgcolor: '#fff7ed', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                <LocalShipping sx={{ fontSize: 15, color: '#ea580c' }} />
                                <Typography variant="caption" fontWeight={800} color="#ea580c" letterSpacing={0.5}>KHO XUẤT</Typography>
                            </Box>
                            <Typography fontWeight={700} fontSize={14} color="#1e293b">
                                {fromWh?.name || transfer?.fromWarehouseId}
                            </Typography>
                            {transfer?.dispatchedAt && (
                                <Typography variant="caption" color="#78716c" display="block" mt={0.5}>
                                    Xuất lúc: {new Date(transfer.dispatchedAt).toLocaleString('vi-VN')}
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ p: 2, borderRadius: 2, border: '1.5px solid #bbf7d0', bgcolor: '#f0fdf4', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                <ArrowForward sx={{ fontSize: 15, color: '#16a34a' }} />
                                <Typography variant="caption" fontWeight={800} color="#16a34a" letterSpacing={0.5}>KHO NHẬP</Typography>
                            </Box>
                            <Typography fontWeight={700} fontSize={14} color="#1e293b">
                                {toWh?.name || transfer?.toWarehouseId}
                            </Typography>
                            {transfer?.receivedAt && (
                                <Typography variant="caption" color="#78716c" display="block" mt={0.5}>
                                    Nhận lúc: {new Date(transfer.receivedAt).toLocaleString('vi-VN')}
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                {/* ── Stats ── */}
                <Box sx={{ display: 'grid', gridTemplateColumns: transfer?.status === 'DISPATCHED' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 1.5, mb: 2 }}>
                    {[
                        { label: 'Số mặt hàng', value: String(transfer?.items.length || 0), color: '#1e293b' },
                        { label: 'Tổng SL gửi', value: totalQty.toLocaleString(), color: '#1e293b' },
                        ...(transfer?.status === 'DISPATCHED' ? [{
                            label: 'SL sẽ nhận',
                            value: totalReceived.toLocaleString(),
                            color: hasShortage ? '#ea580c' : '#16a34a',
                        }] : []),
                    ].map(s => (
                        <Box key={s.label} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>{s.label}</Typography>
                            <Typography fontWeight={800} fontSize={16} color={s.color}>{s.value}</Typography>
                        </Box>
                    ))}
                </Box>

                {transfer?.status === 'DISPATCHED' && hasShortage && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5, fontSize: 13 }}>
                        Một số mặt hàng nhận thiếu — hệ thống sẽ chỉ cộng tồn kho theo SL thực nhận.
                    </Alert>
                )}

                {/* ── Danh sách hàng hóa ── */}
                <Typography variant="subtitle2" fontWeight={700} mb={1} color="#0f172a">Danh sách hàng hóa</Typography>
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 520 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.25, whiteSpace: 'nowrap' }}>
                                    Sản phẩm
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.25, whiteSpace: 'nowrap' }}>
                                    Mã vạch
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.25, width: 72, whiteSpace: 'nowrap' }}>
                                    SL gửi
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.25, width: 100, whiteSpace: 'nowrap' }}>
                                    {transfer?.status === 'DISPATCHED' ? 'SL thực nhận' : 'SL đã nhận'}
                                </TableCell>
                                {transfer?.status !== 'DRAFT' && (
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.25, width: 90, whiteSpace: 'nowrap' }}>
                                        Tình trạng
                                    </TableCell>
                                )}
                                {transfer?.status === 'DISPATCHED' && (
                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', py: 1.25, whiteSpace: 'nowrap' }}>
                                        Lý do chênh lệch
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transfer?.items.map((item, idx) => {
                                const p = products.get(item.productId);
                                const receivedQty = isReceivedState
                                    ? item.receivedQty
                                    : (receivedQtys[item.id] ?? item.quantity);
                                const isShort = receivedQty < item.quantity;

                                return (
                                    <TableRow key={item.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        {/* Sản phẩm */}
                                        <TableCell sx={{ py: 1.25, maxWidth: 220 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                {p?.imageUrl && (
                                                    <Box component="img" src={p.imageUrl} alt={p.name}
                                                        sx={{ width: 34, height: 44, objectFit: 'contain', borderRadius: 1,
                                                              border: '1px solid #e0e0e0', flexShrink: 0 }} />
                                                )}
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Tooltip title={p?.name || ''} placement="top" arrow enterDelay={400}>
                                                        <Typography variant="body2" fontWeight={600} fontSize={12.5} color="#1e293b"
                                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                                            {p?.name || item.productId.slice(0, 8)}
                                                        </Typography>
                                                    </Tooltip>
                                                    {p?.sku && (
                                                        <Typography variant="caption" color="#94a3b8" fontFamily="monospace" fontSize={10.5}>
                                                            {p.sku}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Mã vạch */}
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography variant="caption" fontFamily="monospace" color="#94a3b8" fontSize={11}>
                                                {p?.isbnBarcode || '—'}
                                            </Typography>
                                            {isReceivedState && item.discrepancyReason && (
                                                <Typography variant="caption" color="#ea580c" display="block" mt={0.25} fontSize={10.5}>
                                                    ⚠ {item.discrepancyReason}
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {/* SL gửi */}
                                        <TableCell align="center" sx={{ py: 1.25 }}>
                                            <Typography fontWeight={700} fontSize={13}>{item.quantity}</Typography>
                                        </TableCell>

                                        {/* SL nhận */}
                                        <TableCell align="center" sx={{ py: 1.25 }}>
                                            {transfer.status === 'DISPATCHED' ? (
                                                <TextField
                                                    size="small"
                                                    value={receivedQtys[item.id] === 0 ? '' : (receivedQtys[item.id] ?? item.quantity)}
                                                    onChange={e => {
                                                        if (e.target.value === '') { updateReceivedQty(item.id, 0, item.quantity); return; }
                                                        const v = parseInt(e.target.value, 10);
                                                        if (!isNaN(v)) updateReceivedQty(item.id, v, item.quantity);
                                                    }}
                                                    onFocus={e => e.target.select()}
                                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*',
                                                        style: { width: 60, textAlign: 'center', padding: '4px 6px' } }}
                                                    sx={{ '& .MuiOutlinedInput-root': {
                                                        bgcolor: isShort ? '#fff3e0' : '#f0fdf4',
                                                        '& fieldset': { borderColor: isShort ? '#fb923c' : '#86efac' },
                                                    }}}
                                                />
                                            ) : (
                                                <Typography fontWeight={700} fontSize={13}
                                                    color={isShort ? '#ea580c' : '#16a34a'}>
                                                    {item.receivedQty || 0}
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {/* Tình trạng */}
                                        {transfer.status !== 'DRAFT' && (
                                            <TableCell align="center" sx={{ py: 1.25 }}>
                                                {isReceivedState ? (
                                                    item.receivedQty >= item.quantity ? (
                                                        <Chip label="Đủ" size="small"
                                                            sx={{ height: 22, fontSize: 10, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                                                    ) : (
                                                        <Chip label={`Thiếu ${item.quantity - item.receivedQty}`} size="small"
                                                            sx={{ height: 22, fontSize: 10, bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 700 }} />
                                                    )
                                                ) : transfer.status === 'DISPATCHED' ? (
                                                    isShort ? (
                                                        <Chip label={`-${item.quantity - (receivedQtys[item.id] ?? item.quantity)}`} size="small"
                                                            sx={{ height: 22, fontSize: 10, bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 700 }} />
                                                    ) : (
                                                        <Chip label="Đủ" size="small"
                                                            sx={{ height: 22, fontSize: 10, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                                                    )
                                                ) : null}
                                            </TableCell>
                                        )}

                                        {/* Lý do chênh lệch */}
                                        {transfer.status === 'DISPATCHED' && (
                                            <TableCell sx={{ py: 1.25 }}>
                                                {isShort ? (
                                                    <TextField
                                                        size="small"
                                                        placeholder="Ghi rõ lý do..."
                                                        value={discrepancyReasons[item.id] || ''}
                                                        onChange={e => setDiscrepancyReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                        inputProps={{ style: { fontSize: 12 } }}
                                                        sx={{ minWidth: 160,
                                                            '& .MuiOutlinedInput-root': { bgcolor: '#fff7ed',
                                                                '& fieldset': { borderColor: '#fb923c' } } }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="#cbd5e1">—</Typography>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ── Ghi chú / lý do ── */}
                {(transfer?.rejectionReason || transfer?.cancelReason || transfer?.note) && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {transfer?.rejectionReason && (
                            <Box sx={{ p: 1.5, bgcolor: '#fff1f2', borderRadius: 1.5, border: '1px solid #fecdd3' }}>
                                <Typography variant="caption" fontWeight={700} color="#be123c">Lý do từ chối:</Typography>
                                <Typography variant="body2" color="#9f1239" mt={0.5}>{transfer.rejectionReason}</Typography>
                            </Box>
                        )}
                        {transfer?.cancelReason && (
                            <Box sx={{ p: 1.5, bgcolor: '#fff1f2', borderRadius: 1.5, border: '1px solid #fecdd3' }}>
                                <Typography variant="caption" fontWeight={700} color="#be123c">Lý do hủy:</Typography>
                                <Typography variant="body2" color="#9f1239" mt={0.5}>{transfer.cancelReason}</Typography>
                            </Box>
                        )}
                        {transfer?.note && (
                            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" fontWeight={700} color="#475569">Ghi chú:</Typography>
                                <Typography variant="body2" color="#64748b" mt={0.5}>{transfer.note}</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, flexWrap: 'wrap', borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={onClose} variant="outlined">Đóng</Button>
                <Box sx={{ flex: 1 }} />

                {/* DRAFT — Auto-transfer: kho xuất xác nhận xuất kho trực tiếp */}
                {transfer?.status === 'DRAFT' && isAutoTransfer && isFromWarehouse && (
                    <Button onClick={onDispatch} variant="contained" disabled={loading}
                        sx={{ textTransform: 'none', bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
                        {loading ? <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} /> : null}
                        {loading ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
                    </Button>
                )}

                {/* DRAFT — Manual: chỉ người tạo mới gửi duyệt / hủy */}
                {transfer?.status === 'DRAFT' && !isAutoTransfer && isCreator && !isAdmin && (
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

                {/* PENDING_APPROVAL: duyệt chéo */}
                {transfer?.status === 'PENDING_APPROVAL' && (
                    <>
                        {transfer && canApproveTransfer(transfer, currentUser) && (
                            <>
                                <Button onClick={() => onApprove()} variant="contained" disabled={loading} startIcon={<CheckCircle />}
                                    sx={{ textTransform: 'none', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
                                    Duyệt
                                </Button>
                                <Button onClick={() => onReject()} variant="contained" disabled={loading} startIcon={<ThumbDown />}
                                    sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
                                    Từ chối
                                </Button>
                            </>
                        )}
                        {isCreator && !isAdmin && (
                            <Button onClick={() => onCancel()} variant="outlined" color="error" disabled={loading} sx={{ textTransform: 'none' }}>
                                Hủy phiếu
                            </Button>
                        )}
                    </>
                )}

                {/* APPROVED: xuất kho — chỉ kho xuất */}
                {transfer?.status === 'APPROVED' && isFromWarehouse && (
                    <Button onClick={onDispatch} variant="contained" disabled={loading}
                        sx={{ textTransform: 'none', bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
                        {loading ? <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} /> : null}
                        {loading ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
                    </Button>
                )}

                {/* DISPATCHED: kho nhập nhận hàng hoặc từ chối nhận */}
                {transfer?.status === 'DISPATCHED' && isToWarehouse && (
                    <>
                        <Button onClick={() => onRejectReceive()} variant="outlined" color="error" disabled={loading} startIcon={<Block />}
                            sx={{ textTransform: 'none' }}>
                            Từ chối nhận
                        </Button>
                        <Button onClick={handleConfirmReceive} variant="contained" disabled={loading} sx={{ bgcolor: '#2e7d32' }}>
                            {loading ? <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} /> : null}
                            {loading ? 'Đang xử lý...' : hasShortage ? `Nhận hàng (${totalReceived} / ${totalQty})` : 'Xác nhận nhận hàng đủ'}
                        </Button>
                    </>
                )}

                {/* RECEIVED_PARTIAL: kho xuất tạo phiếu bổ sung */}
                {transfer?.status === 'RECEIVED_PARTIAL' && isFromWarehouse && (
                    <Button
                        onClick={() => onCreateSupplement(transfer!)}
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ textTransform: 'none', bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
                    >
                        Tạo phiếu bổ sung
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
    supplement?: SupplementData | null;
}> = ({ open, onClose, onCreated, warehouses, products, currentUser, isAdmin, supplement }) => {
    const [fromWid, setFromWid] = useState('');
    const [toWid, setToWid] = useState('');
    const [note, setNote] = useState('');
    const [cart, setCart] = useState<TransferCartItem[]>([]);
    const [kw, setKw] = useState('');
    const [creating, setCreating] = useState(false);
    const [invMap, setInvMap] = useState<Map<string, Inventory>>(new Map());
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

    const supplementRef = useRef(supplement);
    supplementRef.current = supplement;

    React.useEffect(() => {
        if (!open) {
            setFromWid((!isAdmin && currentUser?.warehouseId) ? currentUser.warehouseId : '');
            setToWid(''); setNote(''); setCart([]); setKw('');
        } else if (supplement) {
            setFromWid(supplement.fromWarehouseId);
            setToWid(supplement.toWarehouseId);
            setNote(`Phiếu bổ sung cho phiếu ${supplement.sourceCode}`);
            setCart([]);
        } else if (!isAdmin && currentUser?.warehouseId) {
            setFromWid(currentUser.warehouseId);
        }
    }, [open, isAdmin, currentUser, supplement]);

    React.useEffect(() => {
        if (!fromWid || !open) { setInvMap(new Map()); return; }
        inventoryService.getByWarehouse(fromWid)
            .then(d => {
                const m = new Map<string, Inventory>();
                d.forEach(i => m.set(i.productId, i));
                setInvMap(m);
                const sup = supplementRef.current;
                if (sup) {
                    const newCart: TransferCartItem[] = sup.items
                        .filter(si => si.discrepancyQty > 0)
                        .map(si => {
                            const inv = m.get(si.productId);
                            const available = inv?.availableQuantity || 0;
                            return {
                                productId: si.productId,
                                productName: si.productName,
                                isbnBarcode: si.isbnBarcode,
                                sku: si.sku,
                                quantity: Math.min(si.discrepancyQty, Math.max(available, 1)),
                                availableStock: available,
                                imageUrl: si.imageUrl,
                            };
                        });
                    setCart(newCart);
                }
            })
            .catch(() => setInvMap(new Map()));
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
        // Cho phép qty=0 trong khi đang gõ (blur sẽ clamp lại)
        const clamped = qty <= 0 ? 0 : Math.min(qty, item.availableStock);
        setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: clamped } : i));
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
                    <Typography fontWeight={800} fontSize={16}>
                        {supplement ? `Tạo Phiếu Bổ Sung — ${supplement.sourceCode}` : 'Tạo Phiếu Chuyển Kho'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {supplement
                            ? 'Chỉ bổ sung các mặt hàng còn thiếu. Phiếu sẽ ở trạng thái NHÁP.'
                            : 'Phiếu sẽ ở trạng thái NHÁP cho đến khi gửi duyệt'}
                    </Typography>
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
                            <Select value={toWid} onChange={e => setToWid(e.target.value)} displayEmpty disabled={!!supplement}>
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
                                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 350
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
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300
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
                                                <TextField size="small"
                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                    onChange={e => {
                                                        if (e.target.value === '') { updateQty(item.productId, 0); return; }
                                                        const v = parseInt(e.target.value, 10);
                                                        if (!isNaN(v)) updateQty(item.productId, v);
                                                    }}
                                                    onBlur={() => {
                                                        if (item.quantity < 1) updateQty(item.productId, 1);
                                                    }}
                                                    onFocus={e => e.target.select()}
                                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { width: 70, textAlign: 'center' } }} />
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

// ── Lọc thông báo lỗi từ backend — ẩn lỗi kỹ thuật dài ──────
const getFriendlyError = (e: any, fallback: string): string => {
    const msg: string = e?.response?.data?.message || '';
    if (msg.includes('status_check') || msg.includes('internal_transfers_status_check')) {
        return 'Phiếu này không thể gửi duyệt — trạng thái không hợp lệ trong hệ thống. Vui lòng tạo phiếu mới.';
    }
    if (msg.includes('constraint') && msg.includes('internal_transfers')) {
        return 'Lỗi ràng buộc dữ liệu phiếu chuyển kho. Vui lòng liên hệ quản trị viên.';
    }
    if (msg && msg.length < 120 && !/Exception|batch|SQL|hibernate|constraint|execute/i.test(msg)) {
        return msg;
    }
    return fallback;
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
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [rejectReceiveOpen, setRejectReceiveOpen] = useState(false);
    const [rejectReceiveReason, setRejectReceiveReason] = useState('');
    const [supplementData, setSupplementData] = useState<SupplementData | null>(null);
    const PAGE_SIZE = 15;

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const qc = useQueryClient();

    const { data: transfers, isLoading } = useQuery({
        queryKey: ['transfers', page, statusFilter, keyword],
        queryFn: () => transferService.getAll({ page, size: PAGE_SIZE, status: statusFilter || undefined, keyword: keyword || undefined }),
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    const transfersList = React.useMemo(() => transfers?.content ?? [], [transfers]);

    const prevStatusRef = useRef<Map<string, string>>(new Map());
    const isFirstTransferLoadRef = useRef(true);

    useEffect(() => {
        if (!transfersList.length) return;
        if (isFirstTransferLoadRef.current) {
            const m = new Map<string, string>();
            transfersList.forEach(t => m.set(t.id, t.status));
            prevStatusRef.current = m;
            isFirstTransferLoadRef.current = false;
            return;
        }
        const prev = prevStatusRef.current;
        transfersList.forEach(t => {
            const oldStatus = prev.get(t.id);
            if (!oldStatus || oldStatus === t.status) return;
            const s = t.status as string;
            if (!isAdmin && s === 'APPROVED') {
                toast.success(`Phiếu ${t.code} đã được duyệt — có thể xuất kho!`, { duration: 6000, icon: '✅' });
                qc.invalidateQueries({ queryKey: ['inventory-all'] });
            } else if (!isAdmin && s === 'REJECTED') {
                toast.error(`Phiếu ${t.code} bị từ chối duyệt`, { duration: 6000, icon: '❌' });
            } else if (!isAdmin && s === 'DISPATCHED') {
                toast(`Phiếu ${t.code} đã xuất kho — đang vận chuyển`, { duration: 5000, icon: '🚚' });
            } else if (!isAdmin && s === 'RECEIVED') {
                toast.success(`Phiếu ${t.code} — kho nhập đã nhận đủ hàng!`, { duration: 6000, icon: '✅' });
                qc.invalidateQueries({ queryKey: ['inventory-all'] });
            } else if (!isAdmin && s === 'RECEIVED_PARTIAL') {
                toast.error(`Phiếu ${t.code} — kho nhập nhận THIẾU hàng! Kiểm tra chi tiết.`, { duration: 8000, icon: '⚠️' });
                qc.invalidateQueries({ queryKey: ['inventory-all'] });
            } else if (!isAdmin && s === 'REJECTED_BY_RECEIVER') {
                toast.error(`Phiếu ${t.code} — kho nhập TỪ CHỐI nhận hàng! Hàng hoàn về kho xuất.`, { duration: 8000, icon: '❌' });
                qc.invalidateQueries({ queryKey: ['inventory-all'] });
            } else if (isAdmin && s === 'PENDING_APPROVAL') {
                toast(`Phiếu ${t.code} chờ duyệt`, { duration: 5000, icon: '📋' });
            } else if (isAdmin && s === 'RECEIVED_PARTIAL') {
                toast.error(`Phiếu ${t.code} nhận thiếu — xem chi tiết để biết số lượng chênh lệch!`, { duration: 8000, icon: '⚠️' });
            }
        });
        const m = new Map<string, string>();
        transfersList.forEach(t => m.set(t.id, t.status));
        prevStatusRef.current = m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transfersList]);

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

    const handleSubmit = async (transferId?: string) => {
        const id = (typeof transferId === 'string') ? transferId : selected?.id;
        if (!id || actionLoading) return;
        setActionLoading(true);
        try {
            const result = await transferService.submit(id);
            console.log('[Transfer] submit OK:', result);
            toast.success('Đã gửi phiếu chuyển để duyệt!');
            setDetailOpen(false); refresh();
        } catch (e: any) {
            const status = e?.response?.status;
            const data = e?.response?.data;
            console.error('[Transfer] submit FAILED', {
                transferId: id,
                httpStatus: status,
                responseBody: data,
                message: data?.message,
                error: data?.error,
            });
            toast.error(getFriendlyError(e, 'Gửi duyệt thất bại — phiếu có thể đang ở trạng thái không hợp lệ'));
        } finally { setActionLoading(false); }
    };

    const handleApprove = async (transferId?: string) => {
        const id = (typeof transferId === 'string') ? transferId : selected?.id;
        if (!id || actionLoading) return;
        setActionLoading(true);
        try {
            await transferService.approve(id);
            toast.success('Duyệt phiếu chuyển thành công!');
            setDetailOpen(false); refresh();
        } catch (e: any) {
            toast.error(getFriendlyError(e, 'Duyệt thất bại'));
        } finally { setActionLoading(false); }
    };

    const handleRejectConfirm = async () => {
        if (!selected || !rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await transferService.reject(selected.id, rejectReason);
            toast.success('Đã từ chối phiếu chuyển.');
            setRejectOpen(false); setRejectReason(''); setDetailOpen(false); refresh();
        } catch (e: any) {
            toast.error(getFriendlyError(e, 'Từ chối thất bại'));
        } finally { setActionLoading(false); }
    };

    const handleCancel = async () => {
        if (!selected || !cancelReason.trim()) return;
        setActionLoading(true);
        try {
            await transferService.cancel(selected.id, cancelReason);
            toast.success('Đã hủy phiếu chuyển kho.');
            setCancelOpen(false); setCancelReason(''); setDetailOpen(false); refresh();
        } catch (e: any) {
            toast.error(getFriendlyError(e, 'Hủy thất bại'));
        } finally { setActionLoading(false); }
    };

    const handleDispatch = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await transferService.dispatch(selected.id);
            toast.success('Xác nhận xuất kho thành công!');
            setDetailOpen(false);
            refresh();
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            toast.error(getFriendlyError(e, 'Xuất kho thất bại'));
        } finally { setActionLoading(false); }
    };

    const handleDispatchDirect = async (transferId: string) => {
        setActionLoading(true);
        try {
            await transferService.dispatch(transferId);
            toast.success('Xác nhận xuất kho thành công!');
            refresh();
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            toast.error(getFriendlyError(e, 'Xuất kho thất bại'));
        } finally { setActionLoading(false); }
    };

    const handleReceive = async (items: Array<{ productId: string; receivedQty: number }>) => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await transferService.receive(selected.id, items);
            toast.success('Xác nhận nhận hàng thành công!');
            setDetailOpen(false);
            refresh();
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            toast.error(getFriendlyError(e, 'Nhận hàng thất bại'));
        } finally { setActionLoading(false); }
    };

    const handleRejectReceiveConfirm = async () => {
        if (!selected || !rejectReceiveReason.trim()) return;
        setActionLoading(true);
        try {
            await transferService.rejectReceive(selected.id, rejectReceiveReason);
            toast.success('Đã từ chối nhận hàng. Tồn kho kho xuất sẽ được hoàn lại.');
            setRejectReceiveOpen(false); setRejectReceiveReason(''); setDetailOpen(false); refresh();
            qc.invalidateQueries({ queryKey: ['inventory-all'] });
        } catch (e: any) {
            toast.error(getFriendlyError(e, 'Từ chối nhận hàng thất bại'));
        } finally { setActionLoading(false); }
    };

    const handleCreateSupplement = (transfer: InternalTransfer) => {
        const shortItems = transfer.items
            .filter(item => (item.discrepancyQty ?? 0) > 0)
            .map(item => {
                const p = productMap.get(item.productId);
                return {
                    productId: item.productId,
                    productName: p?.name ?? item.productId,
                    discrepancyQty: item.discrepancyQty!,
                    isbnBarcode: p?.isbnBarcode,
                    sku: p?.sku,
                    imageUrl: p?.imageUrl,
                };
            });
        setSupplementData({
            sourceCode: transfer.code,
            fromWarehouseId: transfer.fromWarehouseId,
            toWarehouseId: transfer.toWarehouseId,
            items: shortItems,
        });
        setDetailOpen(false);
        setCreateOpen(true);
    };

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
                { header: 'Trạng thái', key: 'status', width: 18 },
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
                    {!isAdmin && (
                        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
                            sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1d4ed8' } }}>
                            Tạo phiếu chuyển
                        </Button>
                    )}
                </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Tìm theo mã phiếu..."
                        value={keyword} onChange={e => setKeyword(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="DRAFT">Nháp</MenuItem>
                            <MenuItem value="PENDING_APPROVAL">Chờ duyệt</MenuItem>
                            <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                            <MenuItem value="REJECTED">Bị từ chối</MenuItem>
                            <MenuItem value="DISPATCHED">Đã xuất</MenuItem>
                            <MenuItem value="RECEIVED">Đã nhận</MenuItem>
                            <MenuItem value="RECEIVED_PARTIAL">Nhận thiếu</MenuItem>
                            <MenuItem value="REJECTED_BY_RECEIVER">Kho nhập từ chối</MenuItem>
                            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
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
                                const info = STATUS_MAP[t.status] ?? { label: t.status, color: '#888', bg: '#f5f5f5' };
                                const fromWh = warehouseMap.get(t.fromWarehouseId);
                                const toWh = warehouseMap.get(t.toWarehouseId);
                                const totalQty = t.items.reduce((s, i) => s + i.quantity, 0);
                                const totalReceived = t.items.reduce((s, i) => s + (i.receivedQty || 0), 0);
                                const isReceivedState = t.status === 'RECEIVED' || t.status === 'RECEIVED_PARTIAL';
                                const hasShortage = isReceivedState && totalReceived < totalQty;
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
                                            {isReceivedState ? (
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
                                            {(() => {
                                                const isAuto = !!t.referenceOrderId;
                                                const isFromWh = !isAdmin && (currentUser?.warehouseId && String(currentUser.warehouseId).toLowerCase() === String(t.fromWarehouseId).toLowerCase());
                                                const isToWh = !isAdmin && (currentUser?.warehouseId && String(currentUser.warehouseId).toLowerCase() === String(t.toWarehouseId).toLowerCase());
                                                const isCreatorRow = currentUser?.id === t.createdByUserId;
                                                return (
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Tooltip title="Chi tiết">
                                                            <IconButton size="small" onClick={() => { setSelected(t); setDetailOpen(true); }}
                                                                sx={{ color: '#3b82f6', '&:hover': { bgcolor: '#eff6ff' } }}>
                                                                <Visibility sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {/* DRAFT + Auto: kho xuất xác nhận xuất */}
                                                        {t.status === 'DRAFT' && isAuto && isFromWh && (
                                                            <Tooltip title="Xuất kho">
                                                                <span>
                                                                    <IconButton size="small" disabled={actionLoading}
                                                                        onClick={() => { setSelected(t); handleDispatchDirect(t.id); }}
                                                                        sx={{ color: '#7c3aed', '&:hover': { bgcolor: '#ede9fe' } }}>
                                                                        <LocalShipping sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {/* DRAFT + Manual: chỉ người tạo mới gửi duyệt */}
                                                        {t.status === 'DRAFT' && !isAuto && isCreatorRow && !isAdmin && (
                                                            <Tooltip title="Gửi duyệt">
                                                                <span>
                                                                    <IconButton size="small" disabled={actionLoading}
                                                                        onClick={() => { setSelected(t); handleSubmit(t.id); }}
                                                                        sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fffbeb' } }}>
                                                                        <Send sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {/* PENDING_APPROVAL: duyệt chéo */}
                                                        {t.status === 'PENDING_APPROVAL' && canApproveTransfer(t, currentUser) && (
                                                            <Tooltip title="Duyệt">
                                                                <span>
                                                                    <IconButton size="small" disabled={actionLoading}
                                                                        onClick={() => { setSelected(t); handleApprove(t.id); }}
                                                                        sx={{ color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                                        <CheckCircle sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {/* APPROVED: kho xuất xác nhận xuất */}
                                                        {t.status === 'APPROVED' && isFromWh && (
                                                            <Tooltip title="Xuất kho">
                                                                <span>
                                                                    <IconButton size="small" disabled={actionLoading}
                                                                        onClick={() => { setSelected(t); handleDispatchDirect(t.id); }}
                                                                        sx={{ color: '#7c3aed', '&:hover': { bgcolor: '#ede9fe' } }}>
                                                                        <LocalShipping sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {/* DISPATCHED: kho nhập nhận hàng hoặc từ chối */}
                                                        {t.status === 'DISPATCHED' && isToWh && (
                                                            <Tooltip title="Nhận hàng">
                                                                <IconButton size="small" onClick={() => { setSelected(t); setDetailOpen(true); }}
                                                                    sx={{ color: '#2e7d32', '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                                    <CheckCircle sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {/* Hủy: chỉ người tạo, DRAFT/PENDING, không phải auto */}
                                                        {(t.status === 'DRAFT' || t.status === 'PENDING_APPROVAL') && !isAuto && isCreatorRow && !isAdmin && (
                                                            <Tooltip title="Hủy">
                                                                <IconButton size="small" onClick={() => { setSelected(t); setCancelOpen(true); }}
                                                                    sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                                                                    <Cancel sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                );
                                            })()}
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
                onSubmit={handleSubmit}
                onApprove={handleApprove}
                onReject={() => setRejectOpen(true)}
                onDispatch={handleDispatch}
                onReceive={handleReceive}
                onRejectReceive={() => setRejectReceiveOpen(true)}
                onCancel={() => setCancelOpen(true)}
                onCreateSupplement={handleCreateSupplement}
                loading={actionLoading}
                currentUser={currentUser}
                isAdmin={isAdmin}
            />
            <CreateTransferDialog
                open={createOpen}
                onClose={() => { setCreateOpen(false); setSupplementData(null); }}
                onCreated={refresh}
                warehouses={warehouses}
                products={productsData}
                currentUser={currentUser}
                isAdmin={isAdmin}
                supplement={supplementData}
            />

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Từ chối phiếu chuyển kho</DialogTitle>
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
                <DialogTitle>Hủy phiếu chuyển kho</DialogTitle>
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

            {/* Reject Receive Dialog */}
            <Dialog open={rejectReceiveOpen} onClose={() => { setRejectReceiveOpen(false); setRejectReceiveReason(''); }} maxWidth="xs" fullWidth>
                <DialogTitle>Từ chối nhận hàng</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
                        Toàn bộ hàng sẽ được trả lại kho xuất. Tồn kho kho xuất sẽ được hoàn lại tự động.
                    </Alert>
                    <TextField fullWidth multiline rows={3} label="Lý do từ chối nhận *" value={rejectReceiveReason}
                        onChange={e => setRejectReceiveReason(e.target.value)}
                        error={rejectReceiveReason.trim().length === 0}
                        helperText={rejectReceiveReason.trim().length === 0 ? 'Vui lòng nhập lý do' : ''} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setRejectReceiveOpen(false); setRejectReceiveReason(''); }}>Đóng</Button>
                    <Button onClick={handleRejectReceiveConfirm} variant="contained" color="error"
                        disabled={!rejectReceiveReason.trim() || actionLoading}>Xác nhận từ chối nhận</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default TransfersPage;
