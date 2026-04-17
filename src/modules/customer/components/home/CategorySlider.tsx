// src/modules/customer/components/Home/CategorySlider.jsx
import React from 'react';
import { Box, Grid, Paper, Typography, Button } from '@mui/material';
import { ArrowForwardIos } from '@mui/icons-material';
import { CATEGORIES } from '../../../../utils/constants';

const CategorySlider = () => (
    <Box sx={{ mb: 3 }}>
        {/* Section header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 24, bgcolor: '#d32f2f', borderRadius: 2 }} />
                <Typography variant="h6" fontWeight={800}>Danh mục sách</Typography>
            </Box>
            <Button
                endIcon={<ArrowForwardIos sx={{ fontSize: 12 }} />}
                sx={{ color: '#d32f2f', textTransform: 'none', fontWeight: 600 }}
            >
                Xem tất cả
            </Button>
        </Box>

        <Grid container spacing={1.5}>
            {CATEGORIES.map((cat) => (
                <Grid item xs={6} sm={3} md={1.5} key={cat.id}>
                    <Paper elevation={0} sx={{
                        p: 2, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
                        bgcolor: cat.color, border: '1px solid transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: 3,
                            borderColor: '#d32f2f',
                        },
                    }}>
                        <Typography fontSize={28} mb={0.5}>{cat.icon}</Typography>
                        <Typography variant="body2" fontWeight={700} fontSize={12} noWrap>
                            {cat.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {cat.count} cuốn
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    </Box>
);

export default CategorySlider;