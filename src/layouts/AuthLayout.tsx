import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

const AuthLayout = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
            }}
        >
            <Outlet />
        </Box>
    );
};

export default AuthLayout;