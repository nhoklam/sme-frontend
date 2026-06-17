import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Grid, Chip,
    Divider, IconButton, Switch, Alert, Snackbar,
    Skeleton, Table, TableBody, TableCell, TableRow,
    TableContainer, TableHead, Tabs, Tab
} from '@mui/material';
import {
    ArrowBack, Edit, ImageNotSupported,
    ZoomIn, Close,
    Inventory2Outlined, TrendingUp, LocalOffer,
    StorefrontOutlined, QrCodeOutlined, Refresh, History,
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import productService from '../../../../services/productService';
import BarcodeGenerator from '../../components/products/BarcodeGenerator';
import { ProductResponse, Category, Supplier, Inventory } from '../../../../types';

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n?: number) =>
    n == null
        ? '—'
        : new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(n);

// ── Image Panel ────────────────────────────────────────────────
const MultiImagePanel = ({ urls }: { urls: string[] }) => {
    const [err, setErr] = useState<Record<number, boolean>>({});
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [activeIdx, setActiveIdx] = useState(0);

    const validUrls = urls && urls.length > 0 ? urls : [];

    if (validUrls.length === 0) {
        return (
            <Box
                sx={{
                    height: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f9f9f9',
                    borderRadius: 1.5,
                    border: '1px dashed #e0e0e0',
                    gap: 1,
                }}
            >
                <ImageNotSupported sx={{ fontSize: 36, color: '#ccc' }} />
                <Typography variant="caption" color="#bbb">
                    Chưa có hình ảnh
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box
                sx={{
                    position: 'relative',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: '1px solid #e8e8e8',
                    bgcolor: '#f9f9f9',
                    cursor: 'zoom-in',
                    mb: 1,
                    '&:hover .zoom-btn': { opacity: 1 },
                }}
                onClick={() => setLightbox(validUrls[activeIdx])}
            >
                <Box
                    component="img"
                    src={validUrls[activeIdx]}
                    alt="product"
                    onError={() => setErr(prev => ({ ...prev, [activeIdx]: true }))}
                    sx={{ width: '100%', height: 220, objectFit: 'contain', display: err[activeIdx] ? 'none' : 'block' }}
                />
                {err[activeIdx] && (
                    <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageNotSupported sx={{ fontSize: 36, color: '#ccc' }} />
                    </Box>
                )}
                <IconButton
                    className="zoom-btn"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setLightbox(validUrls[activeIdx]); }}
                    sx={{
                        position: 'absolute', top: 6, right: 6,
                        bgcolor: 'rgba(255,255,255,0.92)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        width: 26, height: 26, opacity: 0, transition: 'opacity 0.2s',
                        '&:hover': { bgcolor: '#fff' },
                    }}
                >
                    <ZoomIn sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
            
            {validUrls.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {validUrls.map((u, i) => (
                        <Box key={i} onClick={() => setActiveIdx(i)}
                            sx={{
                                width: 48, height: 60, borderRadius: 1, border: i === activeIdx ? '2px solid #d32f2f' : '1px solid #e0e0e0',
                                overflow: 'hidden', cursor: 'pointer', bgcolor: '#fff',
                                p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                            <Box component="img" src={u} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </Box>
                    ))}
                </Box>
            )}

            {lightbox && (
                <Box
                    onClick={() => setLightbox(null)}
                    sx={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        bgcolor: 'rgba(0,0,0,0.88)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out',
                    }}
                >
                    <IconButton
                        onClick={() => setLightbox(null)}
                        sx={{
                            position: 'fixed', top: 16, right: 16,
                            bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                        }}
                    >
                        <Close />
                    </IconButton>
                    <Box
                        component="img"
                        src={lightbox}
                        alt="zoom"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                            maxWidth: '88vw', maxHeight: '88vh',
                            objectFit: 'contain', borderRadius: 2,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                            cursor: 'default',
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

// ── Section wrapper ────────────────────────────────────────────
const AdminSection = ({
    title,
    icon,
    action,
    children,
    noPad,
}: {
    title: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    noPad?: boolean;
}) => (
    <Paper
        elevation={0}
        sx={{ borderRadius: 2, border: '1px solid #eeeeee', overflow: 'hidden', mb: 2 }}
    >
        <Box
            sx={{
                px: 2.5, py: 1.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon && <Box sx={{ color: '#aaa', display: 'flex', alignItems: 'center' }}>{icon}</Box>}
                <Typography
                    variant="body2"
                    fontWeight={700}
                    color="#444"
                    letterSpacing={0.3}
                    fontSize={12}
                    textTransform="uppercase"
                >
                    {title}
                </Typography>
            </Box>
            {action}
        </Box>
        <Box sx={noPad ? {} : { p: 2.5 }}>{children}</Box>
    </Paper>
);

// ── Field row ──────────────────────────────────────────────────
const FieldRow = ({
    label,
    value,
    mono,
    valueColor,
    border = true,
}: {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
    valueColor?: string;
    border?: boolean;
}) => (
    <Box
        sx={{
            display: 'flex', alignItems: 'flex-start', gap: 2,
            py: 1.25, borderBottom: border ? '1px solid #f5f5f5' : 'none',
        }}
    >
        <Typography
            variant="caption"
            color="#999"
            fontWeight={600}
            sx={{ minWidth: 130, flexShrink: 0, pt: 0.1, fontSize: 12, letterSpacing: 0.2 }}
        >
            {label}
        </Typography>
        <Typography
            variant="body2"
            fontWeight={600}
            sx={{
                color: valueColor || '#222',
                fontSize: 13,
                fontFamily: mono ? 'monospace' : 'inherit',
                letterSpacing: mono ? 0.5 : 0,
            }}
        >
            {value}
        </Typography>
    </Box>
);

// ── Stat card ──────────────────────────────────────────────────
const StatCard = ({
    label,
    value,
    sub,
    color = '#1a1a2e',
    bg = '#f9f9f9',
    border = '#eeeeee',
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
    bg?: string;
    border?: string;
}) => (
    <Box
        sx={{ p: 2, borderRadius: 1.5, bgcolor: bg, border: `1px solid ${border}`, flex: 1, minWidth: 110 }}
    >
        <Typography
            variant="caption"
            color="#999"
            fontSize={11}
            fontWeight={600}
            letterSpacing={0.3}
            display="block"
            mb={0.5}
        >
            {label}
        </Typography>
        <Typography variant="body1" fontWeight={800} color={color} fontSize={15} lineHeight={1.2}>
            {value}
        </Typography>
        {sub && (
            <Typography variant="caption" color="#aaa" fontSize={10} display="block" mt={0.3}>
                {sub}
            </Typography>
        )}
    </Box>
);

// ══════════════════════════════════════════════════════════════
const ProductDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [error, setError] = useState('');
    const [snack, setSnack] = useState('');

    const loadProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const p = await productService.getById(id);
            setProduct(p);

            if (p.categoryId) {
                try {
                    const catRes = await axiosInstance.get(`/categories`);
                    const cats: Category[] = catRes.data?.data ?? [];
                    setCategory(cats.find((c) => c.id === p.categoryId) ?? null);
                } catch { }
            }

            if (p.supplierId) {
                try {
                    const supRes = await axiosInstance.get(`/suppliers/${p.supplierId}`);
                    setSupplier(supRes.data?.data ?? null);
                } catch { }
            }

            try {
                const invRes = await axiosInstance.get(`/inventory/product/${id}/all-warehouses`);
                setInventories(invRes.data?.data || []);
            } catch { }

            try {
                const hist = await productService.getPriceHistory(id);
                setPriceHistory(hist);
            } catch { }
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải thông tin sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    const handleToggleActive = async () => {
        if (!product) return;
        try {
            await axiosInstance.put(`/products/${product.id}`, { isActive: !product.isActive });
            setProduct({ ...product, isActive: !product.isActive });
            setSnack('Đã cập nhật trạng thái sản phẩm');
        } catch {
            setSnack('Cập nhật thất bại');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
                <Skeleton width={300} height={40} sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 2 }} />
                        <Skeleton height={120} sx={{ borderRadius: 2 }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Skeleton height={200} sx={{ borderRadius: 2, mb: 2 }} />
                        <Skeleton height={160} sx={{ borderRadius: 2 }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Skeleton height={180} sx={{ borderRadius: 2, mb: 2 }} />
                        <Skeleton height={120} sx={{ borderRadius: 2 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    if (error || !product) {
        return (
            <Box
                sx={{
                    p: 4, textAlign: 'center', bgcolor: '#f8f9fb', minHeight: '100vh',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <Typography fontSize={48} mb={1}>😕</Typography>
                <Typography variant="h6" fontWeight={700} color="#333">
                    {error || 'Không tìm thấy sản phẩm'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    ID: {id}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadProduct}
                        sx={{ textTransform: 'none' }}
                    >
                        Thử lại
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#d32f2f', textTransform: 'none', '&:hover': { bgcolor: '#b71c1c' } }}
                        onClick={() => navigate('/admin/products')}
                    >
                        Quay lại danh sách
                    </Button>
                </Box>
            </Box>
        );
    }

    const totalStock = product.availableQuantity ?? 0;
    const margin =
        product.retailPrice > 0
            ? (((product.retailPrice - product.macPrice) / product.retailPrice) * 100).toFixed(1)
            : '0.0';

    const statusColor = !product.isActive
        ? '#888'
        : totalStock === 0
            ? '#d32f2f'
            : '#2e7d32';

    const statusLabel = !product.isActive
        ? 'Ngừng bán'
        : totalStock === 0
            ? 'Hết hàng'
            : 'Đang bán';

    const statusDot = !product.isActive ? '#bbb' : totalStock === 0 ? '#d32f2f' : '#4caf50';

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* ── HEADER ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate('/admin/products')}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, bgcolor: '#fff' }}
                    >
                        <ArrowBack sx={{ fontSize: 17 }} />
                    </IconButton>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.3 }}>
                            <Typography
                                variant="caption"
                                color="#aaa"
                                sx={{ cursor: 'pointer', '&:hover': { color: '#d32f2f' } }}
                                onClick={() => navigate('/admin/products')}
                            >
                                Sản phẩm
                            </Typography>
                            <Typography variant="caption" color="#ddd">/</Typography>
                            <Typography variant="caption" color="#666" fontWeight={600}>
                                Chi tiết
                            </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={800} color="#1a1a2e" lineHeight={1.2}>
                            {product.name}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Inventory2Outlined sx={{ fontSize: 15 }} />}
                        onClick={() => navigate('/admin/inventory/import')}
                        sx={{
                            textTransform: 'none', fontSize: 13, fontWeight: 600,
                            borderColor: '#e0e0e0', color: '#555', '&:hover': { bgcolor: '#f5f5f5' },
                        }}
                    >
                        Nhập kho
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit sx={{ fontSize: 15 }} />}
                        onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        sx={{
                            textTransform: 'none', fontSize: 13, fontWeight: 600,
                            borderColor: '#1976d2', color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' },
                        }}
                    >
                        Chỉnh sửa
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Refresh sx={{ fontSize: 15 }} />}
                        onClick={loadProduct}
                        sx={{
                            textTransform: 'none', fontSize: 13,
                            borderColor: '#e0e0e0', color: '#555',
                        }}
                    >
                        Làm mới
                    </Button>
                </Box>
            </Box>

            {/* ── STATUS BAR ── */}
            <Paper
                elevation={0}
                sx={{
                    px: 2.5, py: 1.5, borderRadius: 2, mb: 2,
                    border: '1px solid #eeeeee', bgcolor: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusDot }} />
                        <Typography variant="body2" fontWeight={700} color={statusColor} fontSize={13}>
                            {statusLabel}
                        </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <QrCodeOutlined sx={{ fontSize: 14, color: '#aaa' }} />
                        <Typography variant="caption" color="#888" fontFamily="monospace" fontWeight={600}>
                            {product.sku || '—'}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="#aaa" fontFamily="monospace">
                        {product.isbnBarcode}
                    </Typography>
                    <Chip
                        label={category?.name || product.categoryId}
                        size="small"
                        sx={{ height: 20, fontSize: 11, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }}
                    />
                    {supplier && (
                        <Chip
                            label={supplier.name}
                            size="small"
                            sx={{ height: 20, fontSize: 11, bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 600 }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="#888" fontSize={12}>
                        Hiển thị bán:
                    </Typography>
                    <Switch
                        size="small"
                        checked={product.isActive}
                        onChange={handleToggleActive}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' },
                        }}
                    />
                </Box>
            </Paper>

            <Grid container spacing={2}>
                {/* ── CỘT TRÁI ── */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <AdminSection title="Hình ảnh" icon={<StorefrontOutlined sx={{ fontSize: 14 }} />}>
                        <MultiImagePanel urls={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : [])} />
                    </AdminSection>
                    
                    {product.isbnBarcode && (
                        <AdminSection title="Mã vạch" icon={<QrCodeOutlined sx={{ fontSize: 14 }} />}>
                            <BarcodeGenerator value={product.isbnBarcode} />
                        </AdminSection>
                    )}

                    <AdminSection title="Thông số" icon={<LocalOffer sx={{ fontSize: 14 }} />}>
                        <FieldRow label="Đơn vị tính" value={product.unit} />
                        <FieldRow
                            label="Trọng lượng"
                            value={product.weight ? `${product.weight} gram` : '—'}
                            border={false}
                        />
                    </AdminSection>
                </Grid>

                {/* ── CỘT GIỮA ── */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #eeeeee', mb: 2, bgcolor: '#fff' }}>
                        <Tabs 
                            value={tab} 
                            onChange={(_, v) => setTab(v)}
                            sx={{ 
                                borderBottom: '1px solid #f0f0f0', px: 2, pt: 1,
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minWidth: 100, fontSize: 13 }
                            }}
                        >
                            <Tab label="Thông tin" />
                            <Tab label="Lịch sử giá" icon={<History sx={{ fontSize: 16 }} />} iconPosition="start" />
                        </Tabs>

                        <Box sx={{ p: 0 }}>
                            {tab === 0 && (
                                <Box sx={{ p: 2.5 }}>
                                    <AdminSection title="Thông tin sản phẩm" icon={<QrCodeOutlined sx={{ fontSize: 14 }} />}>
                                        <FieldRow label="Tên sản phẩm" value={product.name} />
                                        <FieldRow label="ISBN / Barcode" value={product.isbnBarcode} mono />
                                        <FieldRow label="SKU" value={product.sku || '—'} mono />
                                        <FieldRow label="Danh mục" value={category?.name || '—'} />
                                        <FieldRow label="Nhà cung cấp" value={supplier?.name || '—'} border={false} />
                                    </AdminSection>

                                    {product.description && (
                                        <AdminSection title="Mô tả">
                                            <Box sx={{ 
                                                maxHeight: 200, 
                                                overflowY: 'auto', 
                                                pr: 1,
                                                '&::-webkit-scrollbar': { width: 4 },
                                                '&::-webkit-scrollbar-thumb': { bgcolor: '#e0e0e0', borderRadius: 2 },
                                            }}>
                                                <Typography variant="body2" color="#555" lineHeight={1.75} fontSize={13} sx={{ whiteSpace: 'pre-line' }}>
                                                    {product.description}
                                                </Typography>
                                            </Box>
                                        </AdminSection>
                                    )}

                                    {/* Tồn kho */}
                                    <AdminSection
                                        title="Tồn kho"
                                        icon={<Inventory2Outlined sx={{ fontSize: 14 }} />}
                                        action={
                                            <Typography
                                                variant="caption"
                                                fontWeight={800}
                                                color={totalStock === 0 ? '#d32f2f' : totalStock < 20 ? '#f57c00' : '#2e7d32'}
                                            >
                                                Khả dụng: {totalStock.toLocaleString()}
                                            </Typography>
                                        }
                                        noPad
                                    >
                                        {inventories.length > 0 ? (
                                            <TableContainer sx={{ maxHeight: 300 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#888' }}>KHO</TableCell>
                                                            <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700, color: '#888' }}>TỒN KHO</TableCell>
                                                            <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700, color: '#888' }}>ĐÃ ĐẶT</TableCell>
                                                            <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700, color: '#888' }}>ĐANG VẬN CHUYỂN</TableCell>
                                                            <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700, color: '#888' }}>KHẢ DỤNG</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {inventories.map((inv: any, idx: number) => {
                                                            const qty = inv.availableQuantity ?? 0;
                                                            const isOut = qty <= 0;
                                                            const isLow = !isOut && qty < (inv.minQuantity ?? 10);
                                                            return (
                                                                <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                                    <TableCell sx={{ py: 1.1, fontSize: 12, fontWeight: 500, color: '#444' }}>
                                                                        {inv.warehouseName || inv.warehouseId}
                                                                    </TableCell>
                                                                    <TableCell align="right" sx={{ py: 1.1, fontSize: 12, fontWeight: 600 }}>
                                                                        {inv.quantity ?? 0}
                                                                    </TableCell>
                                                                    <TableCell align="right" sx={{ py: 1.1, fontSize: 12, color: '#f57c00' }}>
                                                                        {inv.reservedQuantity ?? 0}
                                                                    </TableCell>
                                                                    <TableCell align="right" sx={{ py: 1.1, fontSize: 12, color: '#1976d2' }}>
                                                                        {inv.inTransit ?? 0}
                                                                    </TableCell>
                                                                    <TableCell align="right" sx={{ py: 1.1 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                                            <Typography variant="body2" fontWeight={700} fontSize={13} color={isOut ? '#d32f2f' : isLow ? '#f57c00' : '#2e7d32'}>
                                                                                {qty.toLocaleString()}
                                                                            </Typography>
                                                                            <Chip
                                                                                label={isOut ? 'Hết' : isLow ? 'Sắp hết' : 'Còn hàng'}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 18, fontSize: 10, fontWeight: 700,
                                                                                    bgcolor: isOut ? '#ffebee' : isLow ? '#fff3e0' : '#e8f5e9',
                                                                                    color: isOut ? '#d32f2f' : isLow ? '#e65100' : '#2e7d32',
                                                                                }}
                                                                            />
                                                                        </Box>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Box sx={{ px: 2.5, py: 2 }}>
                                                <Typography variant="body2" color="text.secondary" fontSize={13}>
                                                    Chưa có tồn kho tại bất kỳ kho nào
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #f0f0f0' }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<Inventory2Outlined sx={{ fontSize: 14 }} />}
                                                onClick={() => navigate('/admin/inventory/import')}
                                                sx={{
                                                    textTransform: 'none', fontSize: 12,
                                                    borderColor: '#e0e0e0', color: '#555',
                                                    '&:hover': { bgcolor: '#f5f5f5', borderColor: '#bbb' },
                                                }}
                                            >
                                                Tạo phiếu nhập kho
                                            </Button>
                                        </Box>
                                    </AdminSection>
                                </Box>
                            )}

                            {tab === 1 && (
                                <Box sx={{ p: 2.5 }}>
                                    <TableContainer component={Box}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                    <TableCell sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>NGÀY THAY ĐỔI</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>GIÁ LẺ</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>GIÁ VỐN</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>NGƯỜI SỬA</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {priceHistory.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#aaa', fontSize: 13 }}>
                                                            Chưa có lịch sử thay đổi giá
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    priceHistory.map((h, i) => (
                                                        <TableRow key={i} hover>
                                                            <TableCell sx={{ py: 1.5, fontSize: 12 }}>
                                                                <Typography variant="body2" fontWeight={600} fontSize={12}>
                                                                    {new Date(h.changedAt).toLocaleString('vi-VN')}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                                <Typography variant="body2" fontWeight={800} color="#d32f2f" fontSize={13}>
                                                                    {fmt(h.retailPrice)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                                <Typography variant="body2" fontWeight={600} color="#666" fontSize={12}>
                                                                    {fmt(h.macPrice)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <Chip label={h.changedBy} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* ── CỘT PHẢI ── */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <AdminSection title="Bảng giá" icon={<TrendingUp sx={{ fontSize: 14 }} />}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {[
                                { label: 'Giá bán lẻ', value: fmt(product.retailPrice), color: '#d32f2f', bold: true },
                                { label: 'Giá bán sỉ', value: fmt(product.wholesalePrice), color: '#333' },
                                { label: 'Giá vốn (MAC)', value: fmt(product.macPrice), color: '#555' },
                            ].map((row, i, arr) => (
                                <Box
                                    key={row.label}
                                    sx={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        py: 1.25,
                                        borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none',
                                    }}
                                >
                                    <Typography variant="caption" color="#888" fontSize={12} fontWeight={600}>
                                        {row.label}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        fontWeight={row.bold ? 800 : 700}
                                        color={row.color}
                                        fontSize={row.bold ? 15 : 13}
                                    >
                                        {row.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        <Box
                            sx={{ bgcolor: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 1.5, p: 1.5 }}
                        >
                            <Typography
                                variant="caption"
                                color="#888"
                                fontSize={11}
                                fontWeight={600}
                                letterSpacing={0.3}
                                display="block"
                                mb={0.5}
                            >
                                LỢI NHUẬN GỘP / ĐƠN VỊ
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography variant="h6" fontWeight={800} color="#15803d" fontSize={18}>
                                    {fmt(product.retailPrice - product.macPrice)}
                                </Typography>
                                <Typography variant="caption" color="#16a34a" fontWeight={700} fontSize={12}>
                                    {margin}% biên lợi nhuận
                                </Typography>
                            </Box>
                        </Box>
                    </AdminSection>

                    {/* KPI */}
                    <AdminSection title="Hiệu suất" icon={<TrendingUp sx={{ fontSize: 14 }} />}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <StatCard
                                label="Tồn kho khả dụng"
                                value={totalStock.toLocaleString()}
                                color={totalStock === 0 ? '#d32f2f' : totalStock < 20 ? '#e65100' : '#2e7d32'}
                                bg={totalStock === 0 ? '#ffebee' : totalStock < 20 ? '#fff3e0' : '#e8f5e9'}
                                border={totalStock === 0 ? '#ffcdd2' : totalStock < 20 ? '#ffe0b2' : '#c8e6c9'}
                            />
                            <StatCard
                                label="Giá bán lẻ"
                                value={product.retailPrice ? `${(product.retailPrice / 1000).toFixed(0)}K` : '—'}
                                color="#d32f2f"
                                bg="#ffebee"
                                border="#ffcdd2"
                            />
                            <StatCard
                                label="Biên lợi nhuận"
                                value={`${margin}%`}
                                color="#15803d"
                                bg="#f0fdf4"
                                border="#d1fae5"
                            />
                        </Box>
                    </AdminSection>

                    {/* Metadata */}
                    <AdminSection title="Metadata">
                        <FieldRow label="Product ID" value={product.id} mono />
                        <FieldRow label="Ngày tạo" value={product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : '—'} />
                        <FieldRow
                            label="Trạng thái"
                            value={statusLabel}
                            valueColor={statusColor}
                            border={false}
                        />
                    </AdminSection>
                </Grid>
            </Grid>

            <Snackbar
                open={!!snack}
                autoHideDuration={2000}
                onClose={() => setSnack('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2 }}>
                    {snack}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductDetailPage;