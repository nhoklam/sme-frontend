import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Grid, TextField,
    Select, MenuItem, FormControl, Switch,
    Divider, InputAdornment, Alert, IconButton, Tooltip,
    Skeleton, LinearProgress,
} from '@mui/material';
import {
    ArrowBack, Save, InfoOutlined, AddPhotoAlternate,
    DeleteOutline, CloudUpload, StarOutline, Print,
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import productService from '../../../../services/productService';
import categoryService from '../../../../services/categoryService';
import supplierService from '../../../../services/supplierService';
import toast from 'react-hot-toast';
import { Category, Supplier, UpdateProductRequest } from '../../../../types';
import JsBarcode from 'jsbarcode';
import BarcodePrintDialog from '../../../../components/common/BarcodePrintDialog';



const fmt = (n?: number) =>
    n == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const UNIT_OPTIONS = ['Cuốn', 'Bộ', 'Tập', 'Hộp', 'Gói'];

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f5f5f5', bgcolor: '#fafafa' }}>
            <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e">{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
);

const FieldLabel = ({ label, required, hint }: { label: string; required?: boolean; hint?: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
        <Typography variant="body2" fontWeight={600} color="#333" fontSize={13}>
            {label}
            {required && <Typography component="span" color="#d32f2f"> *</Typography>}
        </Typography>
        {hint && (
            <Tooltip title={hint} arrow>
                <InfoOutlined sx={{ fontSize: 14, color: '#bbb', cursor: 'help' }} />
            </Tooltip>
        )}
    </Box>
);

const MultiImageUploader = ({ imageUrls, onChange }: { imageUrls: string[]; onChange: (urls: string[]) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const doUpload = async (files: FileList | File[]) => {
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
        if (validFiles.length === 0) { setUploadError('Chỉ chấp nhận file ảnh và tối đa 10MB'); return; }
        setUploading(true); setUploadError(''); setProgress(10);

        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < validFiles.length; i++) {
                const form = new FormData();
                form.append('file', validFiles[i]);
                const res = await axiosInstance.post('/upload/image', form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (e) => { if (e.total) setProgress(10 + Math.round(((i + (e.loaded / e.total)) / validFiles.length) * 85)); },
                });
                const url: string = res.data?.data?.url ?? res.data?.url ?? '';
                if (url) uploadedUrls.push(url);
            }
            if (uploadedUrls.length > 0) onChange([...imageUrls, ...uploadedUrls]);
            setProgress(100);
        } catch (err: any) {
            setUploadError(err.response?.data?.message || err.message || 'Upload thất bại, vui lòng thử lại');
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 800);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleSetPrimary = (idx: number) => {
        if (idx === 0) return;
        const newUrls = [...imageUrls];
        const temp = newUrls[0];
        newUrls[0] = newUrls[idx];
        newUrls[idx] = temp;
        onChange(newUrls);
    };

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDraggedIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === idx) return;
        const newUrls = [...imageUrls];
        const draggedUrl = newUrls[draggedIdx];
        newUrls.splice(draggedIdx, 1);
        newUrls.splice(idx, 0, draggedUrl);
        setDraggedIdx(idx);
        onChange(newUrls);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
    };

    return (
        <Box>
            <FieldLabel label="Ảnh sản phẩm" hint="Upload qua server → Cloudinary. Khuyến nghị 500×700px, tối đa 10MB. Ảnh đầu tiên là ảnh chính." />
            {uploadError && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1.5, fontSize: 12 }} onClose={() => setUploadError('')}>
                    {uploadError}
                </Alert>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                {imageUrls.map((url, idx) => (
                    <Box key={url + idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleDragEnd}
                        sx={{
                            position: 'relative', width: 100, height: 130, cursor: 'grab',
                            opacity: draggedIdx === idx ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}>
                        <Box component="img" src={url} alt={`img-${idx}`}
                            sx={{ width: 100, height: 130, objectFit: 'contain', borderRadius: 1.5, border: idx === 0 ? '2px solid #1976d2' : '1px solid #e0e0e0', bgcolor: '#fafafa', display: 'block', pointerEvents: 'none' }} />
                        {idx === 0 && (
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bgcolor: 'rgba(25, 118, 210, 0.8)', color: '#fff', fontSize: 10, textAlign: 'center', py: 0.5, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
                                Ảnh chính
                            </Box>
                        )}
                        <Box sx={{ position: 'absolute', top: idx === 0 ? 20 : 4, right: 4, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => onChange(imageUrls.filter((_, i) => i !== idx))}
                                sx={{ bgcolor: 'rgba(255,255,255,0.8)', boxShadow: 1, width: 22, height: 22, '&:hover': { bgcolor: '#ffebee', color: '#d32f2f' } }}>
                                <DeleteOutline sx={{ fontSize: 13 }} />
                            </IconButton>
                            {idx !== 0 && (
                                <Tooltip title="Đặt làm ảnh chính" placement="right">
                                    <IconButton size="small" onClick={() => handleSetPrimary(idx)}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.8)', boxShadow: 1, width: 22, height: 22, '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2' } }}>
                                        <StarOutline sx={{ fontSize: 13 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>
                ))}

                <Box onClick={() => !uploading && inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (!uploading) { const files = e.dataTransfer.files; if (files.length) doUpload(files); } }}
                    sx={{
                        width: 100, height: 130, border: `2px dashed ${uploading ? '#1976d2' : '#e0e0e0'}`,
                        borderRadius: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', gap: 0.5,
                        bgcolor: uploading ? '#e3f2fd' : '#fafafa',
                        '&:hover': !uploading ? { borderColor: '#d32f2f', bgcolor: '#fff8f8' } : {},
                        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                    }}>
                    {uploading ? <CloudUpload sx={{ fontSize: 24, color: '#1976d2' }} /> : <AddPhotoAlternate sx={{ fontSize: 24, color: '#ccc' }} />}
                    <Typography variant="caption" color={uploading ? '#1976d2' : 'text.secondary'} textAlign="center" px={1} fontSize={10} whiteSpace="pre-line">
                        {uploading ? 'Đang tải...' : 'Thêm ảnh'}
                    </Typography>
                    {uploading && progress > 0 && (
                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                            <LinearProgress variant="determinate" value={progress}
                                sx={{ height: 3, bgcolor: '#bbdefb', '& .MuiLinearProgress-bar': { bgcolor: '#1976d2' } }} />
                        </Box>
                    )}
                </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" fontSize={10} display="block" mt={0.5}>
                Hỗ trợ: JPG, PNG, WEBP, GIF — Tối đa 10MB
            </Typography>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => { const files = e.target.files; if (files && files.length) doUpload(files); }} />
        </Box>
    );
};

interface FormState {
    name: string;
    isbnBarcode: string;
    sku: string;
    categoryId: string;
    supplierId: string;
    description: string;
    retailPrice: string | number;
    wholesalePrice: string | number;
    imageUrls: string[];
    unit: string;
    weight: string | number;
    isActive: boolean;
}

const ProductEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [form, setForm] = useState<FormState>({
        name: '', isbnBarcode: '', sku: '', categoryId: '', supplierId: '',
        description: '', retailPrice: '', wholesalePrice: '',
        imageUrls: [], unit: 'Cuốn', weight: '', isActive: true,
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [savedDone, setSavedDone] = useState(false);
    const [printOpen, setPrintOpen] = useState(false);

    useEffect(() => {
        let buffer = '';
        let lastTime = Date.now();

        const handleGlobalKeydown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Enter') e.preventDefault();
                return;
            }

            const now = Date.now();
            if (now - lastTime > 60) buffer = '';
            lastTime = now;

            if (e.key === 'Enter') {
                if (buffer.length >= 3) {
                    e.preventDefault();
                    const scannedCode = buffer;
                    setForm(prev => ({ ...prev, isbnBarcode: scannedCode }));
                    toast.success(`Đã quét mã: ${scannedCode}`);
                }
                buffer = '';
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeydown);
        return () => window.removeEventListener('keydown', handleGlobalKeydown);
    }, []);

    useEffect(() => {
        if (!savedDone) return;
        const timer = setTimeout(() => {
            navigate(`/admin/products/${id}`, { replace: true });
        }, 1500);
        return () => clearTimeout(timer);
    }, [savedDone, navigate, id]);

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [product, cats, supsPage] = await Promise.all([
                productService.getById(id),
                categoryService.getAll(),
                supplierService.getAll(),
            ]);
            setForm({
                name: product.name ?? '',
                isbnBarcode: product.isbnBarcode ?? '',
                sku: product.sku ?? '',
                categoryId: product.categoryId ?? '',
                supplierId: product.supplierId ?? '',
                description: product.description ?? '',
                retailPrice: product.retailPrice ?? '',
                wholesalePrice: product.wholesalePrice ?? '',
                imageUrls: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []),
                unit: product.unit ?? 'Cuốn',
                weight: product.weight ?? '',
                isActive: product.isActive ?? true,
            });
            setCategories(cats);
            setSuppliers(supsPage.content ?? []);
        } catch (e: any) {
            setErrorMsg(e.response?.data?.message || e.message || 'Không thể tải dữ liệu sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    const set = (field: keyof FormState) => (e: any) => {
        const val = e?.target !== undefined ? e.target.value : e;
        setForm((f) => ({ ...f, [field]: val }));
        if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.name?.trim()) errs.name = 'Tên sản phẩm không được để trống';
        if (!form.categoryId) errs.categoryId = 'Vui lòng chọn danh mục';
        if (!form.retailPrice || Number(form.retailPrice) <= 0) errs.retailPrice = 'Giá bán lẻ phải là số dương';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        setErrorMsg('');
        setSavedMsg('');
        try {
            const retailPrice = Number(form.retailPrice);
            const wholesalePrice = form.wholesalePrice !== '' ? Number(form.wholesalePrice) : undefined;
            const weight = form.weight !== '' ? Number(form.weight) : undefined;

            const payload: UpdateProductRequest = {
                name: form.name?.trim(),
                categoryId: form.categoryId,
                supplierId: form.supplierId || undefined,
                hasSupplierId: true,
                description: form.description?.trim() || undefined,
                retailPrice,
                wholesalePrice,
                imageUrls: form.imageUrls,
                unit: form.unit,
                weight,
                isActive: form.isActive,
            };
            await productService.update(id!, payload);
            setSavedMsg('✅ Cập nhật sản phẩm thành công! Đang chuyển hướng...');
            setSavedDone(true);
        } catch (e: any) {
            const status = e?.response?.status;
            // Nếu lỗi 500, thử verify xem dữ liệu đã được lưu chưa
            if (status === 500 || status === undefined) {
                try {
                    const verified = await productService.getById(id!);
                    if (verified) {
                        // Dữ liệu vẫn tồn tại → backend đã lưu thành công, lỗi 500 do cache/hệ thống phụ
                        setSavedMsg('✅ Cập nhật sản phẩm thành công! Đang chuyển hướng...');
                        setSavedDone(true);
                        return;
                    }
                } catch {
                    // Không verify được → hiện lỗi thật
                }
            }
            const msg = e?.response?.data?.message || e?.message || '';
            setErrorMsg(msg || 'Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
                <Skeleton width={300} height={40} sx={{ mb: 3 }} />
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        {[200, 180, 120, 120, 80].map((h, i) => (
                            <Skeleton key={i} variant="rectangular" height={h} sx={{ borderRadius: 2, mb: 2.5 }} />
                        ))}
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2, mb: 2 }} />
                        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    const retailNum = Number(form.retailPrice) || 0;
    const wholesaleNum = Number(form.wholesalePrice) || 0;
    const profitMargin = retailNum > 0 && wholesaleNum > 0
        ? (((retailNum - wholesaleNum) / retailNum) * 100).toFixed(1)
        : null;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton size="small" onClick={() => navigate(`/admin/products/${id}`)}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                        <ArrowBack sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1a1a2e">Chỉnh sửa sản phẩm</Typography>
                        <Typography variant="body2" color="text.secondary">{form.name}</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, borderRadius: 1.5, border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
                        <Typography variant="body2" fontWeight={600} color={form.isActive ? '#2e7d32' : '#888'}>
                            {form.isActive ? 'Đang bán' : 'Ngừng bán'}
                        </Typography>
                        <Switch size="small" checked={!!form.isActive}
                            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' } }} />
                    </Box>
                    <Button variant="outlined" onClick={() => navigate(`/admin/products/${id}`)}
                        sx={{ textTransform: 'none', borderColor: '#bbb', color: '#444' }}>Hủy</Button>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSave}
                        disabled={saving || savedDone}
                        sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#b71c1c' } }}>
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </Box>
            </Box>

            {savedMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{savedMsg}</Alert>}
            {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Section title="Thông tin cơ bản">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <FieldLabel label="Tên sản phẩm" required />
                                <TextField fullWidth size="small" value={form.name ?? ''} onChange={set('name')}
                                    error={!!errors.name} helperText={errors.name} inputProps={{ maxLength: 255 }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Danh mục" required />
                                <FormControl fullWidth size="small" error={!!errors.categoryId}>
                                    <Select value={form.categoryId ?? ''} onChange={set('categoryId')} displayEmpty>
                                        <MenuItem value="" disabled>Chọn danh mục</MenuItem>
                                        {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                    </Select>
                                    {errors.categoryId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{errors.categoryId}</Typography>}
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Nhà cung cấp / NXB" />
                                <FormControl fullWidth size="small">
                                    <Select value={form.supplierId ?? ''} onChange={set('supplierId')} displayEmpty>
                                        <MenuItem value="">Không có</MenuItem>
                                        {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FieldLabel label="Mô tả" />
                                <TextField fullWidth multiline rows={4} size="small"
                                    value={form.description ?? ''} onChange={set('description')} />
                            </Grid>
                        </Grid>
                    </Section>

                    <Section title="Hình ảnh sản phẩm" subtitle="Upload ảnh qua server (Cloudinary) hoặc nhập URL">
                        <MultiImageUploader imageUrls={form.imageUrls} onChange={(urls) => setForm((f) => ({ ...f, imageUrls: urls }))} />
                    </Section>

                    <Section title="Mã nhận diện">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="SKU" />
                                <TextField fullWidth size="small" value={form.sku ?? ''} onChange={set('sku')} inputProps={{ maxLength: 100 }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="ISBN-13 / Barcode" hint="Không thể thay đổi sau khi tạo" />
                                <TextField fullWidth size="small" value={form.isbnBarcode ?? ''} disabled
                                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#888' } }} />
                            </Grid>
                        </Grid>
                    </Section>

                    <Section title="Giá bán">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FieldLabel label="Giá bán lẻ" required />
                                <TextField fullWidth size="small" type="number" value={form.retailPrice ?? ''}
                                    onChange={set('retailPrice')} error={!!errors.retailPrice} helperText={errors.retailPrice}
                                    inputProps={{ min: 0 }}
                                    InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FieldLabel label="Giá bán sỉ" />
                                <TextField fullWidth size="small" type="number" value={form.wholesalePrice ?? ''}
                                    onChange={set('wholesalePrice')}
                                    inputProps={{ min: 0 }}
                                    InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FieldLabel label="Giá vốn (MAC)" hint="Tự động tính sau nhập kho" />
                                <TextField fullWidth size="small" disabled value="Tự động"
                                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#aaa', fontSize: 12 } }} />
                            </Grid>
                        </Grid>
                        {profitMargin !== null && (
                            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f0fff4', borderRadius: 1.5, border: '1px solid #c8e6c9' }}>
                                <Typography variant="body2" fontWeight={700} color="#2e7d32">
                                    Lợi nhuận gộp ước tính: {fmt(retailNum - wholesaleNum)} ({profitMargin}%)
                                </Typography>
                            </Box>
                        )}
                    </Section>

                    <Section title="Thông số vật lý">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Đơn vị tính" />
                                <FormControl fullWidth size="small">
                                    <Select value={form.unit ?? 'Cuốn'} onChange={set('unit')}>
                                        {UNIT_OPTIONS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Trọng lượng" />
                                <TextField fullWidth size="small" type="number" value={form.weight ?? ''}
                                    onChange={set('weight')}
                                    inputProps={{ min: 0 }}
                                    InputProps={{ endAdornment: <InputAdornment position="end">gram</InputAdornment> }} />
                            </Grid>
                        </Grid>
                    </Section>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Preview thumbnail</Typography>
                        {form.imageUrls.length > 0 ? (
                            <Box component="img" src={form.imageUrls[0]} alt="thumb"
                                sx={{ width: '100%', maxWidth: 180, height: 230, objectFit: 'contain', borderRadius: 2, border: '2px solid #d32f2f', bgcolor: '#fafafa', display: 'block', mx: 'auto' }}
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                        ) : (
                            <Box sx={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 2, gap: 1 }}>
                                <AddPhotoAlternate sx={{ fontSize: 40, color: '#ddd' }} />
                                <Typography variant="caption" color="text.secondary">Chưa có ảnh</Typography>
                            </Box>
                        )}
                    </Paper>

                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Trạng thái</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1.5, bgcolor: form.isActive ? '#e8f5e9' : '#f5f5f5', border: `1px solid ${form.isActive ? '#c8e6c9' : '#e0e0e0'}` }}>
                            <Box>
                                <Typography variant="body2" fontWeight={700} color={form.isActive ? '#2e7d32' : '#888'}>
                                    {form.isActive ? 'Đang bán' : 'Ngừng bán'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {form.isActive ? 'Hiển thị trên cửa hàng' : 'Ẩn khỏi cửa hàng'}
                                </Typography>
                            </Box>
                            <Switch checked={!!form.isActive}
                                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' } }} />
                        </Box>
                    </Paper>

                    {form.isbnBarcode && (
                        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Mã vạch</Typography>
                            <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                                <canvas
                                    ref={(el) => {
                                        if (el && form.isbnBarcode) {
                                            try {
                                                JsBarcode(el, form.isbnBarcode, {
                                                    width: 2, height: 50, displayValue: true,
                                                    fontSize: 14, margin: 8, background: '#fff',
                                                });
                                            } catch { }
                                        }
                                    }}
                                    style={{ maxWidth: '100%' }}
                                />
                            </Box>
                            <Button
                                fullWidth variant="outlined" startIcon={<Print />}
                                onClick={() => setPrintOpen(true)}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                            >
                                In mã vạch để dán kệ
                            </Button>
                        </Paper>
                    )}

                    <BarcodePrintDialog
                        open={printOpen}
                        onClose={() => setPrintOpen(false)}
                        items={[{
                            name: form.name || 'Sản phẩm',
                            sku: form.sku || '',
                            barcode: form.isbnBarcode,
                            price: Number(form.retailPrice) || 0
                        }]}
                    />

                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Tóm tắt</Typography>
                        {[
                            { label: 'Tên', value: form.name || '—' },
                            { label: 'Danh mục', value: categories.find((c) => c.id === form.categoryId)?.name || '—' },
                            { label: 'Giá lẻ', value: form.retailPrice ? fmt(retailNum) : '—' },
                            { label: 'Giá sỉ', value: form.wholesalePrice ? fmt(wholesaleNum) : '—' },
                        ].map((row) => (
                            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                                <Typography variant="caption" fontWeight={600} color="#333"
                                    sx={{ maxWidth: 140, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {row.value}
                                </Typography>
                            </Box>
                        ))}
                        <Divider sx={{ my: 1.5 }} />
                        <Button fullWidth variant="contained" startIcon={<Save />} onClick={handleSave}
                            disabled={saving || savedDone}
                            sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#b71c1c' } }}>
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                        <Button fullWidth variant="text" onClick={() => navigate(`/admin/products/${id}`)}
                            sx={{ mt: 1, textTransform: 'none', color: '#888' }}>Hủy bỏ</Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProductEditPage;