import React from 'react';
import { Box, Typography, Grid, Button, Paper, IconButton, Tooltip } from '@mui/material';
import { Favorite, Delete, DeleteSweep } from '@mui/icons-material';
import ProductCard from '../products/ProductCard';
import { useWishlist } from '../../hooks/useWishlist';

const Wishlist: React.FC = () => {
    const { items, removeFromWishlist, clearWishlist } = useWishlist();

    if (items.length === 0) {
        return (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                <Favorite sx={{ fontSize: 56, color: '#e0e0e0', mb: 1.5 }} />
                <Typography fontWeight={600} mb={0.5}>Chưa có sản phẩm yêu thích</Typography>
                <Typography variant="body2" color="text.secondary">
                    Hãy thêm sản phẩm vào danh sách yêu thích để xem lại sau
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                    Sản phẩm yêu thích ({items.length})
                </Typography>
                <Button
                    size="small" color="error" startIcon={<DeleteSweep />}
                    onClick={clearWishlist}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Xóa tất cả
                </Button>
            </Box>
            <Grid container spacing={2}>
                {items.map(item => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
                        <Box sx={{ position: 'relative' }}>
                            <ProductCard product={{
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                originalPrice: item.originalPrice,
                                imageUrl: item.imageUrl,
                                author: item.author,
                                rating: item.rating,
                                sold: item.sold,
                            }} />
                            <Tooltip title="Xóa khỏi yêu thích">
                                <IconButton
                                    size="small"
                                    onClick={() => removeFromWishlist(item.id)}
                                    sx={{
                                        position: 'absolute', top: 6, right: 6,
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        color: '#d32f2f',
                                        '&:hover': { bgcolor: '#ffebee' },
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                        width: 28, height: 28,
                                    }}
                                >
                                    <Delete sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Wishlist;