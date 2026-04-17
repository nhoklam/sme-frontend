import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SystemSettingsPage = () => {
    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                Cài đặt hệ thống
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                    Đây là trang cài đặt hệ thống
                </Typography>
            </Paper>
        </Box>
    );
};

export default SystemSettingsPage;