// src/modules/customer/pages/CartPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Button, Paper,
    Divider, TextField, Chip, IconButton,
} from '@mui/material';
import {
    ArrowBack, DeleteOutline, LocalShipping,
    ConfirmationNumber, ArrowForward, Lock
} from '@mui/icons-material';
import CartItem from '../components/cart/CartItem';
import { useCartContext } from '../../../store/CartContext';
import { fmt } from '../../../utils/constants';
import ProductCard from '../components/products/ProductCard';
import { useProducts } from '../hooks/useProducts';
import promotionService from '../../../services/promotionService';

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

    // Load suggested products from API
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
            <Box sx={{ bgcolor: '#fafafb', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
                <Container maxWidth="lg" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center', py: 8, maxWidth: 500, mx: 'auto' }}>
                        <Typography fontSize={90} mb={3} sx={{ filter: 'drop-shadow(0 10px 20px rgba(26,26,46,0.12))' }}>🛒</Typography>
                        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#1a1a2e', mb: 1.5 }}>
                            Giỏ hàng của bạn đang trống
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 4, fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Khám phá hàng ngàn tựa sách hấp dẫn tại Bookly để tìm kiếm những người bạn đồng hành mới trên hành trình tri thức!
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/shop')}
                            startIcon={<ArrowBack />}
                            sx={{
                                bgcolor: '#1a1a2e',
                                color: '#ffffff',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 4,
                                py: 1.5,
                                borderRadius: '10px',
                                boxShadow: '0 4px 12px rgba(26,26,46,0.15)',
                                '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' },
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
        <Box sx={{ bgcolor: '#fafafb', minHeight: '100vh', py: 5 }}>
            <Container maxWidth="lg">

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, color: '#1a1a2e' }}>
                            Giỏ hàng của bạn
                        </Typography>
                        <Chip
                            label={`${totalItems} sản phẩm`}
                            size="medium"
                            sx={{ bgcolor: '#f5a623', color: '#1a1a2e', fontWeight: 800, fontSize: '0.8rem' }}
                        />
                    </Box>
                    <Button
                        size="medium"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/shop')}
                        sx={{ color: '#1a1a2e', textTransform: 'none', fontWeight: 600, '&:hover': { color: '#f5a623' } }}
                    >
                        Tiếp tục chọn sách
                    </Button>
                </Box>

                <Grid container spacing={4}>

                    {/* ── LEFT: Items List & Coupon ── */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper elevation={0} sx={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid #eef0f2',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                        }}>
                            {/* Column header */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                px: 3,
                                py: 2,
                                bgcolor: '#f8f9fa',
                                borderBottom: '1px solid #eef0f2',
                            }}>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '0.75rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                    Danh sách sản phẩm
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<DeleteOutline sx={{ fontSize: 16 }} />}
                                    onClick={clearCart}
                                    sx={{
                                        color: '#8c9ba5',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '6px',
                                        '&:hover': { color: '#ff4d4f', bgcolor: '#fff0f6' },
                                    }}
                                >
                                    Xóa tất cả
                                </Button>
                            </Box>

                            <Box sx={{ px: 3, py: 1 }}>
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

                        {/* Coupon - Promotion code section */}
                        <Paper elevation={0} sx={{
                            borderRadius: '12px',
                            p: 3,
                            mt: 3,
                            border: '1px solid #eef0f2',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                                <ConfirmationNumber sx={{ color: '#1a1a2e', fontSize: 22 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>Ưu đãi & Mã giảm giá</Typography>
                                {appliedPromotion && (
                                    <Chip
                                        label={appliedPromotion.type === 'PERCENTAGE' ? `Giảm ${appliedPromotion.discountValue}%` : `Giảm ${fmt(appliedPromotion.discountValue)}`}
                                        size="small"
                                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800, fontSize: '0.75rem' }}
                                    />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    size="medium"
                                    fullWidth
                                    placeholder="Nhập mã ưu đãi của bạn..."
                                    value={coupon}
                                    onChange={e => { setCoupon(e.target.value); setCouponErr(''); }}
                                    error={!!couponErr}
                                    helperText={couponErr || (appliedPromotion ? `🎉 Đã áp dụng ưu đãi thành công: ${appliedPromotion.name}` : 'Mỗi đơn hàng có thể áp dụng 1 coupon giảm giá')}
                                    FormHelperTextProps={{
                                        sx: { color: appliedPromotion ? '#2e7d32' : 'text.secondary', fontWeight: appliedPromotion ? 600 : 400 },
                                    }}
                                    disabled={!!appliedPromotion || isValidating}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                        },
                                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#f5a623',
                                        },
                                    }}
                                />
                                {appliedPromotion ? (
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => { setAppliedPromotion(null); setCoupon(''); }}
                                        sx={{
                                            borderColor: '#ff4d4f',
                                            color: '#ff4d4f',
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            height: 56,
                                            px: 3,
                                            borderRadius: '8px',
                                            '&:hover': { borderColor: '#d9363e', bgcolor: '#fff0f6' }
                                        }}
                                    >
                                        Hủy mã
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={applyCoupon}
                                        disabled={isValidating || !coupon.trim()}
                                        sx={{
                                            bgcolor: '#1a1a2e',
                                            color: '#ffffff',
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            height: 56,
                                            px: 3,
                                            borderRadius: '8px',
                                            boxShadow: 'none',
                                            whiteSpace: 'nowrap',
                                            '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' },
                                            '&:disabled': { bgcolor: '#f0f0f2', color: '#bbb' }
                                        }}
                                    >
                                        {isValidating ? 'Đang xác thực...' : 'Áp dụng'}
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* ── RIGHT: Summary Checkout Box ── */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{
                            borderRadius: '12px',
                            p: 3,
                            position: 'sticky',
                            top: 100,
                            border: '1px solid #eef0f2',
                            boxShadow: '0 8px 30px rgba(26,26,46,0.04)'
                        }}>
                            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#1a1a2e', mb: 2.5 }}>Tóm tắt đơn hàng</Typography>

                            {/* Free ship indicator bar */}
                            <Box sx={{
                                p: 1.8,
                                borderRadius: '8px',
                                mb: 2,
                                bgcolor: shipFee === 0 ? 'rgba(46, 125, 50, 0.06)' : 'rgba(245, 166, 35, 0.08)',
                                display: 'flex',
                                gap: 1.2,
                                alignItems: 'flex-start',
                            }}>
                                <LocalShipping sx={{
                                    fontSize: 20,
                                    color: shipFee === 0 ? '#2e7d32' : '#db941e',
                                    mt: 0.2,
                                }} />
                                <Typography
                                    variant="caption"
                                    color={shipFee === 0 ? '#2e7d32' : '#db941e'}
                                    sx={{ fontWeight: 700, lineHeight: 1.5, fontSize: '0.8rem' }}
                                >
                                    {shipFee === 0
                                        ? 'Chúc mừng! Bạn đã nhận ưu đãi Miễn phí vận chuyển.'
                                        : `Mua thêm ${fmt(FREE_SHIP - totalPrice)} để được Miễn phí vận chuyển.`}
                                </Typography>
                            </Box>

                            {/* Progress bar */}
                            <Box sx={{ height: 6, bgcolor: '#f0f0f2', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
                                <Box sx={{
                                    height: '100%',
                                    width: `${Math.min((totalPrice / FREE_SHIP) * 100, 100)}%`,
                                    bgcolor: shipFee === 0 ? '#2e7d32' : '#f5a623',
                                    borderRadius: 3,
                                    transition: 'width 0.4s ease-out',
                                }} />
                            </Box>

                            {/* Pricing Details */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Tạm tính</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a2e' }}>{fmt(totalPrice)}</Typography>
                                </Box>

                                {totalSaved > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">Tiết kiệm trực tiếp</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>-{fmt(totalSaved)}</Typography>
                                    </Box>
                                )}

                                {appliedPromotion && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">Mã giảm giá ({appliedPromotion.code})</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff4d4f' }}>-{fmt(discount)}</Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: shipFee === 0 ? '#2e7d32' : '#1a1a2e' }}>
                                        {shipFee === 0 ? 'Miễn phí' : fmt(shipFee)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2.5, borderColor: '#eef0f2' }} />

                            {/* Total Final Price */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>Tổng cộng</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a1a2e' }}>
                                    {fmt(finalPrice)}
                                </Typography>
                            </Box>

                            {/* Proceed Checkout Button */}
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForward />}
                                onClick={() => navigate('/checkout')}
                                sx={{
                                    bgcolor: '#1a1a2e',
                                    color: '#ffffff',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    py: 1.8,
                                    fontSize: '0.95rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(26,26,46,0.15)',
                                    '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' },
                                }}
                            >
                                Tiến hành thanh toán
                            </Button>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mt: 2 }}>
                                <Lock sx={{ fontSize: 14, color: '#8c9ba5' }} />
                                <Typography variant="caption" sx={{ color: '#8c9ba5', fontWeight: 500 }}>
                                    Thanh toán an toàn & bảo mật 256-bit SSL
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Suggested products */}
                {suggested.length > 0 && (
                    <Box sx={{ mt: 7 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3.5 }}>
                            <Box sx={{ width: 5, height: 26, bgcolor: '#f5a623', borderRadius: 1 }} />
                            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, color: '#1a1a2e' }}>
                                Có thể bạn quan tâm
                            </Typography>
                        </Box>
                        <Grid container spacing={3}>
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