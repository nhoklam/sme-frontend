// src/modules/customer/pages/ShopPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Paper, Button,
    TextField, InputAdornment, Select, MenuItem,
    FormControl, InputLabel, Chip, Slider, Divider,
    IconButton, Drawer, Badge,
} from '@mui/material';
import {
    Search, FilterList, Close, GridView, ViewList,
} from '@mui/icons-material';
import { PRODUCTS, CATEGORIES, fmt } from '../../../utils/constants';
import ProductCard from '../components/products/ProductCard';
import ProductListItem from '../components/products/ProductListItem';

const SORT_OPTIONS = [
    { value: 'popular', label: 'Phổ biến nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá tăng dần' },
    { value: 'price_desc', label: 'Giá giảm dần' },
    { value: 'rating', label: 'Đánh giá cao' },
];

const PRICE_RANGES = [
    { label: 'Tất cả', min: 0, max: Infinity },
    { label: 'Dưới 50.000đ', min: 0, max: 50000 },
    { label: '50k – 100k', min: 50000, max: 100000 },
    { label: '100k – 200k', min: 100000, max: 200000 },
    { label: 'Trên 200.000đ', min: 200000, max: Infinity },
];

// ── Filter Sidebar ─────────────────────────────────────────────
const FilterSidebar = ({ filters, setFilters, onClear }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={800}>Bộ lọc</Typography>
            <Button size="small" onClick={onClear} sx={{ color: '#d32f2f', textTransform: 'none', fontSize: 12 }}>
                Xóa tất cả
            </Button>
        </Box>

        {/* Category */}
        <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>Danh mục</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 3 }}>
            <Box
                onClick={() => setFilters(f => ({ ...f, category: '' }))}
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                    bgcolor: filters.category === '' ? '#ffebee' : 'transparent',
                    border: filters.category === '' ? '1px solid #d32f2f' : '1px solid transparent',
                    '&:hover': { bgcolor: '#fff5f5' },
                }}
            >
                <Typography variant="body2" fontWeight={filters.category === '' ? 700 : 400}
                    color={filters.category === '' ? '#d32f2f' : 'text.primary'}>
                    Tất cả danh mục
                </Typography>
                <Typography variant="caption" color="text.secondary">{PRODUCTS.length}</Typography>
            </Box>

            {CATEGORIES.map(cat => {
                const count = PRODUCTS.filter(p => p.category === cat.name).length;
                const active = filters.category === cat.name;
                return (
                    <Box key={cat.id}
                        onClick={() => setFilters(f => ({ ...f, category: active ? '' : cat.name }))}
                        sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                            bgcolor: active ? '#ffebee' : 'transparent',
                            border: active ? '1px solid #d32f2f' : '1px solid transparent',
                            '&:hover': { bgcolor: '#fff5f5' },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontSize={16}>{cat.icon}</Typography>
                            <Typography variant="body2" fontWeight={active ? 700 : 400}
                                color={active ? '#d32f2f' : 'text.primary'}>
                                {cat.name}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{count || '-'}</Typography>
                    </Box>
                );
            })}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Price range */}
        <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>Khoảng giá</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 3 }}>
            {PRICE_RANGES.map(range => {
                const active = filters.priceRange === range.label;
                return (
                    <Box key={range.label}
                        onClick={() => setFilters(f => ({ ...f, priceRange: range.label, priceMin: range.min, priceMax: range.max }))}
                        sx={{
                            px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                            bgcolor: active ? '#ffebee' : 'transparent',
                            border: active ? '1px solid #d32f2f' : '1px solid transparent',
                            '&:hover': { bgcolor: '#fff5f5' },
                        }}
                    >
                        <Typography variant="body2" fontWeight={active ? 700 : 400}
                            color={active ? '#d32f2f' : 'text.primary'}>
                            {range.label}
                        </Typography>
                    </Box>
                );
            })}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Rating filter */}
        <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>Đánh giá</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {[4.5, 4.0, 3.5].map(r => {
                const active = filters.minRating === r;
                return (
                    <Box key={r}
                        onClick={() => setFilters(f => ({ ...f, minRating: active ? 0 : r }))}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                            bgcolor: active ? '#ffebee' : 'transparent',
                            border: active ? '1px solid #d32f2f' : '1px solid transparent',
                            '&:hover': { bgcolor: '#fff5f5' },
                        }}
                    >
                        <Typography variant="body2" color={active ? '#d32f2f' : 'text.primary'} fontWeight={active ? 700 : 400}>
                            ⭐ {r}+ trở lên
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    </Box>
);

// ══════════════════════════════════════════════════════════════
// SHOP PAGE
// ══════════════════════════════════════════════════════════════
const ShopPage = () => {
    const [searchParams] = useSearchParams();

    const [filters, setFilters] = useState({
        category: '',
        priceRange: 'Tất cả',
        priceMin: 0,
        priceMax: Infinity,
        minRating: 0,
        search: '',
    });
    const [sort, setSort] = useState('popular');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // ✅ FIX: Đồng bộ category và sort với URL params mỗi khi URL thay đổi
    useEffect(() => {
        const category = searchParams.get('category') || '';
        const sortParam = searchParams.get('sort') || 'popular';

        setFilters(f => ({
            ...f,
            category,
            // Reset các filter phụ khi chuyển danh mục qua nav
            priceRange: 'Tất cả',
            priceMin: 0,
            priceMax: Infinity,
            minRating: 0,
            search: '',
        }));
        setSort(sortParam);
    }, [searchParams]);

    const activeFilterCount = [
        filters.category !== '',
        filters.priceRange !== 'Tất cả',
        filters.minRating > 0,
        filters.search !== '',
    ].filter(Boolean).length;

    const clearFilters = () => setFilters({
        category: '', priceRange: 'Tất cả', priceMin: 0, priceMax: Infinity, minRating: 0, search: '',
    });

    // Apply filters + sort
    const filteredProducts = useMemo(() => {
        let result = [...PRODUCTS];

        if (filters.category)
            result = result.filter(p => p.category === filters.category);
        if (filters.search)
            result = result.filter(p =>
                p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                p.author.toLowerCase().includes(filters.search.toLowerCase())
            );
        if (filters.priceMin > 0 || filters.priceMax < Infinity)
            result = result.filter(p => p.price >= filters.priceMin && p.price <= filters.priceMax);
        if (filters.minRating > 0)
            result = result.filter(p => p.rating >= filters.minRating);

        switch (sort) {
            case 'price_asc': result.sort((a, b) => a.price - b.price); break;
            case 'price_desc': result.sort((a, b) => b.price - a.price); break;
            case 'rating': result.sort((a, b) => b.rating - a.rating); break;
            case 'newest': result.sort((a, b) => b.year - a.year); break;
            default: result.sort((a, b) => b.sold - a.sold);
        }
        return result;
    }, [filters, sort]);

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>

                {/* Page header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" fontWeight={800} mb={0.5}>
                        {filters.category || 'Tất cả sách'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm
                        {filters.category && ` trong "${filters.category}"`}
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* ── Filter sidebar (desktop) ── */}
                    <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2.5, position: 'sticky', top: 80 }}>
                            <FilterSidebar filters={filters} setFilters={setFilters} onClear={clearFilters} />
                        </Paper>
                    </Grid>

                    {/* ── Product list ── */}
                    <Grid item xs={12} md={9}>
                        {/* Toolbar */}
                        <Paper elevation={0} sx={{ borderRadius: 2, px: 2, py: 1.5, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                {/* Search */}
                                <TextField
                                    size="small" placeholder="Tìm trong kết quả..."
                                    value={filters.search}
                                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                    sx={{ flex: 1, minWidth: 180 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#999' }} /></InputAdornment>,
                                    }}
                                />

                                {/* Sort */}
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <Select value={sort} onChange={e => setSort(e.target.value)}
                                        sx={{ fontSize: 13 }}>
                                        {SORT_OPTIONS.map(o => (
                                            <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>
                                                {o.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* View toggle */}
                                <Box sx={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <IconButton size="small" onClick={() => setViewMode('grid')}
                                        sx={{ borderRadius: 0, bgcolor: viewMode === 'grid' ? '#ffebee' : 'transparent', color: viewMode === 'grid' ? '#d32f2f' : '#999' }}>
                                        <GridView sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setViewMode('list')}
                                        sx={{ borderRadius: 0, bgcolor: viewMode === 'list' ? '#ffebee' : 'transparent', color: viewMode === 'list' ? '#d32f2f' : '#999' }}>
                                        <ViewList sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>

                                {/* Mobile filter button */}
                                <Button
                                    size="small" startIcon={
                                        <Badge badgeContent={activeFilterCount} color="error">
                                            <FilterList sx={{ fontSize: 18 }} />
                                        </Badge>
                                    }
                                    onClick={() => setMobileFilterOpen(true)}
                                    sx={{ display: { xs: 'flex', md: 'none' }, color: '#333', textTransform: 'none', border: '1px solid #e0e0e0' }}
                                >
                                    Lọc
                                </Button>
                            </Box>

                            {/* Active filter chips */}
                            {activeFilterCount > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">Đang lọc:</Typography>
                                    {filters.category && (
                                        <Chip size="small" label={filters.category}
                                            onDelete={() => setFilters(f => ({ ...f, category: '' }))}
                                            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600 }} />
                                    )}
                                    {filters.priceRange !== 'Tất cả' && (
                                        <Chip size="small" label={filters.priceRange}
                                            onDelete={() => setFilters(f => ({ ...f, priceRange: 'Tất cả', priceMin: 0, priceMax: Infinity }))}
                                            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600 }} />
                                    )}
                                    {filters.minRating > 0 && (
                                        <Chip size="small" label={`⭐ ${filters.minRating}+`}
                                            onDelete={() => setFilters(f => ({ ...f, minRating: 0 }))}
                                            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600 }} />
                                    )}
                                    {filters.search && (
                                        <Chip size="small" label={`"${filters.search}"`}
                                            onDelete={() => setFilters(f => ({ ...f, search: '' }))}
                                            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600 }} />
                                    )}
                                    <Button size="small" onClick={clearFilters}
                                        sx={{ color: '#999', textTransform: 'none', fontSize: 11 }}>
                                        Xóa hết
                                    </Button>
                                </Box>
                            )}
                        </Paper>

                        {/* Products */}
                        {filteredProducts.length === 0 ? (
                            <Paper elevation={0} sx={{ borderRadius: 2, p: 6, textAlign: 'center' }}>
                                <Typography fontSize={64} mb={2}>🔍</Typography>
                                <Typography variant="h6" fontWeight={700} mb={1}>Không tìm thấy sản phẩm</Typography>
                                <Typography color="text.secondary" mb={3}>Thử thay đổi bộ lọc hoặc tìm kiếm khác</Typography>
                                <Button variant="contained" onClick={clearFilters}
                                    sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b71c1c' } }}>
                                    Xóa bộ lọc
                                </Button>
                            </Paper>
                        ) : viewMode === 'grid' ? (
                            <Grid container spacing={2}>
                                {filteredProducts.map(p => (
                                    <Grid item xs={6} sm={4} md={4} key={p.id}>
                                        <ProductCard product={p} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {filteredProducts.map(p => (
                                    <ProductListItem key={p.id} product={p} />
                                ))}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* Mobile filter drawer */}
            <Drawer anchor="left" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}
                PaperProps={{ sx: { width: 300, p: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>Bộ lọc</Typography>
                    <IconButton size="small" onClick={() => setMobileFilterOpen(false)}>
                        <Close />
                    </IconButton>
                </Box>
                <FilterSidebar filters={filters} setFilters={setFilters} onClear={clearFilters} />
                <Button fullWidth variant="contained" sx={{ mt: 3, bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#b71c1c' } }}
                    onClick={() => setMobileFilterOpen(false)}>
                    Xem {filteredProducts.length} sản phẩm
                </Button>
            </Drawer>
        </Box>
    );
};

export default ShopPage;