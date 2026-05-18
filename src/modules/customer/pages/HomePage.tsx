import React from 'react';
import { Box, Container } from '@mui/material';

import HeroBanner from '../components/home/HeroBanner';
import CategorySlider from '../components/home/CategorySlider';
import FeaturedProducts from '../components/home/FeaturedProducts';
import FlashSale from '../components/home/FlashSale';
import NewArrivals from '../components/home/NewArrivals';
import Authors from '../components/home/Authors';
import PromotionBanner from '../components/home/PromotionBanner';

const HomePage = () => {
    return (
        <Box sx={{ bgcolor: 'var(--bg-default)', minHeight: '100vh', pb: 8, pt: 2 }}>
            <Container maxWidth="lg">
                {/* 1. Hero Banner */}
                <Box sx={{ mb: 6 }}>
                    <HeroBanner />
                </Box>

                {/* 2. Category Slider (8 prominent categories) */}
                <CategorySlider />

                {/* 3. Flash Sale */}
                <FlashSale />

                {/* 4. Featured / Best Seller Products with Tabs */}
                <FeaturedProducts />

                {/* 5. New Arrivals */}
                <NewArrivals />

                {/* 6. Promotion Banners */}
                <PromotionBanner />

                {/* 7. Featured Authors */}
                <Authors />
            </Container>
        </Box>
    );
};

export default HomePage;