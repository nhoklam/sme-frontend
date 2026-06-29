import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, IconButton, Chip, Switch,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
    CircularProgress, Divider, Tooltip, Alert
} from '@mui/material';
import {
    Add, Edit, Delete, AddCircleOutline, RemoveCircleOutline,
    AutoFixHigh, InfoOutlined
} from '@mui/icons-material';
import discountRuleService, { DiscountRule, DiscountRuleRequest, DiscountTier } from '../../../../../services/discountRuleService';
import warehouseService from '../../../../../services/warehouseService';
import type { Warehouse } from '../../../../../types';
import toast from 'react-hot-toast';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const emptyTier = (): DiscountTier => ({ minAmount: 0, discountPct: 0, label: '' });

const emptyForm = (): DiscountRuleRequest => ({
    name: '',
    warehouseId: undefined,
    isActive: true,
    maxCashierDiscountPct: 0,
    tiers: [emptyTier()],
});

// Mẫu thực tế phổ biến cho nhà sách Việt Nam
const SAMPLE_TIERS: DiscountTier[] = [
    { minAmount: 200000,   discountPct: 3,  label: 'Đơn nhỏ (200K+)' },
    { minAmount: 500000,   discountPct: 5,  label: 'Đơn trung (500K+)' },
    { minAmount: 1000000,  discountPct: 8,  label: 'Đơn lớn (1 triệu+)' },
    { minAmount: 2000000,  discountPct: 12, label: 'Khách sỉ (2 triệu+)' },
    { minAmount: 5000000,  discountPct: 15, label: 'Đại lý (5 triệu+)' },
];

