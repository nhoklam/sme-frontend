// src/modules/customer/pages/CartPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Button, Paper,
    Divider, TextField, Chip, IconButton,
} from '@mui/material';
import {
    ArrowBack, DeleteOutline, LocalShipping,
    ConfirmationNumber, ArrowForward,
} from '@mui/icons-material';
import CartItem from '../components/cart/CartItem';
import { useCartContext } from '../../../store/CartContext';
import { fmt } from '../../../utils/constants';
import ProductCard from '../components/products/ProductCard';
import { useProducts } from '../hooks/useProducts';
import promotionService from '../../../services/promotionService';
import { Promotion } from '../../../types';

const FREE_SHIP = 150000;

const CartPage = () => {
    const navigate = useNavigate();
    const {
        items, removeItem, updateQty, clearCart,
        totalItems, totalPrice, totalSaved,
        appliedPromotion, setAppliedPromotion
    } = useCartContext();
    const [coupon, setCoupon] = useState('');
    const [couponErr, setCouponErr] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const calcDiscount = () => {
        if (!appliedPromotion) return 0;
        if (appliedPromotion.type === 'FIXED_AMOUNT') {
            return Math.min(appliedPromotion.discountValue, totalPrice);
        }
        if (appliedPromotion.type === 'PERCENTAGE') {
            let d = (totalPrice * appliedPromotion.discountValue) / 100;
            if (appliedPromotion.maxDiscountAmount) d = Math.min(d, appliedPromotion.maxDiscountAmount);
            return Math.round(d);
        }
        return 0;
    };

    const discount = calcDiscount();
    const shipFee = totalPrice >= FREE_SHIP ? 0 : 30000;
    const finalPrice = totalPrice - discount + shipFee;

    // Load suggested products from API (not from mock PRODUCTS constant)
    const { products: allProducts } = useProducts({ size: 8, page: 0 });
    const cartItemIds = new Set(items.map((i: any) => i.id));
    const suggested = allProducts.filter(p => !cartItemIds.has(p.id)).slice(0, 4);

    const applyCoupon = async () => {
        if (!coupon.trim()) return;
        setIsValidating(true);
        setCouponErr('');
        try {
            const promo = await promotionService.validate(coupon.trim(), totalPrice);
            setAppliedPromotion(promo);
        } catch (err: any) {
            setAppliedPromotion(null);
            setCouponErr(err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
        } finally {
            setIsValidating(false);
        }
    };

    if (items.length === 0) {
        return (
            <Box sx={{ bgcolor: '#f7f7f8', minHeight: '80vh' }}>
                <Container maxWidth="lg" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography fontSize={80} mb={2}>🛒</Typography>
                        <Typography variant="h5" fontWeight={700} mb={1}>Giỏ hàng trống</Typography>
                        <Typography color="text.secondary" mb={4}>
                            Bạn chưa có sản phẩm nào trong giỏ hàng
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/shop')}
                            startIcon={<ArrowBack />}
                            sx={{
                                bgcolor: '#d32f2f',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 4,
                                borderRadius: 2,
                                '&:hover': { bgcolor: '#b71c1c' },
                            }}
                        >
                            Tiếp tục mua sắm
                        </Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f7f7f8', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.3px' }}>
                            Giỏ hàng của bạn
                        </Typography>
                        <Chip
                            label={`${totalItems} sản phẩm`}
                            size="small"
                            sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 700 }}
                        />
                    </Box>
                    <Button
                        size="small"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/shop')}
                        sx={{ color: '#666', textTransform: 'none', fontWeight: 500 }}
                    >
                        Tiếp tục mua sắm
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {/* ── LEFT: Items ── */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                            {/* Column header */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                px: 2.5,
                                py: 1.5,
                                bgcolor: '#fafafa',
                                borderBottom: '1px solid #f0f0f0',
                            }}>
                                <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    Sản phẩm
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<DeleteOutline sx={{ fontSize: 14 }} />}
                                    onClick={clearCart}
                                    sx={{
                                        color: '#999',
                                        textTransform: 'none',
                                        fontSize: 12,
                                        '&:hover': { color: '#d32f2f', bgcolor: '#ffebee' },
                                    }}
                                >
                                    Xóa tất cả
                                </Button>
                            </Box>

                            <Box sx={{ px: 2.5 }}>
                                {items.map((item: any) => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        onUpdateQty={updateQty}
                                        onRemove={removeItem}
                                    />
                                ))}
                            </Box>
                        </Paper>

                        {/* Coupon */}
                        <Paper elevation={0} sx={{ borderRadius: 2.5, p: 2.5, mt: 2, border: '1px solid #f0f0f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <ConfirmationNumber sx={{ color: '#d32f2f', fontSize: 20 }} />
                                <Typography variant="body2" fontWeight={700}>Mã giảm giá</Typography>
                                {appliedPromotion && (
                                    <Chip
                                        label={appliedPromotion.type === 'PERCENTAGE' ? `-${appliedPromotion.discountValue}%` : `-${fmt(appliedPromotion.discountValue)}`}
                                        size="small"
                                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: 11 }}
                                    />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Nhập mã giảm giá..."
                                    value={coupon}
                                    onChange={e => { setCoupon(e.target.value); setCouponErr(''); }}
                                    error={!!couponErr}
                                    helperText={couponErr || (appliedPromotion ? `✅ Đã áp dụng: ${appliedPromotion.name}` : '')}
                                    FormHelperTextProps={{
                                        sx: { color: appliedPromotion ? '#2e7d32' : undefined },
                                    }}
                                    disabled={!!appliedPromotion || isValidating}
                                    sx={{
                                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#d32f2f',
                                        },
                                    }}
                                />
                                {appliedPromotion ? (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => { setAppliedPromotion(null); setCoupon(''); }}
                                        sx={{
                                            borderColor: '#d32f2f',
                                            color: '#d32f2f',
                                            textTransform: 'none',
                                            whiteSpace: 'nowrap',
                                            minWidth: 80,
                                            borderRadius: 2,
                                        }}
                                    >
                                        Bỏ mã
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={applyCoupon}
                                        disabled={isValidating || !coupon.trim()}
                                        sx={{
                                            bgcolor: '#d32f2f',
                                            textTransform: 'none',
                                            whiteSpace: 'nowrap',
                                            minWidth: 80,
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: '#b71c1c' },
                                        }}
                                    >
                                        {isValidating ? '...' : 'Áp dụng'}
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* ── RIGHT: Summary ── */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2.5, p: 2.5, position: 'sticky', top: 80, border: '1px solid #f0f0f0' }}>
                            <Typography variant="h6" fontWeight={800} mb={2}>Tóm tắt đơn hàng</Typography>

                            {/* Ship notice */}
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                mb: 2,
                                bgcolor: shipFee === 0 ? '#e8f5e9' : '#fff8e1',
                                display: 'flex',
                                gap: 1,
                                alignItems: 'flex-start',
                            }}>
                                <LocalShipping sx={{
                                    fontSize: 18,
                                    color: shipFee === 0 ? '#2e7d32' : '#f57c00',
                                    mt: 0.2,
                                }} />
                                <Typography
                                    variant="caption"
                                    color={shipFee === 0 ? '#2e7d32' : '#f57c00'}
                                    fontWeight={600}
                                    lineHeight={1.5}
                                >
                                    {shipFee === 0
                                        ? '🎉 Bạn được miễn phí vận chuyển!'
                                        : `Mua thêm ${fmt(FREE_SHIP - totalPrice)} để miễn phí ship`}
                                </Typography>
                            </Box>

                            {/* Progress bar */}
                            <Box sx={{ height: 4, bgcolor: '#f0f0f0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
                                <Box sx={{
                                    height: '100%',
                                    width: `${Math.min((totalPrice / FREE_SHIP) * 100, 100)}%`,
                                    bgcolor: shipFee === 0 ? '#4caf50' : '#f57c00',
                                    borderRadius: 2,
                                    transition: 'width 0.4s ease',
                                }} />
                            </Box>

                            {/* Price breakdown */}
                            {[
                                { label: 'Tạm tính', value: fmt(totalPrice), color: 'text.primary', show: true },
                                { label: 'Tiết kiệm', value: `-${fmt(totalSaved)}`, color: '#2e7d32', show: totalSaved > 0 },
                                {
                                    label: `Mã giảm giá ${appliedPromotion?.code ? `(${appliedPromotion.code})` : ''}`,
                                    value: `-${fmt(discount)}`,
                                    color: '#d32f2f',
                                    show: !!appliedPromotion
                                },
                                { label: 'Phí vận chuyển', value: shipFee === 0 ? 'Miễn phí' : fmt(shipFee), color: shipFee === 0 ? '#2e7d32' : 'text.primary', show: true },
                            ].filter(r => r.show).map(({ label, value, color }) => (
                                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    <Typography variant="body2" fontWeight={600} color={color}>{value}</Typography>
                                </Box>
                            ))}

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                                <Typography variant="body1" fontWeight={700}>Tổng cộng</Typography>
                                <Typography variant="h6" fontWeight={900} color="#d32f2f">
                                    {fmt(finalPrice)}
                                </Typography>
                            </Box>

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForward />}
                                onClick={() => navigate('/checkout')}
                                sx={{
                                    bgcolor: '#d32f2f',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    py: 1.5,
                                    fontSize: 15,
                                    borderRadius: 2.5,
                                    '&:hover': { bgcolor: '#b71c1c' },
                                }}
                            >
                                Tiến hành thanh toán
                            </Button>

                            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1.5}>
                                🔒 Thanh toán an toàn & bảo mật
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Suggested products from API */}
                {suggested.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ width: 4, height: 24, bgcolor: '#d32f2f', borderRadius: 2 }} />
                            <Typography variant="h6" fontWeight={800}>Có thể bạn cũng thích</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {suggested.map(p => (
                                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}>
                                    <ProductCard product={p} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default CartPage;