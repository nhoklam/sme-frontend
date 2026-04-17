// src/components/layout/Header.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Container, Typography, Button,
    IconButton, Badge, InputBase, Paper,
} from '@mui/material';
import { Search, ShoppingCart, Phone, Email } from '@mui/icons-material';
import { NAV_LINKS } from '../../utils/constants';
import { useCartContext } from '../../store/CartContext';

const NAV_MAP = {
    'Trang chủ': '/',
    'Sách văn học': '/shop?category=Văn học',   
    'Sách kinh tế': '/shop?category=Kinh tế',
    'Thiếu nhi': '/shop?category=Thiếu nhi',
    'Sách kỹ năng sống': '/shop?category=Kỹ Năng',
    'Combo sách': '/shop',
    'Flash sale': '/shop?sort=price_asc',
    'Tin tức': '/',
};

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalItems, openCart } = useCartContext();
    const [searchVal, setSearchVal] = React.useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchVal.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
        }
    };

    const handleNavClick = (link) => {
        navigate(NAV_MAP[link] || '/');
    };

    // Kiểm tra nav link nào đang active dựa trên URL hiện tại
    const isActive = (link) => {
        const target = NAV_MAP[link] || '/';
        const [targetPath, targetQuery] = target.split('?');
        const currentPath = location.pathname;
        const currentSearch = location.search;

        // Trang chủ: chỉ active khi đúng là '/'
        if (target === '/') {
            return currentPath === '/';
        }

        // Các link shop: so sánh cả path lẫn query string
        if (targetPath === '/shop') {
            if (currentPath !== '/shop') return false;
            if (!targetQuery) {
                // "Combo sách" → /shop không có query → active khi không có category/sort
                const params = new URLSearchParams(currentSearch);
                return !params.get('category') && !params.get('sort');
            }
            // So sánh từng query param
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
                            <Button variant="outlined" size="small" href="/login" sx={{
                                borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none', fontWeight: 600,
                                '&:hover': { bgcolor: '#ffebee' },
                            }}>
                                Đăng nhập
                            </Button>
                            <Button variant="contained" size="small" href="/register" sx={{
                                bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b71c1c' },
                            }}>
                                Đăng ký
                            </Button>
                        </Box>
                    </Box>
                </Container>

                {/* Nav */}
                <Box sx={{ borderTop: '1px solid #f5f5f5' }}>
                    <Container maxWidth="lg">
                        <Box sx={{ display: 'flex' }}>
                            {NAV_LINKS.map((link) => {
                                const active = isActive(link);
                                return (
                                    <Button key={link} onClick={() => handleNavClick(link)} sx={{
                                        color: active ? '#d32f2f' : '#333',
                                        textTransform: 'none',
                                        fontWeight: active ? 700 : 500,
                                        fontSize: 13, px: 2, py: 1, borderRadius: 0,
                                        borderBottom: active ? '2px solid #d32f2f' : '2px solid transparent',
                                        '&:hover': { color: '#d32f2f', bgcolor: 'transparent', borderBottomColor: '#d32f2f' },
                                    }}>
                                        {link}
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