// src/pages/auth/LoginPage.tsx - CẬP NHẬT redirect cho cashier
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Paper, Typography } from '@mui/material';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage = () => {
    const navigate = useNavigate();

    const handleLoginSuccess = (user: any) => {
        switch (user?.role) {
            case 'ROLE_ADMIN':
            case 'ROLE_MANAGER':
                navigate('/admin/dashboard', { replace: true });
                break;
            case 'ROLE_CASHIER':
                // Cashier vào thẳng POS
                navigate('/admin/pos', { replace: true });
                break;
            default:
                navigate('/', { replace: true });
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={10} sx={{ p: 4, borderRadius: 3, background: 'white' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 56, height: 56, borderRadius: 2,
                        bgcolor: '#1976d2', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                    }}>
                        <Typography fontSize={28}>🛒</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="#1a1a2e" mb={0.5}>
                        SME ERP & POS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Đăng nhập vào hệ thống quản lý
                    </Typography>
                </Box>
                <LoginForm onSuccess={handleLoginSuccess} onError={undefined} />
            </Paper>
        </Container>
    );
};

export default LoginPage;