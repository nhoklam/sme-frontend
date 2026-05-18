import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, IconButton,
    CircularProgress, LinearProgress, InputAdornment
} from '@mui/material';
import { Lock, Visibility, VisibilityOff, Shield, CheckCircle, Cancel } from '@mui/icons-material';
import userService from '../../../../../services/userService';
import authService from '../../../../../services/authService';
import toast from 'react-hot-toast';

function getPasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

const strengthLabels = ['', 'Rất Yếu', 'Yếu', 'Khá', 'Rất Mạnh'];
const strengthColors = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'];

export default function ChangePasswordTab() {
    const currentUser = authService.getCurrentUser()?.user;
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const passwordsMatch = form.confirmPassword === '' || form.newPassword === form.confirmPassword;
    const isValid = form.currentPassword.trim() && form.newPassword.trim() && form.confirmPassword.trim()
        && form.newPassword === form.confirmPassword && form.newPassword.length >= 8;

    const handleChange = async () => {
        if (!isValid) return;
        setSaving(true);
        try {
            await userService.changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            toast.success('Đổi mật khẩu thành công!');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally { setSaving(false); }
    };

    const strength = getPasswordStrength(form.newPassword);

    return (
        <Box sx={{ maxWidth: 460, mx: 'auto', pt: 4 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative */}
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.04 }}>
                    <Shield sx={{ fontSize: 200 }} />
                </Box>

                <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: 3, bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(15,23,42,0.2)' }}>
                        <Lock sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Typography fontWeight={800} fontSize={20} color="#0f172a">Bảo mật tài khoản</Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1.5, bgcolor: '#f1f5f9', px: 2, py: 0.75, borderRadius: 5, border: '1px solid #e2e8f0' }}>
                        <Typography fontSize={12} color="#64748b">Tài khoản:</Typography>
                        <Typography fontSize={12} fontWeight={700} color="#1e293b">{currentUser?.username}</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, position: 'relative', zIndex: 1 }}>
                    {/* Current password */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.75} display="block">Mật khẩu hiện tại</Typography>
                        <TextField fullWidth size="small" type={showCurrent ? 'text' : 'password'}
                            value={form.currentPassword} onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
                            placeholder="••••••••"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowCurrent(v => !v)}>{showCurrent ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton>
                                </InputAdornment>
                            }}
                        />
                    </Box>

                    <Box sx={{ height: 1, bgcolor: '#e2e8f0' }} />

                    {/* New password */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.75} display="block">Mật khẩu mới</Typography>
                        <TextField fullWidth size="small" type={showNew ? 'text' : 'password'}
                            value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
                            placeholder="Tối thiểu 8 ký tự"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowNew(v => !v)}>{showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton>
                                </InputAdornment>
                            }}
                        />
                        {form.newPassword && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Box sx={{ flex: 1, display: 'flex', gap: 0.5 }}>
                                    {[...Array(4)].map((_, i) => (
                                        <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: i < strength ? strengthColors[strength] : '#e2e8f0', transition: 'all 0.3s' }} />
                                    ))}
                                </Box>
                                <Typography fontSize={10} fontWeight={700} color="#94a3b8" sx={{ width: 60, textAlign: 'right' }}>{strengthLabels[strength]}</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Confirm password */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="#64748b" mb={0.75} display="block">Xác nhận mật khẩu</Typography>
                        <TextField fullWidth size="small" type="password"
                            value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                            placeholder="Nhập lại chính xác"
                            error={!!form.confirmPassword && !passwordsMatch}
                        />
                        {form.confirmPassword && !passwordsMatch && (
                            <Typography fontSize={11} fontWeight={700} color="#ef4444" mt={0.5} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Cancel sx={{ fontSize: 14 }} /> Không khớp
                            </Typography>
                        )}
                        {form.confirmPassword && passwordsMatch && form.newPassword && (
                            <Typography fontSize={11} fontWeight={700} color="#22c55e" mt={0.5} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle sx={{ fontSize: 14 }} /> Trùng khớp
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Button fullWidth variant="contained" onClick={handleChange} disabled={!isValid || saving}
                    startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Shield sx={{ fontSize: 18 }} />}
                    sx={{ mt: 4, py: 1.5, bgcolor: '#0f172a', fontWeight: 700, textTransform: 'none', borderRadius: 2, fontSize: 14, '&:hover': { bgcolor: '#1e293b' }, '&.Mui-disabled': { bgcolor: '#94a3b8', color: 'white' } }}>
                    {saving ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                </Button>
            </Paper>
        </Box>
    );
}
