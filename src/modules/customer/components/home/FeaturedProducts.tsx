// src/modules/customer/components/home/FeaturedProducts.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Skeleton, Tabs, Tab } from '@mui/material';
import { ChevronLeft, ChevronRight, LocalFireDepartment, FiberNew } from '@mui/icons-material';
import ProductCard from '../products/ProductCard';
import { useFeaturedProducts, useNewArrivals } from '../../hooks/useProducts';

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    accentColor?: string;
    onViewAll?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    title, subtitle, icon, accentColor = '#e8401c', onViewAll,
}) => (
    <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        mb: 0,
        pb: 1.25,
        borderBottom: `3px solid ${accentColor}`,
        position: 'relative',
    }}>
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {icon && (
                    <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
                        {icon}
                    </Box>
                )}
                <Typography
                    fontWeight={800}
                    sx={{
                        fontSize: 15,
                        letterSpacing: '0.3px',
                        color: '#1a1a1a',
                        textTransform: 'uppercase',
                        fontFamily: '"Segoe UI", sans-serif',
                    }}
                >
                    {title}
                </Typography>
            </Box>
            {subtitle && (
                <Typography sx={{ fontSize: 12, color: '#888', mt: 0.25, fontFamily: '"Segoe UI", sans-serif' }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
        {onViewAll && (
            <Typography
                onClick={onViewAll}
                sx={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: accentColor,
                    cursor: 'pointer',
                    mb: 0.25,
                    fontFamily: '"Segoe UI", sans-serif',
                    '&:hover': { textDecoration: 'underline' },
                }}
            >
                Xem tất cả ›
            </Typography>
        )}
    </Box>
);

// ─── Product Card Skeleton ─────────────────────────────────────────────────────
const ProductCardSkeleton = () => (
    <Box sx={{ width: 185, flexShrink: 0 }}>
        <Skeleton variant="rectangular" width={185} height={185} sx={{ borderRadius: 1.5 }} />
        <Box sx={{ pt: 1.25, px: 0.25 }}>
            <Skeleton width="55%" height={13} sx={{ mb: 0.5 }} />
            <Skeleton width="92%" height={17} sx={{ mb: 0.25 }} />
            <Skeleton width="70%" height={17} sx={{ mb: 0.75 }} />
            <Skeleton width="45%" height={20} sx={{ mb: 0.75 }} />
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1.5 }} />
        </Box>
    </Box>
);

// ─── Horizontal Scroll Row ─────────────────────────────────────────────────────
interface HScrollProps {
    products: any[];
    isLoading: boolean;
    skeletonCount?: number;
}

const HorizontalScroll: React.FC<HScrollProps> = ({ products, isLoading, skeletonCount = 6 }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: dir === 'left' ? -620 : 620,
                behavior: 'smooth',
            });
        }
    };

    return (
        <Box sx={{ position: 'relative', mt: 1.5 }}>
            {!isLoading && products.length > 5 && (
                <>
                    <Box
                        onClick={() => scroll('left')}
                        sx={{
                            position: 'absolute', left: -14, top: '38%',
                            transform: 'translateY(-50%)',
                            zIndex: 3, width: 30, height: 30,
                            bgcolor: '#fff', borderRadius: '50%',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '1px solid #eee',
                            '&:hover': {
                                bgcolor: '#e8401c',
                                borderColor: '#e8401c',
                                '& svg': { color: '#fff' },
                            },
                            transition: 'all 0.15s',
                        }}
                    >
                        <ChevronLeft sx={{ fontSize: 18, color: '#666', transition: 'color 0.15s' }} />
                    </Box>
                    <Box
                        onClick={() => scroll('right')}
                        sx={{
                            position: 'absolute', right: -14, top: '38%',
                            transform: 'translateY(-50%)',
                            zIndex: 3, width: 30, height: 30,
                            bgcolor: '#fff', borderRadius: '50%',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '1px solid #eee',
                            '&:hover': {
                                bgcolor: '#e8401c',
                                borderColor: '#e8401c',
                                '& svg': { color: '#fff' },
                            },
                            transition: 'all 0.15s',
                        }}
                    >
                        <ChevronRight sx={{ fontSize: 18, color: '#666', transition: 'color 0.15s' }} />
                    </Box>
                </>
            )}

            <Box
                ref={scrollRef}
                sx={{
                    display: 'flex',
                    gap: '10px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    pb: 1,
                }}
            >
                {isLoading
                    ? Array.from({ length: skeletonCount }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                    : products.map(p => (
                        <Box key={p.id} sx={{ flexShrink: 0 }}>
                            <ProductCard product={p} />
                        </Box>
                    ))
                }
            </Box>
        </Box>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const FeaturedProducts: React.FC = () => {
    const navigate = useNavigate();
    const { products: featured, isLoading: loadingFeatured } = useFeaturedProducts();
    const { products: newArrivals, isLoading: loadingNew } = useNewArrivals();

    return (
        <>
            {/* ── Best Sellers ── */}
            <Box sx={{
                mb: 2,
                bgcolor: '#fff',
                borderRadius: 1.5,
                border: '1px solid #ececec',
                p: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <SectionHeader
                    title="Sách bán chạy"
                    subtitle="Được mua nhiều nhất trong tuần"
                    icon={<LocalFireDepartment sx={{ fontSize: 18 }} />}
                    accentColor="#e8401c"
                    onViewAll={() => navigate('/shop')}
                />
                <HorizontalScroll
                    products={featured}
                    isLoading={loadingFeatured}
                    skeletonCount={6}
                />
            </Box>

            {/* ── New Arrivals ── */}
            <Box sx={{
                mb: 2,
                bgcolor: '#fff',
                borderRadius: 1.5,
                border: '1px solid #ececec',
                p: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <SectionHeader
                    title="Sách mới về"
                    subtitle="Cập nhật mới nhất hôm nay"
                    icon={<FiberNew sx={{ fontSize: 20 }} />}
                    accentColor="#1565c0"
                    onViewAll={() => navigate('/shop')}
                />
                <HorizontalScroll
                    products={newArrivals.map((p: any) => ({ ...p, badge: 'Mới' }))}
                    isLoading={loadingNew}
                    skeletonCount={5}
                />
            </Box>
        </>
    );
};

export default FeaturedProducts;