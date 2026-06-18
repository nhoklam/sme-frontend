import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Paper, Button,
    TextField, InputAdornment, Select, MenuItem,
    FormControl, Chip, IconButton, Drawer, Badge,
    Pagination, Skeleton, Fade, Divider, Slider,
    Breadcrumbs, Link, Popover, Menu
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Search, FilterList, Close, GridView, ViewList,
    ChevronRight, Star, KeyboardArrowDown
} from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import { useCategories, DisplayCategory } from '../hooks/useCategories';
import ProductCard from '../../../components/common/ProductCard';
import QuickViewModal from '../../../components/common/QuickViewModal';
import { useCartContext } from '../../../store/CartContext';

const SORT_OPTIONS = [
    { value: 'soldDesc', label: 'Bán chạy nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'priceAsc', label: 'Giá tăng dần' },
    { value: 'priceDesc', label: 'Giá giảm dần' },
];

interface ShopFilters {
    category: string;
    categoryId: string;
    search: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
}

// Removed FilterSidebar Component as we use horizontal filters now

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
    const [sort, setSort] = useState('soldDesc');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(0);
    const [searchInput, setSearchInput] = useState('');

    const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

    const { categories, flatCategories, isLoading: categoriesLoading } = useCategories();

    // Horizontal Filter States
    const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
    const [priceAnchorEl, setPriceAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [ratingAnchorEl, setRatingAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handlePriceClick = (event: React.MouseEvent<HTMLButtonElement>) => { setPriceAnchorEl(event.currentTarget); };
    const handlePriceClose = () => { setPriceAnchorEl(null); };
    
    const handleRatingClick = (event: React.MouseEvent<HTMLButtonElement>) => { setRatingAnchorEl(event.currentTarget); };
    const handleRatingClose = () => { setRatingAnchorEl(null); };

    useEffect(() => {
        const categoryName = searchParams.get('category') || '';
        const sortParam = searchParams.get('sort') || 'soldDesc';
        const searchKeyword = searchParams.get('keyword') || searchParams.get('search') || '';
        const matchedCat = flatCategories.find(c => c.name === categoryName);

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
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.rating,
        sortBy: sort !== 'soldDesc' ? sort : 'soldDesc',
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

    const renderCategoryOptions = (nodes: any[], level = 0): React.ReactNode[] => {
        let items: React.ReactNode[] = [];
        nodes.forEach(node => {
            items.push(
                <MenuItem key={node.id} value={node.id} sx={{ fontSize: '0.9rem', pl: 2 + level * 2 }}>
                    {level > 0 ? '— '.repeat(level) : ''}{node.name}
                </MenuItem>
            );
            if (node.children && node.children.length > 0) {
                items = items.concat(renderCategoryOptions(node.children, level + 1));
            }
        });
        return items;
    };

    return (
        <Box sx={{ bgcolor: 'var(--bg-default)', minHeight: '100vh', pb: 8 }}>
            {/* Breadcrumb bar - Hide when searching without category */}
            {(!filters.search || filters.category) && (
                <Box sx={{ bgcolor: 'var(--bg-paper)', borderBottom: '1px solid var(--color-border)', py: 2 }}>
                    <Container maxWidth="lg">
                        <Breadcrumbs sx={{ fontSize: 13, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
                            <Link
                                underline="hover"
                                color="inherit"
                                onClick={() => navigate('/')}
                                sx={{ cursor: 'pointer', fontWeight: 500 }}
                            >
                                Trang chủ
                            </Link>
                            <Link
                                underline="hover"
                                color={filters.category ? 'inherit' : 'var(--color-secondary)'}
                                onClick={() => {
                                    setFilters(f => ({ ...f, category: '', categoryId: '' }));
                                    setPage(0);
                                    navigate('/shop');
                                }}
                                sx={{ cursor: 'pointer', fontWeight: filters.category ? 500 : 700 }}
                            >
                                Cửa hàng
                            </Link>
                            {filters.category && (
                                <Typography fontSize={13} color="var(--color-secondary)" fontWeight={700}>
                                    {filters.category}
                                </Typography>
                            )}
                        </Breadcrumbs>
                    </Container>
                </Box>
            )}

            {/* Premium Hero Banner - Light Version */}
            {(!filters.search || filters.category) && (
                <Box sx={{ 
                    bgcolor: 'rgba(245, 166, 35, 0.04)', 
                    borderBottom: '1px solid rgba(245, 166, 35, 0.15)',
                    py: { xs: 3, md: 5 }, 
                    mb: 4, 
                }}>
                    <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ 
                            fontFamily: '"Playfair Display", serif', 
                            fontWeight: 700, 
                            mb: 1.5, 
                            color: 'var(--color-primary)' 
                        }}>
                            {filters.category || 'Tất Cả Sách'}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
                            Khám phá kho tàng tri thức với <Typography component="span" fontWeight="bold" color="var(--color-secondary)">{totalElements || 0}</Typography> sản phẩm đang chờ bạn
                        </Typography>
                    </Container>
                </Box>
            )}

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={4}>
                    {/* Main Content Full Width */}
                    <Grid size={{ xs: 12 }}>
                        {/* Search Result Header */}
                        {(filters.search && !filters.category) && (
                            <Paper elevation={0} sx={{ borderRadius: '12px', px: 3, py: 2, mb: 3, border: '1px solid var(--color-border)', bgcolor: '#fff' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                                    Kết quả tìm kiếm cho "{filters.search}"
                                </Typography>
                            </Paper>
                        )}

                        {/* Horizontal Toolbar - Hide when searching without category */}
                        {(!filters.search || filters.category) && (
                            <Paper elevation={0} sx={{ borderRadius: '12px', px: 3, py: 2, mb: 3, border: '1px solid var(--color-border)', bgcolor: 'var(--bg-paper)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                
                                {/* Left Filters */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                {/* Category Dropdown */}
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <Select
                                        value={filters.categoryId || 'all'}
                                        onChange={(e: SelectChangeEvent) => {
                                            const catId = e.target.value;
                                            if (catId === 'all') {
                                                setFilters(f => ({ ...f, category: '', categoryId: '' }));
                                            } else {
                                                const cat = flatCategories.find(c => c.id === catId);
                                                if (cat) setFilters(f => ({ ...f, category: cat.name, categoryId: cat.id }));
                                            }
                                            setPage(0);
                                        }}
                                        displayEmpty
                                        sx={{ borderRadius: '8px', fontSize: '0.9rem', bgcolor: 'var(--bg-default)' }}
                                    >
                                        <MenuItem value="all" sx={{ fontSize: '0.9rem' }}>Tất cả danh mục</MenuItem>
                                        {renderCategoryOptions(categories)}
                                    </Select>
                                </FormControl>

                                {/* Price Dropdown */}
                                <Button 
                                    variant="outlined" 
                                    endIcon={<KeyboardArrowDown />}
                                    onClick={handlePriceClick}
                                    sx={{ borderRadius: '8px', color: 'text.primary', borderColor: 'var(--color-border)' }}
                                >
                                    Khoảng giá
                                </Button>
                                <Popover
                                    open={Boolean(priceAnchorEl)}
                                    anchorEl={priceAnchorEl}
                                    onClose={handlePriceClose}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                    PaperProps={{ sx: { p: 3, width: 300, mt: 1, borderRadius: '12px' } }}
                                >
                                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Chọn khoảng giá</Typography>
                                    <Slider
                                        value={priceRange}
                                        onChange={(e, val) => setPriceRange(val as number[])}
                                        onChangeCommitted={(e, val) => {
                                            const [min, max] = val as number[];
                                            setFilters(f => ({ ...f, minPrice: min, maxPrice: max }));
                                            setPage(0);
                                            handlePriceClose();
                                        }}
                                        valueLabelDisplay="auto"
                                        min={0} max={1000000} step={50000}
                                        valueLabelFormat={(val) => `${val / 1000}k`}
                                        sx={{ color: 'var(--color-secondary)' }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="caption" color="text.secondary">0đ</Typography>
                                        <Typography variant="caption" color="text.secondary">1.000.000đ</Typography>
                                    </Box>
                                </Popover>

                                {/* Rating Dropdown */}
                                <Button 
                                    variant="outlined" 
                                    endIcon={<KeyboardArrowDown />}
                                    onClick={handleRatingClick}
                                    sx={{ borderRadius: '8px', color: 'text.primary', borderColor: 'var(--color-border)' }}
                                >
                                    Đánh giá
                                </Button>
                                <Menu
                                    anchorEl={ratingAnchorEl}
                                    open={Boolean(ratingAnchorEl)}
                                    onClose={handleRatingClose}
                                    PaperProps={{ sx: { mt: 1, borderRadius: '12px', minWidth: 200 } }}
                                >
                                    {[5, 4, 3].map(star => (
                                        <MenuItem 
                                            key={star} 
                                            onClick={() => {
                                                setFilters(f => ({ ...f, rating: star }));
                                                setPage(0);
                                                handleRatingClose();
                                            }}
                                            sx={{ display: 'flex', gap: 1, py: 1.5 }}
                                        >
                                            <Box sx={{ display: 'flex', color: 'var(--color-secondary)' }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} sx={{ fontSize: 18, color: i < star ? 'var(--color-secondary)' : '#e0e0e0' }} />
                                                ))}
                                            </Box>
                                            <Typography variant="body2">Từ {star} sao</Typography>
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Box>

                            {/* Right Sort & Count */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, display: { xs: 'none', md: 'block' } }}>
                                    {productsLoading ? 'Đang tải...' : <>Hiển thị <Typography component="span" sx={{ color: 'var(--color-primary)', fontWeight: 700 }}>{totalElements}</Typography> kết quả</>}
                                </Typography>
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
                            </Box>
                        </Paper>
                        )}

                        {/* Active Filters Display */}
                        {(activeFilterCount > 0 && (!filters.search || filters.category)) && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>Đang lọc:</Typography>
                                {filters.category && (
                                    <Chip label={filters.category} onDelete={() => { setFilters(f => ({ ...f, category: '', categoryId: '' })); setPage(0); }} sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-secondary)', fontWeight: 600, borderRadius: '4px' }} />
                                )}
                                {filters.search && (
                                    <Chip label={`Từ khóa: "${filters.search}"`} onDelete={() => { setSearchInput(''); setFilters(f => ({ ...f, search: '' })); setPage(0); }} sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-secondary)', fontWeight: 600, borderRadius: '4px' }} />
                                )}
                                {filters.minPrice !== undefined && filters.maxPrice !== undefined && (
                                    <Chip label={`Giá: ${(filters.minPrice/1000)}k - ${(filters.maxPrice/1000)}k`} onDelete={() => { setFilters(f => ({ ...f, minPrice: undefined, maxPrice: undefined })); setPage(0); }} sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-secondary)', fontWeight: 600, borderRadius: '4px' }} />
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
                                        // Ánh xạ thuộc tính để ProductCard có thể hiển thị
                                        const productProps = {
                                            id: p.id,
                                            title: p.title || 'Đang cập nhật',
                                            author: p.author || 'Đang cập nhật',
                                            coverImage: p.img,
                                            price: p.price,
                                            rating: p.rating || 0, 
                                            reviewCount: 0, 
                                            badges: [] as const,
                                            sold: p.sold || 0,
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