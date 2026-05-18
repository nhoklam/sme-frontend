import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button,
    Alert, InputAdornment, IconButton, Stepper, Step, StepLabel,
} from '@mui/material';
import {
    Email, ArrowBack, LockReset, Visibility, VisibilityOff, CheckCircle,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const steps = ['Nhập email', 'Xác nhận', 'Đặt lại mật khẩu'];

    const handleSendEmail = async () => {
        if (!email.trim()) { setError('Vui lòng nhập email'); return; }
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setLoading(false);
        setStep(1);
    };

    const handleVerify = async () => {
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        setLoading(false);
        setStep(2);
    };

    const handleReset = async () => {
        if (!newPass || newPass.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
        if (newPass !== confirmPass) { setError('Mật khẩu xác nhận không khớp'); return; }
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setLoading(false);
        setStep(3);
    };

    return (
        <Box sx={{
            minHeight: 'calc(100vh - 130px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
            py: 4, p: 2,
        }}>
            <Paper sx={{ width: '100%', maxWidth: 460, borderRadius: 3, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
                <Box sx={{ p: 4, pb: 3, background: 'linear-gradient(135deg, #d32f2f, #b71c1c)', color: 'white', textAlign: 'center' }}>
                    <Box sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <LockReset sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
                        Quên mật khẩu
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                        Đặt lại mật khẩu tài khoản của bạn
                    </Typography>
                </Box>

                <Box sx={{ p: 4 }}>
                    {step < 3 && (
                        <Stepper activeStep={step} sx={{ mb: 4 }} alternativeLabel>
                            {steps.map(label => (
                                <Step key={label}>
                                    <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11, fontWeight: 600 } }}>
                                        {label}
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {step === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Alert severity="info" sx={{ borderRadius: 2, fontSize: 13 }}>
                                Nhập email đăng ký. Chúng tôi sẽ gửi link xác nhận đặt lại mật khẩu.
                            </Alert>
                            <TextField
                                fullWidth label="Email tài khoản" type="email"
                                value={email} onChange={e => setEmail(e.target.value)}
                                autoFocus
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: '#9ca3af', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                            />
                            <Button
                                fullWidth variant="contained" size="large"
                                onClick={handleSendEmail} disabled={loading}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.5, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                            >
                                {loading ? 'Đang gửi...' : 'Gửi email xác nhận'}
                            </Button>
                        </Box>
                    )}

                    {step === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Alert severity="success" sx={{ borderRadius: 2, fontSize: 13 }}>
                                Email xác nhận đã gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (kể cả Spam).
                            </Alert>
                            <Typography fontSize={13} color="text.secondary" textAlign="center">
                                Trong môi trường demo, nhấn nút dưới để tiếp tục.
                            </Typography>
                            <Button
                                fullWidth variant="contained" size="large"
                                onClick={handleVerify} disabled={loading}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.5, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                            >
                                {loading ? 'Đang xác nhận...' : 'Xác nhận (Demo)'}
                            </Button>
                            <Button
                                fullWidth variant="text" size="small"
                                onClick={() => setStep(0)}
                                sx={{ textTransform: 'none', color: '#6b7280' }}
                            >
                                Đổi email khác
                            </Button>
                        </Box>
                    )}

                    {step === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                fullWidth label="Mật khẩu mới" type={showPass ? 'text' : 'password'}
                                value={newPass} onChange={e => setNewPass(e.target.value)}
                                autoFocus
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPass(!showPass)} edge="end">
                                                {showPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                helperText="Ít nhất 6 ký tự"
                            />
                            <TextField
                                fullWidth label="Xác nhận mật khẩu mới" type={showPass ? 'text' : 'password'}
                                value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                                error={!!confirmPass && confirmPass !== newPass}
                                helperText={confirmPass && confirmPass !== newPass ? 'Mật khẩu không khớp' : ''}
                            />
                            <Button
                                fullWidth variant="contained" size="large"
                                onClick={handleReset} disabled={loading}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.5, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                            >
                                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                            </Button>
                        </Box>
                    )}

                    {step === 3 && (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
                            <Typography variant="h6" fontWeight={800} color="#1e293b" mb={1}>
                                Đặt lại thành công!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại bằng mật khẩu mới.
                            </Typography>
                            <Button
                                fullWidth variant="contained" size="large" component={Link} to="/login"
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.5, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                            >
                                Đăng nhập ngay
                            </Button>
                        </Box>
                    )}

                    {step < 3 && (
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Button
                                component={Link} to="/login"
                                startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                                sx={{ textTransform: 'none', color: '#6b7280', fontSize: 13 }}
                            >
                                Quay lại đăng nhập
                            </Button>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}