// src/components/layout/CategoryDropdown.tsx
import React, { useState } from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Paper, Divider, Button } from '@mui/material';
import { ChevronRight, Menu, MenuBook } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCategories, DisplayCategory } from '../../modules/customer/hooks/useCategories';

const HOME_ITEM: DisplayCategory = {
    id: 'home',
    name: 'Trang chủ',
    icon: '🏠',
    color: '#ffffff',
    slug: 'trang-chu',
    children: []
};

const CategoryDropdown: React.FC = () => {
    const navigate = useNavigate();
    const { categories, isLoading } = useCategories();
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<DisplayCategory | null>(null);

    const handleCategoryClick = (cat: DisplayCategory) => {
        if (cat.id === 'home') {
            navigate('/');
        } else {
            navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
        }
        setIsOpen(false);
        setHoveredCategory(null);
    };

    // Prepend Trang chủ to list of categories
    const allCategories = React.useMemo(() => {
        return [HOME_ITEM, ...categories];
    }, [categories]);

    return (
        <Box
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => {
                setIsOpen(false);
                setHoveredCategory(null);
            }}
            sx={{ position: 'relative', display: 'flex', alignItems: 'stretch', height: '100%' }}
        >
            {/* Trigger Button: ☰ DANH MỤC SÁCH */}
            <Button
                startIcon={<Menu sx={{ color: isOpen ? '#1a1a2e' : '#ffffff' }} />}
                sx={{
                    bgcolor: isOpen ? '#f5a623' : 'transparent',
                    color: isOpen ? '#1a1a2e' : '#ffffff',
                    px: 3.5,
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 0,
                    fontSize: '13px',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease',
                    height: '100%',
                    '&:hover': {
                        bgcolor: '#f5a623',
                        color: '#1a1a2e',
                    }
                }}
            >
                DANH MỤC SÁCH
            </Button>

            {/* Dropdown Sidebar Menu Container */}
            {isOpen && (
                <Paper
                    elevation={0}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '240px',
                        bgcolor: '#ffffff',
                        border: '1px solid rgba(26,26,46,0.08)',
                        borderTop: '3px solid #f5a623',
                        borderRadius: '0 0 8px 8px',
                        boxShadow: '0 10px 40px rgba(26, 26, 46, 0.12)',
                        zIndex: 9999,
                        py: 0.5,
                        animation: 'dropdownFadeIn 0.15s ease-out',
                        overflow: 'visible'
                    }}
                >
                    {isLoading ? (
                        <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Đang tải...</Typography>
                        </Box>
                    ) : (
                        <List dense sx={{ p: 0 }}>
                            {allCategories.map((cat) => {
                                const hasChildren = cat.children && cat.children.length > 0;
                                const isHovered = hoveredCategory?.id === cat.id;

                                return (
                                    <ListItemButton
                                        key={cat.id}
                                        onMouseEnter={() => setHoveredCategory(cat.id === 'home' ? null : cat)}
                                        onClick={() => handleCategoryClick(cat)}
                                        sx={{
                                            py: 1.3,
                                            px: 2,
                                            transition: 'all 0.2s ease',
                                            bgcolor: isHovered ? 'rgba(245, 166, 35, 0.06)' : 'transparent',
                                            color: isHovered ? '#f5a623' : '#1a1a2e',
                                            borderLeft: isHovered ? '4px solid #f5a623' : '4px solid transparent',
                                            paddingLeft: isHovered ? '16px' : '20px',
                                            '&:hover': {
                                                bgcolor: 'rgba(245, 166, 35, 0.08)',
                                                color: '#f5a623',
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{
                                            minWidth: 28,
                                            fontSize: '1.2rem',
                                            color: isHovered ? '#f5a623' : '#1a1a2e',
                                            transition: 'color 0.2s ease'
                                        }}>
                                            {cat.icon || '📖'}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={cat.name}
                                            primaryTypographyProps={{
                                                sx: {
                                                    fontSize: '0.85rem',
                                                    fontWeight: isHovered ? 800 : 600,
                                                    fontFamily: '"Inter", sans-serif',
                                                    transition: 'all 0.2s ease'
                                                }
                                            }}
                                        />
                                        {hasChildren && (
                                            <ChevronRight sx={{
                                                fontSize: 15,
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

                    {/* Nested Subcategories Flyout */}
                    {hoveredCategory && hoveredCategory.children && hoveredCategory.children.length > 0 && (
                        <Paper
                            elevation={0}
                            onMouseEnter={() => setIsOpen(true)}
                            sx={{
                                position: 'absolute',
                                top: -3, // Bù đắp viền trên 3px của cha
                                left: '100%',
                                width: '240px',
                                minHeight: 'calc(100% + 3px)',
                                bgcolor: '#ffffff',
                                border: '1px solid rgba(26,26,46,0.08)',
                                borderTop: '3px solid #f5a623',
                                borderLeft: 'none',
                                borderRadius: '0 8px 8px 0',
                                boxShadow: '12px 10px 40px rgba(26, 26, 46, 0.12)',
                                zIndex: 10000,
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                                animation: 'flyoutFadeIn 0.15s ease-out'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <MenuBook sx={{ fontSize: 14, color: '#f5a623' }} />
                                <Typography variant="caption" sx={{ fontWeight: 850, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.72rem' }}>
                                    {hoveredCategory.name}
                                </Typography>
                            </Box>
                            <Divider sx={{ borderColor: '#eef0f2' }} />
                            <List dense sx={{ p: 0 }}>
                                {hoveredCategory.children.map((sub) => (
                                    <ListItemButton
                                        key={sub.id}
                                        onClick={() => handleCategoryClick(sub)}
                                        sx={{
                                            py: 0.8,
                                            px: 1.5,
                                            borderRadius: '4px',
                                            transition: 'all 0.2s ease',
                                            color: '#1a1a2e',
                                            '&:hover': {
                                                bgcolor: 'rgba(245, 166, 35, 0.05)',
                                                color: '#f5a623',
                                                paddingLeft: '16px'
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={sub.name}
                                            primaryTypographyProps={{
                                                fontSize: '0.82rem',
                                                fontWeight: 600,
                                                fontFamily: '"Inter", sans-serif'
                                            }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Paper>
            )}

            {/* Animation style */}
            <style>{`
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes flyoutFadeIn {
                    from { opacity: 0; transform: translateX(-5px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </Box>
    );
};

export default CategoryDropdown;
