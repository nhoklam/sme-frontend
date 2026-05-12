import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Button,
    Grid, CircularProgress, Alert
} from '@mui/material';
import { Download, Search, FilterAlt, BarChart } from '@mui/icons-material';
import reportService from '../../../../services/reportService';
import useAuth from '../../../../store/hooks/useAuth';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

export default function ProductReportPage() {
    const { isAdmin, warehouseId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        // Tạm thời gọi API top products hoặc API mockup nếu backend chưa có
        const loadData = async () => {
            setLoading(true);
            try {
                const today = new Date();
                const fromDate = new Date();
                fromDate.setDate(today.getDate() - 30);
                const fmt = (d: Date) => d.toISOString().split('T')[0];
                // Thử gọi API top-products
                const res = await reportService.getTopProducts({
                    limit: 50,
                    from: fmt(fromDate),
                    to: fmt(today),
                    warehouseId: isAdmin ? undefined : warehouseId || undefined
                });
                setData(res);
            } catch (e) {
                console.error("Lỗi tải báo cáo sản phẩm", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isAdmin, warehouseId]);

    const filteredData = data.filter(item => 
        (item.productName || '').toLowerCase().includes(keyword.toLowerCase())
    );

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="#111" mb={0.5}>
                        Báo cáo Hiệu suất Sản phẩm
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Thống kê chi tiết doanh số bán ra, tồn kho của từng sản phẩm
                    </Typography>
                </Box>
                <Button variant="outlined" startIcon={<Download />} sx={{ textTransform: 'none' }}>
                    Xuất Excel
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField 
                            fullWidth size="small" 
                            placeholder="Tìm kiếm sản phẩm..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Button variant="contained" startIcon={<FilterAlt />} disableElevation>
                            Lọc dữ liệu
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><b>Sản phẩm</b></TableCell>
                                <TableCell align="center"><b>Đã bán (Số lượng)</b></TableCell>
                                <TableCell align="right"><b>Doanh thu mang lại</b></TableCell>
                                <TableCell align="center"><b>Chỉ số</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 5, color: '#888' }}>
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{item.quantitySold}</TableCell>
                                        <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>{fmt(item.revenue)}</TableCell>
                                        <TableCell align="center">
                                            <BarChart fontSize="small" sx={{ color: '#1976d2' }} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}