import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Divider,
    Fade,
    Collapse,
    Tabs,
    Tab,
    CircularProgress,
    Paper
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import customerAuthService from '../../../services/customerAuthService';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const CustomerLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we came from somewhere, to redirect back
    const from = (location.state as any)?.from?.pathname || '/';

    const [tabIndex, setTabIndex] = useState(0); // 0 = Login, 1 = Register
    const isLogin = tabIndex === 0;

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    const validateRegisterForm = (): boolean => {
        const phoneRegex = /^(84|0[3|5|7|8|9])+([0-9]{8})\b$/;
        if (!phoneRegex.test(phone)) {
            setError('Số điện thoại không hợp lệ (Ví dụ: 0987654321)');
            return false;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('Mật khẩu quá yếu (Yêu cầu ≥ 8 ký tự, gồm 1 chữ HOA, 1 chữ thường và 1 số)');
            return false;
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError('Định dạng Email không hợp lệ');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!isLogin && !validateRegisterForm()) {
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const res = await customerAuthService.login(phone, password);
                if (res.success && res.data) {
                    customerAuthService.saveCustomer(res.data);
                    navigate(from, { replace: true });
                } else {
                    setError(res.message || 'Đăng nhập thất bại');
                }
            } else {
                const res = await customerAuthService.register({
                    phone,
                    password,
                    fullName,
                    email
                });
                if (res.success && res.data) {
                    customerAuthService.saveCustomer(res.data);
                    navigate(from, { replace: true });
                } else {
                    setError(res.message || 'Đăng ký thất bại');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
        setError(null);
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
                        {/* Header Area - Premium Bookly Branding */}
                        <Box sx={{ pt: 4, pb: 2, px: 3, textAlign: 'center' }}>
                            <Box sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.15) 0%, rgba(245, 166, 35, 0.03) 100%)',
                                border: '1px solid rgba(245, 166, 35, 0.3)',
                                mb: 2,
                                boxShadow: '0 4px 12px rgba(245, 166, 35, 0.1)',
                            }}>
                                <AutoStoriesIcon sx={{ fontSize: 32, color: '#f5a623' }} />
                            </Box>
                            <Typography variant="h5" fontWeight="800" sx={{
                                letterSpacing: '1.5px',
                                color: '#1a1a2e',
                                textTransform: 'uppercase'
                            }}>
                                Bookly Store
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(26, 26, 46, 0.6)', mt: 0.5, fontWeight: 400 }}>
                                Khám phá tinh hoa tri thức & văn hóa
                            </Typography>
                        </Box>

                        <Tabs
                            value={tabIndex}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            sx={{
                                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                                px: 2,
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: 15,
                                    color: 'rgba(26, 26, 46, 0.5)',
                                    transition: 'all 0.3s ease',
                                    py: 2
                                },
                                '& .Mui-selected': {
                                    color: '#f5a623 !important',
                                    fontWeight: 700
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#f5a623',
                                    height: '2px',
                                    boxShadow: '0 2px 8px rgba(245, 166, 35, 0.4)'
                                }
                            }}
                        >
                            <Tab label="Đăng nhập" />
                            <Tab label="Đăng ký" />
                        </Tabs>

                        <Box sx={{ p: 3, pt: 3.5 }}>
                            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                                <Collapse in={!isLogin} unmountOnExit timeout={400}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                        <TextField
                                            required={!isLogin}
                                            fullWidth
                                            label="Họ và tên"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            sx={textFieldStyle}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Email (Tùy chọn)"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            sx={textFieldStyle}
                                        />
                                    </Box>
                                </Collapse>

                                <TextField
                                    required
                                    fullWidth
                                    label="Số điện thoại"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="VD: 0987654321"
                                    sx={textFieldStyle}
                                />

                                <TextField
                                    required
                                    fullWidth
                                    label="Mật khẩu"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    sx={{ color: 'rgba(26, 26, 46, 0.4)', '&:hover': { color: '#f5a623' } }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={textFieldStyle}
                                />

                                <Collapse in={!!error}>
                                    <Typography color="#d32f2f" variant="body2" sx={{ textAlign: 'center', fontWeight: 500 }}>
                                        {error}
                                    </Typography>
                                </Collapse>

                                <Collapse in={isLogin}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                                        <Typography
                                            variant="body2"
                                            component={Link}
                                            to="/forgot-password"
                                            sx={{
                                                color: 'rgba(26, 26, 46, 0.6)',
                                                textDecoration: 'none',
                                                fontWeight: 500,
                                                fontSize: '13px',
                                                transition: 'color 0.2s',
                                                '&:hover': {
                                                    color: '#f5a623',
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                        >
                                            Quên mật khẩu?
                                        </Typography>
                                    </Box>
                                </Collapse>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        mt: 1,
                                        py: 1.5,
                                        fontWeight: 700,
                                        fontSize: 16,
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #f5a623 0%, #d48b10 100%)',
                                        color: '#0c0c16',
                                        boxShadow: '0 4px 15px rgba(245, 166, 35, 0.2)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #ffb83d 0%, #e0951a 100%)',
                                            boxShadow: '0 6px 20px rgba(245, 166, 35, 0.3)',
                                            transform: 'translateY(-1px)'
                                        },
                                        '&:active': {
                                            transform: 'translateY(1px)'
                                        },
                                        '&.Mui-disabled': {
                                            background: 'rgba(0, 0, 0, 0.12)',
                                            color: 'rgba(0, 0, 0, 0.26)'
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} sx={{ color: '#0c0c16' }} /> : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
                                </Button>

                                <Divider sx={{
                                    my: 1,
                                    color: 'rgba(26, 26, 46, 0.4)',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    '&::before, &::after': { borderColor: 'rgba(0,0,0,0.06)' }
                                }}>
                                    HOẶC
                                </Divider>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<GoogleIcon sx={{ color: '#4285F4' }} />}
                                    sx={{
                                        py: 1.2,
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        color: '#1a1a2e',
                                        borderColor: 'rgba(0, 0, 0, 0.15)',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.03)',
                                            borderColor: 'rgba(245, 166, 35, 0.5)',
                                            color: '#f5a623'
                                        }
                                    }}
                                    onClick={() => {
                                        // Lưu redirect_uri vào localStorage để backend biết đường quay về (nếu cần xử lý thêm)
                                        // Hoặc backend đã cấu hình sẵn oauth2 success handler để redirect về FE
                                        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/oauth2/authorize/google?redirect_uri=${window.location.origin}/oauth2/redirect`;
                                    }}
                                >
                                    Tiếp tục với Google
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default CustomerLoginPage;
