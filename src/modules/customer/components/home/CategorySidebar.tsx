// src/modules/customer/components/home/CategorySidebar.tsx
import React, { useState } from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Paper, Skeleton, Divider } from '@mui/material';
import { ChevronRight, MenuBook } from '@mui/icons-material';
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
                borderRadius: '12px',
                border: '1px solid #eef0f2',
                boxShadow: '0 4px 20px rgba(26,26,46,0.03)',
                overflow: 'visible',
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Sidebar Header - Bookly Navy & Gold Accent */}
            <Box sx={{ 
                bgcolor: '#1a1a2e', 
                color: '#ffffff', 
                px: 2.5, 
                py: 2.2, 
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px',
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                borderBottom: '3px solid #f5a623'
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ 
                        fontFamily: '"Playfair Display", serif', 
                        fontWeight: 900, 
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        fontSize: '0.9rem',
                        color: '#f5a623'
                    }}>
                        Danh mục sách
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}>
                        Hành trình tri thức mới
                    </Typography>
                </Box>
            </Box>

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
                        {categories.map((cat) => {
                            const hasChildren = cat.children && cat.children.length > 0;
                            const isHovered = hoveredCategory?.id === cat.id;

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
                                            fontWeight: isHovered ? 700 : 500,
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
                        width: '260px',
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
                        gap: 2,
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    {/* Subcategories Section */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <MenuBook sx={{ fontSize: 16, color: '#f5a623' }} />
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                {hoveredCategory.name}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 1.5, borderColor: '#eef0f2' }} />
                        <List dense sx={{ p: 0 }}>
                            {hoveredCategory.children.map((sub) => (
                                <ListItemButton
                                    key={sub.id}
                                    onClick={() => handleCategoryClick(sub.name)}
                                    sx={{
                                        py: 1,
                                        px: 1.5,
                                        borderRadius: '6px',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            bgcolor: 'rgba(26, 26, 46, 0.03)',
                                            color: '#f5a623',
                                            paddingLeft: '16px'
                                        }
                                    }}
                                >
                                    <ListItemText 
                                        primary={sub.name} 
                                        primaryTypographyProps={{ 
                                            fontSize: '0.85rem', 
                                            fontWeight: 500,
                                            color: '#5c6a79'
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
