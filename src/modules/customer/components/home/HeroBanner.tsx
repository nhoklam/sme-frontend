// src/modules/customer/components/Home/HeroBanner.jsx
import React, { useState } from 'react';
import { Box, Grid, Button, Chip, IconButton, Typography } from '@mui/material';
import { ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';
import { BANNERS } from '../../../../utils/constants';

const HeroBanner = () => {
    const [idx, setIdx] = useState(0);
    const banner = BANNERS[idx];

    const prev = () => setIdx((idx - 1 + BANNERS.length) % BANNERS.length);
    const next = () => setIdx((idx + 1) % BANNERS.length);

    // Chiều cao đồng nhất giữa main banner và 2 side banners
    const TOTAL_HEIGHT = 320;
    const SIDE_GAP = 2; // spacing giữa 2 side banner (theme spacing)

    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'stretch' }}>

            {/* ── Main banner (chiếm ~65%) ── */}
            <Box sx={{
                flex: '0 0 calc(65% - 8px)',
                background: banner.bg,
                borderRadius: 3,
                p: { xs: 3, md: 5 },
                minHeight: TOTAL_HEIGHT,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <Box sx={{ position: 'absolute', right: -50, top: -50, width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', right: 80, bottom: -70, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', left: -30, top: '50%', transform: 'translateY(-50%)', width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                <Chip label={banner.tag} sx={{
                    bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                    fontWeight: 700, width: 'fit-content', mb: 2, fontSize: 12,
                    letterSpacing: 0.5,
                }} />

                <Typography
                    variant="h2" fontWeight={900} color="#fff"
                    sx={{
                        lineHeight: 1.05, mb: 2,
                        whiteSpace: 'pre-line',
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                        textShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    }}
                >
                    {banner.title}
                </Typography>

                <Typography variant="body1" color="rgba(255,255,255,0.88)" sx={{ mb: 3, fontSize: 15 }}>
                    {banner.sub}
                </Typography>

                <Button variant="contained" sx={{
                    bgcolor: '#fff', color: '#d32f2f', fontWeight: 800,
                    textTransform: 'none', width: 'fit-content',
                    px: 3.5, py: 1.2, fontSize: 15,
                    borderRadius: 2.5,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: '#ffebee', transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(0,0,0,0.2)' },
                    transition: 'all 0.2s',
                }}>
                    {banner.btn} →
                </Button>

                {/* Dots */}
                <Box sx={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.75 }}>
                    {BANNERS.map((_, i) => (
                        <Box key={i} onClick={() => setIdx(i)} sx={{
                            width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
                            bgcolor: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                            cursor: 'pointer', transition: 'all 0.3s',
                        }} />
                    ))}
                </Box>

                {/* Arrows */}
                <IconButton onClick={prev} size="small" sx={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                }}>
                    <ArrowBackIos sx={{ fontSize: 14, ml: 0.5 }} />
                </IconButton>
                <IconButton onClick={next} size="small" sx={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                }}>
                    <ArrowForwardIos sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>

            {/* ── Side banners (chiếm ~35%) — 2 ô xếp dọc bằng đúng chiều cao main ── */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minHeight: TOTAL_HEIGHT,
            }}>
                {/* Side 1: Flash Sale */}
                <Box sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
                    borderRadius: 2.5, p: 2.5,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <Box sx={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="caption" color="rgba(255,255,255,0.85)" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                        ⚡ FLASH SALE
                    </Typography>
                    <Typography variant="h6" fontWeight={900} color="#fff" sx={{ mt: 0.5, lineHeight: 1.2 }}>
                        Combo 3 cuốn
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.88)" sx={{ mt: 0.5, mb: 1.5 }}>
                        Chỉ từ 150.000đ
                    </Typography>
                    <Button size="small" sx={{
                        bgcolor: '#fff', color: '#e65100',
                        textTransform: 'none', fontWeight: 700,
                        width: 'fit-content', borderRadius: 2,
                        px: 2, '&:hover': { bgcolor: '#fff3e0' },
                    }}>
                        Xem ngay
                    </Button>
                </Box>

                {/* Side 2: Thành viên */}
                <Box sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)',
                    borderRadius: 2.5, p: 2.5,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="caption" color="rgba(255,255,255,0.85)" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                        🎁 ƯU ĐÃI THÀNH VIÊN
                    </Typography>
                    <Typography variant="h6" fontWeight={900} color="#fff" sx={{ mt: 0.5, lineHeight: 1.2 }}>
                        Tích điểm đổi quà
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.88)" sx={{ mt: 0.5, mb: 1.5 }}>
                        Đăng ký miễn phí ngay
                    </Typography>
                    <Button size="small" href="/register" sx={{
                        bgcolor: '#fff', color: '#6a1b9a',
                        textTransform: 'none', fontWeight: 700,
                        width: 'fit-content', borderRadius: 2,
                        px: 2, '&:hover': { bgcolor: '#f3e5f5' },
                    }}>
                        Đăng ký
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default HeroBanner;