// src/modules/admin/pages/suppliers/SupplierPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import authService from '../../../../services/authService';
import {
    Box, Typography, Button, TextField, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Chip, Pagination, Tooltip, Skeleton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Alert, Snackbar, Tabs, Tab, Divider,
    Avatar, LinearProgress, Card, CardContent,
} from '@mui/material';

import {
    Search, Add, Edit, ToggleOn, ToggleOff,
    Phone, Email, LocationOn, Refresh,
    Close, FileDownloadOutlined,
    Info, History, UploadFile
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import supplierService from '../../../../services/supplierService';
import financeService from '../../../../services/financeService';
import { purchaseService } from '../../../../services/purchaseService';
import type { Supplier, CreateSupplierRequest, SupplierDebt, PurchaseOrder } from '../../../../types/index';

// ─── Types ────────────────────────────────────────────────────
interface FormData {
    name: string;
    taxCode: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    bankAccount: string;
    bankName: string;
    paymentTerms: number;
    notes: string;
}

interface FormErrors {
    name?: string;
    phone?: string;
    email?: string;
    paymentTerms?: string;
}

const EMPTY_FORM: FormData = {
    name: '',
    taxCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    bankAccount: '',
    bankName: '',
    paymentTerms: 30,
    notes: '',
};

const fmtCurrency = (n?: number) => {
    if (n == null) return '0 đ';
    return n.toLocaleString('vi-VN') + ' đ';
};

// ─── Field Label ──────────────────────────────────────────────
const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </Typography>
);

// ─── Section Box ──────────────────────────────────────────────
const FormSection: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 1, borderBottom: '2px solid #e3f2fd' }}>
            {icon && <Box sx={{ color: '#1976d2', display: 'flex' }}>{icon}</Box>}
            <Typography variant="body2" fontWeight={700} color="#1976d2" letterSpacing={0.3}>
                {title.toUpperCase()}
            </Typography>
        </Box>
        {children}
    </Box>
);

