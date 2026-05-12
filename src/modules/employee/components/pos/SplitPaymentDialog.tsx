import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, TextField, Button, IconButton,
    Alert, CircularProgress, InputAdornment, Tooltip,
} from '@mui/material';
import {
    Close, Add, Delete, CheckCircle, Warning,
    Money, CreditCard, PhoneAndroid, AccountBalanceWallet,
} from '@mui/icons-material';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const uid = () => Math.random().toString(36).slice(2, 8);

const PAY_METHODS = [
    { key: 'CASH', label: 'Tiền mặt', icon: <Money />, color: '#22c55e', bg: '#22c55e15' },
    { key: 'CARD', label: 'Quẹt thẻ', icon: <CreditCard />, color: '#3b82f6', bg: '#3b82f615' },
    { key: 'MOMO', label: 'MoMo', icon: <PhoneAndroid />, color: '#a855f7', bg: '#a855f715' },
    { key: 'VNPAY', label: 'VNPay', icon: <AccountBalanceWallet />, color: '#f59e0b', bg: '#f59e0b15' },
];

interface PaymentRow {
    id: string;
    method: string;
    amount: number;
    customerCash?: number;
    reference?: string;
}

interface Props {
    open: boolean;
    finalAmount: number;
    totalDiscount: number;
    onClose: () => void;
    onConfirm: (payments: PaymentRow[]) => void;
    loading: boolean;
}

