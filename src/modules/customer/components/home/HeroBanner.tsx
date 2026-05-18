import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop',
        title: 'Sách Bán Chạy Tháng 6',
        subtitle: 'Khám phá những tựa sách đang được tìm kiếm nhiều nhất trên Bookly.',
        cta: 'Mua Ngay',
        link: '/shop?sort=popular'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2000&auto=format&fit=crop',
        title: 'Freeship Toàn Quốc',
        subtitle: 'Cho mọi đơn hàng từ 150.000đ. Đừng bỏ lỡ cơ hội sở hữu sách hay.',
        cta: 'Tìm Hiểu Thêm',
        link: '/shop'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2000&auto=format&fit=crop',
        title: 'Flash Sale Cuối Tuần',
        subtitle: 'Giảm giá lên đến 50% cho các tựa sách kinh điển.',
        cta: 'Săn Sale Ngay',
        link: '/shop?sale=true'
    }
];

const HeroBanner = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto slide
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

    return (
        <Box sx={{ 
            position: 'relative', width: '100%', height: { xs: '300px', md: '500px' }, 
            borderRadius: { xs: 0, md: '16px' }, overflow: 'hidden'
        }}>
            {/* Slides */}
            {SLIDES.map((slide, idx) => (
                <Box
                    key={slide.id}
                    sx={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        opacity: idx === currentSlide ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                        backgroundImage: `url(${slide.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(to right, rgba(26,26,46,0.9) 0%, rgba(26,26,46,0.4) 50%, transparent 100%)',
                        display: 'flex', alignItems: 'center', px: { xs: 4, md: 10 }
                    }}>
                        <Box sx={{ maxWidth: '600px', transform: idx === currentSlide ? 'translateY(0)' : 'translateY(20px)', opacity: idx === currentSlide ? 1 : 0, transition: 'all 0.8s ease 0.2s' }}>
                            <Typography variant="h2" sx={{ color: 'white', mb: 2, fontSize: { xs: '2rem', md: '3.5rem' }, lineHeight: 1.1 }}>
                                {slide.title}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                                {slide.subtitle}
                            </Typography>
                            <Button 
                                variant="contained" color="secondary" size="large"
                                onClick={() => navigate(slide.link)}
                                sx={{ borderRadius: '24px', px: 4, py: 1.5, fontSize: '1rem' }}
                            >
                                {slide.cta}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            ))}

            {/* Navigation Arrows */}
            <IconButton 
                onClick={prevSlide}
                sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
                <ArrowBackIosNew />
            </IconButton>
            <IconButton 
                onClick={nextSlide}
                sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
                <ArrowForwardIos />
            </IconButton>

            {/* Dots */}
            <Box sx={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
                {SLIDES.map((_, idx) => (
                    <Box 
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        sx={{ 
                            width: idx === currentSlide ? 24 : 8, height: 8, 
                            borderRadius: 4, bgcolor: idx === currentSlide ? 'var(--color-secondary)' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default HeroBanner;