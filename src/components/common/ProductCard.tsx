import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Card, CardMedia, CardContent, Typography, Box, 
    IconButton, Button, Skeleton, Chip, useTheme
} from '@mui/material';
import { ShoppingCartOutlined, VisibilityOutlined, Star, FavoriteBorder, Favorite } from '@mui/icons-material';

export interface ProductCardProps {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    badges?: ReadonlyArray<'bestseller' | 'new' | 'sale' | 'out_of_stock'>;
    discountPercent?: number;
    isLoading?: boolean;
    onAddToCart?: (id: string) => void;
    onQuickView?: (id: string) => void;
    onToggleWishlist?: (id: string, isAdded: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
    id, title, author, coverImage, price, originalPrice, 
    rating, reviewCount, badges = [], discountPercent, 
    isLoading = false, onAddToCart, onQuickView, onToggleWishlist
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
            <Card sx={{ width: '100%', borderRadius: '12px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                <Skeleton variant="rectangular" sx={{ width: '100%', paddingTop: '150%' }} />
                <CardContent>
                    <Skeleton variant="text" height={24} width="80%" />
                    <Skeleton variant="text" height={20} width="60%" />
                    <Skeleton variant="text" height={24} width="40%" sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    const isOutOfStock = badges.includes('out_of_stock');
    const fallbackImage = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80';
    const displayImage = imgError || !coverImage ? fallbackImage : coverImage;

    return (
        <Card 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
            sx={{ 
                width: '100%', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer',
                borderRadius: '12px',
                border: '1px solid transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-4px)',
                }
            }}
        >
            {/* Badges */}
            <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 1, zIndex: 2 }}>
                {badges.includes('bestseller') && <Chip label="Bán chạy" size="small" sx={{ bgcolor: theme.palette.error.main, color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />}
                {badges.includes('new') && <Chip label="Mới" size="small" sx={{ bgcolor: theme.palette.success.main, color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />}
                {badges.includes('sale') && discountPercent && <Chip label={`-${discountPercent}%`} size="small" sx={{ bgcolor: theme.palette.warning.main, color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />}
                {isOutOfStock && <Chip label="Hết hàng" size="small" sx={{ bgcolor: theme.palette.grey[600], color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />}
            </Box>

            {/* Wishlist Icon */}
            <IconButton 
                onClick={handleWishlistClick}
                sx={{ 
                    position: 'absolute', top: 8, right: 8, zIndex: 2, 
                    bgcolor: 'rgba(255,255,255,0.85)',
                    '&:hover': { bgcolor: 'white' }
                }}
                size="small"
            >
                {isWishlisted ? <Favorite color="error" fontSize="small" /> : <FavoriteBorder fontSize="small" color="action" />}
            </IconButton>

            {/* Image Container (2:3 aspect ratio) */}
            <Box sx={{ position: 'relative', width: '100%', paddingTop: '150%', overflow: 'hidden', bgcolor: '#ffffff' }}>
                <CardMedia
                    component="img"
                    image={displayImage}
                    alt={title}
                    onError={() => setImgError(true)}
                    sx={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        objectFit: 'contain', // Đảm bảo bìa sách không bị xén
                        padding: '12px',      // Khoảng thở để bìa sách trọn vẹn
                        transition: 'transform 0.4s ease',
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        opacity: isOutOfStock ? 0.5 : 1
                    }}
                />
                
                {/* Quick View Overlay */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 0, left: 0, width: '100%',
                    bgcolor: 'rgba(255,255,255,0.95)',
                    transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 0.3s ease',
                    display: 'flex', justifyContent: 'center', p: 1, zIndex: 2
                }}>
                    <Button 
                        startIcon={<VisibilityOutlined />} 
                        variant="text" 
                        color="primary"
                        fullWidth
                        onClick={(e) => { e.stopPropagation(); if(onQuickView) onQuickView(id); }}
                    >
                        Xem nhanh
                    </Button>
                </Box>
            </Box>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                    {author}
                </Typography>
                
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontSize: '1rem', 
                        lineHeight: 1.3, 
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        height: '2.6em' // Fixed height for 2 lines
                    }}
                >
                    {title}
                </Typography>

                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 0.5 }}>
                    <Star sx={{ color: theme.palette.secondary.main, fontSize: '1rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{rating.toFixed(1)}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>({reviewCount})</Typography>
                </Box>

                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '48px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
                            {formatPrice(price)}
                        </Typography>
                        {originalPrice && originalPrice > price ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.8rem', mt: 0.5, lineHeight: 1 }}>
                                {formatPrice(originalPrice)}
                            </Typography>
                        ) : (
                            <Typography variant="body2" sx={{ visibility: 'hidden', fontSize: '0.8rem', mt: 0.5, lineHeight: 1 }}>
                                0
                            </Typography>
                        )}
                    </Box>
                    <IconButton 
                        color="primary" 
                        sx={{ 
                            bgcolor: theme.palette.primary.main, 
                            color: 'white',
                            '&:hover': { bgcolor: theme.palette.primary.light },
                            '&.Mui-disabled': { bgcolor: theme.palette.action.disabledBackground }
                        }}
                        size="small"
                        disabled={isOutOfStock}
                        onClick={(e) => { e.stopPropagation(); if(onAddToCart) onAddToCart(id); }}
                    >
                        <ShoppingCartOutlined fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ProductCard;
