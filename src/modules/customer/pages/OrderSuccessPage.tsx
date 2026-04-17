import React from 'react';
import { Box, Typography } from '@mui/material';

const OrderSuccessPage: React.FC = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography fontSize={64}>🎉</Typography>
        <Typography variant="h5" fontWeight={700} mt={2}>Đặt hàng thành công!</Typography>
        <Typography color="text.secondary" mt={1}>Cảm ơn bạn đã mua hàng</Typography>
    </Box>
);

export default OrderSuccessPage;