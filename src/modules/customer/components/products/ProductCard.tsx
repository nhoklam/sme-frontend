import React, { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, IconButton,
} from '@mui/material';
import { ShoppingCart, FavoriteBorder, Favorite } from '@mui/icons-material';
import { fmt, calcDiscount } from '../../../../utils/constants';
import { useCartContext } from '../../../../store/CartContext';

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
    Hot: { bg: '#e8401c', color: '#fff' },
    Bestseller: { bg: '#f57c00', color: '#fff' },
    Mới: { bg: '#2e7d32', color: '#fff' },
    'Sale': { bg: '#c62828', color: '#fff' },
};

const CARD_W = 185;
const IMG_H = 185;

const ProductCard = memo(({ product }: { product: any }) => {
    const [fav, setFav] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [hovered, setHovered] = useState(false);
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();

    const thumbSrc = product.images?.[0] ?? product.img ?? '';
    const title = product.title ?? product.name ?? '';
    const discount = product.oldPrice ? calcDiscount(product.oldPrice, product.price) : 0;
    const fallback = `https://placehold.co/${CARD_W}x${IMG_H}/f5f5f5/bbb?text=${encodeURIComponent(title.slice(0, 12))}`;

    const goToDetail = useCallback(() => navigate(`/product/${product.id}`), [navigate, product.id]);

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(product);
        openCart();
    }, [addToCart, openCart, product]);

    return (
        <Box
            sx={{
                width: CARD_W,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                bgcolor: '#fff',
                borderRadius: 1.5,
                border: '1px solid #ececec',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                cursor: 'default',
                '&:hover': {
                    borderColor: '#e8401c',
                    boxShadow: '0 4px 16px rgba(232,64,28,0.13)',
                    transform: 'translateY(-3px)',
                },
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Badge */}
            {product.badge && (
                <Box sx={{
                    position: 'absolute', top: 8, left: 8, zIndex: 3,
                    bgcolor: BADGE_STYLE[product.badge]?.bg ?? '#757575',
                    color: BADGE_STYLE[product.badge]?.color ?? '#fff',
                    fontWeight: 700, fontSize: 10,
                    px: 0.9, py: 0.2, borderRadius: 0.75,
                    lineHeight: 1.5, whiteSpace: 'nowrap',
                    fontFamily: '"Segoe UI", sans-serif',
                }}>
                    {product.badge}
                </Box>
            )}

            {/* Discount badge */}
            {discount > 0 && (
                <Box sx={{
                    position: 'absolute', top: 8, right: 8, zIndex: 3,
                    bgcolor: '#e8401c', color: '#fff',
                    fontWeight: 800, fontSize: 10,
                    px: 0.9, py: 0.2, borderRadius: 0.75, lineHeight: 1.5,
                    fontFamily: '"Segoe UI", sans-serif',
                }}>
                    -{discount}%
                </Box>
            )}

            {/* Image area */}
            <Box
                onClick={goToDetail}
                sx={{
                    width: CARD_W,
                    height: IMG_H,
                    flexShrink: 0,
                    bgcolor: '#f8f8f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                <Box
                    component="img"
                    src={imgError ? fallback : thumbSrc}
                    alt={title}
                    onError={() => setImgError(true)}
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '8px',
                        transition: 'transform 0.25s ease',
                        transform: hovered ? 'scale(1.04)' : 'scale(1)',
                    }}
                />

                {/* Fav button */}
                <IconButton
                    size="small"
                    onClick={e => { e.stopPropagation(); setFav(v => !v); }}
                    sx={{
                        position: 'absolute', bottom: 6, right: 6,
                        width: 26, height: 26,
                        bgcolor: 'rgba(255,255,255,0.92)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        '&:hover': { bgcolor: '#fff3f0' },
                    }}
                >
                    {fav
                        ? <Favorite sx={{ fontSize: 14, color: '#e8401c' }} />
                        : <FavoriteBorder sx={{ fontSize: 14, color: '#aaa' }} />
                    }
                </IconButton>
            </Box>

            {/* Info */}
            <Box sx={{ px: 1.5, pt: 1.25, pb: 0.75, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {/* Author */}
                {product.author && (
                    <Typography sx={{
                        fontSize: 11,
                        color: '#999',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '16px',
                        mb: 0.4,
                        fontFamily: '"Segoe UI", sans-serif',
                    }}>
                        {product.author}
                    </Typography>
                )}

                {/* Title */}
                <Box
                    onClick={goToDetail}
                    sx={{
                        flexShrink: 0,
                        height: 38,
                        overflow: 'hidden',
                        mb: 0.75,
                        cursor: 'pointer',
                        '&:hover .book-title': { color: '#e8401c' },
                    }}
                >
                    <Typography
                        className="book-title"
                        sx={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            lineHeight: 1.45,
                            color: '#1a1a1a',
                            transition: 'color 0.15s',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontFamily: '"Segoe UI", sans-serif',
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Price */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.75 }}>
                    <Typography sx={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#e8401c',
                        lineHeight: 1,
                        fontFamily: '"Segoe UI", sans-serif',
                    }}>
                        {fmt(product.price)}
                    </Typography>
                    {product.oldPrice > 0 && (
                        <Typography sx={{
                            fontSize: 11,
                            color: '#bbb',
                            textDecoration: 'line-through',
                            lineHeight: 1,
                            fontFamily: '"Segoe UI", sans-serif',
                        }}>
                            {fmt(product.oldPrice)}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Add to cart button */}
            <Box sx={{ px: 1.5, pb: 1.5, flexShrink: 0 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<ShoppingCart sx={{ fontSize: 14 }} />}
                    onClick={handleAddToCart}
                    sx={{
                        borderColor: '#e8401c',
                        color: '#e8401c',
                        bgcolor: 'transparent',
                        '&:hover': {
                            bgcolor: '#e8401c',
                            color: '#fff',
                            borderColor: '#e8401c',
                        },
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                        borderRadius: 1,
                        py: 0.6,
                        fontFamily: '"Segoe UI", sans-serif',
                        transition: 'all 0.18s ease',
                    }}
                >
                    Thêm vào giỏ
                </Button>
            </Box>
        </Box>
    );
});

export default ProductCard;