// src/modules/customer/pages/ShopPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Paper, Button,
    TextField, InputAdornment, Select, MenuItem,
    FormControl, Chip, IconButton, Drawer, Badge,
    Pagination, Skeleton, Fade, Divider,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Search, FilterList, Close, GridView, ViewList,
    ChevronRight,
} from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import { useCategories, DisplayCategory } from '../hooks/useCategories';
import ProductCard from '../components/products/ProductCard';
import ProductListItem from '../components/products/ProductListItem';

const SORT_OPTIONS = [
    { value: 'popular', label: 'Phổ biến nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá tăng dần' },
    { value: 'price_desc', label: 'Giá giảm dần' },
];

interface ShopFilters {
    category: string;
    categoryId: string;
    search: string;
}

interface FilterSidebarProps {
    filters: ShopFilters;
    setFilters: React.Dispatch<React.SetStateAction<ShopFilters>>;
    onClear: () => void;
    categories: DisplayCategory[];
    categoriesLoading: boolean;
    onClose?: () => void;
}

// ── Text-only Filter Sidebar (no images) ─────────────────────────────────────
const FilterSidebar: React.FC<FilterSidebarProps> = ({
    filters, setFilters, onClear, categories, categoriesLoading, onClose,
}) => (
    <Box>
        {/* Header */}
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1.25,
            borderBottom: '2px solid #e8401c',
        }}>
            <Typography fontWeight={800} sx={{
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: '#1a1a1a',
                fontFamily: '"Segoe UI", sans-serif',
            }}>
                Danh mục
            </Typography>
            {filters.category && (
                <Typography
                    onClick={() => { onClear(); onClose?.(); }}
                    sx={{
                        fontSize: 12,
                        color: '#e8401c',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: '"Segoe UI", sans-serif',
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    Xóa lọc
                </Typography>
            )}
        </Box>

        {/* All categories */}
        <Box
            onClick={() => setFilters(f => ({ ...f, category: '', categoryId: '' }))}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.25,
                py: 0.85,
                mb: 0.25,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: filters.category === '' ? '#fff3f0' : 'transparent',
                borderLeft: filters.category === '' ? '3px solid #e8401c' : '3px solid transparent',
                transition: 'all 0.12s',
                '&:hover': { bgcolor: '#fff3f0' },
            }}
        >
            <Typography sx={{
                fontSize: 13,
                fontWeight: filters.category === '' ? 700 : 500,
                color: filters.category === '' ? '#e8401c' : '#333',
                fontFamily: '"Segoe UI", sans-serif',
            }}>
                Tất cả sách
            </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Category list — text only, no images */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {categoriesLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} height={36} sx={{ borderRadius: 1 }} />
                ))
                : categories.map(cat => {
                    const active = filters.category === cat.name;
                    return (
                        <Box
                            key={cat.id}
                            onClick={() => setFilters(f => ({
                                ...f,
                                category: active ? '' : cat.name,
                                categoryId: active ? '' : cat.id,
                            }))}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 1.25,
                                py: 0.85,
                                borderRadius: 1,
                                cursor: 'pointer',
                                bgcolor: active ? '#fff3f0' : 'transparent',
                                borderLeft: active ? '3px solid #e8401c' : '3px solid transparent',
                                transition: 'all 0.12s',
                                '&:hover': { bgcolor: '#fff3f0' },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1 }}>{cat.icon}</Typography>
                                <Typography sx={{
                                    fontSize: 12.5,
                                    fontWeight: active ? 700 : 500,
                                    color: active ? '#e8401c' : '#333',
                                    fontFamily: '"Segoe UI", sans-serif',
                                    lineHeight: 1.3,
                                }}>
                                    {cat.name}
                                </Typography>
                            </Box>
                            {active && (
                                <ChevronRight sx={{ fontSize: 15, color: '#e8401c' }} />
                            )}
                        </Box>
                    );
                })
            }
        </Box>
    </Box>
);

