// src/modules/customer/pages/OrderTrackingPage.tsx
import React, { useState } from 'react';
import {
    Box, Container, Typography, TextField, Button, Paper,
    Stepper, Step, StepLabel, Alert, CircularProgress, Chip,
} from '@mui/material';
import { Search, LocalShipping } from '@mui/icons-material';
import orderService from '../../../services/orderService';
import { OrderResponse } from '../../../types';
import { fmt } from '../../../utils/constants';

const STATUS_MAP: Record<string, { label: string; color: any }> = {
    PENDING: { label: 'Chờ xử lý', color: 'info' },
    PACKING: { label: 'Đang đóng gói', color: 'warning' },
    SHIPPING: { label: 'Đang giao hàng', color: 'primary' },
    DELIVERED: { label: 'Đã giao', color: 'success' },
    CANCELLED: { label: 'Đã hủy', color: 'error' },
    RETURNED: { label: 'Đã trả', color: 'error' },
};

const STATUS_STEPS = ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED'];

const OrderTrackingPage: React.FC = () => {
    const [searchCode, setSearchCode] = useState('');
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!searchCode.trim()) return;
        setLoading(true);
        setError('');
        setOrder(null);
        try {
            // Thử tìm theo code (mã đơn như ORD-001), nếu không được thì thử theo ID
            const result = await orderService.getByCode(searchCode.trim());
            setOrder(result);
        } catch {
            try {
                // Fallback: tìm theo UUID nếu người dùng nhập ID trực tiếp
                const result = await orderService.getById(searchCode.trim());
                setOrder(result);
            } catch {
                setError('Không tìm thấy đơn hàng với mã này.');
            }
        } finally {
            setLoading(false);
        }
    };

    const activeStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '80vh' }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h5" fontWeight={800} mb={3} textAlign="center">
                    <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Theo dõi đơn hàng
                </Typography>

                <Paper elevation={0} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField fullWidth size="small" placeholder="Nhập mã đơn hàng (VD: ORD-001)"
                            value={searchCode} onChange={e => setSearchCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                        <Button variant="contained" startIcon={loading ? <CircularProgress size={18} /> : <Search />}
                            onClick={handleSearch} disabled={loading}
                            sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, minWidth: 120, '&:hover': { bgcolor: '#b71c1c' } }}>
                            Tra cứu
                        </Button>
                    </Box>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {order && (
                    <Paper elevation={0} sx={{ borderRadius: 2, p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>Đơn hàng #{order.code}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                </Typography>
                            </Box>
                            <Chip label={STATUS_MAP[order.status]?.label ?? order.status}
                                color={STATUS_MAP[order.status]?.color ?? 'default'} />
                        </Box>

                        {!['CANCELLED', 'RETURNED'].includes(order.status) && (
                            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                                {STATUS_STEPS.map(s => (
                                    <Step key={s}><StepLabel>{STATUS_MAP[s]?.label}</StepLabel></Step>
                                ))}
                            </Stepper>
                        )}

                        <Typography variant="body2" fontWeight={700} mb={1}>Sản phẩm:</Typography>
                        {order.items?.map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f5f5f5' }}>
                                <Typography variant="body2">{item.productName ?? item.productId} x{item.quantity}</Typography>
                                <Typography variant="body2" fontWeight={600}>{fmt(item.subtotal)}</Typography>
                            </Box>
                        ))}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1.5, borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="body1" fontWeight={700}>Tổng cộng</Typography>
                            <Typography variant="h6" fontWeight={900} color="#d32f2f">{fmt(order.finalAmount)}</Typography>
                        </Box>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default OrderTrackingPage;