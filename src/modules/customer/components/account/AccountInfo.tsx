import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, TextField, Button,
    Alert, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, Divider, Snackbar,
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import authService from '../../../../services/authService';

interface Props {
    user: {
        id?: string;
        fullName?: string;
        email?: string;
        phone?: string;
    };
}

const AccountInfo: React.FC<Props> = ({ user }) => {
    const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({ open: false, msg: '', type: 'success' });

    // Dialog đổi mật khẩu
    const [pwOpen, setPwOpen] = useState(false);
    const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');

    useEffect(() => {
        if (user) {
            setForm({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            await authService.updateProfile(user.id, {
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
            });
            setSnack({ open: true, msg: 'Cập nhật thông tin thành công!', type: 'success' });
        } catch {
            setSnack({ open: true, msg: 'Cập nhật thất bại. Vui lòng thử lại.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!pw.current || !pw.newPw) { setPwError('Vui lòng nhập đầy đủ thông tin'); return; }
        if (pw.newPw !== pw.confirm) { setPwError('Mật khẩu mới không khớp'); return; }
        if (pw.newPw.length < 6) { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
        setPwSaving(true);
        setPwError('');
        try {
            await authService.changePassword(pw.current, pw.newPw);
            setPwOpen(false);
            setPw({ current: '', newPw: '', confirm: '' });
            setSnack({ open: true, msg: 'Đổi mật khẩu thành công!', type: 'success' });
        } catch {
            setPwError('Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.');
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Thông tin cá nhân
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth label="Họ và tên"
                        value={form.fullName}
                        onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                        variant="outlined"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth label="Email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        variant="outlined" type="email"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth label="Số điện thoại"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        variant="outlined" inputProps={{ inputMode: 'tel' }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                            onClick={handleSave}
                            disabled={saving}
                            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 600 }}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Lock />}
                            onClick={() => setPwOpen(true)}
                            sx={{ borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none', fontWeight: 600 }}
                        >
                            Đổi mật khẩu
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            {/* Dialog đổi mật khẩu */}
            <Dialog open={pwOpen} onClose={() => { setPwOpen(false); setPwError(''); }} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Đổi mật khẩu</DialogTitle>
                <DialogContent>
                    {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
                    <TextField
                        fullWidth label="Mật khẩu hiện tại" type="password"
                        value={pw.current}
                        onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                        sx={{ mb: 2, mt: 1 }} size="small"
                    />
                    <TextField
                        fullWidth label="Mật khẩu mới" type="password"
                        value={pw.newPw}
                        onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
                        sx={{ mb: 2 }} size="small"
                    />
                    <TextField
                        fullWidth label="Xác nhận mật khẩu mới" type="password"
                        value={pw.confirm}
                        onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                        size="small"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setPwOpen(false); setPwError(''); }} sx={{ color: '#666', textTransform: 'none' }}>
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={pwSaving}
                        startIcon={pwSaving ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 600 }}
                    >
                        {pwSaving ? 'Đang lưu...' : 'Xác nhận'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar thông báo */}
            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack.type} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AccountInfo;