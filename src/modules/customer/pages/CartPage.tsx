// src/modules/customer/pages/CartPage.tsx
import React, { useState, useEffect } from 'react';
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
        appliedPromotions, setAppliedPromotions
    } = useCartContext();
    const [coupon, setCoupon] = useState('');
    const [couponErr, setCouponErr] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [activePromotions, setActivePromotions] = useState<any[]>([]);

    useEffect(() => {
        promotionService.getActive().then(res => setActivePromotions(res)).catch(console.error);
    }, []);

    const rawShipFee = totalPrice >= FREE_SHIP ? 0 : 30000;

    const calcDiscount = () => {
        let orderDiscount = 0;
        let shipDiscount = 0;
        
        appliedPromotions.forEach(promo => {
            let d = 0;
            if (promo.discountAmount !== undefined) {
                d = promo.discountAmount;
            } else {
                if (promo.type === 'FIXED_AMOUNT') {
                    d = promo.discountValue;
                } else if (promo.type === 'PERCENTAGE') {
                    d = (totalPrice * promo.discountValue) / 100;
                    if (promo.maxDiscountAmount) d = Math.min(d, promo.maxDiscountAmount);
                }
                d = Math.round(d);
            }
            
            const isShipping = promo.promotionSlot === 'SHIPPING' || promo.code?.toUpperCase().includes('SHIP') || promo.code?.toUpperCase().includes('FREE');
            
            if (isShipping) {
                shipDiscount += Math.min(d, rawShipFee);
            } else {
                orderDiscount += Math.min(d, totalPrice);
            }
        });
        
        return { orderDiscount, shipDiscount };
    };

    const { orderDiscount, shipDiscount } = calcDiscount();
    const discount = orderDiscount + shipDiscount;
    const finalShipFee = rawShipFee - shipDiscount;
    const finalPrice = totalPrice - orderDiscount + finalShipFee;

    // Load suggested products from API
    const { products: allProducts } = useProducts({ size: 8, page: 0 });
    const cartItemIds = new Set(items.map((i: any) => i.id));
    const suggested = allProducts.filter(p => !cartItemIds.has(p.id)).slice(0, 4);

    const applyCoupon = async (codeToApply?: string) => {
        const targetCode = typeof codeToApply === 'string' ? codeToApply : coupon;
        if (!targetCode.trim()) return;
        setIsValidating(true);
        setCouponErr('');
        try {
            const promoResult = await promotionService.validate(targetCode.trim(), totalPrice);
            const fullPromo = activePromotions.find(p => p.code?.toUpperCase() === targetCode.trim().toUpperCase());
            
            let newPromo: any;
            if (fullPromo) {
                newPromo = { ...fullPromo, discountAmount: promoResult.discountAmount };
            } else {
                newPromo = {
                    code: promoResult.code,
                    type: 'FIXED_AMOUNT',
                    discountValue: promoResult.discountAmount,
                    discountAmount: promoResult.discountAmount,
                    promotionSlot: targetCode.trim().toUpperCase().includes('SHIP') || targetCode.trim().toUpperCase().includes('FREE') ? 'SHIPPING' : 'ORDER'
                };
            }
            
            const isShipping = newPromo.promotionSlot === 'SHIPPING' || newPromo.code?.toUpperCase().includes('SHIP') || newPromo.code?.toUpperCase().includes('FREE');
            
            // Lọc bỏ mã cũ cùng loại (shipping hoặc order)
            const filteredPromos = appliedPromotions.filter(p => {
                const pIsShipping = p.promotionSlot === 'SHIPPING' || p.code?.toUpperCase().includes('SHIP') || p.code?.toUpperCase().includes('FREE');
                return pIsShipping !== isShipping;
            });
            
            setAppliedPromotions([...filteredPromos, newPromo]);

            if (typeof codeToApply === 'string') setCoupon(codeToApply);
            else setCoupon('');
        } catch (err: any) {
            setCouponErr(err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
        } finally {
            setIsValidating(false);
        }
    };

    const validOnlinePromos = activePromotions.filter(p => !p.applicableChannel || p.applicableChannel === 'ONLINE' || p.applicableChannel === 'ALL');
    const shippingPromos = validOnlinePromos.filter(p => p.promotionSlot === 'SHIPPING' || p.code?.toUpperCase().includes('SHIP') || p.code?.toUpperCase().includes('FREE'));
    const orderPromos = validOnlinePromos.filter(p => p.promotionSlot !== 'SHIPPING' && !p.code?.toUpperCase().includes('SHIP') && !p.code?.toUpperCase().includes('FREE'));

    const renderPromoList = (promos: any[], title: string, icon: string) => {
        if (promos.length === 0) return null;
        return (
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px dashed #e2e8f0' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon} {title}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 220, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' } }}>
                    {promos.map(promo => {
                        const minOrder = promo.minOrderAmount || 0;
                        const isEligible = totalPrice >= minOrder;
                        const isApplied = appliedPromotions.some((ap: any) => ap.code === promo.code);
                        return (
                            <Box key={promo.id} sx={{
                                display: 'flex', alignItems: 'center', p: 1.5,
                                border: '1px solid',
                                borderColor: isApplied ? '#f5a623' : '#e2e8f0',
                                borderRadius: '10px',
                                bgcolor: isApplied ? '#fffdf7' : '#fff',
                                opacity: isEligible ? 1 : 0.6,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: isEligible ? (isApplied ? '#f5a623' : '#cbd5e1') : '#e2e8f0',
                                    transform: isEligible ? 'translateY(-1px)' : 'none',
                                    boxShadow: isEligible ? '0 4px 12px rgba(0,0,0,0.03)' : 'none'
                                }
                            }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, color: isApplied ? '#d97706' : '#1e293b', fontSize: '1rem' }}>
                                            {promo.code}
                                        </Typography>
                                        <Chip size="small" label={promo.type === 'PERCENTAGE' ? `Giảm ${promo.discountValue}%` : `Giảm ${fmt(promo.discountValue)}`}
                                            sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: '#fee2e2', color: '#ef4444', borderRadius: '6px' }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                                        {promo.name}
                                    </Typography>
                                    {minOrder > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: isEligible ? '#10b981' : '#ef4444' }} />
                                            <Typography variant="caption" sx={{ color: isEligible ? '#64748b' : '#ef4444', fontWeight: 600 }}>
                                                Đơn tối thiểu {fmt(minOrder)}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                                <Button
                                    variant={isApplied ? "contained" : "outlined"}
                                    size="small"
                                    disabled={!isEligible && !isApplied}
                                    onClick={() => {
                                        if (isApplied) {
                                            setAppliedPromotions(appliedPromotions.filter((ap: any) => ap.code !== promo.code));
                                        } else {
                                            applyCoupon(promo.code);
                                        }
                                    }}
                                    sx={{
                                        minWidth: 76, height: 34,
                                        borderRadius: '8px', textTransform: 'none', fontWeight: 800,
                                        bgcolor: isApplied ? '#f5a623' : 'transparent',
                                        color: isApplied ? '#fff' : '#2563eb',
                                        borderColor: isApplied ? '#f5a623' : '#bfdbfe',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            bgcolor: isApplied ? '#d97706' : '#eff6ff',
                                            boxShadow: 'none'
                                        }
                                    }}
                                >
                                    {isApplied ? 'Bỏ chọn' : 'Áp dụng'}
                                </Button>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
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
                                {appliedPromotions.map((p: any, idx: number) => (
                                    <Chip
                                        key={idx}
                                        label={p.type === 'PERCENTAGE' ? `Giảm ${p.discountValue}%` : `Giảm ${fmt(p.discountValue)}`}
                                        size="small"
                                        onDelete={() => setAppliedPromotions(appliedPromotions.filter((ap: any) => ap.code !== p.code))}
                                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800, fontSize: '0.75rem' }}
                                    />
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    size="medium"
                                    fullWidth
                                    placeholder="Nhập mã ưu đãi của bạn..."
                                    value={coupon}
                                    onChange={e => { setCoupon(e.target.value); setCouponErr(''); }}
                                    error={!!couponErr}
                                    helperText={couponErr || (appliedPromotions.length > 0 ? `🎉 Đã áp dụng thành công ${appliedPromotions.length} mã ưu đãi` : 'Mỗi đơn hàng có thể áp dụng 1 phí ship & 1 hóa đơn')}
                                    FormHelperTextProps={{
                                        sx: { color: appliedPromotions.length > 0 ? '#2e7d32' : 'text.secondary', fontWeight: appliedPromotions.length > 0 ? 600 : 400 },
                                    }}
                                    disabled={isValidating}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                        },
                                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#f5a623',
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => applyCoupon()}
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
                            </Box>

                            {/* Danh sách mã giảm giá gợi ý */}
                            {renderPromoList(shippingPromos, 'Mã giảm giá vận chuyển', '🚚')}
                            {renderPromoList(orderPromos, 'Mã giảm giá đơn hàng', '🎟️')}
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
                                bgcolor: finalShipFee === 0 ? 'rgba(46, 125, 50, 0.06)' : 'rgba(245, 166, 35, 0.08)',
                                display: 'flex',
                                gap: 1.2,
                                alignItems: 'flex-start',
                            }}>
                                <LocalShipping sx={{
                                    fontSize: 20,
                                    color: finalShipFee === 0 ? '#2e7d32' : '#db941e',
                                    mt: 0.2,
                                }} />
                                <Typography
                                    variant="caption"
                                    color={finalShipFee === 0 ? '#2e7d32' : '#db941e'}
                                    sx={{ fontWeight: 700, lineHeight: 1.5, fontSize: '0.8rem' }}
                                >
                                    {finalShipFee === 0
                                        ? 'Chúc mừng! Bạn đã nhận ưu đãi Miễn phí vận chuyển.'
                                        : `Mua thêm ${fmt(FREE_SHIP - totalPrice)} để được Miễn phí vận chuyển.`}
                                </Typography>
                            </Box>

                            {/* Progress bar */}
                            <Box sx={{ height: 6, bgcolor: '#f0f0f2', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
                                <Box sx={{
                                    height: '100%',
                                    width: `${Math.min((totalPrice / FREE_SHIP) * 100, 100)}%`,
                                    bgcolor: finalShipFee === 0 ? '#2e7d32' : '#f5a623',
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

                                {appliedPromotions.map((promo: any, idx: number) => {
                                    const isShipping = promo.promotionSlot === 'SHIPPING' || promo.code?.toUpperCase().includes('SHIP') || promo.code?.toUpperCase().includes('FREE');
                                    let d = 0;
                                    if (promo.discountAmount !== undefined) d = promo.discountAmount;
                                    else if (promo.type === 'FIXED_AMOUNT') d = promo.discountValue;
                                    else if (promo.type === 'PERCENTAGE') d = (totalPrice * promo.discountValue) / 100;
                                    const finalD = isShipping ? Math.min(d, rawShipFee) : Math.min(d, totalPrice);
                                    
                                    if (finalD === 0) return null;
                                    return (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Mã giảm giá ({promo.code})</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff4d4f' }}>-{fmt(finalD)}</Typography>
                                        </Box>
                                    );
                                })}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: finalShipFee === 0 ? '#2e7d32' : '#1a1a2e' }}>
                                        {finalShipFee === 0 ? 'Miễn phí' : (
                                            rawShipFee !== finalShipFee ? (
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                  <Box component="span" sx={{ textDecoration: 'line-through', color: '#8c9ba5', fontSize: '0.75rem', fontWeight: 500 }}>{fmt(rawShipFee)}</Box>
                                                  {fmt(finalShipFee)}
                                                </Box>
                                            ) : fmt(rawShipFee)
                                        )}
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