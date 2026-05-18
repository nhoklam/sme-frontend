// src/modules/admin/pages/inventory/StockAlertPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const StockAlertPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect về InventoryPage, tab index 1 = "Sắp hết hàng"
        // State { tab: 1 } được đọc bởi InventoryPage để khởi tạo tab mặc định
        navigate('/admin/inventory', { replace: true, state: { tab: 1 } });
    }, [navigate]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">Đang chuyển hướng...</Typography>
        </Box>
    );
};

export default StockAlertPage;


// ══════════════════════════════════════════════════════════════
// OPTION B: Nếu muốn giữ trang độc lập — xóa component trên,
// uncomment và export StandaloneAlertPage bên dưới.
// ══════════════════════════════════════════════════════════════

// import { useQuery } from '@tanstack/react-query';
// import { IconButton } from '@mui/material';
// import { ArrowBack } from '@mui/icons-material';
// import warehouseService from '../../../../services/warehouseService';
// import LowStockTab from './tabs/LowStockTab';
//
// const StandaloneAlertPage: React.FC = () => {
//     const navigate = useNavigate();
//     const { data: warehouses = [] } = useQuery({
//         queryKey: ['warehouses'],
//         queryFn: warehouseService.getAll,
//     });
//     return (
//         <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
//                 <IconButton size="small" onClick={() => navigate('/admin/inventory')}
//                     sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
//                     <ArrowBack sx={{ fontSize: 18 }} />
//                 </IconButton>
//                 <Box>
//                     <Typography variant="caption" color="#aaa" fontSize={11}>
//                         Kho / <strong style={{ color: '#555' }}>Cảnh báo tồn kho</strong>
//                     </Typography>
//                     <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.25}>
//                         Cảnh báo sắp hết hàng
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary" fontSize={12}>
//                         Danh sách sản phẩm có tồn kho dưới định mức tối thiểu
//                     </Typography>
//                 </Box>
//             </Box>
//             <LowStockTab warehouses={warehouses} />
//         </Box>
//     );
// };
// export default StandaloneAlertPage;