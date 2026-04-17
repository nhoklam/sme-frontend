import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Paper, Typography, Button } from '@mui/material';
import { LockOutlined, ArrowBack } from '@mui/icons-material';

const RegisterPage = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Paper elevation={10} sx={{ p: 5, borderRadius: 3, textAlign: 'center' }}>
                <Box sx={{
                    width: 64, height: 64, borderRadius: '50%',
                    bgcolor: '#ffebee', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 3,
                }}>
                    <LockOutlined sx={{ fontSize: 32, color: '#d32f2f' }} />
                </Box>

                <Typography variant="h5" fontWeight={700} color="#1a1a2e" mb={1}>
                    Đăng ký không khả dụng
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3} sx={{ lineHeight: 1.8 }}>
                    Hệ thống SME ERP &amp; POS không cho phép đăng ký tài khoản công khai.<br />
                    Vui lòng liên hệ Quản trị viên để được cấp tài khoản.
                </Typography>

                <Box sx={{ p: 2.5, bgcolor: '#f8f9fb', borderRadius: 2, mb: 3, textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight={700} color="#333" mb={1}>
                        Thông tin liên hệ:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        📧 admin@sme.vn<br />
                        📞 0367 287 044<br />
                        🏢 Quản trị viên hệ thống
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/login')}
                    sx={{
                        bgcolor: '#1976d2', textTransform: 'none',
                        fontWeight: 700, px: 4, py: 1.2,
                        '&:hover': { bgcolor: '#1565c0' },
                    }}
                >
                    Quay lại Đăng nhập
                </Button>
            </Paper>
        </Container>
    );
};

export default RegisterPage;