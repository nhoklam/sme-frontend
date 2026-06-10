// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import {
    Box, TextField, Button, InputAdornment,
    IconButton, Alert, Checkbox, FormControlLabel,
    Typography, Link, Dialog, DialogTitle, DialogContent,
    DialogActions, Stepper, Step, StepLabel, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, LoginOutlined, Person, Email, VpnKey, CheckCircle } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import authService from '../../services/authService';
import { authApi } from '../../services/authApi';

const IC = '#1976d2';

const LoginForm = ({ onSuccess, onError }) => {
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ username: '', password: '', rememberMe: false });

    // Forgot Password States
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(0);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotPass, setForgotPass] = useState('');
    const [forgotConfirmPass, setForgotConfirmPass] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');

    const handleChange = (e) => {
        if (error) setError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForgotState = () => {
        setForgotStep(0); setForgotEmail(''); setForgotOtp(''); setForgotPass(''); setForgotConfirmPass(''); setForgotError('');
    };

    const handleSendForgotEmail = async () => {
        if (!forgotEmail.trim()) { setForgotError('Vui lòng nhập email'); return; }
        setForgotError('');
        setForgotLoading(true);
        try {
            await authApi.forgotPassword(forgotEmail);
            setForgotStep(1);
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleVerifyForgotOtp = async () => {
        if (!forgotOtp.trim() || forgotOtp.length !== 6) { setForgotError('Vui lòng nhập mã OTP 6 số'); return; }
        setForgotError('');
        setForgotLoading(true);
        try {
            await authApi.verifyOtp(forgotEmail, forgotOtp);
            setForgotStep(2);
        } catch (err: any) {
            setForgotError(err.response?.data?.message || 'Mã OTP không hợp lệ');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!forgotPass || !forgotConfirmPass) { setForgotError('Vui lòng nhập mật khẩu mới'); return; }
        if (forgotPass !== forgotConfirmPass) { setForgotError('Mật khẩu xác nhận không khớp'); return; }
        if (forgotPass.length < 8) { setForgotError('Mật khẩu phải từ 8 ký tự'); return; }
        setForgotError('');
        setForgotLoading(true);
        try {
            await authApi.resetPassword({ email: forgotEmail, otp: forgotOtp, newPassword: forgotPass });
            setForgotStep(3); // Success step
        } catch (err: any) {
            if (err.response?.status === 400 || err.response?.status === 401) {
                setForgotError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
                setForgotStep(1); // Go back to OTP step
            } else {
                setForgotError(err.response?.data?.message || 'Có lỗi xảy ra khi khôi phục');
            }
        } finally {
            setForgotLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username.trim()) { setError('Vui lòng nhập tên đăng nhập'); return; }
        if (!formData.password) { setError('Vui lòng nhập mật khẩu'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await authService.login(formData.username.trim(), formData.password);
            const authData = res.data;
            authService.saveUser(authData, formData.rememberMe);
            queryClient.clear();
            if (onSuccess) onSuccess(authData.user);
        } catch (err) {
            const msg = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng';
            setError(msg);
            if (onError) onError(msg);
        } finally {
            setLoading(false);
        }
    };

    const fieldSx = {
        mb: 2,
        '& .MuiOutlinedInput-root': {
            '&:hover fieldset': { borderColor: IC },
            '&.Mui-focused fieldset': { borderColor: IC },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: IC },
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                    {error}
                </Alert>
            )}

            <TextField
                fullWidth label="Tên đăng nhập" name="username"
                value={formData.username} onChange={handleChange}
                required autoComplete="username"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Person sx={{ color: '#bbb', fontSize: 20 }} />
                        </InputAdornment>
                    ),
                }}
                sx={fieldSx}
            />

            <TextField
                fullWidth label="Mật khẩu" name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password} onChange={handleChange}
                required autoComplete="current-password"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Lock sx={{ color: '#bbb', fontSize: 20 }} />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={fieldSx}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={formData.rememberMe}
                            onChange={e => setFormData({ ...formData, rememberMe: e.target.checked })}
                            sx={{ color: IC, '&.Mui-checked': { color: IC } }}
                        />
                    }
                    label={<Typography variant="body2">Ghi nhớ đăng nhập</Typography>}
                />
                <Link component="button" type="button" onClick={() => { resetForgotState(); setForgotOpen(true); }} variant="body2" underline="hover" sx={{ color: IC }}>
                    Quên mật khẩu?
                </Link>
            </Box>

            <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading} startIcon={<LoginOutlined />}
                sx={{
                    py: 1.4, bgcolor: IC, '&:hover': { bgcolor: '#1565c0' },
                    mb: 2, textTransform: 'none', fontWeight: 700, fontSize: 15,
                    borderRadius: 1.5,
                }}
            >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fb', borderRadius: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    Chỉ tài khoản được cấp bởi Quản trị viên mới có thể đăng nhập
                </Typography>
            </Box>

            {/* Forgot Password Modal */}
            <Dialog open={forgotOpen} onClose={() => !forgotLoading && setForgotOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, pb: 1, color: '#1a1a2e' }}>
                    Khôi Phục Mật Khẩu
                </DialogTitle>
                <DialogContent sx={{ pb: 1 }}>
                    {forgotStep < 3 && (
                        <Stepper activeStep={forgotStep} sx={{ mb: 4, mt: 1 }}>
                            <Step><StepLabel>Nhập Email</StepLabel></Step>
                            <Step><StepLabel>Xác minh OTP</StepLabel></Step>
                            <Step><StepLabel>Đặt lại MK</StepLabel></Step>
                        </Stepper>
                    )}

                    {forgotError && <Alert severity="error" sx={{ mb: 3 }}>{forgotError}</Alert>}

                    {forgotStep === 0 && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                Vui lòng nhập địa chỉ email liên kết với tài khoản quản trị của bạn để nhận mã xác minh.
                            </Typography>
                            <TextField
                                fullWidth label="Địa chỉ Email"
                                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#bbb', fontSize: 20 }} /></InputAdornment> }}
                                sx={{ mb: 1, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: IC } }}
                            />
                        </Box>
                    )}

                    {forgotStep === 1 && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                Một mã OTP gồm 6 số đã được gửi tới <b>{forgotEmail}</b>.
                            </Typography>
                            <TextField
                                fullWidth label="Mã OTP" type="number"
                                value={forgotOtp} onChange={e => setForgotOtp(e.target.value)}
                                sx={{ mb: 2.5, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: IC } }}
                            />
                        </Box>
                    )}

                    {forgotStep === 2 && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                Mã OTP hợp lệ. Vui lòng đặt mật khẩu mới.
                            </Typography>
                            <TextField
                                fullWidth label="Mật khẩu mới" type={showPassword ? 'text' : 'password'}
                                value={forgotPass} onChange={e => setForgotPass(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><VpnKey sx={{ color: '#bbb', fontSize: 20 }} /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ mb: 2.5, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: IC } }}
                            />
                            <TextField
                                fullWidth label="Xác nhận mật khẩu" type={showPassword ? 'text' : 'password'}
                                value={forgotConfirmPass} onChange={e => setForgotConfirmPass(e.target.value)}
                                InputProps={{ 
                                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#bbb', fontSize: 20 }} /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ mb: 1, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: IC } }}
                            />
                        </Box>
                    )}

                    {forgotStep === 3 && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <CheckCircle sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Đổi mật khẩu thành công</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tài khoản của bạn đã được mở khóa (nếu có). Vui lòng đăng nhập lại với mật khẩu mới.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, justifyContent: forgotStep === 3 ? 'center' : 'flex-end' }}>
                    {forgotStep < 3 && (
                        <Button onClick={() => setForgotOpen(false)} disabled={forgotLoading} sx={{ color: 'text.secondary' }}>
                            Hủy
                        </Button>
                    )}
                    {forgotStep === 0 && (
                        <Button onClick={handleSendForgotEmail} disabled={forgotLoading} variant="contained" sx={{ bgcolor: IC, '&:hover': { bgcolor: '#1565c0' } }}>
                            {forgotLoading ? <CircularProgress size={24} color="inherit" /> : 'Nhận mã OTP'}
                        </Button>
                    )}
                    {forgotStep === 1 && (
                        <Button onClick={handleVerifyForgotOtp} disabled={forgotLoading} variant="contained" sx={{ bgcolor: IC, '&:hover': { bgcolor: '#1565c0' } }}>
                            {forgotLoading ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận OTP'}
                        </Button>
                    )}
                    {forgotStep === 2 && (
                        <Button onClick={handleResetPassword} disabled={forgotLoading} variant="contained" sx={{ bgcolor: IC, '&:hover': { bgcolor: '#1565c0' } }}>
                            {forgotLoading ? <CircularProgress size={24} color="inherit" /> : 'Lưu mật khẩu mới'}
                        </Button>
                    )}
                    {forgotStep === 3 && (
                        <Button onClick={() => setForgotOpen(false)} variant="contained" sx={{ bgcolor: IC, '&:hover': { bgcolor: '#1565c0' } }}>
                            Quay lại đăng nhập
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LoginForm;