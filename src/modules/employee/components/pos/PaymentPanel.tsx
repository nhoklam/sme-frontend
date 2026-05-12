import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, IconButton,
    Alert, CircularProgress, InputAdornment, Chip, Divider,
} from '@mui/material';
import {
    Money, CreditCard, PhoneAndroid, AccountBalanceWallet,
    CheckCircle, Warning, Delete,
} from '@mui/icons-material';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(n ?? 0);

const uid = () => Math.random().toString(36).slice(2, 8);

const PAY_METHODS = [
    { key: 'CASH', label: 'Tiền mặt', icon: <Money />, color: '#22c55e', bg: '#22c55e15' },
    { key: 'CARD', label: 'Quẹt thẻ', icon: <CreditCard />, color: '#3b82f6', bg: '#3b82f615' },
    { key: 'MOMO', label: 'MoMo', icon: <PhoneAndroid />, color: '#a855f7', bg: '#a855f715' },
    { key: 'VNPAY', label: 'VNPay', icon: <AccountBalanceWallet />, color: '#f59e0b', bg: '#f59e0b15' },
];

export interface PaymentRow {
    id: string;
    method: string;
    amount: number;
    customerCash?: number;
    reference?: string;
}

interface Props {
    finalAmount: number;
    totalDiscount: number;
    loading: boolean;
    onConfirm: (payments: PaymentRow[]) => void;
    disabled?: boolean;
}

