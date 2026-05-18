import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Paper, Button,
    TextField, InputAdornment, Select, MenuItem,
    FormControl, Chip, IconButton, Drawer, Badge,
    Pagination, Skeleton, Fade, Divider, Slider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Search, FilterList, Close, GridView, ViewList,
    ChevronRight, Star
} from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import { useCategories, DisplayCategory } from '../hooks/useCategories';
import ProductCard from '../../../components/common/ProductCard';
import QuickViewModal from '../../../components/common/QuickViewModal';
import { useCartContext } from '../../../store/CartContext';

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
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
}

interface FilterSidebarProps {
    filters: ShopFilters;
    setFilters: React.Dispatch<React.SetStateAction<ShopFilters>>;
    onClear: () => void;
    categories: DisplayCategory[];
    categoriesLoading: boolean;
    onClose?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
    filters, setFilters, onClear, categories, categoriesLoading, onClose,
}) => {
    const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);

    const handlePriceChange = (event: Event, newValue: number | number[]) => {
        setPriceRange(newValue as number[]);
    };

    const handlePriceCommit = (event: Event | React.SyntheticEvent<Element, Event>, newValue: number | number[]) => {
        const [min, max] = newValue as number[];
        setFilters(f => ({ ...f, minPrice: min, maxPrice: max }));
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid var(--color-primary)' }}>
                <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Bộ lọc
                </Typography>
                {(filters.category || filters.minPrice || filters.rating) && (
                    <Typography
                        onClick={() => { onClear(); onClose?.(); }}
                        sx={{ fontSize: '0.85rem', color: 'var(--color-secondary)', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                    >
                        Xóa lọc
                    </Typography>
                )}
            </Box>

            {/* Categories */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'var(--color-primary)' }}>Danh mục</Typography>
            <Box
                onClick={() => setFilters(f => ({ ...f, category: '', categoryId: '' }))}
                sx={{
                    display: 'flex', alignItems: 'center', px: 1.5, py: 1, mb: 0.5, borderRadius: 1, cursor: 'pointer',
                    bgcolor: filters.category === '' ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                    borderLeft: filters.category === '' ? '3px solid var(--color-secondary)' : '3px solid transparent',
                    '&:hover': { bgcolor: 'rgba(245, 166, 35, 0.05)' },
                }}
            >
                <Typography sx={{ fontSize: '0.9rem', fontWeight: filters.category === '' ? 700 : 500, color: filters.category === '' ? 'var(--color-secondary)' : 'var(--text-primary)' }}>
                    Tất cả sách
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3, maxHeight: 250, overflowY: 'auto' }}>
                {categoriesLoading
                    ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={40} sx={{ borderRadius: 1 }} />)
                    : categories.map(cat => {
                        const active = filters.category === cat.name;
                        return (
                            <Box
                                key={cat.id}
                                onClick={() => setFilters(f => ({ ...f, category: active ? '' : cat.name, categoryId: active ? '' : cat.id }))}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, borderRadius: 1, cursor: 'pointer',
                                    bgcolor: active ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                                    borderLeft: active ? '3px solid var(--color-secondary)' : '3px solid transparent',
                                    '&:hover': { bgcolor: 'rgba(245, 166, 35, 0.05)' },
                                }}
                            >
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500, color: active ? 'var(--color-secondary)' : 'var(--text-primary)' }}>
                                    {cat.name}
                                </Typography>
                                {active && <ChevronRight sx={{ fontSize: 18, color: 'var(--color-secondary)' }} />}
                            </Box>
                        );
                    })
                }
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Price Filter */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'var(--color-primary)' }}>Khoảng giá</Typography>
            <Box sx={{ px: 1 }}>
                <Slider
                    value={priceRange}
                    onChange={handlePriceChange}
                    onChangeCommitted={handlePriceCommit}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000000}
                    step={50000}
                    valueLabelFormat={(val) => `${(val / 1000)}k`}
                    sx={{
                        color: 'var(--color-secondary)',
                        '& .MuiSlider-thumb': { '&:hover, &.Mui-focusVisible': { boxShadow: '0px 0px 0px 8px rgba(245, 166, 35, 0.16)' } }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">0đ</Typography>
                    <Typography variant="caption" color="text.secondary">1.000.000đ</Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Rating Filter */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'var(--color-primary)' }}>Đánh giá</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[5, 4, 3].map(star => (
                    <Box
                        key={star}
                        onClick={() => setFilters(f => ({ ...f, rating: f.rating === star ? undefined : star }))}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', p: 1, borderRadius: 1,
                            bgcolor: filters.rating === star ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                            '&:hover': { bgcolor: 'rgba(245, 166, 35, 0.05)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', color: 'var(--color-secondary)' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} sx={{ fontSize: 18, color: i < star ? 'var(--color-secondary)' : '#e0e0e0' }} />
                            ))}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: filters.rating === star ? 700 : 400 }}>Từ {star} sao</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

