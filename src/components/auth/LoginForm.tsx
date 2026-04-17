// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import {
    Box, TextField, Button, InputAdornment,
    IconButton, Alert, Checkbox, FormControlLabel,
    Typography, Link,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, LoginOutlined, Person } from '@mui/icons-material';
import authService from '../../services/authService';

const IC = '#1976d2';

const LoginForm = ({ onSuccess, onError }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ username: '', password: '', rememberMe: false });

    const handleChange = (e) => {
        if (error) setError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                <Link href="#" variant="body2" underline="hover" sx={{ color: IC }}>
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
        </Box>
    );
};

export default LoginForm;