import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, Box, Typography,
    IconButton, Grid, InputAdornment, FormControl, CircularProgress, Switch
} from '@mui/material';
import {
    Close, PersonAdd, Shield, Lock,
    Email, Phone, Person, Storefront, PointOfSale,
    Visibility, VisibilityOff, Edit
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import userService from '../../../../services/userService';
import warehouseService from '../../../../services/warehouseService';
import { useAuth } from '../../../../store/hooks/useAuth';

import { UserResponse } from '../../../../types';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    userToEdit?: UserResponse | null;
}

export default function UserCreateModal({ open, onClose, onSaved, userToEdit }: Props) {
    const { user, isAdmin } = useAuth();
    const [showPwd, setShowPwd] = useState(false);

    const [form, setForm] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        role: isAdmin ? 'ROLE_MANAGER' : 'ROLE_CASHIER',
        warehouseId: isAdmin ? '' : (user?.warehouseId || ''),
        posSettings_autoPrint: false,
    });

    // Reset/Set form khi mở modal hoặc thay đổi userToEdit
    useEffect(() => {
        if (open) {
            if (userToEdit) {
                let autoPrint = false;
                try {
                    if (userToEdit.posSettings) {
                        const parsed = JSON.parse(userToEdit.posSettings);
                        autoPrint = !!parsed.autoPrint;
                    }
                } catch (e) {
                    console.error(e);
                }
                setForm({
                    username: userToEdit.username,
                    password: '',
                    fullName: userToEdit.fullName,
                    email: userToEdit.email || '',
                    phone: userToEdit.phone || '',
                    role: userToEdit.role,
                    warehouseId: userToEdit.warehouseId || '',
                    posSettings_autoPrint: autoPrint,
                });
            } else {
                setForm({
                    username: '',
                    password: '',
                    fullName: '',
                    email: '',
                    phone: '',
                    role: isAdmin ? 'ROLE_MANAGER' : 'ROLE_CASHIER',
                    warehouseId: isAdmin ? '' : (user?.warehouseId || ''),
                    posSettings_autoPrint: false,
                });
            }
            setShowPwd(false);
        }
    }, [open, userToEdit, isAdmin, user?.warehouseId]);

    // Tải danh sách chi nhánh (chỉ tải nếu là Admin)
    const { data: warehouses } = useQuery({
        queryKey: ['warehouses-employee'],
        queryFn: () => warehouseService.getAll().then((r: any) => r.data || r),
        enabled: isAdmin && open,
    });

    const createMut = useMutation({
        mutationFn: () => {
            const payload: any = {
                ...form,
                posSettings: JSON.stringify({ autoPrint: form.posSettings_autoPrint })
            };
            if (userToEdit) {
                if (!payload.password) {
                    delete payload.password;
                }
                return userService.update(userToEdit.id, payload);
            }
            return userService.create(payload);
        },
        onSuccess: () => {
            toast.success(userToEdit ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản nhân viên thành công!');
            onSaved();
            onClose();
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi khi lưu thông tin'),
    });

    const isValid = form.username.length >= 4 &&
        (userToEdit ? (form.password === '' || form.password.length >= 8) : form.password.length >= 8) &&
        form.fullName &&
        form.role &&
        form.warehouseId;

    const handleChange = (field: string) => (e: any) => {
        setForm({ ...form, [field]: e.target.value });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            {/* Header */}
            <DialogTitle sx={{ m: 0, p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1a237e' }}>
                        <PersonAdd color="primary" /> {userToEdit ? 'Chỉnh sửa tài khoản nhân viên' : 'Tạo tài khoản nhân viên'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {userToEdit ? 'Cập nhật thông tin tài khoản nhân sự' : 'Cấp quyền truy cập hệ thống cho nhân viên mới'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'grey.500' }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            {/* Body */}
            <DialogContent sx={{ p: 4, bgcolor: '#fafafa' }} dividers>
                <Grid container spacing={4}>

                    {/* Cột 1: Đăng nhập */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#424242', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                            <Lock fontSize="small" color="action" /> Thông tin đăng nhập
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                fullWidth size="small" label="Tên đăng nhập *"
                                placeholder="VD: nguyenvan_a"
                                value={form.username} onChange={handleChange('username')}
                                disabled={!!userToEdit}
                                error={!userToEdit && form.username !== '' && form.username.length < 4}
                                helperText={!userToEdit && form.username !== '' && form.username.length < 4 ? 'Tên đăng nhập phải chứa tối thiểu 4 ký tự' : ''}
                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                fullWidth size="small" label={userToEdit ? 'Mật khẩu mới' : 'Mật khẩu *'} type={showPwd ? 'text' : 'password'}
                                placeholder={userToEdit ? 'Để trống nếu không đổi mật khẩu' : 'Tối thiểu 8 ký tự'}
                                value={form.password} onChange={handleChange('password')}
                                error={form.password !== '' && form.password.length < 8}
                                helperText={form.password !== '' && form.password.length < 8 ? 'Mật khẩu phải chứa tối thiểu 8 ký tự' : ''}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small">
                                                {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Box>
                    </Grid>

                    {/* Cột 2: Phân quyền */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#424242', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                            <Shield fontSize="small" color="action" /> Vai trò & Quyền hạn
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={form.role} onChange={handleChange('role')}
                                    sx={{ bgcolor: '#fff', borderRadius: 2 }}
                                >
                                    {isAdmin && <MenuItem value="ROLE_MANAGER">Quản lý chi nhánh</MenuItem>}
                                    <MenuItem value="ROLE_CASHIER">Thu ngân (POS)</MenuItem>
                                </Select>
                            </FormControl>

                            {isAdmin ? (
                                <FormControl fullWidth size="small">
                                    <Select
                                        displayEmpty
                                        value={form.warehouseId} onChange={handleChange('warehouseId')}
                                        sx={{ bgcolor: '#fff', borderRadius: 2 }}
                                    >
                                        <MenuItem value="" disabled>-- Chọn chi nhánh làm việc --</MenuItem>
                                        {warehouses?.map((w: any) => (
                                            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #bbdefb', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Storefront fontSize="small" color="primary" />
                                    <Typography variant="body2" fontWeight="bold" color="primary.dark">
                                        {user?.warehouseName || 'Chi nhánh của bạn'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Hàng dưới: Thông tin cá nhân */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1, color: '#424242', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                            <Person fontSize="small" color="action" /> Thông tin cá nhân
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth size="small" label="Họ và tên *"
                                    placeholder="Nguyễn Văn A"
                                    value={form.fullName} onChange={handleChange('fullName')}
                                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth size="small" label="Email"
                                    placeholder="email@example.com"
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }}
                                    value={form.email} onChange={handleChange('email')}
                                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth size="small" label="Số điện thoại"
                                    placeholder="0912345678"
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }}
                                    value={form.phone} onChange={handleChange('phone')}
                                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Cấu hình POS */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1, color: '#424242', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                            <PointOfSale fontSize="small" color="action" /> Cấu hình Thu ngân (POS)
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="600">Tự động in hóa đơn</Typography>
                                <Typography variant="caption" color="text.secondary">Máy POS sẽ tự động in hóa đơn ngay sau khi thanh toán thành công.</Typography>
                            </Box>
                            <Switch
                                checked={form.posSettings_autoPrint}
                                onChange={(e) => setForm({ ...form, posSettings_autoPrint: e.target.checked })}
                            />
                        </Box>
                    </Grid>

                </Grid>
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', px: 3, color: 'text.secondary', borderColor: '#ccc' }}>
                    Hủy bỏ
                </Button>
                <Button
                    onClick={() => createMut.mutate()}
                    variant="contained"
                    disabled={!isValid || createMut.isPending}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 4, boxShadow: 2 }}
                    startIcon={createMut.isPending ? <CircularProgress size={20} color="inherit" /> : (userToEdit ? <Edit sx={{ fontSize: 18 }} /> : <PersonAdd />)}
                >
                    {userToEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