const PaymentPanel: React.FC<Props> = ({ finalAmount, totalDiscount, loading, onConfirm, disabled }) => {
    const [payments, setPayments] = useState<PaymentRow[]>([{ id: uid(), method: 'CASH', amount: finalAmount, customerCash: finalAmount }]);
    const [error, setError] = useState('');

    useEffect(() => {
        setPayments([{ id: uid(), method: 'CASH', amount: finalAmount, customerCash: finalAmount }]);
        setError('');
    }, [finalAmount]);

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

    const removeRow = (id: string) => {
        if (payments.length <= 1) return;
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const handleConfirm = () => {
        if (totalPaid < finalAmount - 1) {
            setError(`Còn thiếu ${fmt(remaining)}`);
            return;
        }
        const normalized = payments.map(p => ({ ...p, amount: Math.round(Number(p.amount) || 0) })).filter(p => p.amount > 0);
        onConfirm(normalized);
    };

    const getUniqueQuickAmounts = (remain: number): number[] => {
        const amounts = [
            remain,
            Math.ceil(remain / 50000) * 50000,
            Math.ceil(remain / 100000) * 100000,
            Math.ceil(remain / 200000) * 200000,
        ];
        return [...new Set(amounts)].filter(v => v >= remain).slice(0, 4);
    };

    const availableMethods = PAY_METHODS.filter(m => !payments.find(p => p.method === m.key));

    const rowRemainForAll = (id: string) => Math.max(0, finalAmount - payments.filter(p => p.id !== id).reduce((s, p) => s + (Number(p.amount) || 0), 0));

    return (
        <Box sx={{ bgcolor: '#1e293b', borderRadius: 2, p: 1.5, mt: 1, border: '1px solid #334155' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#94a3b8" fontSize={13}>
                    💳 THANH TOÁN
                </Typography>
                {totalDiscount > 0 && (
                    <Chip label={`Giảm ${fmt(totalDiscount)}`} size="small"
                        sx={{ height: 18, fontSize: 9.5, bgcolor: '#f59e0b22', color: '#f59e0b' }} />
                )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="#64748b" fontWeight={700}>PHƯƠNG THỨC</Typography>
                {availableMethods.length > 0 && !disabled && (
                    <Button size="small" variant="text" onClick={addRow}
                        sx={{ textTransform: 'none', fontSize: 11, color: '#3b82f6', p: 0, minWidth: 0 }}>
                        + Thêm phương thức
                    </Button>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1.5, maxHeight: 300, overflowY: 'auto' }}>
                {payments.map(row => {
                    const mi = PAY_METHODS.find(m => m.key === row.method);
                    const isCash = row.method === 'CASH';
                    const rowRemain = rowRemainForAll(row.id);
                    const customerCash = row.customerCash || row.amount || 0;
                    const cashChange = isCash && customerCash > rowRemain ? customerCash - rowRemain : 0;
                    const quickAmounts = getUniqueQuickAmounts(rowRemain);

                    return (
                        <Box key={row.id} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: '#0f172a', border: `1px solid ${mi?.color ?? '#334155'}33` }}>
                            <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
                                {PAY_METHODS.filter(m => m.key === row.method || !payments.find(p => p.id !== row.id && p.method === m.key)).map(m => (
                                    <Box key={m.key} onClick={() => !disabled && updateRow(row.id, 'method', m.key)} sx={{
                                        px: 1, py: 0.5, borderRadius: 1.5, cursor: disabled ? 'default' : 'pointer',
                                        border: `1.5px solid ${row.method === m.key ? m.color : '#334155'}`,
                                        bgcolor: row.method === m.key ? m.bg : 'transparent',
                                        display: 'flex', alignItems: 'center', gap: 0.75,
                                    }}>
                                        <Box sx={{ color: row.method === m.key ? m.color : '#475569', display: 'flex', fontSize: 14 }}>{m.icon}</Box>
                                        <Typography fontSize={10.5} fontWeight={700} color={row.method === m.key ? m.color : '#475569'}>{m.label}</Typography>
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
                                                disabled={disabled}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end"><Typography color="#64748b" fontSize={11}>₫</Typography></InputAdornment>,
                                                }}
                                                sx={{ '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: 13, fontWeight: 700, '& fieldset': { borderColor: '#334155' } } }}
                                            />
                                            {!disabled && rowRemain > 0 && (
                                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                                                    {quickAmounts.map((v, idx) => (
                                                        <Button key={`${v}-${idx}`} size="small" variant="outlined" onClick={() => {
                                                            updateRow(row.id, 'customerCash', v);
                                                            updateRow(row.id, 'amount', v);
                                                        }}
                                                            sx={{ flex: 1, textTransform: 'none', fontSize: 9.5, py: 0.25, minWidth: 0, px: 0.75, borderColor: '#334155', color: '#94a3b8' }}>
                                                            {v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${v / 1000}K`}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            )}
                                        </>
                                    ) : (
                                        <TextField
                                            fullWidth size="small" type="number"
                                            placeholder="Số tiền"
                                            value={row.amount || ''}
                                            onChange={e => updateRow(row.id, 'amount', e.target.value)}
                                            disabled={disabled}
                                            InputProps={{ endAdornment: <InputAdornment position="end"><Typography color="#64748b" fontSize={11}>₫</Typography></InputAdornment> }}
                                            sx={{ '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: 13, fontWeight: 700, '& fieldset': { borderColor: '#334155' } } }}
                                        />
                                    )}
                                </Box>

                                {payments.length > 1 && !disabled && (
                                    <IconButton size="small" onClick={() => removeRow(row.id)} sx={{ color: '#475569', '&:hover': { color: '#ef4444' } }}>
                                        <Delete sx={{ fontSize: 16 }} />
                                    </IconButton>
                                )}
                            </Box>

                            {isCash && cashChange > 0 && (
                                <Box sx={{ mt: 0.75, p: 0.75, borderRadius: 1, bgcolor: '#0f172a', border: '1px solid #f59e0b44', display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="#94a3b8">💰 Tiền thối:</Typography>
                                    <Typography variant="caption" fontWeight={800} color="#f59e0b">{fmt(cashChange)}</Typography>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>

            <Divider sx={{ borderColor: '#334155', my: 1 }} />

            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#0f172a', mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="#64748b" fontSize={11.5}>Tổng đã nhập:</Typography>
                    <Typography variant="body2" fontWeight={700} color="#f1f5f9">{fmt(totalPaid)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="#64748b" fontSize={11.5}>{remaining > 0 ? 'Còn thiếu:' : isOver ? 'Thừa:' : 'Trạng thái:'}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {isOk || isOver ? <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} /> : <Warning sx={{ fontSize: 14, color: '#ef4444' }} />}
                        <Typography variant="body2" fontWeight={800} color={isOk || isOver ? '#22c55e' : '#ef4444'}>
                            {isOk ? 'Đủ tiền' : isOver ? `Thừa ${fmt(Math.abs(remaining))}` : fmt(remaining)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ borderRadius: 1.5, mb: 1.5, py: 0 }}>{error}</Alert>}

            <Button
                fullWidth variant="contained"
                disabled={disabled || loading || totalPaid < finalAmount - 1}
                onClick={handleConfirm}
                sx={{ py: 1.25, bgcolor: '#22c55e', fontWeight: 800, fontSize: 14, textTransform: 'none', borderRadius: 1.75, '&:hover': { bgcolor: '#16a34a' } }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : `THANH TOÁN ${fmt(finalAmount)}`}
            </Button>
        </Box>
    );
};

export default PaymentPanel;