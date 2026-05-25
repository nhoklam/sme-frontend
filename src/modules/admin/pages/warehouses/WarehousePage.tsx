import React from 'react';
import { Box, Typography } from '@mui/material';
import { Storefront } from '@mui/icons-material';
import WarehousesTab from '../settings/tabs/WarehousesTab';

const WarehousePage: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Storefront sx={{ color: '#2563eb', fontSize: 22 }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight={700} color="#1e293b">
                        Quản lý Kho / Chi nhánh
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Danh sách kho hàng và chi nhánh bán hàng trong hệ thống
                    </Typography>
                </Box>
            </Box>

            <WarehousesTab />
        </Box>
    );
};

export default WarehousePage;
