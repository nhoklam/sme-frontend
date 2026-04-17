// src/modules/customer/components/products/ProductListItem.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Chip, Rating, Paper, IconButton,
} from '@mui/material';
import { ShoppingCart, FavoriteBorder, Favorite } from '@mui/icons-material';
import { fmt, calcDiscount } from '../../../../utils/constants';
import { useCartContext } from '../../../../store/CartContext';

const BADGE_COLOR = { Hot: '#d32f2f', Bestseller: '#f57c00', Mới: '#388e3c' };

const ProductListItem = ({ product }) => {
    const [fav, setFav] = useState(false);
    const [imgErr, setImgErr] = useState(false);
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();

    const thumb = product.images?.[0] ?? product.img ?? '';

    const handleAdd = (e) => {
        e.stopPropagation();
        addToCart(product);
        openCart();
    };

    return (
        <Paper elevation={0} sx={{
            display: 'flex', gap: 2, p: 2, borderRadius: 2,
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
        }}>
            {/* Image */}
            <Box
                onClick={() => navigate(`/product/${product.id}`)}
                sx={{
                    width: 100, flexShrink: 0, cursor: 'pointer',
                    bgcolor: '#fafafa', borderRadius: 1.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #f0f0f0', overflow: 'hidden',
                }}
            >
                <Box component="img"
                    src={imgErr ? `https://placehold.co/100x140/f5f5f5/999?text=📖` : thumb}
                    alt={product.title}
                    onError={() => setImgErr(true)}
                    sx={{ width: '100%', height: 130, objectFit: 'contain', p: 1 }}
                />
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
                    <Chip label={product.badge} size="small"
                        sx={{ bgcolor: BADGE_COLOR[product.badge] ?? '#757575', color: '#fff', fontWeight: 700, fontSize: 10, height: 20 }} />
                    <Chip label={product.category} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                </Box>

                <Typography
                    variant="body1" fontWeight={700} onClick={() => navigate(`/product/${product.id}`)}
                    sx={{ cursor: 'pointer', mb: 0.5, '&:hover': { color: '#d32f2f' }, lineHeight: 1.3 }}>
                    {product.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                    {product.author} · {product.publisher} · {product.pages} trang
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating value={product.rating} readOnly size="small" precision={0.1} sx={{ fontSize: 14 }} />
                    <Typography variant="caption" color="text.secondary">({product.sold.toLocaleString()} đã bán)</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', fontSize: 12, lineHeight: 1.6,
                }}>
                    {product.description}
                </Typography>
            </Box>

            {/* Price + actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 140 }}>
                <Box sx={{ textAlign: 'right' }}>
                    <Chip label={`-${calcDiscount(product.oldPrice, product.price)}%`} size="small"
                        sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700, fontSize: 11, mb: 0.5 }} />
                    <Typography variant="h6" fontWeight={900} color="#d32f2f" display="block">
                        {fmt(product.price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        {fmt(product.oldPrice)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                    <Button fullWidth variant="contained" size="small"
                        startIcon={<ShoppingCart sx={{ fontSize: 15 }} />}
                        onClick={handleAdd}
                        sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b71c1c' } }}>
                        Thêm vào giỏ
                    </Button>
                    <IconButton size="small" onClick={() => setFav(!fav)}
                        sx={{ alignSelf: 'center', '&:hover': { color: '#d32f2f' } }}>
                        {fav ? <Favorite sx={{ color: '#d32f2f', fontSize: 18 }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
};

export default ProductListItem;