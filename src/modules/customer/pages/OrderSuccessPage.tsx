import React from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { CheckCircleOutline, ShoppingBag, ReceiptLong } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const OrderSuccessPage = () => {
    const navigate = useNavigate();

    // Mock order data
    const orderId = 'ORD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const orderDate = new Date().toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <Box sx={{ bgcolor: 'var(--bg-default)', minHeight: '80vh', py: 8, display: 'flex', alignItems: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: '16px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Box sx={{ 
                            width: 80, height: 80, borderRadius: '50%', 
                            bgcolor: 'rgba(76, 175, 80, 0.1)', display: 'flex', 
                            justifyContent: 'center', alignItems: 'center' 
                        }}>
                            <CheckCircleOutline sx={{ fontSize: 50, color: '#4caf50' }} />
                        </Box>
                    </Box>

                    <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: 'var(--color-primary)', mb: 2 }}>
                        Đặt Hàng Thành Công!
                    </Typography>
                    
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                        Cảm ơn bạn đã mua sắm tại Bookly. Đơn hàng của bạn đang được chúng tôi xử lý và sẽ được giao trong thời gian sớm nhất.
                    </Typography>

                    <Box sx={{ bgcolor: 'var(--bg-default)', p: 3, borderRadius: '8px', mb: 4, textAlign: 'left' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">Mã đơn hàng:</Typography>
                            <Typography variant="subtitle2" fontWeight={700} color="var(--color-secondary)">{orderId}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">Ngày đặt:</Typography>
                            <Typography variant="subtitle2" fontWeight={600}>{orderDate}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Thanh toán:</Typography>
                            <Typography variant="subtitle2" fontWeight={600}>Khi nhận hàng (COD)</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            size="large"
                            startIcon={<ReceiptLong />}
                            onClick={() => navigate('/account?tab=orders')}
                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            Xem Chi Tiết Đơn Hàng
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="primary" 
                            size="large"
                            startIcon={<ShoppingBag />}
                            onClick={() => navigate('/')}
                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            Tiếp Tục Mua Sắm
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default OrderSuccessPage;