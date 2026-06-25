// src/modules/customer/pages/ProductDetailPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Button, IconButton,
    Chip, Rating, Divider, Breadcrumbs, Link, Paper,
    Tabs, Tab, Avatar, TextField, LinearProgress, Modal,
    Skeleton, Alert, TableContainer, Table, TableBody, TableRow, TableCell, Pagination,
} from '@mui/material';
import {
    ShoppingCart, FavoriteBorder, Favorite, Share,
    LocalShipping, Verified, Add, Remove,
    CheckCircle, ZoomIn, Close,
    ArrowBackIos, ArrowForwardIos,
} from '@mui/icons-material';
import { useProductDetail, useProducts, useProductReviews } from '../hooks/useProducts';
import { useCartContext } from '../../../store/CartContext';
import { fmt, calcDiscount, getFakeDiscount, getFakeOriginalPrice } from '../../../utils/constants';
import ProductCard from '../../../components/common/ProductCard';

const RATING_DIST = [
    { stars: 5, count: 0 }, { stars: 4, count: 0 }, { stars: 3, count: 0 }, { stars: 2, count: 0 }, { stars: 1, count: 0 },
];

const TabPanel = ({ children, value, index }: any) =>
    value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;

const ImageGallery = ({ images = [] as string[], title }: { images: string[]; title: string }) => {
    const [activeIdx, setActiveIdx] = useState(0);
    const [errored, setErrored] = useState<Record<number, boolean>>({});
    const [zoom, setZoom] = useState(false);
    const [zoomIdx, setZoomIdx] = useState(0);

    const fallbackImage = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80';

    const getSrc = (idx: number) =>
        errored[idx] || !images[idx]
            ? fallbackImage
            : images[idx];

    const openZoom = (idx: number) => { setZoomIdx(idx); setZoom(true); };

    return (
        <>
            <Box sx={{
                bgcolor: '#ffffff', borderRadius: 3, p: 2,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                height: 380, border: '1px solid #eef2f6', position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                },
                '&:hover .zoom-btn': { opacity: 1 }, '&:hover .nav-btn': { opacity: 1 },
            }}>
                <Box component="img" key={activeIdx} src={getSrc(activeIdx)} alt={`${title} - ảnh ${activeIdx + 1}`}
                    onError={() => setErrored(prev => ({ ...prev, [activeIdx]: true }))}
                    sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'opacity 0.25s ease' }} />
                <IconButton className="zoom-btn" onClick={() => openZoom(activeIdx)} sx={{
                    position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
                    opacity: 0, transition: 'opacity 0.25s', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}><ZoomIn fontSize="small" /></IconButton>
                {images.length > 1 && (
                    <>
                        <IconButton className="nav-btn" onClick={() => setActiveIdx((activeIdx - 1 + images.length) % images.length)} sx={{
                            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary', opacity: 0, transition: 'opacity 0.25s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': { bgcolor: '#ffffff' }
                        }}><ArrowBackIos sx={{ fontSize: 16, pl: 0.5 }} /></IconButton>
                        <IconButton className="nav-btn" onClick={() => setActiveIdx((activeIdx + 1) % images.length)} sx={{
                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary', opacity: 0, transition: 'opacity 0.25s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': { bgcolor: '#ffffff' }
                        }}><ArrowForwardIos sx={{ fontSize: 16 }} /></IconButton>
                    </>
                )}
            </Box>
            {images.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {images.map((_, i) => (
                        <Box key={i} onClick={() => setActiveIdx(i)} sx={{
                            width: 60, height: 80, borderRadius: 2, overflow: 'hidden',
                            border: i === activeIdx ? '2px solid var(--color-secondary, #f5a623)' : '2px solid #eef2f6',
                            boxShadow: i === activeIdx ? '0 4px 12px rgba(245, 166, 35, 0.2)' : 'none',
                            cursor: 'pointer', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: 'var(--color-secondary, #f5a623)',
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <Box component="img" src={getSrc(i)} alt={`thumb-${i}`}
                                onError={() => setErrored(prev => ({ ...prev, [i]: true }))}
                                sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
                        </Box>
                    ))}
                </Box>
            )}
            <Modal open={zoom} onClose={() => setZoom(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', outline: 'none', maxWidth: '90vw', maxHeight: '90vh' }}>
                    <IconButton onClick={() => setZoom(false)} sx={{ position: 'absolute', top: -16, right: -16, zIndex: 1, bgcolor: '#fff', boxShadow: 3 }}>
                        <Close />
                    </IconButton>
                    <Box component="img" src={getSrc(zoomIdx)} alt={title}
                        sx={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain', borderRadius: 2, display: 'block', bgcolor: '#fff', p: 2 }} />
                </Box>
            </Modal>
        </>
    );
};

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { product, isLoading, isError } = useProductDetail(id ?? '');
    const { addToCart, openCart } = useCartContext();

    const [qty, setQty] = useState(1);
    const [fav, setFav] = useState(false);
    const [tab, setTab] = useState(0);
    const [showFullDesc, setShowFullDesc] = useState(false);

    // Sách liên quan — lấy theo cùng categoryId
    const { products: relatedProducts } = useProducts({
        categoryId: product?.categoryId || undefined,
        size: 5,
    });
    const related = relatedProducts.filter(p => p.id !== product?.id).slice(0, 4);

    const [reviewPage, setReviewPage] = useState(0);
    const [reviewRating, setReviewRating] = useState<number | null>(null);

    // Lấy reviews thực tế
    const { reviews, totalElements: totalReviews, totalPages: reviewTotalPages } = useProductReviews(id ?? '', reviewRating, reviewPage, 5);

    if (isLoading) {
        return (
            <Box sx={{ bgcolor: 'var(--bg-default, #f8f9fa)', minHeight: '100vh', py: 4 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 5 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Skeleton width="30%" height={32} />
                            <Skeleton width="80%" height={40} sx={{ mt: 2 }} />
                            <Skeleton width="50%" height={24} sx={{ mt: 2 }} />
                            <Skeleton width="40%" height={48} sx={{ mt: 3 }} />
                            <Skeleton width="90%" height={120} sx={{ mt: 3 }} />
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        );
    }

    if (isError || !product) {
        return (
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Alert severity="error">Không tìm thấy sản phẩm. Vui lòng thử lại.</Alert>
            </Container>
        );
    }

    const images = product.images.length > 0 ? product.images : (product.img ? [product.img] : []);
    
    // Fake discount logic
    const fakeDiscount = getFakeDiscount(product.id || '', product.sold || 0);
    const finalDiscount = product.oldPrice && product.oldPrice > product.price 
        ? calcDiscount(product.oldPrice, product.price) 
        : fakeDiscount;
    const finalOldPrice = product.oldPrice && product.oldPrice > product.price 
        ? product.oldPrice 
        : getFakeOriginalPrice(product.price, fakeDiscount);

    const handleAddToCart = () => {
        addToCart({ ...product, qty });
        openCart();
    };

    const handleBuyNow = () => {
        addToCart({ ...product, qty });
        navigate('/checkout');
    };

    return (
        <Box sx={{ bgcolor: 'var(--bg-default, #f8f9fa)', minHeight: '100vh', pb: 8 }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Breadcrumbs sx={{ mb: 3, fontSize: 13, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontWeight: 500 }}>Trang chủ</Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        onClick={() => navigate(`/shop?category=${encodeURIComponent(product.category || '')}`)}
                        sx={{ cursor: 'pointer', fontWeight: 500 }}
                    >
                        {product.category || 'Sách'}
                    </Link>
                    <Typography fontSize={13} color="text.primary" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>{product.title}</Typography>
                </Breadcrumbs>

                <Paper elevation={0} sx={{ borderRadius: 3, p: { xs: 2, md: 4 }, mb: 4, border: '1px solid #eef2f6' }}>
                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ position: 'sticky', top: 100 }}>
                                <ImageGallery images={images} title={product.title} />
                                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => setFav(!fav)}
                                        startIcon={fav ? <Favorite sx={{ color: 'var(--color-secondary, #f5a623)' }} /> : <FavoriteBorder />}
                                        sx={{
                                            borderColor: '#e0e0e0',
                                            borderRadius: 2,
                                            py: 1,
                                            color: 'text.primary',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            '&:hover': { borderColor: 'var(--color-secondary, #f5a623)', bgcolor: 'rgba(245, 166, 35, 0.05)' }
                                        }}
                                    >
                                        {fav ? 'Đã thích' : 'Yêu thích'}
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Share />}
                                        sx={{
                                            borderColor: '#e0e0e0',
                                            borderRadius: 2,
                                            py: 1,
                                            color: 'text.primary',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            '&:hover': { borderColor: 'var(--color-primary, #0a192f)', bgcolor: 'rgba(10, 25, 47, 0.05)' }
                                        }}
                                    >
                                        Chia sẻ
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 7 }}>

                            {/* Badges */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                {product.category && (
                                    <Chip label={product.category} size="small" variant="outlined"
                                        sx={{ fontSize: 11, fontWeight: 600, color: '#f5a623', borderColor: '#f5a623', bgcolor: 'rgba(245,166,35,0.06)' }} />
                                )}
                                {product.badge && (
                                    <Chip label={product.badge} size="small"
                                        sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 11, borderRadius: 1 }} />
                                )}
                                <Chip icon={<CheckCircle sx={{ fontSize: 12, color: '#f5a623 !important' }} />}
                                    label="Chính hãng" size="small"
                                    sx={{ bgcolor: 'rgba(245,166,35,0.08)', color: '#f5a623', fontWeight: 600, fontSize: 11 }} />
                            </Box>

                            {/* Title */}
                            <Typography fontWeight={800} sx={{
                                mb: 1.5, lineHeight: 1.4,
                                fontFamily: '"Playfair Display", serif',
                                color: '#0a192f',
                                fontSize: { xs: 18, sm: 20, md: 22 }
                            }}>
                                {product.title}
                            </Typography>

                            {/* Author */}
                            {product.author && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Tác giả: <strong style={{ color: '#0a192f' }}>{product.author}</strong>
                                </Typography>
                            )}

                            {/* Rating */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                                <Rating value={product.rating || 0} readOnly precision={0.1} size="small" sx={{ color: '#f5a623' }} />
                                <Typography variant="body2" fontWeight={700} color="text.secondary">
                                    {product.rating?.toFixed(1) || '0.0'}
                                </Typography>
                                <Typography variant="body2" color="#d1d5db">·</Typography>
                                <Typography variant="body2" color="text.secondary">{product.reviewCount || 0} đánh giá</Typography>
                                <Typography variant="body2" color="#d1d5db">·</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Đã bán <strong>{product.sold || 0}</strong>
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 2.5 }} />

                            {/* Price card */}
                            <Box sx={{
                                bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2.5,
                                px: 2.5, py: 2, mb: 2.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                flexWrap: 'wrap', gap: 1.5
                            }}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
                                        <Typography sx={{
                                            fontSize: { xs: 26, md: 30 }, fontWeight: 900,
                                            color: '#f5a623', letterSpacing: '-0.5px', lineHeight: 1
                                        }}>
                                            {fmt(product.price)}
                                        </Typography>
                                        {finalOldPrice > product.price && (
                                            <Typography sx={{ fontSize: 15, color: '#9ca3af', textDecoration: 'line-through', fontWeight: 500 }}>
                                                {fmt(finalOldPrice)}
                                            </Typography>
                                        )}
                                    </Box>
                                    {finalOldPrice > product.price && (
                                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 0.6 }}>
                                            Tiết kiệm {fmt(finalOldPrice - product.price)} so với giá gốc
                                        </Typography>
                                    )}
                                </Box>
                                {finalOldPrice > product.price && (
                                    <Box sx={{
                                        bgcolor: '#ef4444', color: '#fff', fontWeight: 800,
                                        fontSize: 18, px: 1.5, py: 0.5, borderRadius: 1.5,
                                        lineHeight: 1.5
                                    }}>
                                        -{finalDiscount}%
                                    </Box>
                                )}
                            </Box>

                            {/* Stock pill */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 1,
                                    px: 2, py: 0.7, borderRadius: 20,
                                    bgcolor: product.stock > 0 ? '#f0fdf4' : '#fef2f2',
                                    border: `1px solid ${product.stock > 0 ? '#bbf7d0' : '#fecaca'}`,
                                }}>
                                    <Box sx={{
                                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                        bgcolor: product.stock > 0 ? '#22c55e' : '#ef4444',
                                        ...(product.stock > 0 && { boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' })
                                    }} />
                                    <Typography variant="body2" fontWeight={700}
                                        sx={{ color: product.stock > 0 ? '#15803d' : '#dc2626' }}>
                                        {product.stock > 0 ? `Còn hàng · ${product.stock} cuốn` : 'Hết hàng'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Quantity + CTA */}
                            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2.5, p: 2.5, border: '1px solid #e2e8f0', mb: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Typography variant="body2" fontWeight={700} color="#475569" sx={{ minWidth: 70 }}>
                                        Số lượng:
                                    </Typography>
                                    <Box sx={{
                                        display: 'inline-flex', alignItems: 'center',
                                        border: '1.5px solid #e2e8f0', borderRadius: 2,
                                        bgcolor: '#fff', overflow: 'hidden'
                                    }}>
                                        <IconButton size="small"
                                            onClick={() => setQty(Math.max(1, qty - 1))}
                                            disabled={product.stock <= 0}
                                            sx={{ borderRadius: 0, px: 1.2, '&:hover': { bgcolor: '#f1f5f9' } }}>
                                            <Remove sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <input
                                            type="number"
                                            value={qty}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value);
                                                if (!isNaN(v)) setQty(Math.max(1, Math.min(product.stock, v)));
                                                else if (e.target.value === '') setQty(1);
                                            }}
                                            style={{
                                                width: 44, textAlign: 'center', fontWeight: 800, fontSize: 15,
                                                border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0',
                                                outline: 'none', padding: '6px 0',
                                                WebkitAppearance: 'none', MozAppearance: 'textfield' as any
                                            }}
                                        />
                                        <IconButton size="small"
                                            onClick={() => setQty(Math.min(product.stock, qty + 1))}
                                            disabled={product.stock <= 0}
                                            sx={{ borderRadius: 0, px: 1.2, '&:hover': { bgcolor: '#f1f5f9' } }}>
                                            <Add sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ShoppingCart />}
                                        onClick={handleAddToCart}
                                        disabled={product.stock <= 0}
                                        sx={{
                                            flex: 1, py: 1.4, borderRadius: 2,
                                            textTransform: 'none', fontWeight: 700, fontSize: 14,
                                            borderColor: '#f5a623', color: '#f5a623',
                                            '&:hover': { bgcolor: 'rgba(245,166,35,0.06)', borderColor: '#e0951a' },
                                        }}
                                    >
                                        Thêm vào giỏ
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleBuyNow}
                                        disabled={product.stock <= 0}
                                        sx={{
                                            flex: 1, py: 1.4, borderRadius: 2,
                                            textTransform: 'none', fontWeight: 700, fontSize: 14,
                                            bgcolor: '#f5a623', color: '#fff', boxShadow: 'none',
                                            '&:hover': { bgcolor: '#e0951a', boxShadow: '0 4px 14px rgba(245,166,35,0.35)' },
                                        }}
                                    >
                                        Mua ngay
                                    </Button>
                                </Box>
                            </Box>

                            {/* Trust badges */}
                            <Box sx={{
                                display: 'flex', gap: 0, flexWrap: 'wrap',
                                border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden'
                            }}>
                                {[
                                    { icon: <LocalShipping sx={{ fontSize: 18, color: '#1565c0' }} />, text: 'Freeship từ 150k', bg: '#fff' },
                                    { icon: <Verified sx={{ fontSize: 18, color: '#2e7d32' }} />, text: 'Chính hãng 100%', bg: '#f8fafc' },
                                    { icon: <CheckCircle sx={{ fontSize: 18, color: '#f57c00' }} />, text: 'Đổi trả 7 ngày', bg: '#fff' },
                                ].map((item, i) => (
                                    <Box key={i} sx={{
                                        flex: 1, minWidth: 110,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        gap: 0.5, py: 1.5, px: 1,
                                        bgcolor: item.bg,
                                        borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
                                    }}>
                                        {item.icon}
                                        <Typography variant="caption" fontWeight={600} color="text.secondary" textAlign="center">
                                            {item.text}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* TABS & DETAILS */}
                <Paper elevation={0} sx={{ borderRadius: 3, mb: 5, border: '1px solid #eef2f6', overflow: 'hidden' }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
                        px: 3, bgcolor: '#fafafa', borderBottom: '1px solid #eef2f6',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: 15, py: 2 },
                        '& .MuiTabs-indicator': { bgcolor: 'var(--color-secondary, #f5a623)', height: 3 },
                        '& .Mui-selected': { color: 'var(--color-secondary, #f5a623) !important' },
                    }}>
                        <Tab label="Thông tin & Mô tả sách" />
                        <Tab label={`Đánh giá khách hàng (${totalReviews})`} />
                    </Tabs>
                    <Box sx={{ p: { xs: 3, md: 4 } }}>
                        <TabPanel value={tab} index={0}>
                            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, fontFamily: '"Playfair Display", serif', color: 'var(--color-primary, #0a192f)' }}>Thông số chi tiết</Typography>
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eef2f6', borderRadius: 2, overflow: 'hidden', mb: 5 }}>
                                    <Table size="small">
                                        <TableBody>
                                            {[
                                                ['Mã sản phẩm (SKU)', product.sku || 'Đang cập nhật'],
                                                ['Tác giả', product.author || 'Nhiều tác giả'],
                                                ['Nhà xuất bản', product.publisher || 'Nhà Xuất Bản Trẻ'],
                                                ['Năm xuất bản', product.year || '2024'],
                                                ['Số trang', product.pages ? `${product.pages} trang` : 'Đang cập nhật'],
                                                ['Trọng lượng', product.weight ? `${product.weight} gr` : 'Đang cập nhật'],
                                                ['Định dạng bìa', product.unit || 'Bìa mềm'],
                                            ].map(([label, val], idx) => (
                                                <TableRow key={label} sx={{ bgcolor: idx % 2 === 0 ? '#fcfdfd' : '#ffffff' }}>
                                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: '30%', py: 1.5, borderBottom: '1px solid #eef2f6' }}>{label}</TableCell>
                                                    <TableCell sx={{ color: 'var(--color-primary, #0a192f)', fontWeight: 500, py: 1.5, borderBottom: '1px solid #eef2f6' }}>{val}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, fontFamily: '"Playfair Display", serif', color: 'var(--color-primary, #0a192f)' }}>Giới thiệu sách</Typography>
                                <Box>
                                    <Typography variant="body1" color="text.secondary" sx={{ 
                                        lineHeight: 1.9, 
                                        whiteSpace: 'pre-line',
                                        display: '-webkit-box',
                                        WebkitLineClamp: showFullDesc ? 'unset' : 6,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {product.description || 'Chưa có mô tả chi tiết cho cuốn sách này.'}
                                    </Typography>
                                    {product.description && product.description.length > 300 && (
                                        <Button 
                                            onClick={() => setShowFullDesc(!showFullDesc)} 
                                            sx={{ mt: 1.5, px: 3, py: 1, textTransform: 'none', fontWeight: 600, color: 'var(--color-secondary, #f5a623)', border: '1px solid var(--color-secondary, #f5a623)', borderRadius: 2, '&:hover': { bgcolor: 'rgba(245, 166, 35, 0.05)' } }}
                                        >
                                            {showFullDesc ? 'Thu gọn nội dung' : 'Xem thêm nội dung'}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </TabPanel>

                        <TabPanel value={tab} index={1}>
                            {/* ── Rating summary ── */}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: { xs: 3, md: 5 },
                                p: { xs: 2.5, md: 3.5 }, mb: 4,
                                bgcolor: '#fffbeb', borderRadius: 2.5, border: '1px solid #fde68a',
                                flexWrap: 'wrap'
                            }}>
                                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                                    <Typography sx={{ fontSize: { xs: 44, md: 56 }, fontWeight: 900, color: '#f5a623', lineHeight: 1 }}>
                                        {product.rating?.toFixed(1) || '0.0'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>trên 5</Typography>
                                </Box>
                                <Box>
                                    <Rating value={product.rating || 0} readOnly precision={0.1}
                                        sx={{ color: '#f5a623', fontSize: { xs: 22, md: 28 } }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        <strong>{product.reviewCount || 0}</strong> đánh giá thực tế từ khách hàng
                                    </Typography>
                                </Box>
                            </Box>

                            {/* ── Filter chips ── */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3.5 }}>
                                {([{ label: 'Tất cả', val: null as number | null }, { label: '5 ⭐', val: 5 }, { label: '4 ⭐', val: 4 }, { label: '3 ⭐', val: 3 }, { label: '2 ⭐', val: 2 }, { label: '1 ⭐', val: 1 }] as { label: string; val: number | null }[]).map(item => (
                                    <Button key={item.label} size="small"
                                        onClick={() => { setReviewRating(item.val); setReviewPage(0); }}
                                        sx={{
                                            textTransform: 'none', borderRadius: 20, fontWeight: 600, fontSize: 13,
                                            px: 2, py: 0.6, minWidth: 'unset',
                                            ...(reviewRating === item.val
                                                ? { bgcolor: '#f5a623', color: '#fff', border: '1.5px solid #f5a623', '&:hover': { bgcolor: '#e0951a' } }
                                                : { bgcolor: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', '&:hover': { borderColor: '#f5a623', color: '#f5a623' } }
                                            )
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </Box>

                            {/* ── Review list ── */}
                            {reviews.length > 0 ? (
                                <Box>
                                    {reviews.map((r: any, idx: number) => (
                                        <Box key={r.id} sx={{
                                            py: 3,
                                            borderBottom: idx < reviews.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        }}>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Avatar sx={{
                                                    width: 44, height: 44, flexShrink: 0,
                                                    bgcolor: '#0a192f', fontSize: 16, fontWeight: 800
                                                }}>
                                                    {r.customerName?.[0]?.toUpperCase() || 'U'}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    {/* Header: name + badge + date */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                                        <Typography fontWeight={700} fontSize={14} color="#0a192f">
                                                            {r.customerName}
                                                        </Typography>
                                                        <Box sx={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                                            px: 1, py: 0.2, borderRadius: 10,
                                                            bgcolor: '#f0fdf4', border: '1px solid #bbf7d0'
                                                        }}>
                                                            <CheckCircle sx={{ fontSize: 10, color: '#22c55e' }} />
                                                            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#15803d' }}>Đã mua hàng</Typography>
                                                        </Box>
                                                        <Typography variant="caption" color="#94a3b8" sx={{ ml: 'auto' }}>
                                                            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                                        </Typography>
                                                    </Box>

                                                    {/* Stars */}
                                                    <Rating value={r.rating} readOnly size="small"
                                                        sx={{ color: '#f5a623', mb: 1.2 }} />

                                                    {/* Comment */}
                                                    <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.8 }}>
                                                        {r.comment}
                                                    </Typography>

                                                    {/* Images */}
                                                    {r.imageUrls && r.imageUrls.length > 0 && (
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                                                            {r.imageUrls.map((img: string, i: number) => (
                                                                <Box key={i} component="img" src={img} alt="review"
                                                                    sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, border: '1px solid #e2e8f0', cursor: 'pointer', '&:hover': { opacity: 0.85 } }} />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px dashed #e2e8f0' }}>
                                    <Typography sx={{ fontSize: 42, mb: 1.5 }}>✍️</Typography>
                                    <Typography fontWeight={700} color="#475569" mb={0.5}>
                                        {reviewRating ? `Chưa có đánh giá ${reviewRating} sao` : 'Chưa có đánh giá nào'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm này
                                    </Typography>
                                </Box>
                            )}

                            {/* ── Pagination ── */}
                            {totalReviews > 0 && (
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    mt: 4, pt: 3, borderTop: '1px solid #f1f5f9',
                                    flexWrap: 'wrap', gap: 2
                                }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Hiển thị {Math.min(reviewPage * 5 + 1, totalReviews)}–{Math.min((reviewPage + 1) * 5, totalReviews)} trong tổng <strong>{totalReviews}</strong> đánh giá
                                    </Typography>
                                    <Pagination
                                        count={reviewTotalPages}
                                        page={reviewPage + 1}
                                        onChange={(_, p) => setReviewPage(p - 1)}
                                        shape="rounded"
                                        sx={{
                                            '& .MuiPaginationItem-root': { fontWeight: 600, borderRadius: 1.5 },
                                            '& .MuiPaginationItem-root.Mui-selected': {
                                                bgcolor: '#f5a623', color: '#fff',
                                                '&:hover': { bgcolor: '#e0951a' }
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </TabPanel>
                    </Box>
                </Paper>

                {/* RELATED PRODUCTS */}
                {related.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <Box sx={{ width: 6, height: 28, bgcolor: 'var(--color-secondary, #f5a623)', borderRadius: 2 }} />
                            <Typography variant="h5" fontWeight={800} sx={{ fontFamily: '"Playfair Display", serif', color: 'var(--color-primary, #0a192f)' }}>Sản phẩm liên quan</Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {related.map(p => {
                                const productProps = {
                                    id: p.id,
                                    title: p.title || 'Đang cập nhật',
                                    author: p.author || 'Đang cập nhật',
                                    coverImage: p.img,
                                    price: p.price,
                                    rating: p.rating || 4.5,
                                    reviewCount: 20,
                                    badges: [],
                                    onQuickView: () => navigate(`/product/${p.id}`),
                                    onAddToCart: () => {
                                        addToCart({ ...p, qty: 1 });
                                        openCart();
                                    }
                                };
                                return (
                                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id} sx={{ display: 'flex' }}>
                                        <ProductCard {...productProps} />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default ProductDetailPage;