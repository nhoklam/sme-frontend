import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Create } from '@mui/icons-material';
import authorService from '../../../../services/authorService';

const Authors = () => {
    const navigate = useNavigate();

    const { data: authors = [], isLoading } = useQuery({
        queryKey: ['featuredAuthors'],
        queryFn: () => authorService.getFeatured(),
    });

    if (isLoading) return null; // Or return a skeleton

    if (!authors || authors.length === 0) return null;

    return (
        <Box sx={{ mb: 5 }}>
            {/* Red Header Block */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: '#1a1a2e', borderRadius: '10px 10px 0 0',
                px: 3, py: 1.5,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Create sx={{ color: '#FFD700', fontSize: 26 }} />
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1rem', md: '1.25rem' }, letterSpacing: 1 }}>
                        TÁC GIẢ NỔI BẬT
                    </Typography>
                </Box>
                <Button 
                    sx={{ 
                        color: '#fff', 
                        fontWeight: 600,
                        textTransform: 'none',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '20px',
                        px: 2, py: 0.5,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' }
                    }}
                >
                    Xem tất cả
                </Button>
            </Box>

            {/* Author List Content */}
            <Box sx={{ 
                bgcolor: '#fff', 
                p: { xs: 2, sm: 3 }, 
                border: '1px solid #e8e8e8', 
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                display: 'flex', gap: 4, overflowX: 'auto',
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 3 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(26,26,46,0.2)', borderRadius: 3, '&:hover': { bgcolor: 'rgba(26,26,46,0.4)' } }
            }}>
                {authors.map((author, idx) => (
                    <Box
                        key={author.id}
                        onClick={() => navigate(`/shop?search=${encodeURIComponent(author.name)}`)}
                        sx={{
                            minWidth: 140, maxWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                '& img': { transform: 'scale(1.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }
                            }
                        }}
                    >
                        <Box sx={{
                            width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', mb: 2,
                            border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s ease'
                        }}>
                            <img
                                src={author.imageUrl || 'https://via.placeholder.com/150'}
                                alt={author.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                            />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center', color: '#333' }}>
                            {author.name}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default Authors;
