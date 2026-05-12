// src/modules/customer/components/cart/CartDrawer.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Drawer, Box, Typography, Button, IconButton,
    Divider, Chip,
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

    const handleCheckout = () => { closeCart(); navigate('/checkout'); };
    const handleViewCart = () => { closeCart(); navigate('/cart'); };

    return (
        <Drawer
            anchor="right"
            open={cartOpen}
            onClose={closeCart}
            PaperProps={{
                sx: { width: { xs: '100vw', sm: 390 }, display: 'flex', flexDirection: 'column' },
            }}
        >
            {/* Header */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2.5, py: 1.75,
                borderBottom: '1px solid #ececec',
                bgcolor: '#fff',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartOutlined sx={{ color: '#e8401c', fontSize: 20 }} />
                    <Typography fontWeight={700} sx={{ fontFamily: '"Segoe UI", sans-serif', fontSize: 15 }}>
                        Giỏ hàng
                    </Typography>
                    {totalItems > 0 && (
                        <Chip label={totalItems} size="small" sx={{
                            bgcolor: '#e8401c', color: '#fff',
                            fontWeight: 700, height: 20, fontSize: 11,
                        }} />
                    )}
                </Box>
                <IconButton size="small" onClick={closeCart} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Free ship progress */}
            {totalItems > 0 && (
                <Box sx={{ px: 2.5, py: 1.25, bgcolor: toShip > 0 ? '#fff8e1' : '#e8f5e9' }}>
                    <Typography sx={{
                        fontSize: 12, fontWeight: 600,
                        color: toShip > 0 ? '#f57c00' : '#2e7d32',
                        fontFamily: '"Segoe UI", sans-serif',
                    }}>
                        {toShip > 0
                            ? `🚚 Mua thêm ${fmt(toShip)} để được miễn phí vận chuyển!`
                            : '🎉 Bạn đã đủ điều kiện miễn phí vận chuyển!'
                        }
                    </Typography>
                    <Box sx={{ mt: 0.6, height: 4, bgcolor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{
                            height: '100%', borderRadius: 2,
                            width: `${shipProgress}%`,
                            bgcolor: toShip > 0 ? '#f57c00' : '#4caf50',
                            transition: 'width 0.4s ease',
                        }} />
                    </Box>
                </Box>
            )}

            {/* Items */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 1 }}>
                {items.length === 0 ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: '100%', gap: 1.5, py: 8,
                    }}>
                        <Typography fontSize={56}>🛒</Typography>
                        <Typography fontWeight={600} sx={{ color: '#888', fontFamily: '"Segoe UI", sans-serif' }}>
                            Giỏ hàng trống
                        </Typography>
                        <Typography sx={{ color: '#aaa', fontSize: 13, textAlign: 'center', fontFamily: '"Segoe UI", sans-serif' }}>
                            Hãy thêm sách vào giỏ để tiếp tục
                        </Typography>
                        <Button variant="contained" onClick={() => { closeCart(); navigate('/shop'); }} sx={{
                            bgcolor: '#e8401c', textTransform: 'none', fontWeight: 600,
                            borderRadius: 1.5, fontFamily: '"Segoe UI", sans-serif',
                            '&:hover': { bgcolor: '#c62828' },
                        }}>
                            Khám phá sách ngay
                        </Button>
                    </Box>
                ) : (
                    items.map(item => (
                        <CartItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeItem} />
                    ))
                )}
            </Box>

            {/* Footer */}
            {items.length > 0 && (
                <Box sx={{ borderTop: '1px solid #ececec', px: 2.5, py: 2, bgcolor: '#fff' }}>
                    {totalSaved > 0 && (
                        <Box sx={{
                            display: 'flex', justifyContent: 'space-between',
                            mb: 1, p: 1.1, bgcolor: '#e8f5e9', borderRadius: 1,
                        }}>
                            <Typography sx={{ fontSize: 12, color: '#2e7d32', fontWeight: 600, fontFamily: '"Segoe UI", sans-serif' }}>
                                🎉 Tiết kiệm được
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#2e7d32', fontWeight: 700, fontFamily: '"Segoe UI", sans-serif' }}>
                                {fmt(totalSaved)}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
                        <Typography sx={{ fontSize: 13, color: '#888', fontFamily: '"Segoe UI", sans-serif' }}>
                            Tạm tính ({totalItems} sản phẩm)
                        </Typography>
                        <Typography fontWeight={800} color="#e8401c" sx={{ fontSize: 17, fontFamily: '"Segoe UI", sans-serif' }}>
                            {fmt(totalPrice)}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.25 }}>
                        <Button fullWidth variant="outlined" onClick={handleViewCart} sx={{
                            borderColor: '#e8401c', color: '#e8401c',
                            textTransform: 'none', fontWeight: 600,
                            borderRadius: 1.5, fontSize: 13,
                            fontFamily: '"Segoe UI", sans-serif',
                            '&:hover': { bgcolor: '#fff3f0' },
                        }}>
                            Xem giỏ hàng
                        </Button>
                        <Button fullWidth variant="contained" endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                            onClick={handleCheckout} sx={{
                                bgcolor: '#e8401c', textTransform: 'none', fontWeight: 700,
                                borderRadius: 1.5, fontSize: 13,
                                fontFamily: '"Segoe UI", sans-serif',
                                '&:hover': { bgcolor: '#c62828' },
                            }}>
                            Thanh toán
                        </Button>
                    </Box>
                </Box>
            )}
        </Drawer>
    );
};

export default CartDrawer;