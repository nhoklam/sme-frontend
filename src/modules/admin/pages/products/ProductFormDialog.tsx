import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Button, Grid as Grid, TextField,
    Select, MenuItem, FormControl, Switch,
    InputAdornment, Alert, IconButton, Tooltip,
    Skeleton, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import {
    Save, InfoOutlined, AddPhotoAlternate,
    DeleteOutline, StarOutline, QrCodeScanner, Close,
    Inventory, BrandingWatermark, Sell, Description, PhotoLibrary
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import productService from '../../../../services/productService';
import categoryService from '../../../../services/categoryService';
import supplierService from '../../../../services/supplierService';
import toast from 'react-hot-toast';
import { Category, Supplier, UpdateProductRequest, CreateProductRequest } from '../../../../types';
import JsBarcode from 'jsbarcode';

const fmt = (n?: number) =>
    n == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const UNIT_OPTIONS = ['Cuốn', 'Bộ', 'Tập', 'Hộp', 'Gói'];

const FieldLabel = ({ label, required, hint }: { label: string; required?: boolean; hint?: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
        <Typography variant="body2" fontWeight={700} color="#334155" fontSize={12.5}>
            {label}
            {required && <Typography component="span" color="#ef4444"> *</Typography>}
        </Typography>
        {hint && (
            <Tooltip title={hint} arrow placement="top">
                <InfoOutlined sx={{ fontSize: 14, color: '#94a3b8', cursor: 'help' }} />
            </Tooltip>
        )}
    </Box>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
        <Box sx={{ display: 'flex', p: 0.75, borderRadius: 1.5, bgcolor: '#eff6ff', color: '#2563eb' }}>
            <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="subtitle2" fontWeight={800} color="#1e293b" letterSpacing="0.5px" sx={{ textTransform: 'uppercase', fontSize: 11 }}>
            {title}
        </Typography>
    </Box>
);

const MultiImageUploader = ({ imageUrls, onChange }: { imageUrls: string[]; onChange: (urls: string[]) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');

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
            setUploadError(err.response?.data?.message || err.message || 'Upload thất bại');
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

    return (
        <Box>
            <FieldLabel label="Ảnh sản phẩm" hint="Ảnh đầu tiên sẽ là ảnh đại diện chính." />
            {uploadError && <Alert severity="error" sx={{ mb: 1.5, py: 0, fontSize: 12 }}>{uploadError}</Alert>}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {imageUrls.map((url, idx) => (
                    <Box key={url + idx} sx={{ position: 'relative', width: 90, height: 120 }}>
                        <Box component="img" src={url} alt="img"
                            sx={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 2, border: idx === 0 ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0', bgcolor: '#f8fafc' }} />
                        <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => onChange(imageUrls.filter((_, i) => i !== idx))}
                                sx={{ bgcolor: 'rgba(255,255,255,0.9)', width: 22, height: 22, boxShadow: 1, color: '#ef4444', '&:hover': { bgcolor: '#ef4444', color: '#fff' } }}>
                                <DeleteOutline sx={{ fontSize: 14 }} />
                            </IconButton>
                            {idx !== 0 && (
                                <IconButton size="small" onClick={() => handleSetPrimary(idx)}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', width: 22, height: 22, boxShadow: 1, color: '#2563eb', '&:hover': { bgcolor: '#2563eb', color: '#fff' } }}>
                                    <StarOutline sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                        </Box>
                        {idx === 0 && <Typography variant="caption" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: '#2563eb', color: '#fff', textAlign: 'center', fontSize: 9, py: 0.25, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, fontWeight: 700 }}>ẢNH CHÍNH</Typography>}
                    </Box>
                ))}
                <Box onClick={() => !uploading && inputRef.current?.click()}
                    sx={{
                        width: 90, height: 120, border: '2px dashed #cbd5e1', borderRadius: 2,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: uploading ? 'wait' : 'pointer', bgcolor: '#f8fafc', transition: '0.2s',
                        '&:hover': { borderColor: '#2563eb', bgcolor: '#fff' }, position: 'relative'
                    }}>
                    {uploading ? <CircularProgress size={24} /> : <AddPhotoAlternate sx={{ fontSize: 24, color: '#94a3b8' }} />}
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10, mt: 1 }}>{uploading ? 'Đang tải...' : 'Thêm ảnh'}</Typography>
                    {uploading && progress > 0 && <LinearProgress variant="determinate" value={progress} sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2 }} />}
                    <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { const files = e.target.files; if (files?.length) doUpload(files); }} />
                </Box>
            </Box>
        </Box>
    );
};

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productId?: string;
}

const INITIAL_FORM = {
    name: '', isbnBarcode: '', sku: '', categoryId: '', supplierId: '',
    description: '', retailPrice: '' as string | number, wholesalePrice: '' as string | number,
    imageUrls: [] as string[], unit: 'Cuốn', weight: '' as string | number, isActive: true,
};

