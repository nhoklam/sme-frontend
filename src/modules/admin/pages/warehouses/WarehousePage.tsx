import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert
} from '@mui/material';
import {
    Add, Edit, CheckCircle, Block, Storefront, Close, Save
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import toast from 'react-hot-toast';

interface Warehouse {
    id: string;
    code: string;
    name: string;
    provinceCode?: string;
    address?: string;
    phone?: string;
    managerId?: string;
    managerName?: string;
    isActive: boolean;
}

interface User {
    id: string;
    fullName: string;
    role: string;
}

interface WarehouseFormData {
    code: string;
    name: string;
    provinceCode: string;
    address: string;
    phone: string;
    managerId: string;
}

const initialForm: WarehouseFormData = { code: '', name: '', provinceCode: '00', address: '', phone: '', managerId: '' };

const WarehousePage: React.FC = () => {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
    const [form, setForm] = useState<WarehouseFormData>(initialForm);
    const [saving, setSaving] = useState(false);
    const [managers, setManagers] = useState<User[]>([]);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [res, usersRes] = await Promise.all([
                axiosInstance.get('/warehouses'),
                axiosInstance.get('/auth/users')
            ]);
            setWarehouses(res.data.data || []);
            // Filter users who can be managers (ADMIN or MANAGER)
            const eligibleManagers = (usersRes.data.data || []).filter((u: any) => 
                u.role === 'ROLE_ADMIN' || u.role === 'ROLE_MANAGER'
            );
            setManagers(eligibleManagers);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Lỗi tải danh sách kho');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditTarget(null);
        setForm(initialForm);
        setDialogOpen(true);
    };

    const openEdit = (w: Warehouse) => {
        setEditTarget(w);
        setForm({ code: w.code, name: w.name, provinceCode: w.provinceCode || '00', address: w.address || '', phone: w.phone || '', managerId: w.managerId || '' });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.code.trim()) {
            toast.error('Mã kho và Tên kho là bắt buộc');
            return;
        }
        setSaving(true);
        try {
            const payload: any = { ...form };
            if (editTarget) {
                payload.hasManagerId = true; // Tell backend to update manager
                if (!payload.managerId) payload.managerId = null;
                await axiosInstance.put(`/warehouses/${editTarget.id}`, payload);
                toast.success('Cập nhật kho thành công');
            } else {
                // Remove managerId for creation if not supported by backend creation yet
                delete payload.managerId;
                await axiosInstance.post('/warehouses', payload);
                toast.success('Tạo kho thành công');
            }
            setDialogOpen(false);
            load();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Lỗi lưu kho');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (w: Warehouse) => {
        try {
            const action = w.isActive ? 'deactivate' : 'activate';
            await axiosInstance.patch(`/warehouses/${w.id}/${action}`);
            toast.success(w.isActive ? 'Đã vô hiệu hóa kho' : 'Đã kích hoạt kho');
            load();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Lỗi thay đổi trạng thái');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Storefront sx={{ color: '#1976d2', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="#1e293b">
                            Quản lý Kho / Chi nhánh
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {warehouses.length} kho trong hệ thống
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={openCreate}
                    sx={{ textTransform: 'none', borderRadius: 2, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                >
                    Thêm kho mới
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                {['Mã kho', 'Tên kho', 'Địa chỉ', 'Điện thoại', 'Trạng thái', 'Thao tác'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#64748b', py: 1.5 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {warehouses.map(w => (
                                <TableRow key={w.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Chip label={w.code} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 11 }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight={600} fontSize={13}>{w.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontSize={13} color="text.secondary">{w.address || '—'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontSize={13}>{w.phone || '—'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={w.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                            size="small"
                                            color={w.isActive ? 'success' : 'default'}
                                            sx={{ fontWeight: 600, fontSize: 11 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Chỉnh sửa">
                                                <IconButton size="small" onClick={() => openEdit(w)} sx={{ color: '#1976d2' }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={w.isActive ? 'Vô hiệu hóa' : 'Kích hoạt lại'}>
                                                <IconButton size="small" onClick={() => handleToggleActive(w)} sx={{ color: w.isActive ? '#ef4444' : '#22c55e' }}>
                                                    {w.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {warehouses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                                        <Storefront sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                                        <Typography color="text.secondary">Chưa có kho nào trong hệ thống</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Typography fontWeight={700}>{editTarget ? 'Chỉnh sửa kho' : 'Thêm kho mới'}</Typography>
                    <IconButton size="small" onClick={() => setDialogOpen(false)}><Close fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Mã kho *"
                            size="small"
                            value={form.code}
                            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                            disabled={!!editTarget}
                            helperText={editTarget ? 'Không thể thay đổi mã kho' : 'Ví dụ: KHO-01'}
                        />
                        <TextField
                            label="Tên kho *"
                            size="small"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <TextField
                            label="Địa chỉ"
                            size="small"
                            multiline
                            rows={2}
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        />
                        <TextField
                            label="Số điện thoại"
                            size="small"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        />
                        {editTarget && (
                            <TextField
                                select
                                label="Quản lý chi nhánh"
                                size="small"
                                value={form.managerId}
                                onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                                SelectProps={{ native: true }}
                                helperText="Chỉ gán được cho người dùng có quyền Quản lý hoặc Admin"
                            >
                                <option value="">-- Không có --</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.fullName} ({m.role === 'ROLE_ADMIN' ? 'Admin' : 'Quản lý'})</option>
                                ))}
                            </TextField>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Huỷ</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={14} /> : <Save />}
                        sx={{ textTransform: 'none', boxShadow: 'none' }}
                    >
                        {editTarget ? 'Lưu thay đổi' : 'Tạo kho'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WarehousePage;
