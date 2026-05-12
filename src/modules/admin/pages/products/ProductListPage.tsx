import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../services/axiosConfig';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField,
    InputAdornment, Chip, IconButton, Select, MenuItem,
    FormControl, Skeleton, Alert, Tooltip, Pagination,
    Button, Grid, Checkbox
} from '@mui/material';
import {
    Search, Add, Visibility, Edit, ImageNotSupported,
    Refresh, Print, FilterList
} from '@mui/icons-material';
import JsBarcode from 'jsbarcode';
import BarcodePrintDialog, { BarcodePrintItem } from '../../../../components/common/BarcodePrintDialog';

// ── Helpers ──────────────────────────────────────────────────
const fmtCurrency = (n) =>
    n == null ? '—'
        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ── Thumbnail ─────────────────────────────────────────────────
const ProductThumb = ({ url, name }) => {
    const [err, setErr] = useState(false);
    if (!url || err) {
        return (
            <Box sx={{ width: 40, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f9fafb', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                <ImageNotSupported sx={{ fontSize: 18, color: '#d1d5db' }} />
            </Box>
        );
    }
    return (
        <Box component="img" src={url} alt={name}
            onError={() => setErr(true)}
            sx={{ width: 40, height: 52, objectFit: 'contain', borderRadius: 1.5, border: '1px solid #e5e7eb', bgcolor: '#fafaf9' }}
        />
    );
};

// ── Status Chip ───────────────────────────────────────────────
const StatusChip = ({ isActive, stock }) => {
    if (!isActive) return <Chip label="Ngừng bán" size="small" sx={{ bgcolor: '#f3f4f6', color: '#6b7280', fontWeight: 600, fontSize: 11, height: 22 }} />;
    if (stock === 0) return <Chip label="Hết hàng" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: 11, height: 22 }} />;
    return <Chip label="Đang bán" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: 11, height: 22 }} />;
};



