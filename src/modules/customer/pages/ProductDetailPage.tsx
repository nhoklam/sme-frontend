// src/modules/customer/pages/ProductDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Button, IconButton,
    Chip, Rating, Divider, Breadcrumbs, Link, Paper,
    Tabs, Tab, Avatar, TextField, LinearProgress, Modal,
} from '@mui/material';
import {
    ShoppingCart, FavoriteBorder, Favorite, Share,
    LocalShipping, Verified, Add, Remove,
    Star, CheckCircle, ZoomIn, Close,
    ArrowBackIos, ArrowForwardIos,
} from '@mui/icons-material';
import { PRODUCTS, fmt, calcDiscount } from '../../../utils/constants';
import ProductCard from '../components/products/ProductCard';

// ── Mock data ──────────────────────────────────────────────────
const REVIEWS = [
    { id: 1, name: 'Nguyễn Minh Tuấn', avatar: 'N', rating: 5, date: '15/03/2025', comment: 'Sách rất hay, nội dung sâu sắc và ý nghĩa. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop dài dài!' },
    { id: 2, name: 'Trần Thị Lan', avatar: 'T', rating: 5, date: '10/03/2025', comment: 'Đọc xong thấy thay đổi tư duy rất nhiều. Cuốn sách này xứng đáng với danh tiếng của nó!' },
    { id: 3, name: 'Lê Văn Hùng', avatar: 'L', rating: 4, date: '05/03/2025', comment: 'Nội dung tốt, dịch khá ổn. Bìa sách đẹp, giấy tốt. Trừ 1 sao vì ship hơi lâu.' },
    { id: 4, name: 'Phạm Thu Hà', avatar: 'P', rating: 5, date: '01/03/2025', comment: 'Mình đã đọc cuốn này 3 lần rồi, lần nào cũng rút ra được điều mới!' },
];

const RATING_DIST = [
    { stars: 5, count: 85 },
    { stars: 4, count: 10 },
    { stars: 3, count: 3 },
    { stars: 2, count: 1 },
    { stars: 1, count: 1 },
];

const TabPanel = ({ children, value, index }) =>
    value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;

