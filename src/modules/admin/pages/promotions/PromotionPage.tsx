import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, InputAdornment,
    Chip, IconButton, Select, MenuItem, FormControl, Tooltip,
    Pagination, Skeleton, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions, Divider, Grid, Card, CardContent,
    Switch, FormControlLabel, CircularProgress
} from '@mui/material';
import {
    Search, Add, Refresh, LocalOffer, Edit, Delete,
    Event, FilterList, CheckCircle, Info, ConfirmationNumber,
    CalendarToday
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import promotionService from '../../../../services/promotionService';
import { Promotion, PromotionType } from '../../../../types';

const fmtCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');

const TYPE_MAP: Record<PromotionType, { label: string; color: string; bg: string }> = {
    PERCENTAGE: { label: 'Phần trăm', color: '#1d4ed8', bg: '#eff6ff' },
    FIXED_AMOUNT: { label: 'Số tiền cố định', color: '#059669', bg: '#ecfdf5' },
    BUY_X_GET_Y: { label: 'Mua X tặng Y', color: '#7c3aed', bg: '#f5f3ff' },
};

export default function PromotionPage() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [selected, setSelected] = useState<Promotion | null>(null);
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['promotions', page, search],
        queryFn: () => promotionService.getAll({ page, size: 10, keyword: search }),
    });

    const handleEdit = (p: Promotion) => {
        setSelected(p);
        setCreateOpen(true);
    };

    const handleToggle = async (id: string) => {
        try {
            await promotionService.toggleActive(id);
            toast.success('Đã thay đổi trạng thái khuyến mãi');
            qc.invalidateQueries({ queryKey: ['promotions'] });
        } catch {
            toast.error('Thao tác thất bại');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;
        try {
            await promotionService.delete(id);
            toast.success('Đã xóa khuyến mãi');
            qc.invalidateQueries({ queryKey: ['promotions'] });
        } catch {
            toast.error('Xóa thất bại');
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>QUẢN LÝ / <strong>KHUYẾN MÃI</strong></Typography>
                    <Typography variant="h5" fontWeight={900} color="#1a1a2e" mt={0.5}>Chương trình Khuyến mãi</Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>Tạo và quản lý các mã giảm giá, chiết khấu</Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
                    sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 3, py: 1 }}
                >
                    Tạo chương trình mới
                </Button>
            </Box>

            {/* Stats */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                    { label: 'Đang chạy', value: '0', color: '#059669', bg: '#ecfdf5', icon: <CheckCircle /> },
                    { label: 'Chờ kích hoạt', value: '0', color: '#d97706', bg: '#fffbeb', icon: <Event /> },
                    { label: 'Mã đã sử dụng', value: '0', color: '#1976d2', bg: '#eff6ff', icon: <ConfirmationNumber /> },
                ].map((s, i) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={i}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: s.bg, color: s.color, display: 'flex' }}>{s.icon}</Box>
                                <Box>
                                    <Typography variant="h5" fontWeight={900}>{s.value}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{s.label}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        size="small" placeholder="Tìm theo mã hoặc tên chương trình..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
                    />
                    <Button variant="outlined" startIcon={<FilterList />} sx={{ textTransform: 'none', borderRadius: 2 }}>Bộ lọc</Button>
                    <IconButton onClick={() => qc.invalidateQueries({ queryKey: ['promotions'] })} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Refresh />
                    </IconButton>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Chương trình', 'Loại', 'Mức giảm', 'Thời hạn', 'Đã dùng', 'Trạng thái', ''].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, color: '#888', py: 2 }}>{h.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={7}><Skeleton height={40} /></TableCell></TableRow>)
                            ) : !data?.content?.length ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <LocalOffer sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">Chưa có chương trình khuyến mãi nào</Typography>
                                        <Button variant="text" sx={{ mt: 1 }} onClick={() => { setSelected(null); setCreateOpen(true); }}>Tạo ngay</Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.content.map((p) => {
                                    const type = TYPE_MAP[p.type] || TYPE_MAP['PERCENTAGE'];
                                    const isExpired = p.endDate ? new Date(p.endDate) < new Date() : false;
                                    return (
                                        <TableRow key={p.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={800}>{p.name}</Typography>
                                                <Typography variant="caption" color="primary" sx={{ bgcolor: '#eff6ff', px: 1, py: 0.2, borderRadius: 1, fontWeight: 700, fontFamily: 'monospace' }}>
                                                    {p.code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={type.label} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: type.bg, color: type.color }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={800} color="#1e293b">
                                                    {p.type === 'PERCENTAGE' ? `${p.discountValue}%` : fmtCurrency(p.discountValue)}
                                                </Typography>
                                                {p.minOrderAmount > 0 && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Từ {fmtCurrency(p.minOrderAmount)}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isExpired ? '#ef4444' : '#64748b' }}>
                                                    <CalendarToday sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '?'} - {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '?'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color="#475569">
                                                    {p.usedCount || 0} / {p.maxUsage || '∞'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    size="small" checked={p.isActive}
                                                    onChange={() => handleToggle(p.id)}
                                                    color="success"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleEdit(p)} sx={{ color: '#6366f1' }}><Edit sx={{ fontSize: 18 }} /></IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: '#ef4444' }}><Delete sx={{ fontSize: 18 }} /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f0f0f0' }}>
                    <Pagination count={data?.totalPages || 0} page={page + 1} onChange={(_, p) => setPage(p - 1)} size="small" color="primary" />
                </Box>
            </Paper>

            <PromotionDialog
                open={createOpen}
                editing={selected}
                onClose={() => { setCreateOpen(false); setSelected(null); }}
                onSuccess={() => { qc.invalidateQueries({ queryKey: ['promotions'] }); setCreateOpen(false); setSelected(null); }}
            />
        </Box>
    );
}

