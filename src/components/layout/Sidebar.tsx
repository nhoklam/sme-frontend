import React, { useState } from 'react';
import {
    List, ListItemButton, ListItemIcon, ListItemText, Divider, Box,
    Typography, Collapse, Chip
} from '@mui/material';
import {
    Dashboard, Inventory, ShoppingCart, People, Assessment, Settings,
    PointOfSale, Category, Warehouse, SwapHoriz, LocalShipping, ExpandLess,
    ExpandMore, AttachMoney, Warning, History, ManageAccounts, Notifications,
    Security, TrendingUp, Business, Assignment, Logout, LocalOffer
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const menuSections = [
    {
        section: 'MODULE 0',
        items: [
            { text: 'Bán hàng (POS)', icon: <PointOfSale />, path: '/admin/pos' },
        ]
    },
    {
        section: 'QUẢN LÝ',
        items: [
            { text: 'Tổng quan', icon: <Dashboard />, path: '/admin/dashboard' },
            { text: 'Đơn hàng', icon: <ShoppingCart />, path: '/admin/orders' },
            { text: 'Sản phẩm', icon: <Inventory />, path: '/admin/products' },
            { text: 'Danh mục', icon: <Category />, path: '/admin/categories' },
            { text: 'Khuyến mãi', icon: <LocalOffer />, path: '/admin/promotions' },
        ]
    },
    {
        section: 'KHO',
        items: [
            { text: 'Tồn kho', icon: <Warehouse />, path: '/admin/inventory' },
            { text: 'Nhập kho', icon: <LocalShipping />, path: '/admin/inventory/import' },
            { text: 'Chuyển kho', icon: <SwapHoriz />, path: '/admin/inventory/transfer' },
            { text: 'Cảnh báo tồn kho', icon: <Warning />, path: '/admin/inventory/alerts' },
            { text: 'Lịch sử kho', icon: <History />, path: '/admin/inventory/history' },
        ]
    },
    {
        section: 'ĐỐI TÁC',
        items: [
            { text: 'Khách hàng', icon: <People />, path: '/admin/customers' },
            { text: 'Nhà cung cấp', icon: <Business />, path: '/admin/suppliers' },
        ]
    },
    {
        section: 'TÀI CHÍNH',
        items: [
            { text: 'Sổ quỹ & Công nợ', icon: <AttachMoney />, path: '/admin/finance' },
            { text: 'Báo cáo', icon: <Assessment />, path: '/admin/reports' },
            { text: 'Doanh thu', icon: <TrendingUp />, path: '/admin/reports/revenue' },
            { text: 'Phân tích khách hàng', icon: <People />, path: '/admin/reports/customers' },
        ]
    },
    {
        section: 'HỆ THỐNG',
        items: [
            { text: 'Quản lý người dùng', icon: <ManageAccounts />, path: '/admin/users' },
            { text: 'Quản lý kho/Chi nhánh', icon: <Warehouse />, path: '/admin/warehouses' },
            { text: 'Phân quyền', icon: <Security />, path: '/admin/users/roles' },
            { text: 'Thông báo', icon: <Notifications />, path: '/admin/notifications' },
            { text: 'Nhật ký hệ thống', icon: <Assignment />, path: '/admin/audit-logs' },
            { text: 'Cài đặt', icon: <Settings />, path: '/admin/settings' },
        ]
    },
];

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const currentUser = authService.getCurrentUser()?.user;
    const userRole = currentUser?.role || '';

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    const toggleMenu = (text: string) => {
        setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
    };

    const canAccess = (path: string) => {
        if (userRole === 'ROLE_ADMIN') return true;
        if (userRole === 'ROLE_MANAGER') {
            const restricted = ['/admin/users', '/admin/audit-logs', '/admin/settings'];
            return !restricted.some(r => path.startsWith(r));
        }
        if (userRole === 'ROLE_CASHIER') {
            const allowed = ['/admin/pos'];
            return allowed.some(a => path.startsWith(a));
        }
        return false;
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* User info */}
            <Box sx={{ px: 2, py: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f9f9f9' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                    Đăng nhập với tư cách
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#2563eb" noWrap>
                    {currentUser?.fullName || 'Admin'}
                </Typography>
                <Chip
                    label={
                        userRole === 'ROLE_ADMIN' ? 'Quản trị viên' :
                            userRole === 'ROLE_MANAGER' ? 'Quản lý' : 'Thu ngân'
                    }
                    size="small"
                    sx={{
                        mt: 0.5, height: 18, fontSize: 10,
                        bgcolor: userRole === 'ROLE_ADMIN' ? '#eff6ff' : '#f3e5f5',
                        color: userRole === 'ROLE_ADMIN' ? '#2563eb' : '#6a1b9a',
                        fontWeight: 700,
                    }}
                />
            </Box>

            <Box sx={{ flex: 1, py: 1 }}>
                {menuSections.map((section) => {
                    const visibleItems = section.items.filter(item => canAccess(item.path));
                    if (visibleItems.length === 0) return null;
                    return (
                        <Box key={section.section}>
                            <Typography
                                variant="caption"
                                sx={{
                                    px: 2, py: 0.75, display: 'block',
                                    color: '#aaa', fontWeight: 700, fontSize: 10, letterSpacing: 0.8
                                }}
                            >
                                {section.section}
                            </Typography>
                            <List dense sx={{ py: 0 }}>
                                {visibleItems.map((item: any) => {
                                    const active = isActive(item.path);
                                    if (item.children) {
                                        const isOpen = openMenus[item.text];
                                        return (
                                            <React.Fragment key={item.text}>
                                                <ListItemButton
                                                    onClick={() => toggleMenu(item.text)}
                                                    sx={{
                                                        mx: 1, borderRadius: 1.5, mb: 0.25,
                                                        bgcolor: active ? '#eff6ff' : 'transparent',
                                                        '&:hover': { bgcolor: '#f1f5f9' },
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36, color: active ? '#2563eb' : '#666' }}>
                                                        {item.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={item.text}
                                                        primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 600 : 400 }}
                                                    />
                                                    {isOpen ? <ExpandLess sx={{ fontSize: 16, color: '#999' }} /> : <ExpandMore sx={{ fontSize: 16, color: '#999' }} />}
                                                </ListItemButton>
                                                <Collapse in={isOpen}>
                                                    <List dense sx={{ pl: 4 }}>
                                                        {item.children.map((child: any) => (
                                                            <ListItemButton
                                                                key={child.path}
                                                                onClick={() => navigate(child.path)}
                                                                sx={{
                                                                    mx: 1, borderRadius: 1.5, mb: 0.25,
                                                                    bgcolor: location.pathname === child.path ? '#eff6ff' : 'transparent',
                                                                    '&:hover': { bgcolor: '#f1f5f9' },
                                                                }}
                                                            >
                                                                <ListItemText
                                                                    primary={child.text}
                                                                    primaryTypographyProps={{
                                                                        fontSize: 12,
                                                                        fontWeight: location.pathname === child.path ? 600 : 400,
                                                                        color: location.pathname === child.path ? '#2563eb' : '#555',
                                                                    }}
                                                                />
                                                            </ListItemButton>
                                                        ))}
                                                    </List>
                                                </Collapse>
                                            </React.Fragment>
                                        );
                                    }
                                    return (
                                        <ListItemButton
                                            key={item.text}
                                            onClick={() => navigate(item.path)}
                                            sx={{
                                                mx: 1, borderRadius: 1.5, mb: 0.25,
                                                bgcolor: active ? '#eff6ff' : 'transparent',
                                                '&:hover': { bgcolor: '#f1f5f9' },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36, color: active ? '#2563eb' : '#666' }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.text}
                                                primaryTypographyProps={{
                                                    fontSize: 13,
                                                    fontWeight: active ? 600 : 400,
                                                    color: active ? '#2563eb' : '#333',
                                                }}
                                            />
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        </Box>
                    );
                })}
            </Box>

            <Divider />
            <List dense sx={{ py: 1, mb: 1 }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        mx: 1, borderRadius: 1.5,
                        '&:hover': { bgcolor: '#ffebee', '& .MuiListItemIcon-root': { color: '#d32f2f' } },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 36, color: '#999' }}><Logout /></ListItemIcon>
                    <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontSize: 13 }} />
                </ListItemButton>
            </List>
        </Box>
    );
};

export default Sidebar;