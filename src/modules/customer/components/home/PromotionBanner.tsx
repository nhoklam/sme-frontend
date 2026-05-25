import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { bannerApi } from '../../../../services/bannerApi';
import { useNavigate } from 'react-router-dom';
import { MenuBook, LocalShipping } from '@mui/icons-material';

const PromotionBanner = () => {
    const navigate = useNavigate();
    const { data: bannersRes } = useQuery({
        queryKey: ['promotionBanners'],
        queryFn: () => bannerApi.getActiveBanners('PROMO')
    });

    const activeBanners = bannersRes?.data || [];

    // Fallback banners nếu chưa có từ API
    const defaultBanners = [
        {
            id: 'default-1',
            title: 'Tuyển Chọn Sách Văn Học',
            subtitle: 'Kinh điển nhất mọi thời đại — Giảm đến 30%',
            bgcolor: 'linear-gradient(135deg, #FFB347 0%, #FFCC33 100%)',
            textColor: '#5D4037',
            icon: <MenuBook sx={{ fontSize: 80, color: 'rgba(255,255,255,0.25)' }} />,
            btnColor: '#E65100',
            linkUrl: '/shop',
        },
        {
            id: 'default-2',
            title: 'Sách Mới Nổi Bật',
            subtitle: 'Khám phá ngay bộ sưu tập sách mới nhất',
            bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textColor: '#fff',
            icon: <LocalShipping sx={{ fontSize: 80, color: 'rgba(255,255,255,0.2)' }} />,
            btnColor: '#fff',
            btnTextColor: '#5C2D91',
            linkUrl: '/shop',
        },
    ];

    const bannersToShow = activeBanners.length > 0 ? activeBanners : null;

    return (
        <Box sx={{ mb: 5 }}>
            <Grid container spacing={2.5}>
                {bannersToShow ? (
                    // API Banners
                    bannersToShow.slice(0, 2).map((banner, index) => (
                        <Grid size={{ xs: 12, md: 6 }} key={banner.id}>
                            <Box
                                onClick={() => navigate(banner.linkUrl || '/shop')}
                                sx={{
                                    background: banner.imageUrl
                                        ? `url(${banner.imageUrl}) center/cover no-repeat`
                                        : index === 0
                                            ? 'linear-gradient(135deg, #FFB347 0%, #FFCC33 100%)'
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '12px',
                                    p: { xs: 3, md: 4 },
                                    minHeight: 180,
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                    position: 'relative', overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                                    }
                                }}
                            >
                                {banner.imageUrl && (
                                    <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)', zIndex: 0 }} />
                                )}
                                <Typography sx={{
                                    fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.6rem' },
                                    color: '#fff', position: 'relative', zIndex: 1, mb: 1,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}>
                                    {banner.title}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)',
                                    position: 'relative', zIndex: 1, mb: 2,
                                }}>
                                    {banner.subtitle}
                                </Typography>
                                <Button variant="contained" sx={{
                                    alignSelf: 'flex-start', borderRadius: '24px', px: 3,
                                    bgcolor: 'rgba(255,255,255,0.2)', color: '#fff',
                                    fontWeight: 700, textTransform: 'none',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    position: 'relative', zIndex: 1,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }}>
                                    Khám Phá Ngay
                                </Button>
                            </Box>
                        </Grid>
                    ))
                ) : (
                    // Default Banners (no API data)
                    defaultBanners.map((banner) => (
                        <Grid size={{ xs: 12, md: 6 }} key={banner.id}>
                            <Box
                                onClick={() => navigate(banner.linkUrl)}
                                sx={{
                                    background: banner.bgcolor,
                                    borderRadius: '12px',
                                    p: { xs: 3, md: 4 },
                                    minHeight: 180,
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                    position: 'relative', overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                                    }
                                }}
                            >
                                {/* Decorative icon */}
                                <Box sx={{ position: 'absolute', right: 20, bottom: 10, zIndex: 0 }}>
                                    {banner.icon}
                                </Box>
                                {/* Decorative circles */}
                                <Box sx={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                                <Box sx={{ position: 'absolute', left: -20, bottom: -40, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

                                <Typography sx={{
                                    fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.6rem' },
                                    color: banner.textColor, position: 'relative', zIndex: 1, mb: 1,
                                }}>
                                    {banner.title}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '0.9rem',
                                    color: banner.textColor === '#fff' ? 'rgba(255,255,255,0.85)' : 'rgba(93,64,55,0.7)',
                                    position: 'relative', zIndex: 1, mb: 2,
                                }}>
                                    {banner.subtitle}
                                </Typography>
                                <Button variant="contained" sx={{
                                    alignSelf: 'flex-start', borderRadius: '24px', px: 3,
                                    bgcolor: banner.btnColor || '#E65100',
                                    color: banner.btnTextColor || '#fff',
                                    fontWeight: 700, textTransform: 'none',
                                    position: 'relative', zIndex: 1,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    '&:hover': { filter: 'brightness(1.1)' }
                                }}>
                                    Khám Phá Ngay
                                </Button>
                            </Box>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};

export default PromotionBanner;