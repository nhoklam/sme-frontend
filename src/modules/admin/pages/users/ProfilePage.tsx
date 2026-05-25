import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, Grid, Avatar, TextField,
    Button, Card, CardContent, CircularProgress,
    InputAdornment, IconButton, Tabs, Tab, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    Person, Lock, Visibility, VisibilityOff,
    Email, Phone, Storefront, Key, CheckCircle,
    Close, CloudUpload, Shield, ModeEdit
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import userService from '../../../../services/userService';
import authService from '../../../../services/authService';
import axiosInstance from '../../../../services/axiosConfig';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState(0);
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    const [pwdForm, setPwdForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // States for Update Profile Dialog
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [tempName, setTempName] = useState('');
    const [tempAvatar, setTempAvatar] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUser = authService.getCurrentUser()?.user;

    const { data: user, isLoading, refetch } = useQuery({
        queryKey: ['my-profile', currentUser?.username],
        queryFn: () => userService.getMe(),
        enabled: !!currentUser?.username,
    });

    useEffect(() => {
        if (user?.username) {
            setAvatarUrl(localStorage.getItem('avatar_' + user.username) || '');
        }
    }, [user]);

    const changePasswordMut = useMutation({
        mutationFn: () => userService.changePassword({
            currentPassword: pwdForm.currentPassword,
            newPassword: pwdForm.newPassword
        }),
        onSuccess: () => {
            toast.success('Đổi mật khẩu thành công!');
            setPwdForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message || 'Đổi mật khẩu thất bại');
        }
    });

    const updateProfileMut = useMutation({
        mutationFn: async () => {
            return await userService.update(user!.id, {
                fullName: tempName,
                role: user!.role,
            });
        },
        onSuccess: () => {
            // Update auth local storage details
            const stored = authService.getCurrentUser();
            if (stored && stored.user) {
                stored.user.fullName = tempName;
                if (localStorage.getItem('user')) {
                    localStorage.setItem('user', JSON.stringify(stored));
                } else {
                    sessionStorage.setItem('user', JSON.stringify(stored));
                }
            }

            // Save avatar URL to local storage
            if (tempAvatar) {
                localStorage.setItem('avatar_' + user!.username, tempAvatar);
                setAvatarUrl(tempAvatar);
            } else {
                localStorage.removeItem('avatar_' + user!.username);
                setAvatarUrl('');
            }

            // Send notification event to update layout header
            window.dispatchEvent(new Event('user-profile-updated'));

            toast.success('Cập nhật hồ sơ thành công!');
            setOpenEditDialog(false);
            refetch();
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message || 'Cập nhật hồ sơ thất bại');
        }
    });

    const handlePwdChange = (field: keyof typeof pwdForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setPwdForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        const form = new FormData();
        form.append('file', file);

        const uploadToast = toast.loading('Đang tải ảnh lên...');
        try {
            const res = await axiosInstance.post('/upload/image', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data?.data?.url ?? res.data?.url ?? '';
            if (url) {
                setTempAvatar(url);
                toast.success('Tải ảnh lên thành công!', { id: uploadToast });
            } else {
                toast.error('Không tìm thấy đường dẫn ảnh phản hồi', { id: uploadToast });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'Tải ảnh lên thất bại', { id: uploadToast });
        }
    };

    const handleSaveProfile = () => {
        if (!tempName.trim()) {
            toast.error('Họ và tên không được để trống');
            return;
        }
        updateProfileMut.mutate();
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">Không tìm thấy thông tin tài khoản</Typography>
            </Box>
        );
    }

    const roleLabels: Record<string, string> = {
        'ROLE_ADMIN': 'Admin',
        'ROLE_MANAGER': 'Quản lý',
        'ROLE_CASHIER': 'Thu ngân',
        'ROLE_CUSTOMER': 'Khách hàng'
    };

    const isPwdValid = pwdForm.currentPassword.length > 0 &&
        pwdForm.newPassword.length >= 8 &&
        pwdForm.newPassword === pwdForm.confirmPassword;

    const inputStyles = {
        '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13, bgcolor: '#fff', '&:hover fieldset': { borderColor: '#2563eb' } },
        '& .MuiInputBase-input': { py: 1.25 }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            {/* Tabs for splitting page */}
            <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', mb: 4 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab
                        label="Thông tin tài khoản"
                        icon={<Person sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 14 }}
                    />
                    <Tab
                        label="Đổi mật khẩu"
                        icon={<Key sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 14 }}
                    />
                </Tabs>
            </Box>

            {/* Tab 1: Account Info */}
            {activeTab === 0 && (
                <Box>
                    {/* Header Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold" color="#0f172a">
                            Thông tin tài khoản
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<ModeEdit />}
                            onClick={() => {
                                setTempName(user.fullName);
                                setTempAvatar(avatarUrl);
                                setOpenEditDialog(true);
                            }}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                bgcolor: '#2563eb',
                                '&:hover': { bgcolor: '#1d4ed8' }
                            }}
                        >
                            Cập nhật hồ sơ
                        </Button>
                    </Box>

                    {/* Main Profile Info Card */}
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 3, mb: 4 }}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                                <Avatar
                                    src={avatarUrl}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        border: '4px solid #fff',
                                        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                        bgcolor: '#2563eb',
                                        fontSize: 48,
                                        fontWeight: 700,
                                        mb: 2
                                    }}
                                >
                                    {user.fullName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 0.5 }}>
                                    {user.fullName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {roleLabels[user.role] || user.role}
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3.5 }}>
                                <Shield sx={{ color: '#2563eb', fontSize: 20 }} />
                                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">
                                    Chi tiết cá nhân
                                </Typography>
                            </Box>

                            {/* Table Layout */}
                            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                                    <Box sx={{ width: '40%', p: 2, bgcolor: '#f8fafc', fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                                        Họ và tên
                                    </Box>
                                    <Box sx={{ width: '60%', p: 2, color: '#0f172a', fontWeight: 700, fontSize: 13 }}>
                                        {user.fullName}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                                    <Box sx={{ width: '40%', p: 2, bgcolor: '#f8fafc', fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                                        Email (Tên đăng nhập)
                                    </Box>
                                    <Box sx={{ width: '60%', p: 2, color: '#0f172a', fontSize: 13 }}>
                                        {user.email || user.username}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                                    <Box sx={{ width: '40%', p: 2, bgcolor: '#f8fafc', fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                                        Vai trò
                                    </Box>
                                    <Box sx={{ width: '60%', p: 2, display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 1.5,
                                                bgcolor: '#eff6ff',
                                                color: '#2563eb',
                                                fontSize: 11,
                                                fontWeight: 700
                                            }}
                                        >
                                            {roleLabels[user.role] || user.role}
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                                    <Box sx={{ width: '40%', p: 2, bgcolor: '#f8fafc', fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                                        Trạng thái
                                    </Box>
                                    <Box sx={{ width: '60%', p: 2, display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 1.5,
                                                bgcolor: '#f0fdf4',
                                                color: '#16a34a',
                                                fontSize: 11,
                                                fontWeight: 700
                                            }}
                                        >
                                            Đang hoạt động
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                    <Box sx={{ width: '40%', p: 2, bgcolor: '#f8fafc', fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                                        Số lượng quyền hệ thống
                                    </Box>
                                    <Box sx={{ width: '60%', p: 2, color: '#0f172a', fontSize: 13 }}>
                                        {user.role === 'ROLE_ADMIN' ? 'Tất cả quyền' : user.role === 'ROLE_MANAGER' ? '5 quyền' : '1 quyền'}
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Edit Profile Dialog */}
                    <Dialog
                        open={openEditDialog}
                        onClose={() => setOpenEditDialog(false)}
                        maxWidth="xs"
                        fullWidth
                        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
                    >
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                            <Typography variant="h6" fontWeight="bold" color="#0f172a">
                                Cập nhật hồ sơ cá nhân
                            </Typography>
                            <IconButton onClick={() => setOpenEditDialog(false)} size="small" sx={{ bgcolor: '#f1f5f9' }}>
                                <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, mt: 1 }}>
                                {/* Avatar Upload Circle */}
                                <Box
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        border: '2px dashed #cbd5e1',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        bgcolor: '#f8fafc',
                                        '&:hover': { borderColor: '#2563eb', bgcolor: '#f1f5f9' }
                                    }}
                                >
                                    {tempAvatar ? (
                                        <Box component="img" src={tempAvatar} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <>
                                            <CloudUpload sx={{ fontSize: 24, color: '#94a3b8', mb: 0.5 }} />
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>
                                                Tải ảnh
                                            </Typography>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleAvatarUpload}
                                    />
                                </Box>

                                {/* Name Field */}
                                <Box sx={{ width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                        <Typography variant="body2" fontWeight={700} color="#ef4444" component="span">*</Typography>
                                        <Typography variant="body2" fontWeight={700} color="#334155">
                                            Họ và tên
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        sx={inputStyles}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setOpenEditDialog(false)}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    borderColor: '#cbd5e1',
                                    borderRadius: 2,
                                    px: 3,
                                    '&:hover': { borderColor: '#b5c2d1', bgcolor: '#f8fafc' }
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSaveProfile}
                                disabled={updateProfileMut.isPending || !tempName.trim()}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    bgcolor: '#2563eb',
                                    borderRadius: 2,
                                    px: 3,
                                    '&:hover': { bgcolor: '#1d4ed8' }
                                }}
                            >
                                Lưu thay đổi
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}

            {/* Tab 2: Change Password */}
            {activeTab === 1 && (
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 1 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Box sx={{ display: 'flex', p: 0.75, borderRadius: 1.5, bgcolor: '#eff6ff', color: '#2563eb' }}>
                                <Lock sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={800} color="#1e293b" letterSpacing="0.5px" sx={{ textTransform: 'uppercase', fontSize: 11 }}>
                                Đổi mật khẩu
                            </Typography>
                        </Box>

                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 500 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                                    <Typography variant="body2" fontWeight={700} color="#334155" fontSize={12.5}>
                                        Mật khẩu hiện tại *
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth size="small"
                                    type={showCurrentPwd ? 'text' : 'password'}
                                    value={pwdForm.currentPassword}
                                    onChange={handlePwdChange('currentPassword')}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 16, color: '#64748b' }} /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowCurrentPwd(!showCurrentPwd)} edge="end" size="small">
                                                    {showCurrentPwd ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={inputStyles}
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                                    <Typography variant="body2" fontWeight={700} color="#334155" fontSize={12.5}>
                                        Mật khẩu mới *
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth size="small"
                                    type={showNewPwd ? 'text' : 'password'}
                                    value={pwdForm.newPassword}
                                    onChange={handlePwdChange('newPassword')}
                                    error={pwdForm.newPassword !== '' && pwdForm.newPassword.length < 8}
                                    helperText={pwdForm.newPassword !== '' && pwdForm.newPassword.length < 8 ? 'Mật khẩu phải chứa tối thiểu 8 ký tự' : ''}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 16, color: '#64748b' }} /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowNewPwd(!showNewPwd)} edge="end" size="small">
                                                    {showNewPwd ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={inputStyles}
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                                    <Typography variant="body2" fontWeight={700} color="#334155" fontSize={12.5}>
                                        Xác nhận mật khẩu mới *
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth size="small"
                                    type={showConfirmPwd ? 'text' : 'password'}
                                    value={pwdForm.confirmPassword}
                                    onChange={handlePwdChange('confirmPassword')}
                                    error={pwdForm.confirmPassword !== '' && pwdForm.newPassword !== pwdForm.confirmPassword}
                                    helperText={pwdForm.confirmPassword !== '' && pwdForm.newPassword !== pwdForm.confirmPassword ? 'Mật khẩu xác nhận không khớp' : ''}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 16, color: '#64748b' }} /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowConfirmPwd(!showConfirmPwd)} edge="end" size="small">
                                                    {showConfirmPwd ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={inputStyles}
                                />
                            </Box>

                            <Button
                                variant="contained"
                                disabled={!isPwdValid || changePasswordMut.isPending}
                                onClick={() => changePasswordMut.mutate()}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    py: 1,
                                    fontWeight: 'bold',
                                    bgcolor: '#2563eb',
                                    '&:hover': { bgcolor: '#1d4ed8' },
                                    alignSelf: 'flex-start',
                                    px: 4
                                }}
                                startIcon={changePasswordMut.isPending ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                            >
                                Cập nhật mật khẩu
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
