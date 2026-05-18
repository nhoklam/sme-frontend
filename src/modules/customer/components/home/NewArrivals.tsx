import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Button } from '@mui/material';
import ProductCard from '../../../../components/common/ProductCard';
import { useCartContext } from '../../../../store/CartContext';

const MOCK_NEW_PRODUCTS = [
    {
        id: 'n1', title: 'Muôn Kiếp Nhân Sinh (Tập 3)', author: 'Nguyên Phong',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
        price: 168000, rating: 4.9, reviewCount: 56, badges: ['new'] as const
    },
    {
        id: 'n2', title: 'Atomic Habits - Thay Đổi Tí Hon', author: 'James Clear',
        coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop',
        price: 135000, rating: 4.8, reviewCount: 112, badges: ['new'] as const
    },
    {
        id: 'n3', title: 'Cha Giàu Cha Nghèo (Tái bản 2026)', author: 'Robert Kiyosaki',
        coverImage: 'https://images.unsplash.com/photo-1587876931567-564ce588bfbd?q=80&w=600&auto=format&fit=crop',
        price: 120000, originalPrice: 150000, rating: 4.7, reviewCount: 89, badges: ['new', 'sale'] as const, discountPercent: 20
    },
    {
        id: 'n4', title: 'Tư Duy Nhanh Và Chậm', author: 'Daniel Kahneman',
        coverImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
        price: 185000, rating: 4.9, reviewCount: 230, badges: ['new'] as const
    }
];

const NewArrivals = () => {
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();

    return (
        <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, borderBottom: '1px solid var(--color-border)', pb: 2 }}>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    Sách Mới Nhất
                </Typography>
                <Button sx={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Xem tất cả</Button>
            </Box>

            <Grid container spacing={3}>
                {MOCK_NEW_PRODUCTS.map((product) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={product.id} sx={{ display: 'flex' }}>
                        <ProductCard 
                            {...product} 
                            onAddToCart={() => {
                                addToCart({
                                    id: product.id,
                                    title: product.title,
                                    author: product.author,
                                    price: product.price,
                                    oldPrice: product.originalPrice || 0,
                                    img: product.coverImage,
                                    images: [product.coverImage],
                                    stock: 50,
                                    category: 'Sách mới',
                                    categoryId: 'new_arrivals'
                                });
                                openCart();
                            }}
                            onQuickView={(id) => navigate(`/product/${id}`)}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default NewArrivals;
