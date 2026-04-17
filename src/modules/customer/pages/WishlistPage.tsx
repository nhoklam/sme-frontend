import React from 'react';
import { Box, Typography, Grid, Button, Paper } from '@mui/material';
import { Favorite, Delete } from '@mui/icons-material';
import ProductCard from '../components/products/ProductCard';

const WishlistPage = () => {
    // Mock data - sau này thay bằng API
    const wishlistItems = [
        {
            id: 1,
            name: 'Tuyển Tập Truyện Cổ Tích Việt Nam',
            author: 'Nhiều tác giả',
            price: 100000,
            originalPrice: 125000,
            image: 'https://via.placeholder.com/200x250?text=Book+1',
            rating: 4.5,
            sold: 1250,
        },
        {
            id: 2,
            name: '101 Từ Đầu Tiên Cho Bé - Động Vật',
            author: 'Minh Long',
            price: 48000,
            originalPrice: 60000,
            image: 'https://via.placeholder.com/200x250?text=Book+2',
            rating: 4.8,
            sold: 890,
        },
    ];

    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Sản phẩm yêu thích
            </Typography>

            {wishlistItems.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Favorite sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Chưa có sản phẩm yêu thích
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Hãy thêm sản phẩm vào danh sách yêu thích của bạn
                    </Typography>
                    <Button
                        variant="contained"
                        href="/shop"
                        sx={{
                            backgroundColor: '#006994',
                            '&:hover': { backgroundColor: '#005f73' },
                        }}
                    >
                        Mua sắm ngay
                    </Button>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {wishlistItems.map((product) => (
                            <Grid item xs={12} sm={6} md={3} key={product.id}>
                                <ProductCard product={product} />
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Delete />}
                            sx={{ borderColor: '#dc2626', color: '#dc2626' }}
                        >
                            Xóa tất cả
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default WishlistPage;