// Product Card Skeleton matching new ProductCard component
const ProductCardSkeleton = () => (
    <Box sx={{ borderRadius: '12px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid var(--color-border)', pb: 2 }}>
        <Skeleton variant="rectangular" sx={{ width: '100%', paddingTop: '150%' }} />
        <Box sx={{ p: 2 }}>
            <Skeleton width="60%" height={16} sx={{ mb: 1 }} />
            <Skeleton width="90%" height={24} sx={{ mb: 0.5 }} />
            <Skeleton width="70%" height={24} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="40%" height={32} />
                <Skeleton variant="circular" width={32} height={32} />
            </Box>
        </Box>
    </Box>
);

const ShopPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();

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

    const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

    const { categories, isLoading: categoriesLoading } = useCategories();

    useEffect(() => {
        const categoryName = searchParams.get('category') || '';
        const sortParam = searchParams.get('sort') || 'popular';
        const searchKeyword = searchParams.get('search') || '';
        const matchedCat = categories.find(c => c.name === categoryName);

        setFilters(f => ({
            ...f,
            category: categoryName,
            categoryId: matchedCat?.id ?? '',
            search: searchKeyword,
        }));
        setSearchInput(searchKeyword);
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
        size: 16, // Show 16 products per page for better grid (4x4 or 3x5)
    });

    const activeFilterCount = [
        filters.category !== '',
        filters.search !== '',
        filters.minPrice !== undefined,
        filters.rating !== undefined
    ].filter(Boolean).length;

    const clearFilters = useCallback(() => {
        setFilters({ category: '', categoryId: '', search: '', minPrice: undefined, maxPrice: undefined, rating: undefined });
        setSearchInput('');
        setPage(0);
    }, []);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box sx={{ bgcolor: 'var(--bg-default)', minHeight: '100vh', pb: 8 }}>
            {/* Breadcrumb bar */}
            <Box sx={{ bgcolor: 'var(--bg-paper)', borderBottom: '1px solid var(--color-border)', py: 2 }}>
                <Container maxWidth="lg">
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, letterSpacing: 0.5 }}>
                        Trang chủ / Cửa hàng {filters.category ? `/ ${filters.category}` : ''}
                    </Typography>
                    <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mt: 1, color: 'var(--color-primary)' }}>
                        {filters.category || 'Tất cả sách'}
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={4}>
                    {/* Sidebar */}
                    <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, position: 'sticky', top: 90, border: '1px solid var(--color-border)', bgcolor: 'var(--bg-paper)' }}>
                            <FilterSidebar
                                filters={filters}
                                setFilters={(updater) => { setFilters(updater); setPage(0); }}
                                onClear={clearFilters}
                                categories={categories}
                                categoriesLoading={categoriesLoading}
                            />
                        </Paper>
                    </Grid>

                    {/* Main Content */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        {/* Toolbar */}
                        <Paper elevation={0} sx={{ borderRadius: '12px', px: 3, py: 2, mb: 3, border: '1px solid var(--color-border)', bgcolor: 'var(--bg-paper)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {productsLoading ? 'Đang tải...' : <>Hiển thị <Typography component="span" sx={{ color: 'var(--color-primary)', fontWeight: 700 }}>{totalElements}</Typography> kết quả</>}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <Select
                                        value={sort}
                                        onChange={(e: SelectChangeEvent) => setSort(e.target.value)}
                                        displayEmpty
                                        sx={{ borderRadius: '8px', fontSize: '0.9rem', bgcolor: 'var(--bg-default)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-secondary)' } }}
                                    >
                                        {SORT_OPTIONS.map(o => (
                                            <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.9rem' }}>{o.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="outlined"
                                    onClick={() => setMobileFilterOpen(true)}
                                    sx={{ display: { xs: 'flex', md: 'none' }, borderRadius: '8px', borderColor: 'var(--color-border)', color: 'text.primary' }}
                                    startIcon={<Badge badgeContent={activeFilterCount} color="secondary"><FilterList /></Badge>}
                                >
                                    Lọc
                                </Button>
                            </Box>
                        </Paper>

                        {/* Active Filters Display */}
                        {activeFilterCount > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>Đang lọc:</Typography>
                                {filters.category && (
                                    <Chip label={filters.category} onDelete={() => { setFilters(f => ({ ...f, category: '', categoryId: '' })); setPage(0); }} sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-secondary)', fontWeight: 600, borderRadius: '4px' }} />
                                )}
                                {filters.search && (
                                    <Chip label={`"${filters.search}"`} onDelete={() => { setSearchInput(''); setFilters(f => ({ ...f, search: '' })); setPage(0); }} sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-secondary)', fontWeight: 600, borderRadius: '4px' }} />
                                )}
                                {filters.rating !== undefined && (
                                    <Chip label={`Từ ${filters.rating} sao`} onDelete={() => { setFilters(f => ({ ...f, rating: undefined })); setPage(0); }} sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-secondary)', fontWeight: 600, borderRadius: '4px' }} />
                                )}
                                <Typography onClick={clearFilters} sx={{ fontSize: '0.85rem', color: 'text.secondary', cursor: 'pointer', ml: 1, '&:hover': { color: 'var(--color-error)' } }}>
                                    Xóa tất cả
                                </Typography>
                            </Box>
                        )}

                        {/* Product Grid */}
                        {productsLoading ? (
                            <Grid container spacing={3}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <Grid size={{ xs: 6, sm: 4, lg: 3 }} key={`sk-${i}`}>
                                        <ProductCardSkeleton />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : products.length === 0 ? (
                            <Fade in>
                                <Paper elevation={0} sx={{ borderRadius: '12px', p: 8, textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                    <Typography fontSize={64} mb={2}>📚</Typography>
                                    <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 1, color: 'var(--color-primary)' }}>Không tìm thấy sách</Typography>
                                    <Typography sx={{ color: 'text.secondary', mb: 4 }}>Rất tiếc, chúng tôi không tìm thấy cuốn sách nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</Typography>
                                    <Button variant="contained" color="primary" onClick={clearFilters} sx={{ borderRadius: '24px', px: 4 }}>
                                        Xóa bộ lọc
                                    </Button>
                                </Paper>
                            </Fade>
                        ) : (
                            <Fade in>
                                <Grid container spacing={3}>
                                    {products.map(p => {
                                        // Ánh xạ thuộc tính để ProductCard có thể hiển thị (mock badges & discount)
                                        const productProps = {
                                            id: p.id,
                                            title: p.title || 'Đang cập nhật',
                                            author: p.author || 'Đang cập nhật',
                                            coverImage: p.img,
                                            price: p.price,
                                            rating: p.rating || (4.5 + Math.random() * 0.5), // Mock rating
                                            reviewCount: Math.floor(Math.random() * 500) + 50, // Mock reviews
                                            badges: Math.random() > 0.8 ? ['bestseller' as const] : [],
                                            onQuickView: () => setQuickViewProduct(p),
                                            onAddToCart: () => {
                                                addToCart({ ...p, qty: 1 });
                                                openCart();
                                            }
                                        };
                                        return (
                                            <Grid size={{ xs: 6, sm: 4, lg: 3 }} key={p.id} sx={{ display: 'flex' }}>
                                                <ProductCard {...productProps} />
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Fade>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && !productsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                                <Pagination
                                    count={totalPages}
                                    page={page + 1}
                                    onChange={handlePageChange}
                                    color="secondary"
                                    size="large"
                                    sx={{
                                        '& .MuiPaginationItem-root': { fontWeight: 600 },
                                    }}
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* Mobile filter drawer */}
            <Drawer anchor="left" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} PaperProps={{ sx: { width: 280, p: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: 'var(--color-primary)' }}>Bộ lọc</Typography>
                    <IconButton onClick={() => setMobileFilterOpen(false)}><Close /></IconButton>
                </Box>
                <FilterSidebar
                    filters={filters}
                    setFilters={(updater) => { setFilters(updater); setPage(0); }}
                    onClear={clearFilters}
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    onClose={() => setMobileFilterOpen(false)}
                />
            </Drawer>

            {/* Quick View Modal */}
            <QuickViewModal
                open={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                product={quickViewProduct}
                onAddToCart={(id, quantity) => console.log('Added to cart via QuickView:', id, quantity)}
            />
        </Box>
    );
};

export default ShopPage;