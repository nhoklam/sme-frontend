import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { AccessTime, LocalOffer } from '@mui/icons-material';

const PromotionBanner = () => (
    <Box sx={{
        background: 'linear-gradient(135deg, #e8401c 0%, #c62828 50%, #ad1457 100%)',
        borderRadius: 1.5,
        px: { xs: 2.5, md: 3.5 },
        py: 2.25,
        mb: 2.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 3px 12px rgba(232,64,28,0.28)',
    }}>
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', right: -35, top: -35, width: 130, height: 130, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', right: 110, bottom: -45, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Chip
                    icon={<AccessTime sx={{ fontSize: 12, color: '#fff !important' }} />}
                    label="Mỗi ngày 12h & 20h"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 10.5,
                        height: 21,
                        fontFamily: '"Segoe UI", sans-serif',
                    }}
                />
            </Box>
            <Typography fontWeight={900} color="#fff" sx={{
                lineHeight: 1.2,
                fontSize: { xs: 17, md: 20 },
                fontFamily: '"Segoe UI", sans-serif',
            }}>
                🎉 Flash Sale — Giảm đến 70%
            </Typography>
            <Typography color="rgba(255,255,255,0.82)" sx={{
                fontSize: 12.5, mt: 0.4,
                fontFamily: '"Segoe UI", sans-serif',
            }}>
                Số lượng có hạn · Nhanh tay kẻo hết!
            </Typography>
        </Box>

        <Button
            variant="contained"
            startIcon={<LocalOffer sx={{ fontSize: 16 }} />}
            sx={{
                bgcolor: '#fff',
                color: '#e8401c',
                fontWeight: 800,
                textTransform: 'none',
                px: 3,
                py: 1.1,
                fontSize: 13.5,
                borderRadius: 1.5,
                boxShadow: 'none',
                flexShrink: 0,
                fontFamily: '"Segoe UI", sans-serif',
                '&:hover': {
                    bgcolor: '#fff3f0',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.14)',
                },
                transition: 'all 0.18s',
            }}
        >
            Săn ngay
        </Button>
    </Box>
);

export default PromotionBanner;