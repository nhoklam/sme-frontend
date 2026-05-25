import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button,
    Alert, InputAdornment, IconButton, Stepper, Step, StepLabel, Container, Fade
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
                            {step < 3 && (
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
                            )}

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', bgcolor: 'rgba(211, 47, 47, 0.05)', color: '#d32f2f', border: '1px solid rgba(211, 47, 47, 0.12)' }} onClose={() => setError('')}>
                                    {error}
                                </Alert>
                            )}

                            {step === 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Alert severity="info" sx={{ borderRadius: '8px', bgcolor: 'rgba(245, 166, 35, 0.08)', color: '#b27a18', border: '1px solid rgba(245, 166, 35, 0.2)', fontSize: 13, '& .MuiAlert-icon': { color: '#f5a623' } }}>
                                        Nhập email đăng ký. Chúng tôi sẽ gửi link xác nhận đặt lại mật khẩu.
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
                                        Email xác nhận đã gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
                                    </Alert>
                                    <Typography fontSize={13} sx={{ color: 'rgba(26, 26, 46, 0.6)' }} textAlign="center">
                                        Trong môi trường demo, nhấn nút dưới để tiếp tục.
                                    </Typography>
                                    <Button
                                        fullWidth variant="contained" size="large"
                                        onClick={handleVerify} disabled={loading}
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
                                        {loading ? 'Đang xác nhận...' : 'Xác nhận (Demo)'}
                                    </Button>
                                    <Button
                                        fullWidth variant="text" size="small"
                                        onClick={() => setStep(0)}
                                        sx={{ textTransform: 'none', color: 'rgba(26, 26, 46, 0.5)', '&:hover': { color: '#f5a623' } }}
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
                                                    <IconButton onClick={() => setShowPass(!showPass)} edge="end" sx={{ color: 'rgba(26, 26, 46, 0.4)', '&:hover': { color: '#f5a623' } }}>
                                                        {showPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={textFieldStyle}
                                        helperText="Ít nhất 6 ký tự"
                                    />
                                    <TextField
                                        fullWidth label="Xác nhận mật khẩu mới" type={showPass ? 'text' : 'password'}
                                        value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                                        error={!!confirmPass && confirmPass !== newPass}
                                        sx={textFieldStyle}
                                        helperText={confirmPass && confirmPass !== newPass ? 'Mật khẩu không khớp' : ''}
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
                                        {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                                    </Button>
                                </Box>
                            )}

                            {step === 3 && (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
                                    <Typography variant="h6" fontWeight={800} color="#1a1a2e" mb={1}>
                                        Đặt lại thành công!
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(26, 26, 46, 0.6)' }} mb={3}>
                                        Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại bằng mật khẩu mới.
                                    </Typography>
                                    <Button
                                        fullWidth variant="contained" size="large" component={Link} to="/login"
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
                                        Đăng nhập ngay
                                    </Button>
                                </Box>
                            )}

                            {step < 3 && (
                                <Box sx={{ textAlign: 'center', mt: 3 }}>
                                    <Button
                                        component={Link} to="/login"
                                        startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                                        sx={{ textTransform: 'none', color: 'rgba(26, 26, 46, 0.5)', fontSize: 13, '&:hover': { color: '#f5a623' } }}
                                    >
                                        Quay lại đăng nhập
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
}