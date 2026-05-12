// src/modules/customer/pages/ProductDetailPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Button, IconButton,
    Chip, Rating, Divider, Breadcrumbs, Link, Paper,
    Tabs, Tab, Avatar, TextField, LinearProgress, Modal,
    Skeleton, Alert,
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
import ProductCard from '../components/products/ProductCard';

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

    const getSrc = (idx: number) =>
        errored[idx]
            ? `https://placehold.co/300x420/f5f5f5/999?text=${encodeURIComponent(title)}`
            : images[idx];

    const openZoom = (idx: number) => { setZoomIdx(idx); setZoom(true); };

    return (
        <>
            <Box sx={{
                bgcolor: '#fafafa', borderRadius: 2, p: 3,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                minHeight: 360, border: '1px solid #f0f0f0', position: 'relative', overflow: 'hidden',
                '&:hover .zoom-btn': { opacity: 1 }, '&:hover .nav-btn': { opacity: 1 },
            }}>
                <Box component="img" key={activeIdx} src={getSrc(activeIdx)} alt={`${title} - ảnh ${activeIdx + 1}`}
                    onError={() => setErrored(prev => ({ ...prev, [activeIdx]: true }))}
                    sx={{ maxHeight: 340, maxWidth: '100%', objectFit: 'contain', transition: 'opacity 0.2s ease' }} />
                <IconButton className="zoom-btn" onClick={() => openZoom(activeIdx)} sx={{
                    position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.45)', color: '#fff',
                    opacity: 0, transition: 'opacity 0.2s', '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                }}><ZoomIn fontSize="small" /></IconButton>
                {images.length > 1 && (
                    <>
                        <IconButton className="nav-btn" onClick={() => setActiveIdx((activeIdx - 1 + images.length) % images.length)} sx={{
                            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.35)', color: '#fff', opacity: 0, transition: 'opacity 0.2s',
                        }}><ArrowBackIos sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton className="nav-btn" onClick={() => setActiveIdx((activeIdx + 1) % images.length)} sx={{
                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.35)', color: '#fff', opacity: 0, transition: 'opacity 0.2s',
                        }}><ArrowForwardIos sx={{ fontSize: 16 }} /></IconButton>
                    </>
                )}
            </Box>
            {images.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    {images.map((_, i) => (
                        <Box key={i} onClick={() => setActiveIdx(i)} sx={{
                            width: 68, height: 90, borderRadius: 1.5, overflow: 'hidden',
                            border: i === activeIdx ? '2px solid #d32f2f' : '2px solid #e0e0e0',
                            cursor: 'pointer', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

    // Sách liên quan — lấy theo cùng categoryId
    const { products: relatedProducts } = useProducts({
        categoryId: product?.categoryId || undefined,
        size: 4,
    });
    const related = relatedProducts.filter(p => p.id !== product?.id).slice(0, 4);

    const totalReviews = RATING_DIST.reduce((s, r) => s + r.count, 0);

    if (isLoading) {
        return (
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
                <Container maxWidth="lg" sx={{ py: 3 }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 5 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} /></Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Skeleton width="30%" height={32} />
                            <Skeleton width="80%" height={40} sx={{ mt: 1 }} />
                            <Skeleton width="50%" height={24} sx={{ mt: 1 }} />
                            <Skeleton width="40%" height={48} sx={{ mt: 2 }} />
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
        addToCart({ ...product, qty: 1 });
        openCart();
    };

    const handleBuyNow = () => {
        addToCart({ ...product, qty: 1 });
        navigate('/checkout');
    };

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Breadcrumbs sx={{ mb: 2, fontSize: 13 }}>
                    <Link underline="hover" color="inherit" href="/" sx={{ cursor: 'pointer' }}>Trang chủ</Link>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/shop')} sx={{ cursor: 'pointer' }}>
                        {product.category || 'Sách'}
                    </Link>
                    <Typography fontSize={13} color="text.primary" noWrap sx={{ maxWidth: 220 }}>{product.title}</Typography>
                </Breadcrumbs>

                <Paper elevation={0} sx={{ borderRadius: 2, p: 3, mb: 2 }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ position: 'sticky', top: 80 }}>
                                <ImageGallery images={images} title={product.title} />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                    <IconButton onClick={() => setFav(!fav)} sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, flex: 1 }}>
                                        {fav ? <Favorite sx={{ color: '#d32f2f' }} /> : <FavoriteBorder />}
                                        <Typography variant="caption" sx={{ ml: 0.5 }}>{fav ? 'Đã thích' : 'Yêu thích'}</Typography>
                                    </IconButton>
                                    <IconButton sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, flex: 1 }}>
                                        <Share /><Typography variant="caption" sx={{ ml: 0.5 }}>Chia sẻ</Typography>
                                    </IconButton>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                {product.badge && <Chip label={product.badge} size="small" sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 700, fontSize: 11 }} />}
                                {product.category && <Chip label={product.category} size="small" variant="outlined" sx={{ fontSize: 11 }} />}
                            </Box>

                            <Typography variant="h5" fontWeight={800} sx={{ mb: 1, lineHeight: 1.3 }}>{product.title}</Typography>
                            {product.author && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Tác giả: <strong>{product.author}</strong>
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Chip icon={<CheckCircle sx={{ fontSize: 14, color: '#4caf50 !important' }} />}
                                    label="Chính hãng" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontSize: 11 }} />
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
                                <Typography variant="h4" fontWeight={900} color="#d32f2f">{fmt(product.price)}</Typography>
                                {product.oldPrice > 0 && (
                                    <>
                                        <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{fmt(product.oldPrice)}</Typography>
                                        <Chip label={`Tiết kiệm ${discount}%`} size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }} />
                                    </>
                                )}
                            </Box>

                            <Paper elevation={0} sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, mb: 3 }}>
                                <Grid container spacing={1.5}>
                                    {[
                                        ['📦 Còn lại', `${product.stock} cuốn`],
                                        ['🖼️ Ảnh', `${images.length} hình`],
                                    ].map(([label, val]) => (
                                        <Grid size={{ xs: 6 }} key={label as string}>
                                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                                            <Typography variant="body2" fontWeight={600}>{val}</Typography>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Typography variant="body2" fontWeight={600}>Số lượng:</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                                    <IconButton size="small" onClick={() => setQty(Math.max(1, qty - 1))}><Remove fontSize="small" /></IconButton>
                                    <Typography sx={{ px: 2, minWidth: 32, textAlign: 'center', fontWeight: 700 }}>{qty}</Typography>
                                    <IconButton size="small" onClick={() => setQty(Math.min(product.stock, qty + 1))}><Add fontSize="small" /></IconButton>
                                </Box>
                                <Typography variant="caption" color="text.secondary">(còn {product.stock} sản phẩm)</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                <Button variant="outlined" size="large" startIcon={<ShoppingCart />} onClick={handleAddToCart}
                                    sx={{ flex: 1, minWidth: 160, borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#ffebee' } }}>
                                    Thêm vào giỏ
                                </Button>
                                <Button variant="contained" size="large" onClick={handleBuyNow}
                                    sx={{ flex: 1, minWidth: 160, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 700 }}>
                                    Mua ngay
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {[
                                    { icon: <LocalShipping sx={{ fontSize: 16, color: '#1565c0' }} />, text: 'Miễn phí ship từ 150k' },
                                    { icon: <Verified sx={{ fontSize: 16, color: '#2e7d32' }} />, text: 'Sách chính hãng 100%' },
                                    { icon: <CheckCircle sx={{ fontSize: 16, color: '#f57c00' }} />, text: 'Đổi trả trong 7 ngày' },
                                ].map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {item.icon}<Typography variant="caption" fontWeight={600}>{item.text}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* TABS */}
                <Paper elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
                        px: 2, borderBottom: '1px solid #f0f0f0',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                        '& .MuiTabs-indicator': { bgcolor: '#d32f2f' },
                        '& .Mui-selected': { color: '#d32f2f !important' },
                    }}>
                        <Tab label="Mô tả sách" />
                        <Tab label={`Đánh giá (${totalReviews})`} />
                    </Tabs>
                    <Box sx={{ px: 3 }}>
                        <TabPanel value={tab} index={0}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Giới thiệu sách</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                                {product.description || 'Chưa có mô tả cho sản phẩm này.'}
                            </Typography>
                        </TabPanel>
                        <TabPanel value={tab} index={1}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#fff9f9', borderRadius: 2 }}>
                                        <Typography variant="h2" fontWeight={900} color="#d32f2f">4.8</Typography>
                                        <Rating value={4.8} readOnly precision={0.1} sx={{ mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">{totalReviews} đánh giá</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    {REVIEWS.map((r) => (
                                        <Box key={r.id} sx={{ mb: 2.5, pb: 2.5, borderBottom: '1px solid #f0f0f0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#d32f2f', fontSize: 14, fontWeight: 700 }}>{r.avatar}</Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700}>{r.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{r.date}</Typography>
                                                </Box>
                                                <Rating value={r.rating} readOnly size="small" sx={{ ml: 'auto' }} />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{r.comment}</Typography>
                                        </Box>
                                    ))}
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </Box>
                </Paper>

                {/* Related */}
                {related.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ width: 4, height: 24, bgcolor: '#d32f2f', borderRadius: 2 }} />
                            <Typography variant="h6" fontWeight={800}>Sách liên quan</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {related.map(p => (
                                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}><ProductCard product={p} /></Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default ProductDetailPage;