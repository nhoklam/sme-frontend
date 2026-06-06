import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import { authApi } from '../../services/authApi';
import customerAuthService from '../../services/customerAuthService';

const OAuth2RedirectHandler: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const calledRef = useRef(false);

    useEffect(() => {
        if (calledRef.current) return;
        calledRef.current = true;

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            toast.error(error || 'Đăng nhập Google thất bại');
            navigate('/login');
            return;
        }

        if (code) {
            authApi.exchangeOAuth2Token(code)
                .then(res => {
                    const data = res.data;
                    if (data && data.accessToken) {
                        // Lưu thông tin người dùng vào LocalStorage
                        customerAuthService.saveCustomer(data);
                        toast.success('Đăng nhập Google thành công!');
                        navigate('/');
                    } else {
                        toast.error('Không nhận được token từ server');
                        navigate('/login');
                    }
                })
                .catch(err => {
                    toast.error(err.response?.data?.message || 'Lỗi xác thực Google');
                    navigate('/login');
                });
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f8f9fa'
        }}>
            <CircularProgress size={48} thickness={4} sx={{ color: '#f5a623', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
                Đang xác thực đăng nhập Google...
            </Typography>
        </Box>
    );
};

export default OAuth2RedirectHandler;