export default function DiscountRulesTab() {
    const [rules, setRules] = useState<DiscountRule[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<DiscountRuleRequest>(emptyForm());
    const [saving, setSaving] = useState(false);

    // Lưu giá trị raw string cho ô số để tránh bug "012"
    const [tierInputs, setTierInputs] = useState<{ minAmount: string; discountPct: string }[]>([
        { minAmount: '', discountPct: '' }
    ]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [r, w] = await Promise.all([discountRuleService.getAll(), warehouseService.getAll()]);
            setRules(r);
            setWarehouses(w);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const syncTierInputs = (tiers: DiscountTier[]) => {
        setTierInputs(tiers.map(t => ({
            minAmount: t.minAmount === 0 ? '' : String(t.minAmount),
            discountPct: t.discountPct === 0 ? '' : String(t.discountPct),
        })));
    };

    const openCreate = () => {
        setEditingId(null);
        const f = emptyForm();
        setForm(f);
        syncTierInputs(f.tiers);
        setDialogOpen(true);
    };

    const openEdit = (rule: DiscountRule) => {
        setEditingId(rule.id);
        const tiers = rule.tiers.length > 0 ? rule.tiers.map(t => ({ ...t })) : [emptyTier()];
        setForm({
            name: rule.name,
            warehouseId: rule.warehouseId,
            isActive: rule.isActive,
            maxCashierDiscountPct: rule.maxCashierDiscountPct,
            tiers,
        });
        syncTierInputs(tiers);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xác nhận xóa quy tắc chiết khấu này?')) return;
        try {
            await discountRuleService.delete(id);
            toast.success('Đã xóa quy tắc chiết khấu');
            load();
        } catch {
            toast.error('Xóa thất bại');
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Tên quy tắc không được để trống'); return; }
        if (form.tiers.length === 0) { toast.error('Phải có ít nhất 1 mốc chiết khấu'); return; }
        if (form.tiers.some(t => t.minAmount <= 0)) { toast.error('Tổng đơn tối thiểu phải > 0'); return; }
        if (form.tiers.some(t => t.discountPct <= 0)) { toast.error('% chiết khấu phải > 0'); return; }
        setSaving(true);
        try {
            if (editingId) {
                await discountRuleService.update(editingId, form);
                toast.success('Cập nhật thành công');
            } else {
                await discountRuleService.create(form);
                toast.success('Tạo quy tắc thành công');
            }
            setDialogOpen(false);
            load();
        } catch {
            toast.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const updateTierMinAmount = (idx: number, raw: string) => {
        setTierInputs(prev => prev.map((t, i) => i === idx ? { ...t, minAmount: raw } : t));
        const num = raw === '' ? 0 : Number(raw.replace(/\D/g, ''));
        setForm(f => ({ ...f, tiers: f.tiers.map((t, i) => i === idx ? { ...t, minAmount: num } : t) }));
    };

    const updateTierPct = (idx: number, raw: string) => {
        // Chỉ cho nhập số và dấu chấm thập phân
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
        setTierInputs(prev => prev.map((t, i) => i === idx ? { ...t, discountPct: raw } : t));
        const num = raw === '' ? 0 : parseFloat(raw) || 0;
        setForm(f => ({ ...f, tiers: f.tiers.map((t, i) => i === idx ? { ...t, discountPct: num } : t) }));
    };

    const updateTierLabel = (idx: number, val: string) => {
        setForm(f => ({ ...f, tiers: f.tiers.map((t, i) => i === idx ? { ...t, label: val } : t) }));
    };

    const addTier = () => {
        setForm(f => ({ ...f, tiers: [...f.tiers, emptyTier()] }));
        setTierInputs(prev => [...prev, { minAmount: '', discountPct: '' }]);
    };

    const removeTier = (idx: number) => {
        setForm(f => ({ ...f, tiers: f.tiers.filter((_, i) => i !== idx) }));
        setTierInputs(prev => prev.filter((_, i) => i !== idx));
    };

    const insertSampleTiers = () => {
        setForm(f => ({ ...f, tiers: SAMPLE_TIERS.map(t => ({ ...t })) }));
        syncTierInputs(SAMPLE_TIERS);
        toast.success('Đã điền mẫu thực tế — bạn có thể chỉnh sửa lại theo nhu cầu');
    };

    const warehouseName = (id?: string) => {
        if (!id) return 'Tất cả kho';
        return warehouses.find(w => w.id === id)?.name ?? 'Kho không xác định';
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography fontWeight={700} fontSize={15} color="#111">Quy tắc chiết khấu sản lượng</Typography>
                    <Typography variant="caption" color="#6b7280">
                        Tự động giảm giá khi đơn hàng POS đạt ngưỡng tiền — không cần nhân viên thao tác thủ công.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={openCreate}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
                    Tạo quy tắc
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : rules.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                    <Typography color="#94a3b8" fontSize={14} mb={1}>Chưa có quy tắc chiết khấu nào.</Typography>
                    <Typography color="#94a3b8" fontSize={12}>Nhấn "Tạo quy tắc" → "Điền mẫu thực tế" để bắt đầu nhanh.</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: 13 }}>Tên quy tắc &amp; các mốc</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: 13 }}>Phạm vi kho</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: 13 }}>CK tối đa (NV)</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: 13 }}>Trạng thái</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rules.map(rule => (
                                <TableRow key={rule.id} hover>
                                    <TableCell sx={{ maxWidth: 340 }}>
                                        <Typography fontSize={13} fontWeight={600}>{rule.name}</Typography>
                                        <Typography fontSize={11} color="#94a3b8" sx={{ mt: 0.25 }}>
                                            {rule.tiers.map(t => `${fmt(t.minAmount)} → ${t.discountPct}%`).join('  ·  ')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={warehouseName(rule.warehouseId)}
                                            size="small"
                                            sx={{
                                                bgcolor: rule.warehouseId ? '#dbeafe' : '#fef9c3',
                                                color: rule.warehouseId ? '#2563eb' : '#854d0e',
                                                fontSize: 11, fontWeight: 600,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontSize={13}>{rule.maxCashierDiscountPct > 0 ? `${rule.maxCashierDiscountPct}%` : '—'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={rule.isActive ? 'Đang bật' : 'Tắt'}
                                            size="small"
                                            sx={{ bgcolor: rule.isActive ? '#dcfce7' : '#f1f5f9', color: rule.isActive ? '#16a34a' : '#9ca3af', fontSize: 11, fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={0.5}>
                                            <IconButton size="small" onClick={() => openEdit(rule)} sx={{ color: '#2563eb' }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(rule.id)} sx={{ color: '#ef4444' }}><Delete fontSize="small" /></IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog tạo/sửa */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
                    {editingId ? 'Cập nhật quy tắc chiết khấu' : 'Tạo quy tắc chiết khấu'}
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Box display="flex" flexDirection="column" gap={2}>

                        {/* Tên */}
                        <TextField
                            label="Tên quy tắc *"
                            size="small"
                            fullWidth
                            placeholder="Ví dụ: Chiết khấu sỉ Q4/2025"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />

                        {/* Kho áp dụng — "Tất cả kho" = áp dụng toàn bộ chi nhánh */}
                        <FormControl size="small" fullWidth>
                            <InputLabel shrink>Phạm vi áp dụng</InputLabel>
                            <Select
                                label="Phạm vi áp dụng"
                                notched
                                displayEmpty
                                value={form.warehouseId ?? ''}
                                onChange={e => setForm(f => ({ ...f, warehouseId: (e.target.value as string) || undefined }))}
                                renderValue={val => {
                                    if (!val) return <Typography fontSize={13} color="#374151">🌐 Tất cả kho (áp dụng chung)</Typography>;
                                    const wh = warehouses.find(w => w.id === val);
                                    return <Typography fontSize={13}>🏪 {wh?.name ?? val}</Typography>;
                                }}
                            >
                                <MenuItem value="">
                                    <Box>
                                        <Typography fontSize={13} fontWeight={600}>🌐 Tất cả kho</Typography>
                                        <Typography fontSize={11} color="#6b7280">Áp dụng chung cho mọi chi nhánh</Typography>
                                    </Box>
                                </MenuItem>
                                <Divider />
                                {warehouses.map(w => (
                                    <MenuItem key={w.id} value={w.id}>
                                        <Box>
                                            <Typography fontSize={13}>🏪 {w.name}</Typography>
                                            <Typography fontSize={11} color="#6b7280">Chỉ áp dụng tại kho này</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Giới hạn giảm thủ công */}
                        <TextField
                            label="Giảm giá thủ công tối đa nhân viên được phép (%)"
                            size="small"
                            fullWidth
                            placeholder="Ví dụ: 5"
                            value={form.maxCashierDiscountPct === 0 ? '' : form.maxCashierDiscountPct}
                            onChange={e => {
                                const raw = e.target.value;
                                if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                    setForm(f => ({ ...f, maxCashierDiscountPct: raw === '' ? 0 : parseFloat(raw) || 0 }));
                                }
                            }}
                            helperText="Để trống hoặc 0 = không giới hạn. Điền 5 = nhân viên chỉ được bấm giảm thêm tối đa 5%."
                            inputProps={{ inputMode: 'decimal' }}
                        />

                        <Box display="flex" alignItems="center" gap={1}>
                            <Switch
                                checked={form.isActive ?? true}
                                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                color="success"
                            />
                            <Typography variant="body2" color="#374151">Kích hoạt quy tắc ngay</Typography>
                        </Box>

                        <Divider />

                        {/* ─── Các mốc chiết khấu ─── */}
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                <Box>
                                    <Typography fontWeight={700} fontSize={13} color="#111">Các mốc chiết khấu</Typography>
                                    <Typography variant="caption" color="#6b7280">
                                        Nhập từ ngưỡng thấp → cao. Hệ thống tự chọn mốc phù hợp nhất khi thanh toán.
                                    </Typography>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <Tooltip title="Điền nhanh mẫu thực tế (nhà sách Việt Nam)" placement="top">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<AutoFixHigh sx={{ fontSize: 14 }} />}
                                            onClick={insertSampleTiers}
                                            sx={{ textTransform: 'none', fontSize: 12, color: '#7c3aed', borderColor: '#ddd8fe', whiteSpace: 'nowrap' }}
                                        >
                                            Điền mẫu
                                        </Button>
                                    </Tooltip>
                                    <Button
                                        startIcon={<AddCircleOutline />}
                                        size="small"
                                        onClick={addTier}
                                        sx={{ textTransform: 'none', fontSize: 12, color: '#2563eb' }}
                                    >
                                        Thêm mốc
                                    </Button>
                                </Box>
                            </Box>

                            {/* Header labels */}
                            <Box display="flex" gap={1} mb={0.5} px={0.5}>
                                <Typography flex={2} fontSize={11} color="#6b7280" fontWeight={600}>Tổng đơn tối thiểu (đ)</Typography>
                                <Typography flex={1} fontSize={11} color="#6b7280" fontWeight={600}>Giảm (%)</Typography>
                                <Typography flex={2} fontSize={11} color="#6b7280" fontWeight={600}>Nhãn hiển thị</Typography>
                                <Box width={32} />
                            </Box>

                            {form.tiers.map((tier, idx) => (
                                <Box key={idx} display="flex" gap={1} alignItems="center" mb={1}>
                                    <TextField
                                        size="small"
                                        placeholder="500000"
                                        value={tierInputs[idx]?.minAmount ?? (tier.minAmount === 0 ? '' : tier.minAmount)}
                                        onChange={e => updateTierMinAmount(idx, e.target.value.replace(/[^0-9]/g, ''))}
                                        inputProps={{ inputMode: 'numeric' }}
                                        sx={{ flex: 2 }}
                                        helperText={tier.minAmount > 0 ? fmt(tier.minAmount) : ''}
                                        FormHelperTextProps={{ sx: { fontSize: 10, mt: 0, color: '#2563eb' } }}
                                    />
                                    <TextField
                                        size="small"
                                        placeholder="5"
                                        value={tierInputs[idx]?.discountPct ?? (tier.discountPct === 0 ? '' : tier.discountPct)}
                                        onChange={e => updateTierPct(idx, e.target.value)}
                                        inputProps={{ inputMode: 'decimal' }}
                                        InputProps={{ endAdornment: <Typography color="#8c8c8c" fontSize={13}>%</Typography> }}
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        size="small"
                                        placeholder="Đơn 500K"
                                        value={tier.label}
                                        onChange={e => updateTierLabel(idx, e.target.value)}
                                        sx={{ flex: 2 }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => removeTier(idx)}
                                        disabled={form.tiers.length === 1}
                                        sx={{ color: '#ef4444' }}
                                    >
                                        <RemoveCircleOutline fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}

                        </Box>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Hủy</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}
                    >
                        {saving ? <CircularProgress size={18} color="inherit" /> : (editingId ? 'Cập nhật' : 'Tạo quy tắc')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
