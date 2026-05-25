// src/modules/customer/components/home/CategorySidebar.tsx
import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Paper, Skeleton, Typography, Divider } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCategories, DisplayCategory } from '../../hooks/useCategories';

const CategorySidebar = () => {
    const navigate = useNavigate();
    const { categories, isLoading } = useCategories();
    const [hoveredCategory, setHoveredCategory] = useState<DisplayCategory | null>(null);

    const handleCategoryClick = (categoryName: string) => {
        navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
    };

    return (
        <Box
            onMouseLeave={() => setHoveredCategory(null)}
            sx={{
                width: '100%',
                bgcolor: '#ffffff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible'
            }}
        >
            {/* Parent Categories List */}
            <Box sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
                {isLoading ? (
                    <Box sx={{ px: 2, py: 1 }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.8 }}>
                                <Skeleton variant="circular" width={22} height={22} />
                                <Skeleton variant="text" width="75%" height={20} />
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <List dense sx={{ p: 0 }}>
                        {categories.map((cat, index) => {
                            const hasChildren = cat.children && cat.children.length > 0;
                            const isHovered = hoveredCategory?.id === cat.id;
                            const isFirst = index === 0;
                            const isLast = index === categories.length - 1;

                            return (
                                <ListItemButton
                                    key={cat.id}
                                    onMouseEnter={() => setHoveredCategory(cat)}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    sx={{
                                        py: 1.5,
                                        px: 2.5,
                                        transition: 'all 0.2s ease',
                                        bgcolor: isHovered ? 'rgba(245, 166, 35, 0.06)' : 'transparent',
                                        color: isHovered ? '#f5a623' : '#1a1a2e',
                                        borderTopLeftRadius: isFirst ? '12px' : 0,
                                        borderTopRightRadius: isFirst ? '12px' : 0,
                                        borderBottomLeftRadius: isLast ? '12px' : 0,
                                        borderBottomRightRadius: isLast ? '12px' : 0,
                                        '&:hover': {
                                            bgcolor: 'rgba(245, 166, 35, 0.08)',
                                            color: '#f5a623',
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        minWidth: 32,
                                        fontSize: '1.25rem',
                                        color: isHovered ? '#f5a623' : '#8c9ba5',
                                        transition: 'color 0.2s ease'
                                    }}>
                                        {cat.icon || '📖'}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={cat.name}
                                        primaryTypographyProps={{
                                            fontSize: '0.88rem',
                                            fontWeight: 500,
                                            fontFamily: '"Inter", sans-serif'
                                        }}
                                    />
                                    {hasChildren && (
                                        <ChevronRight sx={{
                                            fontSize: 16,
                                            color: isHovered ? '#f5a623' : '#c0cacc',
                                            transform: isHovered ? 'translateX(2px)' : 'none',
                                            transition: 'all 0.2s ease'
                                        }} />
                                    )}
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </Box>

            {/* Flyout Dropdown Subcategories Popup */}
            {hoveredCategory && hoveredCategory.children && hoveredCategory.children.length > 0 && (
                <Paper
                    elevation={0}
                    onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: '100%',
                        width: '400px',
                        minHeight: '100%',
                        bgcolor: '#ffffff',
                        border: '1px solid #eef0f2',
                        borderLeft: 'none',
                        borderTopRightRadius: '12px',
                        borderBottomRightRadius: '12px',
                        boxShadow: '12px 4px 30px rgba(26,26,46,0.06)',
                        zIndex: 99,
                        p: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    {/* Header Title displaying Parent Category Name from API */}
                    <Box sx={{ px: 1.5, mb: 0.5 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 800,
                                color: '#f5a623',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontSize: '0.85rem',
                                mb: 1
                            }}
                        >
                            {hoveredCategory.name}
                        </Typography>
                        <Divider sx={{ borderColor: '#eef0f2' }} />
                    </Box>

                    {/* Subcategories Section */}
                    <Box sx={{ width: '100%' }}>
                        <List
                            dense
                            sx={{
                                p: 0,
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 0.5
                            }}
                        >
                            {hoveredCategory.children.map((sub) => (
                                <ListItemButton
                                    key={sub.id}
                                    onClick={() => handleCategoryClick(sub.name)}
                                    sx={{
                                        py: 0.8,
                                        px: 1.5,
                                        borderRadius: '6px',
                                        transition: 'all 0.15s ease',
                                        color: '#5c6a79',
                                        bgcolor: 'transparent',
                                        '&:hover': {
                                            bgcolor: 'transparent',
                                            color: '#f5a623',
                                            paddingLeft: '20px'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={sub.name}
                                        primaryTypographyProps={{
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            color: 'inherit'
                                        }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    </Box>
                </Paper>
            )}

            {/* Custom Animation Style */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-5px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </Box>
    );
};

export default CategorySidebar;
