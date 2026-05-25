import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Tabs, Tab, Skeleton } from '@mui/material';
import ProductCard from '../../../../components/common/ProductCard';
import { useCartContext } from '../../../../store/CartContext';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';

const FeaturedProducts = () => {
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();
    const [activeTab, setActiveTab] = useState(0);

    const { categories, isLoading: categoriesLoading } = useCategories();
    // Tab 0 is 'Tất cả'
    const tabs = [{ id: '', name: 'Tất cả' }, ...(categories || [])].slice(0, 5); // take max 5 tabs

    const activeCategoryId = tabs[activeTab]?.id;

    const { products, isLoading: productsLoading } = useProducts({
        categoryId: activeCategoryId || undefined,
        size: 8, // fetch up to 8 products for the section
    });

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ mb: 5 }}>
            {/* Header Tabs Block */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                alignItems: { xs: 'stretch', md: 'center' },
                bgcolor: '#fff',
                borderBottom: '2px solid #C92127', // Đáy màu đỏ làm bệ đỡ
                mb: 3
            }}>
                {categoriesLoading ? (
                    <Skeleton width={300} height={48} />
                ) : (
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        TabIndicatorProps={{ style: { display: 'none' } }} // Ẩn indicator mặc định
                        sx={{ 
                            minHeight: 48,
                            '& .MuiTab-root': { 
                                textTransform: 'uppercase', 
                                fontWeight: 700, 
                                fontSize: '0.9rem', 
                                minWidth: 120,
                                minHeight: 48,
                                color: '#333',
                                borderRight: '1px solid #eee',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: '#C92127',
                                    bgcolor: '#fdfdfd'
                                }
                            },
                            '& .Mui-selected': { 
                                color: '#fff !important', 
                                bgcolor: '#C92127',
                                borderRight: 'none',
                                '&:hover': {
                                    bgcolor: '#A91B20',
                                    color: '#fff !important',
                                }
                            }
                        }}
                    >
                        {tabs.map((tab, idx) => (
                            <Tab key={tab.id || 'all'} label={tab.name} />
                        ))}
                    </Tabs>
                )}
            </Box>

            {/* Product Grid */}
            <Box sx={{ bgcolor: '#fff', p: { xs: 1, sm: 2 }, borderRadius: '8px' }}>
                <Grid container spacing={2}>
                    {productsLoading ? (
                        Array.from({ length: 8 }).map((_, idx) => (
                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={idx} sx={{ display: 'flex' }}>
                                <Box sx={{ width: '100%' }}>
                                    <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
                                    <Skeleton width="80%" sx={{ mt: 1 }} />
                                    <Skeleton width="40%" />
                                </Box>
                            </Grid>
                        ))
                    ) : products.length === 0 ? (
                        <Box sx={{ width: '100%', py: 8, textAlign: 'center' }}>
                            <Typography color="text.secondary">Không có sản phẩm nào trong danh mục này.</Typography>
                        </Box>
                    ) : (
                        products.map((product) => (
                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={product.id} sx={{ display: 'flex' }}>
                                <ProductCard 
                                    id={product.id}
                                    title={product.title}
                                    author={product.author}
                                    coverImage={product.img}
                                    price={product.price}
                                    originalPrice={product.price * 1.2}
                                    discountPercent={20}
                                    badges={Math.random() > 0.8 ? ['bestseller'] : []}
                                    onAddToCart={() => {
                                        addToCart({
                                            ...product,
                                            oldPrice: product.price * 1.2,
                                            images: [product.img],
                                            stock: 50,
                                            category: tabs[activeTab]?.name,
                                            categoryId: 'featured',
                                            qty: 1
                                        });
                                        openCart();
                                    }}
                                    onQuickView={(id) => navigate(`/product/${id}`)}
                                />
                            </Grid>
                        ))
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

export default FeaturedProducts;