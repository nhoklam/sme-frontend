import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Tabs, Tab, Skeleton, Button } from '@mui/material';
import { ArrowForwardIos } from '@mui/icons-material';
import ProductCard from '../../../../components/common/ProductCard';
import { useCartContext } from '../../../../store/CartContext';
import { useProducts } from '../../hooks/useProducts';
import { DisplayCategory } from '../../hooks/useCategories';

interface CategoryProductBlockProps {
    parentCategory: DisplayCategory;
}

/**
 * Hiển thị 1 khối sản phẩm cho 1 danh mục cha.
 * - Header: Tên danh mục cha (nền navy) + Các tab danh mục con
 * - Body: Grid sản phẩm thuộc danh mục con đang chọn
 * - Tab "Tất cả" = Không lọc categoryId → hiển thị tất cả sản phẩm con
 */
const CategoryProductBlock: React.FC<CategoryProductBlockProps> = ({ parentCategory }) => {
    const navigate = useNavigate();
    const { addToCart, openCart } = useCartContext();
    // -1 = mặc định: hiển thị tất cả sản phẩm trong danh mục cha (bao gồm tất cả con)
    // 0+ = chọn danh mục con cụ thể
    const [activeTab, setActiveTab] = useState<number | false>(false);

    const childTabs = parentCategory.children;

    // Mặc định (false) → truyền parentCategory.id để hiển thị tất cả sản phẩm con
    // Khi chọn tab cụ thể → truyền id danh mục con đó
    const activeCategoryId = activeTab === false ? parentCategory.id : childTabs[activeTab]?.id;
    const activeTabName = activeTab === false ? parentCategory.name : childTabs[activeTab]?.name;

    const { products, isLoading } = useProducts({
        categoryId: activeCategoryId || undefined,
        size: 8,
    });

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        // Nếu click lại tab đang chọn → bỏ chọn, quay về hiển thị tất cả
        if (newValue === activeTab) {
            setActiveTab(false);
        } else {
            setActiveTab(newValue);
        }
    };

    return (
        <Box sx={{ mb: 4 }}>
            {/* Header: Tên danh mục cha + Tab danh mục con */}
            <Box sx={{
                display: 'flex',
                alignItems: 'stretch',
                bgcolor: '#fff',
                borderBottom: '3px solid #1a1a2e',
                borderRadius: '8px 8px 0 0',
                overflow: 'hidden',
            }}>
                {/* Tên danh mục cha – nền navy */}
                <Box sx={{
                    bgcolor: '#1a1a2e',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: { xs: '0.8rem', md: '0.9rem' },
                    px: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    minHeight: 44,
                    flexShrink: 0,
                    borderRadius: '8px 0 0 0',
                    gap: 1,
                }}>
                    <Typography component="span" sx={{ fontSize: '1.1rem' }}>{parentCategory.icon}</Typography>
                    {parentCategory.name}
                </Box>

                {/* Tab danh mục con */}
                {childTabs.length > 0 && (
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        TabIndicatorProps={{ style: { display: 'none' } }}
                        sx={{
                            minHeight: 44,
                            flex: 1,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                minHeight: 44,
                                color: '#555',
                                borderLeft: '1px solid #f0f0f0',
                                transition: 'all 0.2s ease',
                                px: 2,
                                '&:hover': {
                                    color: '#1a1a2e',
                                    bgcolor: '#f8f8f8'
                                }
                            },
                            '& .Mui-selected': {
                                color: '#1a1a2e !important',
                                fontWeight: 700,
                                bgcolor: '#EEF2FF',
                            }
                        }}
                    >
                        {childTabs.map((tab) => (
                            <Tab key={tab.id} label={tab.name} />
                        ))}
                    </Tabs>
                )}

                {/* Nút xem tất cả */}
                <Box sx={{
                    display: { xs: 'none', sm: 'flex' }, alignItems: 'center', px: 1.5, flexShrink: 0,
                    borderLeft: '1px solid #f0f0f0',
                }}>
                    <Button
                        endIcon={<ArrowForwardIos sx={{ fontSize: '10px !important' }} />}
                        onClick={() => navigate(`/shop?category=${parentCategory.id}`)}
                        sx={{
                            color: '#1a1a2e', fontWeight: 600, textTransform: 'none',
                            fontSize: '0.78rem', whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#f8f8f8' }
                        }}
                    >
                        Xem tất cả
                    </Button>
                </Box>
            </Box>

            {/* Nội dung: Grid sản phẩm */}
            <Box sx={{
                bgcolor: '#fff',
                p: { xs: 1.5, sm: 2 },
                borderRadius: '0 0 8px 8px',
                border: '1px solid #e8e8e8',
                borderTop: 'none',
            }}>
                <Grid container spacing={2}>
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, idx) => (
                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={idx} sx={{ display: 'flex' }}>
                                <Box sx={{ width: '100%' }}>
                                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                                    <Skeleton width="80%" sx={{ mt: 1 }} />
                                    <Skeleton width="50%" />
                                </Box>
                            </Grid>
                        ))
                    ) : products.length === 0 ? (
                        <Box sx={{ width: '100%', py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                Chưa có sản phẩm nào trong danh mục này.
                            </Typography>
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
                                    onAddToCart={() => {
                                        addToCart({
                                            ...product,
                                            oldPrice: product.price * 1.2,
                                            images: [product.img],
                                            stock: 50,
                                            category: activeTabName,
                                            categoryId: activeCategoryId,
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

export default CategoryProductBlock;
