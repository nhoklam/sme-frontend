import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Inventory, ShoppingCart, AttachMoney, Warehouse } from '@mui/icons-material';

const DashboardStatus = ({ stats }) => {
    const statItems = [
        { title: 'Tổng sản phẩm', value: stats.totalProducts || 88, icon: <Inventory />, color: '#1976d2' },
        { title: 'Đơn hàng hôm nay', value: stats.todayOrders || 12, icon: <ShoppingCart />, color: '#2e7d32' },
        { title: 'Doanh thu hôm nay', value: stats.todayRevenue || '12,500,000đ', icon: <AttachMoney />, color: '#ed6c02' },
        { title: 'Tồn kho', value: stats.totalStock || 1, icon: <Warehouse />, color: '#9c27b0' },
    ];

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {statItems.map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ backgroundColor: `${item.color}20`, borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, color: item.color }}>
                                    {item.icon}
                                </Box>
                                <Typography variant="body2" color="text.secondary">{item.title}</Typography>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default DashboardStatus;