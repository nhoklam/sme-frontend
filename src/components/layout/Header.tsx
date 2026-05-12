// src/components/layout/Header.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Container, Typography, Button,
    IconButton, Badge, InputBase, Paper,
} from '@mui/material';
import { Search, ShoppingCart, Phone, Email } from '@mui/icons-material';
import { useCartContext } from '../../store/CartContext';
import { useCurrentUser } from '../../modules/customer/hooks/useAccount';
import { useCategories } from '../../modules/customer/hooks/useCategories';
import { Link } from 'react-router-dom';
import { AccountCircle } from '@mui/icons-material';

// Các link cố định luôn xuất hiện
const FIXED_NAV = [
    { name: 'Trang chủ', url: '/' },
];

const EXTRA_NAV = [
    { name: 'Flash sale', url: '/shop?sort=price_asc' },
    { name: 'Tin tức', url: '/' },
];

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalItems, openCart } = useCartContext();
    const { user, isLoggedIn } = useCurrentUser();
    const { categories } = useCategories();
    const [searchVal, setSearchVal] = React.useState('');

    // Xây dựng danh sách link động từ categories
    const navLinks = React.useMemo(() => {
        const catLinks = categories.slice(0, 5).map(c => ({
            name: c.name,
            url: `/shop?category=${encodeURIComponent(c.name)}`
        }));
        return [...FIXED_NAV, ...catLinks, ...EXTRA_NAV];
    }, [categories]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchVal.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
        }
    };

    const handleNavClick = (url: string) => {
        navigate(url);
    };

    // Kiểm tra nav link nào đang active dựa trên URL hiện tại
    const isActive = (target: string) => {
        const [targetPath, targetQuery] = target.split('?');
        const currentPath = location.pathname;
        const currentSearch = location.search;

        if (target === '/') return currentPath === '/';

        if (targetPath === '/shop') {
            if (currentPath !== '/shop') return false;
            if (!targetQuery) {
                const params = new URLSearchParams(currentSearch);
                return !params.get('category') && !params.get('sort');
            }
            const targetParams = new URLSearchParams(targetQuery);
            const currentParams = new URLSearchParams(currentSearch);
            for (const [key, val] of targetParams.entries()) {
                if (currentParams.get(key) !== val) return false;
            }
            return true;
        }
        return currentPath === targetPath;
    };

    return (
        <Box sx={{ position: 'sticky', top: 0, zIndex: 100 }}>
            {/* Top bar */}
            <Box sx={{ bgcolor: '#d32f2f', py: 0.5 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Phone sx={{ color: '#fff', fontSize: 14 }} />
                                <Typography variant="caption" color="#fff">1800 6655</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Email sx={{ color: '#fff', fontSize: 14 }} />
                                <Typography variant="caption" color="#fff">cskh@bookstore.vn</Typography>
                            </Box>
                        </Box>
                        <Typography variant="caption" color="#fff">
                            🚚 Miễn phí vận chuyển đơn từ 150.000đ
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Main header */}
            <Box sx={{ bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, gap: 2 }}>
                        {/* Logo */}
                        <Box onClick={() => navigate('/')} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 160, cursor: 'pointer' }}>
                            <Box sx={{ width: 40, height: 40, bgcolor: '#d32f2f', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontSize: 20 }}>📚</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={800} color="#d32f2f" lineHeight={1}>BookStore</Typography>
                                <Typography variant="caption" color="text.secondary" lineHeight={1}>Sách hay giá tốt</Typography>
                            </Box>
                        </Box>

                        {/* Search */}
                        <Paper elevation={0} sx={{ flex: 1, display: 'flex', alignItems: 'center', border: '2px solid #d32f2f', borderRadius: 2, overflow: 'hidden' }}>
                            <InputBase
                                placeholder="Tìm kiếm sách, tác giả, NXB..."
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                onKeyDown={handleSearch}
                                sx={{ flex: 1, px: 2, fontSize: 14 }}
                            />
                            <Button variant="contained"
                                onClick={() => searchVal.trim() && navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`)}
                                sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, borderRadius: 0, px: 2.5, py: 1.2, minWidth: 0 }}>
                                <Search />
                            </Button>
                        </Paper>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={openCart} sx={{ position: 'relative' }}>
                                <Badge badgeContent={totalItems} color="error" max={99}>
                                    <ShoppingCart />
                                </Badge>
                            </IconButton>

                            {isLoggedIn ? (
                                <Button
                                    onClick={() => navigate('/account')}
                                    startIcon={<AccountCircle />}
                                    sx={{
                                        color: '#333', textTransform: 'none', fontWeight: 600,
                                        '&:hover': { color: '#d32f2f' }
                                    }}
                                >
                                    {user?.fullName?.split(' ').pop() || 'Tài khoản'}
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outlined" size="small" onClick={() => navigate('/login')} sx={{
                                        borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none', fontWeight: 600,
                                        '&:hover': { bgcolor: '#ffebee', borderColor: '#d32f2f' },
                                    }}>
                                        Đăng nhập
                                    </Button>
                                    <Button variant="contained" size="small" onClick={() => navigate('/register')} sx={{
                                        bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b71c1c' },
                                    }}>
                                        Đăng ký
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>
                </Container>

                {/* Nav */}
                <Box sx={{ borderTop: '1px solid #f5f5f5' }}>
                    <Container maxWidth="lg">
                        <Box sx={{ display: 'flex' }}>
                            {navLinks.map((item) => {
                                const active = isActive(item.url);
                                return (
                                    <Button key={item.name} onClick={() => handleNavClick(item.url)} sx={{
                                        color: active ? '#d32f2f' : '#333',
                                        textTransform: 'none',
                                        fontWeight: active ? 700 : 500,
                                        fontSize: 13, px: 2, py: 1, borderRadius: 0,
                                        borderBottom: active ? '2px solid #d32f2f' : '2px solid transparent',
                                        '&:hover': { color: '#d32f2f', bgcolor: 'transparent', borderBottomColor: '#d32f2f' },
                                    }}>
                                        {item.name}
                                    </Button>
                                );
                            })}
                        </Box>
                    </Container>
                </Box>
            </Box>
        </Box>
    );
};

export default Header;