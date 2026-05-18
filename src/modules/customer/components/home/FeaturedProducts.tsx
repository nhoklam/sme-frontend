import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Tabs, Tab } from '@mui/material';
import ProductCard from '../../../../components/common/ProductCard';
import { useCartContext } from '../../../../store/CartContext';

// MOCK DATA for Featured Products
const MOCK_PRODUCTS = [
    {
        id: '1',
        title: 'Đắc Nhân Tâm (Khổ Lớn)',
        author: 'Dale Carnegie',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
        price: 86000,
        originalPrice: 108000,
        rating: 4.8,
        reviewCount: 342,
        badges: ['bestseller', 'sale'] as const,
        discountPercent: 20,
        category: 'Kỹ năng sống'
    },
    {
        id: '2',
        title: 'Nhà Giả Kim',
        author: 'Paulo Coelho',
        coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop',
        price: 79000,
        rating: 4.9,
        reviewCount: 1250,
        badges: ['bestseller'] as const,
        category: 'Văn học'
    },
    {
        id: '3',
        title: 'Tâm Lý Học Tội Phạm',
        author: 'Stanton E. Samenow',
        coverImage: 'https://images.unsplash.com/photo-1587876931567-564ce588bfbd?q=80&w=600&auto=format&fit=crop',
        price: 135000,
        originalPrice: 150000,
        rating: 4.5,
        reviewCount: 89,
        badges: ['new'] as const,
        category: 'Tâm lý học'
    },
    {
        id: '4',
        title: 'Dạy Con Làm Giàu (Tập 1)',
        author: 'Robert T. Kiyosaki',
        coverImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
        price: 95000,
        rating: 4.7,
        reviewCount: 456,
        badges: [] as const,
        category: 'Kinh tế'
    },
    {
        id: '5',
        title: 'Nghệ Thuật Tinh Tế Của Việc Đếch Quan Tâm',
        author: 'Mark Manson',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop',
        price: 85000,
        originalPrice: 100000,
        rating: 4.6,
        reviewCount: 210,
        badges: ['sale'] as const,
        discountPercent: 15,
        category: 'Kỹ năng sống'
    },
    {
        id: '6',
        title: 'Súng, Vi Trùng Và Thép',
        author: 'Jared Diamond',
        coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop',
        price: 180000,
        rating: 4.9,
        reviewCount: 520,
        badges: [] as const,
        category: 'Lịch sử & Địa lý'
    },
    {
        id: '7',
        title: 'Sapiens: Lược Sử Loài Người',
        author: 'Yuval Noah Harari',
        coverImage: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=600&auto=format&fit=crop',
        price: 195000,
        rating: 4.8,
        reviewCount: 630,
        badges: ['bestseller'] as const,
        category: 'Lịch sử & Địa lý'
    },
    {
        id: '8',
        title: 'Hai Số Phận',
        author: 'Jeffrey Archer',
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
        price: 120000,
        rating: 4.7,
        reviewCount: 150,
        badges: ['out_of_stock'] as const,
        category: 'Văn học'
    }
];

const TABS = ['Tất cả', 'Văn học', 'Kinh tế', 'Kỹ năng sống'];

const FeaturedProducts = () => {
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const filteredProducts = activeTab === 0 
        ? MOCK_PRODUCTS 
        : MOCK_PRODUCTS.filter(p => p.category === TABS[activeTab]);

    return (
        <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, borderBottom: '1px solid var(--color-border)' }}>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: { xs: 2, md: 0 } }}>
                    Sản Phẩm Bán Chạy
                </Typography>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ 
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '1rem', minWidth: 100 },
                        '& .Mui-selected': { color: 'var(--color-secondary) !important' },
                        '& .MuiTabs-indicator': { backgroundColor: 'var(--color-secondary)' }
                    }}
                >
                    {TABS.map((tab, idx) => (
                        <Tab key={idx} label={tab} />
                    ))}
                </Tabs>
            </Box>

            <Grid container spacing={3}>
                {filteredProducts.map((product) => (
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
                                    category: product.category,
                                    categoryId: 'featured'
                                });
                                openCart();
                            }}
                            onQuickView={(id) => navigate(`/product/${id}`)}
                            onToggleWishlist={(id, status) => console.log('Toggle wishlist:', id, status)}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default FeaturedProducts;