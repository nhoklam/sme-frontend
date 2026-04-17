// src/modules/customer/components/Home/PromotionBanner.jsx
import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const PromotionBanner = () => (
    <Box sx={{
        background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
        borderRadius: 3, p: 4, mb: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 2,
    }}>
        <Box>
            <Typography variant="h5" fontWeight={900} color="#fff">
                🎉 Flash Sale mỗi ngày 12h & 20h
            </Typography>
            <Typography color="rgba(255,255,255,0.85)">
                Giảm đến 70% — Số lượng có hạn!
            </Typography>
        </Box>
        <Button variant="contained" sx={{
            bgcolor: '#fff', color: '#d32f2f', fontWeight: 800,
            textTransform: 'none', px: 4, py: 1.5, borderRadius: 2,
            '&:hover': { bgcolor: '#ffebee' },
        }}>
            Săn ngay
        </Button>
    </Box>
);

export default PromotionBanner;