const ProductFormDialog: React.FC<Props> = ({ open, onClose, onSuccess, productId }) => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!open) return;
        let buffer = '';
        let lastTime = Date.now();
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const now = Date.now();
            if (now - lastTime > 60) buffer = '';
            lastTime = now;
            if (e.key === 'Enter') {
                if (buffer.length >= 3) { setForm(f => ({ ...f, isbnBarcode: buffer })); toast.success(`Đã quét mã: ${buffer}`); }
                buffer = '';
            } else if (e.key.length === 1) buffer += e.key;
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open]);

    const loadMeta = useCallback(async () => {
        try {
            const [cats, supsPage] = await Promise.all([categoryService.getAll(), supplierService.getAll()]);
            setCategories(cats);
            setSuppliers(supsPage.content ?? []);
        } catch { }
    }, []);

    const loadProduct = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const p = await productService.getById(id);
            setForm({
                name: p.name ?? '', isbnBarcode: p.isbnBarcode ?? '', sku: p.sku ?? '',
                categoryId: p.categoryId ?? '', supplierId: p.supplierId ?? '',
                description: p.description ?? '', retailPrice: p.retailPrice ?? '', wholesalePrice: p.wholesalePrice ?? '',
                imageUrls: p.imageUrls?.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
                unit: p.unit ?? 'Cuốn', weight: p.weight ?? '', isActive: p.isActive ?? true,
            });
        } catch { setErrorMsg('Không thể tải dữ liệu sản phẩm'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (open) {
            loadMeta();
            if (productId) loadProduct(productId);
            else setForm(INITIAL_FORM);
            setErrors({}); setErrorMsg('');
        }
    }, [open, productId, loadMeta, loadProduct]);

    const set = (field: string) => (e: any) => {
        const val = e?.target !== undefined ? e.target.value : e;
        setForm(f => ({ ...f, [field]: val }));
        if (errors[field]) setErrors(er => { const n = { ...er }; delete n[field]; return n; });
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = 'Tên không được để trống';
        if (!form.categoryId) errs.categoryId = 'Vui lòng chọn danh mục';
        if (!form.retailPrice || Number(form.retailPrice) <= 0) errs.retailPrice = 'Giá bán lẻ phải là số dương';
        if (!productId && !form.isbnBarcode.trim()) errs.isbnBarcode = 'Vui lòng nhập/quét mã vạch';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true); setErrorMsg('');
        try {
            const retailPrice = Number(form.retailPrice);
            const wholesalePrice = form.wholesalePrice !== '' ? Number(form.wholesalePrice) : undefined;
            const weight = form.weight !== '' ? Number(form.weight) : undefined;
            if (productId) {
                const payload: UpdateProductRequest = {
                    name: form.name.trim(), categoryId: form.categoryId, supplierId: form.supplierId || null, hasSupplierId: true,
                    isbnBarcode: form.isbnBarcode.trim(), sku: form.sku?.trim() || undefined, description: form.description?.trim() || undefined,
                    retailPrice, wholesalePrice, imageUrls: form.imageUrls, unit: form.unit, weight, isActive: form.isActive,
                };
                await productService.update(productId, payload);
                toast.success('Cập nhật thành công');
            } else {
                const payload: CreateProductRequest = {
                    name: form.name.trim(), categoryId: form.categoryId, supplierId: form.supplierId || undefined,
                    isbnBarcode: form.isbnBarcode.trim(), sku: form.sku?.trim() || undefined, description: form.description?.trim() || undefined,
                    retailPrice, wholesalePrice, imageUrls: form.imageUrls, unit: form.unit, weight,
                };
                await productService.create(payload);
                toast.success('Thêm sản phẩm thành công');
            }
            onSuccess(); onClose();
        } catch (e: any) { setErrorMsg(e.response?.data?.message || e.message || 'Thao tác thất bại'); }
        finally { setSaving(false); }
    };

    const inputStyles = {
        '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13, bgcolor: '#fff', '&:hover fieldset': { borderColor: '#2563eb' } },
        '& .MuiInputBase-input': { py: 1.25 }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 3, borderBottom: '1px solid #f1f5f9' }}>
                <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ letterSpacing: '-0.5px' }}>{productId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</Typography>
                    <Typography variant="caption" color="#64748b">{productId ? `ID: ${productId}` : 'Điền thông tin để tạo hàng hóa mới'}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ bgcolor: '#f1f5f9' }}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
                {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={32} thickness={5} sx={{ color: '#2563eb' }} /><Typography variant="body2" color="text.secondary" mt={2}>Đang tải dữ liệu...</Typography></Box> : (
                    <Box>
                        {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

                        <Grid container spacing={3}>
                            {/* CỘT TRÁI: THÔNG TIN CHÍNH */}
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
                                    <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <SectionHeader icon={BrandingWatermark} title="Thông tin cơ bản" />
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <FieldLabel label="Tên sản phẩm" required />
                                                <TextField fullWidth size="small" placeholder="VD: Sách Đắc Nhân Tâm..." value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} sx={inputStyles} />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <FieldLabel label="Danh mục" required />
                                                <FormControl fullWidth size="small" error={!!errors.categoryId} sx={inputStyles}>
                                                    <Select value={form.categoryId} onChange={set('categoryId')} displayEmpty>
                                                        <MenuItem value="" disabled>— Chọn danh mục —</MenuItem>
                                                        {categories.map(c => <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13 }}>{c.name}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <FieldLabel label="Nhà cung cấp / NXB" />
                                                <FormControl fullWidth size="small" sx={inputStyles}>
                                                    <Select value={form.supplierId} onChange={set('supplierId')} displayEmpty>
                                                        <MenuItem value="">— Tùy chọn —</MenuItem>
                                                        {suppliers.map(s => <MenuItem key={s.id} value={s.id} sx={{ fontSize: 13 }}>{s.name}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* PHẦN 2: MÃ VÀ ĐỊNH DANH */}
                                    <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <SectionHeader icon={QrCodeScanner} title="Mã nhận diện" />
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <FieldLabel label="ISBN-13 / Barcode" required hint="Quét hoặc nhập tay mã vạch" />
                                                <TextField fullWidth size="small" value={form.isbnBarcode} onChange={set('isbnBarcode')} error={!!errors.isbnBarcode} helperText={errors.isbnBarcode} sx={inputStyles}
                                                    InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeScanner sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment> }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <FieldLabel label="SKU (Mã nội bộ)" hint="Mã tự quản lý trong kho" />
                                                <TextField fullWidth size="small" placeholder="VD: VH-001" value={form.sku} onChange={set('sku')} sx={inputStyles} />
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* PHẦN 3: GIÁ VÀ ĐƠN VỊ */}
                                    <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <SectionHeader icon={Sell} title="Giá bán & Đơn vị" />
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <FieldLabel label="Giá bán lẻ" required />
                                                <TextField fullWidth size="small" type="number" value={form.retailPrice} onChange={set('retailPrice')} error={!!errors.retailPrice} helperText={errors.retailPrice} sx={inputStyles}
                                                    InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" fontWeight={700} color="#94a3b8">₫</Typography></InputAdornment> }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <FieldLabel label="Giá bán sỉ" />
                                                <TextField fullWidth size="small" type="number" value={form.wholesalePrice} onChange={set('wholesalePrice')} sx={inputStyles}
                                                    InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" fontWeight={700} color="#94a3b8">₫</Typography></InputAdornment> }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <FieldLabel label="Đơn vị tính" />
                                                <FormControl fullWidth size="small" sx={inputStyles}>
                                                    <Select value={form.unit} onChange={set('unit')}>
                                                        {UNIT_OPTIONS.map(u => <MenuItem key={u} value={u} sx={{ fontSize: 13 }}>{u}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* CỘT PHẢI: MEDIA & TRẠNG THÁI */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {/* PHẦN 4: HÌNH ẢNH */}
                                    <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <SectionHeader icon={PhotoLibrary} title="Media" />
                                        <MultiImageUploader imageUrls={form.imageUrls} onChange={urls => setForm(f => ({ ...f, imageUrls: urls }))} />
                                    </Box>

                                    {/* PHẦN 5: MÔ TẢ */}
                                    <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                        <SectionHeader icon={Description} title="Mô tả" />
                                        <TextField fullWidth multiline rows={4} size="small" placeholder="Nhập mô tả sản phẩm..." value={form.description} onChange={set('description')} sx={inputStyles} />
                                    </Box>

                                    {/* PHẦN 6: BARCODE PREVIEW */}
                                    {form.isbnBarcode && (
                                        <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <SectionHeader icon={QrCodeScanner} title="Mã vạch xem trước" />
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px dashed #e2e8f0' }}>
                                                <canvas
                                                    ref={(el) => {
                                                        if (el && form.isbnBarcode) {
                                                            try {
                                                                JsBarcode(el, form.isbnBarcode, {
                                                                    width: 2, height: 40, displayValue: true,
                                                                    fontSize: 12, margin: 5, background: 'transparent',
                                                                });
                                                            } catch { }
                                                        }
                                                    }}
                                                />
                                            </Box>

                                        </Box>
                                    )}

                                    {/* PHẦN 7: TRẠNG THÁI (Chỉ khi Edit) */}
                                    {productId && (
                                        <Box sx={{ p: 2, bgcolor: form.isActive ? '#f0fdf4' : '#fff1f2', borderRadius: 3, border: '1px solid', borderColor: form.isActive ? '#bbf7d0' : '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={800} color={form.isActive ? '#16a34a' : '#e11d48'}>{form.isActive ? 'ĐANG KINH DOANH' : 'NGỪNG KINH DOANH'}</Typography>
                                                <Typography variant="caption" color="text.secondary">Trạng thái hiển thị POS</Typography>
                                            </Box>
                                            <Switch checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} color="success" />
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#fff', borderTop: '1px solid #f1f5f9', gap: 1 }}>
                <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b', borderRadius: 2, px: 3 }}>Hủy bỏ</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving || loading} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                    sx={{ textTransform: 'none', fontWeight: 800, px: 4, py: 1.25, bgcolor: '#2563eb', borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    {saving ? 'Đang lưu...' : (productId ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductFormDialog;
