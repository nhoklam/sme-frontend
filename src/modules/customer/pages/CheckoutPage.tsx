import React from 'react';
import { Box, Typography } from '@mui/material';

const CheckoutPage: React.FC = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={700}>Thanh toán</Typography>
        <Typography color="text.secondary" mt={1}>Tính năng đang phát triển</Typography>
    </Box>
);

export default CheckoutPage;