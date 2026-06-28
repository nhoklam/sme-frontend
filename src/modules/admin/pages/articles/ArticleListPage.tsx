import React, { useState } from 'react';
import {
    Box, Button, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Chip, Pagination,
    Tabs, Tab, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Badge
} from '@mui/material';
import { Add, Edit, Delete, Send, CheckCircle, ThumbDown } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import articleService from '../../../../services/articleService';
import authService from '../../../../services/authService';
import ArticleFormDialog from './ArticleFormDialog';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT:            { label: 'Nháp',         color: '#9e9e9e', bg: '#f5f5f5' },
    PENDING_APPROVAL: { label: 'Chờ duyệt',    color: '#e65100', bg: '#fff3e0' },
    PUBLISHED:        { label: 'Đã xuất bản',  color: '#2e7d32', bg: '#e8f5e9' },
    REJECTED:         { label: 'Bị từ chối',   color: '#d32f2f', bg: '#ffebee' },
};

type StatusTab = 'ALL' | 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';

const ArticleListPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { confirm } = useConfirm();

    // Reject dialog state
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const { data, isLoading } = useQuery({
        queryKey: ['admin_articles', page, statusTab],
        queryFn: () => articleService.search({
            page,
            size: 10,
            ...(statusTab !== 'ALL' ? { status: statusTab } : {})
        })
    });

    // Count queries for badge display
    const { data: draftData } = useQuery({
        queryKey: ['admin_articles_count', 'DRAFT'],
        queryFn: () => articleService.search({ page: 0, size: 1, status: 'DRAFT' })
    });
    const { data: pendingData } = useQuery({
        queryKey: ['admin_articles_count', 'PENDING_APPROVAL'],
        queryFn: () => articleService.search({ page: 0, size: 1, status: 'PENDING_APPROVAL' })
    });
    const { data: publishedData } = useQuery({
        queryKey: ['admin_articles_count', 'PUBLISHED'],
        queryFn: () => articleService.search({ page: 0, size: 1, status: 'PUBLISHED' })
    });
    const { data: rejectedData } = useQuery({
        queryKey: ['admin_articles_count', 'REJECTED'],
        queryFn: () => articleService.search({ page: 0, size: 1, status: 'REJECTED' })
    });

    const deleteMutation = useMutation({
        mutationFn: articleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
            toast.success('Xóa bài viết thành công!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
        }
    });

    const submitMutation = useMutation({
        mutationFn: (id: string) => articleService.submit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
            toast.success('Đã gửi bài viết để duyệt!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi duyệt');
        }
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => articleService.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
            toast.success('Đã duyệt bài viết!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => articleService.reject(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
            toast.success('Đã từ chối bài viết!');
            setRejectDialogOpen(false);
            setRejectReason('');
            setRejectTargetId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối');
        }
    });

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: 'Xóa bài viết',
            description: 'Bạn có chắc chắn muốn xóa bài viết này?',
            confirmText: 'Xóa',
            color: 'error'
        });
        if (ok) {
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

    const handleSubmit = (id: string) => {
        submitMutation.mutate(id);
    };

    const handleApprove = (id: string) => {
        approveMutation.mutate(id);
    };

    const openRejectDialog = (id: string) => {
        setRejectTargetId(id);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const handleConfirmReject = () => {
        if (!rejectTargetId) return;
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }
        rejectMutation.mutate({ id: rejectTargetId, reason: rejectReason.trim() });
    };

    const handleTabChange = (_: React.SyntheticEvent, newVal: StatusTab) => {
        setStatusTab(newVal);
        setPage(0);
    };

    const tabCounts: Record<StatusTab, number | undefined> = {
        ALL: data?.totalElements,
        DRAFT: draftData?.totalElements,
        PENDING_APPROVAL: pendingData?.totalElements,
        PUBLISHED: publishedData?.totalElements,
        REJECTED: rejectedData?.totalElements,
    };

    const tabs: { value: StatusTab; label: string }[] = [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'DRAFT', label: 'Nháp' },
        { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
        { value: 'PUBLISHED', label: 'Đã xuất bản' },
        { value: 'REJECTED', label: 'Bị từ chối' },
    ];

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

            {/* Status Tabs */}
            <Paper elevation={0} sx={{ border: '1px solid #eee', mb: 0, borderBottom: 'none', borderRadius: '8px 8px 0 0' }}>
                <Tabs
                    value={statusTab}
                    onChange={handleTabChange}
                    sx={{
                        px: 2,
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 48 },
                        '& .MuiTabs-indicator': { bgcolor: '#1976d2' },
                        '& .Mui-selected': { color: '#1976d2 !important' },
                    }}
                >
                    {tabs.map(t => (
                        <Tab
                            key={t.value}
                            value={t.value}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    {t.label}
                                    {tabCounts[t.value] != null && tabCounts[t.value]! > 0 && (
                                        <Badge
                                            badgeContent={tabCounts[t.value]}
                                            color={t.value === 'PENDING_APPROVAL' ? 'warning' : t.value === 'REJECTED' ? 'error' : 'default'}
                                            sx={{
                                                '& .MuiBadge-badge': {
                                                    position: 'static',
                                                    transform: 'none',
                                                    fontSize: 10,
                                                    height: 18,
                                                    minWidth: 18,
                                                    borderRadius: 9,
                                                    bgcolor: t.value === 'PENDING_APPROVAL' ? '#fff3e0' : t.value === 'REJECTED' ? '#ffebee' : '#f0f0f0',
                                                    color: t.value === 'PENDING_APPROVAL' ? '#e65100' : t.value === 'REJECTED' ? '#d32f2f' : '#666',
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                            }
                        />
                    ))}
                </Tabs>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: '0 0 8px 8px' }}>
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
                        ) : data?.content?.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>Không có bài viết nào</TableCell></TableRow>
                        ) : data?.content.map((item) => {
                            const statusInfo = STATUS_MAP[item.status] ?? { label: item.status, color: '#666', bg: '#f5f5f5' };
                            const isOwner = item.createdByUserId === currentUser?.id;
                            const canEditDelete = isAdmin || isOwner;
                            const canSubmit = !isAdmin && isOwner && (item.status === 'DRAFT' || item.status === 'REJECTED');
                            const canApproveReject = isAdmin && item.status === 'PENDING_APPROVAL';

                            return (
                                <TableRow key={item.id}>
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            {item.coverImage && (
                                                <Box
                                                    component="img"
                                                    src={item.coverImage}
                                                    alt={item.title}
                                                    sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd', flexShrink: 0 }}
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
                                        <Box>
                                            <Chip
                                                label={statusInfo.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusInfo.bg,
                                                    color: statusInfo.color,
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                    height: 22,
                                                }}
                                            />
                                            {item.status === 'REJECTED' && item.rejectionReason && (
                                                <Tooltip title={`Lý do: ${item.rejectionReason}`} arrow>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            display: 'block',
                                                            mt: 0.25,
                                                            color: '#d32f2f',
                                                            fontSize: 10,
                                                            maxWidth: 160,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            cursor: 'help',
                                                        }}
                                                    >
                                                        {item.rejectionReason}
                                                    </Typography>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center', alignItems: 'center' }}>
                                            {/* Manager: Gửi duyệt for own DRAFT/REJECTED */}
                                            {canSubmit && (
                                                <Tooltip title="Gửi duyệt">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleSubmit(item.id)}
                                                        disabled={submitMutation.isPending}
                                                        sx={{ color: '#e65100', '&:hover': { bgcolor: '#fff3e0' } }}
                                                    >
                                                        <Send sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {/* Admin: Approve/Reject for PENDING_APPROVAL */}
                                            {canApproveReject && (
                                                <>
                                                    <Tooltip title="Duyệt">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleApprove(item.id)}
                                                            disabled={approveMutation.isPending}
                                                            sx={{ color: '#2e7d32', '&:hover': { bgcolor: '#e8f5e9' } }}
                                                        >
                                                            <CheckCircle sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Từ chối">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openRejectDialog(item.id)}
                                                            sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}
                                                        >
                                                            <ThumbDown sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* Edit/Delete: Admin sees all, Manager sees own */}
                                            {canEditDelete && (
                                                <>
                                                    <Tooltip title="Chỉnh sửa">
                                                        <IconButton size="small" color="primary" onClick={() => handleEdit(item.id)}>
                                                            <Edit sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Xóa">
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                                                            <Delete sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Từ chối bài viết</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Vui lòng nhập lý do từ chối để thông báo cho người viết.
                    </Typography>
                    <TextField
                        label="Lý do từ chối"
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Nhập lý do từ chối bài viết..."
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)} color="inherit">Hủy</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmReject}
                        disabled={rejectMutation.isPending || !rejectReason.trim()}
                    >
                        {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ArticleListPage;
