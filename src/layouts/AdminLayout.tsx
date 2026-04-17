// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    Box, AppBar, Toolbar, Typography, IconButton,
    Drawer, Avatar, Menu, MenuItem, Divider,
    Badge, Tooltip, useTheme, useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout, AccountCircle, Settings,
    Notifications, ChevronLeft,
} from '@mui/icons-material';
import Sidebar from '../components/layout/Sidebar';
import authService from '../services/authService';

const DRAWER_WIDTH = 256;
const DRAWER_MINI = 0;

const AdminLayout = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();

    const currentUser = authService.getCurrentUser()?.user;
    const displayName = currentUser?.fullName || currentUser?.username || 'Admin';
    const role = currentUser?.role || '';
    const roleLabel = role === 'ROLE_ADMIN' ? 'Admin' : role === 'ROLE_MANAGER' ? 'Quản lý' : 'Thu ngân';

    const handleLogout = () => {
        authService.logout();
        navigate('/login', { replace: true });
    };

    const drawerWidth = open ? DRAWER_WIDTH : DRAWER_MINI;

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
                        <Typography variant="subtitle1" fontWeight={800} color="#1976d2" sx={{ mr: 2 }}>
                            SME ERP & POS
                        </Typography>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Right actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="Thông báo">
                            <IconButton size="small" sx={{ color: '#666' }}>
                                <Badge badgeContent={3} color="error" max={9}>
                                    <Notifications sx={{ fontSize: 22 }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Box
                            onClick={e => setAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                ml: 1, px: 1.5, py: 0.75, borderRadius: 2,
                                cursor: 'pointer', border: '1px solid #f0f0f0',
                                '&:hover': { bgcolor: '#f5f5f5' },
                            }}
                        >
                            <Avatar sx={{ width: 30, height: 30, bgcolor: '#1976d2', fontSize: 13, fontWeight: 700 }}>
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
                        <MenuItem onClick={() => { setAnchorEl(null); }} sx={{ fontSize: 13, gap: 1 }}>
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
                        bgcolor: '#1976d2', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Typography fontSize={16}>🛒</Typography>
                    </Box>
                    {open && (
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="#1976d2" lineHeight={1.1}>
                                SME ERP & POS
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontSize={10}>
                                Tất cả chi nhánh
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
        </Box>
    );
};

export default AdminLayout;