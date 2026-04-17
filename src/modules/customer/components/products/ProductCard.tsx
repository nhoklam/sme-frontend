import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, IconButton, Chip, Rating,
} from '@mui/material';
import { ShoppingCart, FavoriteBorder, Favorite, Visibility } from '@mui/icons-material';
import { fmt, calcDiscount } from '../../../../utils/constants';

const BADGE_COLOR = {
    Hot: '#d32f2f',
    Bestseller: '#f57c00',
    Mới: '#388e3c',
};

const CARD_W = 200;
const IMG_H = 200;
const CARD_H = 390;

const ProductCard = ({ product }) => {
    const [fav, setFav] = useState(false);
    const [imgError, setImgError] = useState(false);
    const navigate = useNavigate();

    const thumbSrc = product.images?.[0] ?? product.img ?? '';
    const title = product.title ?? product.name ?? '';
    const discount = product.oldPrice ? calcDiscount(product.oldPrice, product.price) : 0;
    const fallback = `https://placehold.co/${CARD_W}x${IMG_H}/f5f5f5/bbb?text=${encodeURIComponent(title)}`;

    const goToDetail = () => navigate(`/product/${product.id}`);

    return (
        <Box sx={{
            width: CARD_W,
            height: CARD_H,
            flexShrink: 0,

            display: 'flex',
            flexDirection: 'column',
            position: 'relative',

            bgcolor: '#fff',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            transition: 'all 0.22s ease',
            cursor: 'default',
            '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                transform: 'translateY(-4px)',
            },
        }}>

            {product.badge && (
                <Box sx={{
                    position: 'absolute', top: 8, left: 8, zIndex: 3,
                    bgcolor: BADGE_COLOR[product.badge] ?? '#757575',
                    color: '#fff', fontWeight: 800, fontSize: 10,
                    px: 0.9, py: 0.15, borderRadius: 1, lineHeight: 1.6,
                    whiteSpace: 'nowrap',
                }}>
                    {product.badge}
                </Box>
            )}

            {discount > 0 && (
                <Box sx={{
                    position: 'absolute', top: 8, right: 8, zIndex: 3,
                    bgcolor: '#d32f2f', color: '#fff',
                    fontWeight: 800, fontSize: 10,
                    px: 0.9, py: 0.15, borderRadius: 1, lineHeight: 1.6,
                }}>
                    -{discount}%
                </Box>
            )}

            <Box
                onClick={goToDetail}
                sx={{
                    width: CARD_W,
                    height: IMG_H,
                    flexShrink: 0,
                    bgcolor: '#f9f9f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover .hover-overlay': { opacity: 1 },
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
                        display: 'block',
                    }}
                />

                <Box className="hover-overlay" sx={{
                    position: 'absolute', inset: 0,
                    bgcolor: 'rgba(0,0,0,0.38)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                }}>
                    <Button size="small" variant="contained"
                        startIcon={<Visibility sx={{ fontSize: 13 }} />}
                        sx={{
                            bgcolor: '#fff', color: '#222',
                            textTransform: 'none', fontWeight: 700, fontSize: 12,
                            py: 0.5, px: 1.5, borderRadius: 1.5,
                            '&:hover': { bgcolor: '#f0f0f0' },
                        }}>
                        Xem chi tiết
                    </Button>
                </Box>

                <IconButton size="small"
                    onClick={e => { e.stopPropagation(); setFav(v => !v); }}
                    sx={{
                        position: 'absolute', bottom: 6, right: 6,
                        width: 28, height: 28,
                        bgcolor: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        '&:hover': { bgcolor: '#fff' },
                    }}>
                    {fav
                        ? <Favorite sx={{ fontSize: 15, color: '#d32f2f' }} />
                        : <FavoriteBorder sx={{ fontSize: 15, color: '#999' }} />}
                </IconButton>
            </Box>

            <Box sx={{
                px: 1.5,
                pt: 1.25,
                pb: 0,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                overflow: 'hidden',
            }}>

                <Typography sx={{
                    fontSize: 11,
                    color: '#888',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '18px',
                    height: 18,
                    flexShrink: 0,
                    mb: 0.5,
                }}>
                    {product.author}
                </Typography>
                <Box sx={{
                    flexShrink: 0,
                    height: 40,
                    overflow: 'hidden',
                    mb: 0.75,
                    cursor: 'pointer',
                    '&:hover .book-title': { color: '#d32f2f' },
                }}
                    onClick={goToDetail}>
                    <Typography className="book-title" sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: '#1a1a2e',
                        transition: 'color 0.15s',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {title}
                    </Typography>
                </Box>

                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    height: 22, flexShrink: 0, mb: 0.5,
                }}>
                    <Rating value={product.rating ?? 0} readOnly size="small" precision={0.1} sx={{ fontSize: 13 }} />
                    <Typography sx={{ fontSize: 11, color: '#999' }}>
                        ({(product.sold ?? 0).toLocaleString()})
                    </Typography>
                </Box>

                <Box sx={{
                    display: 'flex', alignItems: 'baseline', gap: 0.75,
                    height: 24, flexShrink: 0,
                }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 900, color: '#d32f2f', lineHeight: 1 }}>
                        {fmt(product.price)}
                    </Typography>
                    {product.oldPrice && (
                        <Typography sx={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through', lineHeight: 1 }}>
                            {fmt(product.oldPrice)}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ px: 1.5, pb: 1.5, pt: 0.75, flexShrink: 0 }}>
                <Button
                    fullWidth variant="contained" size="small"
                    startIcon={<ShoppingCart sx={{ fontSize: 15 }} />}
                    sx={{
                        bgcolor: '#d32f2f',
                        '&:hover': { bgcolor: '#b71c1c' },
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 13,
                        borderRadius: 1.5,
                        py: 0.75,
                        width: '100%',
                    }}>
                    Thêm vào giỏ
                </Button>
            </Box>
        </Box>
    );
};

export default ProductCard;