const SplitPaymentDialog: React.FC<Props> = ({ open, finalAmount, totalDiscount, onClose, onConfirm, loading }) => {
    const [payments, setPayments] = useState<PaymentRow[]>([{ id: uid(), method: 'CASH', amount: finalAmount, customerCash: finalAmount }]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setPayments([{ id: uid(), method: 'CASH', amount: finalAmount, customerCash: finalAmount }]);
            setError('');
        }
    }, [open, finalAmount]);

    const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const remaining = finalAmount - totalPaid;
    const isOk = Math.abs(remaining) < 1;
    const isOver = totalPaid > finalAmount;

    const addRow = () => {
        const used = new Set(payments.map(p => p.method));
        const next = PAY_METHODS.find(m => !used.has(m.key));
        if (!next) return;
        setPayments(prev => [...prev, { id: uid(), method: next.key, amount: Math.max(0, finalAmount - totalPaid) }]);
    };

    const updateRow = (id: string, field: string, val: string | number) => {
        setPayments(prev => prev.map(p => {
            if (p.id !== id) return p;
            const updated = { ...p, [field]: field === 'amount' ? Number(val) || 0 : val };
            if (field === 'customerCash' && p.method === 'CASH') {
                const cashAmount = Number(val) || 0;
                if (cashAmount >= finalAmount - (totalPaid - (p.amount || 0))) {
                    updated.amount = cashAmount;
                }
            }
            if (field === 'amount' && p.method === 'CASH') {
                updated.customerCash = Number(val) || 0;
            }
            return updated;
        }));
        setError('');
    };

    const fillRemaining = (id: string) => {
        const others = payments.filter(p => p.id !== id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const fill = Math.max(0, finalAmount - others);
        const row = payments.find(p => p.id === id);
        if (row?.method === 'CASH') {
            updateRow(id, 'customerCash', fill);
        } else {
            updateRow(id, 'amount', fill);
        }
    };

    const handleConfirm = () => {
        if (totalPaid < finalAmount - 1) { setError(`Còn thiếu ${fmt(remaining)}`); return; }
        onConfirm(payments.map(p => ({ ...p, amount: Math.round(Number(p.amount) || 0) })).filter(p => p.amount > 0));
    };

    const availableMethods = PAY_METHODS.filter(m => !payments.find(p => p.method === m.key));

    const getUniqueQuickAmounts = (remain: number): number[] => {
        const amounts = [
            remain,
            Math.ceil(remain / 50000) * 50000,
            Math.ceil(remain / 100000) * 100000,
            Math.ceil(remain / 200000) * 200000,
        ];
        return [...new Set(amounts)].filter(v => v >= remain).slice(0, 4);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155', overflow: 'hidden' } }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderBottom: '1px solid #334155' }}>
                <Typography fontWeight={800} color="#f1f5f9" fontSize={18}>💳 Thanh toán</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}><Close /></IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
                <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#0f172a', mb: 2.5, textAlign: 'center', border: '1px solid #22c55e33' }}>
                    <Typography variant="caption" color="#22c55e" fontWeight={700} letterSpacing={1} display="block" mb={0.5}>TỔNG THANH TOÁN</Typography>
                    <Typography variant="h3" fontWeight={900} color="#22c55e">{fmt(finalAmount)}</Typography>
                    {totalDiscount > 0 && <Typography variant="caption" color="#f59e0b">Đã giảm {fmt(totalDiscount)}</Typography>}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                    <Typography variant="caption" color="#64748b" fontWeight={700} letterSpacing={0.5}>PHƯƠNG THỨC THANH TOÁN</Typography>
                    {availableMethods.length > 0 && (
                        <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />} onClick={addRow}
                            sx={{ textTransform: 'none', fontSize: 12, color: '#3b82f6' }}>
                            Thêm phương thức
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    {payments.map(row => {
                        const mi = PAY_METHODS.find(m => m.key === row.method);
                        const isCash = row.method === 'CASH';
                        const rowRemain = Math.max(0, finalAmount - payments.filter(p => p.id !== row.id).reduce((s, p) => s + (Number(p.amount) || 0), 0));
                        const customerCash = row.customerCash || row.amount || 0;
                        const cashChange = isCash && customerCash > rowRemain ? customerCash - rowRemain : 0;
                        const quickAmounts = getUniqueQuickAmounts(rowRemain);

                        return (
                            <Box key={row.id} sx={{ p: 1.75, borderRadius: 2, bgcolor: '#0f172a', border: `1px solid ${mi?.color ?? '#334155'}33` }}>
                                <Box sx={{ display: 'flex', gap: 0.75, mb: 1.25, flexWrap: 'wrap' }}>
                                    {PAY_METHODS.filter(m => m.key === row.method || !payments.find(p => p.id !== row.id && p.method === m.key)).map(m => (
                                        <Box key={m.key} onClick={() => updateRow(row.id, 'method', m.key)} sx={{
                                            px: 1.25, py: 0.6, borderRadius: 1.5, cursor: 'pointer',
                                            border: `1.5px solid ${row.method === m.key ? m.color : '#334155'}`,
                                            bgcolor: row.method === m.key ? m.bg : 'transparent',
                                            display: 'flex', alignItems: 'center', gap: 0.75,
                                            '&:hover': { borderColor: m.color },
                                        }}>
                                            <Box sx={{ color: row.method === m.key ? m.color : '#475569', display: 'flex', fontSize: 16 }}>{m.icon}</Box>
                                            <Typography fontSize={12} fontWeight={700} color={row.method === m.key ? m.color : '#475569'}>{m.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                    <Box sx={{ flex: 1 }}>
                                        {isCash ? (
                                            <>
                                                <TextField
                                                    fullWidth size="small" type="number"
                                                    placeholder="Tiền khách đưa"
                                                    value={customerCash || ''}
                                                    onChange={e => {
                                                        const val = Number(e.target.value) || 0;
                                                        updateRow(row.id, 'customerCash', val);
                                                        updateRow(row.id, 'amount', val >= rowRemain ? val : rowRemain);
                                                    }}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end"><Typography color="#64748b" fontSize={12}>₫</Typography></InputAdornment>,
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: 15, fontWeight: 700, '& fieldset': { borderColor: '#334155' }, '&.Mui-focused fieldset': { borderColor: mi?.color ?? '#3b82f6' } } }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75 }}>
                                                    {quickAmounts.map((v, idx) => (
                                                        <Button key={`${v}-${idx}`} size="small" variant="outlined" onClick={() => {
                                                            updateRow(row.id, 'customerCash', v);
                                                            updateRow(row.id, 'amount', v);
                                                        }}
                                                            sx={{ flex: 1, textTransform: 'none', fontSize: 10.5, py: 0.3, borderColor: '#334155', color: '#94a3b8', '&:hover': { borderColor: '#22c55e', color: '#22c55e' } }}>
                                                            {v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}K`}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            </>
                                        ) : (
                                            <TextField
                                                fullWidth size="small" type="number"
                                                placeholder="Số tiền"
                                                value={row.amount || ''}
                                                onChange={e => updateRow(row.id, 'amount', e.target.value)}
                                                InputProps={{ endAdornment: <InputAdornment position="end"><Typography color="#64748b" fontSize={12}>₫</Typography></InputAdornment> }}
                                                sx={{ '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: 15, fontWeight: 700, '& fieldset': { borderColor: '#334155' }, '&.Mui-focused fieldset': { borderColor: mi?.color ?? '#3b82f6' } } }}
                                            />
                                        )}
                                    </Box>

                                    {payments.length > 1 && remaining !== 0 && (
                                        <Tooltip title="Điền số tiền còn lại">
                                            <Button size="small" variant="outlined" onClick={() => fillRemaining(row.id)}
                                                sx={{ textTransform: 'none', fontSize: 11, borderColor: '#334155', color: '#64748b', px: 1, whiteSpace: 'nowrap', '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' } }}>
                                                Còn lại
                                            </Button>
                                        </Tooltip>
                                    )}

                                    {payments.length > 1 && (
                                        <IconButton size="small" onClick={() => setPayments(p => p.filter(x => x.id !== row.id))} sx={{ color: '#475569', '&:hover': { color: '#ef4444' } }}>
                                            <Delete sx={{ fontSize: 17 }} />
                                        </IconButton>
                                    )}
                                </Box>

                                {isCash && cashChange > 0 && (
                                    <Box sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: '#0f172a', border: '1px solid #f59e0b44', display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="#94a3b8">💰 Tiền thối:</Typography>
                                        <Typography variant="caption" fontWeight={800} color="#f59e0b">{fmt(cashChange)}</Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#0f172a', border: `1px solid ${isOk || isOver ? '#22c55e33' : '#ef444433'}`, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="#64748b">Tổng đã nhập:</Typography>
                        <Typography variant="body2" fontWeight={700} color="#f1f5f9">{fmt(totalPaid)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="#64748b">{remaining > 0 ? 'Còn thiếu:' : isOver ? 'Thừa:' : 'Trạng thái:'}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            {isOk || isOver ? <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} /> : <Warning sx={{ fontSize: 16, color: '#ef4444' }} />}
                            <Typography variant="body2" fontWeight={800} color={isOk || isOver ? '#22c55e' : '#ef4444'}>
                                {isOk ? 'Đủ tiền' : isOver ? `Thừa ${fmt(Math.abs(remaining))}` : fmt(remaining)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>{error}</Alert>}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#334155', color: '#64748b', borderRadius: 2, px: 3 }}>Hủy</Button>
                <Button fullWidth variant="contained" disabled={loading || totalPaid < finalAmount - 1} onClick={handleConfirm}
                    sx={{ py: 1.5, bgcolor: '#22c55e', color: '#fff', fontWeight: 800, textTransform: 'none', fontSize: 16, borderRadius: 2, '&:hover': { bgcolor: '#16a34a' }, '&:disabled': { bgcolor: '#1e3a2f', color: '#374151' } }}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : `✓ THANH TOÁN ${fmt(finalAmount)}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SplitPaymentDialog;