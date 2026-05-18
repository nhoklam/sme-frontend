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
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
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

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                    bgcolor: '#ffffff'
                }
            }}
            TransitionComponent={Fade}
            transitionDuration={400}
        >
            {/* Header / Brand Area */}
            <Box sx={{ 
                bgcolor: '#d32f2f', 
                color: 'white', 
                pt: 4, 
                pb: 2, 
                px: 3, 
                position: 'relative',
                background: 'linear-gradient(135deg, #d32f2f 0%, #9a0007 100%)'
            }}>
                <IconButton 
                    onClick={onClose} 
                    size="small" 
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
                >
                    <CloseIcon />
                </IconButton>
                <Box textAlign="center" mb={2}>
                    <LocalLibraryIcon sx={{ fontSize: 48, mb: 1, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
                    <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: 0.5 }}>
                        SME Bookstore
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                        Khám phá kho tàng tri thức
                    </Typography>
                </Box>

                <Tabs 
                    value={tabIndex} 
                    onChange={handleTabChange} 
                    variant="fullWidth"
                    TabIndicatorProps={{
                        sx: { bgcolor: 'white', height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 }
                    }}
                    sx={{
                        minHeight: 40,
                        '& .MuiTab-root': { 
                            color: 'rgba(255,255,255,0.7)', 
                            textTransform: 'none', 
                            fontWeight: 600,
                            fontSize: 15,
                            transition: 'all 0.3s'
                        },
                        '& .Mui-selected': { color: '#ffffff !important' }
                    }}
                >
                    <Tab label="Đăng nhập" />
                    <Tab label="Đăng ký" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 4, pb: 5 }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    
                    <Collapse in={!isLogin} unmountOnExit timeout={400}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                            <TextField
                                required={!isLogin}
                                fullWidth
                                label="Họ và tên"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                fullWidth
                                label="Email (Tùy chọn)"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                        required
                        fullWidth
                        label="Mật khẩu"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                        <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center', fontWeight: 500, bgcolor: '#ffebee', p: 1, borderRadius: 1 }}>
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
                            borderRadius: 2,
                            textTransform: 'none',
                            bgcolor: '#d32f2f',
                            boxShadow: '0 8px 16px rgba(211,47,47,0.2)',
                            transition: 'all 0.3s',
                            '&:hover': {
                                bgcolor: '#b71c1c',
                                boxShadow: '0 12px 20px rgba(211,47,47,0.3)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
                    </Button>

                    <Divider sx={{ my: 2, color: 'text.secondary', fontSize: 13, '&::before, &::after': { borderColor: '#eeeeee' } }}>
                        HOẶC
                    </Divider>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        sx={{ 
                            py: 1.2, 
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
            </DialogContent>
        </Dialog>
    );
};

export default CustomerAuthPopup;
