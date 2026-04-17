// src/modules/customer/components/cart/CartDrawer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Drawer, Box, Typography, Button, IconButton,
    Divider, Chip, Badge,
} from '@mui/material';
import { Close, ShoppingCartOutlined, ArrowForward } from '@mui/icons-material';
import CartItem from './CartItem';
import { useCartContext } from '../../../../store/CartContext';
import { fmt } from '../../../../utils/constants';

const FREE_SHIP_THRESHOLD = 150000;

const CartDrawer = () => {
    const navigate = useNavigate();
    const { items, cartOpen, closeCart, removeItem, updateQty, totalItems, totalPrice, totalSaved } = useCartContext();

    const toShip = FREE_SHIP_THRESHOLD - totalPrice;
    const shipProgress = Math.min((totalPrice / FREE_SHIP_THRESHOLD) * 100, 100);

    const handleCheckout = () => {
        closeCart();
        navigate('/checkout');
    };

    const handleViewCart = () => {
        closeCart();
        navigate('/cart');
    };

    return (
        <Drawer
            anchor="right"
            open={cartOpen}
            onClose={closeCart}
            PaperProps={{
                sx: {
                    width: { xs: '100vw', sm: 400 },
                    display: 'flex', flexDirection: 'column',
                },
            }}
        >
            {/* ── Header ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2.5, py: 2, borderBottom: '1px solid #f0f0f0',
                bgcolor: '#fff',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartOutlined sx={{ color: '#d32f2f' }} />
                    <Typography variant="h6" fontWeight={700}>
                        Giỏ hàng
                    </Typography>
                    {totalItems > 0 && (
                        <Chip label={totalItems} size="small"
                            sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 700, height: 22, fontSize: 11 }} />
                    )}
                </Box>
                <IconButton size="small" onClick={closeCart}
                    sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <Close />
                </IconButton>
            </Box>

            {/* ── Free ship progress ── */}
            {totalItems > 0 && (
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: toShip > 0 ? '#fff8e1' : '#e8f5e9' }}>
                    {toShip > 0 ? (
                        <Typography variant="caption" color="#f57c00" fontWeight={600}>
                            🚚 Mua thêm <strong>{fmt(toShip)}</strong> để được miễn phí vận chuyển!
                        </Typography>
                    ) : (
                        <Typography variant="caption" color="#2e7d32" fontWeight={600}>
                            🎉 Bạn đã đủ điều kiện miễn phí vận chuyển!
                        </Typography>
                    )}
                    {/* Progress bar */}
                    <Box sx={{ mt: 0.75, height: 5, bgcolor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{
                            height: '100%', borderRadius: 3,
                            width: `${shipProgress}%`,
                            bgcolor: toShip > 0 ? '#f57c00' : '#4caf50',
                            transition: 'width 0.4s ease',
                        }} />
                    </Box>
                </Box>
            )}

            {/* ── Cart items ── */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 1 }}>
                {items.length === 0 ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: '100%', gap: 2, py: 8,
                    }}>
                        <Typography fontSize={64}>🛒</Typography>
                        <Typography variant="body1" fontWeight={600} color="text.secondary">
                            Giỏ hàng trống
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            Hãy thêm sách vào giỏ để tiếp tục mua sắm
                        </Typography>
                        <Button variant="contained" onClick={() => { closeCart(); navigate('/shop'); }}
                            sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b71c1c' } }}>
                            Khám phá sách ngay
                        </Button>
                    </Box>
                ) : (
                    items.map(item => (
                        <CartItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeItem} />
                    ))
                )}
            </Box>

            {/* ── Footer: Summary + Actions ── */}
            {items.length > 0 && (
                <Box sx={{ borderTop: '1px solid #f0f0f0', px: 2.5, py: 2, bgcolor: '#fff' }}>
                    {/* Savings */}
                    {totalSaved > 0 && (
                        <Box sx={{
                            display: 'flex', justifyContent: 'space-between',
                            mb: 1, p: 1.2, bgcolor: '#e8f5e9', borderRadius: 1.5,
                        }}>
                            <Typography variant="caption" color="#2e7d32" fontWeight={600}>
                                🎉 Tiết kiệm được
                            </Typography>
                            <Typography variant="caption" color="#2e7d32" fontWeight={700}>
                                {fmt(totalSaved)}
                            </Typography>
                        </Box>
                    )}

                    {/* Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Tạm tính ({totalItems} sản phẩm)
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="#d32f2f">
                            {fmt(totalPrice)}
                        </Typography>
                    </Box>

                    {/* Buttons */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                            fullWidth variant="outlined"
                            onClick={handleViewCart}
                            sx={{
                                borderColor: '#d32f2f', color: '#d32f2f',
                                textTransform: 'none', fontWeight: 600,
                                '&:hover': { bgcolor: '#ffebee' },
                            }}
                        >
                            Xem giỏ hàng
                        </Button>
                        <Button
                            fullWidth variant="contained"
                            endIcon={<ArrowForward />}
                            onClick={handleCheckout}
                            sx={{
                                bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700,
                                '&:hover': { bgcolor: '#b71c1c' },
                            }}
                        >
                            Thanh toán
                        </Button>
                    </Box>
                </Box>
            )}
        </Drawer>
    );
};

export default CartDrawer;