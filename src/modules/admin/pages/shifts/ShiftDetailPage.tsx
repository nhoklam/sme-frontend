import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Grid, Chip,
    IconButton, Alert, Skeleton, Table,
    TableBody, TableCell, TableHead, TableRow, TableContainer,
    Avatar, Card, CardContent, TablePagination, TextField, InputAdornment
} from '@mui/material';
import {
    ArrowBack, Search,
    CheckCircleOutline, ErrorOutline, History,
    Print, Description, Person, StorefrontOutlined,
    Payments, ReceiptLong, TrendingUp
} from '@mui/icons-material';
import shiftService, { PosShift } from '../../../../services/shiftService';
import toast from 'react-hot-toast';

const fmt = (n?: number) =>
    n == null
        ? '—'
        : new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(n);

// ── Stat Card ──────────────────────────────────────────────────
const DetailStat = ({ label, value, sub, color, icon }: any) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', bgcolor: '#fff', height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ p: 1, bgcolor: `${color}10`, color: color, borderRadius: 2, display: 'flex' }}>
                    {icon}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                    {label}
                </Typography>
            </Box>
            <Typography variant="h5" fontWeight={900} color="#1a1a2e" mb={0.5}>
                {value}
            </Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </CardContent>
    </Card>
);

// ── Field Row ──────────────────────────────────────────────────
const FieldRow = ({ label, value, color = '#1a1a2e', bold = false }: any) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f5f5f5' }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
        <Typography variant="body2" fontWeight={bold ? 800 : 600} color={color}>{value}</Typography>
    </Box>
);

const ShiftDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [shift, setShift] = useState<PosShift | null>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Pagination & Search
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [totalElements, setTotalElements] = useState(0);

    const loadShift = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const sData = await shiftService.getById(id);
            setShift(sData);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải thông tin ca làm việc');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadInvoices = useCallback(async () => {
        if (!id) return;
        setInvoicesLoading(true);
        try {
            const iData = await shiftService.getInvoicesByShift(id, page, rowsPerPage, keyword);
            setInvoices(iData.content || []);
            setTotalElements(iData.totalElements || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setInvoicesLoading(false);
        }
    }, [id, page, rowsPerPage, keyword]);

    useEffect(() => {
        loadShift();
    }, [loadShift]);

    useEffect(() => {
        const t = setTimeout(() => {
            loadInvoices();
        }, 300);
        return () => clearTimeout(t);
    }, [loadInvoices]);

    const handleApprove = async () => {
        if (!id) return;
        try {
            await shiftService.approveShift(id);
            toast.success('Đã duyệt ca làm việc');
            loadShift();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Duyệt ca thất bại');
        }
    };

    if (loading) return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            <Skeleton width={300} height={40} sx={{ mb: 3 }} />
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
            </Grid>
        </Box>
    );

    if (error || !shift) return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error">{error || 'Không tìm thấy ca làm việc'}</Typography>
            <Button onClick={() => navigate('/admin/shifts')} sx={{ mt: 2 }}>Quay lại danh sách</Button>
        </Box>
    );

    const isDiff = (shift.discrepancyAmount || 0) !== 0;
    const statusColor = shift.status === 'OPEN' ? '#2e7d32' : shift.status === 'MANAGER_APPROVED' ? '#1976d2' : '#ed6c02';

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/admin/shifts')} sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0' }}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight={900} color="#1a1a2e">
                            Chi tiết Phiên làm việc
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StorefrontOutlined sx={{ fontSize: 12 }} /> Kho: {shift.warehouseName || shift.warehouseId} <Person sx={{ fontSize: 12, ml: 1 }} /> Thu ngân: {shift.cashierName || shift.cashierId}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button onClick={() => window.print()} startIcon={<Print />} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        In báo cáo ca
                    </Button>
                    {shift.status === 'CLOSED' && (
                        <Button 
                            startIcon={<CheckCircleOutline />} 
                            variant="contained" 
                            color="primary"
                            onClick={handleApprove}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: '0 4px 12px rgba(25,118,210,0.2)' }}
                        >
                            Duyệt chốt ca
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Status Alert */}
            {isDiff && (
                <Alert 
                    severity={(shift.discrepancyAmount || 0) < 0 ? "error" : "warning"}
                    icon={<ErrorOutline />}
                    sx={{ mb: 3, borderRadius: 3, border: '1px solid #ffe2a1', fontWeight: 600 }}
                >
                    Ca làm việc bị {(shift.discrepancyAmount || 0) < 0 ? 'thiếu' : 'thừa'} {fmt(Math.abs(shift.discrepancyAmount || 0))} so với hệ thống tính. Lý do: {shift.discrepancyReason || 'Không có ghi chú'}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Stats row */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DetailStat 
                        label="Tổng doanh thu" 
                        value={fmt(shift.totalRevenue)} 
                        sub="Doanh số ghi nhận từ hóa đơn"
                        color="#1976d2" 
                        icon={<ReceiptLong />} 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DetailStat 
                        label="Tiền mặt báo cáo" 
                        value={fmt(shift.reportedCash)} 
                        sub="Số tiền thu ngân kê khai"
                        color="#2e7d32" 
                        icon={<Payments />} 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DetailStat 
                        label="Chênh lệch" 
                        value={fmt(shift.discrepancyAmount)} 
                        sub="So với số tiền hệ thống tính"
                        color={isDiff ? '#d32f2f' : '#888'} 
                        icon={<TrendingUp />} 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DetailStat 
                        label="Trạng thái" 
                        value={shift.status === 'OPEN' ? 'ĐANG MỞ' : shift.status === 'MANAGER_APPROVED' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'} 
                        sub={shift.closedAt ? `Đóng lúc: ${new Date(shift.closedAt).toLocaleTimeString()}` : 'Ca đang hoạt động'}
                        color={statusColor} 
                        icon={<History />} 
                    />
                </Grid>

                {/* Left: General Info & Summary */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f0f0f0', mb: 3 }}>
                        <Typography variant="subtitle2" fontWeight={800} mb={2} color="#1a1a2e">THÔNG TIN CHUNG</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#f9fafb', borderRadius: 3 }}>
                            <Avatar sx={{ width: 48, height: 48, bgcolor: '#fff', border: '1px solid #eee', color: '#1976d2' }}>
                                <Person />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight={800}>{shift.cashierName || shift.cashierId}</Typography>
                                <Typography variant="caption" color="text.secondary">Thu ngân phiên làm việc</Typography>
                            </Box>
                        </Box>
                        
                        <FieldRow label="Bắt đầu" value={new Date(shift.openedAt).toLocaleString('vi-VN')} />
                        <FieldRow label="Kết thúc" value={shift.closedAt ? new Date(shift.closedAt).toLocaleString('vi-VN') : '—'} />
                        <FieldRow label="Duyệt lúc" value={shift.approvedAt ? new Date(shift.approvedAt).toLocaleString('vi-VN') : '—'} />
                        <FieldRow label="Chi nhánh" value={shift.warehouseName || shift.warehouseId} />
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f0f0f0' }}>
                        <Typography variant="subtitle2" fontWeight={800} mb={2} color="#1a1a2e">ĐỐI SOÁT TIỀN MẶT</Typography>
                        <FieldRow label="Vốn đầu ca" value={fmt(shift.startingCash)} />
                        <FieldRow label="Tiền mặt hệ thống tính" value={fmt(shift.theoreticalCash)} bold />
                        <FieldRow label="Tiền mặt thực tế (kê khai)" value={fmt(shift.reportedCash)} color="#1976d2" bold />
                        <Box sx={{ mt: 2, p: 2, bgcolor: isDiff ? ((shift.discrepancyAmount || 0) < 0 ? '#fff1f0' : '#fffbe6') : '#f6ffed', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={700} color={isDiff ? ((shift.discrepancyAmount || 0) < 0 ? '#cf1322' : '#d48806') : '#389e0d'}>
                                KẾT QUẢ: {isDiff ? ((shift.discrepancyAmount || 0) < 0 ? `THIẾU ${fmt(Math.abs(shift.discrepancyAmount || 0))}` : `THỪA ${fmt(Math.abs(shift.discrepancyAmount || 0))}`) : 'KHỚP 100%'}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right: Invoices List */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <Box sx={{ p: 2.5, borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={800} color="#1a1a2e">DANH SÁCH HÓA ĐƠN</Typography>
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm hóa đơn..."
                                value={keyword}
                                onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                                }}
                                sx={{ width: 250, '& input': { py: 1, fontSize: 13 } }}
                            />
                        </Box>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#fafafa', fontSize: 11, fontWeight: 800, color: '#888', py: 1.5 } }}>
                                        <TableCell>MÃ HĐ</TableCell>
                                        <TableCell>KHÁCH HÀNG</TableCell>
                                        <TableCell>THỜI GIAN</TableCell>
                                        <TableCell>LOẠI</TableCell>
                                        <TableCell align="right">TỔNG TIỀN</TableCell>
                                        <TableCell align="center">THAO TÁC</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                <Typography variant="body2" color="text.secondary">Không có hóa đơn nào phát sinh trong ca</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((inv) => (
                                            <TableRow key={inv.id} hover>
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Typography variant="body2" fontWeight={700} color="#1976d2">{inv.code}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} fontSize={13}>{inv.customerName || 'Khách lẻ'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{inv.customerPhone || '—'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontSize={12}>{new Date(inv.createdAt).toLocaleTimeString('vi-VN')}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={inv.type === 'SALE' ? 'BÁN HÀNG' : 'TRẢ HÀNG'} 
                                                        size="small" 
                                                        sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: inv.type === 'SALE' ? '#e6f7ff' : '#fff1f0', color: inv.type === 'SALE' ? '#096dd9' : '#cf1322' }} 
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={700}>{fmt(inv.finalAmount)}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => navigate(`/admin/orders/${inv.code}`)}><Description sx={{ fontSize: 18 }} /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={totalElements}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            labelRowsPerPage="Số dòng:"
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} của ${count !== -1 ? count : `hơn ${to}`}`}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ShiftDetailPage;