// ── Main ─────────────────────────────────────────────────────
const ProductListPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [isActive, setIsActive] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [printItems, setPrintItems] = useState<BarcodePrintItem[]>([]);

    const PAGE_SIZE = 15;

    const loadSuppliers = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/suppliers');
            const data = res.data?.data;
            setSuppliers(Array.isArray(data) ? data : (data?.content ?? []));
        } catch { }
    }, []);

    const loadCategories = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/categories');
            setCategories(res.data?.data ?? []);
        } catch { /* silent */ }
    }, []);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('size', PAGE_SIZE.toString());
            if (search.trim()) params.set('keyword', search.trim());
            if (categoryId) params.set('categoryId', categoryId);
            if (supplierId) params.set('supplierId', supplierId);
            if (minPrice) params.set('minPrice', minPrice);
            if (maxPrice) params.set('maxPrice', maxPrice);
            if (isActive !== '') params.set('isActive', isActive);

            const res = await axiosInstance.get(`/products?${params}`);
            const data = res.data?.data;
            setProducts(data?.content ?? []);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch (e) {
            setError('Không thể tải danh sách sản phẩm.');
        } finally {
            setLoading(false);
        }
    }, [search, categoryId, supplierId, minPrice, maxPrice, isActive, page]);

    useEffect(() => {
        loadCategories();
        loadSuppliers();
    }, [loadCategories, loadSuppliers]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(0);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleExport = () => {
        const params = new URLSearchParams();
        if (search.trim()) params.set('keyword', search.trim());
        if (categoryId) params.set('categoryId', categoryId);
        if (supplierId) params.set('supplierId', supplierId);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (isActive !== '') params.set('isActive', isActive);

        window.open(`${axiosInstance.defaults.baseURL}/products/export?${params.toString()}`, '_blank');
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(products.map((p: any) => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkPrint = () => {
        const selectedProducts = products.filter((p: any) => selectedIds.includes(p.id) && p.isbnBarcode);
        const items = selectedProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || '',
            barcode: p.isbnBarcode,
            price: p.retailPrice,
            imageUrl: p.imageUrl
        }));
        setPrintItems(items);
    };

    const stats = [
        { label: 'Tổng sản phẩm', value: totalElements },
        { label: 'Đang bán', value: products.filter((p: any) => p.isActive && p.availableQuantity > 0).length },
        { label: 'Hết hàng', value: products.filter((p: any) => p.availableQuantity === 0).length },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#fafaf9', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#9ca3af" fontSize={11}>
                        Dashboard / <strong style={{ color: '#6b7280' }}>Sản phẩm</strong>
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">
                        Danh mục hàng hóa
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {selectedIds.length > 0 && (
                        <>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                sx={{ textTransform: 'none', borderRadius: 2, height: 36, bgcolor: '#fff' }}
                            >
                                Xóa ({selectedIds.length})
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleBulkPrint}
                                startIcon={<Print />}
                                sx={{ textTransform: 'none', borderRadius: 2, height: 36, bgcolor: '#fff', color: '#10b981', borderColor: '#10b981', '&:hover': { bgcolor: '#ecfdf5', borderColor: '#059669' } }}
                            >
                                In tem ({selectedIds.length})
                            </Button>
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => setSelectedIds([])}
                                sx={{ textTransform: 'none', color: '#64748b', mr: 1 }}
                            >
                                Bỏ chọn tất cả
                            </Button>
                        </>
                    )}
                    <Tooltip title="Làm mới">
                        <IconButton onClick={loadProducts} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 36, width: 36 }}>
                            <Refresh sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Button variant="outlined" startIcon={<Print />}
                        onClick={handleExport}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, borderColor: '#e0e0e0', color: '#555', height: 36 }}>
                        Xuất file
                    </Button>
                    <Button variant="contained" startIcon={<Add />}
                        onClick={() => navigate('/admin/products/create')}
                        sx={{ bgcolor: '#1d4ed8', textTransform: 'none', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#1e40af' }, height: 36 }}>
                        Thêm hàng hóa
                    </Button>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2.5 }}>
                {stats.map(s => (
                    <Paper key={s.label} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                        {loading ? <Skeleton height={30} /> : <Typography variant="h5" fontWeight={800} color="#111">{s.value}</Typography>}
                        <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Paper>
                ))}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        size="small" placeholder="Tìm theo tên, SKU, ISBN..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        sx={{ flex: 1, minWidth: 240 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#9ca3af' }} /></InputAdornment> }}
                    />
                    <Button
                        variant={showFilters ? 'contained' : 'outlined'}
                        size="small"
                        startIcon={<FilterList />}
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, height: 40 }}
                    >
                        Bộ lọc {showFilters ? 'đang mở' : ''}
                    </Button>
                </Box>

                {showFilters && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #eee' }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="#666" display="block" mb={0.5}>DANH MỤC</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(0); }} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Tất cả danh mục</MenuItem>
                                        {categories.map(c => <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13 }}>{c.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="#666" display="block" mb={0.5}>NHÀ CUNG CẤP</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={supplierId} onChange={e => { setSupplierId(e.target.value); setPage(0); }} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Tất cả nhà cung cấp</MenuItem>
                                        {suppliers.map(s => <MenuItem key={s.id} value={s.id} sx={{ fontSize: 13 }}>{s.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="#666" display="block" mb={0.5}>TRẠNG THÁI</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={isActive} onChange={e => { setIsActive(e.target.value); setPage(0); }} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Tất cả trạng thái</MenuItem>
                                        <MenuItem value="true" sx={{ fontSize: 13 }}>Đang bán</MenuItem>
                                        <MenuItem value="false" sx={{ fontSize: 13 }}>Ngừng bán</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight={700} color="#666" display="block" mb={0.5}>GIÁ TỪ</Typography>
                                        <TextField fullWidth size="small" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} sx={{ '& .MuiOutlinedInput-input': { fontSize: 13 } }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight={700} color="#666" display="block" mb={0.5}>ĐẾN GIÁ</Typography>
                                        <TextField fullWidth size="small" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} sx={{ '& .MuiOutlinedInput-input': { fontSize: 13 } }} />
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => {
                                        setSearch('');
                                        setCategoryId('');
                                        setSupplierId('');
                                        setIsActive('');
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setPage(0);
                                    }}
                                    sx={{ textTransform: 'none', fontWeight: 700, color: '#ef4444' }}
                                >
                                    Đặt lại bộ lọc
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {totalElements > 0 && (
                    <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        Hiển thị <strong>{products.length}</strong> / <strong>{totalElements}</strong> sản phẩm
                    </Typography>
                )}
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafaf9' }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
                                        checked={products.length > 0 && selectedIds.length === products.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                {['Sản phẩm', 'Danh mục', 'SKU', 'Barcode', 'Giá bán lẻ', 'Tồn kho', 'Trạng thái', 'Thao tác'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 600, fontSize: 11, color: '#6b7280', py: 1.5, letterSpacing: 0.3 }}>
                                        {c.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <TableRow key={i}>
                                    <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                                    {[60, 80, 60, 100, 80, 50, 70, 40].map((w, j) => (
                                        <TableCell key={j}><Skeleton width={w} height={20} /></TableCell>
                                    ))}
                                </TableRow>
                            )) : products.length > 0 ? products.map((p: any, i) => {
                                const barcodeRef = React.createRef<HTMLCanvasElement>();
                                if (p.isbnBarcode) {
                                    setTimeout(() => {
                                        try {
                                            if (barcodeRef.current) {
                                                JsBarcode(barcodeRef.current, p.isbnBarcode, {
                                                    width: 1, height: 28, displayValue: true,
                                                    fontSize: 10, margin: 2, background: 'transparent',
                                                });
                                            }
                                        } catch { }
                                    }, 0);
                                }
                                return (
                                    <TableRow key={p.id} hover
                                        sx={{ bgcolor: selectedIds.includes(p.id) ? '#eff6ff' : (i % 2 === 0 ? '#fff' : '#fafaf9'), '&:hover': { bgcolor: '#f0f9ff !important' } }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox color="primary" checked={selectedIds.includes(p.id)} onChange={() => handleSelectRow(p.id)} />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <ProductThumb url={p.imageUrl} name={p.name} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" fontWeight={600} fontSize={13} noWrap sx={{ maxWidth: 200 }}>
                                                        {p.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">{p.unit}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={p.categoryName || '—'} size="small"
                                                sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 11, height: 22 }} />
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{p.sku || '—'}</TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            {p.isbnBarcode ? (
                                                <canvas ref={barcodeRef} style={{ maxWidth: 120, height: 35 }} />
                                            ) : (
                                                <Typography variant="caption" color="#bbb">—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                                            {fmtCurrency(p.retailPrice)}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700} fontSize={13}
                                                color={p.availableQuantity === 0 ? '#ef4444' : p.availableQuantity < 10 ? '#f59e0b' : '#10b981'}>
                                                {p.availableQuantity?.toLocaleString() ?? 0}
                                            </Typography>
                                        </TableCell>
                                        <TableCell><StatusChip isActive={p.isActive} stock={p.availableQuantity ?? 0} /></TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Xem chi tiết">
                                                    <IconButton size="small" onClick={() => navigate(`/admin/products/${p.id}`)}
                                                        sx={{ '&:hover': { color: '#3b82f6', bgcolor: '#eff6ff' } }}>
                                                        <Visibility sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Chỉnh sửa">
                                                    <IconButton size="small" onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                                                        sx={{ '&:hover': { color: '#f59e0b', bgcolor: '#fef3c7' } }}>
                                                        <Edit sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {p.isbnBarcode && (
                                                    <Tooltip title="In mã vạch">
                                                        <IconButton size="small" onClick={() => setPrintItems([{ id: p.id, name: p.name, sku: p.sku || '', barcode: p.isbnBarcode, price: p.retailPrice, imageUrl: p.imageUrl }])}
                                                            sx={{ '&:hover': { color: '#10b981', bgcolor: '#e8f5e9' } }}>
                                                            <Print sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={40} mb={1}>🔍</Typography>
                                        <Typography variant="body2" color="text.secondary">Không tìm thấy sản phẩm nào</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Pagination
                            count={totalPages} page={page + 1}
                            onChange={(_, v) => setPage(v - 1)}
                            color="primary" shape="rounded" size="small"
                        />
                    </Box>
                )}
            </Paper>

            <BarcodePrintDialog open={printItems.length > 0} onClose={() => setPrintItems([])} items={printItems} />
        </Box>
    );
};

export default ProductListPage;