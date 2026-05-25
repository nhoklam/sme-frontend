import React, { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Button, IconButton, Chip, Select,
    MenuItem, FormControl, Dialog, DialogTitle,
    DialogContent, DialogActions, Grid, CircularProgress, Tooltip
} from '@mui/material';
import { Add, Edit, Close, Block, CheckCircle, Phone, Person } from '@mui/icons-material';
import warehouseService from '../../../../../services/warehouseService';
import userService from '../../../../../services/userService';
import type { Warehouse, UserResponse } from '../../../../../types';
import toast from 'react-hot-toast';

export default function WarehousesTab() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [managers, setManagers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Warehouse | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', code: '', warehouseType: 'BRANCH' as 'MAIN' | 'BRANCH' | 'DROPSHIP', address: '', phone: '', managerId: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const [w, m] = await Promise.all([
                warehouseService.getAllPaged({ size: 100 }).then(r => {
                    if (Array.isArray(r)) return r;
                    if ((r as any)?.content) return (r as any).content;
                    return [];
                }),
                userService.getAll({ role: 'ROLE_MANAGER' }),
            ]);
            setWarehouses(w);
            setManagers(m);
        } catch { toast.error('Lỗi tải dữ liệu chi nhánh'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const managerMap = useMemo(() => {
        const m = new Map<string, string>();
        managers.forEach(mg => m.set(mg.id, mg.fullName));
        return m;
    }, [managers]);

    const handleOpenModal = (w?: Warehouse) => {
        if (w) {
            setEditing(w);
            setForm({
                name: w.name,
                code: w.code ?? '',
                warehouseType: w.warehouseType ?? 'BRANCH',
                address: w.address ?? '',
                phone: w.phone ?? '',
                managerId: (w as any).managerId ?? ''
            });
        } else {
            setEditing(null);
            setForm({
                name: '',
                code: '',
                warehouseType: 'BRANCH',
                address: '',
                phone: '',
                managerId: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = { ...form };
            if (!payload.code) delete payload.code; // Nếu trống để backend tự sinh
            if (!payload.managerId) payload.managerId = undefined;
            if (editing) {
                await warehouseService.update(editing.id!, payload);
                toast.success('Cập nhật chi nhánh thành công');
            } else {
                await warehouseService.create(payload);
                toast.success('Thêm chi nhánh thành công');
            }
            setShowModal(false);
            setEditing(null);
            loadData();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Lỗi khi lưu chi nhánh');
        } finally { setSaving(false); }
    };

    const handleToggle = async (w: Warehouse) => {
        const msg = w.isActive ? 'Ngừng hoạt động chi nhánh này?' : 'Khôi phục chi nhánh này?';
        if (!window.confirm(msg)) return;
        try {
            await warehouseService.toggleActive(w.id!, !w.isActive);
            toast.success(w.isActive ? 'Đã ngừng hoạt động' : 'Đã khôi phục');
            loadData();
        } catch { toast.error('Lỗi cập nhật trạng thái'); }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    Thêm chi nhánh
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>MÃ KHO/CN</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>TÊN CHI NHÁNH / KHO</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="center">PHÂN LOẠI</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>ĐỊA CHỈ & LIÊN HỆ</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="center">QUẢN LÝ</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="center">TRẠNG THÁI</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="right">THAO TÁC</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress size={32} /></TableCell></TableRow>
                            ) : warehouses.length === 0 ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8, color: '#94a3b8' }}>Chưa có chi nhánh nào</TableCell></TableRow>
                            ) : warehouses.map(w => {
                                const isMain = w.warehouseType === 'MAIN';
                                const isDropship = w.warehouseType === 'DROPSHIP';
                                return (
                                    <TableRow key={w.id} hover sx={{ opacity: w.isActive ? 1 : 0.6 }}>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={700} fontFamily="monospace" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.25, borderRadius: 1, display: 'inline-block', color: '#475569' }}>
                                                {w.code || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={14} fontWeight={700} color="#1e293b">{w.name}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={isMain ? 'Kho tổng (Kho chung)' : isDropship ? 'Kho ký gửi' : 'Chi nhánh'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: 10,
                                                    height: 22,
                                                    bgcolor: isMain ? '#f5f3ff' : isDropship ? '#fff7ed' : '#eff6ff',
                                                    color: isMain ? '#7c3aed' : isDropship ? '#ea580c' : '#2563eb',
                                                    border: '1px solid',
                                                    borderColor: isMain ? '#ddd6fe' : isDropship ? '#ffedd5' : '#dbeafe'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={500} color="#475569" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {w.address || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                                            </Typography>
                                            {w.phone && <Typography fontSize={11} color="#94a3b8" fontFamily="monospace" mt={0.25}>{w.phone}</Typography>}
                                        </TableCell>
                                        <TableCell align="center">
                                            {(w as any).managerId ? (
                                                <Chip icon={<Person sx={{ fontSize: 14 }} />} label={managerMap.get((w as any).managerId) ?? 'N/A'} size="small"
                                                    sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: 10, height: 24 }} />
                                            ) : (
                                                <Typography fontSize={11} color="#94a3b8" fontStyle="italic">Chưa chỉ định</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={w.isActive ? 'Hoạt động' : 'Đóng cửa'} size="small"
                                                sx={{ bgcolor: w.isActive ? '#dcfce7' : '#fee2e2', color: w.isActive ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: 10, height: 22 }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                <Tooltip title="Chỉnh sửa"><IconButton size="small" onClick={() => handleOpenModal(w)} sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                                <Tooltip title={w.isActive ? 'Vô hiệu hóa' : 'Kích hoạt lại'}>
                                                    <IconButton size="small" onClick={() => handleToggle(w)} sx={{ color: w.isActive ? '#ef4444' : '#22c55e', '&:hover': { bgcolor: w.isActive ? '#fef2f2' : '#f0fdf4' } }}>
                                                        {w.isActive ? <Block sx={{ fontSize: 16 }} /> : <CheckCircle sx={{ fontSize: 16 }} />}
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
                    {editing ? 'Sửa thông tin chi nhánh' : 'Khai báo chi nhánh mới'}
                    <IconButton onClick={() => { setShowModal(false); setEditing(null); }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Tên chi nhánh / Kho *</Typography>
                            <TextField fullWidth size="small" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Cửa hàng Q1 hoặc Kho tổng" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Mã chi nhánh / Kho (Code)</Typography>
                            <TextField fullWidth size="small" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="VD: CN001, KHOTONG (để trống tự sinh)" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#1d4ed8" mb={0.5} display="block">Phân loại *</Typography>
                            <FormControl fullWidth size="small">
                                <Select value={form.warehouseType} onChange={e => setForm(p => ({ ...p, warehouseType: e.target.value as any }))}>
                                    <MenuItem value="BRANCH">Chi nhánh bán hàng</MenuItem>
                                    <MenuItem value="MAIN">Kho tổng (Kho chung)</MenuItem>
                                    <MenuItem value="DROPSHIP">Kho ký gửi</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Số điện thoại</Typography>
                            <TextField fullWidth size="small" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Quản lý trực tiếp</Typography>
                            <FormControl fullWidth size="small">
                                <Select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))} displayEmpty>
                                    <MenuItem value="">-- Chưa bổ nhiệm --</MenuItem>
                                    {managers.map(m => <MenuItem key={m.id} value={m.id}>{m.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.5} display="block">Địa chỉ</Typography>
                            <TextField fullWidth size="small" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Số nhà, tên đường, quận/huyện..." />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => { setShowModal(false); setEditing(null); }} sx={{ textTransform: 'none', fontWeight: 700 }}>Hủy bỏ</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}
                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1d4ed8', px: 4, '&:hover': { bgcolor: '#1e40af' } }}>
                        {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editing ? 'Lưu thay đổi' : 'Mở chi nhánh')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
