import React from 'react';
import { Box, Typography } from '@mui/material';
import { SERVICES } from '../../../../utils/constants';

const ServicesBar = () => (
    <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        mb: 2,
        bgcolor: '#fff',
        border: '1px solid #ececec',
        borderRadius: 1.5,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
        {SERVICES.map((s, i) => (
            <Box
                key={i}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 2,
                    py: 1.6,
                    borderRight: {
                        xs: i % 2 === 0 ? '1px solid #ececec' : 'none',
                        md: i < SERVICES.length - 1 ? '1px solid #ececec' : 'none',
                    },
                    borderBottom: {
                        xs: i < SERVICES.length - 2 ? '1px solid #ececec' : 'none',
                        md: 'none',
                    },
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: '#fafafa' },
                }}
            >
                <Typography sx={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
                    {s.icon}
                </Typography>
                <Box>
                    <Typography
                        sx={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: '#1a1a1a',
                            lineHeight: 1.3,
                            fontFamily: '"Segoe UI", sans-serif',
                        }}
                    >
                        {s.title}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: 11,
                            color: '#888',
                            lineHeight: 1.4,
                            fontFamily: '"Segoe UI", sans-serif',
                        }}
                    >
                        {s.sub}
                    </Typography>
                </Box>
            </Box>
        ))}
    </Box>
);

export default ServicesBar;