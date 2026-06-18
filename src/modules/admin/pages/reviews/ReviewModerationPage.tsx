import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton,
  Pagination, Skeleton, Switch, Tooltip, Alert, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Rating
} from '@mui/material';
import { Delete, CheckCircle, Pending, Comment, VisibilityOff, Visibility } from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reviewApi } from '../../../../services/reviewApi';
import { ProductReview } from '../../../../types';
import authService from '../../../../services/authService';
import { useConfirm } from '../../../../contexts/ConfirmContext';

export default function ReviewModerationPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { confirm } = useConfirm();
  const qc = useQueryClient();
  const user = authService.getCurrentUser()?.user;
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, statusFilter],
    queryFn: () => reviewApi.getAllReviews({
      page,
      size: 15,
      status: statusFilter === 'APPROVED' ? true : statusFilter === 'PENDING' ? false : undefined
    })
  });

  const handleToggleStatus = async (id: string) => {
    try {
      await reviewApi.toggleReview(id);
      toast.success('Đã cập nhật trạng thái');
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Xóa đánh giá',
      description: 'Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa',
      color: 'error'
    });
    if (!ok) return;
    try {
      await reviewApi.deleteReview(id);
      toast.success('Đã xóa đánh giá');
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>
          Kiểm duyệt Đánh giá
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Xem và kiểm duyệt các đánh giá của khách hàng về sản phẩm
        </Typography>
      </Box>

      {/* Filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {['ALL', 'PENDING', 'APPROVED'].map(status => (
          <Chip
            key={status}
            label={status === 'ALL' ? 'Tất cả' : status === 'PENDING' ? 'Bị ẩn' : 'Hiển thị'}
            onClick={() => { setPage(0); setStatusFilter(status); }}
            sx={{
              fontWeight: 700,
              bgcolor: statusFilter === status ? '#1976d2' : '#e0e0e0',
              color: statusFilter === status ? '#fff' : '#555',
              cursor: 'pointer'
            }}
          />
        ))}
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>KHÁCH HÀNG</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>SẢN PHẨM (ID)</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>ĐÁNH GIÁ</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>NỘI DUNG</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>TRẠNG THÁI</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: '#888' }}>THAO TÁC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>
                ))
              ) : !data?.data?.content?.length ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Comment sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Chưa có đánh giá nào</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.content.map((review) => (
                  <TableRow key={review.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800}>{review.customerName || 'Ẩn danh'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Chưa rõ ngày'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={review.productId || 'Không có ID'}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 1 }}>
                          {review.productId ? review.productId.substring(0, 8) : 'N/A'}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Rating value={review.rating || 0} readOnly size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap title={review.comment}>
                        {review.comment || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Không có nội dung</span>}
                      </Typography>
                      {review.imageUrls && review.imageUrls.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                          {review.imageUrls.map((url, idx) => (
                            <Box 
                              key={idx} 
                              component="img" 
                              src={url} 
                              alt="review-img" 
                              sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }} 
                            />
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {review.isApproved ? (
                        <Chip size="small" icon={<CheckCircle fontSize="small" />} label="Hiển thị" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700 }} />
                      ) : (
                        <Chip size="small" icon={<Pending fontSize="small" />} label="Bị ẩn" sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 700 }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isAdmin ? (
                        <>
                          <Tooltip title={review.isApproved ? "Ẩn đánh giá (Block)" : "Hiện đánh giá (Duyệt)"}>
                            <span>
                              <IconButton size="small" color={review.isApproved ? "warning" : "success"} onClick={() => handleToggleStatus(review.id)}>
                                {review.isApproved ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Xóa đánh giá">
                            <IconButton size="small" color="error" onClick={() => handleDelete(review.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Chỉ xem</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f0f0f0' }}>
          <Pagination
            count={data?.data?.totalPages || 0}
            page={page + 1}
            onChange={(_, p) => setPage(p - 1)}
            color="primary"
            size="small"
          />
        </Box>
      </Paper>
    </Box>
  );
}
