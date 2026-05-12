import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, TextField, Button, IconButton,
    Chip, Alert, Divider,
} from '@mui/material';
import { Close, LocalOffer, CheckCircle } from '@mui/icons-material';
import promotionService from '../../../../services/promotionService';
import { Promotion } from '../../../../types';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const calcDiscount = (p: Promotion, totalAmount: number): number => {
    const type = p.discountType ?? p.type;
    if (type === 'FIXED_AMOUNT') return Math.min(p.discountValue, totalAmount);
    if (type === 'PERCENTAGE') {
        let d = (totalAmount * p.discountValue) / 100;
        if (p.maxDiscountAmount) d = Math.min(d, p.maxDiscountAmount);
        return Math.round(d);
    }
    return 0;
};

interface Props {
    open: boolean;
    totalAmount: number;
    appliedCode: string;
    scannedCode?: string;
    onClose: () => void;
    onApply: (code: string, discount: number) => void;
    onRemove: () => void;
}

const PromotionDialog: React.FC<Props> = ({ open, totalAmount, appliedCode, scannedCode, onClose, onApply, onRemove }) => {
    const [code, setCode] = useState(appliedCode ?? '');
    const [error, setError] = useState('');
    const [found, setFound] = useState<Promotion | null>(null);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validatedDiscount, setValidatedDiscount] = useState<number>(0);

    useEffect(() => {
        if (open) {
            setLoading(true);
            promotionService.getActive()
                .then(list => setPromotions(list))
                .catch(() => setPromotions([]))
                .finally(() => setLoading(false));
        }
    }, [open]);

    useEffect(() => {
        const validateAuto = async (c: string) => {
            setIsValidating(true);
            try {
                const res = await promotionService.validate(c, totalAmount);
                // Tìm promotion trong list active để hiển thị chi tiết
                const matchedPromo = promotions.find(p => p.code === c.toUpperCase());
                if (matchedPromo) {
                    setFound(matchedPromo);
                } else {
                    // Tạo giả lập từ response
                    setFound({ code: c.toUpperCase(), name: c, discountType: 'FIXED_AMOUNT', discountValue: res.discountAmount } as Promotion);
                }
                setValidatedDiscount(res.discountAmount);
                setError('');
            } catch (err: any) {
                console.error('[PromotionDialog] Validation failed:', {
                    code: c,
                    error: err.response?.data || err.message
                });
                setError(err.response?.data?.message || 'Mã không hợp lệ');
                setFound(null);
                setValidatedDiscount(0);
            } finally {
                setIsValidating(false);
            }
        };

        if (open && scannedCode) {
            setCode(scannedCode);
            validateAuto(scannedCode);
        } else if (open) {
            setCode(appliedCode ?? '');
            if (appliedCode) validateAuto(appliedCode);
            else { setFound(null); setError(''); setValidatedDiscount(0); }
        }
    }, [open, scannedCode, appliedCode, totalAmount]);


    const handleApply = async () => {
        if (!code.trim()) return;
        setIsValidating(true);
        setError('');
        try {
            const res = await promotionService.validate(code.trim(), totalAmount);
            const matchedPromo = promotions.find(p => p.code === code.trim().toUpperCase());
            if (matchedPromo) {
                setFound(matchedPromo);
            } else {
                setFound({ code: code.trim().toUpperCase(), name: code.trim(), discountType: 'FIXED_AMOUNT', discountValue: res.discountAmount } as Promotion);
            }
            setValidatedDiscount(res.discountAmount);
        } catch (err: any) {
            console.error('[PromotionDialog] handleApply error:', err.response?.data || err.message);
            setFound(null);
            setValidatedDiscount(0);
            setError(err.response?.data?.message || 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSelectFromList = async (promo: Promotion) => {
        setCode(promo.code);
        setError('');
        setIsValidating(true);
        try {
            const res = await promotionService.validate(promo.code, totalAmount);
            setFound(promo);
            setValidatedDiscount(res.discountAmount);
        } catch (err: any) {
            console.error('[PromotionDialog] handleSelect error:', err.response?.data || err.message);
            setFound(null);
            setValidatedDiscount(0);
            setError(err.response?.data?.message || 'Mã không áp dụng được cho đơn hàng này');
        } finally {
            setIsValidating(false);
        }
    };

    const handleConfirm = () => {
        if (!found) return;
        onApply(found.code, validatedDiscount > 0 ? validatedDiscount : calcDiscount(found, totalAmount));
        onClose();
    };

    const handleRemove = () => {
        setFound(null);
        setCode('');
        setError('');
        setValidatedDiscount(0);
        onRemove();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 2, bgcolor: '#fff', overflow: 'hidden' } }}>

            <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#334155', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LocalOffer sx={{ fontSize: 18, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={700} color="#1e293b" fontSize={15} component="div">Khuyến mãi (F8)</Typography>
                        <Typography variant="caption" color="#64748b" fontSize={10.5} component="div">Nhập mã hoặc chọn từ danh sách</Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}>
                    <Close sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
                <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#f1f5f9', mb: 2.5, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Typography variant="caption" color="#64748b" display="block" fontSize={10.5} fontWeight={600}>TỔNG ĐƠN HÀNG</Typography>
                    <Typography fontWeight={800} color="#1e293b" fontSize={20}>{fmt(totalAmount)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        fullWidth size="small"
                        placeholder="Nhập mã khuyến mãi..."
                        value={code}
                        onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); setFound(null); setValidatedDiscount(0); }}
                        onKeyDown={e => e.key === 'Enter' && handleApply()}
                        autoFocus
                        inputProps={{ style: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                                '& fieldset': { borderColor: '#e2e8f0' },
                                '&.Mui-focused fieldset': { borderColor: '#334155' },
                            },
                        }}
                    />
                    <Button variant="contained" onClick={handleApply} disabled={isValidating || !code.trim()}
                        sx={{ bgcolor: '#334155', color: '#fff', textTransform: 'none', minWidth: 90, fontWeight: 700, borderRadius: 1, '&:hover': { bgcolor: '#1e293b' } }}>
                        {isValidating ? '...' : 'Áp dụng'}
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 12 }}>{error}</Alert>}

                {found && (
                    <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #33415544', mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} />
                                    <Chip label={found.code} size="small" sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 800, letterSpacing: 1, fontSize: 12, borderRadius: 1 }} />
                                </Box>
                                <Typography variant="body2" color="#94a3b8" fontSize={12}>{found.name}</Typography>
                                {(found.minOrderValue ?? found.minOrderAmount) && (found.minOrderValue ?? found.minOrderAmount)! > 0 && (
                                    <Typography variant="caption" color="#64748b" fontSize={10.5}>Đơn tối thiểu: {fmt(found.minOrderValue ?? found.minOrderAmount)}</Typography>
                                )}
                            </Box>
                            <Typography variant="h6" fontWeight={800} color="#22c55e" fontSize={16}>
                                -{fmt(validatedDiscount > 0 ? validatedDiscount : calcDiscount(found, totalAmount))}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                <Typography variant="caption" color="#475569" display="block" mb={1.25} fontWeight={600} fontSize={11}>MÃ KHUYẾN MÃI KHẢ DỤNG</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 200, overflowY: 'auto' }}>
                    {loading ? (
                        [1, 2, 3].map(i => <Box key={i} sx={{ height: 50, bgcolor: '#0f172a', borderRadius: 1.5, opacity: 0.5 }} />)
                    ) : promotions.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="#475569" fontSize={11}>Chưa có chương trình khuyến mãi nào đang hoạt động</Typography>
                        </Box>
                    ) : promotions.map(c => {
                        const minOrder = c.minOrderValue ?? c.minOrderAmount ?? 0;
                        const eligible = !minOrder || totalAmount >= minOrder;
                        const discount = calcDiscount(c, totalAmount);
                        const type = c.discountType ?? c.type;
                        return (
                            <Box
                                key={c.id}
                                onClick={() => eligible && handleSelectFromList(c)}
                                sx={{
                                    p: 1.25, borderRadius: 1.5, cursor: eligible ? 'pointer' : 'not-allowed',
                                    border: `1px solid ${found?.code === c.code ? '#334155' : '#f1f5f9'}`,
                                    bgcolor: found?.code === c.code ? '#f8fafc' : '#fff',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    opacity: eligible ? 1 : 0.45,
                                    '&:hover': eligible ? { borderColor: '#334155', bgcolor: '#f8fafc' } : {},
                                    transition: 'all 0.1s',
                                }}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                        <Typography fontSize={11} fontWeight={800} color="#334155" letterSpacing={0.5}>{c.code}</Typography>
                                        {minOrder > 0 && !eligible && <Chip label={`Từ ${fmt(minOrder)}`} size="small" sx={{ height: 14, fontSize: 8.5, bgcolor: '#fee2e2', color: '#ef4444', borderRadius: 0.5 }} />}
                                    </Box>
                                    <Typography variant="caption" color="#94a3b8" fontSize={10.5}>{c.name}</Typography>
                                </Box>
                                <Typography fontSize={12} fontWeight={700} color={eligible ? '#16a34a' : '#94a3b8'}>
                                    {eligible ? `-${fmt(discount)}` : `${type === 'PERCENTAGE' ? `${c.discountValue}%` : fmt(c.discountValue)}`}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
                {appliedCode && (
                    <Button variant="outlined" onClick={handleRemove}
                        sx={{ textTransform: 'none', borderColor: '#ef4444', color: '#ef4444', borderRadius: 1, fontSize: 13, '&:hover': { bgcolor: '#fef2f2' } }}>
                        Bỏ mã
                    </Button>
                )}
                <Button fullWidth variant="contained" disabled={!found}
                    onClick={handleConfirm}
                    sx={{ py: 1.2, bgcolor: '#334155', color: '#fff', fontWeight: 700, textTransform: 'none', borderRadius: 1, fontSize: 13, '&:hover': { bgcolor: '#1e293b' } }}>
                    {found ? `Xác nhận áp dụng` : 'Chọn mã khuyến mãi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PromotionDialog;