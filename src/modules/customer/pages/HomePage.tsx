// src/modules/customer/pages/HomePage.jsx
import React from 'react';
import { Container } from '@mui/material';

import HeroBanner from '../components/home/HeroBanner';
import ServicesBar from '../components/home/ServicesBar';
import CategorySlider from '../components/home/CategorySlider';
import FeaturedProducts from '../components/home/FeaturedProducts';
import PromotionBanner from '../components/home/PromotionBanner';

const HomePage = () => (
    <Container maxWidth="lg" sx={{ py: 2 }}>
        <HeroBanner />
        <ServicesBar />
        <CategorySlider />
        <FeaturedProducts />
        <PromotionBanner />
    </Container>
);

export default HomePage;