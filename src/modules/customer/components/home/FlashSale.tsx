import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos, FlashOn } from '@mui/icons-material';
import ProductCard from '../../../../components/common/ProductCard';
import { useCartContext } from '../../../../store/CartContext';

// MOCK DATA for Flash Sale
const FLASH_SALE_PRODUCTS = [
    {
        id: 'f1', title: 'Suy Tưởng (Marcus Aurelius)', author: 'Marcus Aurelius',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
        price: 75000, originalPrice: 150000, rating: 4.9, reviewCount: 850,
        badges: ['sale'] as const, discountPercent: 50
    },
    {
        id: 'f2', title: 'Chiến Tranh Và Hòa Bình', author: 'Leo Tolstoy',
        coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop',
        price: 150000, originalPrice: 250000, rating: 4.8, reviewCount: 420,
        badges: ['sale'] as const, discountPercent: 40
    },
    {
        id: 'f3', title: 'Những Người Khốn Khổ', author: 'Victor Hugo',
        coverImage: 'https://images.unsplash.com/photo-1587876931567-564ce588bfbd?q=80&w=600&auto=format&fit=crop',
        price: 180000, originalPrice: 300000, rating: 4.9, reviewCount: 650,
        badges: ['sale'] as const, discountPercent: 40
    },
    {
        id: 'f4', title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu', author: 'Rosie Nguyễn',
        coverImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
        price: 45000, originalPrice: 90000, rating: 4.7, reviewCount: 1200,
        badges: ['sale'] as const, discountPercent: 50
    },
    {
        id: 'f5', title: 'Không Gia Đình', author: 'Hector Malot',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop',
        price: 65000, originalPrice: 130000, rating: 4.8, reviewCount: 890,
        badges: ['sale'] as const, discountPercent: 50
    }
];

const FlashSale = () => {
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();
    // Countdown Timer State
    const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 23, seconds: 45 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 0, minutes: 0, seconds: 0 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (time: number) => time.toString().padStart(2, '0');

    return (
        <Box sx={{
            mb: 6, borderRadius: '16px', overflow: 'hidden',
            background: 'linear-gradient(135deg, #d32f2f 0%, #ff5252 100%)', p: { xs: 3, md: 5 }
        }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, md: 0 } }}>
                    <FlashOn sx={{ color: 'white', fontSize: 40 }} />
                    <Typography variant="h3" sx={{ color: 'white', fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 700, fontStyle: 'italic' }}>
                        FLASH SALE
                    </Typography>

                    {/* Timer */}
                    <Box sx={{ display: 'flex', gap: 1, ml: { xs: 0, md: 2 } }}>
                        {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((t, idx) => (
                            <React.Fragment key={idx}>
                                <Box sx={{ bgcolor: 'var(--color-primary)', color: 'white', width: 40, height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 1, fontWeight: 700, fontSize: '1.2rem' }}>
                                    {formatTime(t)}
                                </Box>
                                {idx < 2 && <Typography sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>:</Typography>}
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>
                <Button variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    Xem tất cả {'>'}
                </Button>
            </Box>

            {/* Horizontal Scroll */}
            <Box sx={{
                display: 'flex', gap: 3, overflowX: 'auto', pb: 2,
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 4, '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' } }
            }}>
                {FLASH_SALE_PRODUCTS.map(product => (
                    <Box key={product.id} sx={{ minWidth: 260, maxWidth: 260 }}>
                        {/* We add a white background wrapper so ProductCard looks good on red */}
                        <Box sx={{ bgcolor: 'white', borderRadius: '12px', height: '100%', p: 1 }}>
                            <ProductCard 
                                {...product} 
                                onAddToCart={() => {
                                    addToCart({
                                        id: product.id,
                                        title: product.title,
                                        author: product.author,
                                        price: product.price,
                                        oldPrice: product.originalPrice || 0,
                                        img: product.coverImage,
                                        images: [product.coverImage],
                                        stock: 50,
                                        category: 'Flash Sale',
                                        categoryId: 'flash_sale'
                                    });
                                    openCart();
                                }}
                                onQuickView={(id) => navigate(`/product/${id}`)}
                            />

                            {/* Custom Progress Bar for Flash Sale */}
                            <Box sx={{ mt: 2, px: 2, pb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: 'var(--color-error)', fontWeight: 600 }}>Đã bán 85%</Typography>
                                </Box>
                                <Box sx={{ width: '100%', height: 6, bgcolor: '#ffebee', borderRadius: 3, overflow: 'hidden' }}>
                                    <Box sx={{ width: '85%', height: '100%', bgcolor: 'var(--color-error)' }} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default FlashSale;
