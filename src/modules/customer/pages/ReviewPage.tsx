import React, { useState } from 'react';
import { Box, Typography, Container, Grid, Pagination, Breadcrumbs, Link as MuiLink, Skeleton } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import articleService from '../../../services/articleService';

const ReviewPage: React.FC = () => {
    const [listPage, setListPage] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const isNews = location.pathname === '/tin-tuc';
    const pageTitle = isNews ? 'Tin tức' : 'Review Sách';

    // Query 1: Featured articles cho hero grid + sidebar (luôn lấy trang đầu, 6 bài)
    const { data: featuredData } = useQuery({
        queryKey: ['customer_featured_articles'],
        queryFn: () => articleService.search({ page: 0, size: 6, isActive: true }),
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    // Query 2: Danh sách bài viết có phân trang (10 bài/trang)
    const { data: listData, isLoading: isListLoading } = useQuery({
        queryKey: ['customer_articles_list', listPage],
        queryFn: () => articleService.search({ page: listPage, size: 10, isActive: true }),
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setListPage(value - 1);
        const el = document.getElementById('article-list-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const featuredArticles = featuredData?.content || [];
    const topNews = featuredArticles.slice(0, 4);
    const listArticles = listData?.content || [];

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 8 }}>
            {/* Breadcrumb */}
            <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #eee', py: 1.5 }}>
                <Container maxWidth="lg">
                    <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ fontSize: 13 }}>
                        <MuiLink component={Link} to="/" underline="hover" color="inherit">Trang chủ</MuiLink>
                        <Typography color="#f5a623" fontWeight={600} fontSize={13}>{pageTitle}</Typography>
                    </Breadcrumbs>
                </Container>
            </Box>

            {/* ═══════════════════ HERO GRID ═══════════════════ */}
            <Box sx={{ bgcolor: '#e0e0e0' }}>
                <Container maxWidth="lg" disableGutters sx={{ py: 0 }}>
                    {featuredArticles.length > 0 && (
                        <Grid container spacing={'4px'}>
                            {/* 2 bài lớn ở hàng trên */}
                            {featuredArticles.slice(0, 2).map((article) => (
                                <Grid size={{ xs: 12, md: 6 }} key={article.id}>
                                    <Box
                                        onClick={() => navigate(`/article/${article.slug}`)}
                                        sx={{
                                            position: 'relative',
                                            height: { xs: 220, md: 320 },
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            '&:hover img': { transform: 'scale(1.05)' }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={article.coverImage || 'https://via.placeholder.com/800x400?text=Article'}
                                            alt={article.title}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: 'block' }}
                                        />
                                        <Box sx={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                                            p: { xs: 2, md: 3 }, pt: 10
                                        }}>
                                            <Typography sx={{
                                                color: '#fff', fontWeight: 700, fontSize: { xs: 15, md: 18 },
                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.5
                                            }}>
                                                {article.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                                                {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}

                            {/* 4 bài nhỏ ở hàng dưới - nền trắng, tiêu đề bên dưới ảnh */}
                            {featuredArticles.slice(2, 6).map((article) => (
                                <Grid size={{ xs: 6, md: 3 }} key={article.id}>
                                    <Box
                                        onClick={() => navigate(`/article/${article.slug}`)}
                                        sx={{
                                            bgcolor: '#fff',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover img': { transform: 'scale(1.05)' },
                                            '&:hover .small-title': { color: '#f5a623' }
                                        }}
                                    >
                                        <Box sx={{ height: { xs: 110, md: 160 }, overflow: 'hidden' }}>
                                            <Box
                                                component="img"
                                                src={article.coverImage || 'https://via.placeholder.com/400x200?text=Article'}
                                                alt={article.title}
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }}
                                            />
                                        </Box>
                                        <Box sx={{ p: 1.5, flex: 1 }}>
                                            <Typography className="small-title" sx={{
                                                color: '#1a1a2e', fontWeight: 700, fontSize: { xs: 12, md: 14 },
                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden', mb: 0.5, lineHeight: 1.5, transition: 'color 0.2s'
                                            }}>
                                                {article.title}
                                            </Typography>
                                            <Typography sx={{ color: '#f5a623', fontSize: 12, fontWeight: 500 }}>
                                                {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>
            </Box>

            {/* ═══════════════════ BODY: SIDEBAR + LIST ═══════════════════ */}
            <Container maxWidth="lg" sx={{ mt: 5 }} id="article-list-section">
                <Grid container spacing={4}>
                    {/* ─── LEFT SIDEBAR ─── */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ position: 'sticky', top: 90 }}>
                        {/* Danh mục */}
                        <Box sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
                            <Typography fontWeight={700} sx={{
                                borderLeft: '4px solid #f5a623', pl: 1.5, mb: 2,
                                textTransform: 'uppercase', fontSize: 15, color: '#1a1a2e'
                            }}>
                                Danh mục
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {[
                                    { label: 'Tiếp thị liên kết', path: '#' },
                                    { label: 'Hỗ trợ', path: '#' },
                                    { label: 'Blog', path: '#' },
                                    { label: 'Tuyển dụng', path: '#' },
                                    { label: 'Review sách', path: '/review-sach' },
                                ].map(item => (
                                    <Typography
                                        key={item.label}
                                        onClick={() => item.path !== '#' ? navigate(item.path) : null}
                                        sx={{
                                            fontSize: 14, py: 0.8, cursor: 'pointer',
                                            color: '#444', fontWeight: 400,
                                            '&:hover': { color: '#f5a623' },
                                            borderBottom: '1px dashed #eee',
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        › {item.label}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>

                        {/* Tin nổi bật */}
                        <Box>
                            <Typography fontWeight={700} sx={{
                                borderLeft: '4px solid #f5a623', pl: 1.5, mb: 2,
                                textTransform: 'uppercase', fontSize: 15, color: '#1a1a2e'
                            }}>
                                Tin nổi bật
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {topNews.map(article => (
                                    <Box
                                        key={article.id}
                                        onClick={() => navigate(`/article/${article.slug}`)}
                                        sx={{
                                            display: 'flex', gap: 1.5, cursor: 'pointer',
                                            '&:hover .sidebar-title': { color: '#f5a623' }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={article.coverImage || 'https://via.placeholder.com/100x80'}
                                            alt={article.title}
                                            sx={{ width: 80, height: 70, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                                        />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                className="sidebar-title"
                                                sx={{
                                                    fontSize: 13, fontWeight: 700, lineHeight: 1.4, mb: 0.5,
                                                    display: '-webkit-box', WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                    transition: 'color 0.2s', color: '#1a1a2e'
                                                }}
                                            >
                                                {article.title}
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, color: '#999' }}>
                                                {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                      </Box>
                    </Grid>

                    {/* ─── MAIN ARTICLE LIST ─── */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        {isListLoading ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {[1, 2, 3, 4].map(i => (
                                    <Box key={i} sx={{ display: 'flex', gap: 3 }}>
                                        <Skeleton variant="rectangular" width={280} height={180} sx={{ borderRadius: 2, flexShrink: 0 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton width="80%" height={32} />
                                            <Skeleton width="30%" sx={{ my: 1 }} />
                                            <Skeleton width="100%" />
                                            <Skeleton width="100%" />
                                            <Skeleton width="60%" />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {listArticles.map((article, idx) => (
                                        <Box
                                            key={article.id}
                                            onClick={() => navigate(`/article/${article.slug}`)}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                gap: { xs: 2, sm: 3 },
                                                cursor: 'pointer',
                                                py: 3,
                                                borderBottom: idx < listArticles.length - 1 ? '1px solid #e8e8e8' : 'none',
                                                '&:hover .article-title': { color: '#f5a623' },
                                                '&:hover .article-img': { transform: 'scale(1.03)' }
                                            }}
                                        >
                                            {/* Ảnh bài viết */}
                                            <Box sx={{
                                                width: { xs: '100%', sm: 280 },
                                                height: { xs: 180, sm: 170 },
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                borderRadius: 2
                                            }}>
                                                <Box
                                                    className="article-img"
                                                    component="img"
                                                    src={article.coverImage || 'https://via.placeholder.com/400x240?text=No+Image'}
                                                    alt={article.title}
                                                    sx={{
                                                        width: '100%', height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease',
                                                        display: 'block'
                                                    }}
                                                />
                                            </Box>

                                            {/* Nội dung */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    className="article-title"
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: { xs: 16, md: 18 },
                                                        color: '#1a1a2e',
                                                        mb: 0.8,
                                                        transition: 'color 0.2s',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        lineHeight: 1.4
                                                    }}
                                                >
                                                    {article.title}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12, color: '#999', mb: 1.5 }}>
                                                    {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                                </Typography>
                                                <Typography sx={{
                                                    fontSize: 14, color: '#555', lineHeight: 1.7,
                                                    display: '-webkit-box', WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                }}>
                                                    {article.content.replace(/<[^>]+>/g, '')}
                                                </Typography>
                                                <Typography sx={{
                                                    mt: 'auto', pt: 1.5, fontSize: 13,
                                                    color: '#f5a623', fontWeight: 600,
                                                    '&:hover': { textDecoration: 'underline' }
                                                }}>
                                                    Xem thêm
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}

                                    {listArticles.length === 0 && (
                                        <Box sx={{ textAlign: 'center', py: 8 }}>
                                            <Typography color="text.secondary">Chưa có bài viết nào.</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Pagination */}
                                {listData && listData.totalPages > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                                        <Pagination
                                            count={listData.totalPages}
                                            page={listPage + 1}
                                            onChange={handlePageChange}
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    fontWeight: 600,
                                                },
                                                '& .MuiPaginationItem-root.Mui-selected': {
                                                    bgcolor: '#f5a623',
                                                    color: '#fff',
                                                    '&:hover': { bgcolor: '#e0951a' }
                                                }
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ReviewPage;
