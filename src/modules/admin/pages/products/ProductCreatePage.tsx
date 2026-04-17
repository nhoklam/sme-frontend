import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Grid, TextField,
    Select, MenuItem, FormControl, Switch,
    Divider, InputAdornment, Alert, IconButton, Tooltip,
    Skeleton,
} from '@mui/material';
import {
    ArrowBack, Save, InfoOutlined,
    AddPhotoAlternate, DeleteOutline,
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import productService from '../../../../services/productService';
import categoryService from '../../../../services/categoryService';
import supplierService from '../../../../services/supplierService';
import { Category, Supplier, CreateProductRequest } from '../../../../types';

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const UNIT_OPTIONS = ['Cuốn', 'Bộ', 'Tập', 'Hộp', 'Gói'];

// ── Section wrapper ────────────────────────────────────────────
const Section = ({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) => (
    <Paper
        elevation={0}
        sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden', mb: 2.5 }}
    >
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f5f5f5', bgcolor: '#fafafa' }}>
            <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e">
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
        </Box>
        <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
);

// ── Field label ────────────────────────────────────────────────
const FieldLabel = ({
    label,
    required,
    hint,
}: {
    label: string;
    required?: boolean;
    hint?: string;
}) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
        <Typography variant="body2" fontWeight={600} color="#333" fontSize={13}>
            {label}
            {required && (
                <Typography component="span" color="#d32f2f">
                    {' '}*
                </Typography>
            )}
        </Typography>
        {hint && (
            <Tooltip title={hint} arrow>
                <InfoOutlined sx={{ fontSize: 14, color: '#bbb', cursor: 'help' }} />
            </Tooltip>
        )}
    </Box>
);

// ── Image upload ───────────────────────────────────────────────
const ImageUploader = ({
    imageUrl,
    onChange,
}: {
    imageUrl: string;
    onChange: (url: string) => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await axiosInstance.post('/upload/image', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onChange(res.data?.data?.url ?? '');
            setErr(false);
        } catch {
            onChange(URL.createObjectURL(file));
            setErr(false);
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <Box>
            <FieldLabel label="Ảnh sản phẩm" hint="Ảnh thumbnail hiển thị ở danh sách. Khuyến nghị 500×700px" />

            {imageUrl && !err ? (
                <Box sx={{ position: 'relative', width: 120, mb: 1.5 }}>
                    <Box
                        component="img"
                        src={imageUrl}
                        alt="thumb"
                        onError={() => setErr(true)}
                        sx={{
                            width: 120, height: 155, objectFit: 'contain',
                            borderRadius: 1.5, border: '2px solid #d32f2f', bgcolor: '#fafafa', display: 'block',
                        }}
                    />
                    <IconButton
                        size="small"
                        onClick={() => onChange('')}
                        sx={{
                            position: 'absolute', top: 4, right: 4,
                            bgcolor: '#fff', boxShadow: 1, width: 22, height: 22,
                            '&:hover': { bgcolor: '#ffebee', color: '#d32f2f' },
                        }}
                    >
                        <DeleteOutline sx={{ fontSize: 13 }} />
                    </IconButton>
                </Box>
            ) : (
                <Box
                    onClick={() => inputRef.current?.click()}
                    sx={{
                        width: 120, height: 155,
                        border: '2px dashed #e0e0e0', borderRadius: 1.5,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', gap: 0.75, bgcolor: '#fafafa',
                        '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff8f8' },
                        transition: 'all 0.2s', mb: 1.5,
                    }}
                >
                    <AddPhotoAlternate sx={{ fontSize: 28, color: '#ccc' }} />
                    <Typography variant="caption" color="text.secondary" textAlign="center" px={1} fontSize={11}>
                        {uploading ? 'Đang tải...' : 'Thêm ảnh'}
                    </Typography>
                </Box>
            )}

            <TextField
                size="small"
                fullWidth
                label="Hoặc nhập URL ảnh"
                value={imageUrl}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://..."
                sx={{ mt: 0.5 }}
            />

            <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </Box>
    );
};

// ── Initial form ───────────────────────────────────────────────
const INITIAL: CreateProductRequest & { isActive: boolean } = {
    categoryId: '',
    supplierId: '',
    isbnBarcode: '',
    sku: '',
    name: '',
    description: '',
    retailPrice: 0,
    wholesalePrice: 0,
    imageUrl: '',
    unit: 'Cuốn',
    weight: 0,
    isActive: true,
};

// ══════════════════════════════════════════════════════════════
const ProductCreatePage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState(INITIAL);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        (async () => {
            setLoadingMeta(true);
            try {
                const [cats, sups] = await Promise.all([
                    categoryService.getAll(),
                    supplierService.getAll(),
                ]);
                setCategories(cats);
                setSuppliers(sups);
            } catch { }
            setLoadingMeta(false);
        })();
    }, []);

    const set =
        (field: string) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
                const val = e?.target !== undefined ? e.target.value : e;
                setForm((f) => ({ ...f, [field]: val }));
                if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
            };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = 'Tên sản phẩm không được để trống';
        if (!form.isbnBarcode.trim()) errs.isbnBarcode = 'ISBN / Barcode không được để trống';
        if (!form.categoryId) errs.categoryId = 'Vui lòng chọn danh mục';
        if (!form.retailPrice || +form.retailPrice <= 0)
            errs.retailPrice = 'Giá bán lẻ phải là số dương';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        setSaving(true);
        setErrorMsg('');
        try {
            const payload: CreateProductRequest = {
                categoryId: form.categoryId,
                supplierId: form.supplierId || undefined,
                isbnBarcode: form.isbnBarcode.trim(),
                sku: form.sku?.trim() || undefined,
                name: form.name.trim(),
                description: form.description?.trim() || undefined,
                retailPrice: +form.retailPrice,
                wholesalePrice: form.wholesalePrice ? +form.wholesalePrice : undefined,
                imageUrl: form.imageUrl || undefined,
                unit: form.unit,
                weight: form.weight ? +form.weight : undefined,
            };

            const created = await productService.create(payload);
            setSavedMsg('✅ Tạo sản phẩm thành công!');
            setTimeout(() => navigate(`/admin/products/${created.id}`), 1200);
        } catch (e: any) {
            setErrorMsg(e.response?.data?.message || 'Tạo sản phẩm thất bại. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const profitMargin =
        +form.retailPrice > 0 && +form.wholesalePrice > 0
            ? (((+form.retailPrice - +form.wholesalePrice) / +form.retailPrice) * 100).toFixed(1)
            : null;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate('/admin/products')}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}
                    >
                        <ArrowBack sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1a1a2e">
                            Thêm sản phẩm mới
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Điền đầy đủ thông tin để tạo sản phẩm
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75,
                            borderRadius: 1.5, border: '1px solid #e0e0e0', bgcolor: '#fff',
                        }}
                    >
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            color={form.isActive ? '#2e7d32' : '#888'}
                        >
                            {form.isActive ? 'Đang bán' : 'Ngừng bán'}
                        </Typography>
                        <Switch
                            size="small"
                            checked={form.isActive}
                            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' },
                            }}
                        />
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/admin/products')}
                        sx={{ textTransform: 'none', borderColor: '#bbb', color: '#444' }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                            bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700, px: 3,
                            '&:hover': { bgcolor: '#b71c1c' },
                        }}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
                    </Button>
                </Box>
            </Box>

            {savedMsg && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    {savedMsg}
                </Alert>
            )}
            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            <Grid container spacing={2.5}>
                {/* ── CỘT TRÁI ── */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Section title="Thông tin cơ bản" subtitle="Tên, mô tả và phân loại sản phẩm">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <FieldLabel label="Tên sản phẩm" required />
                                <TextField
                                    fullWidth size="small" placeholder="Nhập tên sách / sản phẩm..."
                                    value={form.name} onChange={set('name')}
                                    error={!!errors.name} helperText={errors.name}
                                    inputProps={{ maxLength: 255 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Danh mục" required />
                                {loadingMeta ? (
                                    <Skeleton height={40} />
                                ) : (
                                    <FormControl fullWidth size="small" error={!!errors.categoryId}>
                                        <Select
                                            value={form.categoryId}
                                            onChange={set('categoryId')}
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>
                                                Chọn danh mục
                                            </MenuItem>
                                            {categories.map((c) => (
                                                <MenuItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.categoryId && (
                                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                                {errors.categoryId}
                                            </Typography>
                                        )}
                                    </FormControl>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Nhà cung cấp / NXB" />
                                {loadingMeta ? (
                                    <Skeleton height={40} />
                                ) : (
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={form.supplierId ?? ''}
                                            onChange={set('supplierId')}
                                            displayEmpty
                                        >
                                            <MenuItem value="">Chọn nhà cung cấp</MenuItem>
                                            {suppliers.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FieldLabel label="Mô tả" />
                                <TextField
                                    fullWidth multiline rows={4} size="small"
                                    placeholder="Mô tả nội dung, tác giả, thể loại..."
                                    value={form.description ?? ''} onChange={set('description')}
                                />
                            </Grid>
                        </Grid>
                    </Section>

                    <Section title="Hình ảnh sản phẩm" subtitle="Ảnh thumbnail hiển thị ở danh sách sản phẩm">
                        <ImageUploader
                            imageUrl={form.imageUrl ?? ''}
                            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                        />
                    </Section>

                    <Section title="Mã nhận diện" subtitle="ISBN/Barcode dùng quét tại POS, SKU quản lý nội bộ">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="ISBN-13 / Barcode" required hint="Quét mã vạch tại quầy POS" />
                                <TextField
                                    fullWidth size="small" placeholder="VD: 9786041184565"
                                    value={form.isbnBarcode} onChange={set('isbnBarcode')}
                                    error={!!errors.isbnBarcode} helperText={errors.isbnBarcode}
                                    inputProps={{ maxLength: 50 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="SKU" hint="Mã nội bộ quản lý sản phẩm" />
                                <TextField
                                    fullWidth size="small" placeholder="VD: VH-001"
                                    value={form.sku ?? ''} onChange={set('sku')}
                                    inputProps={{ maxLength: 100 }}
                                />
                            </Grid>
                        </Grid>
                    </Section>

                    <Section title="Giá bán" subtitle="Giá vốn MAC được tính tự động mỗi lần nhập kho">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FieldLabel label="Giá bán lẻ" required hint="Giá niêm yết cho khách lẻ" />
                                <TextField
                                    fullWidth size="small" type="number" placeholder="0"
                                    value={form.retailPrice || ''} onChange={set('retailPrice')}
                                    error={!!errors.retailPrice} helperText={errors.retailPrice}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FieldLabel label="Giá bán sỉ" hint="Áp dụng cho khách mua số lượng lớn" />
                                <TextField
                                    fullWidth size="small" type="number" placeholder="0"
                                    value={form.wholesalePrice || ''} onChange={set('wholesalePrice')}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FieldLabel
                                    label="Giá vốn (MAC)"
                                    hint="Moving Average Cost — tự tính sau khi nhập kho"
                                />
                                <TextField
                                    fullWidth size="small" disabled
                                    value="Tự động sau khi nhập kho"
                                    sx={{
                                        '& .MuiInputBase-input.Mui-disabled': {
                                            WebkitTextFillColor: '#aaa', fontSize: 12,
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                        {profitMargin !== null && (
                            <Box
                                sx={{
                                    mt: 2, p: 1.5, bgcolor: '#f0fff4',
                                    borderRadius: 1.5, border: '1px solid #c8e6c9',
                                    display: 'flex', gap: 3, flexWrap: 'wrap',
                                }}
                            >
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Lợi nhuận gộp ước tính
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="#2e7d32">
                                        {fmt(+form.retailPrice - +(form.wholesalePrice ?? 0))} ({profitMargin}%)
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Giá bán lẻ</Typography>
                                    <Typography variant="body2" fontWeight={700}>{fmt(+form.retailPrice)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Giá sỉ</Typography>
                                    <Typography variant="body2" fontWeight={700}>{fmt(+(form.wholesalePrice ?? 0))}</Typography>
                                </Box>
                            </Box>
                        )}
                    </Section>

                    <Section title="Thông số vật lý">
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Đơn vị tính" />
                                <FormControl fullWidth size="small">
                                    <Select value={form.unit} onChange={set('unit')}>
                                        {UNIT_OPTIONS.map((u) => (
                                            <MenuItem key={u} value={u}>
                                                {u}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FieldLabel label="Trọng lượng" hint="Dùng tính phí vận chuyển" />
                                <TextField
                                    fullWidth size="small" type="number" placeholder="0"
                                    value={form.weight || ''} onChange={set('weight')}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">gram</InputAdornment>,
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Section>
                </Grid>

                {/* ── CỘT PHẢI ── */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Preview */}
                    <Paper
                        elevation={0}
                        sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}
                    >
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>
                            Preview thumbnail
                        </Typography>
                        {form.imageUrl ? (
                            <Box sx={{ textAlign: 'center' }}>
                                <Box
                                    component="img"
                                    src={form.imageUrl}
                                    alt="thumbnail"
                                    sx={{
                                        width: '100%', maxWidth: 180, height: 230,
                                        objectFit: 'contain', borderRadius: 2,
                                        border: '2px solid #d32f2f', bgcolor: '#fafafa',
                                        display: 'block', mx: 'auto',
                                    }}
                                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                                />
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    height: 180, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    bgcolor: '#f5f5f5', borderRadius: 2, gap: 1,
                                }}
                            >
                                <AddPhotoAlternate sx={{ fontSize: 40, color: '#ddd' }} />
                                <Typography variant="caption" color="text.secondary">
                                    Chưa có ảnh nào
                                </Typography>
                            </Box>
                        )}
                    </Paper>

                    {/* Trạng thái */}
                    <Paper
                        elevation={0}
                        sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5, mb: 2.5 }}
                    >
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>
                            Trạng thái
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                p: 1.5, borderRadius: 1.5,
                                bgcolor: form.isActive ? '#e8f5e9' : '#f5f5f5',
                                border: `1px solid ${form.isActive ? '#c8e6c9' : '#e0e0e0'}`,
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    color={form.isActive ? '#2e7d32' : '#888'}
                                >
                                    {form.isActive ? 'Đang bán' : 'Ngừng bán'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {form.isActive ? 'Hiển thị trên cửa hàng' : 'Ẩn khỏi cửa hàng'}
                                </Typography>
                            </Box>
                            <Switch
                                checked={form.isActive}
                                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2e7d32' },
                                }}
                            />
                        </Box>
                    </Paper>

                    {/* Tóm tắt + nút lưu */}
                    <Paper
                        elevation={0}
                        sx={{ borderRadius: 2, border: '1px solid #f0f0f0', p: 2.5 }}
                    >
                        <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e" mb={1.5}>
                            Tóm tắt
                        </Typography>
                        {[
                            { label: 'Tên', value: form.name || '—' },
                            {
                                label: 'Danh mục',
                                value: categories.find((c) => c.id === form.categoryId)?.name || '—',
                            },
                            { label: 'SKU', value: form.sku || '—' },
                            { label: 'ISBN', value: form.isbnBarcode || '—' },
                            {
                                label: 'Giá lẻ',
                                value: form.retailPrice ? fmt(+form.retailPrice) : '—',
                            },
                            {
                                label: 'Giá sỉ',
                                value: form.wholesalePrice ? fmt(+form.wholesalePrice) : '—',
                            },
                        ].map((row) => (
                            <Box
                                key={row.label}
                                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {row.label}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    color="#333"
                                    sx={{
                                        maxWidth: 140, textAlign: 'right',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}
                                >
                                    {row.value}
                                </Typography>
                            </Box>
                        ))}
                        <Divider sx={{ my: 1.5 }} />
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving}
                            sx={{
                                bgcolor: '#d32f2f', textTransform: 'none', fontWeight: 700,
                                '&:hover': { bgcolor: '#b71c1c' },
                            }}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate('/admin/products')}
                            sx={{ mt: 1, textTransform: 'none', color: '#888' }}
                        >
                            Hủy bỏ
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProductCreatePage;