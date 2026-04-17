// src/modules/admin/pages/customers/CustomerListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, InputAdornment,
    Chip, IconButton, Select, MenuItem, FormControl, Tooltip,
    Pagination, Skeleton, Alert, Avatar, Dialog, DialogTitle,
    DialogContent, DialogActions, Divider, LinearProgress,
} from '@mui/material';
import {
    Search, Add, Visibility, Refresh, EmojiEvents,
    Close, TrendingUp, Star, Person,
} from '@mui/icons-material';
import customerService from '../../../../services/customerService';
import { Customer, CustomerTier } from '../../../../types';

const TIER_MAP: Record<CustomerTier, { label: string; color: string; bg: string }> = {
    STANDARD: { label: 'Tiêu chuẩn', color: '#374151', bg: '#f3f4f6' },
    SILVER: { label: 'Bạc', color: '#6b7280', bg: '#e5e7eb' },
    GOLD: { label: 'Vàng', color: '#b45309', bg: '#fef3c7' },
};

const TIER_OPTIONS = [
    { value: '', label: 'Tất cả hạng thành viên' },
    { value: 'STANDARD', label: 'Tiêu chuẩn' },
    { value: 'SILVER', label: 'Bạc' },
    { value: 'GOLD', label: 'Vàng' },
];

const fmtCurrency = (n?: number) =>
    n == null ? '—'
        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ── Top Chi Tiêu Dialog ────────────────────────────────────
const TopSpendersDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            customerService.getTopSpenders(0, 10)
                .then(data => setTopCustomers(data.content ?? []))
                .catch(() => setTopCustomers([]))
                .finally(() => setLoading(false));
        }
    }, [open]);

    const maxSpent = topCustomers[0]?.totalSpent || 1;

    const medalColor = (idx: number) => {
        if (idx === 0) return { bg: '#fef3c7', color: '#d97706', border: '#fbbf24' };
        if (idx === 1) return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
        if (idx === 2) return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
        return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}>
            {/* Header */}
            <Box sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                px: 3, py: 2.5,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EmojiEvents sx={{ color: '#fff', fontSize: 28 }} />
                    <Box>
                        <Typography fontWeight={800} fontSize={18} color="#fff">Top Chi Tiêu</Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.85)">
                            10 khách hàng chi tiêu nhiều nhất
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {loading ? (
                    [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={60} sx={{ mb: 1, borderRadius: 2 }} />)
                ) : topCustomers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <EmojiEvents sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                    </Box>
                ) : (
                    topCustomers.map((customer, idx) => {
                        const medal = medalColor(idx);
                        const tier = TIER_MAP[customer.customerTier] ?? TIER_MAP.STANDARD;
                        const pct = Math.round((customer.totalSpent / maxSpent) * 100);
                        return (
                            <Box key={customer.id} sx={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                p: 1.5, mb: 1.5, borderRadius: 2,
                                border: `1px solid ${medal.border}`,
                                bgcolor: medal.bg,
                                transition: 'transform 0.15s',
                                '&:hover': { transform: 'translateX(4px)' },
                            }}>
                                {/* Rank */}
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    bgcolor: medal.color, color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 14, flexShrink: 0,
                                }}>
                                    {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                                </Box>

                                {/* Avatar */}
                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#1976d2', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                                    {customer.fullName.charAt(0)}
                                </Avatar>

                                {/* Info */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} noWrap>{customer.fullName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{customer.phoneNumber}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 1 }}>
                                            <Typography variant="body2" fontWeight={800} color="#b45309">
                                                {fmtCurrency(customer.totalSpent)}
                                            </Typography>
                                            <Chip label={tier.label} size="small"
                                                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: tier.bg, color: tier.color }} />
                                        </Box>
                                    </Box>
                                    <LinearProgress variant="determinate" value={pct}
                                        sx={{
                                            height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.08)',
                                            '& .MuiLinearProgress-bar': { bgcolor: medal.color, borderRadius: 2 }
                                        }} />
                                </Box>
                            </Box>
                        );
                    })
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Main Page ──────────────────────────────────────────────
const CustomerListPage: React.FC = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [topOpen, setTopOpen] = useState(false);
    const PAGE_SIZE = 20;

    const loadCustomers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await customerService.search({
                keyword: search.trim() || undefined,
                tier: tierFilter || undefined,
                page,
                size: PAGE_SIZE,
            });
            setCustomers(data.content ?? []);
            setTotalPages(data.totalPages ?? 0);
            setTotalElements(data.totalElements ?? 0);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    }, [search, tierFilter, page]);

    useEffect(() => {
        const t = setTimeout(() => setPage(0), 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { setPage(0); }, [tierFilter]);
    useEffect(() => { loadCustomers(); }, [search, tierFilter, page]);

    const stats = [
        { label: 'Tổng khách hàng', value: totalElements, color: '#1a1a2e' },
        { label: 'Đang hoạt động', value: customers.filter(c => c.isActive).length, color: '#2e7d32' },
        { label: 'Hạng Vàng', value: customers.filter(c => c.customerTier === 'GOLD').length, color: '#b45309' },
        { label: 'Hạng Bạc', value: customers.filter(c => c.customerTier === 'SILVER').length, color: '#6b7280' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>
                        Dashboard / <strong style={{ color: '#555' }}>Khách hàng</strong>
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>
                        Quản lý Khách hàng
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                        Danh sách và thông tin khách hàng CRM
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Làm mới">
                        <IconButton onClick={loadCustomers} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Refresh sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<EmojiEvents sx={{ fontSize: 16, color: '#d97706' }} />}
                        onClick={() => setTopOpen(true)}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 13,
                            borderColor: '#fbbf24', color: '#b45309',
                            bgcolor: '#fef3c7',
                            '&:hover': { bgcolor: '#fde68a', borderColor: '#f59e0b' },
                        }}>
                        Đang xem Top Chi tiêu
                    </Button>
                    <Button variant="contained" startIcon={<Add />}
                        sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1565c0' } }}>
                        + Thêm khách hàng
                    </Button>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 2.5 }}>
                {stats.map(s => (
                    <Paper key={s.label} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                        {loading
                            ? <Skeleton height={30} />
                            : <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                        }
                        <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Paper>
                ))}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                        size="small" placeholder="Tìm theo tên, SĐT hoặc Email..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment>
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select value={tierFilter} onChange={e => setTierFilter(e.target.value)} sx={{ fontSize: 13 }} displayEmpty>
                            {TIER_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['KHÁCH HÀNG', 'LIÊN HỆ', 'HẠNG THẺ', 'TỔNG CHI TIÊU', 'TRẠNG THÁI', 'THAO TÁC'].map(col => (
                                    <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5, letterSpacing: 0.3 }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4, 5, 6].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6].map(j => (
                                            <TableCell key={j}><Skeleton height={20} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : customers.length > 0 ? (
                                customers.map((customer, idx) => {
                                    const tier = TIER_MAP[customer.customerTier] ?? TIER_MAP.STANDARD;
                                    return (
                                        <TableRow key={customer.id} hover
                                            sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#f5f9ff' } }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#e3f2fd', color: '#1976d2', fontSize: 13, fontWeight: 700 }}>
                                                        {customer.fullName.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700} fontSize={13}>
                                                            {customer.fullName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {customer.notes || 'Không có ghi chú'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontSize={12}>{customer.phoneNumber}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customer.email || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip label={tier.label} size="small"
                                                    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: tier.bg, color: tier.color }} />
                                                <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                                                    {(customer.loyaltyPoints ?? 0).toLocaleString()} điểm
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {fmtCurrency(customer.totalSpent)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip
                                                    label={customer.isActive ? 'Hoạt động' : 'Vô hiệu'}
                                                    size="small"
                                                    sx={{
                                                        height: 22, fontSize: 11, fontWeight: 700,
                                                        bgcolor: customer.isActive ? '#e8f5e9' : '#f5f5f5',
                                                        color: customer.isActive ? '#2e7d32' : '#888',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Xem lịch sử mua hàng">
                                                        <IconButton size="small"
                                                            onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                                            sx={{ '&:hover': { color: '#1976d2', bgcolor: '#e3f2fd' } }}>
                                                            <Visibility sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={36} mb={1}>👥</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Không tìm thấy khách hàng nào
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.25, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                    <Typography variant="caption" color="text.secondary">
                        Hiển thị <strong>{customers.length}</strong> / <strong>{totalElements}</strong> khách hàng
                    </Typography>
                    {totalPages > 1 && (
                        <Pagination
                            count={totalPages} page={page + 1}
                            onChange={(_, v) => setPage(v - 1)}
                            color="primary" shape="rounded" size="small"
                        />
                    )}
                </Box>
            </Paper>

            {/* Top Spenders Dialog */}
            <TopSpendersDialog open={topOpen} onClose={() => setTopOpen(false)} />
        </Box>
    );
};

export default CustomerListPage;