import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Skeleton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useCategories } from '../../hooks/useCategories';

const CategorySlider = () => {
    const navigate = useNavigate();
    const { categories, isLoading } = useCategories();
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
                pb: 1,
                borderBottom: '2px solid #e8401c',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 4, height: 20,
                        bgcolor: '#e8401c',
                        borderRadius: 1,
                    }} />
                    <Typography
                        fontWeight={800}
                        sx={{
                            fontSize: 14,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: '#1a1a1a',
                            fontFamily: '"Segoe UI", sans-serif',
                        }}
                    >
                        DANH MỤC SÁCH
                    </Typography>
                </Box>
                <Typography
                    onClick={() => navigate('/shop')}
                    sx={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#e8401c',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    Xem tất cả ›
                </Typography>
            </Box>

            {/* Scroll container */}
            <Box sx={{ position: 'relative' }}>
                {/* Left arrow */}
                <Box
                    onClick={() => scroll('left')}
                    sx={{
                        position: 'absolute', left: -10, top: '50%',
                        transform: 'translateY(-50%)', zIndex: 2,
                        width: 24, height: 24, bgcolor: '#fff',
                        borderRadius: '50%',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#fff3f0', boxShadow: '0 2px 8px rgba(232,64,28,0.3)' },
                        transition: 'all 0.15s',
                    }}
                >
                    <ChevronLeft sx={{ fontSize: 16, color: '#555' }} />
                </Box>

                <Box
                    ref={scrollRef}
                    sx={{
                        display: 'flex',
                        gap: 0.75,
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                        py: 0.5,
                        px: 0.5,
                    }}
                >
                    {isLoading
                        ? Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="rounded"
                                width={100}
                                height={34}
                                sx={{ flexShrink: 0, borderRadius: 5 }}
                            />
                        ))
                        : categories.map(cat => (
                            <Box
                                key={cat.id}
                                onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
                                sx={{
                                    flexShrink: 0,
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: 5,
                                    border: '1.5px solid #e0e0e0',
                                    bgcolor: '#fff',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.6,
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                        borderColor: '#e8401c',
                                        bgcolor: '#fff3f0',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 2px 8px rgba(232,64,28,0.15)',
                                    },
                                }}
                            >
                                <Typography sx={{ fontSize: 14, lineHeight: 1 }}>{cat.icon}</Typography>
                                <Typography
                                    sx={{
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        color: '#333',
                                        fontFamily: '"Segoe UI", sans-serif',
                                    }}
                                >
                                    {cat.name}
                                </Typography>
                            </Box>
                        ))
                    }
                </Box>

                {/* Right arrow */}
                <Box
                    onClick={() => scroll('right')}
                    sx={{
                        position: 'absolute', right: -10, top: '50%',
                        transform: 'translateY(-50%)', zIndex: 2,
                        width: 24, height: 24, bgcolor: '#fff',
                        borderRadius: '50%',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#fff3f0', boxShadow: '0 2px 8px rgba(232,64,28,0.3)' },
                        transition: 'all 0.15s',
                    }}
                >
                    <ChevronRight sx={{ fontSize: 16, color: '#555' }} />
                </Box>
            </Box>
        </Box>
    );
};

export default CategorySlider;