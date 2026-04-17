import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Alert,
    Typography,
    Link,
    Divider,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Email,
    Lock,
    Person,
    Phone,
    HowToReg,
} from '@mui/icons-material';
import axiosInstance from '../../services/axiosConfig';

const IC = '#d32f2f';

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        '&:hover fieldset': { borderColor: IC },
        '&.Mui-focused fieldset': { borderColor: IC },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: IC },
};

const RegisterForm = ({ onSuccess, onError }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        username: '', fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    });

    const handleChange = (e) => {
        if (error) setError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        if (!formData.username.trim() || formData.username.trim().length < 3)
            return setError('Tên đăng nhập phải có ít nhất 3 ký tự'), false;
        if (!formData.fullName.trim())
            return setError('Vui lòng nhập họ và tên'), false;
        if (!formData.phone.trim())
            return setError('Vui lòng nhập số điện thoại'), false;
        if (!formData.password || formData.password.length < 6)
            return setError('Mật khẩu phải có ít nhất 6 ký tự'), false;
        if (formData.password !== formData.confirmPassword)
            return setError('Mật khẩu xác nhận không khớp'), false;
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setError('');
        try {
            await axiosInstance.post('/auth/register', {
                username: formData.username.trim(),
                fullName: formData.fullName.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim(),
                password: formData.password,
            });
            setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
            if (onSuccess) onSuccess(formData);
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại sau.';
            setError(msg);
            if (onError) onError(msg);
        } finally {
            setLoading(false);
        }
    };

    const commonProps = {
        fullWidth: true,
        size: 'small',
        margin: 'normal',
        onChange: handleChange,
        sx: fieldSx,
    };

    const iconAdornment = (Icon) => ({
        startAdornment: (
            <InputAdornment position="start">
                <Icon sx={{ color: IC, fontSize: 18 }} />
            </InputAdornment>
        ),
    });

    const pwAdornment = (show, toggle) => ({
        startAdornment: (
            <InputAdornment position="start">
                <Lock sx={{ color: IC, fontSize: 18 }} />
            </InputAdornment>
        ),
        endAdornment: (
            <InputAdornment position="end">
                <IconButton size="small" onClick={toggle} edge="end">
                    {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
            </InputAdornment>
        ),
    });

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>{success}</Alert>}

            <TextField {...commonProps}
                label="Tên đăng nhập" name="username" value={formData.username}
                required autoComplete="username"
                error={!!error && formData.username.trim().length < 3}
                InputProps={iconAdornment(Person)}
            />
            <TextField {...commonProps}
                label="Họ và tên" name="fullName" value={formData.fullName}
                required
                error={!!error && !formData.fullName.trim()}
                InputProps={iconAdornment(Person)}
            />
            <TextField {...commonProps}
                label="Số điện thoại" name="phone" value={formData.phone}
                required
                error={!!error && !formData.phone.trim()}
                InputProps={iconAdornment(Phone)}
            />
            <TextField {...commonProps}
                label="Email" name="email" type="email" value={formData.email}
                InputProps={iconAdornment(Email)}
            />
            <TextField {...commonProps}
                label="Mật khẩu" name="password"
                type={showPassword ? 'text' : 'password'} value={formData.password}
                required autoComplete="new-password"
                error={!!error && formData.password.length < 6}
                helperText="Ít nhất 6 ký tự"
                InputProps={pwAdornment(showPassword, () => setShowPassword(!showPassword))}
            />
            <TextField {...commonProps}
                label="Xác nhận mật khẩu" name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                required autoComplete="new-password"
                error={!!error && formData.password !== formData.confirmPassword}
                InputProps={pwAdornment(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
                sx={{ ...fieldSx, mb: 1 }}
            />

            <Button
                type="submit" fullWidth variant="contained"
                disabled={loading} startIcon={<HowToReg />}
                sx={{
                    mt: 1, py: 1.5,
                    bgcolor: IC,
                    '&:hover': { bgcolor: '#b71c1c' },
                    textTransform: 'none', fontWeight: 600,
                }}
            >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>

            <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">Hoặc</Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Đã có tài khoản?{' '}
                    <Link href="/login" underline="hover" sx={{ fontWeight: 600, color: IC }}>
                        Đăng nhập ngay
                    </Link>
                </Typography>
            </Box>
        </Box>
    );
};

export default RegisterForm;