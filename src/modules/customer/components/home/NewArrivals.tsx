import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Button, Skeleton, IconButton } from '@mui/material';
import { AutoAwesome, ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import ProductCard from '../../../../components/common/ProductCard';
import { useCartContext } from '../../../../store/CartContext';
import { useProducts } from '../../hooks/useProducts';
import { useRef } from 'react';

const NewArrivals = () => {
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { products, isLoading } = useProducts({
        size: 10,
    });

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    return (
        <Box sx={{ mb: 5 }}>
            {/* Header */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: '#1a1a2e', borderRadius: '10px 10px 0 0',
                px: 3, py: 1.5,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AutoAwesome sx={{ color: '#FFD700', fontSize: 24 }} />
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '0.9rem', md: '1.1rem' }, letterSpacing: 1 }}>
                        SÁCH MỚI LÊN KỆ
                    </Typography>
                </Box>
                <Button
                    onClick={() => navigate('/shop')}
                    sx={{
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    Xem tất cả →
                </Button>
            </Box>

            {/* Scrollable Product Row */}
            <Box sx={{
                position: 'relative',
                bgcolor: '#fff',
                p: 2,
                borderRadius: '0 0 10px 10px',
                border: '1px solid #e8e8e8',
                borderTop: 'none',
            }}>
                <IconButton onClick={() => scroll('left')} sx={{
                    position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                    bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', width: 32, height: 32,
                    '&:hover': { bgcolor: '#f5f5f5' },
                }}>
                    <ArrowBackIosNew sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton onClick={() => scroll('right')} sx={{
                    position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                    bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', width: 32, height: 32,
                    '&:hover': { bgcolor: '#f5f5f5' },
                }}>
                    <ArrowForwardIos sx={{ fontSize: 14 }} />
                </IconButton>

                <Box ref={scrollRef} sx={{
                    display: 'flex', gap: 2, overflowX: 'auto', scrollSnapType: 'x mandatory',
                    '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none',
                }}>
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, idx) => (
                            <Box key={idx} sx={{ minWidth: 180, maxWidth: 180, scrollSnapAlign: 'start' }}>
                                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                                <Skeleton width="80%" sx={{ mt: 1 }} />
                                <Skeleton width="50%" />
                            </Box>
                        ))
                    ) : products.length === 0 ? (
                        <Box sx={{ width: '100%', py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary">Chưa có sách mới nào.</Typography>
                        </Box>
                    ) : (
                        products.map((product) => (
                            <Box key={product.id} sx={{ minWidth: 180, maxWidth: 180, scrollSnapAlign: 'start' }}>
                                <ProductCard
                                    id={product.id}
                                    title={product.title}
                                    author={product.author}
                                    coverImage={product.img}
                                    price={product.price}
                                    originalPrice={product.price * 1.1}
                                    badges={['new']}
                                    onAddToCart={() => {
                                        addToCart({
                                            ...product,
                                            oldPrice: product.price * 1.1,
                                            images: [product.img],
                                            stock: 50,
                                            category: 'Sách mới',
                                            categoryId: 'new_arrivals',
                                            qty: 1
                                        });
                                        openCart();
                                    }}
                                    onQuickView={(id) => navigate(`/product/${id}`)}
                                />
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default NewArrivals;
