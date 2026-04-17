import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { Inventory2Outlined, Warning } from '@mui/icons-material';
import warehouseService from '../../../../services/warehouseService';
import { Warehouse } from '../../../../types';
import InventoryListTab from './tabs/InventoryListTab';
import LowStockTab from './tabs/LowStockTab';

const TabPanel: React.FC<{ value: number; index: number; children: React.ReactNode }> = ({ value, index, children }) =>
    value === index ? <Box>{children}</Box> : null;

const InventoryPage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="#aaa" fontSize={11}>
                    Dashboard / <strong style={{ color: '#555' }}>Kho</strong>
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>
                    Quản lý Tồn kho
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize={12}>
                    Xem, điều chỉnh tồn kho và nhận cảnh báo hàng tồn thấp
                </Typography>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: '1px solid #eee', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 0, px: 2.5, color: '#888' },
                        '& .Mui-selected': { color: '#1976d2 !important', fontWeight: 700 },
                        '& .MuiTabs-indicator': { bgcolor: '#1976d2', height: 2 },
                    }}>
                    <Tab icon={<Inventory2Outlined sx={{ fontSize: 16 }} />} iconPosition="start" label="Tồn kho" />
                    <Tab icon={<Warning sx={{ fontSize: 16 }} />} iconPosition="start" label="Cảnh báo tồn thấp" />
                </Tabs>
            </Box>

            <TabPanel value={tab} index={0}>
                <InventoryListTab warehouses={warehouses} />
            </TabPanel>
            <TabPanel value={tab} index={1}>
                <LowStockTab warehouses={warehouses} />
            </TabPanel>
        </Box>
    );
};

export default InventoryPage;