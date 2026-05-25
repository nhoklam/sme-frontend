import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Pagination } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import articleService from '../../../../services/articleService';
import ArticleFormDialog from './ArticleFormDialog';

const ArticleListPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin_articles', page],
        queryFn: () => articleService.search({ page, size: 10 })
    });

    const deleteMutation = useMutation({
        mutationFn: articleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
            alert('Xóa bài viết thành công!');
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (id: string) => {
        setSelectedId(id);
        setOpenDialog(true);
    };

    const handleCreate = () => {
        setSelectedId(null);
        setOpenDialog(true);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#fafaf9', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#9ca3af" fontSize={11}>
                        Dashboard / <strong style={{ color: '#6b7280' }}>Bài viết</strong>
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">
                        Quản lý bài viết
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
                    Thêm bài viết
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><b>Tiêu đề</b></TableCell>
                            <TableCell><b>Loại bài viết</b></TableCell>
                            <TableCell><b>Tác giả</b></TableCell>
                            <TableCell><b>Trạng thái</b></TableCell>
                            <TableCell align="center"><b>Thao tác</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} align="center">Đang tải dữ liệu...</TableCell></TableRow>
                        ) : data?.content.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell sx={{ maxWidth: 300 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {item.coverImage && (
                                            <Box 
                                                component="img" 
                                                src={item.coverImage} 
                                                alt={item.title} 
                                                sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }} 
                                            />
                                        )}
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="body2" noWrap fontWeight={600} title={item.title}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }} title={item.slug}>
                                                {item.slug}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={item.type} size="small" color={item.type === 'TIN_TUC' ? 'primary' : 'secondary'} />
                                </TableCell>
                                <TableCell>{item.authorName}</TableCell>
                                <TableCell>
                                    <Chip label={item.isActive ? 'Hiển thị' : 'Đã ẩn'} size="small" color={item.isActive ? 'success' : 'default'} />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" color="primary" onClick={() => handleEdit(item.id)}><Edit /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {data && data.totalPages > 1 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination 
                        count={data.totalPages} 
                        page={page + 1} 
                        onChange={(_, v) => setPage(v - 1)} 
                        color="primary" 
                    />
                </Box>
            )}

            <ArticleFormDialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                articleId={selectedId} 
            />
        </Box>
    );
};

export default ArticleListPage;
