// src/modules/customer/components/Home/FeaturedProducts.jsx
import React from 'react';
import { Box, Grid, Button, Typography } from '@mui/material';
import { ArrowForwardIos } from '@mui/icons-material';
import ProductCard from '../products/ProductCard';
import { PRODUCTS } from '../../../../utils/constants';

const SectionHeader = ({ title, color = '#d32f2f' }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 4, height: 24, bgcolor: color, borderRadius: 2 }} />
            <Typography variant="h6" fontWeight={800}>{title}</Typography>
        </Box>
        <Button endIcon={<ArrowForwardIos sx={{ fontSize: 12 }} />}
            sx={{ color, textTransform: 'none', fontWeight: 600 }}>
            Xem tất cả
        </Button>
    </Box>
);

const FeaturedProducts = () => {
    const newArrivals = [...PRODUCTS].reverse().slice(0, 4);

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <SectionHeader title="Sách bán chạy 🔥" color="#d32f2f" />
                <Grid container spacing={2}>
                    {PRODUCTS.map(p => (
                        <Grid item xs={6} sm={4} md={3} key={p.id}>
                            <ProductCard product={p} />
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Box sx={{ mb: 4 }}>
                <SectionHeader title="Sách mới về 📦" color="#1565c0" />
                <Grid container spacing={2}>
                    {newArrivals.map(p => (
                        <Grid item xs={6} sm={4} md={3} key={p.id}>
                            <ProductCard product={{ ...p, badge: 'Mới' }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </>
    );
};

export default FeaturedProducts;