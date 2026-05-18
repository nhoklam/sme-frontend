import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const MOCK_AUTHORS = [
    { name: 'Nguyễn Nhật Ánh', image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=200&auto=format&fit=crop', count: 45 },
    { name: 'Thích Nhất Hạnh', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', count: 32 },
    { name: 'Haruki Murakami', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop', count: 28 },
    { name: 'Tô Hoài', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop', count: 15 },
    { name: 'Dale Carnegie', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop', count: 12 },
    { name: 'Nam Cao', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', count: 10 }
];

const Authors = () => {
    return (
        <Box sx={{ mb: 6 }}>
            <Typography variant="h3" sx={{ textAlign: 'center', mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Tác Giả Nổi Bật
            </Typography>
            
            <Box sx={{ 
                display: 'flex', gap: 4, overflowX: 'auto', pb: 2, px: 1,
                '&::-webkit-scrollbar': { display: 'none' }
            }}>
                {MOCK_AUTHORS.map((author, idx) => (
                    <Box 
                        key={idx} 
                        sx={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120, cursor: 'pointer',
                            '&:hover .MuiAvatar-root': { transform: 'scale(1.1)', boxShadow: 'var(--shadow-md)', borderColor: 'var(--color-secondary)' }
                        }}
                    >
                        <Avatar 
                            src={author.image} 
                            sx={{ 
                                width: 100, height: 100, mb: 2, 
                                border: '3px solid transparent',
                                transition: 'all 0.3s ease'
                            }} 
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center', mb: 0.5 }}>{author.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{author.count} tác phẩm</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default Authors;
