import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box, Typography,
} from '@mui/material';
import {
    Inventory2, Warning as WarningIcon, History,
} from '@mui/icons-material';
import warehouseService from '../../../../services/warehouseService';
import { Warehouse as WarehouseType } from '../../../../types';
import InventoryListTab from './tabs/InventoryListTab';
import LowStockTab from './tabs/LowStockTab';
import StockCountHistoryTab from './tabs/StockCountHistoryTab';

const InventoryPage: React.FC = () => {
    const location = useLocation();

    // Đọc tab mặc định từ router state (từ redirect của StockAlertPage)
    const initialTab = (location.state as any)?.tab ?? 0;
    const [tab, setTab] = useState<number>(initialTab);
    const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);

    // Cập nhật tab nếu navigate lại với state khác
    useEffect(() => {
        const stateTab = (location.state as any)?.tab;
        if (stateTab !== undefined) setTab(stateTab);
    }, [location.state]);

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const TAB_CONFIG = [
        { label: 'Danh sách tồn kho', icon: <Inventory2 sx={{ fontSize: 16 }} />, desc: 'Xem & điều chỉnh tồn kho' },
        { label: 'Sắp hết hàng', icon: <WarningIcon sx={{ fontSize: 16 }} />, desc: 'Cảnh báo tồn kho thấp & hết hàng' },
        { label: 'Lịch sử kiểm kho', icon: <History sx={{ fontSize: 16 }} />, desc: 'Xem lại các phiếu kiểm kho' },
    ];

    const tabComponents = [
        <InventoryListTab warehouses={warehouses} />,
        <LowStockTab warehouses={warehouses} />,
        <StockCountHistoryTab warehouses={warehouses} />,
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>
                    Dashboard /{' '}
                    <strong style={{ color: '#6b7280' }}>Quản lý tồn kho</strong>
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">
                    Quản lý Tồn kho
                </Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>
                    Xem tồn kho, cảnh báo sắp hết và kiểm kê thực tế
                </Typography>
            </Box>

            {/* Tab nav */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {TAB_CONFIG.map((t, i) => (
                    <Box
                        key={i}
                        onClick={() => setTab(i)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1.25,
                            px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer',
                            border: `1.5px solid ${tab === i ? '#1d4ed8' : '#e5e7eb'}`,
                            bgcolor: tab === i ? '#eff6ff' : '#fff',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' },
                        }}
                    >
                        <Box sx={{ color: tab === i ? '#1d4ed8' : '#6b7280' }}>{t.icon}</Box>
                        <Box>
                            <Typography fontSize={13} fontWeight={700} color={tab === i ? '#1d4ed8' : '#374151'}>
                                {t.label}
                            </Typography>
                            <Typography variant="caption" color="#9ca3af" fontSize={10.5}>
                                {t.desc}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {tabComponents[tab]}
        </Box>
    );
};

export default InventoryPage;