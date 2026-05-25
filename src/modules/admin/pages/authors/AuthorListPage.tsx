import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Switch, Skeleton, Divider, InputAdornment, Alert
} from '@mui/material';
import { Add, Edit, Delete, Search, Star, StarBorder, Close, AddPhotoAlternate, DeleteOutline } from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import { authorApi, CreateAuthorRequest } from '../../../../services/authorApi';
import { Author } from '../../../../types';
import toast from 'react-hot-toast';

const EMPTY_FORM: CreateAuthorRequest = { name: '', avatarUrl: '', biography: '', isFeatured: false };

export default function AuthorListPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAuthorRequest>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Chỉ chấp nhận file ảnh'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Ảnh tối đa 10MB'); return; }
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosInstance.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url: string = (res as any).data?.data?.url ?? (res as any).data?.url ?? '';
      if (url) { setForm(f => ({ ...f, avatarUrl: url })); toast.success('Tải ảnh thành công'); }
    } catch { toast.error('Tải ảnh thất bại'); }
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authorApi.getAll({ keyword: keyword || undefined, page, size: 20 });
      const data = res.data;
      setAuthors(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch { toast.error('Không thể tải danh sách tác giả'); }
    finally { setLoading(false); }
  }, [keyword, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpen = (author?: Author) => {
    if (author) {
      setEditId(author.id);
      setForm({ name: author.name, avatarUrl: author.avatarUrl || '', biography: author.biography || '', isFeatured: author.isFeatured });
    } else {
      setEditId(null);
      setForm(EMPTY_FORM);
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Tên tác giả không được để trống'); return; }
    try {
      if (editId) {
        await authorApi.update(editId, form);
        toast.success('Cập nhật tác giả thành công');
      } else {
        await authorApi.create(form);
        toast.success('Thêm tác giả mới thành công');
      }
      setOpenDialog(false);
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await authorApi.toggleFeatured(id);
      setAuthors(prev => prev.map(a => a.id === id ? { ...a, isFeatured: !a.isFeatured } : a));
      toast.success('Đã cập nhật trạng thái nổi bật');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>Quản lý Tác giả</Typography>
          <Typography variant="body2" color="text.secondary">Quản lý thông tin và quảng bá các tác giả sách trong hệ thống</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}
          sx={{ bgcolor: '#1976d2', fontWeight: 700, px: 2.5, py: 1, borderRadius: 2, textTransform: 'none', boxShadow: '0 4px 12px rgba(25,118,210,0.2)' }}>
          Thêm Tác giả
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField size="small" placeholder="Tìm tên tác giả..." value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(0); }}
            sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#aaa' }} /></InputAdornment> } }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary">{authors.length} TÁC GIẢ</Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#fafafa', fontSize: 11, fontWeight: 800, color: '#888', py: 2 } }}>
                <TableCell>TÁC GIẢ</TableCell>
                <TableCell>TIỂU SỬ</TableCell>
                <TableCell align="center">NỔI BẬT</TableCell>
                <TableCell align="center">HÀNH ĐỘNG</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [1, 2, 3].map(i => (
                <TableRow key={i}><TableCell colSpan={4} sx={{ p: 0 }}><Skeleton height={56} /></TableCell></TableRow>
              )) : authors.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Không tìm thấy tác giả nào</Typography>
                </TableCell></TableRow>
              ) : authors.map(author => (
                <TableRow key={author.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={author.avatarUrl} sx={{ width: 40, height: 40, bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 700 }}>
                        {author.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700} color="#1a1a2e">{author.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {author.biography || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleToggleFeatured(author.id)} color={author.isFeatured ? 'warning' : 'default'}>
                      {author.isFeatured ? <Star /> : <StarBorder />}
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(author)} color="primary"><Edit sx={{ fontSize: 18 }} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Button size="small" disabled={page === 0} onClick={() => setPage(p => p - 1)} sx={{ textTransform: 'none' }}>Trước</Button>
            <Chip label={`${page + 1} / ${totalPages}`} size="small" sx={{ fontWeight: 700 }} />
            <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} sx={{ textTransform: 'none' }}>Sau</Button>
          </Box>
        )}
      </Paper>

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography fontWeight={900}>{editId ? 'Chỉnh sửa Tác giả' : 'Thêm Tác giả Mới'}</Typography>
          <IconButton size="small" onClick={() => setOpenDialog(false)}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth size="small" label="Tên tác giả *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          {/* Upload ảnh đại diện */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1}>ẢNH ĐẠI DIỆN</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {form.avatarUrl ? (
                <Box sx={{ position: 'relative' }}>
                  <Avatar src={form.avatarUrl} sx={{ width: 80, height: 80, border: '2px solid #e0e0e0' }} />
                  <IconButton size="small" onClick={() => setForm({ ...form, avatarUrl: '' })}
                    sx={{ position: 'absolute', top: -6, right: -6, bgcolor: '#fff', border: '1px solid #eee', width: 22, height: 22, '&:hover': { bgcolor: '#ffebee' } }}>
                    <DeleteOutline sx={{ fontSize: 14, color: '#d32f2f' }} />
                  </IconButton>
                </Box>
              ) : (
                <Box onClick={() => avatarInputRef.current?.click()}
                  sx={{ width: 80, height: 80, border: '2px dashed #ccc', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', bgcolor: '#f9fafb', '&:hover': { borderColor: '#1976d2' } }}>
                  <AddPhotoAlternate sx={{ fontSize: 24, color: '#aaa' }} />
                  <Typography variant="caption" sx={{ color: '#aaa', fontSize: 9 }}>Tải ảnh</Typography>
                </Box>
              )}
              {!form.avatarUrl && (
                <Button variant="outlined" size="small" onClick={() => avatarInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Chọn ảnh</Button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
            </Box>
          </Box>
          <TextField fullWidth size="small" label="Tiểu sử" value={form.biography} multiline rows={3}
            onChange={e => setForm({ ...form, biography: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#888' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2, px: 3, bgcolor: '#1976d2' }}>
            {editId ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
