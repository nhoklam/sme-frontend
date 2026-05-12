// src/modules/customer/pages/OrderSuccessPage.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper, Divider } from '@mui/material';
import { CheckCircle, ShoppingBag, Home } from '@mui/icons-material';
import { fmt } from '../../../utils/constants';

const OrderSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const order = (location.state as any)?.order;

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '80vh' }}>
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Paper elevation={0} sx={{ borderRadius: 3, p: 5, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 72, color: '#4caf50', mb: 2 }} />
                    <Typography variant="h5" fontWeight={800} mb={1}>Đặt hàng thành công! 🎉</Typography>
                    <Typography color="text.secondary" mb={3}>
                        Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.
                    </Typography>

                    {order && (
                        <Box sx={{ bgcolor: '#f9f9f9', borderRadius: 2, p: 2.5, mb: 3, textAlign: 'left' }}>
                            <Typography variant="body2" fontWeight={700} mb={1}>Thông tin đơn hàng</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Mã đơn:</Typography>
                                <Typography variant="body2" fontWeight={700} color="#d32f2f">{order.code}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Tổng tiền:</Typography>
                                <Typography variant="body2" fontWeight={700}>{fmt(order.finalAmount)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Thanh toán:</Typography>
                                <Typography variant="body2" fontWeight={600}>{order.paymentMethod}</Typography>
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button variant="outlined" startIcon={<ShoppingBag />} onClick={() => navigate('/shop')}
                            sx={{ borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none', fontWeight: 600 }}>
                            Tiếp tục mua sắm
                        </Button>
                        <Button variant="contained" startIcon={<Home />} onClick={() => navigate('/')}
                            sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b71c1c' } }}>
                            Về trang chủ
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default OrderSuccessPage;