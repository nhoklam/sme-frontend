import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';

const PromotionBanner = () => {
    return (
        <Box sx={{ mb: 6 }}>
            <Grid container spacing={3}>
                {/* Banner 1 */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ 
                        bgcolor: 'var(--color-primary)', color: 'white',
                        borderRadius: '16px', p: 4, display: 'flex', flexDirection: 'column', 
                        justifyContent: 'center', minHeight: 200,
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Decorative circle */}
                        <Box sx={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                        <Box sx={{ position: 'absolute', right: 50, bottom: -50, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                        
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, position: 'relative', zIndex: 1 }}>Mua 2 Tặng 1</Typography>
                        <Typography variant="body1" sx={{ mb: 3, opacity: 0.8, position: 'relative', zIndex: 1 }}>Áp dụng cho toàn bộ sách Văn học trong tuần này.</Typography>
                        <Button variant="contained" color="secondary" sx={{ alignSelf: 'flex-start', borderRadius: '24px', px: 4, position: 'relative', zIndex: 1 }}>
                            Khám Phá Ngay
                        </Button>
                    </Box>
                </Grid>

                {/* Banner 2 */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ 
                        bgcolor: '#e8f5e9', color: '#1b5e20',
                        borderRadius: '16px', p: 4, display: 'flex', flexDirection: 'column', 
                        justifyContent: 'center', minHeight: 200,
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Decorative graphic */}
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }}>
                            <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                            </svg>
                        </Box>
                        
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, position: 'relative', zIndex: 1, fontFamily: '"Playfair Display", serif' }}>Freeship Toàn Quốc</Typography>
                        <Typography variant="body1" sx={{ mb: 3, opacity: 0.8, position: 'relative', zIndex: 1 }}>Giao hàng miễn phí cho mọi đơn hàng từ 150.000đ.</Typography>
                        <Button variant="outlined" sx={{ alignSelf: 'flex-start', borderRadius: '24px', px: 4, borderColor: '#1b5e20', color: '#1b5e20', position: 'relative', zIndex: 1, '&:hover': { bgcolor: 'rgba(27,94,32,0.05)', borderColor: '#1b5e20' } }}>
                            Tìm Hiểu Thêm
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PromotionBanner;