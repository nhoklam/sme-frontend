import React, { useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    Skeleton, Pagination, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar, Rating, TextField, IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useMyOrders } from '../../hooks/useOrders';
import { fmt } from '../../../../utils/constants';
import { OrderResponse, OrderItemResponse } from '../../../../types';
import axiosInstance from '../../../../services/axiosConfig';
import { customerApi } from '../../../../services/customerApi';
import { useQueryClient } from '@tanstack/react-query';
import orderService from '../../../../services/orderService';

const STATUS_MAP: Record<string, { label: string; color: any }> = {
    PENDING: { label: 'Chờ xử lý', color: 'info' },
    PACKING: { label: 'Đang đóng gói', color: 'warning' },
    SHIPPING: { label: 'Đang giao', color: 'primary' },
    DELIVERED: { label: 'Đã giao', color: 'success' },
    CANCELLED: { label: 'Đã hủy', color: 'error' },
    RETURNED: { label: 'Đã trả', color: 'error' },
    PAID: { label: 'Đã thanh toán (POS)', color: 'success' },
    PAYMENT_PENDING: { label: 'Chờ thanh toán', color: 'warning' },
};

const OrderHistory = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const { orders, totalPages, isLoading } = useMyOrders({ page, size: 10 });
    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
    const [reviewItem, setReviewItem] = useState<OrderItemResponse | null>(null);
    const [rating, setRating] = useState<number | null>(5);
    const [comment, setComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    if (isLoading) {
        return (
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Lịch sử đơn hàng</Typography>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={56} sx={{ mb: 1, borderRadius: 1 }} />
                ))}
            </Box>
        );
    }

    const handleSubmitReview = async () => {
        if (!selectedOrder || !reviewItem || !rating) return;
        try {
            setUploading(true);
            const uploadedUrls: string[] = [];
            for (const file of images) {
                const res = await customerApi.uploadImage(file);
                uploadedUrls.push(res.data.url);
            }

            await customerApi.createReview(reviewItem.productId, {
                orderId: selectedOrder.id,
                rating,
                comment,
                imageUrls: uploadedUrls
            });
            alert('Cảm ơn bạn đã đánh giá!');
            setReviewItem(null);
            setRating(5);
            setComment('');
            setImages([]);
            
            // Re-fetch orders to update isReviewed flag
            queryClient.invalidateQueries({ queryKey: ['my_orders'] });
            
            // Cập nhật selectedOrder cục bộ để đóng dialog nếu cần hoặc update state
            setSelectedOrder(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    items: prev.items.map(i => i.productId === reviewItem.productId ? { ...i, isReviewed: true } : i)
                };
            });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Lịch sử đơn hàng
            </Typography>

            {orders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography fontSize={48} mb={1}>📦</Typography>
                    <Typography color="text.secondary">Bạn chưa có đơn hàng nào</Typography>
                </Paper>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableCell>Mã đơn hàng</TableCell>
                                    <TableCell>Sản phẩm</TableCell>
                                    <TableCell>Ngày đặt</TableCell>
                                    <TableCell>Tổng tiền</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                    <TableCell align="right">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell sx={{ fontWeight: 600 }}>{order.code}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {order.items?.map((i: any) => i.productName).join(', ') || 'Đang cập nhật'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#d32f2f' }}>{fmt(order.finalAmount)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={STATUS_MAP[order.status]?.label ?? order.status}
                                                color={STATUS_MAP[order.status]?.color ?? 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" variant="outlined" onClick={() => setSelectedOrder(order)}>
                                                Chi tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Pagination count={totalPages} page={page + 1}
                                onChange={(_, v) => setPage(v - 1)}
                                sx={{ '& .Mui-selected': { bgcolor: '#d32f2f !important', color: '#fff' } }} />
                        </Box>
                    )}
                </>
            )}

            {/* Dialog Chi Tiết Đơn Hàng */}
            <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>
                    Chi tiết đơn hàng {selectedOrder?.code}
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                                Hình thức thanh toán: <Typography component="span" fontWeight={600} color="#1a1a2e">
                                    {selectedOrder?.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 
                                     selectedOrder?.paymentMethod === 'PAYOS' ? 'Chuyển khoản QR (PayOS)' : 
                                     selectedOrder?.paymentMethod === 'VNPAY' ? 'Ví VNPay' : 
                                     selectedOrder?.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 
                                     selectedOrder?.paymentMethod || 'Đang cập nhật'}
                                </Typography>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Trạng thái: <Typography component="span" fontWeight={600} color={selectedOrder?.paymentStatus === 'PAID' ? '#2e7d32' : '#d32f2f'}>
                                    {selectedOrder?.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </Typography>
                            </Typography>
                        </Box>
                        {selectedOrder?.items?.map((item: any, idx: number) => (
                            <Paper key={idx} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography 
                                        fontWeight={600} 
                                        sx={{ 
                                            color: '#1a1a2e', 
                                            display: '-webkit-box', 
                                            WebkitLineClamp: 2, 
                                            WebkitBoxOrient: 'vertical', 
                                            overflow: 'hidden' 
                                        }}
                                    >
                                        {item.productName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Số lượng: {item.quantity} x {fmt(item.unitPrice)}</Typography>
                                </Box>
                                <Typography fontWeight={700} color="#d32f2f">{fmt(item.subtotal)}</Typography>
                                
                                {selectedOrder.status === 'DELIVERED' && (
                                    <Button 
                                        variant="contained" 
                                        color={item.isReviewed ? "inherit" : "primary"}
                                        size="small" 
                                        sx={{ ml: 2, textTransform: 'none' }}
                                        onClick={() => setReviewItem(item)}
                                        disabled={item.isReviewed}
                                    >
                                        {item.isReviewed ? 'Đã đánh giá' : 'Đánh giá'}
                                    </Button>
                                )}
                            </Paper>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    {(selectedOrder?.paymentMethod === 'PAYOS' || selectedOrder?.paymentMethod === 'VNPAY') && 
                      selectedOrder?.paymentStatus === 'UNPAID' && 
                      selectedOrder?.status !== 'CANCELLED' && (
                        <Button 
                            onClick={async () => {
                                try {
                                    const returnUrl = `${window.location.origin}/payment/return`;
                                    let checkoutUrl = '';
                                    if (selectedOrder.paymentMethod === 'PAYOS') {
                                        const res = await orderService.createPayosUrl(selectedOrder.id, returnUrl, returnUrl);
                                        checkoutUrl = res.checkoutUrl;
                                    } else {
                                        const res = await orderService.createVnPayUrl(selectedOrder.id, returnUrl);
                                        checkoutUrl = res.checkoutUrl;
                                    }
                                    window.location.href = checkoutUrl;
                                } catch (error: any) {
                                    alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo link thanh toán');
                                }
                            }}
                            variant="contained"
                            sx={{ mr: 'auto', bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' } }}
                        >
                            Thanh toán lại ({selectedOrder.paymentMethod === 'PAYOS' ? 'Mã QR' : 'VNPay'})
                        </Button>
                    )}
                    <Button onClick={() => setSelectedOrder(null)} color="inherit">Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Đánh Giá Sản Phẩm */}
            <Dialog open={!!reviewItem} onClose={() => setReviewItem(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1, fontSize: '1.1rem', fontWeight: 600 }}>Đánh giá sản phẩm</DialogTitle>
                <DialogContent>
                    <Typography fontWeight={600} mb={2} fontSize="0.9rem">{reviewItem?.productName}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography fontSize="0.9rem">Chất lượng:</Typography>
                        <Rating
                            value={rating}
                            onChange={(_, newValue) => setRating(newValue)}
                            size="medium"
                        />
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé (không bắt buộc)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        InputProps={{ sx: { fontSize: '0.9rem' } }}
                    />
                    <Box sx={{ mt: 3 }}>
                        <Button variant="outlined" component="label" disabled={uploading}>
                            {uploading ? 'Đang tải ảnh...' : 'Thêm hình ảnh'}
                            <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                            {images.map((img, i) => (
                                <Box key={i} sx={{ position: 'relative', width: 64, height: 64 }}>
                                    <Box component="img" src={URL.createObjectURL(img)} alt="preview" sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1, border: '1px solid #eef2f6' }} />
                                    {!uploading && (
                                        <IconButton 
                                            size="small" 
                                            onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                            sx={{ position: 'absolute', top: -6, right: -6, bgcolor: '#fff', boxShadow: 1, width: 18, height: 18, '&:hover': { bgcolor: '#f5f5f5' } }}
                                        >
                                            <Close sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewItem(null)} color="inherit" disabled={uploading}>Hủy</Button>
                    <Button onClick={handleSubmitReview} variant="contained" disabled={!rating || uploading}>
                        {uploading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default OrderHistory;