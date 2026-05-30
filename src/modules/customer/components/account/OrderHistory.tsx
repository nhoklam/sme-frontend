import React, { useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    Skeleton, Pagination, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar, Rating, TextField, IconButton, Stepper, Step, StepLabel, Divider
} from '@mui/material';
import { Close, LocalShipping, Payment, ShoppingBag, Receipt, Map, Timeline } from '@mui/icons-material';
import { useMyOrders } from '../../hooks/useOrders';
import { fmt } from '../../../../utils/constants';
import { OrderResponse, OrderItemResponse } from '../../../../types';
import axiosInstance from '../../../../services/axiosConfig';
import { customerApi } from '../../../../services/customerApi';
import { useQueryClient } from '@tanstack/react-query';
import orderService from '../../../../services/orderService';
import { useWebSocket } from '../../../../store/hooks/useWebSocket';

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
    
    useWebSocket({
        warehouseId: null,
        onMessage: (payload) => {
            if (payload.type === 'ORDER_STATUS_UPDATED') {
                try {
                    const audio = new Audio('/assets/ting.mp3');
                    audio.play().catch(e => console.log('Audio play error (blocked by browser):', e));
                } catch (e) {
                    console.log('Audio init error:', e);
                }
                queryClient.invalidateQueries({ queryKey: ['my_orders'] });
            }
        }
    });

    const [page, setPage] = useState(0);
    const { orders, totalPages, isLoading } = useMyOrders({ page, size: 10 });
    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
    const [reviewItem, setReviewItem] = useState<OrderItemResponse | null>(null);
    const [rating, setRating] = useState<number | null>(5);
    const [comment, setComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    
    // States for canceling order
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCanceling, setIsCanceling] = useState(false);

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
                                    <TableRow 
                                        key={order.id}
                                        hover
                                        onClick={() => setSelectedOrder(order)}
                                        sx={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                    >
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
                                            <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
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

            {/* Dialog Chi Tiết Đơn Hàng Mới */}
            <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, bgcolor: '#f4f6f8' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff', p: 3, borderBottom: '1px solid #e0e0e0' }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="#1a1a2e">CHI TIẾT ĐƠN HÀNG</Typography>
                        <Typography variant="body2" color="text.secondary">Mã đơn: <Typography component="span" fontWeight={600} color="#d32f2f">{selectedOrder?.code}</Typography> | Ngày đặt: {selectedOrder ? new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN') : ''}</Typography>
                    </Box>
                    <Chip 
                        label={selectedOrder ? STATUS_MAP[selectedOrder.status]?.label : ''} 
                        color={selectedOrder ? STATUS_MAP[selectedOrder.status]?.color : 'default'} 
                        sx={{ fontWeight: 600, px: 1 }}
                    />
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {selectedOrder && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
                            {/* Stepper Trạng Thái */}
                            {!['CANCELLED', 'RETURNED'].includes(selectedOrder.status) && (
                                <Paper sx={{ p: 3, borderRadius: 2 }}>
                                    <Stepper activeStep={['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED'].indexOf(selectedOrder.status)} alternativeLabel>
                                        <Step><StepLabel>Chờ xử lý</StepLabel></Step>
                                        <Step><StepLabel>Đang đóng gói</StepLabel></Step>
                                        <Step><StepLabel>Đang giao hàng</StepLabel></Step>
                                        <Step><StepLabel>Đã giao thành công</StepLabel></Step>
                                    </Stepper>
                                </Paper>
                            )}

                            {selectedOrder.status === 'CANCELLED' && (
                                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#ffebee' }}>
                                    <Typography color="error" fontWeight={600}>Đơn hàng đã bị hủy</Typography>
                                    {selectedOrder.cancelledReason && <Typography variant="body2" color="error">Lý do: {selectedOrder.cancelledReason}</Typography>}
                                </Paper>
                            )}

                            {/* Khối Thông tin Giao Hàng & Thanh toán */}
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                        <Typography fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}><Map fontSize="small" color="primary"/> Địa chỉ nhận hàng</Typography>
                                        <Typography variant="body2" fontWeight={600}>{selectedOrder.shippingName || selectedOrder.customerName || 'Không rõ tên người nhận'}</Typography>
                                        <Typography variant="body2" color="text.secondary" mb={1}>{selectedOrder.shippingPhone || selectedOrder.customerPhone || 'Không rõ số điện thoại'}</Typography>
                                        <Typography variant="body2" color="text.secondary">{selectedOrder.shippingAddress || 'Chưa cung cấp địa chỉ giao hàng'}</Typography>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                        <Typography fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}><Payment fontSize="small" color="primary"/> Hình thức thanh toán</Typography>
                                        <Typography variant="body2" mb={1}>
                                            {selectedOrder.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 
                                            selectedOrder.paymentMethod === 'PAYOS' ? 'Chuyển khoản QR (PayOS)' : 
                                            selectedOrder.paymentMethod === 'VNPAY' ? 'Ví VNPay' : 
                                            selectedOrder.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : selectedOrder.paymentMethod}
                                        </Typography>
                                        <Chip 
                                            label={selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                                            color={selectedOrder.paymentStatus === 'PAID' ? 'success' : 'warning'}
                                            size="small"
                                            sx={{ borderRadius: 1 }}
                                        />
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Danh sách Sản phẩm */}
                            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ShoppingBag fontSize="small" color="primary" />
                                    <Typography fontWeight={600}>Sản phẩm đã mua</Typography>
                                </Box>
                                <Box sx={{ p: 2 }}>
                                    {selectedOrder.items?.map((item: any, idx: number) => (
                                        <Box key={idx} sx={{ display: 'flex', gap: 2, mb: idx !== selectedOrder.items.length - 1 ? 2 : 0, pb: idx !== selectedOrder.items.length - 1 ? 2 : 0, borderBottom: idx !== selectedOrder.items.length - 1 ? '1px dashed #e0e0e0' : 'none' }}>
                                            <Box sx={{ width: 60, height: 60, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {item.imageUrl ? (
                                                    <Box component="img" src={item.imageUrl} alt={item.productName} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <Receipt sx={{ color: '#bdbdbd' }} />
                                                )}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" fontWeight={600} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {item.productName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">Mã SP: {item.productId?.slice(0, 8) || item.isbnBarcode || 'N/A'}</Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">x{item.quantity}</Typography>
                                                    <Typography variant="body2" fontWeight={600} color="#d32f2f">{fmt(item.unitPrice)}</Typography>
                                                </Box>
                                                {selectedOrder.status === 'DELIVERED' && (
                                                    <Box sx={{ mt: 1, textAlign: 'right' }}>
                                                        <Button 
                                                            variant="outlined" 
                                                            color={item.isReviewed ? "inherit" : "primary"}
                                                            size="small" 
                                                            sx={{ textTransform: 'none', borderRadius: 1, height: 28, fontSize: '12px' }}
                                                            onClick={() => setReviewItem(item)}
                                                            disabled={item.isReviewed}
                                                        >
                                                            {item.isReviewed ? 'Đã đánh giá' : 'Đánh giá sản phẩm'}
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>

                            {/* Bảng Tổng Kết Tiền */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <Grid container justifyContent="flex-end">
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Tổng tiền hàng:</Typography>
                                            <Typography variant="body2" fontWeight={600}>{fmt(selectedOrder.totalAmount)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Phí vận chuyển:</Typography>
                                            <Typography variant="body2" fontWeight={600}>{fmt(selectedOrder.shippingFee || 0)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Giảm giá:</Typography>
                                            <Typography variant="body2" fontWeight={600} color="success.main">- {fmt(selectedOrder.discountAmount || 0)}</Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="subtitle1" fontWeight={600}>Thành tiền:</Typography>
                                            <Typography variant="h6" fontWeight={700} color="#d32f2f">{fmt(selectedOrder.finalAmount)}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #e0e0e0' }}>
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
                            sx={{ mr: 'auto', bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' }, textTransform: 'none', borderRadius: 1 }}
                        >
                            Thanh toán lại ({selectedOrder.paymentMethod === 'PAYOS' ? 'Mã QR' : 'VNPay'})
                        </Button>
                    )}
                    
                    {['PENDING', 'PAYMENT_PENDING'].includes(selectedOrder?.status ?? '') && (
                         <Button
                             onClick={() => {
                                 setCancelReason('');
                                 setCancelDialogOpen(true);
                             }}
                             color="error"
                             variant="outlined"
                             sx={{ mr: (selectedOrder?.paymentMethod === 'PAYOS' || selectedOrder?.paymentMethod === 'VNPAY') && selectedOrder?.paymentStatus === 'UNPAID' ? 1 : 'auto', textTransform: 'none', borderRadius: 1 }}
                         >
                             Hủy đơn hàng
                         </Button>
                    )}
                    
                    <Button onClick={() => setSelectedOrder(null)} variant="outlined" color="inherit" sx={{ textTransform: 'none', borderRadius: 1 }}>Đóng</Button>
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

            {/* Dialog Hủy Đơn Hàng */}
            <Dialog open={cancelDialogOpen} onClose={() => !isCanceling && setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1, fontSize: '1.1rem', fontWeight: 600 }}>Xác nhận hủy đơn hàng</DialogTitle>
                <DialogContent>
                    <Typography mb={2} fontSize="0.9rem">Vui lòng cho biết lý do bạn muốn hủy đơn hàng này:</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Lý do hủy đơn (không bắt buộc)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        disabled={isCanceling}
                        InputProps={{ sx: { fontSize: '0.9rem' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCancelDialogOpen(false)} color="inherit" disabled={isCanceling}>Đóng</Button>
                    <Button 
                        onClick={async () => {
                            if (!selectedOrder) return;
                            try {
                                setIsCanceling(true);
                                const reason = cancelReason.trim() || 'Khách hàng tự hủy';
                                await orderService.cancel(selectedOrder.id, reason);
                                queryClient.invalidateQueries({ queryKey: ['my_orders'] });
                                setSelectedOrder({ ...selectedOrder, status: 'CANCELLED' });
                                setCancelDialogOpen(false);
                            } catch (err: any) {
                                alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn');
                            } finally {
                                setIsCanceling(false);
                            }
                        }} 
                        variant="contained" 
                        color="error"
                        disabled={isCanceling}
                        sx={{ boxShadow: 'none' }}
                    >
                        {isCanceling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default OrderHistory;