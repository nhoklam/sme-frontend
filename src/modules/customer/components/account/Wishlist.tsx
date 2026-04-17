import React from 'react';
import { Box, Typography, Grid, Button, Paper } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import ProductCard from '../products/ProductCard';

const mockWishlist = [
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
];

const Wishlist = () => {
    if (mockWishlist.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Favorite sx={{ fontSize: 48, color: '#e2e8f0', mb: 2 }} />
                <Typography color="text.secondary">Chưa có sản phẩm yêu thích</Typography>
            </Paper>
        );
    }

    return (
        <Grid container spacing={3}>
            {mockWishlist.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <ProductCard product={product} />
                </Grid>
            ))}
        </Grid>
    );
};

export default Wishlist;