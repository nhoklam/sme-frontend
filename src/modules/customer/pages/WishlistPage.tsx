import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Wishlist from '../components/account/Wishlist';
import { useWishlist } from '../hooks/useWishlist';

const WishlistPage: React.FC = () => {
    const navigate = useNavigate();
    const { items } = useWishlist();

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '80vh' }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h5" fontWeight={800} mb={3}>
                    Sản phẩm yêu thích
                    {items.length > 0 && (
                        <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
                            ({items.length} sản phẩm)
                        </Typography>
                    )}
                </Typography>

                {items.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#fff' }}>
                        <Favorite sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Chưa có sản phẩm yêu thích
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Hãy thêm sản phẩm vào danh sách yêu thích để mua sau
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/shop')}
                            sx={{
                                bgcolor: '#d32f2f',
                                '&:hover': { bgcolor: '#b71c1c' },
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                px: 4,
                            }}
                        >
                            Khám phá ngay
                        </Button>
                    </Paper>
                ) : (
                    <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 3 }}>
                        <Wishlist />
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default WishlistPage;