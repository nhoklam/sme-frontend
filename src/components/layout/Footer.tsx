// src/components/layout/Footer.jsx
import React from 'react';
import { Box, Container, Grid, Typography, IconButton, Divider } from '@mui/material';
import { Facebook, YouTube } from '@mui/icons-material';

const FOOTER_COLS = [
    {
        title: 'Danh mục',
        links: ['Văn học', 'Kinh tế', 'Thiếu nhi', 'Kỹ năng sống', 'Ngoại ngữ'],
    },
    {
        title: 'Hỗ trợ',
        links: ['Hướng dẫn mua hàng', 'Chính sách đổi trả', 'Chính sách vận chuyển', 'Câu hỏi thường gặp'],
    },
    {
        title: 'Liên hệ',
        links: ['📞 0367287044', '✉️ quang@bookstore.vn', '🏢 TP. Hồ Chí Minh', '⏰ 8h - 22h hàng ngày'],
    },
];

const Footer = () => (
    <Box sx={{ bgcolor: '#1a1a2e', color: '#fff', pt: 5, pb: 3 }}>
        <Container maxWidth="lg">
            <Grid container spacing={4} sx={{ mb: 4 }}>
                {/* Brand */}
                <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Box sx={{
                            width: 36, height: 36, bgcolor: '#d32f2f', borderRadius: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Typography fontSize={18}>📚</Typography>
                        </Box>
                        <Typography fontWeight={800} fontSize={18}>BookStore</Typography>
                    </Box>
                    <Typography variant="body2" color="#aaa" sx={{ mb: 2 }}>
                        Nhà sách trực tuyến hàng đầu Việt Nam.<br />
                        Hơn 50.000 đầu sách từ các NXB uy tín.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[<Facebook />, <YouTube />].map((icon, i) => (
                            <IconButton key={i} size="small" sx={{
                                bgcolor: '#333', color: '#fff',
                                '&:hover': { bgcolor: '#d32f2f' },
                            }}>
                                {icon}
                            </IconButton>
                        ))}
                    </Box>
                </Grid>

                {/* Columns */}
                {FOOTER_COLS.map((col) => (
                    <Grid item xs={6} md={3} ml={15} key={col.title} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography fontWeight={700} sx={{ mb: 2 }}>{col.title}</Typography>
                        {col.links.map((link) => (
                            <Typography key={link} variant="body2" color="#aaa" sx={{
                                mb: 0.8, cursor: 'pointer',
                                '&:hover': { color: '#d32f2f' },
                            }}>
                                {link}
                            </Typography>
                        ))}
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ borderColor: '#333', mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="#666">
                    © 2026 BookStore. Tất cả quyền được bảo lưu.
                </Typography>
                <Typography variant="caption" color="#666">
                    Chính sách bảo mật · Điều khoản sử dụng
                </Typography>
            </Box>
        </Container>
    </Box>
);

export default Footer;