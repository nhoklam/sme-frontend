import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Card, CardMedia, CardContent, CardActions,
  Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Skeleton, Divider, Alert
} from '@mui/material';
import {
  Add, Edit, Delete, ArrowUpward, ArrowDownward, Image as ImageIcon, Close, Visibility,
  AddPhotoAlternate, DeleteOutline
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import { bannerApi } from '../../../../services/bannerApi';
import authService from '../../../../services/authService';
import { HomeBanner } from '../../../../types';
import toast from 'react-hot-toast';

const BANNER_TYPES = [
  { value: 'HERO_SLIDER', label: 'Slider Trang chủ', color: '#1976d2' },
  { value: 'PROMOTION_BANNER', label: 'Banner Khuyến mãi', color: '#ed6c02' },
  { value: 'CATEGORY_BANNER', label: 'Banner Danh mục', color: '#2e7d32' },
];

const EMPTY_FORM = {
  title: '', imageUrl: '', linkUrl: '', buttonText: '',
  bannerType: 'HERO_SLIDER' as HomeBanner['bannerType'],
  isActive: true, sortOrder: 0
};

export default function BannerListPage() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const user = authService.getCurrentUser()?.user;
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Chỉ chấp nhận file ảnh'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Ảnh tối đa 10MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosInstance.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url: string = (res as any).data?.data?.url ?? (res as any).data?.url ?? '';
      if (url) { setForm(f => ({ ...f, imageUrl: url })); toast.success('Tải ảnh thành công'); }
    } catch { toast.error('Tải ảnh thất bại'); }
    finally { setUploading(false); }
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bannerApi.getActiveBanners();
      setBanners(res.data || []);
    } catch { toast.error('Không thể tải danh sách banner'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpen = (banner?: HomeBanner) => {
    if (banner) {
      setEditId(banner.id);
      setForm({
        title: banner.title || '', imageUrl: banner.imageUrl, linkUrl: banner.linkUrl || '',
        buttonText: banner.buttonText || '', bannerType: banner.bannerType,
        isActive: banner.isActive, sortOrder: banner.sortOrder
      });
    } else {
      setEditId(null);
      setForm({ ...EMPTY_FORM, sortOrder: banners.length });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) { toast.error('Vui lòng tải ảnh banner lên'); return; }
    try {
      if (editId) {
        await bannerApi.updateBanner(editId, form as any);
        toast.success('Cập nhật banner thành công');
      } else {
        await bannerApi.createBanner(form as any);
        toast.success('Thêm banner mới thành công');
      }
      setOpenDialog(false);
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const handleToggle = async (id: string) => {
    try {
      await bannerApi.toggleActiveBanner(id);
      setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
      toast.success('Đã cập nhật trạng thái');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await bannerApi.deleteBanner(confirmDelete);
      toast.success('Đã xóa banner');
      setConfirmDelete(null);
      loadData();
    } catch { toast.error('Xóa thất bại'); }
  };

  const handleMove = async (idx: number, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    [sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]];
    try {
      await bannerApi.reorderBanners(sorted.map(b => b.id));
      loadData();
    } catch { toast.error('Sắp xếp thất bại'); }
  };

  const sortedBanners = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const filtered = filterType === 'ALL' ? sortedBanners : sortedBanners.filter(b => b.bannerType === filterType);

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>
            Quản lý Banner Quảng cáo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý slide ảnh quảng cáo trên trang chủ và các trang phụ của cửa hàng online
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}
            sx={{ bgcolor: '#1976d2', fontWeight: 700, px: 2.5, py: 1, borderRadius: 2, textTransform: 'none', boxShadow: '0 4px 12px rgba(25,118,210,0.2)' }}>
            Thêm Banner
          </Button>
        )}
      </Box>

      {/* Filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip label="Tất cả" onClick={() => setFilterType('ALL')}
          sx={{ fontWeight: 700, bgcolor: filterType === 'ALL' ? '#1976d2' : '#f0f0f0', color: filterType === 'ALL' ? '#fff' : '#555', cursor: 'pointer' }} />
        {BANNER_TYPES.map(t => (
          <Chip key={t.value} label={t.label} onClick={() => setFilterType(t.value)}
            sx={{ fontWeight: 700, bgcolor: filterType === t.value ? t.color : '#f0f0f0', color: filterType === t.value ? '#fff' : '#555', cursor: 'pointer' }} />
        ))}
      </Box>

      {/* Banner Grid */}
      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map(i => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} /></Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '1px solid #f0f0f0' }}>
          <ImageIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
          <Typography color="text.secondary" fontWeight={600}>Chưa có banner nào</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((banner, idx) => (
            <Grid key={banner.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden', opacity: banner.isActive ? 1 : 0.6, transition: 'all 0.2s' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia component="img" height="180" image={banner.imageUrl}
                    sx={{ objectFit: 'cover' }}
                    onError={(e: any) => { e.target.src = 'https://via.placeholder.com/600x300?text=No+Image'; }} />
                  <Chip label={BANNER_TYPES.find(t => t.value === banner.bannerType)?.label || banner.bannerType}
                    size="small" sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 800, fontSize: 10, bgcolor: 'rgba(255,255,255,0.9)', color: BANNER_TYPES.find(t => t.value === banner.bannerType)?.color }} />
                  {!banner.isActive && <Chip label="Đã ẩn" size="small" sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 800, fontSize: 10, bgcolor: '#ffebee', color: '#d32f2f' }} />}
                </Box>
                <CardContent sx={{ pb: 1 }}>
                  <Typography variant="body1" fontWeight={800} color="#1a1a2e" noWrap>{banner.title || '(Không có tiêu đề)'}</Typography>
                  {banner.linkUrl && <Typography variant="caption" color="text.secondary" noWrap display="block">{banner.linkUrl}</Typography>}
                  {banner.buttonText && <Chip label={banner.buttonText} size="small" sx={{ mt: 0.5, height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#e3f2fd', color: '#1976d2' }} />}
                </CardContent>
                <Divider />
                <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Switch size="small" checked={banner.isActive} onChange={() => handleToggle(banner.id)} color="primary" disabled={!isAdmin} />
                    <Typography variant="caption" fontWeight={600} color={banner.isActive ? '#2e7d32' : '#999'}>
                      {banner.isActive ? 'Hiển thị' : 'Ẩn'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    {isAdmin && (
                      <>
                        <IconButton size="small" onClick={() => handleMove(idx, 'up')} disabled={idx === 0}><ArrowUpward sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" onClick={() => handleMove(idx, 'down')} disabled={idx === filtered.length - 1}><ArrowDownward sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" onClick={() => handleOpen(banner)} color="primary"><Edit sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" onClick={() => setConfirmDelete(banner.id)} color="error"><Delete sx={{ fontSize: 16 }} /></IconButton>
                      </>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography fontWeight={900}>{editId ? 'Chỉnh sửa Banner' : 'Thêm Banner Mới'}</Typography>
          <IconButton size="small" onClick={() => setOpenDialog(false)}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField fullWidth size="small" label="Tiêu đề quảng cáo" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>
            <Grid size={12}>
              <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1}>ẢNH BANNER *</Typography>
              {form.imageUrl ? (
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0', height: 160 }}>
                  <img src={form.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => bannerInputRef.current?.click()}
                      sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setForm({ ...form, imageUrl: '' })}
                      sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#ffebee' } }}>
                      <DeleteOutline sx={{ fontSize: 16, color: '#d32f2f' }} />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Box onClick={() => !uploading && bannerInputRef.current?.click()}
                  sx={{ height: 160, border: '2px dashed #ccc', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', bgcolor: '#f9fafb', '&:hover': { borderColor: '#1976d2', bgcolor: '#f0f7ff' } }}>
                  <AddPhotoAlternate sx={{ fontSize: 40, color: '#aaa', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {uploading ? 'Đang tải ảnh...' : 'Click để chọn ảnh banner'}
                  </Typography>
                  <Typography variant="caption" color="#bbb">Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)</Typography>
                </Box>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handleBannerUpload} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="Đường dẫn liên kết" value={form.linkUrl}
                onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="/shop"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="Tên nút bấm (CTA)" value={form.buttonText}
                onChange={e => setForm({ ...form, buttonText: e.target.value })} placeholder="Mua Ngay"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth select size="small" label="Loại banner" value={form.bannerType}
                onChange={e => setForm({ ...form, bannerType: e.target.value as any })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                {BANNER_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="Thứ tự sắp xếp" type="number" value={form.sortOrder}
                onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#888' }}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2, px: 3, bgcolor: '#1976d2' }}>
            {editId ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle><Typography fontWeight={900} color="error">Xác nhận xóa banner?</Typography></DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Hành động này không thể hoàn tác. Banner sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Hủy bỏ</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2 }}>Xóa banner</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
