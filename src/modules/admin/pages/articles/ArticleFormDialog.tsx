import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Typography, IconButton, CircularProgress, LinearProgress } from '@mui/material';
import { AddPhotoAlternate, DeleteOutline } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../../services/axiosConfig';
import articleService, { CreateArticleRequest, UpdateArticleRequest } from '../../../../services/articleService';

const SingleImageUploader = ({ imageUrl, onChange }: { imageUrl: string; onChange: (url: string) => void }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const doUpload = async (files: FileList | File[]) => {
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
        if (validFiles.length === 0) return alert('Chỉ chấp nhận file ảnh và tối đa 10MB');
        setUploading(true); setProgress(10);
        try {
            const form = new FormData();
            form.append('file', validFiles[0]);
            const res = await axiosInstance.post('/upload/image', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => { if (e.total) setProgress(10 + Math.round((e.loaded / e.total) * 85)); },
            });
            const url = res.data?.data?.url ?? res.data?.url ?? '';
            if (url) onChange(url);
            setProgress(100);
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Upload thất bại');
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 800);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <Box>
            <Typography variant="body2" fontWeight={700} color="#334155" fontSize={12.5} mb={0.75}>Ảnh bìa bài viết</Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
                {imageUrl && (
                    <Box sx={{ position: 'relative', width: 140, height: 105 }}>
                        <Box component="img" src={imageUrl} alt="img"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2, border: '1.5px solid #e2e8f0', bgcolor: '#f8fafc' }} />
                        <IconButton size="small" onClick={() => onChange('')}
                            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)', width: 22, height: 22, boxShadow: 1, color: '#ef4444', '&:hover': { bgcolor: '#ef4444', color: '#fff' } }}>
                            <DeleteOutline sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                )}
                <Box onClick={() => !uploading && inputRef.current?.click()}
                    sx={{
                        width: 140, height: 105, border: '2px dashed #cbd5e1', borderRadius: 2,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: uploading ? 'wait' : 'pointer', bgcolor: '#f8fafc', transition: '0.2s',
                        '&:hover': { borderColor: '#2563eb', bgcolor: '#fff' }, position: 'relative'
                    }}>
                    {uploading ? <CircularProgress size={24} /> : <AddPhotoAlternate sx={{ fontSize: 24, color: '#94a3b8' }} />}
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10, mt: 1 }}>{uploading ? 'Đang tải...' : 'Thêm ảnh bìa'}</Typography>
                    {uploading && progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2 }} />}
                    <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const files = e.target.files; if (files?.length) doUpload(files); }} />
                </Box>
            </Box>
        </Box>
    );
};

interface ArticleFormDialogProps {
    open: boolean;
    onClose: () => void;
    articleId: string | null;
}

const ArticleFormDialog: React.FC<ArticleFormDialogProps> = ({ open, onClose, articleId }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<CreateArticleRequest>({
        title: '',
        slug: '',
        content: '',
        coverImage: '',
        authorName: '',
        type: 'TIN_TUC',
        isActive: true
    });

    useEffect(() => {
        if (open && articleId) {
            // Fetch article details
            articleService.getById(articleId).then(data => {
                setFormData({
                    title: data.title,
                    slug: data.slug,
                    content: data.content,
                    coverImage: data.coverImage,
                    authorName: data.authorName,
                    type: data.type,
                    isActive: data.isActive
                });
            });
        } else if (open && !articleId) {
            // Reset form
            setFormData({
                title: '',
                slug: '',
                content: '',
                coverImage: '',
                authorName: '',
                type: 'TIN_TUC',
                isActive: true
            });
        }
    }, [open, articleId]);

    const mutation = useMutation({
        mutationFn: (data: any) => articleId ? articleService.update(articleId, data) : articleService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_articles'] });
            onClose();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{articleId ? 'Cập nhật bài viết' : 'Thêm bài viết mới'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField 
                            label="Tiêu đề" 
                            fullWidth 
                            required 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                        />
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField 
                                label="Đường dẫn (Slug) - Để trống để tự tạo" 
                                fullWidth 
                                value={formData.slug} 
                                onChange={e => setFormData({...formData, slug: e.target.value})} 
                            />
                            <FormControl fullWidth>
                                <InputLabel>Loại bài viết</InputLabel>
                                <Select
                                    value={formData.type}
                                    label="Loại bài viết"
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <MenuItem value="TIN_TUC">Tin tức</MenuItem>
                                    <MenuItem value="REVIEW_SACH">Review Sách</MenuItem>
                                    <MenuItem value="GIOI_THIEU">Giới thiệu</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 4 }}>
                            <Box sx={{ flex: 1 }}>
                                <SingleImageUploader 
                                    imageUrl={formData.coverImage} 
                                    onChange={url => setFormData({...formData, coverImage: url})} 
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <TextField 
                                    label="Tác giả" 
                                    fullWidth 
                                    value={formData.authorName} 
                                    onChange={e => setFormData({...formData, authorName: e.target.value})} 
                                />
                            </Box>
                        </Box>

                        <TextField 
                            label="Nội dung bài viết (Hỗ trợ mã HTML)" 
                            fullWidth 
                            required 
                            multiline 
                            rows={10} 
                            value={formData.content} 
                            onChange={e => setFormData({...formData, content: e.target.value})} 
                        />

                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={formData.isActive} 
                                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                                />
                            }
                            label="Hiển thị bài viết"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit">Hủy</Button>
                    <Button type="submit" variant="contained" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Đang lưu...' : 'Lưu lại'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ArticleFormDialog;
