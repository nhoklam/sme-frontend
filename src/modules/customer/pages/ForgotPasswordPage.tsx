import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button,
    Alert, InputAdornment, IconButton, Stepper, Step, StepLabel, Container, Fade
} from '@mui/material';
import {
    Email, ArrowBack, LockReset, Visibility, VisibilityOff, VpnKey
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/authApi';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const steps = ['Nhập email', 'Xác minh OTP', 'Đặt lại mật khẩu'];

    const validatePassword = (password: string) => {
        if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
        if (!/[A-Z]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
        if (!/[a-z]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
        if (!/[0-9]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 số';
        return '';
    };

    const handleSendEmail = async () => {
        if (!email.trim()) { setError('Vui lòng nhập email'); return; }
        setError('');
        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            toast.success('Mã OTP đã được gửi đến email của bạn');
            setStep(1);
        } catch (err: any) {
            const axiosError = err as AxiosError<any>;
            const status = axiosError.response?.status;
            if (status === 429) {
                setError('Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.');
            } else if (status === 404) {
                setError('Email không tồn tại trong hệ thống.');
            } else {
                setError(axiosError.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 6) { setError('Vui lòng nhập mã OTP 6 số'); return; }
        setError('');
        setLoading(true);
        try {
            await authApi.verifyOtp(email, otp);
            setStep(2);
        } catch (err: any) {
            const axiosError = err as AxiosError<any>;
            setError(axiosError.response?.data?.message || 'Mã OTP không hợp lệ');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        const passValidation = validatePassword(newPass);
        if (passValidation) {
            setPasswordError(passValidation);
            return;
        } else {
            setPasswordError('');
        }

        if (newPass !== confirmPass) { setError('Mật khẩu xác nhận không khớp'); return; }
        
        setError('');
        setLoading(true);
        try {
            await authApi.resetPassword({ email, otp, newPassword: newPass });
            toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            navigate('/login');
        } catch (err: any) {
            const axiosError = err as AxiosError<any>;
            const status = axiosError.response?.status;
            if (status === 400 || status === 401) {
                setError(axiosError.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
                setStep(1); // Go back to OTP step
            } else {
                setError(axiosError.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
            }
        } finally {
            setLoading(false);
        }
    };

    const textFieldStyle = {
        '& .MuiOutlinedInput-root': {
            color: '#1a1a2e',
            backgroundColor: '#f9fafc',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(245, 166, 35, 0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#f5a623', boxShadow: '0 0 8px rgba(245, 166, 35, 0.15)' },
        },
        '& .MuiInputLabel-root': {
            color: 'rgba(26, 26, 46, 0.6)',
            fontSize: '14px',
            '&.Mui-focused': { color: '#f5a623' },
        },
        '& .MuiFormHelperText-root': {
            color: 'rgba(26, 26, 46, 0.5)',
        }
    };

    return (
        <Box sx={{
            minHeight: 'calc(100vh - 130px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 50%, #fcfcfe 0%, #f4f5f8 100%)',
            py: 6,
            px: 2,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: '20%',
                left: '20%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(245, 166, 35, 0.05) 0%, rgba(0,0,0,0) 70%)',
                zIndex: 0,
            },
            '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '20%',
                right: '20%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(245, 166, 35, 0.03) 0%, rgba(0,0,0,0) 70%)',
                zIndex: 0,
            }
        }}>
            <Container maxWidth="xs" sx={{ zIndex: 1, position: 'relative' }}>
                <Fade in={true} timeout={1000}>
                    <Paper 
                        elevation={24} 
                        sx={{ 
                            borderRadius: '16px', 
                            overflow: 'hidden', 
                            bgcolor: '#ffffff',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            color: '#1a1a2e',
                            p: 1
                        }}
                    >
                        {/* Header Box */}
                        <Box sx={{ 
                            p: 4, 
                            pb: 3, 
                            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.1) 0%, #ffffff 100%)', 
                            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                            textAlign: 'center' 
                        }}>
                            <Box sx={{ 
                                width: 56, 
                                height: 56, 
                                bgcolor: 'rgba(245, 166, 35, 0.12)', 
                                border: '1px solid rgba(245, 166, 35, 0.25)',
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                mx: 'auto', 
                                mb: 2,
                                boxShadow: '0 2px 8px rgba(245, 166, 35, 0.05)'
                            }}>
                                <LockReset sx={{ fontSize: 28, color: '#f5a623' }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800} sx={{ 
                                color: '#1a1a2e',
                                letterSpacing: '-0.5px' 
                            }}>
                                Quên mật khẩu
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(26, 26, 46, 0.6)', mt: 0.5, fontWeight: 400 }}>
                                Đặt lại mật khẩu tài khoản Bookly của bạn
                            </Typography>
                        </Box>

                        <Box sx={{ p: 4 }}>
                            <Stepper 
                                activeStep={step} 
                                sx={{ 
                                    mb: 4,
                                    '& .MuiStepLabel-label': { color: 'rgba(26, 26, 46, 0.5)', fontSize: 11, fontWeight: 600 },
                                    '& .MuiStepLabel-label.Mui-active': { color: '#f5a623 !important' },
                                    '& .MuiStepLabel-label.Mui-completed': { color: 'rgba(245, 166, 35, 0.7) !important' },
                                    '& .MuiStepIcon-root': { color: 'rgba(0, 0, 0, 0.08)' },
                                    '& .MuiStepIcon-text': { fill: '#ffffff', fontWeight: 'bold' },
                                    '& .MuiStepIcon-root.Mui-active': { color: '#f5a623' },
                                    '& .MuiStepIcon-root.Mui-active .MuiStepIcon-text': { fill: '#0c0c16' },
                                    '& .MuiStepIcon-root.Mui-completed': { color: '#f5a623' },
                                    '& .MuiStepConnector-line': { borderColor: 'rgba(0, 0, 0, 0.08)' }
                                }} 
                                alternativeLabel
                            >
                                {steps.map(label => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', bgcolor: 'rgba(211, 47, 47, 0.05)', color: '#d32f2f', border: '1px solid rgba(211, 47, 47, 0.12)' }} onClose={() => setError('')}>
                                    {error}
                                </Alert>
                            )}

                            {step === 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Alert severity="info" sx={{ borderRadius: '8px', bgcolor: 'rgba(245, 166, 35, 0.08)', color: '#b27a18', border: '1px solid rgba(245, 166, 35, 0.2)', fontSize: 13, '& .MuiAlert-icon': { color: '#f5a623' } }}>
                                        Nhập email đăng ký. Chúng tôi sẽ gửi mã OTP 6 số để xác nhận.
                                    </Alert>
                                    <TextField
                                        fullWidth label="Email tài khoản" type="email"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        autoFocus
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={{ color: 'rgba(26, 26, 46, 0.4)', fontSize: 20 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={textFieldStyle}
                                        onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                                    />
                                    <Button
                                        fullWidth variant="contained" size="large"
                                        onClick={handleSendEmail} disabled={loading}
                                        sx={{ 
                                            borderRadius: '8px', 
                                            textTransform: 'none', 
                                            fontWeight: 700, 
                                            py: 1.5, 
                                            background: 'linear-gradient(135deg, #f5a623 0%, #d48b10 100%)',
                                            color: '#0c0c16',
                                            boxShadow: '0 4px 15px rgba(245, 166, 35, 0.2)',
                                            transition: 'all 0.3s',
                                            '&:hover': { 
                                                background: 'linear-gradient(135deg, #ffb83d 0%, #e0951a 100%)',
                                                boxShadow: '0 6px 20px rgba(245, 166, 35, 0.3)'
                                            }
                                        }}
                                    >
                                        {loading ? 'Đang gửi...' : 'Gửi email xác nhận'}
                                    </Button>
                                </Box>
                            )}

                            {step === 1 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Alert severity="success" sx={{ borderRadius: '8px', bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.18)', fontSize: 13, '& .MuiAlert-icon': { color: '#10b981' } }}>
                                        Mã OTP đã gửi đến <strong>{email}</strong>
                                    </Alert>
                                    
                                    <TextField
                                        fullWidth label="Mã OTP (6 chữ số)" type="text"
                                        value={otp} onChange={e => setOtp(e.target.value)}
                                        autoFocus
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <VpnKey sx={{ color: 'rgba(26, 26, 46, 0.4)', fontSize: 20 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={textFieldStyle}
                                        onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                    />
                                    
                                    <Button
                                        fullWidth variant="contained" size="large"
                                        onClick={handleVerifyOtp} disabled={loading}
                                        sx={{ 
                                            borderRadius: '8px', 
                                            textTransform: 'none', 
                                            fontWeight: 700, 
                                            py: 1.5, 
                                            background: 'linear-gradient(135deg, #f5a623 0%, #d48b10 100%)',
                                            color: '#0c0c16',
                                            boxShadow: '0 4px 15px rgba(245, 166, 35, 0.2)',
                                            transition: 'all 0.3s',
                                            '&:hover': { 
                                                background: 'linear-gradient(135deg, #ffb83d 0%, #e0951a 100%)',
                                                boxShadow: '0 6px 20px rgba(245, 166, 35, 0.3)'
                                            }
                                        }}
                                    >
                                        {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
                                    </Button>
                                    
                                    <Button
                                        fullWidth variant="text" size="small"
                                        onClick={() => setStep(0)}
                                        disabled={loading}
                                        sx={{ textTransform: 'none', color: 'rgba(26, 26, 46, 0.5)', '&:hover': { color: '#f5a623' } }}
                                    >
                                        Gửi lại mã OTP
                                    </Button>
                                </Box>
                            )}

                            {step === 2 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Alert severity="info" sx={{ borderRadius: '8px', bgcolor: 'rgba(245, 166, 35, 0.08)', color: '#b27a18', border: '1px solid rgba(245, 166, 35, 0.2)', fontSize: 13, '& .MuiAlert-icon': { color: '#f5a623' } }}>
                                        Mã OTP hợp lệ. Vui lòng đặt mật khẩu mới.
                                    </Alert>

                                    <TextField
                                        fullWidth label="Mật khẩu mới" type={showPass ? 'text' : 'password'}
                                        value={newPass} 
                                        onChange={e => {
                                            setNewPass(e.target.value);
                                            if (passwordError) setPasswordError(validatePassword(e.target.value));
                                        }}
                                        autoFocus
                                        error={!!passwordError}
                                        helperText={passwordError || 'Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số'}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPass(!showPass)} edge="end" sx={{ color: 'rgba(26, 26, 46, 0.4)', '&:hover': { color: '#f5a623' } }}>
                                                        {showPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={textFieldStyle}
                                    />
                                    
                                    <TextField
                                        fullWidth label="Xác nhận mật khẩu mới" type={showPass ? 'text' : 'password'}
                                        value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                                        error={!!confirmPass && confirmPass !== newPass}
                                        sx={textFieldStyle}
                                        helperText={confirmPass && confirmPass !== newPass ? 'Mật khẩu không khớp' : ''}
                                        onKeyDown={e => e.key === 'Enter' && handleReset()}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPass(!showPass)} edge="end" sx={{ color: 'rgba(26, 26, 46, 0.4)', '&:hover': { color: '#f5a623' } }}>
                                                        {showPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    
                                    <Button
                                        fullWidth variant="contained" size="large"
                                        onClick={handleReset} disabled={loading}
                                        sx={{ 
                                            borderRadius: '8px', 
                                            textTransform: 'none', 
                                            fontWeight: 700, 
                                            py: 1.5, 
                                            background: 'linear-gradient(135deg, #f5a623 0%, #d48b10 100%)',
                                            color: '#0c0c16',
                                            boxShadow: '0 4px 15px rgba(245, 166, 35, 0.2)',
                                            transition: 'all 0.3s',
                                            '&:hover': { 
                                                background: 'linear-gradient(135deg, #ffb83d 0%, #e0951a 100%)',
                                                boxShadow: '0 6px 20px rgba(245, 166, 35, 0.3)'
                                            }
                                        }}
                                    >
                                        {loading ? 'Đang xử lý...' : 'Xác nhận & Đặt lại mật khẩu'}
                                    </Button>
                                    
                                    <Button
                                        fullWidth variant="text" size="small"
                                        onClick={() => setStep(0)}
                                        disabled={loading}
                                        sx={{ textTransform: 'none', color: 'rgba(26, 26, 46, 0.5)', '&:hover': { color: '#f5a623' } }}
                                    >
                                        Hủy thao tác
                                    </Button>
                                </Box>
                            )}

                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Button
                                    component={Link} to="/login"
                                    startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                                    sx={{ textTransform: 'none', color: 'rgba(26, 26, 46, 0.5)', fontSize: 13, '&:hover': { color: '#f5a623' } }}
                                >
                                    Quay lại đăng nhập
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
}