import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';

const mockOrders = [
    { id: 'ORD-001', date: '15/03/2024', total: 250000, status: 'Đã giao', statusColor: 'success' },
    { id: 'ORD-002', date: '10/03/2024', total: 180000, status: 'Đang giao', statusColor: 'warning' },
    { id: 'ORD-003', date: '05/03/2024', total: 320000, status: 'Chờ xử lý', statusColor: 'info' },
];

const OrderHistory = () => {
    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Lịch sử đơn hàng
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                            <TableCell>Mã đơn hàng</TableCell>
                            <TableCell>Ngày đặt</TableCell>
                            <TableCell>Tổng tiền</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{order.id}</TableCell>
                                <TableCell>{order.date}</TableCell>
                                <TableCell>{order.total.toLocaleString()}đ</TableCell>
                                <TableCell>
                                    <Chip label={order.status} color={order.statusColor} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Button size="small" sx={{ color: '#006994' }}>
                                        Xem chi tiết
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default OrderHistory;