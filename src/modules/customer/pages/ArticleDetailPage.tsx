import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Breadcrumbs, Link, Skeleton, Divider } from '@mui/material';
import { useArticleDetail, useArticles } from '../hooks/useArticles';

const ArticleDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { article, isLoading, isError } = useArticleDetail(slug ?? '');
    
    // Fetch related articles
    const { articles: relatedArticles, isLoading: isLoadingRelated } = useArticles({ size: 5, type: article?.type });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, minHeight: '80vh' }}>
                <Skeleton width="10%" height={24} sx={{ mb: 2 }} />
                <Skeleton width="80%" height={60} />
                <Skeleton width="20%" height={24} sx={{ mb: 4 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 4 }} />
                <Skeleton width="100%" height={30} sx={{ mb: 1 }} />
                <Skeleton width="100%" height={30} sx={{ mb: 1 }} />
                <Skeleton width="90%" height={30} />
            </Container>
        );
    }

    if (isError || !article) {
        return (
            <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center', minHeight: '60vh' }}>
                <Typography variant="h5" color="error">Không tìm thấy bài viết hoặc bài viết đã bị xóa.</Typography>
                <Link component="button" onClick={() => navigate('/')} sx={{ mt: 2, fontSize: 16 }}>Quay lại trang chủ</Link>
            </Container>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const related = relatedArticles.filter(a => a.id !== article.id).slice(0, 4);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                <Breadcrumbs sx={{ mb: 4, fontSize: 13, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontWeight: 500 }}>
                        Trang chủ
                    </Link>
                    <Typography fontSize={13} color="var(--color-secondary, #f5a623)" fontWeight={600} noWrap sx={{ maxWidth: 300 }}>
                        {article.title}
                    </Typography>
                </Breadcrumbs>

                <Grid container spacing={5}>
                    {/* Main Content Area */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box sx={{ bgcolor: '#fff', p: { xs: 2, md: 5 }, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                            <Typography variant="h3" component="h1" fontWeight={800} sx={{ mb: 2, lineHeight: 1.3, color: '#1a1a2e', fontFamily: '"Playfair Display", serif' }}>
                                {article.title}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, color: 'text.secondary' }}>
                                <Typography variant="body2" fontWeight={600}>{formatDate(article.createdAt)}</Typography>
                                {article.authorName && (
                                    <>
                                        <Typography variant="body2">•</Typography>
                                        <Typography variant="body2" fontWeight={600}>{article.authorName}</Typography>
                                    </>
                                )}
                            </Box>

                            {/* Render HTML Content */}
                            <Box 
                                className="article-content"
                                dangerouslySetInnerHTML={{ __html: article.content }} 
                                sx={{
                                    color: '#333',
                                    fontSize: '1.05rem',
                                    lineHeight: 1.8,
                                    // Ảnh inline (nhiều ảnh cạnh nhau) - giữ display inline
                                    '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px', verticalAlign: 'middle' },
                                    // Ảnh lớn đứng 1 mình trong thẻ p - căn giữa
                                    '& p > img:only-child': { display: 'block', mx: 'auto', my: 3 },
                                    '& h2, & h3': { color: '#1a1a2e', mt: 4, mb: 2, fontWeight: 700 },
                                    '& p': { mb: 2 },
                                    '& a': { color: 'var(--color-secondary, #f5a623)', textDecoration: 'none' },
                                    '& a:hover': { textDecoration: 'underline' },
                                    '& blockquote': { borderLeft: '4px solid var(--color-secondary, #f5a623)', pl: 2, ml: 0, fontStyle: 'italic', color: '#555' },
                                    // Đảm bảo các đoạn text-align center hiển thị đúng
                                    '& p[style*="text-align:center"]': { textAlign: 'center' },
                                    '& p[style*="text-align: center"]': { textAlign: 'center' }
                                }}
                            />
                        </Box>
                    </Grid>

                    {/* Sidebar: Related Articles */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ position: 'sticky', top: 100 }}>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 3, pb: 1, borderBottom: '2px solid #e8e8e8', display: 'inline-block' }}>
                                BÀI VIẾT KHÁC
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {isLoadingRelated ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                                            <Skeleton variant="rectangular" width={100} height={75} sx={{ borderRadius: 1 }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Skeleton width="100%" height={20} />
                                                <Skeleton width="80%" height={20} />
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    related.map((item) => (
                                        <Box 
                                            key={item.id} 
                                            onClick={() => navigate(`/article/${item.slug}`)}
                                            sx={{ 
                                                display: 'flex', gap: 2, cursor: 'pointer',
                                                '&:hover .related-title': { color: 'var(--color-secondary, #f5a623)' }
                                            }}
                                        >
                                            <Box 
                                                component="img" 
                                                src={item.coverImage} 
                                                alt={item.title}
                                                onError={(e: any) => { e.target.src = 'https://placehold.co/100x75/f8f8f8/999?text=Bài+viết'; }}
                                                sx={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                                            />
                                            <Box>
                                                <Typography 
                                                    className="related-title"
                                                    sx={{ 
                                                        fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.4, color: '#222', mb: 0.5,
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                        transition: 'color 0.2s'
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(item.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ArticleDetailPage;
