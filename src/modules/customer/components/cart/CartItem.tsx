// src/modules/customer/components/cart/CartItem.jsx
import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Add, Remove, DeleteOutline } from '@mui/icons-material';
import { fmt } from '../../../../utils/constants';

const CartItem = ({ item, onUpdateQty, onRemove }) => {
    const [imgErr, setImgErr] = useState(false);
    const thumb = item.images?.[0] ?? item.img ?? '';
    const fallback = `https://placehold.co/64x88/f5f5f5/999?text=📖`;

    return (
        <Box sx={{
            display: 'flex', gap: 1.5, py: 1.5,
            borderBottom: '1px solid #f0f0f0',
            '&:last-child': { borderBottom: 'none' },
        }}>
            {/* Thumbnail */}
            <Box sx={{
                width: 64, height: 88, flexShrink: 0,
                bgcolor: '#fafafa', borderRadius: 1, overflow: 'hidden',
                border: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Box
                    component="img"
                    src={imgErr ? fallback : thumb}
                    alt={item.title}
                    onError={() => setImgErr(true)}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
                />
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} sx={{
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    lineHeight: 1.4, mb: 0.5, fontSize: 13,
                }}>
                    {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {item.author}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Qty controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <IconButton size="small" onClick={() => onUpdateQty(item.id, item.qty - 1)}
                            disabled={item.qty <= 1}
                            sx={{ p: 0.4, '&:disabled': { opacity: 0.35 } }}>
                            <Remove sx={{ fontSize: 14 }} />
                        </IconButton>
                        <Typography sx={{ px: 1.5, fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                            {item.qty}
                        </Typography>
                        <IconButton size="small" onClick={() => onUpdateQty(item.id, item.qty + 1)}
                            disabled={item.qty >= item.stock}
                            sx={{ p: 0.4, '&:disabled': { opacity: 0.35 } }}>
                            <Add sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>

                    {/* Price */}
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={800} color="#1a1a2e">
                            {fmt(item.price * item.qty)}
                        </Typography>
                        {item.qty > 1 && (
                            <Typography variant="caption" color="text.secondary">
                                {fmt(item.price)}/cuốn
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Delete */}
            <IconButton size="small" onClick={() => onRemove(item.id)}
                sx={{ alignSelf: 'flex-start', color: '#bbb', '&:hover': { color: '#ff4d4f', bgcolor: '#fff0f6' } }}>
                <DeleteOutline sx={{ fontSize: 18 }} />
            </IconButton>
        </Box>
    );
};

export default CartItem;