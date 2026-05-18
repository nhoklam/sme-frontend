import React, { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, IconButton, Chip, Select,
    MenuItem, FormControl, InputAdornment, Dialog, DialogTitle,
    DialogContent, DialogActions, Grid, CircularProgress, Tooltip, Switch
} from '@mui/material';
import {
    Search, Add, Edit, PersonOff, PersonAdd, Close,
    Phone, FilterList, Warehouse, Person
} from '@mui/icons-material';
import userService from '../../../../../services/userService';
import warehouseService from '../../../../../services/warehouseService';
import type { UserResponse, Warehouse as WarehouseType } from '../../../../../types';
import toast from 'react-hot-toast';

const getRoleLabel = (role: string) => {
    switch (role) {
        case 'ROLE_ADMIN': return 'Quản trị viên';
        case 'ROLE_MANAGER': return 'Quản lý';
        case 'ROLE_CASHIER': return 'Thu ngân';
        default: return role;
    }
};

const getRoleColor = (role: string) => {
    switch (role) {
        case 'ROLE_ADMIN': return { bg: '#f3e8ff', color: '#7c3aed', border: '#e9d5ff' };
        case 'ROLE_MANAGER': return { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' };
        default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
};

export default function UsersTab() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ keyword: '', role: '', warehouseId: '' });
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<UserResponse | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        username: '', password: '', fullName: '', email: '', phone: '',
        role: 'ROLE_CASHIER', warehouseId: '',
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const cleanFilters: any = {};
            if (filters.keyword) cleanFilters.keyword = filters.keyword;
            if (filters.role) cleanFilters.role = filters.role;
            if (filters.warehouseId) cleanFilters.warehouseId = filters.warehouseId;
            const [u, w] = await Promise.all([
                userService.getAll(cleanFilters),
                warehouseService.getAll(),
            ]);
            setUsers(u);
            setWarehouses(w);
        } catch { toast.error('Lỗi tải dữ liệu'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filters.role, filters.warehouseId]);

    // Debounce keyword search
    useEffect(() => {
        const t = setTimeout(() => loadData(), 400);
        return () => clearTimeout(t);
    }, [filters.keyword]);

    const handleOpenModal = (user?: UserResponse) => {
        if (user) {
            setEditing(user);
            setForm({
                username: user.username, password: '', fullName: user.fullName,
                email: user.email ?? '', phone: user.phone ?? '',
                role: user.role, warehouseId: user.warehouseId ?? '',
            });
        } else {
            setEditing(null);
            setForm({ username: '', password: '', fullName: '', email: '', phone: '', role: 'ROLE_CASHIER', warehouseId: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = { ...form };
            if (!payload.warehouseId) payload.warehouseId = undefined;
            if (editing && !payload.password) delete payload.password;
            if (editing) {
                await userService.update(editing.id, payload);
                toast.success('Cập nhật tài khoản thành công');
            } else {
                await userService.create(payload);
                toast.success('Tạo tài khoản thành công');
            }
            setShowModal(false);
            setEditing(null);
            loadData();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Lỗi khi lưu tài khoản');
        } finally { setSaving(false); }
    };

    const handleToggle = async (user: UserResponse) => {
        const action = user.isActive ? 'khóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản "${user.fullName}"?`)) return;
        try {
            if (user.isActive) await userService.deactivate(user.id);
            else await userService.activate(user.id);
            toast.success(`Đã ${action} tài khoản`);
            loadData();
        } catch { toast.error('Lỗi cập nhật trạng thái'); }
    };

    return (
        <Box>
            {/* Toolbar */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" placeholder="Tìm tên, username, email..."
                    value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                    sx={{ flex: 1, minWidth: 220 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select value={filters.role} onChange={e => setFilters(p => ({ ...p, role: e.target.value }))} displayEmpty>
                        <MenuItem value="">Mọi vai trò</MenuItem>
                        <MenuItem value="ROLE_ADMIN">Quản trị viên</MenuItem>
                        <MenuItem value="ROLE_MANAGER">Quản lý</MenuItem>
                        <MenuItem value="ROLE_CASHIER">Thu ngân</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={filters.warehouseId} onChange={e => setFilters(p => ({ ...p, warehouseId: e.target.value }))} displayEmpty>
                        <MenuItem value="">Mọi chi nhánh</MenuItem>
                        {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                    </Select>
                </FormControl>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    Thêm nhân sự
                </Button>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11, letterSpacing: 0.5 }}>NHÂN SỰ</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>TÀI KHOẢN</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>LIÊN HỆ</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="center">PHÂN QUYỀN</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>NƠI LÀM VIỆC</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="center">TRẠNG THÁI</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="right">THAO TÁC</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress size={32} /></TableCell></TableRow>
                            ) : users.length === 0 ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8, color: '#94a3b8' }}>Không có nhân sự nào</TableCell></TableRow>
                            ) : users.map(u => {
                                const rc = getRoleColor(u.role);
                                return (
                                    <TableRow key={u.id} hover sx={{ opacity: u.isActive ? 1 : 0.6 }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1d4ed8', fontSize: 14, border: '1px solid #dbeafe' }}>
                                                    {u.fullName.charAt(0).toUpperCase()}
                                                </Box>
                                                <Box>
                                                    <Typography fontSize={13} fontWeight={700} color="#1e293b">{u.fullName}</Typography>
                                                    {u.email && <Typography fontSize={10} color="#94a3b8" fontWeight={600}>{u.email}</Typography>}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={700} fontFamily="monospace" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.25, borderRadius: 1, display: 'inline-block' }}>{u.username}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {u.phone ? <Typography fontSize={12} color="#475569" fontFamily="monospace">{u.phone}</Typography> : <Typography color="#cbd5e1">—</Typography>}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={getRoleLabel(u.role)} size="small" sx={{ bgcolor: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontWeight: 700, fontSize: 10, height: 22 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={600} color="#475569">{u.warehouseName ?? 'Toàn hệ thống'}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={u.isActive ? 'Hoạt động' : 'Đã khóa'} size="small"
                                                sx={{ bgcolor: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: 10, height: 22 }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                <Tooltip title="Chỉnh sửa"><IconButton size="small" onClick={() => handleOpenModal(u)} sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                                <Tooltip title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt'}>
                                                    <IconButton size="small" onClick={() => handleToggle(u)} sx={{ color: u.isActive ? '#ef4444' : '#22c55e', '&:hover': { bgcolor: u.isActive ? '#fef2f2' : '#f0fdf4' } }}>
                                                        {u.isActive ? <PersonOff sx={{ fontSize: 16 }} /> : <PersonAdd sx={{ fontSize: 16 }} />}
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modal */}
            <Dialog open={showModal} onClose={() => { setShowModal(false); setEditing(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {editing ? 'Cập nhật hồ sơ nhân sự' : 'Tạo tài khoản mới'}
                    <IconButton onClick={() => { setShowModal(false); setEditing(null); }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Tên đăng nhập *</Typography>
                            <TextField fullWidth size="small" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} disabled={!!editing} placeholder="username" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Mật khẩu {!editing && '*'}</Typography>
                            <TextField fullWidth size="small" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder={editing ? 'Bỏ trống giữ nguyên' : 'Tối thiểu 8 ký tự'} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Họ và tên *</Typography>
                            <TextField fullWidth size="small" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Nguyễn Văn A" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Email</Typography>
                            <TextField fullWidth size="small" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Số điện thoại</Typography>
                            <TextField fullWidth size="small" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#1d4ed8" mb={0.5} display="block">Phân quyền *</Typography>
                            <FormControl fullWidth size="small">
                                <Select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value, warehouseId: e.target.value === 'ROLE_ADMIN' ? '' : p.warehouseId }))}>
                                    <MenuItem value="ROLE_ADMIN">Quản trị viên (Admin)</MenuItem>
                                    <MenuItem value="ROLE_MANAGER">Quản lý chi nhánh</MenuItem>
                                    <MenuItem value="ROLE_CASHIER">Nhân viên Thu ngân</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#1d4ed8" mb={0.5} display="block">Nơi làm việc</Typography>
                            <FormControl fullWidth size="small" disabled={form.role === 'ROLE_ADMIN'}>
                                <Select value={form.warehouseId} onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))} displayEmpty>
                                    <MenuItem value="">{form.role === 'ROLE_ADMIN' ? 'Toàn hệ thống' : '-- Chọn chi nhánh --'}</MenuItem>
                                    {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => { setShowModal(false); setEditing(null); }} sx={{ textTransform: 'none', fontWeight: 700 }}>Hủy bỏ</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !form.username || (!editing && !form.password) || !form.fullName}
                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1d4ed8', px: 4, '&:hover': { bgcolor: '#1e40af' } }}>
                        {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editing ? 'Lưu thay đổi' : 'Tạo tài khoản')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
