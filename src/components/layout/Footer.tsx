// src/components/layout/Footer.tsx
import React from 'react';
import { Box, Container, Grid, Typography, TextField, Button, IconButton, Divider } from '@mui/material';
import { Facebook, Instagram, YouTube, Email, Phone, LocationOn, AlternateEmail } from '@mui/icons-material';

const Footer = () => {
    return (
        <Box sx={{ 
            bgcolor: '#1a1a2e', 
            color: 'rgba(255, 255, 255, 0.75)', 
            pt: 8, 
            pb: 4, 
            mt: 'auto',
            borderTop: '3px solid #f5a623'
        }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    
                    {/* Brand Column */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                            <Box sx={{ 
                                width: 38, height: 38, 
                                bgcolor: '#ffffff', 
                                border: '2px solid #f5a623',
                                borderRadius: '8px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: '#1a1a2e', 
                                fontWeight: 900, 
                                fontSize: '18px',
                                fontFamily: '"Playfair Display", serif'
                            }}>
                                B
                            </Box>
                            <Typography variant="h5" sx={{ 
                                color: '#ffffff', 
                                fontFamily: '"Playfair Display", serif', 
                                fontWeight: 800,
                                fontSize: '1.4rem'
                            }}>
                                Bookly
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2.5, lineHeight: 1.8, pr: 2, fontSize: '0.85rem' }}>
                            "Mỗi cuốn sách, một hành trình mới". Bookly mang đến cho độc giả không chỉ là những trang giấy, mà là nguồn tri thức được tuyển chọn kỹ lưỡng cùng trải nghiệm mua sắm đẳng cấp nhất.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.2 }}>
                            <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#ffffff', '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' } }} size="small"><Facebook fontSize="small" /></IconButton>
                            <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#ffffff', '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' } }} size="small"><Instagram fontSize="small" /></IconButton>
                            <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#ffffff', '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' } }} size="small"><YouTube fontSize="small" /></IconButton>
                            <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#ffffff', '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' } }} size="small"><AlternateEmail fontSize="small" /></IconButton>
                        </Box>
                    </Grid>

                    {/* Về Bookly */}
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <Typography variant="subtitle2" sx={{ 
                            color: '#ffffff', 
                            fontWeight: 700, 
                            mb: 2.5, 
                            textTransform: 'uppercase', 
                            letterSpacing: 1, 
                            fontSize: '0.8rem' 
                        }}>
                            Về Bookly
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {['Giới thiệu', 'Tuyển dụng', 'Chính sách bảo mật', 'Điều khoản sử dụng', 'Blog'].map((item) => (
                                <Typography key={item} variant="body2" sx={{ 
                                    fontSize: '0.85rem',
                                    cursor: 'pointer', 
                                    transition: 'color 0.2s',
                                    '&:hover': { color: '#f5a623' } 
                                }}>
                                    {item}
                                </Typography>
                            ))}
                        </Box>
                    </Grid>

                    {/* Hỗ Trợ Khách Hàng */}
                    <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                        <Typography variant="subtitle2" sx={{ 
                            color: '#ffffff', 
                            fontWeight: 700, 
                            mb: 2.5, 
                            textTransform: 'uppercase', 
                            letterSpacing: 1, 
                            fontSize: '0.8rem' 
                        }}>
                            Hỗ Trợ Khách Hàng
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                                <LocationOn sx={{ color: '#f5a623', fontSize: 18, mt: 0.2 }} />
                                <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    123 Đường Sách, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
                                <Phone sx={{ color: '#f5a623', fontSize: 18 }} />
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                     0367287044 (Miễn phí)
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
                                <Email sx={{ color: '#f5a623', fontSize: 18 }} />
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                    nguyenhuuquang150805@gmail.com
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Newsletter Column */}
                    <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                        <Typography variant="subtitle2" sx={{ 
                            color: '#ffffff', 
                            fontWeight: 700, 
                            mb: 2.5, 
                            textTransform: 'uppercase', 
                            letterSpacing: 1, 
                            fontSize: '0.8rem' 
                        }}>
                            Đăng Ký Nhận Tin
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem', lineHeight: 1.6 }}>
                            Nhận ngay mã giảm giá 10% và cập nhật các tựa sách mới phát hành sớm nhất.
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField 
                                variant="outlined" 
                                placeholder="Email của bạn" 
                                fullWidth 
                                size="small"
                                sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.05)', 
                                    borderRadius: 1,
                                    input: { color: '#ffffff', fontSize: 13, py: 1.2 },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                }}
                            />
                            <Button 
                                variant="contained" 
                                fullWidth 
                                sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: '#f5a623', 
                                    color: '#1a1a2e',
                                    fontSize: 13,
                                    py: 1,
                                    '&:hover': { bgcolor: '#db941e' } 
                                }}
                            >
                                Đăng ký ngay
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 4 }} />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                        © 2026 Bookly - All rights reserved.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        {/* payment method icons */}
                        <Box sx={{ px: 1, py: 0.5, bgcolor: '#ffffff', borderRadius: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#0054a6', fontWeight: 900, fontSize: '0.62rem' }}>VNPAY</Typography>
                        </Box>
                        <Box sx={{ px: 1, py: 0.5, bgcolor: '#a50064', borderRadius: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 900, fontSize: '0.62rem' }}>MOMO</Typography>
                        </Box>
                        <Box sx={{ px: 1, py: 0.5, bgcolor: '#1a1f71', borderRadius: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 900, fontSize: '0.62rem', fontStyle: 'italic' }}>VISA</Typography>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;