// ── Image Gallery Component ───────────────────────────────────
const ImageGallery = ({ images = [], title }) => {
    const [activeIdx, setActiveIdx] = useState(0);
    const [errored, setErrored] = useState({});
    const [zoom, setZoom] = useState(false);
    const [zoomIdx, setZoomIdx] = useState(0);

    const getSrc = (idx) =>
        errored[idx]
            ? `https://placehold.co/300x420/f5f5f5/999?text=${encodeURIComponent(title)}`
            : images[idx];

    const handlePrev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
    const handleNext = () => setActiveIdx((i) => (i + 1) % images.length);

    const openZoom = (idx) => { setZoomIdx(idx); setZoom(true); };

    return (
        <>
            {/* ── Main image ── */}
            <Box sx={{
                bgcolor: '#fafafa', borderRadius: 2, p: 3,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                minHeight: 360, border: '1px solid #f0f0f0', position: 'relative',
                overflow: 'hidden',
                '&:hover .zoom-btn': { opacity: 1 },
                '&:hover .nav-btn': { opacity: 1 },
            }}>
                <Box
                    component="img"
                    key={activeIdx}
                    src={getSrc(activeIdx)}
                    alt={`${title} - ảnh ${activeIdx + 1}`}
                    onError={() => setErrored(prev => ({ ...prev, [activeIdx]: true }))}
                    sx={{
                        maxHeight: 340, maxWidth: '100%', objectFit: 'contain',
                        transition: 'opacity 0.2s ease',
                    }}
                />

                {/* Zoom button */}
                <IconButton className="zoom-btn" onClick={() => openZoom(activeIdx)} sx={{
                    position: 'absolute', top: 8, right: 8,
                    bgcolor: 'rgba(0,0,0,0.45)', color: '#fff',
                    opacity: 0, transition: 'opacity 0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                }}>
                    <ZoomIn fontSize="small" />
                </IconButton>

                {/* Prev / Next arrows (chỉ khi có nhiều ảnh) */}
                {images.length > 1 && (
                    <>
                        <IconButton className="nav-btn" onClick={handlePrev} sx={{
                            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.35)', color: '#fff',
                            opacity: 0, transition: 'opacity 0.2s',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                        }}>
                            <ArrowBackIos sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton className="nav-btn" onClick={handleNext} sx={{
                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.35)', color: '#fff',
                            opacity: 0, transition: 'opacity 0.2s',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                        }}>
                            <ArrowForwardIos sx={{ fontSize: 16 }} />
                        </IconButton>
                    </>
                )}

                {/* Indicator dots */}
                {images.length > 1 && (
                    <Box sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
                        {images.map((_, i) => (
                            <Box key={i} onClick={() => setActiveIdx(i)} sx={{
                                width: i === activeIdx ? 18 : 8, height: 8, borderRadius: 4,
                                bgcolor: i === activeIdx ? '#d32f2f' : '#ccc',
                                cursor: 'pointer', transition: 'all 0.25s',
                            }} />
                        ))}
                    </Box>
                )}
            </Box>

            {/* ── Thumbnails ── */}
            {images.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    {images.map((_, i) => (
                        <Box
                            key={i}
                            onClick={() => setActiveIdx(i)}
                            sx={{
                                width: 68, height: 90, borderRadius: 1.5, overflow: 'hidden',
                                border: i === activeIdx ? '2px solid #d32f2f' : '2px solid #e0e0e0',
                                cursor: 'pointer', bgcolor: '#fafafa',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'border-color 0.2s',
                                '&:hover': { borderColor: '#d32f2f' },
                            }}
                        >
                            <Box
                                component="img"
                                src={getSrc(i)}
                                alt={`thumb-${i}`}
                                onError={() => setErrored(prev => ({ ...prev, [i]: true }))}
                                sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
                            />
                        </Box>
                    ))}
                </Box>
            )}

            {/* ── Zoom Modal (lightbox) ── */}
            <Modal open={zoom} onClose={() => setZoom(false)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', outline: 'none', maxWidth: '90vw', maxHeight: '90vh' }}>
                    <IconButton onClick={() => setZoom(false)} sx={{
                        position: 'absolute', top: -16, right: -16, zIndex: 1,
                        bgcolor: '#fff', boxShadow: 3, '&:hover': { bgcolor: '#f5f5f5' },
                    }}>
                        <Close />
                    </IconButton>

                    {/* Prev / Next in modal */}
                    {images.length > 1 && (
                        <>
                            <IconButton onClick={() => setZoomIdx((zoomIdx - 1 + images.length) % images.length)} sx={{
                                position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
                                bgcolor: '#fff', boxShadow: 2,
                            }}>
                                <ArrowBackIos sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton onClick={() => setZoomIdx((zoomIdx + 1) % images.length)} sx={{
                                position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                                bgcolor: '#fff', boxShadow: 2,
                            }}>
                                <ArrowForwardIos sx={{ fontSize: 16 }} />
                            </IconButton>
                        </>
                    )}

                    <Box
                        component="img"
                        src={getSrc(zoomIdx)}
                        alt={title}
                        sx={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain', borderRadius: 2, display: 'block', bgcolor: '#fff', p: 2 }}
                    />

                    {/* Thumbnail strip in modal */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                        {images.map((_, i) => (
                            <Box key={i} onClick={() => setZoomIdx(i)} sx={{
                                width: 48, height: 60, borderRadius: 1, overflow: 'hidden',
                                border: i === zoomIdx ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                                cursor: 'pointer', bgcolor: '#fff',
                            }}>
                                <Box component="img" src={getSrc(i)} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

// ══════════════════════════════════════════════════════════════
// PRODUCT DETAIL PAGE
// ══════════════════════════════════════════════════════════════
const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = PRODUCTS.find(p => p.id === Number(id)) || PRODUCTS[0];

    const [qty, setQty] = useState(1);
    const [fav, setFav] = useState(false);
    const [tab, setTab] = useState(0);

    const related = PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);
    const totalReviews = RATING_DIST.reduce((s, r) => s + r.count, 0);
    const images = product.images || (product.img ? [product.img] : []);

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>

                {/* Breadcrumb */}
                <Breadcrumbs sx={{ mb: 2, fontSize: 13 }}>
                    <Link underline="hover" color="inherit" href="/" sx={{ cursor: 'pointer' }}>Trang chủ</Link>
                    <Link underline="hover" color="inherit" onClick={() => navigate(-1)} sx={{ cursor: 'pointer' }}>
                        {product.category}
                    </Link>
                    <Typography fontSize={13} color="text.primary" noWrap sx={{ maxWidth: 220 }}>
                        {product.title}
                    </Typography>
                </Breadcrumbs>

                {/* Main card */}
                <Paper elevation={0} sx={{ borderRadius: 2, p: 3, mb: 2 }}>
                    <Grid container spacing={4}>

                        {/* ── LEFT: Gallery ── */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{ position: 'sticky', top: 80 }}>
                                <ImageGallery images={images} title={product.title} />

                                {/* Yêu thích & chia sẻ */}
                                <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                    <IconButton onClick={() => setFav(!fav)}
                                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, flex: 1 }}>
                                        {fav ? <Favorite sx={{ color: '#d32f2f' }} /> : <FavoriteBorder />}
                                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                                            {fav ? 'Đã yêu thích' : 'Yêu thích'}
                                        </Typography>
                                    </IconButton>
                                    <IconButton sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5, flex: 1 }}>
                                        <Share />
                                        <Typography variant="caption" sx={{ ml: 0.5 }}>Chia sẻ</Typography>
                                    </IconButton>
                                </Box>
                            </Box>
                        </Grid>

                        {/* ── RIGHT: Info ── */}
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Chip label={product.badge} size="small" sx={{
                                    bgcolor: product.badge === 'Hot' ? '#d32f2f' : product.badge === 'Bestseller' ? '#f57c00' : '#388e3c',
                                    color: '#fff', fontWeight: 700, fontSize: 11,
                                }} />
                                <Chip label={product.category} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                            </Box>

                            <Typography variant="h5" fontWeight={800} sx={{ mb: 1, lineHeight: 1.3 }}>
                                {product.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Tác giả: <strong>{product.author}</strong> · NXB: {product.publisher} · Năm: {product.year}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Rating value={product.rating} readOnly precision={0.1} size="small" />
                                <Typography variant="body2" fontWeight={600}>{product.rating}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ({product.sold.toLocaleString()} lượt mua)
                                </Typography>
                                <Chip icon={<CheckCircle sx={{ fontSize: 14, color: '#4caf50 !important' }} />}
                                    label="Chính hãng" size="small"
                                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontSize: 11 }} />
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
                                <Typography variant="h4" fontWeight={900} color="#d32f2f">
                                    {fmt(product.price)}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                    {fmt(product.oldPrice)}
                                </Typography>
                                <Chip label={`Tiết kiệm ${calcDiscount(product.oldPrice, product.price)}%`}
                                    size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }} />
                            </Box>
                            <Typography variant="body2" color="#388e3c" fontWeight={600} sx={{ mb: 3 }}>
                                💰 Tiết kiệm {fmt(product.oldPrice - product.price)} so với giá gốc
                            </Typography>

                            {/* Thông tin sách */}
                            <Paper elevation={0} sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, mb: 3 }}>
                                <Grid container spacing={1.5}>
                                    {[
                                        ['📄 Số trang', `${product.pages} trang`],
                                        ['📦 Còn lại', `${product.stock} cuốn`],
                                        ['🏷️ NXB', product.publisher],
                                        ['📅 Năm XB', product.year],
                                        ['🖼️ Ảnh', `${images.length} hình`],
                                    ].map(([label, val]) => (
                                        <Grid item xs={6} key={label}>
                                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                                            <Typography variant="body2" fontWeight={600}>{val}</Typography>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>

                            {/* Quantity */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Typography variant="body2" fontWeight={600}>Số lượng:</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                                    <IconButton size="small" onClick={() => setQty(Math.max(1, qty - 1))}>
                                        <Remove fontSize="small" />
                                    </IconButton>
                                    <Typography sx={{ px: 2, minWidth: 32, textAlign: 'center', fontWeight: 700 }}>
                                        {qty}
                                    </Typography>
                                    <IconButton size="small" onClick={() => setQty(Math.min(product.stock, qty + 1))}>
                                        <Add fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    (còn {product.stock} sản phẩm)
                                </Typography>
                            </Box>

                            {/* CTA */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                <Button variant="outlined" size="large" startIcon={<ShoppingCart />}
                                    sx={{ flex: 1, minWidth: 160, borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#ffebee' } }}>
                                    Thêm vào giỏ
                                </Button>
                                <Button variant="contained" size="large"
                                    sx={{ flex: 1, minWidth: 160, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 700 }}>
                                    Mua ngay
                                </Button>
                            </Box>

                            {/* Services */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {[
                                    { icon: <LocalShipping sx={{ fontSize: 16, color: '#1565c0' }} />, text: 'Miễn phí ship từ 150k' },
                                    { icon: <Verified sx={{ fontSize: 16, color: '#2e7d32' }} />, text: 'Sách chính hãng 100%' },
                                    { icon: <CheckCircle sx={{ fontSize: 16, color: '#f57c00' }} />, text: 'Đổi trả trong 7 ngày' },
                                ].map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {item.icon}
                                        <Typography variant="caption" fontWeight={600}>{item.text}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* ── TABS ── */}
                <Paper elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}
                        sx={{
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
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                                {product.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                                Cuốn sách này sẽ là người bạn đồng hành tuyệt vời trên hành trình khám phá bản thân và phát triển kỹ năng. Với ngôn ngữ dễ hiểu, gần gũi cùng những ví dụ thực tế sinh động, tác giả đã truyền tải những thông điệp sâu sắc một cách tinh tế.
                            </Typography>
                        </TabPanel>

                        <TabPanel value={tab} index={1}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#fff9f9', borderRadius: 2 }}>
                                        <Typography variant="h2" fontWeight={900} color="#d32f2f">{product.rating}</Typography>
                                        <Rating value={product.rating} readOnly precision={0.1} sx={{ mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">{totalReviews} đánh giá</Typography>
                                    </Box>
                                    <Box sx={{ mt: 2 }}>
                                        {RATING_DIST.map(({ stars, count }) => (
                                            <Box key={stars} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ minWidth: 16 }}>{stars}</Typography>
                                                <Star sx={{ fontSize: 14, color: '#ffa726' }} />
                                                <LinearProgress variant="determinate" value={(count / totalReviews) * 100}
                                                    sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: '#ffa726' } }} />
                                                <Typography variant="caption" sx={{ minWidth: 24 }}>{count}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={8}>
                                    {REVIEWS.map((r) => (
                                        <Box key={r.id} sx={{ mb: 2.5, pb: 2.5, borderBottom: '1px solid #f0f0f0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#d32f2f', fontSize: 14, fontWeight: 700 }}>
                                                    {r.avatar}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700}>{r.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{r.date}</Typography>
                                                </Box>
                                                <Rating value={r.rating} readOnly size="small" sx={{ ml: 'auto' }} />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                                {r.comment}
                                            </Typography>
                                        </Box>
                                    ))}

                                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                                        <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>Viết đánh giá của bạn</Typography>
                                        <Rating sx={{ mb: 1.5 }} />
                                        <TextField fullWidth multiline rows={3} size="small"
                                            placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                                            sx={{ mb: 1.5 }} />
                                        <Button variant="contained" size="small"
                                            sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b71c1c' } }}>
                                            Gửi đánh giá
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </Box>
                </Paper>

                {/* ── Related ── */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Box sx={{ width: 4, height: 24, bgcolor: '#d32f2f', borderRadius: 2 }} />
                        <Typography variant="h6" fontWeight={800}>Sách liên quan</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {related.map(p => (
                            <Grid item xs={6} sm={4} md={3} key={p.id}>
                                <ProductCard product={p} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default ProductDetailPage;