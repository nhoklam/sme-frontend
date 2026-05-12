import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, TextField, Button, IconButton, InputAdornment,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

interface Props {
    open: boolean;
    totalAmount: number;
    discount: number;
    discountAmt: number;
    onClose: () => void;
    onApply: (pct: number, amt: number) => void;
}

const OrderDiscountDialog: React.FC<Props> = ({ open, totalAmount, discount, discountAmt, onClose, onApply }) => {
    const [mode, setMode] = useState<'pct' | 'amt'>('pct');
    const [val, setVal] = useState('');

    useEffect(() => {
        if (open) {
            setMode(discount > 0 ? 'pct' : 'amt');
            setVal(discount > 0 ? String(discount) : discountAmt > 0 ? String(discountAmt) : '');
        }
    }, [open, discount, discountAmt]);

    const preview = mode === 'pct'
        ? Math.round(totalAmount * (Number(val) || 0) / 100)
        : Number(val) || 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 2, bgcolor: '#1e293b', border: '1px solid #334155' } }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={800} color="#f1f5f9">Chiết khấu đơn hàng</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}><Close /></IconButton>
            </Box>
            <DialogContent sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {(['pct', 'amt'] as const).map(m => (
                        <Button key={m} size="small" variant={mode === m ? 'contained' : 'outlined'}
                            onClick={() => { setMode(m); setVal(''); }}
                            sx={{ flex: 1, textTransform: 'none', fontWeight: 700, bgcolor: mode === m ? '#3b82f6' : 'transparent', borderColor: '#334155', color: mode === m ? '#fff' : '#94a3b8' }}>
                            {m === 'pct' ? 'Theo %' : 'Theo tiền'}
                        </Button>
                    ))}
                </Box>
                <TextField fullWidth size="small" type="number" autoFocus value={val}
                    onChange={e => setVal(e.target.value)}
                    placeholder={mode === 'pct' ? 'VD: 10 (%)' : 'VD: 50000 (đ)'}
                    InputProps={{ endAdornment: <InputAdornment position="end"><Typography color="#64748b">{mode === 'pct' ? '%' : '₫'}</Typography></InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#f1f5f9', '& fieldset': { borderColor: '#334155' }, '&.Mui-focused fieldset': { borderColor: '#3b82f6' } } }} />
                {preview > 0 && (
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#0f172a', borderRadius: 1.5, border: '1px solid #22c55e33' }}>
                        <Typography variant="caption" color="#64748b">Giảm:</Typography>
                        <Typography variant="body1" fontWeight={800} color="#22c55e"> -{fmt(preview)}</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                {(discount > 0 || discountAmt > 0) && (
                    <Button variant="outlined" onClick={() => { onApply(0, 0); onClose(); }}
                        sx={{ textTransform: 'none', borderColor: '#ef4444', color: '#ef4444' }}>
                        Bỏ chiết khấu
                    </Button>
                )}
                <Button fullWidth variant="contained"
                    onClick={() => {
                        if (mode === 'pct') onApply(Number(val) || 0, 0);
                        else onApply(0, Number(val) || 0);
                        onClose();
                    }}
                    sx={{ bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#2563eb' } }}>
                    Áp dụng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OrderDiscountDialog;