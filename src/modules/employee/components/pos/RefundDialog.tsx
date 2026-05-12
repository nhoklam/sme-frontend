import React, { useState, useCallback, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, TextField, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Divider,
    InputAdornment, Checkbox,
} from '@mui/material';
import {
    Close, Search, Undo, ReceiptLong, Remove, Add,
    CheckCircle,
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(n ?? 0);

interface InvoiceItem {
    productId: string;
    productName?: string;
    quantity: number;
    returnedQuantity?: number;
    unitPrice: number;
    subtotal: number;
}

interface Invoice {
    id: string;
    code: string;
    type: string;
    totalAmount: number;
    finalAmount: number;
    createdAt: string;
    items: InvoiceItem[];
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

const RefundDialog: React.FC<RefundDialogProps> = ({ open, onClose, shiftId, onRefundSuccess, initialInvoiceCode }) => {
    const [searchCode, setSearchCode] = useState('');
    const [searching, setSearching] = useState(false);
    const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
    const [selections, setSelections] = useState<RefundSelection[]>([]);
    const [note, setNote] = useState('');
    const [returnDest, setReturnDest] = useState('WAREHOUSE');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'search' | 'select' | 'confirm'>('search');

    const reset = useCallback(() => {
        setSearchCode('');
        setOriginalInvoice(null);
        setSelections([]);
        setNote('');
        setReturnDest('WAREHOUSE');
        setError('');
        setStep('search');
    }, []);

    const handleClose = () => {
        reset();
        onClose();
    };

    const searchInvoice = useCallback(async (codeToSearch: string) => {
        if (!codeToSearch.trim()) return;
        setSearching(true);
        setError('');
        try {
            const res = await axiosInstance.get(`/pos/invoices/code/${codeToSearch.trim()}`);
            const inv = res.data?.data;
            if (!inv) {
                setError('Không tìm thấy hóa đơn');
                return;
            }
            if (inv.type === 'RETURN') {
                setError('Không thể trả hàng cho phiếu trả hàng');
                return;
            }
            setOriginalInvoice(inv);
            const initialSelections = (inv.items || []).map((item: InvoiceItem) => {
                const alreadyReturned = item.returnedQuantity || 0;
                const remaining = item.quantity - alreadyReturned;
                return {
                    productId: item.productId,
                    productName: item.productName || `SP #${item.productId.slice(0, 8)}`,
                    maxQty: remaining,
                    returnQty: remaining > 0 ? remaining : 0,
                    unitPrice: item.unitPrice,
                    selected: remaining > 0,
                };
            });
            setSelections(initialSelections);
            if (initialSelections.every(s => s.maxQty <= 0)) {
                setError('Hóa đơn này đã được hoàn trả hết các sản phẩm');
            } else {
                setStep('select');
            }
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không tìm thấy hóa đơn');
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        if (open && initialInvoiceCode) {
            setSearchCode(initialInvoiceCode);
            searchInvoice(initialInvoiceCode);
        }
    }, [open, initialInvoiceCode, searchInvoice]);

    const toggleSelect = (idx: number) => {
        setSelections(prev => prev.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s));
    };

    const updateReturnQty = (idx: number, qty: number) => {
        setSelections(prev => prev.map((s, i) =>
            i === idx ? { ...s, returnQty: Math.max(1, Math.min(qty, s.maxQty)) } : s
        ));
    };

    const selectedItems = selections.filter(s => s.selected && s.returnQty > 0);
    const totalRefund = selectedItems.reduce((s, item) => s + item.unitPrice * item.returnQty, 0);

    const handleSubmitRefund = async () => {
        if (!originalInvoice || !shiftId || selectedItems.length === 0) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await axiosInstance.post('/pos/refund', {
                originalInvoiceId: originalInvoice.id,
                shiftId,
                items: selectedItems.map(item => ({
                    productId: item.productId,
                    quantity: item.returnQty,
                })),
                returnDestination: returnDest,
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}>

            {/* Header */}
            <DialogTitle sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: '#fef2f2', borderBottom: '1px solid #fecaca', py: 1.5, px: 2.5,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Undo sx={{ color: '#dc2626' }} />
                    <Box>
                        <Typography fontWeight={800} fontSize={15} color="#991b1b">Trả hàng</Typography>
                        <Typography variant="caption" color="#b91c1c">
                            {step === 'search' ? 'Tìm hóa đơn gốc' : step === 'select' ? 'Chọn SP trả' : 'Xác nhận'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={handleClose}><Close /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {error && (
                    <Alert severity="error" sx={{ mx: 2.5, mt: 2, borderRadius: 1.5 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Step 1: Search Invoice */}
                {step === 'search' && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="body2" color="#6b7280" mb={2}>
                            Nhập mã hóa đơn gốc để tìm kiếm
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth size="small"
                                placeholder="VD: INV-1715000000000"
                                value={searchCode}
                                onChange={e => setSearchCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchInvoice(searchCode)}
                                autoFocus
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ fontSize: 20, color: '#9ca3af' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />
                            <Button
                                variant="contained"
                                onClick={() => searchInvoice(searchCode)}
                                disabled={searching || !searchCode.trim()}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#dc2626', px: 3, '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                {searching ? <CircularProgress size={20} color="inherit" /> : 'Tìm'}
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Step 2: Select items */}
                {step === 'select' && originalInvoice && (
                    <Box sx={{ p: 0 }}>
                        {/* Original invoice info */}
                        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography fontWeight={700} fontSize={13}>
                                        <ReceiptLong sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                        {originalInvoice.code}
                                    </Typography>
                                    <Typography variant="caption" color="#6b7280">
                                        {new Date(originalInvoice.createdAt).toLocaleString('vi-VN')} · {fmt(originalInvoice.finalAmount)}
                                    </Typography>
                                </Box>
                                <Button size="small" variant="text" onClick={() => { setStep('search'); setOriginalInvoice(null); }}
                                    sx={{ textTransform: 'none', fontSize: 11, color: '#6b7280' }}>
                                    Đổi HĐ
                                </Button>
                            </Box>
                        </Box>

                        {/* Items table */}
                        <TableContainer sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#f9fafb', fontWeight: 700, fontSize: 11, color: '#6b7280', py: 1 } }}>
                                        <TableCell padding="checkbox" />
                                        <TableCell>Sản phẩm</TableCell>
                                        <TableCell align="center">Đã mua</TableCell>
                                        <TableCell align="center">SL trả</TableCell>
                                        <TableCell align="right">Hoàn trả</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selections.map((item, idx) => (
                                        <TableRow key={idx} hover sx={{ bgcolor: item.selected ? '#fef2f2' : 'transparent' }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={item.selected}
                                                    onChange={() => toggleSelect(idx)}
                                                    sx={{ color: '#dc2626', '&.Mui-checked': { color: '#dc2626' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontSize={12} fontWeight={600}>{item.productName}</Typography>
                                                <Typography variant="caption" color="#9ca3af">{fmt(item.unitPrice)}/sp</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={item.maxQty} size="small" sx={{ fontSize: 11, fontWeight: 700, bgcolor: '#e5e7eb' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <IconButton size="small" onClick={() => updateReturnQty(idx, item.returnQty - 1)}
                                                        disabled={!item.selected || item.returnQty <= 1}>
                                                        <Remove sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <Typography fontWeight={800} fontSize={13} sx={{ minWidth: 24, textAlign: 'center' }}>
                                                        {item.selected ? item.returnQty : 0}
                                                    </Typography>
                                                    <IconButton size="small" onClick={() => updateReturnQty(idx, item.returnQty + 1)}
                                                        disabled={!item.selected || item.returnQty >= item.maxQty}>
                                                        <Add sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight={700} fontSize={12} color={item.selected ? '#dc2626' : '#9ca3af'}>
                                                    {item.selected ? fmt(item.unitPrice * item.returnQty) : '—'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider />

                        {/* Note + destination */}
                        <Box sx={{ px: 2.5, py: 2 }}>
                            <TextField
                                fullWidth size="small" multiline rows={2}
                                label="Lý do trả hàng"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="VD: Khách đổi ý, sản phẩm lỗi..."
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />
                        </Box>

                        {/* Total refund */}
                        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fef2f2', borderTop: '1px solid #fecaca' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" color="#991b1b" fontWeight={600}>
                                        Tổng hoàn trả ({selectedItems.length} SP, {selectedItems.reduce((s, i) => s + i.returnQty, 0)} SL)
                                    </Typography>
                                </Box>
                                <Typography fontWeight={900} fontSize={20} color="#dc2626">{fmt(totalRefund)}</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #e5e7eb', gap: 1 }}>
                <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#6b7280' }}>Hủy</Button>
                {step === 'select' && (
                    <Button
                        variant="contained"
                        onClick={handleSubmitRefund}
                        disabled={submitting || selectedItems.length === 0}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                        sx={{
                            textTransform: 'none', fontWeight: 700, borderRadius: 1.5,
                            bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' },
                        }}
                    >
                        Xác nhận trả hàng
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default RefundDialog;
