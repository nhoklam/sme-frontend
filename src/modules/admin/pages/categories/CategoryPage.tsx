// src/modules/admin/pages/categories/CategoryPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, Select, MenuItem, Switch,
    Snackbar, Alert, Tooltip, Skeleton,
    Divider, SelectChangeEvent,
} from '@mui/material';
import {
    Search, Add, Edit, Refresh, Close,
    ExpandMore, ChevronRight, Category as CategoryIcon,
    VisibilityOff, Visibility, Delete,
} from '@mui/icons-material';
import categoryService, { CategoryRequest } from '../../../../services/categoryService';
import { Category } from '../../../../types';
import authService from '../../../../services/authService';

// ── Initial form ────────────────────────────────────────────
const INITIAL_FORM: CategoryRequest = {
    name: '',
    parentId: null,
    description: '',
    sortOrder: 0,
    isActive: true,
};

// ── Category Form Dialog ────────────────────────────────────
interface CategoryFormProps {
    open: boolean;
    editData: Category | null;
    categories: Category[];
    onClose: () => void;
    onSaved: (msg: string) => void;
}

const CategoryFormDialog: React.FC<CategoryFormProps> = ({
    open, editData, categories, onClose, onSaved,
}) => {
    const [form, setForm] = useState<CategoryRequest>(INITIAL_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            if (editData) {
                setForm({
                    name: editData.name,
                    parentId: editData.parentId ?? null,
                    description: editData.description ?? '',
                    sortOrder: editData.sortOrder ?? 0,
                    isActive: editData.isActive,
                });
            } else {
                setForm(INITIAL_FORM);
            }
            setErrors({});
        }
    }, [open, editData]);

    const setField = (field: keyof CategoryRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const val = e.target.value;
            setForm((f) => ({ ...f, [field]: val }));
            if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
        };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.name?.trim()) errs.name = 'Tên danh mục không được để trống';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload: CategoryRequest = {
                name: form.name.trim(),
                parentId: form.parentId || null,
                description: form.description?.trim() || undefined,
                sortOrder: Number(form.sortOrder) || 0,
                isActive: form.isActive,
            };

            if (editData) {
                await categoryService.update(editData.id, payload);
                onSaved('✅ Cập nhật danh mục thành công!');
            } else {
                await categoryService.create(payload);
                onSaved('✅ Tạo danh mục thành công!');
            }
            onClose();
        } catch (e: any) {
            setErrors({ name: e.response?.data?.message || 'Thao tác thất bại, vui lòng thử lại' });
        } finally {
            setSaving(false);
        }
    };

    const allowedParents = React.useMemo(() => {
        const allowed: { cat: Category; level: number }[] = [];
        const buildTree = (parentId: string | null, level: number) => {
            const children = categories.filter(c => c.parentId === parentId);
            for (const child of children) {
                // Ignore the category being edited and all its descendants
                if (child.id === editData?.id) continue;
                allowed.push({ cat: child, level });
                buildTree(child.id, level + 1);
            }
        };
        buildTree(null, 0);
        return allowed;
    }, [categories, editData]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
        >
            <DialogTitle
                sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Box>
                    <Typography fontWeight={800} fontSize={17} color="#1a1a2e">
                        {editData ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {editData ? `Đang sửa: ${editData.name}` : 'Điền thông tin danh mục'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            <Divider sx={{ mx: 3, mt: 1 }} />

            <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
                {/* Tên danh mục */}
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                    Tên danh mục{' '}
                    <Typography component="span" color="#d32f2f">
                        *
                    </Typography>
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="VD: Văn học, Kinh tế, Thiếu nhi..."
                    value={form.name}
                    onChange={setField('name')}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={{ mb: 2 }}
                    inputProps={{ maxLength: 150 }}
                />

                {/* Danh mục cha */}
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                    Danh mục cha
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <Select
                        value={form.parentId ?? ''}
                        onChange={(e: SelectChangeEvent<string>) =>
                            setForm((f) => ({ ...f, parentId: e.target.value || null }))
                        }
                        displayEmpty
                    >
                        <MenuItem value="">— Không có (danh mục gốc) —</MenuItem>
                        {allowedParents.map((item) => (
                            <MenuItem key={item.cat.id} value={item.cat.id} sx={{ fontSize: 13, pl: 2 + item.level * 2 }}>
                                {'—'.repeat(item.level)}{item.level > 0 ? ' ' : ''}{item.cat.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Mô tả */}
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                    Mô tả
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="Mô tả ngắn về danh mục..."
                    value={form.description ?? ''}
                    onChange={setField('description')}
                    sx={{ mb: 2 }}
                />

                {/* Thứ tự & Trạng thái */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                            Thứ tự hiển thị
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={form.sortOrder ?? 0}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
                            }
                            inputProps={{ min: 0 }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                            Trạng thái
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1.25,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1.5,
                                bgcolor: form.isActive ? '#e8f5e9' : '#f5f5f5',
                            }}
                        >
                            <Switch
                                size="small"
                                checked={form.isActive ?? true}
                                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        bgcolor: '#2e7d32',
                                    },
                                }}
                            />
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                color={form.isActive ? '#2e7d32' : '#888'}
                                fontSize={13}
                            >
                                {form.isActive ? 'Hiển thị' : 'Ẩn'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5, px: 2.5 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: '#2563eb',
                        borderRadius: 1.5,
                        px: 3,
                        height: 36,
                        '&:hover': { bgcolor: '#1d4ed8' },
                    }}
                >
                    {saving ? 'Đang lưu...' : editData ? 'Cập nhật' : 'Tạo danh mục'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Toggle Active Confirm Dialog ────────────────────────────
interface ConfirmDialogProps {
    open: boolean;
    category: Category | null;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

const ToggleActiveDialog: React.FC<ConfirmDialogProps> = ({
    open,
    category,
    onClose,
    onConfirm,
    loading,
}) => (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
        <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3 }}>
            <Typography fontWeight={800} fontSize={16}>
                {category?.isActive ? '⚠️ Ẩn danh mục' : '✅ Kích hoạt danh mục'}
            </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
            <Typography variant="body2" color="text.secondary">
                {category?.isActive
                    ? `Ẩn danh mục "${category?.name}" sẽ không hiển thị trên cửa hàng. Bạn có thể kích hoạt lại sau.`
                    : `Kích hoạt danh mục "${category?.name}" để hiển thị trở lại trên cửa hàng.`}
            </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
                onClick={onClose}
                variant="outlined"
                sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}
            >
                Hủy
            </Button>
            <Button
                onClick={onConfirm}
                variant="contained"
                disabled={loading}
                sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 1.5,
                    bgcolor: category?.isActive ? '#ef4444' : '#16a34a',
                    '&:hover': {
                        bgcolor: category?.isActive ? '#dc2626' : '#15803d',
                    },
                    height: 36,
                }}
            >
                {loading ? 'Đang xử lý...' : category?.isActive ? 'Ẩn danh mục' : 'Kích hoạt'}
            </Button>
        </DialogActions>
    </Dialog>
);

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const CategoryPage: React.FC = () => {
    const isAdmin = authService.getCurrentUser()?.user?.role === 'ROLE_ADMIN';
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [toggleTarget, setToggleTarget] = useState<Category | null>(null);
    const [toggleLoading, setToggleLoading] = useState(false);

    const [snack, setSnack] = useState('');
    const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Tree helpers
    const roots = categories.filter((c) => !c.parentId);
    const getChildren = (parentId: string) =>
        categories.filter((c) => c.parentId === parentId);

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Filter
    const filterFn = (c: Category) => {
        const matchSearch =
            !search.trim() ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.slug || '').toLowerCase().includes(search.toLowerCase());
        const matchActive =
            filterActive === 'all' ||
            (filterActive === 'active' && c.isActive) ||
            (filterActive === 'inactive' && !c.isActive);
        return matchSearch && matchActive;
    };

    const flatFiltered = search.trim() || filterActive !== 'all' ? categories.filter(filterFn) : null;

    // Handlers
    const handleOpenCreate = () => {
        setEditTarget(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (cat: Category) => {
        setEditTarget(cat);
        setFormOpen(true);
    };

    const handleToggleActive = async () => {
        if (!toggleTarget) return;
        setToggleLoading(true);
        try {
            await categoryService.toggleActive(toggleTarget.id, toggleTarget, !toggleTarget.isActive);
            setSnack(
                toggleTarget.isActive
                    ? `Đã ẩn danh mục "${toggleTarget.name}"`
                    : `Đã kích hoạt danh mục "${toggleTarget.name}"`
            );
            setSnackSeverity('success');
            setToggleTarget(null);
            loadCategories();
        } catch (e: any) {
            setSnack(e.response?.data?.message || 'Thao tác thất bại');
            setSnackSeverity('error');
        } finally {
            setToggleLoading(false);
        }
    };

    const onSaved = (msg: string) => {
        setSnack(msg);
        setSnackSeverity('success');
        loadCategories();
    };

    // Stats
    const totalActive = categories.filter((c) => c.isActive).length;
    const totalInactive = categories.filter((c) => !c.isActive).length;
    const totalRoot = categories.filter((c) => !c.parentId).length;

    // Row renderer
    const renderRow = (cat: Category, depth = 0): React.ReactNode => {
        const children = getChildren(cat.id);
        const hasChildren = children.length > 0;
        const isExpanded = expanded.has(cat.id);

        return (
            <React.Fragment key={cat.id}>
                <TableRow
                    hover
                    sx={{
                        bgcolor:
                            depth === 0
                                ? categories.indexOf(cat) % 2 === 0
                                    ? '#fff'
                                    : '#fafafa'
                                : '#f9fbff',
                        '&:hover': { bgcolor: '#f0f6ff' },
                        opacity: cat.isActive ? 1 : 0.6,
                    }}
                >
                    {/* Tên */}
                    <TableCell sx={{ py: 1.5, pl: 2 + depth * 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {hasChildren ? (
                                <IconButton
                                    size="small"
                                    onClick={() => toggleExpand(cat.id)}
                                    sx={{ width: 22, height: 22, color: '#999' }}
                                >
                                    {isExpanded ? (
                                        <ExpandMore sx={{ fontSize: 16 }} />
                                    ) : (
                                        <ChevronRight sx={{ fontSize: 16 }} />
                                    )}
                                </IconButton>
                            ) : (
                                <Box sx={{ width: 22 }} />
                            )}
                            <CategoryIcon
                                sx={{ fontSize: 16, color: depth === 0 ? '#1976d2' : '#90caf9' }}
                            />
                            <Box>
                                <Typography
                                    variant="body2"
                                    fontWeight={depth === 0 ? 700 : 500}
                                    fontSize={13}
                                >
                                    {cat.name}
                                </Typography>
                                {cat.description && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            display: 'block',
                                            maxWidth: 300,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {cat.description}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </TableCell>

                    {/* Slug */}
                    <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="caption" fontFamily="monospace" color="#888">
                            {cat.slug || '—'}
                        </Typography>
                    </TableCell>

                    {/* Cấp */}
                    <TableCell sx={{ py: 1.5 }}>
                        <Chip
                            label={depth === 0 ? 'Danh mục gốc' : 'Danh mục con'}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: depth === 0 ? '#e3f2fd' : '#f3e5f5',
                                color: depth === 0 ? '#1565c0' : '#6a1b9a',
                            }}
                        />
                    </TableCell>

                    {/* Thứ tự */}
                    <TableCell sx={{ py: 1.5 }} align="center">
                        <Typography variant="body2" fontWeight={600} color="#555">
                            {cat.sortOrder ?? 0}
                        </Typography>
                    </TableCell>

                    {/* Số con */}
                    <TableCell sx={{ py: 1.5 }} align="center">
                        {hasChildren ? (
                            <Chip
                                label={`${children.length} con`}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: 10,
                                    bgcolor: '#fff3e0',
                                    color: '#e65100',
                                    fontWeight: 700,
                                }}
                            />
                        ) : (
                            <Typography variant="caption" color="#ddd">
                                —
                            </Typography>
                        )}
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell sx={{ py: 1.5 }}>
                        <Chip
                            label={cat.isActive ? 'Hiển thị' : 'Đã ẩn'}
                            size="small"
                            sx={{
                                height: 22,
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: cat.isActive ? '#e8f5e9' : '#f5f5f5',
                                color: cat.isActive ? '#2e7d32' : '#888',
                            }}
                        />
                    </TableCell>

                    {/* Thao tác */}
                    <TableCell sx={{ py: 1.5 }} align="center">
                        {isAdmin ? (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title="Chỉnh sửa">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenEdit(cat)}
                                        sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}
                                    >
                                        <Edit sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={cat.isActive ? 'Ẩn danh mục' : 'Kích hoạt'}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setToggleTarget(cat)}
                                        sx={{
                                            color: cat.isActive ? '#ef4444' : '#22c55e',
                                            '&:hover': {
                                                bgcolor: cat.isActive ? '#fef2f2' : '#f0fdf4',
                                            },
                                        }}
                                    >
                                        {cat.isActive ? (
                                            <VisibilityOff sx={{ fontSize: 15 }} />
                                        ) : (
                                            <Visibility sx={{ fontSize: 15 }} />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ) : (
                            <Typography variant="caption" color="#ccc">—</Typography>
                        )}
                    </TableCell>
                </TableRow>

                {/* Render children nếu đang expand */}
                {isExpanded && hasChildren && children.map((child) => renderRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>
                        Sản phẩm /{' '}
                        <strong style={{ color: '#555' }}>Danh mục</strong>
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>
                        Quản lý Danh mục
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                        Phân loại sản phẩm theo danh mục và cấp bậc
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Làm mới">
                        <IconButton
                            onClick={loadCategories}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                        >
                            <Refresh sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    {isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleOpenCreate}
                            sx={{
                                bgcolor: '#2563eb',
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 1.5,
                                height: 40,
                                '&:hover': { bgcolor: '#1d4ed8' },
                            }}
                        >
                            Thêm danh mục
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Stats */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 1.5,
                    mb: 2.5,
                }}
            >
                {[
                    { label: 'Tổng danh mục', value: categories.length, color: '#1a1a2e' },
                    { label: 'Danh mục gốc', value: totalRoot, color: '#1565c0' },
                    { label: 'Đang hiển thị', value: totalActive, color: '#2e7d32' },
                    { label: 'Đã ẩn', value: totalInactive, color: '#888' },
                ].map((s) => (
                    <Paper
                        key={s.label}
                        elevation={0}
                        sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', textAlign: 'center' }}
                    >
                        {loading ? (
                            <Skeleton height={30} />
                        ) : (
                            <Typography variant="h5" fontWeight={800} color={s.color}>
                                {s.value}
                            </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {s.label}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Box
                sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}
            >
                <TextField
                    size="small"
                    placeholder="Tìm theo tên danh mục, slug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1, minWidth: 240 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ fontSize: 17, color: '#bbb' }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Box
                    sx={{
                        display: 'flex',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                    }}
                >
                    {(
                        [
                            { value: 'all', label: 'Tất cả' },
                            { value: 'active', label: 'Hiển thị' },
                            { value: 'inactive', label: 'Đã ẩn' },
                        ] as const
                    ).map((opt) => (
                        <Button
                            key={opt.value}
                            size="small"
                            onClick={() => setFilterActive(opt.value)}
                            sx={{
                                textTransform: 'none',
                                px: 2,
                                py: 0.75,
                                borderRadius: 0,
                                fontSize: 12,
                                fontWeight: 600,
                                bgcolor: filterActive === opt.value ? '#2563eb' : 'transparent',
                                color: filterActive === opt.value ? '#fff' : '#555',
                                '&:hover': {
                                    bgcolor: filterActive === opt.value ? '#1d4ed8' : '#f5f5f5',
                                },
                            }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </Box>
            </Box>

            {/* Table */}
            <Paper
                elevation={0}
                sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}
            >
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {[
                                    { label: 'Tên danh mục', width: 300 },
                                    { label: 'Slug', width: 180 },
                                    { label: 'Cấp', width: 120 },
                                    { label: 'Thứ tự', width: 80, align: 'center' as const },
                                    { label: 'Danh mục con', width: 110, align: 'center' as const },
                                    { label: 'Trạng thái', width: 100 },
                                    { label: 'Thao tác', width: 100, align: 'center' as const },
                                ].map((col) => (
                                    <TableCell
                                        key={col.label}
                                        align={col.align || 'left'}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 11,
                                            color: '#888',
                                            py: 1.5,
                                            width: col.width,
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        {col.label.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                            <TableCell key={j}>
                                                <Skeleton height={20} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : flatFiltered ? (
                                flatFiltered.length > 0 ? (
                                    flatFiltered.map((cat) => {
                                        const depth = cat.parentId ? 1 : 0;
                                        return renderRow(cat, depth);
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <Typography fontSize={36} mb={1}>
                                                🔍
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Không tìm thấy danh mục nào
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )
                            ) : roots.length > 0 ? (
                                roots.map((cat) => renderRow(cat, 0))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={36} mb={1}>
                                            📂
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Chưa có danh mục nào
                                        </Typography>
                                        {isAdmin && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<Add />}
                                                onClick={handleOpenCreate}
                                                sx={{
                                                    mt: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    bgcolor: '#1976d2',
                                                }}
                                            >
                                                Thêm danh mục đầu tiên
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box
                    sx={{
                        px: 2.5,
                        py: 1.25,
                        borderTop: '1px solid #f0f0f0',
                        bgcolor: '#fafafa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        Tổng <strong>{categories.length}</strong> danh mục
                        {!flatFiltered && roots.length > 0 && (
                            <>
                                {' '}
                                ·{' '}
                                <span style={{ color: '#1976d2' }}>
                                    Bấm mũi tên để xem danh mục con
                                </span>
                            </>
                        )}
                    </Typography>
                    {roots.length > 0 && !flatFiltered && (
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                const allIds = new Set(
                                    categories
                                        .filter((c) => getChildren(c.id).length > 0)
                                        .map((c) => c.id)
                                );
                                if (expanded.size > 0) setExpanded(new Set());
                                else setExpanded(allIds);
                            }}
                            sx={{ textTransform: 'none', fontSize: 12, color: '#1976d2' }}
                        >
                            {expanded.size > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Form Dialog */}
            <CategoryFormDialog
                open={formOpen}
                editData={editTarget}
                categories={categories}
                onClose={() => setFormOpen(false)}
                onSaved={onSaved}
            />

            {/* Toggle Active Dialog */}
            <ToggleActiveDialog
                open={!!toggleTarget}
                category={toggleTarget}
                onClose={() => setToggleTarget(null)}
                onConfirm={handleToggleActive}
                loading={toggleLoading}
            />

            {/* Snackbar */}
            <Snackbar
                open={!!snack}
                autoHideDuration={3000}
                onClose={() => setSnack('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnack('')}
                    severity={snackSeverity}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                    {snack}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CategoryPage;