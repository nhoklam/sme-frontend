import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Card, CardMedia, CardContent, Typography, Box, 
    IconButton, Skeleton, Chip, useTheme
} from '@mui/material';
import { ShoppingCartOutlined, FavoriteBorder, Favorite } from '@mui/icons-material';
import { getFakeDiscount, getFakeOriginalPrice } from '../../utils/constants';

export interface ProductCardProps {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    price: number;
    originalPrice?: number;
    rating?: number;
    reviewCount?: number;
    badges?: ReadonlyArray<'bestseller' | 'new' | 'sale' | 'out_of_stock'>;
    discountPercent?: number;
    isLoading?: boolean;
    onAddToCart?: (id: string) => void;
    onQuickView?: (id: string) => void;
    onToggleWishlist?: (id: string, isAdded: boolean) => void;
    sold?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
    id, title, author, coverImage, price, originalPrice, 
    badges = [], discountPercent, sold = 0,
    isLoading = false, onAddToCart, onToggleWishlist
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [imgError, setImgError] = useState(false);

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsWishlisted(!isWishlisted);
        if (onToggleWishlist) onToggleWishlist(id, !isWishlisted);
    };

    const handleCardClick = () => {
        navigate(`/product/${id}`);
    };

    if (isLoading) {
        return (
            <Card sx={{ width: '100%', borderRadius: '8px', boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                <Skeleton variant="rectangular" sx={{ width: '100%', paddingTop: '120%' }} />
                <CardContent sx={{ p: 1.5 }}>
                    <Skeleton variant="text" height={20} width="80%" />
                    <Skeleton variant="text" height={16} width="60%" />
                    <Skeleton variant="text" height={24} width="50%" sx={{ mt: 1 }} />
                </CardContent>
            </Card>
        );
    }

    const isOutOfStock = badges.includes('out_of_stock');
    const fallbackImage = 'https://placehold.co/300x400/f8f8f8/999?text=📚';
    const displayImage = imgError || !coverImage ? fallbackImage : coverImage;

    // --- FAKE DISCOUNT LOGIC ---
    // Generate a consistent fake discount if none exists
    let finalOriginalPrice = originalPrice;
    let finalDiscountPercent = discountPercent;

    if (!finalOriginalPrice || finalOriginalPrice <= price) {
        finalDiscountPercent = getFakeDiscount(id, sold);
        finalOriginalPrice = getFakeOriginalPrice(price, finalDiscountPercent);
    }

    return (
        <Card 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
            sx={{ 
                width: '100%', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '8px',
                border: '1px solid transparent',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                bgcolor: '#fff',
                '&:hover': {
                    borderColor: '#f0f0f0',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)',
                }
            }}
        >
            {/* Top Badges */}
            <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5, zIndex: 2 }}>
                {badges.includes('bestseller') && <Chip label="Bán chạy" size="small" sx={{ bgcolor: theme.palette.error.main, color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
                {badges.includes('new') && <Chip label="Mới" size="small" sx={{ bgcolor: theme.palette.success.main, color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
                {isOutOfStock && <Chip label="Hết hàng" size="small" sx={{ bgcolor: theme.palette.grey[600], color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
            </Box>

            {/* Wishlist Icon */}
            <IconButton 
                onClick={handleWishlistClick}
                sx={{ 
                    position: 'absolute', top: 4, right: 4, zIndex: 2, 
                    color: isWishlisted ? 'var(--color-error)' : '#ccc',
                    '&:hover': { color: 'var(--color-error)', bgcolor: 'rgba(255,255,255,0.9)' }
                }}
                size="small"
            >
                {isWishlisted ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
            </IconButton>

            {/* Image Container */}
            <Box sx={{ position: 'relative', width: '100%', paddingTop: '110%', overflow: 'hidden', bgcolor: '#f8f8f8', borderRadius: '8px 8px 0 0' }}>
                <CardMedia
                    component="img"
                    image={displayImage}
                    alt={title}
                    onError={() => setImgError(true)}
                    sx={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        objectFit: 'contain',
                        padding: '16px',
                        transition: 'transform 0.3s ease',
                        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                        opacity: isOutOfStock ? 0.6 : 1
                    }}
                />
            </Box>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* Author */}
                <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {author}
                </Typography>
                
                {/* Title */}
                <Typography 
                    sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        lineHeight: 1.4, 
                        mb: 1,
                        color: '#333',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.8em' // 2 lines
                    }}
                >
                    {title}
                </Typography>

                {/* Price Row (AlphaBooks style) */}
                <Box sx={{ mt: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    {/* Current Price */}
                    <Typography sx={{ color: '#C92127', fontWeight: 800, fontSize: '0.95rem' }}>
                        {formatPrice(price)}
                    </Typography>
                    
                    {/* Original Price & Discount */}
                    {finalOriginalPrice && finalOriginalPrice > price && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{ color: '#999', fontSize: '0.75rem', textDecoration: 'line-through' }}>
                                {formatPrice(finalOriginalPrice)}
                            </Typography>
                            {finalDiscountPercent && (
                                <Box sx={{ 
                                    bgcolor: '#1a1a2e', color: '#fff', fontSize: '0.65rem', fontWeight: 700, 
                                    px: 0.6, py: 0.2, borderRadius: '4px', lineHeight: 1.2 
                                }}>
                                    -{finalDiscountPercent}%
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </CardContent>

            {/* Hover Add to Cart Overlay */}
            <Box sx={{
                position: 'absolute', bottom: -1, right: -1,
                opacity: isHovered && !isOutOfStock ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.2s ease',
            }}>
                <IconButton 
                    onClick={(e) => { e.stopPropagation(); if(onAddToCart) onAddToCart(id); }}
                    sx={{ 
                        bgcolor: '#C92127', color: 'white',
                        borderRadius: '16px 0 8px 0',
                        width: 36, height: 36,
                        '&:hover': { bgcolor: '#A91B20' },
                        boxShadow: '-2px -2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    <ShoppingCartOutlined sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>
        </Card>
    );
};

export default ProductCard;
