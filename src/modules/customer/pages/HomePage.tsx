import React from 'react';
import { Box, Container } from '@mui/material';

import HeroBanner from '../components/home/HeroBanner';
import ServicesBar from '../components/home/ServicesBar';
import CategorySlider from '../components/home/CategorySlider';
import FeaturedProducts from '../components/home/FeaturedProducts';
import PromotionBanner from '../components/home/PromotionBanner';

const HomePage = () => (
    <Box sx={{ bgcolor: '#f4f4f4', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>

            {/* Hero Banner */}
            <HeroBanner />

            {/* Services strip */}
            <ServicesBar />

            {/* Category chips */}
            <Box sx={{
                bgcolor: '#fff',
                borderRadius: 1.5,
                border: '1px solid #ececec',
                px: 2,
                py: 1.75,
                mb: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <CategorySlider />
            </Box>

            {/* Products sections */}
            <FeaturedProducts />

            {/* Promotion */}
            <PromotionBanner />

        </Container>
    </Box>
);

export default HomePage;