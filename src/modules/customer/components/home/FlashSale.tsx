import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Skeleton } from '@mui/material';
import { FlashOn, ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import { useCartContext } from '../../../../store/CartContext';
import { useProducts } from '../../hooks/useProducts';
import { fmt, getFakeDiscount, getFakeOriginalPrice } from '../../../../utils/constants';

const FlashSale = () => {
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { products, isLoading } = useProducts({ size: 8, sortBy: 'soldDesc' });

    const flashProducts = useMemo(() =>
        products.map((p, i) => {
            const disc = getFakeDiscount(p.id, p.sold || 0);
            const orig = p.oldPrice && p.oldPrice > p.price ? p.oldPrice : getFakeOriginalPrice(p.price, disc);
            const totalStock = p.stock + p.sold;
            const soldPercent = totalStock > 0 ? Math.round((p.sold / totalStock) * 100) : 0;
            return { ...p, originalPrice: orig, discountPercent: disc, displaySoldPercent: Math.max(10, soldPercent) };
        }), [products]);

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
    };

    if (!isLoading && flashProducts.length === 0) return null;

    return (
        <Box sx={{ mb: 5 }}>
            {/* Header */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: '#1a1a2e', borderRadius: '10px 10px 0 0',
                px: 3, py: 1.5,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FlashOn sx={{ color: '#FFD700', fontSize: 28 }} />
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1rem', md: '1.25rem' }, letterSpacing: 1 }}>
                        TOP SÁCH BÁN CHẠY
                    </Typography>
                </Box>
            </Box>

            {/* Product Slider */}
            <Box sx={{
                position: 'relative',
                border: '1px solid #e8e8e8', borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                bgcolor: '#fff',
                p: 2, pb: 2.5,
            }}>
                {/* Scroll arrows */}
                <IconButton onClick={() => scroll('left')} sx={{
                    position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                    bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', width: 32, height: 32,
                    '&:hover': { bgcolor: '#f5f5f5' },
                }}>
                    <ArrowBackIosNew sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton onClick={() => scroll('right')} sx={{
                    position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                    bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', width: 32, height: 32,
                    '&:hover': { bgcolor: '#f5f5f5' },
                }}>
                    <ArrowForwardIos sx={{ fontSize: 14 }} />
                </IconButton>

                <Box ref={scrollRef} sx={{
                    display: 'flex', gap: 2, overflowX: 'auto', scrollSnapType: 'x mandatory',
                    '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none',
                }}>
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Box key={i} sx={{ minWidth: 170, maxWidth: 170, scrollSnapAlign: 'start' }}>
                                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                                <Skeleton width="90%" sx={{ mt: 1 }} />
                                <Skeleton width="60%" />
                            </Box>
                        ))
                    ) : (
                        flashProducts.map((p) => (
                            <Box key={p.id} sx={{
                                minWidth: 170, maxWidth: 170, scrollSnapAlign: 'start', cursor: 'pointer',
                                transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
                            }}
                                onClick={() => navigate(`/product/${p.id}`)}
                            >
                                {/* Cover Image */}
                                <Box sx={{
                                    width: '100%', height: 200, borderRadius: '8px', overflow: 'hidden',
                                    bgcolor: '#f8f8f8', mb: 1, position: 'relative',
                                }}>
                                    <Box component="img" src={p.img} alt={p.title}
                                        onError={(e: any) => { e.target.src = 'https://placehold.co/170x200/f8f8f8/999?text=📚'; }}
                                        sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }}
                                    />
                                </Box>

                                {/* Title */}
                                <Typography sx={{
                                    fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3, mb: 0.5,
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    color: '#333', minHeight: 34,
                                }}>
                                    {p.title}
                                </Typography>

                                {/* Price row */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                    <Typography sx={{ color: '#1a1a2e', fontWeight: 800, fontSize: '0.9rem' }}>
                                        {fmt(p.price)}
                                    </Typography>
                                    <Typography sx={{
                                        color: '#999', fontSize: '0.75rem', textDecoration: 'line-through',
                                    }}>
                                        {fmt(p.originalPrice)}
                                    </Typography>
                                    <Box sx={{
                                        bgcolor: '#1a1a2e', color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                                        px: 0.6, py: 0.15, borderRadius: '3px', lineHeight: 1.3,
                                    }}>
                                        -{p.discountPercent}%
                                    </Box>
                                </Box>

                                {/* Sold progress bar */}
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#e53935' }}>
                                            Đã bán {p.sold}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        height: 6, bgcolor: '#ffcdd2', borderRadius: 3, overflow: 'hidden',
                                    }}>
                                        <Box sx={{
                                            height: '100%', borderRadius: 3,
                                            width: `${p.displaySoldPercent}%`,
                                            background: 'linear-gradient(90deg, #ff5252, #c62828)',
                                            transition: 'width 0.6s ease',
                                        }} />
                                    </Box>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default FlashSale;
