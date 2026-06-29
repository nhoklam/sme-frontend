import React, { useState, useCallback, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Typography, Button, TextField, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Divider, Pagination,
    InputAdornment, Checkbox, Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import {
    Close, Search, Undo, ReceiptLong, Remove, Add,
    CheckCircle, ArrowBack, Person, CalendarToday, MonetizationOn,
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('vi-VN') : '—';

interface InvoiceSummary {
    id: string;
    code: string;
    createdAt: string;
    cashierName?: string;
    customerName?: string;
    customerPhone?: string;
    finalAmount: number;
    totalAmount: number;
}

interface InvoiceItem {
    productId: string;
    productName?: string;
    quantity: number;
    returnedQuantity?: number;
    unitPrice: number;
    subtotal: number;
}

interface InvoiceDetail extends InvoiceSummary {
    items: InvoiceItem[];
    type: string;
}

interface RefundSelection {
    productId: string;
    productName: string;
    maxQty: number;
    returnQty: number;
    unitPrice: number;
    selected: boolean;
}

interface RefundDialogProps {
    open: boolean;
    onClose: () => void;
    shiftId: string | null;
    onRefundSuccess: (invoice: any) => void;
    initialInvoiceCode?: string;
}

const PAGE_SIZE = 10;

const RefundDialog: React.FC<RefundDialogProps> = ({ open, onClose, shiftId, onRefundSuccess, initialInvoiceCode }) => {
    // list step
    const [keyword, setKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [listLoading, setListLoading] = useState(false);

    // detail step
    const [step, setStep] = useState<'list' | 'detail'>('list');
    const [detail, setDetail] = useState<InvoiceDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selections, setSelections] = useState<RefundSelection[]>([]);
    const [note, setNote] = useState('');
    const [refundMethod, setRefundMethod] = useState('CASH');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const reset = useCallback(() => {
        setKeyword('');
        setSearchInput('');
        setPage(1);
        setInvoices([]);
        setTotalPages(0);
        setTotalElements(0);
        setStep('list');
        setDetail(null);
        setSelections([]);
        setNote('');
        setRefundMethod('CASH');
        setError('');
    }, []);

    const handleClose = () => { reset(); onClose(); };

    // Fetch invoice list
    const fetchInvoices = useCallback(async (kw: string, pg: number) => {
        setListLoading(true);
        setError('');
        try {
            const res = await axiosInstance.get('/pos/invoices', {
                params: { type: 'SALE', keyword: kw || undefined, page: pg - 1, size: PAGE_SIZE },
            });
            const paged = res.data?.data;
            setInvoices(paged?.content ?? []);
            setTotalPages(paged?.totalPages ?? 0);
            setTotalElements(paged?.totalElements ?? 0);
        } catch {
            setError('Không tải được danh sách hóa đơn');
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchInvoices(keyword, page);
        }
    }, [open, keyword, page, fetchInvoices]);

    useEffect(() => {
        if (!open) reset();
    }, [open, reset]);

    // If initialInvoiceCode passed, auto-search in list
    useEffect(() => {
        if (open && initialInvoiceCode) {
            setSearchInput(initialInvoiceCode);
            setKeyword(initialInvoiceCode);
            setPage(1);
        }
    }, [open, initialInvoiceCode]);

    const handleSearch = () => {
        setKeyword(searchInput.trim());
        setPage(1);
    };

    // Load invoice detail when selecting
    const handleSelectInvoice = async (inv: InvoiceSummary) => {
        setDetailLoading(true);
        setError('');
        try {
            const res = await axiosInstance.get(`/pos/invoices/${inv.id}`);
            const d: InvoiceDetail = res.data?.data;
            if (d.type === 'RETURN') {
                setError('Không thể trả hàng cho phiếu trả hàng');
                return;
            }
            setDetail(d);
            const sels = (d.items || []).map((item: InvoiceItem) => {
                const alreadyReturned = item.returnedQuantity || 0;
                const remaining = item.quantity - alreadyReturned;
                return {
                    productId: item.productId,
                    productName: item.productName || `SP #${item.productId.slice(0, 8)}`,
                    maxQty: remaining,
                    returnQty: remaining > 0 ? remaining : 0,
                    unitPrice: Number(item.unitPrice),
                    selected: remaining > 0,
                };
            });
            if (sels.every(s => s.maxQty <= 0)) {
                setError('Hóa đơn này đã được hoàn trả hết các sản phẩm');
                return;
            }
            setSelections(sels);
            setStep('detail');
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không tải được chi tiết hóa đơn');
        } finally {
            setDetailLoading(false);
        }
    };

    const toggleSelect = (idx: number) =>
        setSelections(prev => prev.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s));

    const updateReturnQty = (idx: number, qty: number) =>
        setSelections(prev => prev.map((s, i) =>
            i === idx ? { ...s, returnQty: Math.max(1, Math.min(qty, s.maxQty)) } : s));

    const selectedItems = selections.filter(s => s.selected && s.returnQty > 0);
    const totalRefund = selectedItems.reduce((s, item) => s + item.unitPrice * item.returnQty, 0);

    const handleSubmit = async () => {
        if (!detail || !shiftId || selectedItems.length === 0) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await axiosInstance.post('/pos/refund', {
                originalInvoiceId: detail.id,
                shiftId,
                items: selectedItems.map(item => ({ productId: item.productId, quantity: item.returnQty })),
                returnDestination: 'WAREHOUSE',
                note: note || undefined,
            });
            onRefundSuccess(res.data?.data);
            handleClose();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Trả hàng thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden', maxHeight: '90vh' } }}>

            {/* Header */}
            <DialogTitle sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: '#fff7f7', borderBottom: '1px solid #fde8e8', py: 1.5, px: 2.5,
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    {step === 'detail' && (
                        <IconButton size="small" onClick={() => { setStep('list'); setDetail(null); setError(''); }}
                            sx={{ color: '#dc2626', mr: 0.5 }}>
                            <ArrowBack fontSize="small" />
                        </IconButton>
                    )}
                    <Undo sx={{ color: '#dc2626', fontSize: 20 }} />
                    <Box>
                        <Typography fontWeight={800} fontSize={15} color="#991b1b">Đổi trả hàng</Typography>
                        <Typography variant="caption" color="#b91c1c">
                            {step === 'list' ? 'Chọn hóa đơn cần trả' : `HĐ: ${detail?.code}`}
                        </Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={handleClose}><Close fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                {error && (
                    <Alert severity="error" sx={{ mx: 2, mt: 1.5, borderRadius: 1.5, py: 0.5 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* ─── STEP: LIST ─── */}
                {step === 'list' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        {/* Search bar */}
                        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 1 }}>
                            <TextField
                                size="small" fullWidth
                                placeholder="Tìm theo mã đơn, tên khách hàng, SĐT..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                autoFocus
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
                                    sx: { borderRadius: 1.5, fontSize: 13 },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSearch}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#dc2626', px: 2.5, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                Tìm kiếm
                            </Button>
                        </Box>

                        {/* Table */}
                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            {listLoading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                                    <CircularProgress size={32} sx={{ color: '#dc2626' }} />
                                </Box>
                            ) : invoices.length === 0 ? (
                                <Box display="flex" flexDirection="column" alignItems="center" py={6} color="#9ca3af">
                                    <ReceiptLong sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                                    <Typography fontSize={13}>Không tìm thấy hóa đơn nào</Typography>
                                </Box>
                            ) : (
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{ '& th': { bgcolor: '#f9fafb', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.25, borderBottom: '1px solid #e5e7eb' } }}>
                                            <TableCell>Mã đơn</TableCell>
                                            <TableCell><CalendarToday sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />Ngày tạo</TableCell>
                                            <TableCell>Nhân viên</TableCell>
                                            <TableCell>Khách hàng</TableCell>
                                            <TableCell align="right">Tổng tiền</TableCell>
                                            <TableCell align="center" />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {invoices.map(inv => (
                                            <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: '#fef2f2' } }}>
                                                <TableCell>
                                                    <Typography fontSize={12} fontWeight={700} color="#1890ff">{inv.code}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={12} color="#374151">{fmtDate(inv.createdAt)}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <Person sx={{ fontSize: 13, color: '#9ca3af' }} />
                                                        <Typography fontSize={12} color="#374151">{inv.cashierName || '—'}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={12} color="#374151">{inv.customerName || 'Khách lẻ'}</Typography>
                                                    {inv.customerPhone && <Typography variant="caption" color="#9ca3af">{inv.customerPhone}</Typography>}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography fontSize={13} fontWeight={700} color="#262626">{fmt(inv.finalAmount)}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Button
                                                        size="small" variant="outlined"
                                                        disabled={detailLoading}
                                                        onClick={() => handleSelectInvoice(inv)}
                                                        sx={{ textTransform: 'none', fontSize: 11.5, fontWeight: 700, color: '#dc2626', borderColor: '#fca5a5', borderRadius: 1.5, px: 1.5, py: 0.4, '&:hover': { bgcolor: '#fef2f2', borderColor: '#dc2626' } }}
                                                    >
                                                        {detailLoading ? <CircularProgress size={12} /> : 'Chọn đơn'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Box>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.25, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                                <Typography variant="caption" color="#6b7280">
                                    Hiển thị {invoices.length} / {totalElements} hóa đơn
                                </Typography>
                                <Pagination
                                    count={totalPages} page={page} size="small"
                                    onChange={(_, v) => setPage(v)}
                                    sx={{ '& .MuiPaginationItem-root': { fontSize: 12 }, '& .Mui-selected': { bgcolor: '#dc2626 !important', color: '#fff' } }}
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {/* ─── STEP: DETAIL ─── */}
                {step === 'detail' && detail && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        {/* Invoice info header */}
                        <Box sx={{ px: 2.5, py: 1.25, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 3 }}>
                            <Box display="flex" alignItems="center" gap={0.75}>
                                <ReceiptLong sx={{ fontSize: 14, color: '#6b7280' }} />
                                <Typography fontSize={12} color="#6b7280">Mã HĐ:</Typography>
                                <Typography fontSize={12} fontWeight={700} color="#1890ff">{detail.code}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.75}>
                                <CalendarToday sx={{ fontSize: 13, color: '#6b7280' }} />
                                <Typography fontSize={12} color="#6b7280">{fmtDate(detail.createdAt)}</Typography>
                            </Box>
                            {detail.customerName && (
                                <Box display="flex" alignItems="center" gap={0.75}>
                                    <Person sx={{ fontSize: 14, color: '#6b7280' }} />
                                    <Typography fontSize={12} color="#374151">{detail.customerName}</Typography>
                                </Box>
                            )}
                            <Box display="flex" alignItems="center" gap={0.75}>
                                <MonetizationOn sx={{ fontSize: 14, color: '#6b7280' }} />
                                <Typography fontSize={12} fontWeight={700} color="#262626">{fmt(detail.finalAmount)}</Typography>
                            </Box>
                        </Box>

                        {/* Items table */}
                        <TableContainer sx={{ flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#f9fafb', fontWeight: 700, fontSize: 11.5, color: '#6b7280', py: 1, borderBottom: '1px solid #e5e7eb' } }}>
                                        <TableCell padding="checkbox" />
                                        <TableCell>Sản phẩm</TableCell>
                                        <TableCell align="center">Đã mua</TableCell>
                                        <TableCell align="center">Có thể trả</TableCell>
                                        <TableCell align="center">SL trả</TableCell>
                                        <TableCell align="right">Hoàn tiền</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selections.map((item, idx) => (
                                        <TableRow key={idx} sx={{ bgcolor: item.selected ? '#fef9f9' : 'transparent', opacity: item.maxQty <= 0 ? 0.45 : 1 }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={item.selected}
                                                    disabled={item.maxQty <= 0}
                                                    onChange={() => toggleSelect(idx)}
                                                    sx={{ color: '#dc2626', '&.Mui-checked': { color: '#dc2626' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontSize={12} fontWeight={600} color="#262626">{item.productName}</Typography>
                                                <Typography variant="caption" color="#9ca3af">{fmt(item.unitPrice)}/sp</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={item.maxQty + (item.maxQty < (detail.items.find(i => i.productId === item.productId)?.quantity ?? item.maxQty) ? ` / ${detail.items.find(i => i.productId === item.productId)?.quantity}` : '')}
                                                    size="small" sx={{ fontSize: 11, fontWeight: 700, bgcolor: '#e5e7eb' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={item.maxQty} size="small"
                                                    sx={{ fontSize: 11, fontWeight: 700, bgcolor: item.maxQty > 0 ? '#dcfce7' : '#fee2e2', color: item.maxQty > 0 ? '#15803d' : '#991b1b' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                                    <IconButton size="small" onClick={() => updateReturnQty(idx, item.returnQty - 1)}
                                                        disabled={!item.selected || item.returnQty <= 1 || item.maxQty <= 0}
                                                        sx={{ width: 22, height: 22, bgcolor: '#f3f4f6', '&:hover': { bgcolor: '#e5e7eb' } }}>
                                                        <Remove sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                    <Typography fontWeight={800} fontSize={13} sx={{ minWidth: 22, textAlign: 'center', color: item.selected ? '#dc2626' : '#9ca3af' }}>
                                                        {item.selected ? item.returnQty : 0}
                                                    </Typography>
                                                    <IconButton size="small" onClick={() => updateReturnQty(idx, item.returnQty + 1)}
                                                        disabled={!item.selected || item.returnQty >= item.maxQty || item.maxQty <= 0}
                                                        sx={{ width: 22, height: 22, bgcolor: '#f3f4f6', '&:hover': { bgcolor: '#e5e7eb' } }}>
                                                        <Add sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight={700} fontSize={12} color={item.selected && item.maxQty > 0 ? '#dc2626' : '#d1d5db'}>
                                                    {item.selected && item.maxQty > 0 ? fmt(item.unitPrice * item.returnQty) : '—'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider />

                        {/* Note + Refund method */}
                        <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
                            <Box display="flex" gap={2}>
                                <Box flex={1}>
                                    <TextField
                                        fullWidth size="small" multiline rows={2}
                                        label="Lý do trả hàng"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="VD: Khách đổi ý, sản phẩm lỗi..."
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 13 } }}
                                    />
                                </Box>
                                <Box minWidth={180}>
                                    <Typography fontSize={12} fontWeight={600} color="#595959" mb={0.5}>Hình thức hoàn tiền</Typography>
                                    <RadioGroup value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                                        <FormControlLabel value="CASH" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#dc2626' } }} />}
                                            label={<Typography fontSize={12}>Tiền mặt</Typography>} sx={{ m: 0 }} />
                                        <FormControlLabel value="BANK_TRANSFER" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#dc2626' } }} />}
                                            label={<Typography fontSize={12}>Chuyển khoản</Typography>} sx={{ m: 0 }} />
                                    </RadioGroup>
                                </Box>
                            </Box>
                        </Box>

                        {/* Total refund banner */}
                        <Box sx={{ mx: 2.5, mb: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1.5, px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="caption" color="#991b1b" fontWeight={600}>
                                    Tổng hoàn trả — {selectedItems.length} sản phẩm, {selectedItems.reduce((s, i) => s + i.returnQty, 0)} đơn vị
                                </Typography>
                                <Typography variant="caption" color="#b91c1c" sx={{ display: 'block', fontSize: 11 }}>
                                    Hoàn tiền qua: {refundMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                                </Typography>
                            </Box>
                            <Typography fontWeight={900} fontSize={22} color="#dc2626">{fmt(totalRefund)}</Typography>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ px: 2.5, pb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button onClick={() => { setStep('list'); setDetail(null); setError(''); }}
                                sx={{ textTransform: 'none', color: '#6b7280' }}>
                                Quay lại
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={submitting || selectedItems.length === 0}
                                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, px: 3 }}
                            >
                                Xác nhận trả hàng
                            </Button>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RefundDialog;
