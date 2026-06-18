// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, useMatch } from 'react-router-dom';
import {
    Box, Container, Typography, Button, IconButton, Badge,
    InputBase, Paper, Menu, MenuItem, Divider, useScrollTrigger, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon
} from '@mui/material';
import {
    Search, ShoppingCart, Phone, Email, FavoriteBorder, AccountCircle,
    ExitToApp, Receipt, CardGiftcard, LocalShipping, LocalOffer, Undo
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useCartContext } from '../../store/CartContext';
import { useCurrentUser } from '../../modules/customer/hooks/useAccount';

import authService from '../../services/authService';
import customerAuthService from '../../services/customerAuthService';
import CategorySidebar from '../../modules/customer/components/home/CategorySidebar';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 50,
    });

    const { totalItems, openCart } = useCartContext();
    const { user, isLoggedIn } = useCurrentUser();


    const [searchVal, setSearchVal] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isHoveringMenu, setIsHoveringMenu] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Active link states using useMatch
    const matchHome = useMatch('/');
    const isHomeActive = !!matchHome;
    const isReviewActive = location.pathname === '/review-sach';
    const isNewsActive = location.pathname.startsWith('/article') || location.pathname === '/tin-tuc';



    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        customerAuthService.logout();
        authService.logout();
        window.location.href = '/login';
    };

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchVal.trim()) {
            navigate(`/shop?keyword=${encodeURIComponent(searchVal.trim())}`);
            setSearchVal('');
        }
    };

    const handleSearchClick = () => {
        if (searchVal.trim()) {
            navigate(`/shop?keyword=${encodeURIComponent(searchVal.trim())}`);
            setSearchVal('');
        }
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMobileLinkClick = (url: string) => {
        navigate(url);
        setMobileOpen(false);
    };

    return (
        <Box sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            boxShadow: trigger ? '0 4px 20px rgba(26,26,46,0.1)' : 'none',
            transition: 'box-shadow 0.25s ease'
        }}>


            {/* TẦNG 1 — TOPBAR (height: 32px, bg: #1a1a2e) */}
            <Box sx={{
                bgcolor: '#1a1a2e',
                height: 32,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Trái: SĐT + Email */}
                        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: 500 }}>
                                <Phone sx={{ fontSize: 13, color: '#f5a623' }} /> 0367287044
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: 500 }}>
                                <Email sx={{ fontSize: 13, color: '#f5a623' }} /> nguyenhuuquang150805@gmail.com
                            </Box>
                        </Box>

                        {/* Phải: Slogan + Freeship (Ẩn trên mobile) */}
                        <Box sx={{
                            display: { xs: 'none', md: 'flex' },
                            alignItems: 'center',
                            gap: 1.5,
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: '11px',
                            fontWeight: 500
                        }}>
                            <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                                "Mỗi cuốn sách, một hành trình mới"
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>|</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#f5a623', fontWeight: 700 }}>
                                Freeship đơn từ 150k
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* TẦNG 2 — HEADER CHÍNH (bg: #ffffff) */}
            <Box sx={{ bgcolor: '#ffffff', py: { xs: 1.5, md: 2 }, borderBottom: '1px solid #eef0f2' }}>
                <Container maxWidth="lg">
                    {/* Bố cục lưới responsive */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        gap: { xs: 1.5, md: 3 }
                    }}>

                        {/* Hàng trên cùng của mobile: Logo + Actions + Hamburger */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            flexShrink: 0
                        }}>
                            {/* Logo */}
                            <Box onClick={() => navigate('/')} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer' }}>
                                <Box sx={{
                                    width: 36, height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <img src="/LogoBookLy.svg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </Box>
                                <Box>
                                    <Typography sx={{
                                        fontWeight: 800,
                                        color: '#1a1a2e',
                                        fontSize: '20px',
                                        lineHeight: 1.1,
                                        fontFamily: '"Playfair Display", serif'
                                    }}>
                                        Bookly
                                    </Typography>
                                    <Typography sx={{ fontSize: '11px', color: '#888', fontWeight: 500, lineHeight: 1 }}>
                                        Hành trình tri thức
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Search bar tích hợp giữa trên Desktop */}
                            <Box sx={{
                                display: { xs: 'none', md: 'block' },
                                flex: 1,
                                mx: 4,
                                maxWidth: '520px'
                            }}>
                                <Paper elevation={0} sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1.5px solid #e0e0e0',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    height: 40,
                                    px: 1.5,
                                    bgcolor: '#fafafb',
                                    transition: 'all 0.25s ease',
                                    '&:focus-within': { borderColor: '#1a1a2e' }
                                }}>
                                    <InputBase
                                        placeholder="Tìm kiếm tựa sách, tác giả, thể loại..."
                                        value={searchVal}
                                        onChange={e => setSearchVal(e.target.value)}
                                        onKeyDown={handleSearch}
                                        sx={{ flex: 1, px: 1, fontSize: 13, fontWeight: 500 }}
                                    />
                                    <Button variant="contained"
                                        onClick={handleSearchClick}
                                        sx={{
                                            bgcolor: '#f5a623',
                                            color: '#1a1a2e',
                                            fontWeight: 800,
                                            borderRadius: '20px',
                                            px: 3,
                                            height: 32,
                                            minWidth: 0,
                                            textTransform: 'none',
                                            fontSize: 12,
                                            '&:hover': { bgcolor: '#e0951a' }
                                        }}>
                                        Tìm kiếm
                                    </Button>
                                </Paper>
                            </Box>

                            {/* Actions Right Side */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1.5 } }}>

                                {/* Giỏ hàng */}
                                <IconButton onClick={openCart} sx={{ color: '#1a1a2e', '&:hover': { color: '#f5a623' } }}>
                                    <Badge badgeContent={totalItems} color="secondary" sx={{ '& .MuiBadge-badge': { bgcolor: '#e8401c', color: '#ffffff', fontWeight: 700 } }}>
                                        <ShoppingCart sx={{ fontSize: 22 }} />
                                    </Badge>
                                </IconButton>

                                {/* Tài khoản/Auth Buttons (Chỉ hiện trên Desktop) */}
                                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                    {isLoggedIn ? (
                                        <>
                                            <Button
                                                onClick={handleOpenMenu}
                                                startIcon={<AccountCircle sx={{ color: '#1a1a2e' }} />}
                                                sx={{
                                                    color: '#1a1a2e',
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    '&:hover': { color: '#f5a623' }
                                                }}
                                            >
                                                {user?.fullName?.split(' ').pop() || 'Tài khoản'}
                                            </Button>
                                            <Menu
                                                anchorEl={anchorEl}
                                                open={Boolean(anchorEl)}
                                                onClose={handleCloseMenu}
                                                sx={{
                                                    '& .MuiPaper-root': {
                                                        borderRadius: '8px',
                                                        mt: 1,
                                                        minWidth: 200,
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, pointerEvents: 'none' }}>
                                                    <AccountCircle sx={{ color: '#1a1a2e', fontSize: 28 }} />
                                                    <Typography sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: 15 }}>
                                                        {user?.fullName || 'Tài khoản'}
                                                    </Typography>
                                                </Box>
                                                <Divider sx={{ mb: 0.5 }} />
                                                <MenuItem onClick={() => { handleCloseMenu(); navigate('/account?tab=info'); }} sx={{ fontSize: 13, gap: 1.5, py: 1, px: 2 }}>
                                                    <AccountCircle fontSize="small" sx={{ color: '#666' }} /> Thông tin cá nhân
                                                </MenuItem>
                                                <MenuItem onClick={() => { handleCloseMenu(); navigate('/account?tab=orders'); }} sx={{ fontSize: 13, gap: 1.5, py: 1, px: 2 }}>
                                                    <Receipt fontSize="small" sx={{ color: '#666' }} /> Đơn hàng của tôi
                                                </MenuItem>
                                                <MenuItem onClick={() => { handleCloseMenu(); navigate('/account?tab=points'); }} sx={{ fontSize: 13, gap: 1.5, py: 1, px: 2 }}>
                                                    <CardGiftcard fontSize="small" sx={{ color: '#666' }} /> Điểm thưởng
                                                </MenuItem>
                                                <Divider sx={{ my: 0.5 }} />
                                                <MenuItem onClick={handleLogout} sx={{ fontSize: 13, gap: 1.5, py: 1, px: 2, color: '#e8401c' }}>
                                                    <ExitToApp fontSize="small" /> Đăng xuất
                                                </MenuItem>
                                            </Menu>
                                        </>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button variant="outlined" size="small" onClick={() => navigate('/login')} sx={{
                                                borderColor: '#1a1a2e', color: '#1a1a2e', textTransform: 'none', fontWeight: 700,
                                                borderRadius: '20px', height: 34, px: 2,
                                                '&:hover': { bgcolor: 'rgba(26,26,46,0.04)', borderColor: '#1a1a2e' },
                                            }}>
                                                Đăng nhập
                                            </Button>
                                        </Box>
                                    )}
                                </Box>

                                {/* Hamburger Menu Button (Mobile) */}
                                <IconButton
                                    onClick={handleDrawerToggle}
                                    sx={{
                                        color: '#1a1a2e',
                                        display: { xs: 'inline-flex', md: 'none' }
                                    }}
                                >
                                    <MenuIcon sx={{ fontSize: 24 }} />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Search Bar Xuống Dòng trên Mobile */}
                        <Box sx={{
                            display: { xs: 'block', md: 'none' },
                            width: '100%'
                        }}>
                            <Paper elevation={0} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                border: '1.5px solid #e0e0e0',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                height: 38,
                                px: 1.5,
                                bgcolor: '#fafafb'
                            }}>
                                <InputBase
                                    placeholder="Tìm kiếm tựa sách, tác giả..."
                                    value={searchVal}
                                    onChange={e => setSearchVal(e.target.value)}
                                    onKeyDown={handleSearch}
                                    sx={{ flex: 1, px: 1, fontSize: 13 }}
                                />
                                <Button variant="contained"
                                    onClick={handleSearchClick}
                                    sx={{
                                        bgcolor: '#f5a623',
                                        color: '#1a1a2e',
                                        fontWeight: 800,
                                        borderRadius: '20px',
                                        px: 2,
                                        height: 30,
                                        minWidth: 0,
                                        textTransform: 'none',
                                        fontSize: 11,
                                        '&:hover': { bgcolor: '#e0951a' }
                                    }}>
                                    Tìm kiếm
                                </Button>
                            </Paper>
                        </Box>

                    </Box>
                </Container>
            </Box>

            {/* TẦNG 3 — NAVBAR (height: 42px, bg: #fafafb) */}
            <Box sx={{
                bgcolor: '#fafafb',
                height: 42,
                display: 'flex',
                alignItems: 'stretch',
                borderTop: '1px solid #eef0f2',
                borderBottom: '1px solid #eef0f2'
            }}>
                <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'stretch', justifyContent: 'space-between' }}>

                        {/* [A] Ô "DANH MỤC SÁCH" */}
                        <Box
                            onMouseEnter={() => setIsHoveringMenu(true)}
                            onMouseLeave={() => setIsHoveringMenu(false)}
                            sx={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}
                        >
                            <Button
                                startIcon={<MenuIcon sx={{ color: '#1a1a2e' }} />}
                                sx={{
                                    bgcolor: 'transparent',
                                    color: '#1a1a2e',
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    borderRadius: 0,
                                    fontSize: '13px',
                                    letterSpacing: '0.5px',
                                    minWidth: 190,
                                    height: '100%',
                                    borderLeft: '1px solid #eef0f2',
                                    borderRight: '1px solid #eef0f2',
                                    '&:hover': {
                                        bgcolor: '#eef0f2',
                                    }
                                }}
                            >
                                DANH MỤC SÁCH
                            </Button>

                            {/* Dropdown Paper chứa CategorySidebar (Chỉ hiển thị khi không ở trang chủ, vì trang chủ đã hiển thị sẵn rồi) */}
                            {isHoveringMenu && !isHomeActive && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        width: 240,
                                        bgcolor: '#ffffff',
                                        border: '1px solid #eef0f2',
                                        boxShadow: '0 8px 30px rgba(26,26,46,0.12)',
                                        zIndex: 1200,
                                        overflow: 'visible'
                                    }}
                                >
                                    <CategorySidebar />
                                </Paper>
                            )}
                        </Box>

                        {/* [B] Nav links */}
                        <Box sx={{ display: 'flex', alignItems: 'stretch', ml: 1 }}>
                            <Button
                                onClick={() => navigate('/')}
                                sx={{
                                    color: isHomeActive ? '#f5a623' : '#1a1a2e',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    px: 2,
                                    borderRadius: 0,
                                    height: '100%',
                                    textTransform: 'none',
                                    borderBottom: isHomeActive ? '3px solid #f5a623' : '3px solid transparent',
                                    '&:hover': { color: '#f5a623', borderBottomColor: '#f5a623', bgcolor: 'transparent' }
                                }}
                            >
                                Trang chủ
                            </Button>
                            <Button
                                onClick={() => navigate('/review-sach')}
                                sx={{
                                    color: isReviewActive ? '#f5a623' : '#1a1a2e',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    px: 2,
                                    borderRadius: 0,
                                    height: '100%',
                                    textTransform: 'none',
                                    borderBottom: isReviewActive ? '3px solid #f5a623' : '3px solid transparent',
                                    '&:hover': { color: '#f5a623', borderBottomColor: '#f5a623', bgcolor: 'transparent' }
                                }}
                            >
                                Review sách
                            </Button>
                            <Button
                                onClick={() => navigate('/tin-tuc')}
                                sx={{
                                    color: isNewsActive ? '#f5a623' : '#1a1a2e',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    px: 2,
                                    borderRadius: 0,
                                    height: '100%',
                                    textTransform: 'none',
                                    borderBottom: isNewsActive ? '3px solid #f5a623' : '3px solid transparent',
                                    '&:hover': { color: '#f5a623', borderBottomColor: '#f5a623', bgcolor: 'transparent' }
                                }}
                            >
                                Tin tức
                            </Button>
                        </Box>

                        {/* [C] Spacer */}
                        <Box sx={{ flex: 1 }} />

                        {/* [D] Thông tin dịch vụ (Chỉ hiện md trở lên) */}
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.75, color: '#1a1a2e', fontSize: '11px', fontWeight: 600 }}>
                                <LocalShipping sx={{ fontSize: 14, color: '#f5a623' }} /> Ship COD Toàn Quốc
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: '#eef0f2', my: 1.5 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.75, color: '#1a1a2e', fontSize: '11px', fontWeight: 600 }}>
                                <LocalOffer sx={{ fontSize: 14, color: '#f5a623' }} /> Freeship từ 150k
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: '#eef0f2', my: 1.5 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.75, color: '#1a1a2e', fontSize: '11px', fontWeight: 600 }}>
                                <Undo sx={{ fontSize: 14, color: '#f5a623' }} /> Đổi trả 7 ngày
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: '#eef0f2', my: 1.5 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.75, color: '#1a1a2e', fontSize: '11px', fontWeight: 600 }}>
                                <Phone sx={{ fontSize: 14, color: '#f5a623' }} /> 1800 6655
                            </Box>
                        </Box>

                    </Box>
                </Container>
            </Box>

            {/* Mobile Responsive Navigation Drawer */}
            <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    '& .MuiPaper-root': {
                        width: 280,
                        bgcolor: '#ffffff',
                        p: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }
                }}
            >
                {/* Header Drawer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>Bookly Menu</Typography>
                    <IconButton onClick={handleDrawerToggle} sx={{ color: '#1a1a2e' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />

                {/* Nav Links */}
                <List dense sx={{ p: 0 }}>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleMobileLinkClick('/')}>
                            <ListItemText primary="Trang chủ" primaryTypographyProps={{ fontWeight: 700, color: '#1a1a2e' }} />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleMobileLinkClick('/review-sach')}>
                            <ListItemText primary="Review sách" primaryTypographyProps={{ fontWeight: 700, color: '#1a1a2e' }} />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleMobileLinkClick('/tin-tuc')}>
                            <ListItemText primary="Tin tức" primaryTypographyProps={{ fontWeight: 700, color: '#1a1a2e' }} />
                        </ListItemButton>
                    </ListItem>
                </List>

                <Divider sx={{ my: 1 }} />

                {/* Account / Actions inside mobile Drawer */}
                {isLoggedIn ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, px: 1, color: '#888' }}>
                            Xin chào, {user?.fullName || 'khách hàng'}!
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AccountCircle />}
                            onClick={() => handleMobileLinkClick('/account')}
                            sx={{ textTransform: 'none', borderColor: '#1a1a2e', color: '#1a1a2e', fontWeight: 700, borderRadius: '20px' }}
                        >
                            Tài khoản của tôi
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            color="error"
                            startIcon={<ExitToApp />}
                            onClick={handleLogout}
                            sx={{ textTransform: 'none', bgcolor: '#e8401c', fontWeight: 700, borderRadius: '20px' }}
                        >
                            Đăng xuất
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                            variant="outlined"
                            onClick={() => handleMobileLinkClick('/login')}
                            sx={{ textTransform: 'none', borderColor: '#1a1a2e', color: '#1a1a2e', fontWeight: 700, borderRadius: '20px' }}
                        >
                            Đăng nhập
                        </Button>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};

export default Header;