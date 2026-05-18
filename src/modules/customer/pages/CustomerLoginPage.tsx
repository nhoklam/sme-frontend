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
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
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

    return (
        <Box sx={{ 
            minHeight: 'calc(100vh - 130px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
            py: 4
        }}>
            <Container maxWidth="xs">
                <Fade in={true} timeout={800}>
                    <Paper 
                        elevation={16} 
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            bgcolor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header Area - Minimalist & Elegant */}
                        <Box sx={{ pt: 4, pb: 1, px: 3, textAlign: 'center' }}>
                            <LocalLibraryIcon sx={{ fontSize: 48, color: '#d32f2f', mb: 1 }} />
                            <Typography variant="h5" fontWeight="800" color="#2c3e50" sx={{ letterSpacing: 0.5 }}>
                                SME Bookstore
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Khám phá kho tàng tri thức
                            </Typography>
                        </Box>

                        <Tabs 
                            value={tabIndex} 
                            onChange={handleTabChange} 
                            variant="fullWidth"
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{
                                borderBottom: 1, 
                                borderColor: 'divider',
                                '& .MuiTab-root': { 
                                    textTransform: 'none', 
                                    fontWeight: 600,
                                    fontSize: 15,
                                    color: '#7f8c8d'
                                },
                                '& .Mui-selected': { 
                                    color: '#d32f2f !important' 
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#d32f2f'
                                }
                            }}
                        >
                            <Tab label="Đăng nhập" />
                            <Tab label="Đăng ký" />
                        </Tabs>

                        <Box sx={{ p: 3, pt: 4 }}>
                            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                
                                <Collapse in={!isLogin} unmountOnExit timeout={400}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField
                                            required={!isLogin}
                                            fullWidth
                                            size="small"
                                            label="Họ và tên"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Email (Tùy chọn)"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </Box>
                                </Collapse>

                                <TextField
                                    required
                                    fullWidth
                                    size={isLogin ? "medium" : "small"}
                                    label="Số điện thoại"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="VD: 0987654321"
                                />
                                <TextField
                                    required
                                    fullWidth
                                    size={isLogin ? "medium" : "small"}
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
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Collapse in={!!error}>
                                    <Typography color="error" variant="body2" sx={{ mt: 0, textAlign: 'center', fontWeight: 500 }}>
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
                                                color: '#d32f2f', 
                                                textDecoration: 'none',
                                                fontWeight: 500,
                                                '&:hover': { textDecoration: 'underline' }
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
                                        py: 1.2, 
                                        fontWeight: 700, 
                                        fontSize: 16,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        bgcolor: '#d32f2f',
                                        boxShadow: '0 4px 10px rgba(211,47,47,0.2)',
                                        '&:hover': {
                                            bgcolor: '#b71c1c',
                                            boxShadow: '0 6px 14px rgba(211,47,47,0.3)',
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
                                </Button>

                                <Divider sx={{ my: 1, color: 'text.secondary', fontSize: 13, '&::before, &::after': { borderColor: '#eeeeee' } }}>
                                    HOẶC
                                </Divider>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<GoogleIcon />}
                                    sx={{ 
                                        py: 1, 
                                        borderRadius: 2, 
                                        textTransform: 'none', 
                                        fontWeight: 600,
                                        color: '#424242',
                                        borderColor: '#e0e0e0',
                                        '&:hover': {
                                            bgcolor: '#f5f5f5',
                                            borderColor: '#bdbdbd'
                                        }
                                    }}
                                    onClick={() => alert('Tính năng đăng nhập Google đang được phát triển')}
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
