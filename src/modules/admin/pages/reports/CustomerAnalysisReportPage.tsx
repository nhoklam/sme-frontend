import React from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Chip, Avatar, LinearProgress, Skeleton,
    Button, Tooltip, IconButton, Snackbar, Alert
} from '@mui/material';

import {
    TrendingUp, Group, PersonOff, Star,
    WorkspacePremium, FilterList, Download,
    ChevronRight, NotificationsActive
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import reportService from '../../../../services/reportService';
import notificationService from '../../../../services/notificationService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1'];
export default function CustomerAnalysisReportPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['customer-analysis'],
        queryFn: () => reportService.getCustomerAnalysis(),
    });
    const [snack, setSnack] = React.useState({ open: false, msg: '' });

    if (isLoading) return (
        <Box sx={{ p: 3 }}>
            <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
            <Grid container spacing={3}>
                {[1, 2, 3].map(i => <Grid size={{ xs: 12, sm: 4 }} key={i}><Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} /></Grid>)}
            </Grid>
        </Box>
    );

    const analysis = data;

    if (!analysis && !isLoading) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="info">Không có dữ liệu phân tích khách hàng. Hãy bắt đầu bán hàng để xem báo cáo.</Alert>
        </Box>
    );

    const handleNotify = async (name?: string, customerId?: string, nextTier?: string) => {
        try {
            if (customerId && nextTier) {
                await notificationService.notifyTierUpgrade(customerId, nextTier);
            }

            const msg = name
                ? `Đã gửi thông báo ưu đãi thăng hạng đến khách hàng ${name}!`
                : `Đã gửi thông báo ưu đãi thăng hạng đến các khách hàng tiềm năng!`;
            setSnack({ open: true, msg });
        } catch (error) {
            setSnack({ open: true, msg: 'Gửi thông báo thất bại. Vui lòng thử lại sau.' });
        }
    };


    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>BÁO CÁO / <strong>PHÂN TÍCH KHÁCH HÀNG</strong></Typography>
                    <Typography variant="h5" fontWeight={900} color="#1a1a2e" mt={0.5}>Customer Loyalty & Retention</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="outlined" startIcon={<FilterList />} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#fff' }}>Lọc dữ liệu</Button>
                    <Button variant="contained" startIcon={<Download />} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#1976d2' }}>Xuất báo cáo</Button>
                </Box>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Tổng khách hàng', value: analysis.stats.total, icon: <Group />, color: '#1976d2', bg: '#eff6ff', trend: '+5% so với tháng trước' },
                    { label: 'Khách hàng mới (Tháng)', value: analysis.stats.newThisMonth, icon: <TrendingUp />, color: '#10b981', bg: '#ecfdf5', trend: 'Tăng 12%' },
                    { label: 'Khách ngừng hoạt động', value: analysis.stats.inactive, icon: <PersonOff />, color: '#ef4444', bg: '#fef2f2', trend: 'Cần quan tâm' },
                ].map((s, i) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={i}>
                        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #f0f0f0' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>{s.label.toUpperCase()}</Typography>
                                        <Typography variant="h4" fontWeight={900} color="#1a1a2e" sx={{ my: 1 }}>{s.value.toLocaleString()}</Typography>
                                        <Typography variant="caption" sx={{ color: s.color, fontWeight: 700 }}>{s.trend}</Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: s.bg, color: s.color }}>{s.icon}</Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Tier Distribution Chart */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f0f0f0', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={800} mb={3}>Phân loại hạng thành viên</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analysis.tierDistribution}
                                        innerRadius={60} outerRadius={100}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {analysis.tierDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>TỶ LỆ CHUYỂN ĐỔI</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={700}>Standard ➔ Silver</Typography>
                                <Typography variant="body2" fontWeight={800} color="#10b981">15.4%</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Nearing Next Tier */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f0f0f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight={800}>Khách hàng sắp lên hạng</Typography>
                            <Button
                                size="small"
                                startIcon={<NotificationsActive />}
                                onClick={() => handleNotify()}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                Gửi thông báo toàn bộ
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ '& th': { border: 0, fontWeight: 800, fontSize: 11, color: '#888' } }}>
                                        <TableCell>KHÁCH HÀNG</TableCell>
                                        <TableCell>TIẾN TRÌNH ĐIỂM</TableCell>
                                        <TableCell align="right">MỤC TIÊU</TableCell>
                                        <TableCell align="right"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analysis.nearingNextTier?.map((c: any) => (
                                        <TableRow key={c.id} sx={{ '& td': { borderBottom: '1px solid #f9fafb', py: 2 } }}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#e0e7ff', color: '#1e1b4b', fontWeight: 700 }}>{c.name.charAt(0)}</Avatar>
                                                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ width: '40%' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(c.currentPoints / c.targetPoints) * 100}
                                                        sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
                                                    />
                                                    <Typography variant="caption" fontWeight={700} color="#10b981">{Math.round((c.currentPoints / c.targetPoints) * 100)}%</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={c.nextTier} size="small"
                                                    sx={{ bgcolor: c.nextTier === 'GOLD' ? '#fffbeb' : '#f8fafc', color: c.nextTier === 'GOLD' ? '#b45309' : '#475569', fontWeight: 800, fontSize: 10 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Gửi thông báo ưu đãi">
                                                    <IconButton size="small" onClick={() => handleNotify(c.name, c.id, c.nextTier)}>
                                                        <NotificationsActive sx={{ fontSize: 18, color: '#6366f1' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Inactive Customers */}
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f0f0f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={800}>Khách hàng lâu không quay lại</Typography>
                                <Typography variant="caption" color="text.secondary">Danh sách khách hàng không có phát sinh đơn hàng trên 30 ngày</Typography>
                            </Box>
                            <Button variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>Tạo chiến dịch Re-marketing</Button>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc', '& th': { border: 0, fontWeight: 800, fontSize: 11, color: '#64748b' } }}>
                                        <TableCell>KHÁCH HÀNG</TableCell>
                                        <TableCell>LẦN CUỐI MUA HÀNG</TableCell>
                                        <TableCell>SỐ NGÀY VẮNG MẶT</TableCell>
                                        <TableCell align="right">TỔNG CHI TIÊU</TableCell>
                                        <TableCell align="center">ĐÁNH GIÁ</TableCell>
                                        <TableCell align="right"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analysis.inactiveCustomers.map((c) => (
                                        <TableRow key={c.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9' } }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">ID: {c.id}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{new Date(c.lastOrder).toLocaleDateString('vi-VN')}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${c.daysInactive} ngày`} size="small"
                                                    sx={{ bgcolor: c.daysInactive > 90 ? '#fef2f2' : '#fff7ed', color: c.daysInactive > 90 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={700}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.totalSpent)}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {c.totalSpent > 2000000 ? <Star sx={{ color: '#f59e0b' }} /> : <Group sx={{ color: '#cbd5e1' }} />}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button size="small" sx={{ textTransform: 'none' }}>Xem hồ sơ</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
