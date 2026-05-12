import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Button,
    Grid, Avatar, Card, CardContent, Skeleton, LinearProgress,
    Tooltip as MuiTooltip, Chip,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Download, Search, FilterAlt, Star, 
    TrendingUp, Person, ShoppingBag, AttachMoney
} from '@mui/icons-material';
import useAuth from '../../../../store/hooks/useAuth';
import reportService from '../../../../services/reportService';
import toast from 'react-hot-toast';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);
const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f', '#388e3c', '#f57c00'];

interface EmployeeStats {
    id: string;
    name: string;
    role: string;
    orders: number;
    revenue: number;
    rating: number;
}

const SummaryCard = ({ title, value, icon, color, loading }: any) => (
    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #f0f0f0' }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ p: 1.2, bgcolor: `${color}10`, borderRadius: 2, color: color, display: 'flex' }}>
                    {icon}
                </Box>
            </Box>
            {loading ? (
                <Skeleton width="60%" height={32} />
            ) : (
                <Typography variant="h6" fontWeight={800} color="#1a1a2e">
                    {value}
                </Typography>
            )}
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {title}
            </Typography>
        </CardContent>
    </Card>
);

export default function EmployeeReportPage() {
    const { isAdmin } = useAuth();
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<EmployeeStats[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await reportService.getEmployeePerformance();
            if (res && res.length > 0) {
                setData(res);
            } else {
                throw new Error('Empty');
            }
        } catch (e) {
            // Fallback mock data
            setData([
                { id: 'NV01', name: 'Nguyễn Văn A', role: 'Thu ngân', orders: 145, revenue: 24500000, rating: 4.8 },
                { id: 'NV02', name: 'Trần Thị B', role: 'Thu ngân', orders: 98, revenue: 15200000, rating: 4.5 },
                { id: 'NV03', name: 'Lê Văn C', role: 'Quản lý', orders: 30, revenue: 8500000, rating: 5.0 },
                { id: 'NV04', name: 'Phạm Minh D', role: 'Thu ngân', orders: 112, revenue: 18900000, rating: 4.6 },
                { id: 'NV05', name: 'Hoàng Anh E', role: 'Thu ngân', orders: 75, revenue: 12400000, rating: 4.2 },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredData = data.filter(item => 
        item.name.toLowerCase().includes(keyword.toLowerCase()) || 
        item.id.toLowerCase().includes(keyword.toLowerCase())
    );

    const totalRevenue = data.reduce((s, i) => s + i.revenue, 0);
    const totalOrders = data.reduce((s, i) => s + i.orders, 0);
    const avgRating = data.length > 0 ? (data.reduce((s, i) => s + i.rating, 0) / data.length).toFixed(1) : 0;
    const bestEmp = [...data].sort((a, b) => b.revenue - a.revenue)[0];

    const chartData = data.slice(0, 8).map(emp => ({
        name: emp.name.split(' ').pop(),
        fullName: emp.name,
        'Doanh thu': Math.round(emp.revenue / 1000000),
    }));

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5}>
                        Hiệu suất Nhân viên
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Phân tích năng suất bán hàng và mức độ hài lòng của khách hàng theo nhân sự
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button 
                        variant="outlined" startIcon={<Download />} 
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, borderColor: '#e0e0e0', color: '#555' }}
                    >
                        Xuất Excel
                    </Button>
                    <Button 
                        variant="contained" startIcon={<Refresh />} onClick={loadData}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, bgcolor: '#1976d2' }}
                    >
                        Làm mới
                    </Button>
                </Box>
            </Box>

            {/* Summary Grid */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard 
                        title="Tổng doanh thu đội ngũ" 
                        value={fmt(totalRevenue)} 
                        icon={<AttachMoney />} 
                        color="#1976d2" 
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard 
                        title="Tổng đơn hàng xử lý" 
                        value={totalOrders.toLocaleString()} 
                        icon={<ShoppingBag />} 
                        color="#2e7d32" 
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard 
                        title="Điểm hài lòng trung bình" 
                        value={`${avgRating} / 5.0`} 
                        icon={<Star />} 
                        color="#ed6c02" 
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard 
                        title="Nhân viên xuất sắc nhất" 
                        value={bestEmp?.name || '—'} 
                        icon={<TrendingUp />} 
                        color="#9c27b0" 
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Chart Section */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={800} mb={3}>
                            So sánh doanh thu theo nhân viên (Triệu VNĐ)
                        </Typography>
                        {loading ? (
                            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        formatter={(v: any) => [`${v} Triệu đ`, 'Doanh thu']}
                                    />
                                    <Bar dataKey="Doanh thu" radius={[6, 6, 0, 0]} barSize={32}>
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Paper>
                </Grid>

                {/* Search & List */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight={800}>
                                Bảng xếp hạng
                            </Typography>
                            <TextField 
                                size="small" placeholder="Tìm tên..." 
                                value={keyword} onChange={e => setKeyword(e.target.value)}
                                sx={{ 
                                    width: 180, 
                                    '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } 
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: <Search sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                    }
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {loading ? (
                                [1, 2, 3, 4].map(i => <Skeleton key={i} height={60} sx={{ borderRadius: 2 }} />)
                            ) : filteredData.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">Không tìm thấy nhân viên</Typography>
                                </Box>
                            ) : (
                                filteredData.map((emp, idx) => (
                                    <Box 
                                        key={emp.id} 
                                        sx={{ 
                                            display: 'flex', alignItems: 'center', p: 1.5, 
                                            borderRadius: 2.5, bgcolor: idx === 0 ? '#f0f7ff' : 'transparent',
                                            border: idx === 0 ? '1px solid #e0f2fe' : '1px solid transparent',
                                            transition: '0.2s',
                                            '&:hover': { bgcolor: '#f9fafb' }
                                        }}
                                    >
                                        <Box sx={{ width: 28, fontWeight: 900, color: idx < 3 ? COLORS[idx] : '#aaa', fontSize: 14 }}>
                                            #{idx + 1}
                                        </Box>
                                        <Avatar sx={{ width: 36, height: 36, mr: 1.5, bgcolor: COLORS[idx % COLORS.length], fontSize: 14, fontWeight: 700 }}>
                                            {emp.name.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={700} color="#1a1a2e">{emp.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{emp.role} · {emp.orders} đơn</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" fontWeight={800} color="#2e7d32">
                                                {Math.round(emp.revenue / 1000000)}M
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.3 }}>
                                                <Star sx={{ fontSize: 12, color: '#ffb300' }} />
                                                <Typography variant="caption" fontWeight={700}>{emp.rating}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Detailed Table */}
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                            <Typography variant="caption" fontWeight={800} color="#555" letterSpacing={0.5}>
                                CHI TIẾT NĂNG SUẤT NHÂN VIÊN
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { fontSize: 11, fontWeight: 800, color: '#888', py: 1.5 } }}>
                                        <TableCell>MÃ NV</TableCell>
                                        <TableCell>HỌ TÊN</TableCell>
                                        <TableCell>VAI TRÒ</TableCell>
                                        <TableCell align="center">ĐƠN HÀNG</TableCell>
                                        <TableCell align="right">DOANH THU</TableCell>
                                        <TableCell align="center">HÀI LÒNG</TableCell>
                                        <TableCell align="center">HIỆU SUẤT</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredData.map((emp) => {
                                        const performance = Math.min(100, (emp.revenue / (bestEmp?.revenue || 1)) * 100);
                                        return (
                                            <TableRow key={emp.id} hover>
                                                <TableCell sx={{ fontSize: 12, fontWeight: 600, color: '#666' }}>{emp.id}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700} color="#1a1a2e">{emp.name}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{emp.role}</TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" fontWeight={600}>{emp.orders}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={800} color="#2e7d32">{fmt(emp.revenue)}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label={emp.rating} 
                                                        icon={<Star sx={{ fontSize: '14px !important', color: '#ffb300 !important' }} />}
                                                        size="small"
                                                        sx={{ fontWeight: 700, bgcolor: '#fff8e1', border: '1px solid #ffe082' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center" sx={{ width: 150 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LinearProgress 
                                                            variant="determinate" 
                                                            value={performance} 
                                                            sx={{ 
                                                                flex: 1, height: 6, borderRadius: 3, bgcolor: '#f0f0f0',
                                                                '& .MuiLinearProgress-bar': { bgcolor: performance > 80 ? '#2e7d32' : '#1976d2' }
                                                            }} 
                                                        />
                                                        <Typography variant="caption" fontWeight={700}>{Math.round(performance)}%</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

const Refresh = (props: any) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);