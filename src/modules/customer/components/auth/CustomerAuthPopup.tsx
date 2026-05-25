import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    TextField,
    Button,
    Typography,
    Box,
    IconButton,
    InputAdornment,
    Divider,
    Fade,
    Collapse,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import customerAuthService from '../../../../services/customerAuthService';

interface CustomerAuthPopupProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CustomerAuthPopup: React.FC<CustomerAuthPopupProps> = ({ open, onClose, onSuccess }) => {
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

    useEffect(() => {
        if (!open) {
            // Reset state when closed
            setTabIndex(0);
            setError(null);
            setPhone('');
            setPassword('');
            setFullName('');
            setEmail('');
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                const res = await customerAuthService.login(phone, password);
                if (res.success && res.data) {
                    customerAuthService.saveCustomer(res.data);
                    onSuccess();
                    onClose();
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
                    onSuccess();
                    onClose();
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
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
                    color: '#1a1a2e'
                }
            }}
            TransitionComponent={Fade}
            transitionDuration={400}
        >
            {/* Header / Brand Area */}
            <Box sx={{ 
                pt: 4, 
                pb: 2, 
                px: 3, 
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.1) 0%, #ffffff 100%)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
                <IconButton 
                    onClick={onClose} 
                    size="small" 
                    sx={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        color: 'rgba(0,0,0,0.4)', 
                        '&:hover': { color: '#f5a623' } 
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Box textAlign="center" mb={2}>
                    <Box sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'rgba(245, 166, 35, 0.12)',
                        border: '1px solid rgba(245, 166, 35, 0.25)',
                        mb: 1.5,
                        boxShadow: '0 2px 8px rgba(245, 166, 35, 0.05)'
                    }}>
                        <AutoStoriesIcon sx={{ fontSize: 28, color: '#f5a623' }} />
                    </Box>
                    <Typography variant="h5" fontWeight="800" sx={{ 
                        letterSpacing: '1px', 
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
                        '& .MuiTab-root': { 
                            color: 'rgba(26, 26, 46, 0.5)', 
                            textTransform: 'none', 
                            fontWeight: 600,
                            fontSize: 15,
                            transition: 'all 0.3s',
                            py: 1.5
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
            </Box>

            <DialogContent sx={{ p: 4, pb: 5 }}>
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
                        onClick={() => alert('Tính năng đăng nhập Google đang được phát triển')}
                    >
                        Tiếp tục với Google
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CustomerAuthPopup;
