// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { CartProvider } from '../store/CartContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CartDrawer from '../modules/customer/components/cart/CartDrawer';

const MainLayout = () => (
    <CartProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Box component="main" sx={{ flex: 1, bgcolor: '#f5f5f5' }}>
                <Outlet />
            </Box>
            <Footer />
        </Box>
        <CartDrawer />
    </CartProvider>
);

export default MainLayout;