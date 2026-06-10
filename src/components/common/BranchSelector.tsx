import React, { useEffect, useState } from 'react';
import { Box, Typography, Menu, MenuItem, Button, CircularProgress } from '@mui/material';
import { Storefront, KeyboardArrowDown } from '@mui/icons-material';
import axiosInstance from '../../services/axiosConfig';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

interface Warehouse {
    id: string;
    name: string;
}

const BranchSelector: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(false);

    const currentUser = authService.getCurrentUser()?.user;
    const currentWarehouseId = currentUser?.warehouseId;

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await axiosInstance.get('/warehouses/active');
                setWarehouses(res.data.data || []);
            } catch (err) {
                console.error("Lỗi tải danh sách chi nhánh:", err);
            }
        };
        fetchWarehouses();
    }, []);

    const currentWarehouseName = currentWarehouseId
        ? warehouses.find(w => w.id === currentWarehouseId)?.name || 'Chi nhánh...'
        : 'Tất cả chi nhánh (Toàn hệ thống)';

    const handleSwitch = async (warehouseId: string | null) => {
        // Nếu đang chọn kho hiện tại thì bỏ qua
        const normalizedCurrent = currentWarehouseId || null;
        const normalizedNew = warehouseId || null;
        if (normalizedNew === normalizedCurrent) {
            setAnchorEl(null);
            return;
        }

        try {
            setSwitching(true);
            setAnchorEl(null);
            await authService.switchBranch(warehouseId);
            toast.success('Chuyển chi nhánh thành công! Đang tải lại...');
            setTimeout(() => window.location.reload(), 800);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Lỗi khi chuyển chi nhánh';
            toast.error(msg);
            console.error('[BranchSelector] switchBranch error:', error.response?.data);
        } finally {
            setSwitching(false);
        }
    };

    // For non-admin users (Manager, Cashier), they cannot switch branches, 
    // but we should elegantly display their assigned branch.
    if (currentUser?.role !== 'ROLE_ADMIN') {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    mr: 2,
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)',
                }}
            >
                <Storefront sx={{ color: '#2563eb', fontSize: 18, mr: 1 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="caption" sx={{ fontSize: 9, color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '0.5px' }}>
                        Chi nhánh làm việc
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, color: '#1e3a8a', lineHeight: 1.2, mt: 0.25 }}>
                        {currentWarehouseName}
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <>
            <Button
                color="inherit"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                    textTransform: 'none',
                    bgcolor: '#f5f5f5',
                    color: '#333',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    mr: 2,
                    '&:hover': { bgcolor: '#e0e0e0' }
                }}
                disabled={switching}
                startIcon={<Storefront sx={{ color: '#1976d2' }} />}
                endIcon={switching ? <CircularProgress size={16} /> : <KeyboardArrowDown />}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: 10, color: '#666', lineHeight: 1 }}>
                        Chi nhánh làm việc
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                        {currentWarehouseName}
                    </Typography>
                </Box>
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: { minWidth: 240, mt: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
                }}
            >
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #f0f0f0', bgcolor: '#f9f9f9' }}>
                    <Typography variant="caption" fontWeight={700} color="#666">
                        CHỌN CHI NHÁNH
                    </Typography>
                </Box>

                <MenuItem
                    selected={currentWarehouseId === null}
                    onClick={() => handleSwitch(null)}
                    sx={{ py: 1.5 }}
                >
                    <Typography variant="body2" fontWeight={currentWarehouseId === null ? 700 : 400} color={currentWarehouseId === null ? '#1976d2' : 'inherit'}>
                        🏢 Tất cả chi nhánh (Toàn hệ thống)
                    </Typography>
                </MenuItem>

                {warehouses.map(w => (
                    <MenuItem
                        key={w.id}
                        selected={currentWarehouseId === w.id}
                        onClick={() => handleSwitch(w.id)}
                        sx={{ py: 1.5 }}
                    >
                        <Typography variant="body2" fontWeight={currentWarehouseId === w.id ? 700 : 400} color={currentWarehouseId === w.id ? '#1976d2' : 'inherit'}>
                            📍 {w.name}
                        </Typography>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default BranchSelector;