// Product Card Skeleton
const ProductCardSkeleton = () => (
    <Box sx={{ borderRadius: 1.5, overflow: 'hidden', bgcolor: '#fff', border: '1px solid #ececec' }}>
        <Skeleton variant="rectangular" height={185} />
        <Box sx={{ p: 1.5 }}>
            <Skeleton width="60%" height={13} sx={{ mb: 0.5 }} />
            <Skeleton width="90%" height={17} sx={{ mb: 0.25 }} />
            <Skeleton width="70%" height={17} sx={{ mb: 0.75 }} />
            <Skeleton width="45%" height={19} sx={{ mb: 0.75 }} />
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1 }} />
        </Box>
    </Box>
);

// ══════════════════════════════════════════════════════════════
// SHOP PAGE
// ══════════════════════════════════════════════════════════════
const ShopPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [filters, setFilters] = useState<ShopFilters>({
        category: '',
        categoryId: '',
        search: '',
    });
    const [sort, setSort] = useState('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [searchInput, setSearchInput] = useState('');

    const { categories, isLoading: categoriesLoading } = useCategories();

    useEffect(() => {
        const categoryName = searchParams.get('category') || '';
        const sortParam = searchParams.get('sort') || 'popular';
        const matchedCat = categories.find(c => c.name === categoryName);

        setFilters(f => ({
            ...f,
            category: categoryName,
            categoryId: matchedCat?.id ?? '',
            search: '',
        }));
        setSearchInput('');
        setSort(sortParam);
        setPage(0);
    }, [searchParams, categories]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(f => ({ ...f, search: searchInput }));
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { products, totalElements, totalPages, isLoading: productsLoading } = useProducts({
        keyword: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
        page,
        size: 20,
    });

    const activeFilterCount = [
        filters.category !== '',
        filters.search !== '',
    ].filter(Boolean).length;

    const clearFilters = useCallback(() => {
        setFilters({ category: '', categoryId: '', search: '' });
        setSearchInput('');
        setPage(0);
    }, []);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box sx={{ bgcolor: '#f4f4f4', minHeight: '100vh' }}>

            {/* Breadcrumb bar */}
            <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #ececec', py: 1.25 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                            <Typography fontWeight={800} sx={{
                                fontSize: 16,
                                color: '#1a1a1a',
                                letterSpacing: '-0.2px',
                                fontFamily: '"Segoe UI", sans-serif',
                            }}>
                                {filters.category || 'Tất cả sách'}
                            </Typography>
                            <Typography sx={{
                                fontSize: 12,
                                color: '#888',
                                mt: 0.15,
                                fontFamily: '"Segoe UI", sans-serif',
                            }}>
                                {productsLoading ? 'Đang tải...' : (
                                    <>Tìm thấy <strong style={{ color: '#e8401c' }}>{totalElements}</strong> sản phẩm
                                        {filters.category && ` trong "${filters.category}"`}</>
                                )}
                            </Typography>
                        </Box>

                        {/* Quick category chips */}
                        <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.75, flexWrap: 'wrap' }}>
                            {categories.slice(0, 6).map(cat => (
                                <Box
                                    key={cat.id}
                                    onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
                                    sx={{
                                        px: 1.5, py: 0.5,
                                        borderRadius: 5,
                                        border: '1px solid',
                                        borderColor: filters.category === cat.name ? '#e8401c' : '#ddd',
                                        bgcolor: filters.category === cat.name ? '#fff3f0' : '#fff',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 0.5,
                                        transition: 'all 0.12s',
                                        '&:hover': { borderColor: '#e8401c', bgcolor: '#fff3f0' },
                                    }}
                                >
                                    <Typography sx={{ fontSize: 13 }}>{cat.icon}</Typography>
                                    <Typography sx={{
                                        fontSize: 12,
                                        fontWeight: filters.category === cat.name ? 700 : 500,
                                        color: filters.category === cat.name ? '#e8401c' : '#444',
                                        fontFamily: '"Segoe UI", sans-serif',
                                    }}>
                                        {cat.name}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 2.5 }}>
                <Grid container spacing={2.5}>

                    {/* ── Sidebar (desktop) ── */}
                    <Grid
                        size={{ xs: 12, md: 2.5 }}
                        sx={{ display: { xs: 'none', md: 'block' } }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 1.5,
                                p: 2,
                                position: 'sticky',
                                top: 72,
                                border: '1px solid #ececec',
                                bgcolor: '#fff',
                            }}
                        >
                            <FilterSidebar
                                filters={filters}
                                setFilters={(updater) => { setFilters(updater); setPage(0); }}
                                onClear={clearFilters}
                                categories={categories}
                                categoriesLoading={categoriesLoading}
                            />
                        </Paper>
                    </Grid>

                    {/* ── Product list ── */}
                    <Grid size={{ xs: 12, md: 9.5 }}>

                        {/* Toolbar */}
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 1.5,
                                px: 2,
                                py: 1.25,
                                mb: 2,
                                border: '1px solid #ececec',
                                bgcolor: '#fff',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                                {/* Search */}
                                <TextField
                                    size="small"
                                    placeholder="Tìm kiếm sách, tác giả..."
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    sx={{
                                        flex: 1,
                                        minWidth: 180,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            fontSize: 13,
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e8401c',
                                            },
                                        },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ fontSize: 17, color: '#bbb' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchInput ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchInput('')}>
                                                    <Close sx={{ fontSize: 15 }} />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />

                                {/* Sort */}
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <Select
                                        value={sort}
                                        onChange={(e: SelectChangeEvent) => setSort(e.target.value)}
                                        sx={{
                                            fontSize: 12.5,
                                            borderRadius: 1.5,
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#e8401c',
                                            },
                                        }}
                                    >
                                        {SORT_OPTIONS.map(o => (
                                            <MenuItem key={o.value} value={o.value} sx={{ fontSize: 12.5 }}>
                                                {o.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* View toggle */}
                                <Box sx={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 1.5, overflow: 'hidden' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setViewMode('grid')}
                                        sx={{
                                            borderRadius: 0, px: 1.1,
                                            bgcolor: viewMode === 'grid' ? '#fff3f0' : 'transparent',
                                            color: viewMode === 'grid' ? '#e8401c' : '#999',
                                            '&:hover': { bgcolor: '#fff3f0' },
                                        }}
                                    >
                                        <GridView sx={{ fontSize: 17 }} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => setViewMode('list')}
                                        sx={{
                                            borderRadius: 0, px: 1.1,
                                            bgcolor: viewMode === 'list' ? '#fff3f0' : 'transparent',
                                            color: viewMode === 'list' ? '#e8401c' : '#999',
                                            '&:hover': { bgcolor: '#fff3f0' },
                                        }}
                                    >
                                        <ViewList sx={{ fontSize: 17 }} />
                                    </IconButton>
                                </Box>

                                {/* Mobile filter */}
                                <Button
                                    size="small"
                                    startIcon={
                                        <Badge badgeContent={activeFilterCount} color="error">
                                            <FilterList sx={{ fontSize: 17 }} />
                                        </Badge>
                                    }
                                    onClick={() => setMobileFilterOpen(true)}
                                    sx={{
                                        display: { xs: 'flex', md: 'none' },
                                        color: '#444',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: 12.5,
                                        border: '1px solid #ddd',
                                        borderRadius: 1.5,
                                        fontFamily: '"Segoe UI", sans-serif',
                                    }}
                                >
                                    Lọc
                                </Button>
                            </Box>

                            {/* Active filters */}
                            {activeFilterCount > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.75, mt: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: 11.5, color: '#888', fontWeight: 600, fontFamily: '"Segoe UI", sans-serif' }}>
                                        Đang lọc:
                                    </Typography>
                                    {filters.category && (
                                        <Chip
                                            size="small"
                                            label={filters.category}
                                            onDelete={() => { setFilters(f => ({ ...f, category: '', categoryId: '' })); setPage(0); }}
                                            sx={{ bgcolor: '#fff3f0', color: '#e8401c', fontWeight: 600, fontSize: 11.5, height: 22 }}
                                        />
                                    )}
                                    {filters.search && (
                                        <Chip
                                            size="small"
                                            label={`"${filters.search}"`}
                                            onDelete={() => { setSearchInput(''); setFilters(f => ({ ...f, search: '' })); setPage(0); }}
                                            sx={{ bgcolor: '#fff3f0', color: '#e8401c', fontWeight: 600, fontSize: 11.5, height: 22 }}
                                        />
                                    )}
                                    <Typography
                                        onClick={clearFilters}
                                        sx={{ fontSize: 11.5, color: '#aaa', cursor: 'pointer', fontFamily: '"Segoe UI", sans-serif', '&:hover': { color: '#e8401c' } }}
                                    >
                                        Xóa hết
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* Products */}
                        {productsLoading ? (
                            <Grid container spacing={1.5}>
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`sk-${i}`}>
                                        <ProductCardSkeleton />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : products.length === 0 ? (
                            <Fade in>
                                <Paper elevation={0} sx={{
                                    borderRadius: 1.5, p: 6,
                                    textAlign: 'center', border: '1px solid #ececec',
                                }}>
                                    <Typography fontSize={56} mb={1.5}>🔍</Typography>
                                    <Typography fontWeight={700} sx={{ fontSize: 16, mb: 0.75, fontFamily: '"Segoe UI", sans-serif' }}>
                                        Không tìm thấy sản phẩm
                                    </Typography>
                                    <Typography sx={{ color: '#888', mb: 2.5, fontSize: 13, fontFamily: '"Segoe UI", sans-serif' }}>
                                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác
                                    </Typography>
                                    <Button variant="contained" onClick={clearFilters} sx={{
                                        bgcolor: '#e8401c', textTransform: 'none',
                                        fontWeight: 600, borderRadius: 1.5,
                                        fontFamily: '"Segoe UI", sans-serif',
                                        '&:hover': { bgcolor: '#c62828' },
                                    }}>
                                        Xóa bộ lọc
                                    </Button>
                                </Paper>
                            </Fade>
                        ) : viewMode === 'grid' ? (
                            <Fade in>
                                <Grid container spacing={1.5}>
                                    {products.map(p => (
                                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}>
                                            <ProductCard product={p} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Fade>
                        ) : (
                            <Fade in>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                    {products.map(p => (
                                        <ProductListItem key={p.id} product={p} />
                                    ))}
                                </Box>
                            </Fade>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && !productsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3.5 }}>
                                <Pagination
                                    count={totalPages}
                                    page={page + 1}
                                    onChange={handlePageChange}
                                    shape="rounded"
                                    sx={{
                                        '& .Mui-selected': { bgcolor: '#e8401c !important', color: '#fff' },
                                        '& .MuiPaginationItem-root': { borderRadius: 1, fontSize: 13 },
                                    }}
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* Mobile filter drawer */}
            <Drawer
                anchor="left"
                open={mobileFilterOpen}
                onClose={() => setMobileFilterOpen(false)}
                PaperProps={{ sx: { width: 280, p: 2.5 } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography fontWeight={700} sx={{ fontFamily: '"Segoe UI", sans-serif' }}>Bộ lọc</Typography>
                    <IconButton size="small" onClick={() => setMobileFilterOpen(false)}>
                        <Close />
                    </IconButton>
                </Box>
                <FilterSidebar
                    filters={filters}
                    setFilters={(updater) => { setFilters(updater); setPage(0); }}
                    onClear={clearFilters}
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    onClose={() => setMobileFilterOpen(false)}
                />
                <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button fullWidth variant="contained" sx={{
                        bgcolor: '#e8401c', textTransform: 'none', fontWeight: 700,
                        borderRadius: 1.5, py: 1.2,
                        fontFamily: '"Segoe UI", sans-serif',
                        '&:hover': { bgcolor: '#c62828' },
                    }} onClick={() => setMobileFilterOpen(false)}>
                        Xem {totalElements} sản phẩm
                    </Button>
                </Box>
            </Drawer>
        </Box>
    );
};

export default ShopPage;