// ── Promotion Dialog ─────────────────────────────────────────
const PromotionDialog = ({ open, editing, onClose, onSuccess }: { open: boolean; editing: Promotion | null; onClose: () => void; onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<Partial<Promotion>>({
        name: '', code: '', discountType: 'PERCENTAGE', discountValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        isActive: true, minOrderValue: 0, maxUsage: undefined, maxDiscountAmount: undefined
    });

    useEffect(() => {
        if (editing) {
            setForm({
                ...editing,
                startDate: editing.startDate ? editing.startDate.split('T')[0] : '',
                endDate: editing.endDate ? editing.endDate.split('T')[0] : '',
                discountType: editing.discountType || editing.type || 'PERCENTAGE',
                minOrderValue: editing.minOrderValue || editing.minOrderAmount || 0,
                maxDiscountAmount: editing.maxDiscountAmount,
                maxUsage: editing.maxUsage
            });
        } else {
            setForm({
                name: '', code: '', discountType: 'PERCENTAGE', discountValue: 0,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                isActive: true, minOrderValue: 0, maxUsage: undefined, maxDiscountAmount: undefined
            });
        }
    }, [editing, open]);

    const handleSave = async () => {
        if (!form.name || !form.code || !form.discountValue) {
            toast.error('Vui lòng nhập đủ các trường bắt buộc');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                code: form.code?.toUpperCase(),
                name: form.name,
                description: form.description,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                minOrderValue: Number(form.minOrderValue || 0),
                maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
                maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
                startDate: new Date(form.startDate + 'T00:00:00Z').toISOString(),
                endDate: new Date(form.endDate + 'T23:59:59Z').toISOString(),
                isActive: form.isActive ?? true
            };
            if (editing) {
                await promotionService.update(editing.id, payload as any);
                toast.success('Cập nhật khuyến mãi thành công');
            } else {
                await promotionService.create(payload);
                toast.success('Thêm khuyến mãi mới thành công');
            }
            onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Lưu thất bại');
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3 }}>
                {editing ? 'Chỉnh sửa Khuyến mãi' : 'Tạo Khuyến mãi Mới'}
            </DialogTitle>
            <DialogContent sx={{ px: 3 }}>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Mã ưu đãi *</Typography>
                        <TextField
                            fullWidth size="small" placeholder="Vd: HE2026" sx={{ mt: 0.5 }}
                            value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            disabled={!!editing}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Tên chương trình *</Typography>
                        <TextField
                            fullWidth size="small" placeholder="Vd: Giảm giá hè 2026" sx={{ mt: 0.5 }}
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Loại hình giảm giá</Typography>
                        <Select
                            fullWidth size="small" value={form.discountType} sx={{ mt: 0.5 }}
                            onChange={e => setForm({ ...form, discountType: e.target.value as any })}
                        >
                            <MenuItem value="PERCENTAGE">Phần trăm (%)</MenuItem>
                            <MenuItem value="FIXED_AMOUNT">Số tiền cố định (VND)</MenuItem>
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">
                            {form.discountType === 'PERCENTAGE' ? 'Phần trăm giảm' : 'Số tiền giảm'} *
                        </Typography>
                        <TextField
                            fullWidth size="small" type="number" sx={{ mt: 0.5 }}
                            value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Đơn hàng tối thiểu</Typography>
                        <TextField
                            fullWidth size="small" type="number" placeholder="0" sx={{ mt: 0.5 }}
                            value={form.minOrderValue || ''} onChange={e => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                            InputProps={{ endAdornment: <Typography variant="caption">VND</Typography> }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Giảm tối đa</Typography>
                        <TextField
                            fullWidth size="small" type="number" placeholder="Không giới hạn" sx={{ mt: 0.5 }}
                            value={form.maxDiscountAmount || ''} onChange={e => setForm({ ...form, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })}
                            InputProps={{ endAdornment: <Typography variant="caption">VND</Typography> }}
                            disabled={form.discountType !== 'PERCENTAGE'}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Giới hạn số lần sử dụng</Typography>
                        <TextField
                            fullWidth size="small" type="number" placeholder="Không giới hạn" sx={{ mt: 0.5 }}
                            value={form.maxUsage || ''} onChange={e => setForm({ ...form, maxUsage: e.target.value ? Number(e.target.value) : undefined })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Ngày bắt đầu</Typography>
                        <TextField
                            fullWidth size="small" type="date" sx={{ mt: 0.5 }} InputLabelProps={{ shrink: true }}
                            value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Ngày kết thúc</Typography>
                        <TextField
                            fullWidth size="small" type="date" sx={{ mt: 0.5 }} InputLabelProps={{ shrink: true }}
                            value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b' }}>Hủy</Button>
                <Button
                    variant="contained" onClick={handleSave} disabled={loading}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 4 }}
                >
                    {loading ? <CircularProgress size={20} /> : editing ? 'Cập nhật' : 'Lưu lại'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
