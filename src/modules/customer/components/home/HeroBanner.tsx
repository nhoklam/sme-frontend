import React, { useState, useEffect } from 'react';
import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { BANNERS } from '../../../../utils/constants';

const HeroBanner = () => {
    const [idx, setIdx] = useState(0);
    const [animating, setAnimating] = useState(false);
    const banner = BANNERS[idx];

    const prev = () => {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => { setIdx((idx - 1 + BANNERS.length) % BANNERS.length); setAnimating(false); }, 120);
    };
    const next = () => {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => { setIdx((idx + 1) % BANNERS.length); setAnimating(false); }, 120);
    };

    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [idx]);

    const TOTAL_HEIGHT = 290;

    return (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'stretch', height: TOTAL_HEIGHT }}>

            {/* ── Main Banner (65%) ── */}
            <Box sx={{
                flex: '0 0 calc(65% - 6px)',
                background: banner.bg,
                borderRadius: 2,
                px: { xs: 2.5, md: 3.5 },
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Subtle decorative circles */}
                <Box sx={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', right: 80, bottom: -60, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                <Chip
                    label={banner.tag}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontWeight: 700,
                        width: 'fit-content',
                        mb: 1.5,
                        fontSize: 10.5,
                        height: 22,
                        letterSpacing: 0.5,
                        fontFamily: '"Segoe UI", sans-serif',
                    }}
                />

                <Typography
                    fontWeight={900}
                    color="#fff"
                    sx={{
                        lineHeight: 1.1,
                        mb: 1.25,
                        whiteSpace: 'pre-line',
                        fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.2rem' },
                        textShadow: '0 1px 8px rgba(0,0,0,0.1)',
                        opacity: animating ? 0.7 : 1,
                        transition: 'opacity 0.12s',
                        fontFamily: '"Segoe UI", sans-serif',
                    }}
                >
                    {banner.title}
                </Typography>

                <Typography
                    color="rgba(255,255,255,0.88)"
                    sx={{ mb: 2.5, fontSize: 13, lineHeight: 1.6, fontFamily: '"Segoe UI", sans-serif' }}
                >
                    {banner.sub}
                </Typography>

                <Button
                    variant="contained"
                    size="small"
                    sx={{
                        bgcolor: '#fff',
                        color: '#e8401c',
                        fontWeight: 800,
                        textTransform: 'none',
                        width: 'fit-content',
                        px: 2.5,
                        py: 0.85,
                        fontSize: 13,
                        borderRadius: 1.5,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                        fontFamily: '"Segoe UI", sans-serif',
                        '&:hover': {
                            bgcolor: '#fff3f0',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.16)',
                        },
                        transition: 'all 0.18s',
                    }}
                >
                    {banner.btn} →
                </Button>

                {/* Dot indicators */}
                <Box sx={{
                    position: 'absolute', bottom: 12, left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex', gap: 0.5,
                }}>
                    {BANNERS.map((_, i) => (
                        <Box
                            key={i}
                            onClick={() => setIdx(i)}
                            sx={{
                                width: i === idx ? 18 : 6,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                        />
                    ))}
                </Box>

                {/* Arrow buttons */}
                <IconButton
                    onClick={prev}
                    size="small"
                    sx={{
                        position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', width: 28, height: 28,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' },
                    }}
                >
                    <ChevronLeft sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                    onClick={next}
                    size="small"
                    sx={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', width: 28, height: 28,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' },
                    }}
                >
                    <ChevronRight sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* ── Side Banners (35%) ── */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                height: TOTAL_HEIGHT,
            }}>
                {/* Flash Sale */}
                <Box sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #e8401c 0%, #c62828 100%)',
                    borderRadius: 2, px: 2.5, py: 2,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { filter: 'brightness(1.06)' },
                    transition: 'filter 0.2s',
                }}>
                    <Box sx={{ position: 'absolute', right: -18, top: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                    <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.8px', mb: 0.5, fontFamily: '"Segoe UI", sans-serif' }}>
                        ⚡ FLASH SALE
                    </Typography>
                    <Typography fontWeight={900} color="#fff" sx={{ lineHeight: 1.2, fontSize: 15, mb: 0.5, fontFamily: '"Segoe UI", sans-serif' }}>
                        Combo 3 cuốn
                    </Typography>
                    <Typography color="rgba(255,255,255,0.88)" sx={{ mb: 1.5, fontSize: 12, fontFamily: '"Segoe UI", sans-serif' }}>
                        Chỉ từ <strong>150.000đ</strong>
                    </Typography>
                    <Button size="small" sx={{
                        bgcolor: '#fff', color: '#e8401c',
                        textTransform: 'none', fontWeight: 700,
                        width: 'fit-content', borderRadius: 1.5,
                        px: 1.5, py: 0.4, fontSize: 12,
                        fontFamily: '"Segoe UI", sans-serif',
                        '&:hover': { bgcolor: '#fff3f0' },
                    }}>
                        Xem ngay →
                    </Button>
                </Box>

                {/* Member benefits */}
                <Box sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    borderRadius: 2, px: 2.5, py: 2,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { filter: 'brightness(1.06)' },
                    transition: 'filter 0.2s',
                }}>
                    <Box sx={{ position: 'absolute', right: -18, bottom: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                    <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.8px', mb: 0.5, fontFamily: '"Segoe UI", sans-serif' }}>
                        🎁 ƯU ĐÃI THÀNH VIÊN
                    </Typography>
                    <Typography fontWeight={900} color="#fff" sx={{ lineHeight: 1.2, fontSize: 15, mb: 0.5, fontFamily: '"Segoe UI", sans-serif' }}>
                        Tích điểm đổi quà
                    </Typography>
                    <Typography color="rgba(255,255,255,0.88)" sx={{ mb: 1.5, fontSize: 12, fontFamily: '"Segoe UI", sans-serif' }}>
                        Đăng ký <strong>miễn phí</strong> ngay!
                    </Typography>
                    <Button size="small" href="/register" sx={{
                        bgcolor: '#fff', color: '#1565c0',
                        textTransform: 'none', fontWeight: 700,
                        width: 'fit-content', borderRadius: 1.5,
                        px: 1.5, py: 0.4, fontSize: 12,
                        fontFamily: '"Segoe UI", sans-serif',
                        '&:hover': { bgcolor: '#e3f2fd' },
                    }}>
                        Đăng ký →
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default HeroBanner;