// ─── Detail Dialog ────────────────────────────────────────────
const SupplierDetailDialog: React.FC<{
    open: boolean;
    supplier: Supplier | null;
    onClose: () => void;
    onEdit: (s: Supplier) => void;
}> = ({ open, supplier, onClose, onEdit }) => {
    const [tab, setTab] = useState(0);
    const [debts, setDebts] = useState<SupplierDebt[]>([]);
    const [loadingDebts, setLoadingDebts] = useState(false);
    const [totalDebt, setTotalDebt] = useState<number>(0);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        if (open && supplier && tab === 0) {
            setLoadingDebts(true);
            Promise.all([
                financeService.getSupplierDebts(), // Still needed for the list
                financeService.getTotalOutstandingBySupplier(supplier.id)
            ])
                .then(([all, total]) => {
                    setDebts(all.filter(d => d.supplierId === supplier.id));
                    setTotalDebt(total);
                })
                .catch(() => { setDebts([]); setTotalDebt(0); })
                .finally(() => setLoadingDebts(false));
        }
    }, [open, supplier, tab]);

    useEffect(() => {
        if (open && supplier && tab === 1) {
            setLoadingOrders(true);
            purchaseService.getBySupplier(supplier.id, { page: 0, size: 50 })
                .then((ordersPage) => {
                    setPurchaseOrders(ordersPage.content ?? []);
                })
                .catch(() => { setPurchaseOrders([]); })
                .finally(() => setLoadingOrders(false));
        }
    }, [open, supplier, tab]);

    useEffect(() => {
        if (!open) {
            setTab(0);
            setTotalDebt(0);
            setPurchaseOrders([]);
        }
    }, [open]);

    if (!supplier) return null;

    const paidTotal = debts.reduce((s, d) => s + (d.paidAmount || 0), 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}>
            {/* Header */}
            <Box sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                px: 3, py: 2.5,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
                <Box>
                    <Typography fontWeight={800} fontSize={20} color="#fff">{supplier.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                        {supplier.taxCode && (
                            <Typography variant="body2" color="rgba(255,255,255,0.85)">
                                MST: {supplier.taxCode}
                            </Typography>
                        )}
                        {supplier.phone && (
                            <Typography variant="body2" color="rgba(255,255,255,0.85)">
                                📞 {supplier.phone}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <Close />
                </IconButton>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: '1px solid #f0f0f0', bgcolor: '#fff' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{
                        px: 2,
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13 },
                        '& .MuiTabs-indicator': { bgcolor: '#1976d2' },
                        '& .Mui-selected': { color: '#1976d2 !important' },
                    }}>
                    <Tab icon={<Info sx={{ fontSize: 16 }} />} iconPosition="start" label="Thông tin & Công nợ" />
                    <Tab icon={<History sx={{ fontSize: 16 }} />} iconPosition="start" label="Lịch sử Nhập kho" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {tab === 0 && (
                    <Grid container spacing={3}>
                        {/* Left: Info */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #f0f0f0', borderRadius: 2 }}>
                                <Typography variant="body2" fontWeight={700} color="#1a1a2e" mb={1.5}>
                                    Thông tin liên hệ
                                </Typography>
                                {[
                                    { label: 'Người đại diện:', value: supplier.contactPerson || '—' },
                                    { label: 'Email:', value: supplier.email || '—' },
                                    { label: 'Ngân hàng:', value: supplier.bankName || '—' },
                                    { label: 'Số tài khoản:', value: supplier.bankAccount || '—' },
                                    { label: 'Kỳ hạn nợ:', value: `Net ${supplier.paymentTerms} ngày` },
                                    { label: 'Địa chỉ:', value: supplier.address || '—' },
                                ].map(row => (
                                    <Box key={row.label} sx={{ display: 'flex', mb: 1.25, alignItems: 'flex-start' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130, flexShrink: 0, fontSize: 12 }}>
                                            {row.label}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500} fontSize={12}>{row.value}</Typography>
                                    </Box>
                                ))}
                                {supplier.notes && (
                                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8f9fb', borderRadius: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                                            Ghi chú:
                                        </Typography>
                                        <Typography variant="body2" color="#555" fontSize={12} fontStyle="italic">
                                            {supplier.notes}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* Right: Debt */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            {/* Debt summary */}
                            <Paper elevation={0} sx={{
                                p: 2.5, border: totalDebt > 0 ? '1px solid #ffcdd2' : '1px solid #c8e6c9',
                                borderRadius: 2, bgcolor: totalDebt > 0 ? '#fff5f5' : '#f1f8e9',
                                mb: 2,
                            }}>
                                <Typography variant="caption" color={totalDebt > 0 ? '#d32f2f' : '#2e7d32'} fontWeight={700} mb={0.5} display="block">
                                    {totalDebt > 0 ? '💳 Công nợ còn lại' : '✅ Không có công nợ'}
                                </Typography>
                                <Typography variant="h4" fontWeight={900} color={totalDebt > 0 ? '#d32f2f' : '#2e7d32'}>
                                    {fmtCurrency(totalDebt)}
                                </Typography>
                                {paidTotal > 0 && (
                                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                        Đã thanh toán: {fmtCurrency(paidTotal)}
                                    </Typography>
                                )}
                            </Paper>

                            {loadingDebts ? (
                                [1, 2, 3].map(i => <Skeleton key={i} height={40} sx={{ mb: 0.5, borderRadius: 1 }} />)
                            ) : debts.length > 0 ? (
                                <Paper elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>MÃ ĐƠN NHẬP</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>DƯ NỢ</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888' }}>HẠN</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {debts.slice(0, 5).map(d => (
                                                <TableRow key={d.id} hover>
                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', color: '#1976d2' }}>
                                                        {d.purchaseOrderCode || d.purchaseOrderId?.slice(0, 12)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight={700} color="#d32f2f" fontSize={12}>
                                                            {fmtCurrency(d.remainingAmount)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="caption" color="text.secondary">
                                                            {d.dueDate ? new Date(d.dueDate).toLocaleDateString('vi-VN') : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Paper>
                            ) : null}
                        </Grid>
                    </Grid>
                )}

                {tab === 1 && (
                    <Box>
                        {loadingOrders ? (
                            [1, 2, 3].map(i => <Skeleton key={i} height={45} sx={{ mb: 1, borderRadius: 1 }} />)
                        ) : purchaseOrders.length > 0 ? (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>MÃ ĐƠN NHẬP</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>NGÀY TẠO</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>TỔNG TIỀN</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>ĐÃ TRẢ</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12 }}>TRẠNG THÁI</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {purchaseOrders.map(order => (
                                            <TableRow key={order.id} hover>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', color: '#1976d2', fontWeight: 600 }}>
                                                    {order.code}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>
                                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 700 }}>
                                                    {fmtCurrency(order.totalAmount)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: 12, color: '#2e7d32' }}>
                                                    {fmtCurrency(order.paidAmount)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={
                                                            order.status === 'COMPLETED' ? 'Đã nhập kho' :
                                                                order.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' :
                                                                    order.status === 'CANCELLED' ? 'Đã hủy' : 'Nháp'
                                                        }
                                                        size="small"
                                                        sx={{
                                                            height: 20, fontSize: 11, fontWeight: 700,
                                                            bgcolor:
                                                                order.status === 'COMPLETED' ? '#e8f5e9' :
                                                                    order.status === 'PENDING_APPROVAL' ? '#fff3e0' :
                                                                        order.status === 'CANCELLED' ? '#ffe5e5' : '#f5f5f5',
                                                            color:
                                                                order.status === 'COMPLETED' ? '#2e7d32' :
                                                                    order.status === 'PENDING_APPROVAL' ? '#ef6c00' :
                                                                        order.status === 'CANCELLED' ? '#c62828' : '#666',
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <History sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Không tìm thấy lịch sử nhập kho nào từ nhà cung cấp này
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>
                    Đóng
                </Button>
                {(() => {
                    const cu = authService.getCurrentUser()?.user;
                    const adminFlag = cu?.role === 'ROLE_ADMIN';
                    return adminFlag ? (
                        <Button onClick={() => { onEdit(supplier); onClose(); }} variant="contained"
                            startIcon={<Edit sx={{ fontSize: 15 }} />}
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                            Chỉnh sửa
                        </Button>
                    ) : null;
                })()}
            </DialogActions>
        </Dialog>
    );
};

// ─── Create/Edit Dialog ───────────────────────────────────────
const SupplierFormDialog: React.FC<{
    open: boolean;
    editTarget: Supplier | null;
    onClose: () => void;
    onSaved: () => void;
}> = ({ open, editTarget, onClose, onSaved }) => {
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (open) {
            if (editTarget) {
                setFormData({
                    name: editTarget.name,
                    taxCode: editTarget.taxCode ?? '',
                    contactPerson: editTarget.contactPerson ?? '',
                    phone: editTarget.phone ?? '',
                    email: editTarget.email ?? '',
                    address: editTarget.address ?? '',
                    bankAccount: editTarget.bankAccount ?? '',
                    bankName: editTarget.bankName ?? '',
                    paymentTerms: editTarget.paymentTerms,
                    notes: editTarget.notes ?? '',
                });
            } else {
                setFormData(EMPTY_FORM);
            }
            setFormErrors({});
            setErrorMsg('');
        }
    }, [open, editTarget]);

    const handleChange = (field: keyof FormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const val = field === 'paymentTerms' ? Number(e.target.value) : e.target.value;
        setFormData(prev => ({ ...prev, [field]: val }));
        if (formErrors[field as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!formData.name.trim()) errs.name = 'Tên nhà cung cấp không được để trống';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Email không hợp lệ';
        if (formData.paymentTerms < 0) errs.paymentTerms = 'Net Terms phải >= 0';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        setErrorMsg('');
        try {
            const payload: CreateSupplierRequest = {
                name: formData.name.trim(),
                taxCode: formData.taxCode.trim() || undefined,
                contactPerson: formData.contactPerson.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                email: formData.email.trim() || undefined,
                address: formData.address.trim() || undefined,
                bankAccount: formData.bankAccount.trim() || undefined,
                bankName: formData.bankName.trim() || undefined,
                paymentTerms: formData.paymentTerms,
                notes: formData.notes.trim() || undefined,
            };
            if (editTarget) {
                await supplierService.update(editTarget.id, payload);
            } else {
                await supplierService.create(payload);
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setErrorMsg(e.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    const isEdit = !!editTarget;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}>
            {/* Header */}
            <Box sx={{
                background: isEdit
                    ? 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)'
                    : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                px: 3, py: 2.5,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Box>
                    <Typography fontWeight={800} fontSize={18} color="#fff">
                        {isEdit ? `✏️ Chỉnh sửa: ${editTarget?.name}` : '➕ Thêm Nhà Cung Cấp Mới'}
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.85)" mt={0.25}>
                        {isEdit ? 'Cập nhật thông tin nhà cung cấp' : 'Điền đầy đủ thông tin để tạo NCC mới'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
                {errorMsg && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
                        {errorMsg}
                    </Alert>
                )}

                {/* Thông tin cơ bản */}
                <FormSection title="Thông tin cơ bản" icon={<Info sx={{ fontSize: 16 }} />}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <FieldLabel label="Tên nhà cung cấp / Công ty" required />
                            <TextField
                                fullWidth size="small"
                                placeholder="VD: Công ty TNHH ABC..."
                                value={formData.name}
                                onChange={handleChange('name')}
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                sx={{
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#1976d2',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FieldLabel label="Mã số thuế" />
                            <TextField
                                fullWidth size="small"
                                placeholder="VD: 0123456789"
                                value={formData.taxCode}
                                onChange={handleChange('taxCode')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FieldLabel label="Người đại diện / Liên hệ" />
                            <TextField
                                fullWidth size="small"
                                placeholder="Tên người đại diện..."
                                value={formData.contactPerson}
                                onChange={handleChange('contactPerson')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FieldLabel label="Số điện thoại" />
                            <TextField
                                fullWidth size="small"
                                placeholder="09xxxxxxxx"
                                value={formData.phone}
                                onChange={handleChange('phone')}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone sx={{ fontSize: 16, color: '#bbb' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FieldLabel label="Email" />
                            <TextField
                                fullWidth size="small"
                                placeholder="email@ncc.vn"
                                value={formData.email}
                                onChange={handleChange('email')}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ fontSize: 16, color: '#bbb' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FieldLabel label="Địa chỉ" />
                            <TextField
                                fullWidth size="small"
                                placeholder="Địa chỉ chi tiết..."
                                value={formData.address}
                                onChange={handleChange('address')}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationOn sx={{ fontSize: 16, color: '#bbb' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </FormSection>

                {/* Thông tin ngân hàng */}
                <FormSection title="Thông tin ngân hàng & Thanh toán" icon={<Info sx={{ fontSize: 16 }} />}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <FieldLabel label="Tên ngân hàng" />
                            <TextField
                                fullWidth size="small"
                                placeholder="VD: Vietcombank, MB Bank..."
                                value={formData.bankName}
                                onChange={handleChange('bankName')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FieldLabel label="Số tài khoản" />
                            <TextField
                                fullWidth size="small"
                                placeholder="Số tài khoản ngân hàng..."
                                value={formData.bankAccount}
                                onChange={handleChange('bankAccount')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FieldLabel label="Net Terms (ngày)" />
                            <TextField
                                fullWidth size="small"
                                type="number"
                                value={formData.paymentTerms}
                                onChange={handleChange('paymentTerms')}
                                error={!!formErrors.paymentTerms}
                                helperText={formErrors.paymentTerms || 'Kỳ hạn thanh toán'}
                                inputProps={{ min: 0, max: 365 }}
                            />
                        </Grid>
                    </Grid>
                </FormSection>

                {/* Ghi chú */}
                <Box>
                    <FieldLabel label="Ghi chú thêm" />
                    <TextField
                        fullWidth size="small"
                        multiline rows={2}
                        placeholder="Ghi chú về điều khoản, yêu cầu đặc biệt..."
                        value={formData.notes}
                        onChange={handleChange('notes')}
                    />
                </Box>
            </DialogContent>

            <Divider sx={{ mx: 3, mt: 2 }} />
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={saving} variant="outlined"
                    sx={{ textTransform: 'none', color: '#555', borderColor: '#e0e0e0' }}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                        textTransform: 'none', fontWeight: 700, px: 4,
                        bgcolor: isEdit ? '#f59e0b' : '#2563eb',
                        '&:hover': { bgcolor: isEdit ? '#d97706' : '#1d4ed8' },
                    }}
                >
                    {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── Main Component ────────────────────────────────────────────
const SupplierPage: React.FC = () => {
    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [allDebts, setAllDebts] = useState<SupplierDebt[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Detail dialog
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Supplier | null>(null);

    // Snackbar
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
        open: false, msg: '', severity: 'success',
    });

    const PAGE_SIZE = 10;

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const [data, debtsList] = await Promise.all([
                supplierService.getAll({ keyword, page, size: PAGE_SIZE }),
                financeService.getSupplierDebts()
            ]);
            setSuppliers(data.content ?? []);
            setTotalPages(data.totalPages ?? 0);
            setTotalElements(data.totalElements ?? 0);
            setAllDebts(debtsList ?? []);
        } catch {
            showSnack('Không thể tải danh sách nhà cung cấp', 'error');
        } finally {
            setLoading(false);
        }
    }, [keyword, page]);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    const handleSearch = () => {
        setPage(0);
        setKeyword(searchInput);
    };

    const openCreate = () => {
        setEditTarget(null);
        setFormOpen(true);
    };

    const openEdit = (s: Supplier) => {
        setEditTarget(s);
        setFormOpen(true);
    };

    const openDetail = (s: Supplier) => {
        setSelectedSupplier(s);
        setDetailOpen(true);
    };

    const handleToggle = async (s: Supplier) => {
        try {
            await supplierService.toggleActive(s.id, !s.isActive);
            showSnack(s.isActive ? 'Đã vô hiệu hóa nhà cung cấp' : 'Đã kích hoạt nhà cung cấp');
            fetchSuppliers();
        } catch {
            showSnack('Không thể thay đổi trạng thái', 'error');
        }
    };

    const showSnack = (msg: string, severity: 'success' | 'error' = 'success') => {
        setSnack({ open: true, msg, severity });
    };

    const activeCount = suppliers.filter(s => s.isActive).length;

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

            const payloadList = jsonData.map(row => ({
                taxCode: row['Mã số thuế'] || row['taxCode'] || '',
                name: row['Tên nhà cung cấp'] || row['Tên'] || row['name'] || '',
                contactPerson: row['Người liên hệ'] || row['contactPerson'] || '',
                phone: row['Số điện thoại'] || row['SĐT'] || row['phone'] || '',
                email: row['Email'] || row['email'] || '',
                address: row['Địa chỉ'] || row['address'] || '',
                bankAccount: row['Số tài khoản'] || row['STK'] || row['bankAccount'] || '',
                bankName: row['Tên ngân hàng'] || row['bankName'] || '',
                paymentTerms: Number(row['Kỳ hạn nợ (ngày)'] || row['paymentTerms']) || 30,
                notes: row['Ghi chú'] || row['notes'] || ''
            })).filter(row => row.name); // Bỏ qua dòng không có tên

            if (payloadList.length === 0) {
                showSnack('File Excel trống hoặc sai định dạng', 'error');
                return;
            }

            const res = await supplierService.importBulk(payloadList);
            showSnack(res.message || `Import thành công ${payloadList.length} nhà cung cấp`, 'success');
            fetchSuppliers();
        } catch (err) {
            console.error(err);
            showSnack('Lỗi khi import file Excel', 'error');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input file
        }
    };

    const handleExportExcel = () => {
        try {
            const worksheetData = suppliers.map(s => ({
                'Tên nhà cung cấp': s.name,
                'Mã số thuế': s.taxCode || '',
                'Người liên hệ': s.contactPerson || '',
                'Số điện thoại': s.phone || '',
                'Email': s.email || '',
                'Địa chỉ': s.address || '',
                'Tên ngân hàng': s.bankName || '',
                'Số tài khoản': s.bankAccount || '',
                'Kỳ hạn nợ (ngày)': s.paymentTerms,
                'Trạng thái': s.isActive ? 'Hoạt động' : 'Dừng hoạt động',
                'Ghi chú': s.notes || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
            XLSX.writeFile(workbook, `Danh_sach_nha_cung_cap_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showSnack('Xuất file Excel thành công!', 'success');
        } catch (err) {
            console.error(err);
            showSnack('Lỗi khi xuất file Excel', 'error');
        }
    };
    const totalOutstandingDebt = allDebts.reduce((sum, d) => sum + (d.remainingAmount ?? 0), 0);
    const outstandingSupplierIds = new Set(allDebts.filter(d => d.remainingAmount > 0).map(d => d.supplierId));
    const outstandingSuppliersCount = outstandingSupplierIds.size;

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>
                        Dashboard / <strong style={{ color: '#555' }}>Nhà cung cấp</strong>
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>
                        Nhà cung cấp & Công nợ
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                        Quản lý hồ sơ đối tác và theo dõi nợ nhập hàng
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />} onClick={handleExportExcel}
                        sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', fontSize: 13, borderRadius: 2 }}>
                        Xuất Excel
                    </Button>
                    {isAdmin && (
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFile sx={{ fontSize: 15 }} />}
                            sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#1976d2', fontSize: 13, borderRadius: 2 }}
                        >
                            Nhập Excel
                            <input type="file" hidden accept=".xlsx, .xls" onChange={handleImportExcel} />
                        </Button>
                    )}
                    {isAdmin && (
                        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
                            sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#1d4ed8' }, boxShadow: '0 4px 12px rgba(25,118,210,0.2)' }}>
                            Thêm nhà cung cấp
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Uniform premium Stats Dashboard */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {[
                    {
                        label: 'Tổng nợ NCC',
                        value: fmtCurrency(totalOutstandingDebt),
                        desc: `Dựa trên ${outstandingSuppliersCount} NCC còn dư nợ`,
                        color: '#d32f2f',
                        borderColor: '#ffcdd2',
                        bgColor: '#fff5f5'
                    },
                    {
                        label: 'Tổng số NCC',
                        value: totalElements,
                        desc: 'Tất cả đối tác trong hệ thống',
                        color: '#1a1a2e',
                        borderColor: '#f0f0f0',
                        bgColor: '#fff'
                    },
                    {
                        label: 'Đang hoạt động',
                        value: activeCount,
                        desc: 'Sẵn sàng giao dịch',
                        color: '#2e7d32',
                        borderColor: '#c8e6c9',
                        bgColor: '#f1f8e9'
                    },
                    {
                        label: 'Vô hiệu hóa',
                        value: totalElements - activeCount,
                        desc: 'Tạm ngưng hợp tác',
                        color: '#757575',
                        borderColor: '#f0f0f0',
                        bgColor: '#fff'
                    }
                ].map((s, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <Paper elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: s.borderColor,
                                bgcolor: s.bgColor,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: 1
                            }}
                        >
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {s.label}
                                </Typography>
                                <Typography variant="h5" fontWeight={900} color={s.color} sx={{ my: 0.5, fontSize: s.label.includes('nợ') ? '1.5rem' : '1.75rem' }}>
                                    {s.value}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {s.desc}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>


            {/* Search */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                        size="small" fullWidth
                        placeholder="Tìm Tên, Mã số thuế, SĐT, Email..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" sx={{ color: '#bbb' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button variant="contained" onClick={handleSearch}
                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#2563eb', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#1d4ed8' } }}>
                        Tìm kiếm
                    </Button>
                    <Tooltip title="Làm mới">
                        <IconButton onClick={fetchSuppliers} sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                            <Refresh sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['TÊN NCC', 'MÃ SỐ THUẾ', 'THÔNG TIN LIÊN HỆ', 'NGÂN HÀNG', 'NET TERMS', 'TRẠNG THÁI', 'HÀNH ĐỘNG'].map(h => (
                                    <TableCell key={h} sx={{ color: '#888', fontWeight: 700, fontSize: 11, py: 1.5, letterSpacing: 0.3 }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : suppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        <Typography fontSize={36} mb={1}>🏢</Typography>
                                        <Typography variant="body2">Không có nhà cung cấp nào</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                suppliers.map((s, idx) => (
                                    <TableRow key={s.id} hover
                                        sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', opacity: s.isActive ? 1 : 0.6, '&:hover': { bgcolor: '#f5f9ff' } }}>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 34, height: 34, bgcolor: '#e3f2fd', color: '#1976d2', fontSize: 14, fontWeight: 700 }}>
                                                    {s.name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700} fontSize={13}>{s.name}</Typography>
                                                    {s.contactPerson && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {s.contactPerson}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontFamily="monospace" color="#555">
                                                {s.taxCode || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {s.phone && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                                    <Phone sx={{ fontSize: 12, color: '#aaa' }} />
                                                    <Typography variant="caption">{s.phone}</Typography>
                                                </Box>
                                            )}
                                            {s.email && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Email sx={{ fontSize: 12, color: '#aaa' }} />
                                                    <Typography variant="caption">{s.email}</Typography>
                                                </Box>
                                            )}
                                            {!s.phone && !s.email && <Typography variant="caption" color="#bbb">—</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            {s.bankName ? (
                                                <>
                                                    <Typography variant="body2" fontSize={12} fontWeight={500}>{s.bankName}</Typography>
                                                    {s.bankAccount && (
                                                        <Typography variant="caption" color="text.secondary">{s.bankAccount}</Typography>
                                                    )}
                                                </>
                                            ) : <Typography variant="caption" color="#bbb">—</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={`Net ${s.paymentTerms}`} size="small" variant="outlined"
                                                sx={{ fontSize: 11, height: 22, fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={s.isActive ? 'Hoạt động' : 'Dừng'}
                                                size="small"
                                                sx={{
                                                    height: 22, fontSize: 11, fontWeight: 700,
                                                    bgcolor: s.isActive ? '#e8f5e9' : '#f5f5f5',
                                                    color: s.isActive ? '#2e7d32' : '#888',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.25 }}>
                                                <Tooltip title="Xem chi tiết">
                                                    <IconButton size="small" onClick={() => openDetail(s)}
                                                        sx={{ color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' } }}>
                                                        <Info sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {isAdmin && (
                                                    <Tooltip title="Chỉnh sửa">
                                                        <IconButton size="small" onClick={() => openEdit(s)}
                                                            sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}>
                                                            <Edit sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {isAdmin && (
                                                    <Tooltip title={s.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                                                        <IconButton size="small" onClick={() => handleToggle(s)}
                                                            sx={{ '&:hover': { color: s.isActive ? '#d32f2f' : '#2e7d32' } }}>
                                                            {s.isActive
                                                                ? <ToggleOn fontSize="small" sx={{ color: '#16a34a' }} />
                                                                : <ToggleOff fontSize="small" sx={{ color: '#bbb' }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                    <Typography variant="caption" color="text.secondary">
                        Hiển thị <strong>{suppliers.length}</strong> / <strong>{totalElements}</strong> nhà cung cấp
                    </Typography>
                    {totalPages > 1 && (
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)}
                            color="primary" shape="rounded" size="small" />
                    )}
                </Box>
            </Paper>

            {/* Dialogs */}
            <SupplierDetailDialog
                open={detailOpen}
                supplier={selectedSupplier}
                onClose={() => setDetailOpen(false)}
                onEdit={openEdit}
            />

            <SupplierFormDialog
                open={formOpen}
                editTarget={editTarget}
                onClose={() => setFormOpen(false)}
                onSaved={() => {
                    showSnack(editTarget ? 'Cập nhật nhà cung cấp thành công' : 'Thêm nhà cung cấp thành công');
                    fetchSuppliers();
                }}
            />

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={3000}
                onClose={() => setSnack(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(p => ({ ...p, open: false }))}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SupplierPage;