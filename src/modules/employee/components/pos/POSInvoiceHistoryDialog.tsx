import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogTitle, DialogActions, Box, Typography, IconButton,
    Chip, Paper, Pagination, Skeleton, TextField, InputAdornment,
    FormControl, Select, MenuItem, Button
} from '@mui/material';
import { Close, ReceiptLong, Search, FilterList, Block } from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import toast from 'react-hot-toast';
import authService from '../../../../services/authService';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(n ?? 0);

const PAYMENT_METHOD_MAP: Record<string, { label: string; color: string; bg: string }> = {
    'CASH': { label: 'Tiền mặt', color: '#16a34a', bg: '#dcfce7' },
    'BANK_TRANSFER': { label: 'Chuyển khoản', color: '#2563eb', bg: '#dbeafe' },
    'CARD': { label: 'Quẹt thẻ', color: '#7c3aed', bg: '#ede9fe' },
    'E_WALLET': { label: 'Ví điện tử', color: '#ea580c', bg: '#ffedd5' },
};

interface InvoiceItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

interface InvoicePayment {
    method: string;
    amount: number;
}

interface InvoiceResponse {
    id: string;
    code: string;
    shiftId?: string;
    type: 'SALE' | 'RETURN' | 'VOIDED';
    finalAmount: number;
    totalAmount: number;
    discountAmount: number;
    customerName?: string;
    cashierName?: string;
    voidedByName?: string;
    voidedAt?: string;
    voidReason?: string;
    createdAt: string;
    items: InvoiceItem[];
    payments: InvoicePayment[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    shiftId?: string;
    onRefundRequest?: (invoiceCode: string) => void;
    onPrintRequest?: (invoice: InvoiceResponse) => void;
}

const POSInvoiceHistoryDialog: React.FC<Props> = ({ open, onClose, shiftId, onRefundRequest, onPrintRequest }) => {
    const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selected, setSelected] = useState<InvoiceResponse | null>(null);
    const [keyword, setKeyword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPage, setItemsPage] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // New filters
    const [paymentFilter, setPaymentFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Void invoice
    const [voidDialogOpen, setVoidDialogOpen] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [voiding, setVoiding] = useState(false);
    const currentUser = authService.getCurrentUser()?.user;
    const canVoid = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ROLE_MANAGER';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/pos/invoices?page=${page}&size=20`;
            if (searchTerm) url += `&keyword=${encodeURIComponent(searchTerm)}`;
            if (paymentFilter) url += `&paymentMethod=${encodeURIComponent(paymentFilter)}`;
            if (typeFilter) url += `&type=${encodeURIComponent(typeFilter)}`;
            
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                url += `&from=${fromDate.toISOString()}`;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                url += `&to=${toDate.toISOString()}`;
            }

