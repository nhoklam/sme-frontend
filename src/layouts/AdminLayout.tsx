// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    Box, AppBar, Toolbar, Typography, IconButton,
    Drawer, Avatar, Menu, MenuItem, Divider,
    Badge, Tooltip, useTheme, useMediaQuery, Button
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout, AccountCircle, Settings,
    Notifications, ChevronLeft,
} from '@mui/icons-material';
import Sidebar from '../components/layout/Sidebar';
import BranchSelector from '../components/common/BranchSelector';
import authService from '../services/authService';
import { notificationService, Notification } from '../services/notificationService';
import warehouseService from '../services/warehouseService';
import { useWebSocket, WsPayload } from '../store/hooks/useWebSocket';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import AIChatWidget from '../components/common/AIChatWidget';

/**
 * Render message thân thiện từ payload:
 * - Ưu tiên payload.warehouseName (records mới)
 * - Nếu không có, tra cứu warehouseMap theo warehouseId (records cũ)
 */
const renderNotifMessage = (notif: Notification, warehouseMap: Map<string, string>): string => {
    if (notif.type === 'LOW_STOCK' && notif.payload?.productName) {
        const product = notif.payload.productName;
        let warehousePart = '';
        if (notif.payload.warehouseName) {
            warehousePart = ` tại kho '${notif.payload.warehouseName}'`;
        } else if (notif.payload.warehouseId) {
            const wid = String(notif.payload.warehouseId);
            const name = warehouseMap.get(wid);
            warehousePart = name
                ? ` tại kho '${name}'`
                : ` tại kho (${wid.slice(0, 8)}...)`;
        }
        const qty = notif.payload.quantity;
        const qtyText = qty != null ? ` — còn lại ${qty} sản phẩm` : '';
        return `Sản phẩm '${product}'${warehousePart} sắp hết hàng${qtyText}`;
    }
    return notif.message;
};

const DRAWER_WIDTH = 256;
const DRAWER_MINI = 0;

