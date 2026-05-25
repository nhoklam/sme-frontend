import React from 'react';
import { Box, Container, Skeleton } from '@mui/material';

import HeroBanner from '../components/home/HeroBanner';
import CategorySidebar from '../components/home/CategorySidebar';
import FlashSale from '../components/home/FlashSale';
import Authors from '../components/home/Authors';
import CategoryProductBlock from '../components/home/CategoryProductBlock';
import BlogArticles from '../components/home/BlogArticles';
import { useCategories } from '../hooks/useCategories';

const HomePage = () => {
    const { categories, isLoading: categoriesLoading } = useCategories();

    return (
        <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh', pb: 8, pt: 2 }}>
            <Container maxWidth="lg">
                {/* 1. Hero Banner with static Category Sidebar */}
                <Box sx={{ display: 'flex', gap: 3, mb: 5, alignItems: 'stretch' }}>
                    {/* Left Sidebar (visible on desktop) */}
                    <Box sx={{
                        display: { xs: 'none', md: 'block' },
                        width: 240,
                        minWidth: 240,
                        bgcolor: '#ffffff',
                        border: '1px solid #eef0f2',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(26,26,46,0.03)',
                        overflow: 'visible'
                    }}>
                        <CategorySidebar />
                    </Box>
                    {/* Right Slider */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <HeroBanner />
                    </Box>
                </Box>

                {/* 2. Top Sách Bán Chạy */}
                <FlashSale />

                {/* 3. Từng Danh Mục Cha → Danh Mục Con */}
                {categoriesLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                        <Box key={idx} sx={{ mb: 5 }}>
                            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: '8px 8px 0 0' }} />
                            <Skeleton variant="rectangular" height={350} sx={{ borderRadius: '0 0 8px 8px' }} />
                        </Box>
                    ))
                ) : (
                    categories
                        .filter(cat => cat.children.length > 0)
                        .map(parentCat => (
                            <CategoryProductBlock key={parentCat.id} parentCategory={parentCat} />
                        ))
                )}

                {/* 4. Bài Viết & Review Sách */}
                <BlogArticles />

                {/* 5. Tác Giả Nổi Bật */}
                <Authors />
            </Container>
        </Box>
    );
};

export default HomePage;