            const res = await axiosInstance.get(url);
            const d = res.data?.data;
            setInvoices(d?.content ?? []);
            setTotalPages(d?.totalPages ?? 0);
        } catch (err) { 
            console.error('[History] Load failed:', err);
            setInvoices([]); 
        } finally { setLoading(false); }
    }, [page, searchTerm, paymentFilter, dateFrom, dateTo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(keyword);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => { if (open) load(); }, [open, load]);
    useEffect(() => {
        if (!open) {
            setInvoices([]); setSelected(null); setPage(0);
            setKeyword(''); setSearchTerm('');
            setPaymentFilter(''); setTypeFilter(''); setDateFrom(''); setDateTo('');
        }
    }, [open]);
    useEffect(() => { setItemsPage(0); }, [selected]);

    const handleSelect = async (inv: InvoiceResponse) => {
        try {
            const res = await axiosInstance.get(`/pos/invoices/${inv.id}`);
            setSelected(res.data?.data);
        } catch {
            setSelected(inv);
        }
    };

    const clearFilters = () => {
        setPaymentFilter(''); setTypeFilter(''); setDateFrom(''); setDateTo('');
        setPage(0);
    };

    const applyQuickDate = (val: string) => {
        const from = new Date();
        const to = new Date();
        from.setHours(0,0,0,0);
        to.setHours(23,59,59,999);
        
        if (val === 'yesterday') { from.setDate(from.getDate() - 1); to.setDate(to.getDate() - 1); }
        else if (val === 'this_week') {
            const day = from.getDay();
            from.setDate(from.getDate() - day + (day === 0 ? -6 : 1));
        } else if (val === 'this_month') {
            from.setDate(1);
        }
        
        // Format YYYY-MM-DD local time
        const toYMD = (d: Date) => {
            const tzOffset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
        };
        
        setDateFrom(toYMD(from));
        setDateTo(toYMD(to));
        setPage(0);
    };

    const hasActiveFilters = !!(paymentFilter || typeFilter || dateFrom || dateTo);

    const getPaymentLabel = (method: string) => PAYMENT_METHOD_MAP[method]?.label || method;
    const getPaymentStyle = (method: string) => PAYMENT_METHOD_MAP[method] || { label: method, color: '#64748b', bg: '#f1f5f9' };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
            PaperProps={{ sx: { borderRadius: 2, height: '85vh', overflow: 'hidden' } }}>
            <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#334155', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ReceiptLong sx={{ color: '#fff', fontSize: 18 }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={700} color="#1e293b" fontSize={15} component="div">Lịch sử Hóa đơn</Typography>
                        <Typography variant="caption" color="#64748b" component="div">Tra cứu tất cả giao dịch đã thực hiện</Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}><Close sx={{ fontSize: 20 }} /></IconButton>
            </Box>

            <Box sx={{ display: 'flex', height: 'calc(100% - 65px)', overflow: 'hidden' }}>
                {/* Left panel - Danh sách */}
                <Box sx={{ width: '40%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
                    {/* Search */}
                    <Box sx={{ p: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Mã đơn, tên KH, SĐT..."
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                                    sx: { borderRadius: 1.5, fontSize: 13, bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' } }
                                }}
                            />
                            <Button
                                size="small"
                                onClick={() => setShowFilters(p => !p)}
                                startIcon={<FilterList sx={{ fontSize: 18 }} />}
                                sx={{
                                    border: '1px solid',
                                    borderColor: hasActiveFilters ? '#3b82f6' : '#e2e8f0',
                                    borderRadius: 1.5,
                                    bgcolor: hasActiveFilters ? '#eff6ff' : 'transparent',
                                    color: hasActiveFilters ? '#3b82f6' : '#64748b',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    px: 2
                                }}
                            >
                                Lọc kết quả
                            </Button>
                        </Box>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Hôm nay', value: 'today' },
                                        { label: 'Hôm qua', value: 'yesterday' },
                                        { label: 'Tuần này', value: 'this_week' },
                                        { label: 'Tháng này', value: 'this_month' },
                                    ].map(f => (
                                        <Button key={f.value} size="small" onClick={() => applyQuickDate(f.value)}
                                            sx={{ fontSize: 11, py: 0.25, px: 1, borderRadius: 1.5, border: '1px solid #e2e8f0', color: '#475569', bgcolor: '#f8fafc', textTransform: 'none', '&:hover': { bgcolor: '#e2e8f0' } }}>
                                            {f.label}
                                        </Button>
                                    ))}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <FormControl size="small" fullWidth>
                                        <Select
                                            value={paymentFilter}
                                            onChange={e => { setPaymentFilter(e.target.value); setPage(0); }}
                                            displayEmpty
                                            sx={{ fontSize: 12, borderRadius: 1.5, '& .MuiSelect-select': { py: '6px' } }}
                                        >
                                            <MenuItem value="" sx={{ fontSize: 12 }}>Tất cả HTTT</MenuItem>
                                            <MenuItem value="CASH" sx={{ fontSize: 12 }}>💵 Tiền mặt</MenuItem>
                                            <MenuItem value="BANK_TRANSFER" sx={{ fontSize: 12 }}>🏦 Chuyển khoản</MenuItem>
                                            <MenuItem value="CARD" sx={{ fontSize: 12 }}>💳 Quẹt thẻ</MenuItem>
                                            <MenuItem value="E_WALLET" sx={{ fontSize: 12 }}>📱 Ví điện tử</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" fullWidth>
                                        <Select
                                            value={typeFilter}
                                            onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
                                            displayEmpty
                                            sx={{ fontSize: 12, borderRadius: 1.5, '& .MuiSelect-select': { py: '6px' } }}
                                        >
                                            <MenuItem value="" sx={{ fontSize: 12 }}>Tất cả loại</MenuItem>
                                            <MenuItem value="SALE" sx={{ fontSize: 12 }}>🧾 Bán hàng</MenuItem>
                                            <MenuItem value="RETURN" sx={{ fontSize: 12 }}>↩ Trả hàng</MenuItem>
                                            <MenuItem value="VOIDED" sx={{ fontSize: 12 }}>🚫 Đã hủy</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        size="small" type="date" label="Từ ngày" fullWidth
                                        value={dateFrom}
                                        onChange={e => { setDateFrom(e.target.value); setPage(0); }}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ '& .MuiOutlinedInput-root': { fontSize: 12, borderRadius: 1.5 }, '& .MuiInputLabel-root': { fontSize: 12 } }}
                                    />
                                    <TextField
                                        size="small" type="date" label="Đến ngày" fullWidth
                                        value={dateTo}
                                        onChange={e => { setDateTo(e.target.value); setPage(0); }}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ '& .MuiOutlinedInput-root': { fontSize: 12, borderRadius: 1.5 }, '& .MuiInputLabel-root': { fontSize: 12 } }}
                                    />
                                </Box>
                                {hasActiveFilters && (
                                    <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none', fontSize: 11, color: '#64748b', alignSelf: 'flex-start' }}>
                                        ✕ Xóa bộ lọc
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Invoice list */}
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {loading
                            ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={64} sx={{ m: 1 }} />)
                            : invoices.length === 0
                                ? (
                                    <Box sx={{ p: 6, textAlign: 'center' }}>
                                        <ReceiptLong sx={{ fontSize: 48, color: '#f1f5f9', mb: 1.5 }} />
                                        <Typography color="#94a3b8" fontSize={13}>Không tìm thấy hóa đơn</Typography>
                                    </Box>
                                )
                                : invoices.map((inv, idx) => (
                                    <Box key={inv.id} onClick={() => handleSelect(inv)} sx={{
                                        px: 2, py: 1.5, cursor: 'pointer',
                                        bgcolor: selected?.id === inv.id ? '#f1f5f9' : idx % 2 === 0 ? '#fff' : '#fafafa',
                                        borderLeft: `4px solid ${selected?.id === inv.id ? '#3b82f6' : 'transparent'}`,
                                        borderBottom: '1px solid #f1f5f9',
                                        transition: 'all 0.2s',
                                        '&:hover': { bgcolor: '#f8fafc' },
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" fontWeight={700} color="#1e293b" fontSize={14}>
                                                    {inv.customerName || 'Khách lẻ'}
                                                </Typography>
                                                <Typography variant="caption" color="#64748b" fontFamily="monospace" fontWeight={600} display="block">
                                                    {inv.code}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip label={inv.type === 'VOIDED' ? 'Đã hủy' : inv.type === 'RETURN' ? 'Trả hàng' : 'Bán lẻ'} size="small"
                                                        sx={{ height: 16, fontSize: 8.5, fontWeight: 700, borderRadius: 1, bgcolor: inv.type === 'VOIDED' ? '#fef3c7' : inv.type === 'RETURN' ? '#fee2e2' : '#f1f5f9', color: inv.type === 'VOIDED' ? '#d97706' : inv.type === 'RETURN' ? '#ef4444' : '#475569' }} />
                                                    {inv.payments?.map((p, pi) => {
                                                        const style = getPaymentStyle(p.method);
                                                        return (
                                                            <Chip key={pi} label={style.label} size="small"
                                                                sx={{ height: 16, fontSize: 8, fontWeight: 700, borderRadius: 1, bgcolor: style.bg, color: style.color }} />
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" fontWeight={800} fontSize={14} color="#1e293b">
                                                    {fmt(inv.finalAmount)}
                                                </Typography>
                                                <Typography variant="caption" color="#94a3b8" fontSize={11} fontWeight={600} display="block">
                                                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('vi-VN') : ''}
                                                </Typography>
                                                <Typography variant="caption" color="#8b5cf6" fontSize={11} fontWeight={700} display="block">
                                                    👤 {inv.cashierName || 'Không rõ'}
                                                </Typography>
                                                <Typography variant="caption" color="#3b82f6" fontSize={11} fontWeight={700}>
                                                    {inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                    </Box>
                    <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
                        <Typography variant="body2" color="text.secondary">
                            Trang {page + 1} / {totalPages || 1}
                        </Typography>
                        <Pagination 
                            size="small" 
                            count={totalPages || 1} 
                            page={page + 1} 
                            onChange={(_, p) => setPage(p - 1)} 
                            color="primary"
                        />
                    </Box>
                </Box>

                {/* Right panel - Chi tiết */}
                <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#f1f5f9', p: 2.5 }}>
                    {!selected ? (
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <ReceiptLong sx={{ fontSize: 56, color: '#e2e8f0' }} />
                            <Typography color="#94a3b8" fontSize={13} mt={1}>Chọn hóa đơn để xem chi tiết</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#fff', border: '1px solid #e2e8f0', mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography fontWeight={700} color="#1e293b" fontSize={16}>
                                            {selected.customerName || 'Khách lẻ'}
                                        </Typography>
                                        <Typography fontWeight={600} color="#64748b" fontFamily="monospace" fontSize={12} sx={{ mt: 0.2 }}>
                                            {selected.code}
                                        </Typography>
                                    </Box>
                                    <Chip label={selected.type === 'VOIDED' ? '🚫 Đã hủy' : selected.type === 'RETURN' ? 'Trả hàng' : 'Bán lẻ'}
                                        sx={{ bgcolor: selected.type === 'VOIDED' ? '#fef3c7' : selected.type === 'RETURN' ? '#fee2e2' : '#f1f5f9', color: selected.type === 'VOIDED' ? '#d97706' : selected.type === 'RETURN' ? '#ef4444' : '#475569', fontWeight: 700, fontSize: 10, borderRadius: 1 }} />
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5, mt: 2.5, pt: 2, borderTop: '1px dashed #e2e8f0' }}>
                                    {[
                                        { label: 'TỔNG TIỀN', value: fmt(selected.totalAmount), color: '#64748b' },
                                        { label: 'GIẢM GIÁ', value: fmt(selected.discountAmount || 0), color: '#f43f5e' },
                                        { label: 'THANH TOÁN', value: fmt(selected.finalAmount), bold: true, color: '#10b981' },
                                        { label: 'THỜI GIAN', value: selected.createdAt ? new Date(selected.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-', color: '#3b82f6' },
                                        { label: 'NHÂN VIÊN', value: selected.cashierName || 'Không rõ', color: '#8b5cf6' },
                                    ].map(r => (
                                        <Box key={r.label}>
                                            <Typography variant="caption" color="#94a3b8" display="block" fontSize={9} fontWeight={800} letterSpacing={0.5}>{r.label}</Typography>
                                            <Typography fontWeight={r.bold ? 800 : 700} color={r.bold ? r.color : "#334155"} fontSize={14}>{r.value}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                                
                                {/* Void info banner */}
                                {selected.type === 'VOIDED' && (
                                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef3c7', borderRadius: 1.5, border: '1px solid #fbbf24' }}>
                                        <Typography fontSize={12} fontWeight={700} color="#92400e">🚫 Hóa đơn đã bị hủy</Typography>
                                        <Typography fontSize={11} color="#92400e" sx={{ mt: 0.5 }}>Người hủy: {selected.voidedByName || 'Không rõ'}</Typography>
                                        <Typography fontSize={11} color="#92400e">Lý do: {selected.voidReason || 'Không có'}</Typography>
                                        {selected.voidedAt && <Typography fontSize={11} color="#92400e">Thời gian: {new Date(selected.voidedAt).toLocaleString('vi-VN')}</Typography>}
                                    </Box>
                                )}

                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    {onPrintRequest && selected.type !== 'VOIDED' && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => onPrintRequest(selected)}
                                            sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 1.5, color: '#1890ff', borderColor: '#1890ff' }}
                                        >
                                            In lại
                                        </Button>
                                    )}
                                    {onRefundRequest && selected.type === 'SALE' && (
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            onClick={() => onRefundRequest(selected.code)}
                                            sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 1.5 }}
                                        >
                                            Trả hàng
                                        </Button>
                                    )}
                                    {canVoid && selected.type === 'SALE' && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<Block sx={{ fontSize: 14 }} />}
                                            onClick={() => { setVoidReason(''); setVoidDialogOpen(true); }}
                                            sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 1.5, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}
                                        >
                                            Hủy HĐ
                                        </Button>
                                    )}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
                                <Box sx={{ width: 4, height: 16, bgcolor: '#3b82f6', borderRadius: 1 }} />
                                <Typography variant="caption" fontWeight={800} color="#475569" letterSpacing={1}>DANH SÁCH SẢN PHẨM</Typography>
                            </Box>
                            <Paper elevation={0} sx={{ borderRadius: 1, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 2 }}>
                                {(!selected.items || selected.items.length === 0) ? (
                                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#fff' }}>
                                        <Typography variant="caption" color="#94a3b8">Không có thông tin sản phẩm</Typography>
                                    </Box>
                                ) : (
                                    <>
                                        {selected.items.slice(itemsPage * ITEMS_PER_PAGE, (itemsPage + 1) * ITEMS_PER_PAGE).map((item, i) => (
                                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.25, borderBottom: i < (selected.items?.length || 0) - 1 ? '1px solid #f8fafc' : 'none', bgcolor: '#fff' }}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600} fontSize={12.5} color="#334155">{item.productName}</Typography>
                                                    <Typography variant="caption" color="#94a3b8">{fmt(item.unitPrice)} × {item.quantity}</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight={700} color="#475569">{fmt(item.subtotal)}</Typography>
                                            </Box>
                                        ))}
                                        {Math.ceil(selected.items.length / ITEMS_PER_PAGE) > 1 && (
                                            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f8fafc', bgcolor: '#fff' }}>
                                                <Pagination 
                                                    size="small" 
                                                    count={Math.ceil(selected.items.length / ITEMS_PER_PAGE)} 
                                                    page={itemsPage + 1} 
                                                    onChange={(_, p) => setItemsPage(p - 1)} 
                                                />
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Paper>

                            {selected.payments && selected.payments.length > 0 && (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
                                        <Box sx={{ width: 4, height: 16, bgcolor: '#10b981', borderRadius: 1 }} />
                                        <Typography variant="caption" fontWeight={800} color="#475569" letterSpacing={1}>THANH TOÁN</Typography>
                                    </Box>
                                    <Paper elevation={0} sx={{ borderRadius: 1, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {selected.payments.map((p, i) => {
                                            const style = getPaymentStyle(p.method);
                                            return (
                                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, bgcolor: '#fff', borderBottom: i < selected.payments.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label={style.label} size="small"
                                                            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: style.bg, color: style.color }} />
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={700} color="#334155" fontSize={13}>{fmt(p.amount)}</Typography>
                                                </Box>
                                            );
                                        })}
                                    </Paper>
                                </>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            {/* Void Confirmation Dialog */}
            <Dialog open={voidDialogOpen} onClose={() => setVoidDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: '#92400e', bgcolor: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                    🚫 Xác nhận hủy hóa đơn
                </DialogTitle>
                <Box sx={{ p: 3 }}>
                    <Typography fontSize={13} color="#64748b" mb={2}>
                        Bạn đang hủy hóa đơn <strong>{selected?.code}</strong> — {fmt(selected?.finalAmount)}.
                        Hệ thống sẽ tự động hoàn kho, hoàn điểm và ghi cashbook âm.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Lý do hủy *"
                        value={voidReason}
                        onChange={e => setVoidReason(e.target.value)}
                        placeholder="VD: Khách đổi ý, nhập sai sản phẩm..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />
                </Box>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setVoidDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Hủy bỏ</Button>
                    <Button
                        variant="contained"
                        disabled={!voidReason.trim() || voiding}
                        onClick={async () => {
                            if (!selected || !voidReason.trim()) return;
                            setVoiding(true);
                            try {
                                await axiosInstance.post(`/pos/invoices/${selected.id}/void`, {
                                    shiftId: selected.shiftId || shiftId,
                                    reason: voidReason.trim()
                                });
                                toast.success('Hủy hóa đơn thành công!');
                                setVoidDialogOpen(false);
                                setSelected(null);
                                load();
                            } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Không thể hủy hóa đơn');
                            } finally { setVoiding(false); }
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}
                    >
                        {voiding ? 'Đang xử lý...' : 'Xác nhận hủy'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default POSInvoiceHistoryDialog;