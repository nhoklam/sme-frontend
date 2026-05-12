import React, { useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    Skeleton, Pagination,
} from '@mui/material';
import { useMyOrders } from '../../hooks/useOrders';
import { fmt } from '../../../../utils/constants';

const STATUS_MAP: Record<string, { label: string; color: any }> = {
    PENDING: { label: 'Chờ xử lý', color: 'info' },
    PACKING: { label: 'Đang đóng gói', color: 'warning' },
    SHIPPING: { label: 'Đang giao', color: 'primary' },
    DELIVERED: { label: 'Đã giao', color: 'success' },
    CANCELLED: { label: 'Đã hủy', color: 'error' },
    RETURNED: { label: 'Đã trả', color: 'error' },
};

const OrderHistory = () => {
    const [page, setPage] = useState(0);
    const { orders, totalPages, isLoading } = useMyOrders({ page, size: 10 });

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
                                    <TableCell>Ngày đặt</TableCell>
                                    <TableCell>Tổng tiền</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell sx={{ fontWeight: 600 }}>{order.code}</TableCell>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#d32f2f' }}>{fmt(order.finalAmount)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={STATUS_MAP[order.status]?.label ?? order.status}
                                                color={STATUS_MAP[order.status]?.color ?? 'default'}
                                                size="small"
                                            />
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
        </Box>
    );
};

export default OrderHistory;