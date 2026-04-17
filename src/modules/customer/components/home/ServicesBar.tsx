// src/modules/customer/components/Home/ServicesBar.jsx
import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { SERVICES } from '../../../../utils/constants';

const ServicesBar = () => (
    <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {SERVICES.map((s, i) => (
            <Grid item xs={6} md={3} key={i}>
                <Paper elevation={0} sx={{
                    p: 2, borderRadius: 2,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: '#fff', border: '1px solid #f0f0f0',
                }}>
                    <Typography fontSize={24}>{s.icon}</Typography>
                    <Box>
                        <Typography variant="body2" fontWeight={700} fontSize={12}>
                            {s.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {s.sub}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        ))}
    </Grid>
);

export default ServicesBar;