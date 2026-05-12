import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Avatar, Chip, Button,
    Divider, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Skeleton, Tabs, Tab,
    Card, CardContent, Tooltip, TextField, Alert, LinearProgress
} from '@mui/material';
import {
    ArrowBack, Edit, ShoppingBag, History,
    Person, LocalPhone, Email, LocationOn,
    Star, WorkspacePremium, ReceiptLong,
    TrendingUp, Event, Notes, Save
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import customerService from '../../../../services/customerService';
import axiosInstance from '../../../../services/axiosConfig';
import { Customer, CustomerTier } from '../../../../types';
import PrintInvoiceDialog from '../../../employee/components/pos/PrintInvoiceDialog';

const fmtCurrency = (n?: number) =>
    n == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('vi-VN') : '—';

const TIER_CONFIG: Record<CustomerTier, { label: string; color: string; bg: string; icon: any }> = {
    STANDARD: { label: 'TIÊU CHUẨN', color: '#6b7280', bg: '#f3f4f6', icon: <Person sx={{ fontSize: 16 }} /> },
    SILVER: { label: 'THÀNH VIÊN BẠC', color: '#4b5563', bg: '#e5e7eb', icon: <Star sx={{ fontSize: 16 }} /> },
    GOLD: { label: 'THÀNH VIÊN VÀNG', color: '#b45309', bg: '#fef3c7', icon: <WorkspacePremium sx={{ fontSize: 16 }} /> },
};

interface TabPanelProps { children?: React.ReactNode; index: number; value: number }
function TabPanel({ children, value, index }: TabPanelProps) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [history, setHistory] = useState<{ invoices: any[], orders: any[] }>({ invoices: [], orders: [] });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [editingNotes, setEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState('');

    const [printInvoice, setPrintInvoice] = useState<any>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);

    const handleViewPOSInvoice = async (invoiceId: string) => {
        try {
            const res = await axiosInstance.get(`/pos/invoices/${invoiceId}`);
            setPrintInvoice(res.data?.data);
            setPrintDialogOpen(true);
        } catch (e) {
            toast.error('Không thể tải chi tiết hóa đơn');
        }
    };

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [cust, hist] = await Promise.all([
                customerService.getById(id),
                customerService.getHistory(id)
            ]);
            setCustomer(cust);
            setHistory(hist || { invoices: [], orders: [] });
            setTempNotes(cust.notes || '');
        } catch (e) {
            toast.error('Không thể tải thông tin khách hàng');
            navigate('/admin/customers');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveNotes = async () => {
        if (!customer) return;
        try {
            await customerService.update(customer.id, { notes: tempNotes });
            setCustomer({ ...customer, notes: tempNotes });
            setEditingNotes(false);
            toast.success('Đã cập nhật ghi chú CRM');
        } catch (e) {
            toast.error('Lưu ghi chú thất bại');
        }
    };

    if (loading) return (
        <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3 }} />
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
                <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
            </Grid>
        </Box>
    );

    if (!customer) return <Alert severity="error">Không tìm thấy khách hàng</Alert>;

    const tier = TIER_CONFIG[customer.customerTier] || TIER_CONFIG.STANDARD;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header / Breadcrumbs */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/customers')} sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>CRM / CHI TIẾT KHÁCH HÀNG</Typography>
                    <Typography variant="h5" fontWeight={900} color="#1a1a2e">{customer.fullName}</Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" startIcon={<Edit />} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>
                    Chỉnh sửa hồ sơ
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left: Profile Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f0f0f0', textAlign: 'center', bgcolor: '#fff' }}>
                        <Avatar 
                            sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: '#1976d2', fontSize: 40, fontWeight: 800, boxShadow: '0 8px 24px rgba(25,118,210,0.2)' }}
                        >
                            {customer.fullName.charAt(0)}
                        </Avatar>
                        <Typography variant="h6" fontWeight={800} color="#1a1a2e">{customer.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{customer.phoneNumber}</Typography>
                        
                        <Chip 
                            icon={tier.icon}
                            label={tier.label}
                            sx={{ mt: 1, px: 1, fontWeight: 800, bgcolor: tier.bg, color: tier.color, border: `1px solid ${tier.color}40`, height: 28, fontSize: 11 }}
                        />

                        <Divider sx={{ my: 3 }} />

                        <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1.5}>THÔNG TIN LIÊN HỆ</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <LocalPhone sx={{ fontSize: 18, color: '#1976d2' }} />
                                <Typography variant="body2">{customer.phoneNumber}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Email sx={{ fontSize: 18, color: '#1976d2' }} />
                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{customer.email || 'Chưa cập nhật'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <LocationOn sx={{ fontSize: 18, color: '#1976d2' }} />
                                <Typography variant="body2">{customer.address || 'Chưa cập nhật'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Event sx={{ fontSize: 18, color: '#1976d2' }} />
                                <Typography variant="body2">Ngày sinh: {fmtDate(customer.dateOfBirth)}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 4, p: 2, bgcolor: '#f0f7ff', borderRadius: 3, border: '1px solid #dbeafe' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" fontWeight={700} color="#1976d2">ĐIỂM TÍCH LŨY</Typography>
                                <Typography variant="body2" fontWeight={800} color="#1976d2">{(customer.loyaltyPoints ?? 0).toLocaleString()} pts</Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={Math.min(((customer.loyaltyPoints ?? 0) / 5000) * 100, 100)} 
                                sx={{ height: 6, borderRadius: 3, bgcolor: '#fff', '& .MuiLinearProgress-bar': { borderRadius: 3 } }} 
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontSize: 10 }}>
                                Cần thêm {(5000 - (customer.loyaltyPoints ?? 0)).toLocaleString()} điểm để lên hạng tiếp theo
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right: Stats & Tabs */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* Stats Grid */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {[
                            { label: 'TỔNG CHI TIÊU', value: fmtCurrency(customer.totalSpent), icon: <TrendingUp />, color: '#16a34a', bg: '#f0fdf4' },
                            { label: 'TỔNG ĐƠN HÀNG', value: history.invoices.length + history.orders.length, icon: <ShoppingBag />, color: '#2563eb', bg: '#eff6ff' },
                            { label: 'GIÁ TRỊ ĐƠN TB', value: fmtCurrency((history.invoices.length + history.orders.length) ? customer.totalSpent / (history.invoices.length + history.orders.length) : 0), icon: <ReceiptLong />, color: '#7c3aed', bg: '#f5f3ff' },
                        ].map((s, i) => (
                            <Grid size={{ xs: 12, sm: 4 }} key={i}>
                                <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #f0f0f0' }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: s.bg, color: s.color, display: 'flex' }}>{s.icon}</Box>
                                            <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>{s.label}</Typography>
                                        </Box>
                                        <Typography variant="h5" fontWeight={900} color="#1a1a2e">{s.value}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Tabs Section */}
                    <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #f0f0f0', overflow: 'hidden', bgcolor: '#fff' }}>
                        <Tabs 
                            value={tab} onChange={(_, v) => setTab(v)}
                            sx={{ 
                                px: 2, pt: 1, borderBottom: '1px solid #f0f0f0',
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minWidth: 120 }
                            }}
                        >
                            <Tab label="Lịch sử mua hàng" icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" />
                            <Tab label="Ghi chú & Phản hồi" icon={<Notes sx={{ fontSize: 18 }} />} iconPosition="start" />
                        </Tabs>

                        <Box sx={{ p: 3 }}>
                            <TabPanel value={tab} index={0}>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ '& th': { border: 0, color: '#888', fontWeight: 800, fontSize: 11, py: 1.5 } }}>
                                                <TableCell>MÃ ĐƠN</TableCell>
                                                <TableCell>NGÀY MUA</TableCell>
                                                <TableCell align="right">GIÁ TRỊ</TableCell>
                                                <TableCell align="center">TRẠNG THÁI</TableCell>
                                                <TableCell align="right"></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {history.invoices.length === 0 && history.orders.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa có giao dịch nào</TableCell></TableRow>
                                            ) : (
                                                [...history.invoices.map(i => ({...i, source: 'POS'})), ...history.orders.map(o => ({...o, source: 'ONLINE'}))]
                                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                    .map((inv) => (
                                                        <TableRow key={inv.id} hover sx={{ '& td': { borderBottom: '1px solid #f9fafb', py: 1.5 } }}>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight={700} fontFamily="monospace">{inv.code}</Typography>
                                                                <Chip label={inv.source} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 800, mt: 0.5, bgcolor: inv.source === 'POS' ? '#f3f4f6' : '#e0f2fe' }} />
                                                            </TableCell>
                                                            <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(inv.createdAt)}</Typography></TableCell>
                                                            <TableCell align="right"><Typography variant="body2" fontWeight={700}>{fmtCurrency(inv.finalAmount)}</Typography></TableCell>
                                                            <TableCell align="center">
                                                                <Chip 
                                                                    label={inv.type === 'SALE' || inv.source === 'ONLINE' ? 'Thành công' : 'Trả hàng'} 
                                                                    size="small" 
                                                                    sx={{ 
                                                                        height: 20, fontSize: 10, fontWeight: 700, 
                                                                        bgcolor: (inv.type === 'SALE' || inv.source === 'ONLINE') ? '#e8f5e9' : '#fff3e0', 
                                                                        color: (inv.type === 'SALE' || inv.source === 'ONLINE') ? '#2e7d32' : '#e65100' 
                                                                    }} 
                                                                />
                                                             </TableCell>
                                                            <TableCell align="right">
                                                                <Tooltip title="Xem chi tiết">
                                                                    <IconButton size="small" onClick={() => {
                                                                        if (inv.source === 'POS') {
                                                                            handleViewPOSInvoice(inv.id);
                                                                        } else {
                                                                            navigate(`/admin/orders/${inv.id}`);
                                                                        }
                                                                    }}>
                                                                        <ArrowBack sx={{ transform: 'rotate(180deg)', fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </TabPanel>

                            <TabPanel value={tab} index={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={800} color="#1a1a2e">Nhật ký CRM & Ghi chú</Typography>
                                    {!editingNotes ? (
                                        <Button size="small" startIcon={<Edit />} onClick={() => setEditingNotes(true)} sx={{ textTransform: 'none' }}>Chỉnh sửa</Button>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button size="small" onClick={() => { setEditingNotes(false); setTempNotes(customer.notes || ''); }} sx={{ textTransform: 'none' }}>Hủy</Button>
                                            <Button size="small" variant="contained" startIcon={<Save />} onClick={handleSaveNotes} sx={{ textTransform: 'none' }}>Lưu ghi chú</Button>
                                        </Box>
                                    )}
                                </Box>
                                {editingNotes ? (
                                    <TextField 
                                        fullWidth multiline rows={6} 
                                        value={tempNotes} onChange={(e) => setTempNotes(e.target.value)}
                                        placeholder="Nhập thói quen mua sắm, sở thích hoặc lưu ý đặc biệt về khách hàng này..."
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                    />
                                ) : (
                                    <Box sx={{ p: 3, bgcolor: '#f9fafb', borderRadius: 3, border: '1px solid #f0f0f0', minHeight: 150 }}>
                                        <Typography variant="body2" color={customer.notes ? 'text.primary' : 'text.secondary'} sx={{ whiteSpace: 'pre-line' }}>
                                            {customer.notes || 'Không có ghi chú nào được ghi lại cho khách hàng này.'}
                                        </Typography>
                                    </Box>
                                )}
                                
                                <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: '#fff8e1', border: '1px solid #ffecb3', display: 'flex', gap: 1.5 }}>
                                    <Star sx={{ color: '#f59e0b', fontSize: 20 }} />
                                    <Typography variant="caption" color="#78350f" lineHeight={1.5}>
                                        <b>Mẹo CRM:</b> Ghi lại sở thích thể loại sách hoặc các dịp kỷ niệm của khách hàng để nhân viên có thể tư vấn tốt hơn trong lần mua tới.
                                    </Typography>
                                </Box>
                            </TabPanel>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
            {printInvoice && (
                <PrintInvoiceDialog
                    open={printDialogOpen}
                    invoice={printInvoice}
                    onClose={() => setPrintDialogOpen(false)}
                />
            )}
        </Box>
    );
}