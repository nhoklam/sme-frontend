// src/modules/customer/pages/ProductDetailPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Button, IconButton,
    Chip, Rating, Divider, Breadcrumbs, Link, Paper,
    Tabs, Tab, Avatar, TextField, LinearProgress, Modal,
    Skeleton, Alert, useTheme, TableContainer, Table, TableBody, TableRow, TableCell,
} from '@mui/material';
import {
    ShoppingCart, FavoriteBorder, Favorite, Share,
    LocalShipping, Verified, Add, Remove,
    Star, CheckCircle, ZoomIn, Close,
    ArrowBackIos, ArrowForwardIos,
} from '@mui/icons-material';
import { useProductDetail, useProducts } from '../hooks/useProducts';
import { useCartContext } from '../../../store/CartContext';
import { fmt, calcDiscount } from '../../../utils/constants';
import ProductCard from '../../../components/common/ProductCard';

const REVIEWS = [
    { id: 1, name: 'Nguyễn Minh Tuấn', avatar: 'N', rating: 5, date: '15/03/2025', comment: 'Sách rất hay, nội dung sâu sắc và ý nghĩa. Giao hàng nhanh, đóng gói cẩn thận.' },
    { id: 2, name: 'Trần Thị Lan', avatar: 'T', rating: 5, date: '10/03/2025', comment: 'Đọc xong thấy thay đổi tư duy rất nhiều. Cuốn sách này xứng đáng với danh tiếng của nó!' },
    { id: 3, name: 'Lê Văn Hùng', avatar: 'L', rating: 4, date: '05/03/2025', comment: 'Nội dung tốt, dịch khá ổn. Bìa sách đẹp, giấy tốt. Trừ 1 sao vì ship hơi lâu.' },
];
const RATING_DIST = [
    { stars: 5, count: 85 }, { stars: 4, count: 10 }, { stars: 3, count: 3 }, { stars: 2, count: 1 }, { stars: 1, count: 1 },
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
    const theme = useTheme();
    const { product, isLoading, isError } = useProductDetail(id ?? '');
    const { addToCart, openCart } = useCartContext();

    const [qty, setQty] = useState(1);
    const [fav, setFav] = useState(false);
    const [tab, setTab] = useState(0);

    // Sách liên quan — lấy theo cùng categoryId
    const { products: relatedProducts } = useProducts({
        categoryId: product?.categoryId || undefined,
        size: 5,
    });
    const related = relatedProducts.filter(p => p.id !== product?.id).slice(0, 4);

    const totalReviews = RATING_DIST.reduce((s, r) => s + r.count, 0);

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
    const discount = product.oldPrice ? calcDiscount(product.oldPrice, product.price) : 0;

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
                    <Link underline="hover" color="inherit" onClick={() => navigate('/shop')} sx={{ cursor: 'pointer', fontWeight: 500 }}>
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
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                {product.badge && <Chip label={product.badge} size="small" sx={{ bgcolor: theme.palette.error.main, color: '#fff', fontWeight: 700, fontSize: 11, borderRadius: 1 }} />}
                                {product.category && <Chip label={product.category} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 600, color: 'var(--color-secondary, #f5a623)', borderColor: 'var(--color-secondary, #f5a623)' }} />}
                            </Box>

                            <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5, lineHeight: 1.3, fontFamily: '"Playfair Display", serif', color: 'var(--color-primary, #0a192f)' }}>{product.title}</Typography>
                            {product.author && (
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
                                    Tác giả: <strong style={{ color: 'var(--color-primary, #0a192f)' }}>{product.author}</strong>
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <Chip icon={<CheckCircle sx={{ fontSize: 14, color: 'var(--color-secondary, #f5a623) !important' }} />}
                                    label="Chính hãng" size="small" sx={{ bgcolor: 'rgba(245, 166, 35, 0.08)', color: 'var(--color-secondary, #f5a623)', fontWeight: 600, fontSize: 11 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Star sx={{ color: 'var(--color-secondary, #f5a623)', fontSize: 18 }} />
                                    <Typography variant="body2" fontWeight={700}>4.8</Typography>
                                    <Typography variant="body2" color="text.secondary">({totalReviews} đánh giá)</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 3 }}>
                                <Typography variant="h3" fontWeight={900} color="var(--color-secondary, #f5a623)">{fmt(product.price)}</Typography>
                                {product.oldPrice > 0 && (
                                    <>
                                        <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{fmt(product.oldPrice)}</Typography>
                                        <Chip label={`Tiết kiệm ${discount}%`} size="small" sx={{ bgcolor: 'rgba(232, 64, 28, 0.08)', color: '#e8401c', fontWeight: 700, borderRadius: 1 }} />
                                    </>
                                )}
                            </Box>

                            <Paper elevation={0} sx={{ bgcolor: '#f8f9fa', p: 2.5, borderRadius: 3, mb: 4, border: '1px solid #eef2f6' }}>
                                <Grid container spacing={2}>
                                    {[
                                        ['📦 Tình trạng', product.stock > 0 ? `Còn hàng (${product.stock} cuốn)` : 'Hết hàng'],
                                        ['🖼️ Số lượng ảnh', `${images.length} hình ảnh`],
                                    ].map(([label, val]) => (
                                        <Grid size={{ xs: 6 }} key={label as string}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
                                            <Typography variant="body1" fontWeight={700} sx={{ color: 'var(--color-primary, #0a192f)', mt: 0.5 }}>{val}</Typography>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                                <Typography variant="body1" fontWeight={700} color="var(--color-primary, #0a192f)">Số lượng:</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fff', p: 0.5 }}>
                                    <IconButton size="small" onClick={() => setQty(Math.max(1, qty - 1))} sx={{ bgcolor: '#f8f9fa', '&:hover': { bgcolor: '#edf2f7' } }}><Remove fontSize="small" /></IconButton>
                                    <Typography sx={{ px: 2.5, minWidth: 40, textAlign: 'center', fontWeight: 800, fontSize: 16 }}>{qty}</Typography>
                                    <IconButton size="small" onClick={() => setQty(Math.min(product.stock, qty + 1))} sx={{ bgcolor: '#f8f9fa', '&:hover': { bgcolor: '#edf2f7' } }}><Add fontSize="small" /></IconButton>
                                </Box>
                                <Typography variant="body2" color="text.secondary">(Có sẵn {product.stock} sản phẩm trong kho)</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<ShoppingCart />}
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0}
                                    sx={{
                                        flex: 1,
                                        minWidth: 180,
                                        borderColor: 'var(--color-secondary, #f5a623)',
                                        color: 'var(--color-secondary, #f5a623)',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        py: 1.5,
                                        borderRadius: 2,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'var(--color-secondary, #f5a623)',
                                            bgcolor: 'rgba(245, 166, 35, 0.05)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    Thêm vào giỏ hàng
                                </Button>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleBuyNow}
                                    disabled={product.stock <= 0}
                                    sx={{
                                        flex: 1,
                                        minWidth: 180,
                                        bgcolor: 'var(--color-secondary, #f5a623)',
                                        color: '#fff',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        py: 1.5,
                                        borderRadius: 2,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: '#e0951a',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)'
                                        }
                                    }}
                                >
                                    Mua ngay
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', pt: 1 }}>
                                {[
                                    { icon: <LocalShipping sx={{ fontSize: 18, color: '#1565c0' }} />, text: 'Miễn phí vận chuyển từ 150k' },
                                    { icon: <Verified sx={{ fontSize: 18, color: '#2e7d32' }} />, text: 'Sách mới chính hãng 100%' },
                                    { icon: <CheckCircle sx={{ fontSize: 18, color: '#f57c00' }} />, text: 'Đổi trả miễn phí trong 7 ngày' },
                                ].map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {item.icon}<Typography variant="body2" fontWeight={600} color="text.secondary">{item.text}</Typography>
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
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, fontFamily: '"Playfair Display", serif', color: 'var(--color-primary, #0a192f)' }}>Thông số chi tiết</Typography>
                                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eef2f6', borderRadius: 2, overflow: 'hidden' }}>
                                        <Table size="small">
                                            <TableBody>
                                                {[
                                                    ['Mã sản phẩm (SKU)', product.sku || 'Đang cập nhật'],
                                                    ['Mã ISBN / Barcode', product.isbnBarcode || 'Đang cập nhật'],
                                                    ['Tác giả', product.author || 'Nhiều tác giả'],
                                                    ['Nhà xuất bản', product.publisher || 'Nhà Xuất Bản Trẻ'],
                                                    ['Năm xuất bản', product.year || '2024'],
                                                    ['Số trang', product.pages ? `${product.pages} trang` : 'Đang cập nhật'],
                                                    ['Trọng lượng', product.weight ? `${product.weight} gr` : 'Đang cập nhật'],
                                                    ['Định dạng bìa', product.unit || 'Bìa mềm'],
                                                ].map(([label, val], idx) => (
                                                    <TableRow key={label} sx={{ bgcolor: idx % 2 === 0 ? '#fcfdfd' : '#ffffff' }}>
                                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: '40%', py: 1.5, borderBottom: '1px solid #eef2f6' }}>{label}</TableCell>
                                                        <TableCell sx={{ color: 'var(--color-primary, #0a192f)', fontWeight: 500, py: 1.5, borderBottom: '1px solid #eef2f6' }}>{val}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, fontFamily: '"Playfair Display", serif', color: 'var(--color-primary, #0a192f)' }}>Giới thiệu sách</Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                                        {product.description || 'Chưa có mô tả chi tiết cho cuốn sách này.'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tab} index={1}>
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'rgba(245, 166, 35, 0.03)', border: '1px solid rgba(245, 166, 35, 0.12)', borderRadius: 3 }}>
                                        <Typography variant="h2" fontWeight={900} color="var(--color-secondary, #f5a623)">4.8</Typography>
                                        <Rating value={4.8} readOnly precision={0.1} sx={{ my: 1, color: 'var(--color-secondary, #f5a623)' }} />
                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>{totalReviews} đánh giá thực tế</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    {REVIEWS.map((r) => (
                                        <Box key={r.id} sx={{ mb: 3, pb: 3, borderBottom: '1px solid #eef2f6', '&:last-child': { borderBottom: 'none', pb: 0 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: 'var(--color-primary, #0a192f)', fontSize: 15, fontWeight: 700 }}>{r.avatar}</Avatar>
                                                <Box>
                                                    <Typography variant="body1" fontWeight={700} color="var(--color-primary, #0a192f)">{r.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{r.date}</Typography>
                                                </Box>
                                                <Rating value={r.rating} readOnly size="small" sx={{ ml: 'auto', color: 'var(--color-secondary, #f5a623)' }} />
                                            </Box>
                                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>{r.comment}</Typography>
                                        </Box>
                                    ))}
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </Box>
                </Paper>

                {/* RELATED PRODUCTS */}
                {related.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <Box sx={{ width: 6, height: 28, bgcolor: 'var(--color-secondary, #f5a623)', borderRadius: 2 }} />
                            <Typography variant="h5" fontWeight={800} sx={{ fontFamily: '"Playfair Display", serif', color: 'var(--color-primary, #0a192f)' }}>Sách cùng danh mục</Typography>
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