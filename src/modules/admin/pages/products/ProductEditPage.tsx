import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Grid, TextField,
    Select, MenuItem, FormControl, Switch,
    Divider, InputAdornment, Alert, IconButton, Tooltip,
    Skeleton,
} from '@mui/material';
import { ArrowBack, Save, InfoOutlined, AddPhotoAlternate } from '@mui/icons-material';
import productService from '../../../../services/productService';
import categoryService from '../../../../services/categoryService';
import supplierService from '../../../../services/supplierService';
import { Category, Supplier, UpdateProductRequest } from '../../../../types';

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

const ProductEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [form, setForm] = useState<any>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [product, cats, sups] = await Promise.all([
                productService.getById(id),
                categoryService.getAll(),
                supplierService.getAllSimple(),   // ← fixed: was getAll()
            ]);
            setForm({
                name: product.name,
                isbnBarcode: product.isbnBarcode,
                sku: product.sku ?? '',
                categoryId: product.categoryId,
                supplierId: product.supplierId ?? '',
                description: product.description ?? '',
                retailPrice: product.retailPrice,
                wholesalePrice: product.wholesalePrice ?? '',
                imageUrl: product.imageUrl ?? '',
                unit: product.unit ?? 'Cuốn',
                weight: product.weight ?? '',
                isActive: product.isActive,
            });
            setCategories(cats);
            setSuppliers(sups);
        } catch (e: any) {
            setErrorMsg(e.response?.data?.message || 'Không thể tải dữ liệu sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    const set = (field: string) => (e: any) => {
        const val = e?.target !== undefined ? e.target.value : e;
        setForm((f: any) => ({ ...f, [field]: val }));
        if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.name?.trim()) errs.name = 'Tên sản phẩm không được để trống';
        if (!form.categoryId) errs.categoryId = 'Vui lòng chọn danh mục';
        if (!form.retailPrice || +form.retailPrice <= 0) errs.retailPrice = 'Giá bán lẻ phải là số dương';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        setErrorMsg('');
        try {
            const payload: UpdateProductRequest = {
                name: form.name?.trim(),
                categoryId: form.categoryId,
                supplierId: form.supplierId || undefined,
                hasSupplierId: true,
                description: form.description?.trim() || undefined,
                retailPrice: +form.retailPrice,
                wholesalePrice: form.wholesalePrice ? +form.wholesalePrice : undefined,
                imageUrl: form.imageUrl || undefined,
                unit: form.unit,
                weight: form.weight ? +form.weight : undefined,
                isActive: form.isActive,
            };
            await productService.update(id!, payload);
            setSavedMsg('✅ Cập nhật sản phẩm thành công!');
            setTimeout(() => navigate(`/admin/products/${id}`), 1200);
        } catch (e: any) {
            setErrorMsg(e.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
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
                        {[200, 120, 120, 120, 80].map((h, i) => (
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

    const profitMargin =
        +form.retailPrice > 0 && +form.wholesalePrice > 0
            ? (((+form.retailPrice - +form.wholesalePrice) / +form.retailPrice) * 100).toFixed(1)
            : null;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
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
                            onChange={(e) => setForm((f: any) => ({ ...f, isActive: e.target.checked }))}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' } }}
                        />
                    </Box>
                    <Button variant="outlined" onClick={() => navigate(`/admin/products/${id}`)}
                        sx={{ textTransform: 'none', borderColor: '#bbb', color: '#444' }}>
                        Hủy
                    </Button>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}
                        sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#b71c1c' } }}>
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </Box>
            </Box>

            {savedMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{savedMsg}</Alert>}
            {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

            <Grid container spacing={2.5}>
                {/* CỘT TRÁI */}
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

                    <Section title="Hình ảnh sản phẩm" subtitle="URL ảnh thumbnail hiển thị ở danh sách">
                        <FieldLabel label="URL ảnh" />
                        <TextField fullWidth size="small" value={form.imageUrl ?? ''} onChange={set('imageUrl')}
                            placeholder="https://..." />
                        {form.imageUrl && (
                            <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box component="img" src={form.imageUrl} alt="preview"
                                    sx={{ width: 80, height: 100, objectFit: 'contain', borderRadius: 1.5, border: '1px solid #e0e0e0', bgcolor: '#fafafa' }}
                                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                                />
                                <Typography variant="caption" color="text.secondary">Preview ảnh</Typography>
                            </Box>
                        )}
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
                                    InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FieldLabel label="Giá bán sỉ" />
                                <TextField fullWidth size="small" type="number" value={form.wholesalePrice ?? ''}
                                    onChange={set('wholesalePrice')}
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
                                    Lợi nhuận gộp ước tính: {fmt(+form.retailPrice - +form.wholesalePrice)} ({profitMargin}%)
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
                                    InputProps={{ endAdornment: <InputAdornment position="end">gram</InputAdornment> }} />
                            </Grid>
                        </Grid>
                    </Section>
                </Grid>

                {/* CỘT PHẢI */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Preview */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Preview thumbnail</Typography>
                        {form.imageUrl ? (
                            <Box component="img" src={form.imageUrl} alt="thumb"
                                sx={{ width: '100%', maxWidth: 180, height: 230, objectFit: 'contain', borderRadius: 2, border: '2px solid #d32f2f', bgcolor: '#fafafa', display: 'block', mx: 'auto' }}
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                            />
                        ) : (
                            <Box sx={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 2, gap: 1 }}>
                                <AddPhotoAlternate sx={{ fontSize: 40, color: '#ddd' }} />
                                <Typography variant="caption" color="text.secondary">Chưa có ảnh</Typography>
                            </Box>
                        )}
                    </Paper>

                    {/* Trạng thái */}
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
                                onChange={(e) => setForm((f: any) => ({ ...f, isActive: e.target.checked }))}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' } }}
                            />
                        </Box>
                    </Paper>

                    {/* Nút lưu */}
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>Tóm tắt</Typography>
                        {[
                            { label: 'Tên', value: form.name || '—' },
                            { label: 'Danh mục', value: categories.find((c) => c.id === form.categoryId)?.name || '—' },
                            { label: 'Giá lẻ', value: form.retailPrice ? fmt(+form.retailPrice) : '—' },
                            { label: 'Giá sỉ', value: form.wholesalePrice ? fmt(+form.wholesalePrice) : '—' },
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
                        <Button fullWidth variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}
                            sx={{ bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#b71c1c' } }}>
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                        <Button fullWidth variant="text" onClick={() => navigate(`/admin/products/${id}`)}
                            sx={{ mt: 1, textTransform: 'none', color: '#888' }}>
                            Hủy bỏ
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProductEditPage;