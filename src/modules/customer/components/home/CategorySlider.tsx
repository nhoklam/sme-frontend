import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import TranslateIcon from '@mui/icons-material/Translate';
import ScienceIcon from '@mui/icons-material/Science';
import PublicIcon from '@mui/icons-material/Public';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';

const CATEGORIES = [
    { name: 'Văn học', icon: <AutoStoriesIcon fontSize="large" />, count: 1240 },
    { name: 'Kinh tế', icon: <TrendingUpIcon fontSize="large" />, count: 850 },
    { name: 'Kỹ năng sống', icon: <SelfImprovementIcon fontSize="large" />, count: 620 },
    { name: 'Thiếu nhi', icon: <ChildCareIcon fontSize="large" />, count: 430 },
    { name: 'Ngoại ngữ', icon: <TranslateIcon fontSize="large" />, count: 320 },
    { name: 'Khoa học', icon: <ScienceIcon fontSize="large" />, count: 210 },
    { name: 'Lịch sử & Địa lý', icon: <PublicIcon fontSize="large" />, count: 180 },
    { name: 'Tâm lý học', icon: <PsychologyIcon fontSize="large" />, count: 290 },
];

const CategorySlider = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    return (
        <Box sx={{ mb: 6 }}>
            <Typography variant="h3" sx={{ textAlign: 'center', mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Danh Mục Nổi Bật
            </Typography>
            <Grid container spacing={2}>
                {CATEGORIES.map((cat, idx) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={idx}>
                        <Paper 
                            elevation={0}
                            onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
                            sx={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, 
                                borderRadius: '16px', border: '1px solid var(--color-border)', cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: 'var(--color-secondary)',
                                    transform: 'translateY(-5px)',
                                    boxShadow: 'var(--shadow-md)',
                                    '& .MuiSvgIcon-root': { color: 'var(--color-secondary)', transform: 'scale(1.1)' }
                                }
                            }}
                        >
                            <Box sx={{ 
                                width: 64, height: 64, borderRadius: '50%', bgcolor: 'var(--bg-default)', 
                                display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2,
                                color: 'var(--color-primary)', transition: 'all 0.3s ease'
                            }}>
                                {cat.icon}
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{cat.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{cat.count} tựa sách</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default CategorySlider;