import React, { useState } from 'react';
import {
    Dialog, DialogContent, IconButton, Typography, Box,
    Grid, Button, Rating, Divider, useTheme
} from '@mui/material';
import { Close, ShoppingCartOutlined, FavoriteBorder, Favorite } from '@mui/icons-material';

export interface QuickViewModalProps {
    open: boolean;
    onClose: () => void;
    product: any;
    onAddToCart: (id: string, quantity: number) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ open, onClose, product, onAddToCart }) => {
    const theme = useTheme();
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);

    if (!product) return null;

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const handleAddToCart = () => {
        onAddToCart(product.id, quantity);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
        >
            <IconButton
                onClick={onClose}
                sx={{ position: 'absolute', right: 16, top: 16, zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
            >
                <Close />
            </IconButton>

            <DialogContent sx={{ p: 0 }}>
                <Grid container>
                    {/* Image Section */}
                    <Grid size={{ xs: 12, md: 5 }} sx={{ bgcolor: '#f5f5f5', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Box
                            component="img"
                            src={product.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80'}
                            alt={product.title || product.name}
                            sx={{ width: '100%', maxWidth: 300, objectFit: 'cover', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                        />
                    </Grid>

                    {/* Details Section */}
                    <Grid size={{ xs: 12, md: 7 }} sx={{ p: 5 }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-secondary)', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {product.category || 'Sách'}
                        </Typography>
                        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: 'var(--color-primary)', mb: 1 }}>
                            {product.title || product.name}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                            Tác giả: <strong style={{ color: 'var(--text-primary)' }}>{product.author || 'Đang cập nhật'}</strong>
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Rating value={product.rating || 4.5} precision={0.5} readOnly size="small" sx={{ color: 'var(--color-secondary)' }} />
                            <Typography variant="body2" color="text.secondary">({product.reviewCount || 120} đánh giá)</Typography>
                        </Box>

                        <Typography variant="h4" sx={{ color: 'var(--color-primary)', fontWeight: 800, mb: 3 }}>
                            {formatPrice(product.price || 0)}
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        {/* Description Preview */}
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                            {product.description || 'Một tựa sách tuyệt vời mang đến cho bạn những trải nghiệm thú vị. Tác phẩm đã được hàng triệu độc giả đón nhận và để lại ấn tượng sâu sắc. Bạn không nên bỏ lỡ cơ hội khám phá những trang sách chứa đựng tri thức và cảm xúc.'}
                        </Typography>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
                            {/* Quantity Selector */}
                            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                                <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} sx={{ minWidth: 40, p: 0, color: 'text.primary' }}>-</Button>
                                <Typography sx={{ width: 40, textAlign: 'center', fontWeight: 600 }}>{quantity}</Typography>
                                <Button onClick={() => setQuantity(quantity + 1)} sx={{ minWidth: 40, p: 0, color: 'text.primary' }}>+</Button>
                            </Box>

                            <Button
                                variant="contained"
                                color="secondary"
                                fullWidth
                                startIcon={<ShoppingCartOutlined />}
                                onClick={handleAddToCart}
                                sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '1rem' }}
                            >
                                Thêm vào giỏ
                            </Button>

                            <IconButton
                                onClick={() => setIsWishlisted(!isWishlisted)}
                                sx={{ border: '1px solid var(--color-border)', borderRadius: '8px', color: isWishlisted ? 'var(--color-error)' : 'text.primary' }}
                            >
                                {isWishlisted ? <Favorite /> : <FavoriteBorder />}
                            </IconButton>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default QuickViewModal;
