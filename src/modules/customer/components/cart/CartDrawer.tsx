// src/modules/customer/components/cart/CartDrawer.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Drawer, Box, Typography, Button, IconButton,
    Chip,
} from '@mui/material';
import { Close, ShoppingCartOutlined, ArrowForward, LocalShipping } from '@mui/icons-material';
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
                sx: {
                    width: { xs: '100vw', sm: 400 },
                    display: 'flex', flexDirection: 'column',
                    bgcolor: '#FAFAFA',
                },
            }}
        >
            {/* ── Header ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2.5, py: 2,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: '#fff',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <ShoppingCartOutlined sx={{ fontSize: 22 }} />
                    <Typography fontWeight={700} sx={{ fontSize: 16 }}>
                        Giỏ hàng
                    </Typography>
                    {totalItems > 0 && (
                        <Chip label={totalItems} size="small" sx={{
                            bgcolor: '#C92127', color: '#fff',
                            fontWeight: 700, height: 22, fontSize: 12,
                            '& .MuiChip-label': { px: 1 },
                        }} />
                    )}
                </Box>
                <IconButton size="small" onClick={closeCart} sx={{
                    color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                }}>
                    <Close sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* ── Free-ship progress ── */}
            {totalItems > 0 && (
                <Box sx={{
                    px: 2.5, py: 1.5,
                    bgcolor: toShip > 0 ? '#FFF8E1' : '#E8F5E9',
                    borderBottom: '1px solid',
                    borderColor: toShip > 0 ? '#FFE0B2' : '#C8E6C9',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                        <LocalShipping sx={{ fontSize: 16, color: toShip > 0 ? '#EF6C00' : '#2E7D32' }} />
                        <Typography sx={{
                            fontSize: 12.5, fontWeight: 600,
                            color: toShip > 0 ? '#E65100' : '#1B5E20',
                        }}>
                            {toShip > 0
                                ? `Mua thêm ${fmt(toShip)} để được miễn phí vận chuyển!`
                                : 'Bạn đã đủ điều kiện miễn phí vận chuyển!'
                            }
                        </Typography>
                    </Box>
                    <Box sx={{ height: 5, bgcolor: toShip > 0 ? '#FFE0B2' : '#C8E6C9', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{
                            height: '100%', borderRadius: 3,
                            width: `${shipProgress}%`,
                            background: toShip > 0
                                ? 'linear-gradient(90deg, #FFB74D, #EF6C00)'
                                : 'linear-gradient(90deg, #66BB6A, #2E7D32)',
                            transition: 'width 0.5s ease',
                        }} />
                    </Box>
                </Box>
            )}

            {/* ── Items ── */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 1.5 }}>
                {items.length === 0 ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: '100%', gap: 2, py: 8,
                    }}>
                        <Box sx={{
                            width: 80, height: 80, borderRadius: '50%',
                            bgcolor: '#F0F0F5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ShoppingCartOutlined sx={{ fontSize: 36, color: '#BDBDBD' }} />
                        </Box>
                        <Typography fontWeight={600} sx={{ color: '#666', fontSize: 15 }}>
                            Giỏ hàng trống
                        </Typography>
                        <Typography sx={{ color: '#999', fontSize: 13, textAlign: 'center', px: 4 }}>
                            Hãy khám phá và thêm sách yêu thích vào giỏ hàng nhé!
                        </Typography>
                        <Button variant="contained" onClick={() => { closeCart(); navigate('/shop'); }} sx={{
                            bgcolor: '#1a1a2e', textTransform: 'none', fontWeight: 600,
                            borderRadius: '24px', px: 4, mt: 1,
                            '&:hover': { bgcolor: '#16213e' },
                        }}>
                            Khám phá sách ngay
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{
                        bgcolor: '#fff', borderRadius: '12px', px: 1.5, py: 0.5,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        {items.map(item => (
                            <CartItem key={(item as any).id || item.productId} item={item} onUpdateQty={updateQty} onRemove={removeItem} />
                        ))}
                    </Box>
                )}
            </Box>

            {/* ── Footer ── */}
            {items.length > 0 && (
                <Box sx={{
                    borderTop: '1px solid #E8E8E8',
                    px: 2.5, py: 2, bgcolor: '#fff',
                    boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
                }}>
                    {totalSaved > 0 && (
                        <Box sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            mb: 1.25, p: 1.25, bgcolor: '#E8F5E9', borderRadius: '8px',
                        }}>
                            <Typography sx={{ fontSize: 12.5, color: '#2E7D32', fontWeight: 600 }}>
                                🎉 Bạn tiết kiệm được
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: '#1B5E20', fontWeight: 700 }}>
                                {fmt(totalSaved)}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontSize: 13.5, color: '#777' }}>
                            Tạm tính ({totalItems} sản phẩm)
                        </Typography>
                        <Typography fontWeight={800} sx={{ fontSize: 18, color: '#C92127' }}>
                            {fmt(totalPrice)}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button fullWidth variant="outlined" onClick={handleViewCart} sx={{
                            borderColor: '#1a1a2e', color: '#1a1a2e',
                            textTransform: 'none', fontWeight: 600,
                            borderRadius: '10px', fontSize: 13.5, py: 1.1,
                            '&:hover': { bgcolor: '#F5F5FA', borderColor: '#1a1a2e' },
                        }}>
                            Xem giỏ hàng
                        </Button>
                        <Button fullWidth variant="contained" endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                            onClick={handleCheckout} sx={{
                                bgcolor: '#C92127', textTransform: 'none', fontWeight: 700,
                                borderRadius: '10px', fontSize: 13.5, py: 1.1,
                                boxShadow: '0 4px 12px rgba(201,33,39,0.3)',
                                '&:hover': { bgcolor: '#A91B20', boxShadow: '0 6px 16px rgba(201,33,39,0.4)' },
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