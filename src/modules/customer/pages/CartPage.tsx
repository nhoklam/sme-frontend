// src/modules/customer/pages/CartPage.jsx
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
import { fmt, PRODUCTS } from '../../../utils/constants';
import ProductCard from '../components/products/ProductCard';

const FREE_SHIP = 150000;

const CartPage = () => {
    const navigate = useNavigate();
    const { items, removeItem, updateQty, clearCart, totalItems, totalPrice, totalSaved } = useCartContext();
    const [coupon, setCoupon] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponErr, setCouponErr] = useState('');

    const discount = couponApplied ? Math.round(totalPrice * 0.1) : 0;
    const shipFee = totalPrice >= FREE_SHIP ? 0 : 30000;
    const finalPrice = totalPrice - discount + shipFee;

    const suggested = PRODUCTS.filter(p => !items.find(i => i.id === p.id)).slice(0, 4);

    const applyCoupon = () => {
        if (coupon.trim().toUpperCase() === 'BOOK10') {
            setCouponApplied(true);
            setCouponErr('');
        } else {
            setCouponErr('Mã giảm giá không hợp lệ');
            setCouponApplied(false);
        }
    };

    if (items.length === 0) {
        return (
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '80vh' }}>
                <Container maxWidth="lg" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography fontSize={80} mb={2}>🛒</Typography>
                        <Typography variant="h5" fontWeight={700} mb={1}>Giỏ hàng trống</Typography>
                        <Typography color="text.secondary" mb={4}>
                            Bạn chưa có sản phẩm nào trong giỏ hàng
                        </Typography>
                        <Button variant="contained" onClick={() => navigate('/shop')}
                            startIcon={<ArrowBack />}
                            sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700, px: 4, '&:hover': { bgcolor: '#b71c1c' } }}>
                            Tiếp tục mua sắm
                        </Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" fontWeight={800}>Giỏ hàng của bạn</Typography>
                        <Chip label={`${totalItems} sản phẩm`} size="small"
                            sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 700 }} />
                    </Box>
                    <Button size="small" startIcon={<ArrowBack />} onClick={() => navigate('/shop')}
                        sx={{ color: '#666', textTransform: 'none' }}>
                        Tiếp tục mua sắm
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {/* ── LEFT: Items ── */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            {/* Column header */}
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                px: 2.5, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0',
                            }}>
                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                    SẢN PHẨM
                                </Typography>
                                <Button size="small" startIcon={<DeleteOutline sx={{ fontSize: 14 }} />}
                                    onClick={clearCart}
                                    sx={{
                                        color: '#999', textTransform: 'none', fontSize: 12,
                                        '&:hover': { color: '#d32f2f', bgcolor: '#ffebee' }
                                    }}>
                                    Xóa tất cả
                                </Button>
                            </Box>

                            <Box sx={{ px: 2.5 }}>
                                {items.map(item => (
                                    <CartItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeItem} />
                                ))}
                            </Box>
                        </Paper>

                        {/* Coupon */}
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2.5, mt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <ConfirmationNumber sx={{ color: '#d32f2f', fontSize: 20 }} />
                                <Typography variant="body2" fontWeight={700}>Mã giảm giá</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small" fullWidth
                                    placeholder="Nhập mã giảm giá (thử: BOOK10)"
                                    value={coupon}
                                    onChange={e => { setCoupon(e.target.value); setCouponErr(''); }}
                                    error={!!couponErr}
                                    helperText={couponErr || (couponApplied ? '✅ Đã áp dụng giảm 10%' : '')}
                                    FormHelperTextProps={{ sx: { color: couponApplied ? '#2e7d32' : undefined } }}
                                    disabled={couponApplied}
                                    sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#d32f2f' } }}
                                />
                                {couponApplied ? (
                                    <Button variant="outlined" size="small"
                                        onClick={() => { setCouponApplied(false); setCoupon(''); }}
                                        sx={{ borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none', whiteSpace: 'nowrap', minWidth: 80 }}>
                                        Bỏ mã
                                    </Button>
                                ) : (
                                    <Button variant="contained" size="small" onClick={applyCoupon}
                                        sx={{ bgcolor: '#d32f2f', textTransform: 'none', whiteSpace: 'nowrap', minWidth: 80, '&:hover': { bgcolor: '#b71c1c' } }}>
                                        Áp dụng
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* ── RIGHT: Summary ── */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2.5, position: 'sticky', top: 80 }}>
                            <Typography variant="h6" fontWeight={800} mb={2}>Tóm tắt đơn hàng</Typography>

                            {/* Ship notice */}
                            <Box sx={{
                                p: 1.5, borderRadius: 1.5, mb: 2,
                                bgcolor: shipFee === 0 ? '#e8f5e9' : '#fff8e1',
                                display: 'flex', gap: 1, alignItems: 'flex-start',
                            }}>
                                <LocalShipping sx={{ fontSize: 18, color: shipFee === 0 ? '#2e7d32' : '#f57c00', mt: 0.2 }} />
                                <Typography variant="caption" color={shipFee === 0 ? '#2e7d32' : '#f57c00'} fontWeight={600}>
                                    {shipFee === 0
                                        ? '🎉 Miễn phí vận chuyển!'
                                        : `Mua thêm ${fmt(FREE_SHIP - totalPrice)} để miễn phí ship`}
                                </Typography>
                            </Box>

                            {/* Price breakdown */}
                            {[
                                { label: 'Tạm tính', value: fmt(totalPrice), color: 'text.primary' },
                                { label: 'Tiết kiệm', value: `-${fmt(totalSaved)}`, color: '#2e7d32', show: totalSaved > 0 },
                                { label: `Mã BOOK10 (-10%)`, value: `-${fmt(discount)}`, color: '#d32f2f', show: couponApplied },
                                { label: 'Phí vận chuyển', value: shipFee === 0 ? 'Miễn phí' : fmt(shipFee), color: shipFee === 0 ? '#2e7d32' : 'text.primary' },
                            ].filter(r => r.show !== false).map(({ label, value, color }) => (
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

                            <Button fullWidth variant="contained" size="large"
                                endIcon={<ArrowForward />}
                                onClick={() => navigate('/checkout')}
                                sx={{
                                    bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700,
                                    py: 1.5, fontSize: 15,
                                    '&:hover': { bgcolor: '#b71c1c' },
                                }}>
                                Tiến hành thanh toán
                            </Button>

                            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1.5}>
                                🔒 Thanh toán an toàn & bảo mật
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Suggested products */}
                {suggested.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ width: 4, height: 24, bgcolor: '#d32f2f', borderRadius: 2 }} />
                            <Typography variant="h6" fontWeight={800}>Có thể bạn cũng thích</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {suggested.map(p => (
                                <Grid item xs={6} sm={4} md={3} key={p.id}>
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