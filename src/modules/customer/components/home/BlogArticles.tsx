import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { useArticles } from '../../hooks/useArticles';

/**
 * Bảng Bài viết – Review sách hay
 * Hiển thị dạng thẻ bài viết với ảnh bìa lớn, ngày tháng ở góc, và tiêu đề.
 */
const BlogArticles = () => {
    const navigate = useNavigate();
    const { articles, isLoading } = useArticles({ size: 8, type: 'REVIEW_SACH' });

    if (!isLoading && articles.length === 0) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Box sx={{ mb: 6 }}>
            {/* Header: Đơn giản, text tối màu */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
                    Review sách hay
                </Typography>
            </Box>

            {/* Articles Grid: 4 cột */}
            <Grid container spacing={3}>
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '4/3', borderRadius: 2 }} />
                                <Skeleton width="90%" height={24} />
                                <Skeleton width="60%" height={24} />
                            </Box>
                        </Grid>
                    ))
                ) : (
                    articles.map((article) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={article.id}>
                            <Box
                                onClick={() => navigate(`/article/${article.slug}`)}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    '&:hover img': {
                                        transform: 'scale(1.05)',
                                    },
                                    '&:hover .title': {
                                        color: '#C92127',
                                    }
                                }}
                            >
                                {/* Image Container */}
                                <Box sx={{
                                    width: '100%',
                                    aspectRatio: '4/3',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    mb: 1.5,
                                    bgcolor: '#f5f5f5'
                                }}>
                                    <Box
                                        component="img"
                                        src={article.coverImage}
                                        alt={article.title}
                                        onError={(e: any) => { e.target.src = 'https://placehold.co/400x300/f8f8f8/999?text=Bài+viết'; }}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.3s ease',
                                        }}
                                    />
                                    {/* Date Overlay */}
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        left: 8,
                                        bgcolor: 'rgba(0, 0, 0, 0.4)',
                                        color: '#fff',
                                        px: 1.2,
                                        py: 0.4,
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backdropFilter: 'blur(4px)',
                                    }}>
                                        {formatDate(article.createdAt)}
                                    </Box>
                                </Box>

                                {/* Article Title */}
                                <Typography className="title" sx={{
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: '#222',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    transition: 'color 0.2s',
                                }}>
                                    {article.title}
                                </Typography>
                            </Box>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};

export default BlogArticles;
