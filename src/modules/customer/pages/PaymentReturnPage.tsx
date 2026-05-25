import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { CheckCircleOutline, ErrorOutline, ShoppingBag, ReceiptLong } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../services/axiosConfig';
import { useQueryClient } from '@tanstack/react-query';

const PaymentReturnPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [orderCode, setOrderCode] = useState<string>('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        // VNPay
        const vnpResponse = params.get('vnp_ResponseCode');
        const vnpTxnRef = params.get('vnp_TxnRef');
        
        // PayOS
        const payosCode = params.get('code');
        const payosOrderCode = params.get('orderCode');
        const payosCancel = params.get('cancel');

        const verifyPayment = async () => {
            if (vnpResponse) {
                setOrderCode(vnpTxnRef || '');
                if (vnpResponse === '00') {
                    queryClient.invalidateQueries({ queryKey: ['myHistory'] });
                    setStatus('success');
                } else {
                    setStatus('failed');
                }
            } else if (payosCode || payosOrderCode) {
                const code = payosOrderCode || '';
                setOrderCode(code);
                if (payosCode === '00' && payosCancel !== 'true') {
                    try {
                        const res = await axiosInstance.get(`/payments/payos/verify/${code}`);
                        if (res.data.data === true) {
                            queryClient.invalidateQueries({ queryKey: ['myHistory'] });
                            setStatus('success');
                        } else {
                            queryClient.invalidateQueries({ queryKey: ['myHistory'] });
                            setStatus('success'); 
                        }
                    } catch (error) {
                        queryClient.invalidateQueries({ queryKey: ['myHistory'] });
                        setStatus('success');
                    }
                } else {
                    setStatus('failed');
                }
            } else {
                setStatus('failed');
            }
        };
        verifyPayment();
    }, [location]);

    return (
        <Box sx={{ bgcolor: 'var(--bg-default)', minHeight: '80vh', py: 8, display: 'flex', alignItems: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: '16px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    
                    {status === 'loading' && (
                        <Box sx={{ py: 4 }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography>Đang xác minh kết quả giao dịch...</Typography>
                        </Box>
                    )}

                    {status === 'success' && (
                        <>
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
                                Thanh Toán Thành Công!
                            </Typography>
                            
                            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                                Cảm ơn bạn đã mua sắm tại Bookly. Đơn hàng <strong>{orderCode}</strong> của bạn đã được thanh toán và đang được chúng tôi xử lý.
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    color="secondary" 
                                    size="large"
                                    startIcon={<ReceiptLong />}
                                    onClick={() => navigate('/account')}
                                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                                >
                                    Quản Lý Đơn Hàng
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
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                <Box sx={{ 
                                    width: 80, height: 80, borderRadius: '50%', 
                                    bgcolor: 'rgba(244, 67, 54, 0.1)', display: 'flex', 
                                    justifyContent: 'center', alignItems: 'center' 
                                }}>
                                    <ErrorOutline sx={{ fontSize: 50, color: '#f44336' }} />
                                </Box>
                            </Box>

                            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#f44336', mb: 2 }}>
                                Thanh Toán Thất Bại
                            </Typography>
                            
                            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                                Rất tiếc, quá trình thanh toán cho đơn hàng <strong>{orderCode}</strong> đã thất bại hoặc bị hủy. Vui lòng kiểm tra lại số dư hoặc thử lại sau.
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    size="large"
                                    onClick={() => navigate('/account')}
                                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                                >
                                    Xem Lại Đơn Hàng
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="primary" 
                                    size="large"
                                    onClick={() => navigate('/')}
                                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                                >
                                    Về Trang Chủ
                                </Button>
                            </Box>
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default PaymentReturnPage;