const AdminLayout = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const [profileTrigger, setProfileTrigger] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState('');

    const currentUser = React.useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const trigger = profileTrigger;
        return authService.getCurrentUser()?.user;
    }, [profileTrigger]);

    const displayName = currentUser?.fullName || currentUser?.username || 'Admin';
    const role = currentUser?.role || '';
    const roleLabel = role === 'ROLE_ADMIN' ? 'Admin' : role === 'ROLE_MANAGER' ? 'Quản lý' : 'Thu ngân';

    const loadAvatar = React.useCallback(() => {
        const userObj = authService.getCurrentUser()?.user;
        if (userObj?.username) {
            setAvatarUrl(localStorage.getItem('avatar_' + userObj.username) || '');
        } else {
            setAvatarUrl('');
        }
    }, []);

    React.useEffect(() => {
        loadAvatar();
        const handler = () => {
            setProfileTrigger(prev => prev + 1);
            loadAvatar();
        };
        window.addEventListener('user-profile-updated', handler);
        return () => window.removeEventListener('user-profile-updated', handler);
    }, [loadAvatar, currentUser?.username]);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const [warehouseMap, setWarehouseMap] = useState<Map<string, string>>(new Map());

    // Fetch danh sách kho một lần — để resolve warehouseId cũ thành tên kho
    React.useEffect(() => {
        warehouseService.getAll()
            .then(warehouses => {
                const map = new Map<string, string>();
                warehouses.forEach(w => { if (w.id) map.set(w.id, w.name); });
                setWarehouseMap(map);
            })
            .catch(() => { /* Fallback an toàn */ });
    }, []);

    const loadNotifications = async () => {
        try {
            // Lấy 10 thông báo mới nhất (cả đã đọc và chưa đọc)
            const res = await notificationService.getAll({ page: 0, size: 10 });
            setNotifications(res.data?.data?.content || []);

            // Vẫn đếm số lượng chưa đọc để hiện ở Badge chuông
            const countRes = await notificationService.countUnread();
            setUnreadCount(countRes.data?.data || 0);
        } catch { }
    };

    React.useEffect(() => {
        if (currentUser) {
            loadNotifications();
        }
    }, [currentUser]);

    useWebSocket({
        warehouseId: currentUser?.warehouseId,
        onMessage: (payload: WsPayload) => {
            setUnreadCount(prev => prev + 1);
            loadNotifications();

            // Hiện Pop-up ngay trên màn hình
            switch (payload.type) {
                case 'NEW_ORDER':
                    toast(`Đơn hàng mới: ${payload.orderCode}`, { icon: '🛒', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                    break;
                case 'IMPORT_SUCCESS':
                    toast.success(`Nhập kho thành công: ${payload.orderCode}`);
                    break;
                case 'LOW_STOCK':
                    toast.error(`Sắp hết hàng: ${payload.productName}`, { icon: '⚠️' });
                    break;
                case 'OUT_OF_STOCK':
                    toast.error(`Hết hàng: ${payload.productName}`, { icon: '🛑' });
                    break;
                case 'TRANSFER_ARRIVED':
                    toast(`Có phiếu chuyển kho mới`, { icon: '📦' });
                    break;
                case 'SHIFT_PENDING_APPROVAL':
                    toast(`Có ca làm việc cần duyệt`, { icon: '🔒' });
                    break;
            }
        },
        enabled: !!currentUser,
    });

    const handleMarkAsRead = async (notif: Notification) => {
        try {
            if (!notif.isRead) {
                await notificationService.markAsRead(notif.id);
                loadNotifications();
            }

            setNotifAnchorEl(null);

            // Điều hướng dựa trên loại thông báo
            if (notif.type === 'LOW_STOCK') {
                navigate('/admin/inventory/import');
            } else if (notif.type === 'TRANSFER_ARRIVED') {
                navigate('/admin/inventory/transfer');
            } else if (notif.type === 'NEW_ORDER' && notif.payload?.orderId) {
                navigate(`/admin/orders/${notif.payload.orderId}`);
            }
        } catch { }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            loadNotifications();
            setNotifAnchorEl(null);
        } catch { }
    };

    const handleLogout = () => {
        authService.logout();
        queryClient.clear();
        navigate('/admin/login', { replace: true });
    };

    if (location.pathname.includes('/pos')) {
        return <Outlet />;
    }

    return (
        <Box sx={{ display: 'flex' }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: '#fff',
                    color: '#333',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    width: isMobile ? '100%' : `calc(100% - ${open ? DRAWER_WIDTH : 64}px)`,
                    ml: isMobile ? 0 : `${open ? DRAWER_WIDTH : 64}px`,
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar sx={{ minHeight: '56px !important' }}>
                    <IconButton color="inherit" onClick={() => setOpen(!open)} edge="start" sx={{ mr: 2 }}>
                        {open && !isMobile ? <ChevronLeft /> : <MenuIcon />}
                    </IconButton>

                    {/* Brand (show when sidebar closed) */}
                    {(!open || isMobile) && (
                        <Typography variant="subtitle1" fontWeight={800} color="#2563eb" sx={{ mr: 2 }}>
                            SME ERP & POS
                        </Typography>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Right actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BranchSelector />

                        <Tooltip title="Thông báo">
                            <IconButton size="small" sx={{ color: '#666' }} onClick={e => setNotifAnchorEl(e.currentTarget)}>
                                <Badge badgeContent={unreadCount} color="error" max={99}>
                                    <Notifications sx={{ fontSize: 22 }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        {/* Notifications Dropdown */}
                        <Menu
                            anchorEl={notifAnchorEl} open={Boolean(notifAnchorEl)} onClose={() => setNotifAnchorEl(null)}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{ sx: { width: 360, maxHeight: 500, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mt: 1, p: 0 } }}
                        >
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', bgcolor: '#f8fafc' }}>
                                <Typography fontWeight={700} fontSize={15} color="#0f172a">Thông báo mới</Typography>
                                {unreadCount > 0 && (
                                    <Typography variant="caption" sx={{ cursor: 'pointer', color: '#3b82f6', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }} onClick={handleMarkAllAsRead}>
                                        Đánh dấu tất cả đã đọc
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Notifications sx={{ fontSize: 40, color: '#e2e8f0', mb: 1 }} />
                                        <Typography variant="body2" color="#64748b">Bạn không có thông báo mới</Typography>
                                    </Box>
                                ) : (
                                    notifications.map(notif => (
                                        <Box
                                            key={notif.id}
                                            onClick={() => handleMarkAsRead(notif)}
                                            sx={{
                                                p: 2,
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                bgcolor: notif.isRead ? '#fff' : '#f0f7ff',
                                                '&:hover': { bgcolor: notif.isRead ? '#f8fafc' : '#e6f0ff' },
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                {!notif.isRead && (
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6', mt: 0.75, flexShrink: 0 }} />
                                                )}
                                                <Box sx={{ ml: notif.isRead ? 3 : 0 }}>
                                                    <Typography variant="body2" fontWeight={notif.isRead ? 500 : 700} color="#1e293b" mb={0.5}>
                                                        {notif.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="#475569" display="block" mb={0.75} sx={{ lineHeight: 1.4 }}>
                                                        {renderNotifMessage(notif, warehouseMap)}
                                                    </Typography>
                                                    <Typography variant="caption" color="#94a3b8" fontSize={11}>
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                            <Box sx={{ p: 1.5, borderTop: '1px solid #f0f0f0', textAlign: 'center', bgcolor: '#f8fafc' }}>
                                <Button size="small" onClick={() => { setNotifAnchorEl(null); navigate('/admin/notifications'); }} sx={{ textTransform: 'none', fontWeight: 600, color: '#3b82f6' }}>
                                    Xem tất cả thông báo
                                </Button>
                            </Box>
                        </Menu>

                        <Box
                            onClick={e => setAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                ml: 1, px: 1.5, py: 0.75, borderRadius: 2,
                                cursor: 'pointer', border: '1px solid #f0f0f0',
                                '&:hover': { bgcolor: '#f5f5f5' },
                            }}
                        >
                            <Avatar src={avatarUrl} sx={{ width: 30, height: 30, bgcolor: '#2563eb', fontSize: 13, fontWeight: 700 }}>
                                {displayName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="body2" fontWeight={700} fontSize={13} lineHeight={1.2}>
                                    {displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontSize={11}>
                                    {roleLabel}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Menu
                        anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{ sx: { minWidth: 180, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mt: 0.5 } }}
                    >
                        <Box sx={{ px: 2, py: 1.25 }}>
                            <Typography variant="body2" fontWeight={700}>{displayName}</Typography>
                            <Typography variant="caption" color="text.secondary">{roleLabel}</Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={() => { navigate('/admin/profile'); setAnchorEl(null); }} sx={{ fontSize: 13, gap: 1 }}>
                            <AccountCircle sx={{ fontSize: 18, color: '#666' }} /> Hồ sơ cá nhân
                        </MenuItem>
                        {role === 'ROLE_ADMIN' && (
                            <MenuItem onClick={() => { navigate('/admin/settings'); setAnchorEl(null); }} sx={{ fontSize: 13, gap: 1 }}>
                                <Settings sx={{ fontSize: 18, color: '#666' }} /> Cài đặt hệ thống
                            </MenuItem>
                        )}
                        <Divider />
                        <MenuItem onClick={handleLogout} sx={{ fontSize: 13, gap: 1, color: '#d32f2f' }}>
                            <Logout sx={{ fontSize: 18 }} /> Đăng xuất
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? open : true}
                onClose={() => setOpen(false)}
                sx={{
                    width: open ? DRAWER_WIDTH : 64,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiDrawer-paper': {
                        width: open ? DRAWER_WIDTH : 64,
                        overflowX: 'hidden',
                        boxSizing: 'border-box',
                        borderRight: '1px solid #e8e8e8',
                        bgcolor: '#fff',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    },
                }}
            >
                {/* Logo area */}
                <Box sx={{
                    minHeight: 56, display: 'flex', alignItems: 'center',
                    px: open ? 2.5 : 1, borderBottom: '1px solid #f0f0f0',
                    gap: 1.5,
                }}>
                    <Box sx={{
                        width: 32, height: 32, borderRadius: 1.5,
                        bgcolor: '#2563eb', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Typography fontSize={16}>🛒</Typography>
                    </Box>
                    {open && (
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="#2563eb" lineHeight={1.1}>
                                SME ERP & POS
                            </Typography>
                        </Box>
                    )}
                </Box>

                {open ? <Sidebar /> : (
                    // Mini sidebar placeholder — just show icons
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="caption" color="#bbb" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                            ←
                        </Typography>
                    </Box>
                )}
            </Drawer>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: `calc(100% - ${open ? DRAWER_WIDTH : 64}px)`,
                    minHeight: '100vh',
                    bgcolor: '#f8f9fb',
                    overflowX: 'hidden',
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Toolbar sx={{ minHeight: '56px !important' }} />
                <Outlet />
            </Box>
            {role === 'ROLE_ADMIN' && <AIChatWidget />}
        </Box>
    );
};

export default AdminLayout;