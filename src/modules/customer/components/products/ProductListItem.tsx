// src/modules/customer/components/products/ProductListItem.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Chip, Paper, IconButton,
} from '@mui/material';
import { ShoppingCart, FavoriteBorder, Favorite } from '@mui/icons-material';
import { fmt } from '../../../../utils/constants';
import { useCartContext } from '../../../../store/CartContext';

const ProductListItem = ({ product }: { product: any }) => {
    const [fav, setFav] = useState(false);
    const [imgErr, setImgErr] = useState(false);
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();

    const thumb = product.images?.[0] ?? product.img ?? '';
    const title = product.title ?? product.name ?? '';
    const fallback = `https://placehold.co/80x110/f5f5f5/999?text=📖`;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(product);
        openCart();
    };

    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                gap: 1.75,
                p: 1.75,
                borderRadius: 1.5,
                border: '1px solid #ececec',
                bgcolor: '#fff',
                transition: 'all 0.18s ease',
                '&:hover': {
                    borderColor: '#e8401c',
                    boxShadow: '0 2px 10px rgba(232,64,28,0.1)',
                },
            }}
        >
            {/* Image */}
            <Box
                onClick={() => navigate(`/product/${product.id}`)}
                sx={{
                    width: 80,
                    flexShrink: 0,
                    cursor: 'pointer',
                    bgcolor: '#f8f8f8',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden',
                }}
            >
                <Box
                    component="img"
                    src={imgErr ? fallback : (thumb || fallback)}
                    alt={title}
                    onError={() => setImgErr(true)}
                    sx={{ width: '100%', height: 110, objectFit: 'contain', p: 0.75 }}
                />
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {(product.badge || product.category) && (
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.6, flexWrap: 'wrap' }}>
                        {product.badge && (
                            <Chip label={product.badge} size="small" sx={{
                                bgcolor: '#e8401c', color: '#fff',
                                fontWeight: 700, fontSize: 10, height: 18,
                                fontFamily: '"Segoe UI", sans-serif',
                            }} />
                        )}
                        {product.category && (
                            <Chip label={product.category} size="small" variant="outlined" sx={{
                                fontSize: 10, height: 18, borderColor: '#ddd',
                                fontFamily: '"Segoe UI", sans-serif',
                            }} />
                        )}
                    </Box>
                )}

                <Typography
                    fontWeight={700}
                    onClick={() => navigate(`/product/${product.id}`)}
                    sx={{
                        cursor: 'pointer', mb: 0.4,
                        lineHeight: 1.35, fontSize: 13.5,
                        fontFamily: '"Segoe UI", sans-serif',
                        '&:hover': { color: '#e8401c' },
                        transition: 'color 0.15s',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {title}
                </Typography>

                {(product.author || product.publisher) && (
                    <Typography sx={{
                        fontSize: 12,
                        color: '#888',
                        display: 'block',
                        mb: 0.6,
                        fontFamily: '"Segoe UI", sans-serif',
                    }}>
                        {[product.author, product.publisher].filter(Boolean).join(' · ')}
                    </Typography>
                )}

                {product.description && (
                    <Typography sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: 12,
                        color: '#888',
                        lineHeight: 1.55,
                        fontFamily: '"Segoe UI", sans-serif',
                    }}>
                        {product.description}
                    </Typography>
                )}
            </Box>

            {/* Price + actions */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                minWidth: 120,
                flexShrink: 0,
            }}>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography fontWeight={800} color="#e8401c" sx={{
                        display: 'block', lineHeight: 1.2, fontSize: 16,
                        fontFamily: '"Segoe UI", sans-serif',
                    }}>
                        {fmt(product.price)}
                    </Typography>
                    {product.oldPrice > 0 && (
                        <Typography sx={{
                            fontSize: 12,
                            color: '#bbb',
                            textDecoration: 'line-through',
                            display: 'block',
                            fontFamily: '"Segoe UI", sans-serif',
                        }}>
                            {fmt(product.oldPrice)}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, width: '100%' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<ShoppingCart sx={{ fontSize: 14 }} />}
                        onClick={handleAdd}
                        sx={{
                            bgcolor: '#e8401c',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 1,
                            fontSize: 12,
                            fontFamily: '"Segoe UI", sans-serif',
                            '&:hover': { bgcolor: '#c62828' },
                        }}
                    >
                        Thêm vào giỏ
                    </Button>
                    <IconButton
                        size="small"
                        onClick={() => setFav(!fav)}
                        sx={{ alignSelf: 'center', '&:hover': { color: '#e8401c' } }}
                    >
                        {fav
                            ? <Favorite sx={{ color: '#e8401c', fontSize: 17 }} />
                            : <FavoriteBorder sx={{ fontSize: 17, color: '#bbb' }} />
                        }
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
};

export default ProductListItem;