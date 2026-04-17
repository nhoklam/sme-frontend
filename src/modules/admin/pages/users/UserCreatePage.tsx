// src/modules/admin/pages/users/UserCreatePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Grid, TextField,
    Select, MenuItem, FormControl, Switch, Alert,
    InputAdornment, IconButton, Divider,
} from '@mui/material';
import { ArrowBack, Save, Visibility, VisibilityOff, Person, Lock, Email, Phone } from '@mui/icons-material';
import userService from '../../../../services/userService';
import warehouseService from '../../../../services/warehouseService';
import { CreateUserRequest, Warehouse, UserRole } from '../../../../types';

const ROLE_OPTIONS: { value: UserRole; label: string; sub: string; color: string }[] = [
    { value: 'ROLE_ADMIN', label: 'Admin', sub: 'Toàn quyền hệ thống', color: '#7b1fa2' },
    { value: 'ROLE_MANAGER', label: 'Quản lý', sub: 'Quản lý chi nhánh', color: '#1976d2' },
    { value: 'ROLE_CASHIER', label: 'Thu ngân', sub: 'Bán hàng POS', color: '#2e7d32' },
];

interface FormState {
    username: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    warehouseId: string;
    isActive: boolean;
}

interface FormErrors {
    username?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    role?: string;
    warehouseId?: string;
}

const INITIAL: FormState = {
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'ROLE_CASHIER',
    warehouseId: '',
    isActive: true,
};

const UserCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState<FormState>(INITIAL);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const set = (field: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
            const val = (e as React.ChangeEvent<HTMLInputElement>).target?.value ?? (e as any);
            setForm(f => ({ ...f, [field]: val }));
            if (errors[field as keyof FormErrors]) setErrors(er => ({ ...er, [field]: '' }));
        };

    const validate = (): FormErrors => {
        const errs: FormErrors = {};
        if (!form.username.trim() || form.username.length < 4) errs.username = 'Tên đăng nhập tối thiểu 4 ký tự';
        if (!form.fullName.trim()) errs.fullName = 'Họ tên không được để trống';
        if (!form.password || form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự';
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
        if (!form.role) errs.role = 'Vui lòng chọn vai trò';
        if (form.role !== 'ROLE_ADMIN' && !form.warehouseId) errs.warehouseId = 'Vui lòng chọn chi nhánh';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        setErrorMsg('');
        try {
            const payload: CreateUserRequest = {
                username: form.username.trim(),
                password: form.password,
                fullName: form.fullName.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                role: form.role,
                warehouseId: form.role !== 'ROLE_ADMIN' ? form.warehouseId : undefined,
            };
            await userService.create(payload);
            setSaved(true);
            setTimeout(() => navigate('/admin/users'), 1200);
        } catch (e: any) {
            setErrorMsg(e.response?.data?.message || 'Tạo tài khoản thất bại. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const selectedRole = ROLE_OPTIONS.find(r => r.value === form.role);
    const needWarehouse = form.role !== 'ROLE_ADMIN';

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton size="small" onClick={() => navigate('/admin/users')}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                        <ArrowBack sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Box>
                        <Typography variant="caption" color="#aaa" fontSize={11}>
                            Nhân viên / <strong style={{ color: '#555' }}>Tạo tài khoản</strong>
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.25}>
                            Tạo tài khoản mới
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="outlined" onClick={() => navigate('/admin/users')}
                        sx={{ textTransform: 'none', borderColor: '#bbb', color: '#444' }}>
                        Hủy
                    </Button>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}
                        sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#1565c0' } }}>
                        {saving ? 'Đang lưu...' : 'Tạo tài khoản'}
                    </Button>
                </Box>
            </Box>

            {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>✅ Tạo tài khoản thành công!</Alert>}
            {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

            {/* Grid v2 — dùng size thay vì item + xs/md */}
            <Grid container spacing={2.5}>
                {/* LEFT */}
                <Grid size={{ xs: 12, md: 8 }}>

                    {/* Thông tin cơ bản */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', mb: 2.5, overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f5f5f5', bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e">Thông tin cơ bản</Typography>
                        </Box>
                        <Box sx={{ p: 2.5 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                        Họ và tên <span style={{ color: '#d32f2f' }}>*</span>
                                    </Typography>
                                    <TextField fullWidth size="small" placeholder="Nguyễn Văn A"
                                        value={form.fullName} onChange={set('fullName')}
                                        error={!!errors.fullName} helperText={errors.fullName}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18, color: '#bbb' }} /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                        Tên đăng nhập <span style={{ color: '#d32f2f' }}>*</span>
                                    </Typography>
                                    <TextField fullWidth size="small" placeholder="username (tối thiểu 4 ký tự)"
                                        value={form.username} onChange={set('username')}
                                        error={!!errors.username} helperText={errors.username}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Email</Typography>
                                    <TextField fullWidth size="small" type="email" placeholder="email@company.vn"
                                        value={form.email} onChange={set('email')}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#bbb' }} /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Số điện thoại</Typography>
                                    <TextField fullWidth size="small" placeholder="09xxxxxxxx"
                                        value={form.phone} onChange={set('phone')}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: 18, color: '#bbb' }} /></InputAdornment> }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>

                    {/* Mật khẩu */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', mb: 2.5, overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f5f5f5', bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e">Mật khẩu</Typography>
                        </Box>
                        <Box sx={{ p: 2.5 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                        Mật khẩu <span style={{ color: '#d32f2f' }}>*</span>
                                    </Typography>
                                    <TextField fullWidth size="small"
                                        type={showPwd ? 'text' : 'password'}
                                        placeholder="Tối thiểu 8 ký tự"
                                        value={form.password} onChange={set('password')}
                                        error={!!errors.password} helperText={errors.password}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#bbb' }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowPwd(!showPwd)}>
                                                    {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                        Xác nhận mật khẩu <span style={{ color: '#d32f2f' }}>*</span>
                                    </Typography>
                                    <TextField fullWidth size="small"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Nhập lại mật khẩu"
                                        value={form.confirmPassword} onChange={set('confirmPassword')}
                                        error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#bbb' }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)}>
                                                    {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>

                    {/* Phân quyền */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f5f5f5', bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e">Phân quyền & Chi nhánh</Typography>
                        </Box>
                        <Box sx={{ p: 2.5 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                        Vai trò <span style={{ color: '#d32f2f' }}>*</span>
                                    </Typography>
                                    <FormControl fullWidth size="small" error={!!errors.role}>
                                        <Select value={form.role}
                                            onChange={(e) => setForm(f => ({ ...f, role: e.target.value as UserRole, warehouseId: '' }))}>
                                            {ROLE_OPTIONS.map(r => (
                                                <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13 }}>
                                                    <Box>
                                                        <Typography fontSize={13} fontWeight={600}>{r.label}</Typography>
                                                        <Typography fontSize={11} color="text.secondary">{r.sub}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.role && <Typography variant="caption" color="error" ml={1.75}>{errors.role}</Typography>}
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                                        Chi nhánh {needWarehouse && <span style={{ color: '#d32f2f' }}>*</span>}
                                    </Typography>
                                    <FormControl fullWidth size="small" error={!!errors.warehouseId} disabled={!needWarehouse}>
                                        <Select value={form.warehouseId}
                                            onChange={(e) => setForm(f => ({ ...f, warehouseId: e.target.value }))}
                                            displayEmpty>
                                            <MenuItem value="">{needWarehouse ? 'Chọn chi nhánh' : 'Tất cả chi nhánh (Admin)'}</MenuItem>
                                            {warehouses.filter(w => w.isActive).map(w => (
                                                <MenuItem key={w.id} value={w.id} sx={{ fontSize: 13 }}>{w.name}</MenuItem>
                                            ))}
                                        </Select>
                                        {errors.warehouseId && <Typography variant="caption" color="error" ml={1.75}>{errors.warehouseId}</Typography>}
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>

                {/* RIGHT */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Trạng thái */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Trạng thái</Typography>
                        <Box sx={{
                            p: 1.5, borderRadius: 1.5,
                            bgcolor: form.isActive ? '#e8f5e9' : '#f5f5f5',
                            border: `1px solid ${form.isActive ? '#c8e6c9' : '#e0e0e0'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <Box>
                                <Typography variant="body2" fontWeight={700} color={form.isActive ? '#2e7d32' : '#888'}>
                                    {form.isActive ? 'Kích hoạt ngay' : 'Chưa kích hoạt'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {form.isActive ? 'Tài khoản hoạt động sau khi tạo' : 'Admin có thể kích hoạt sau'}
                                </Typography>
                            </Box>
                            <Switch
                                checked={form.isActive}
                                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' } }}
                            />
                        </Box>
                    </Paper>

                    {/* Tóm tắt */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Tóm tắt</Typography>
                        {[
                            { label: 'Họ tên', value: form.fullName || '—' },
                            { label: 'Username', value: form.username || '—' },
                            { label: 'Vai trò', value: selectedRole?.label || '—' },
                            { label: 'Chi nhánh', value: warehouses.find(w => w.id === form.warehouseId)?.name || (needWarehouse ? '—' : 'Tất cả') },
                        ].map(row => (
                            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                                <Typography variant="caption" fontWeight={600} color="#333"
                                    sx={{ maxWidth: 150, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {row.value}
                                </Typography>
                            </Box>
                        ))}
                        <Divider sx={{ my: 1.5 }} />
                        <Button fullWidth variant="contained" startIcon={<Save />}
                            onClick={handleSave} disabled={saving}
                            sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1565c0' } }}>
                            {saving ? 'Đang lưu...' : 'Tạo tài khoản'}
                        </Button>
                    </Paper>

                    {/* Mô tả quyền hạn */}
                    {selectedRole && (
                        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${selectedRole.color}30`, p: 2, bgcolor: `${selectedRole.color}08` }}>
                            <Typography variant="caption" fontWeight={700} color={selectedRole.color} display="block" mb={1}>
                                Quyền hạn: {selectedRole.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {form.role === 'ROLE_ADMIN' && <>• Toàn quyền tất cả chức năng<br />• Tạo/xóa tài khoản nhân viên<br />• Xem nhật ký hệ thống<br />• Quản lý tất cả chi nhánh</>}
                                {form.role === 'ROLE_MANAGER' && <>• Quản lý chi nhánh được gán<br />• Duyệt phiếu nhập kho, chuyển kho<br />• Xem báo cáo chi nhánh<br />• Không tạo tài khoản mới</>}
                                {form.role === 'ROLE_CASHIER' && <>• Bán hàng tại POS<br />• Xem sản phẩm & tồn kho<br />• Mở/đóng ca làm việc<br />• Không truy cập báo cáo</>}
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default UserCreatePage;