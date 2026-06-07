import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Button, TextField,
    InputAdornment, Chip, IconButton, Select, MenuItem,
    FormControl, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Skeleton, Alert, Snackbar,
    Dialog, DialogContent, DialogActions,
    Avatar, Tooltip, Checkbox,
    CircularProgress,
} from '@mui/material';
import {
    Search, Add, Edit, Lock, LockOpen, Refresh,
    Close, AdminPanelSettings, Person, PointOfSale,
    Check, Save, Security, History,
    Visibility, VisibilityOff, ManageAccounts,
    CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../../services/axiosConfig';
import { authApi } from '../../../../services/authApi';
// User type defined inline below


// ── Inline User type (adjust fields to match your types/index.ts) ──────────
interface User {
    id: string;
    username?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    active?: boolean;
    warehouseId?: string;
    warehouseName?: string;
    lastLoginAt?: string;
    isLocked?: boolean;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const ROLES = [
    { value: 'ROLE_ADMIN', label: 'Admin', color: '#dc2626', bg: '#fee2e2', icon: <AdminPanelSettings sx={{ fontSize: 14 }} />, desc: 'Toàn quyền hệ thống' },
    { value: 'ROLE_MANAGER', label: 'Quản lý', color: '#d97706', bg: '#fef3c7', icon: <ManageAccounts sx={{ fontSize: 14 }} />, desc: 'Quản lý chi nhánh' },
    { value: 'ROLE_CASHIER', label: 'Thu ngân', color: '#2563eb', bg: '#dbeafe', icon: <PointOfSale sx={{ fontSize: 14 }} />, desc: 'Chỉ bán hàng POS' },
];

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]));

// Module permission matrix
const PERMISSION_MODULES = [
    {
        module: 'Dashboard', key: 'DASHBOARD',
        permissions: [
            { key: 'DASHBOARD_VIEW', label: 'Xem dashboard' },
            { key: 'DASHBOARD_REVENUE', label: 'Xem doanh thu' },
            { key: 'DASHBOARD_AI', label: 'Dùng AI Co-pilot' },
        ],
    },
    {
        module: 'Bán hàng (POS)', key: 'POS',
        permissions: [
            { key: 'POS_ACCESS', label: 'Vào màn hình POS' },
            { key: 'POS_OPEN_SHIFT', label: 'Mở ca' },
            { key: 'POS_CLOSE_SHIFT', label: 'Đóng ca' },
            { key: 'POS_DISCOUNT', label: 'Áp chiết khấu đơn' },
            { key: 'POS_WHOLESALE', label: 'Bật giá sỉ' },
            { key: 'POS_EDIT_PRICE', label: 'Sửa giá trực tiếp' },
            { key: 'POS_REFUND', label: 'Hoàn trả hàng' },
        ],
    },
    {
        module: 'Đơn hàng', key: 'ORDER',
        permissions: [
            { key: 'ORDER_VIEW', label: 'Xem danh sách đơn' },
            { key: 'ORDER_CREATE', label: 'Tạo đơn mới' },
            { key: 'ORDER_EDIT', label: 'Sửa đơn hàng' },
            { key: 'ORDER_CANCEL', label: 'Hủy đơn' },
            { key: 'ORDER_APPROVE', label: 'Duyệt đơn' },
        ],
    },
    {
        module: 'Kho hàng', key: 'INVENTORY',
        permissions: [
            { key: 'INVENTORY_VIEW', label: 'Xem tồn kho' },
            { key: 'INVENTORY_IMPORT', label: 'Tạo phiếu nhập' },
            { key: 'INVENTORY_TRANSFER', label: 'Chuyển kho' },
            { key: 'INVENTORY_ADJUST', label: 'Kiểm kê / Điều chỉnh' },
            { key: 'INVENTORY_EXPORT', label: 'Export Excel kho' },
        ],
    },
    {
        module: 'Sản phẩm', key: 'PRODUCT',
        permissions: [
            { key: 'PRODUCT_VIEW', label: 'Xem sản phẩm' },
            { key: 'PRODUCT_CREATE', label: 'Thêm sản phẩm' },
            { key: 'PRODUCT_EDIT', label: 'Sửa sản phẩm' },
            { key: 'PRODUCT_DELETE', label: 'Xóa sản phẩm' },
            { key: 'PRODUCT_IMPORT', label: 'Import từ Excel' },
        ],
    },
    {
        module: 'Nhà cung cấp', key: 'SUPPLIER',
        permissions: [
            { key: 'SUPPLIER_VIEW', label: 'Xem NCC' },
            { key: 'SUPPLIER_CREATE', label: 'Thêm NCC' },
            { key: 'SUPPLIER_EDIT', label: 'Sửa NCC' },
            { key: 'SUPPLIER_IMPORT', label: 'Import NCC từ Excel' },
        ],
    },
    {
        module: 'Tài chính', key: 'FINANCE',
        permissions: [
            { key: 'FINANCE_VIEW', label: 'Xem sổ quỹ' },
            { key: 'FINANCE_CREATE_ENTRY', label: 'Tạo phiếu thu/chi' },
            { key: 'FINANCE_DEBT_VIEW', label: 'Xem công nợ NCC' },
            { key: 'FINANCE_DEBT_PAY', label: 'Thanh toán công nợ' },
            { key: 'FINANCE_COD', label: 'Đối soát COD' },
            { key: 'FINANCE_EXPORT', label: 'Export Excel tài chính' },
        ],
    },
    {
        module: 'Báo cáo', key: 'REPORT',
        permissions: [
            { key: 'REPORT_VIEW', label: 'Xem báo cáo doanh thu' },
            { key: 'REPORT_INVENTORY', label: 'Xem phân bổ kho' },
            { key: 'REPORT_EXPORT', label: 'Export báo cáo Excel' },
        ],
    },
    {
        module: 'Khách hàng', key: 'CUSTOMER',
        permissions: [
            { key: 'CUSTOMER_VIEW', label: 'Xem danh sách KH' },
            { key: 'CUSTOMER_CREATE', label: 'Thêm khách hàng' },
            { key: 'CUSTOMER_EDIT', label: 'Sửa thông tin KH' },
        ],
    },
    {
        module: 'Cài đặt hệ thống', key: 'SETTINGS',
        permissions: [
            { key: 'SETTINGS_USERS', label: 'Quản lý người dùng' },
            { key: 'SETTINGS_ROLES', label: 'Phân quyền role' },
            { key: 'SETTINGS_WAREHOUSE', label: 'Quản lý chi nhánh' },
            { key: 'SETTINGS_SYSTEM', label: 'Cài đặt hệ thống' },
        ],
    },
];

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<string, Set<string>> = {
    ROLE_ADMIN: new Set(PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key))),
    ROLE_MANAGER: new Set([
        'DASHBOARD_VIEW', 'DASHBOARD_REVENUE', 'DASHBOARD_AI',
        'POS_ACCESS', 'POS_OPEN_SHIFT', 'POS_CLOSE_SHIFT', 'POS_DISCOUNT', 'POS_WHOLESALE',
        'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_EDIT', 'ORDER_CANCEL',
        'INVENTORY_VIEW', 'INVENTORY_IMPORT', 'INVENTORY_TRANSFER', 'INVENTORY_ADJUST', 'INVENTORY_EXPORT',
        'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_IMPORT',
        'SUPPLIER_VIEW', 'SUPPLIER_CREATE', 'SUPPLIER_EDIT',
        'FINANCE_VIEW', 'FINANCE_CREATE_ENTRY', 'FINANCE_DEBT_VIEW', 'FINANCE_DEBT_PAY', 'FINANCE_COD', 'FINANCE_EXPORT',
        'REPORT_VIEW', 'REPORT_INVENTORY', 'REPORT_EXPORT',
        'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
    ]),
    ROLE_CASHIER: new Set([
        'DASHBOARD_VIEW',
        'POS_ACCESS', 'POS_OPEN_SHIFT', 'POS_CLOSE_SHIFT',
        'ORDER_VIEW', 'ORDER_CREATE',
        'INVENTORY_VIEW',
        'PRODUCT_VIEW',
        'CUSTOMER_VIEW', 'CUSTOMER_CREATE',
    ]),
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtDate = (s?: string) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
};

const getInitials = (name?: string) =>
    (name ?? 'U').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

const avatarColor = (name?: string) => {
    const colors = ['#1d4ed8', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#dc2626'];
    let hash = 0;
    for (const c of (name ?? '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// ─────────────────────────────────────────────────────────────
// EDIT USER DIALOG
// ─────────────────────────────────────────────────────────────
const EditUserDialog: React.FC<{
    open: boolean;
    user: User | null;
    onClose: () => void;
    onSaved: () => void;
}> = ({ open, user, onClose, onSaved }) => {
    const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: 'ROLE_CASHIER', warehouseId: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [warehouses, setWarehouses] = useState<any[]>([]);

    useEffect(() => {
        if (open && user) {
            setForm({ fullName: user.fullName ?? '', email: user.email ?? '', phone: user.phone ?? '', role: user.role ?? 'ROLE_CASHIER', warehouseId: user.warehouseId ?? '' });
            setErr('');
        }
        axiosInstance.get('/warehouses').then(r => setWarehouses(r.data?.data?.content ?? r.data?.data ?? [])).catch(() => { });
    }, [open, user]);

    const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSave = async () => {
        if (!form.fullName.trim()) { setErr('Vui lòng nhập họ tên'); return; }
        setSaving(true); setErr('');
        try {
            await axiosInstance.put(`/users/${user?.id}`, form);
            onSaved(); onClose();
        } catch (e: any) {
            setErr(e.response?.data?.message || 'Cập nhật thất bại');
        } finally { setSaving(false); }
    };

    const roleInfo = ROLE_MAP[form.role];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={800} color="#fff" fontSize={16}>Chỉnh sửa người dùng</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)">{user?.username}</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setErr('')}>{err}</Alert>}

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Họ và tên *</Typography>
                        <TextField fullWidth size="small" value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Email</Typography>
                        <TextField fullWidth size="small" value={form.email} onChange={set('email')} type="email" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Số điện thoại</Typography>
                        <TextField fullWidth size="small" value={form.phone} onChange={set('phone')} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Role *</Typography>
                        <FormControl fullWidth size="small">
                            <Select value={form.role} onChange={set('role')}>
                                {ROLES.map(r => (
                                    <MenuItem key={r.value} value={r.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={r.label} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: r.bg, color: r.color }} />
                                            <Typography variant="caption" color="#9ca3af">{r.desc}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Chi nhánh</Typography>
                        <FormControl fullWidth size="small">
                            <Select value={form.warehouseId} onChange={set('warehouseId')} displayEmpty>
                                <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                {warehouses.map((w: any) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Role preview */}
                {roleInfo && (
                    <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: roleInfo.bg, border: `1px solid ${roleInfo.color}30` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box sx={{ color: roleInfo.color }}>{roleInfo.icon}</Box>
                            <Typography fontWeight={700} color={roleInfo.color} fontSize={13}>Role: {roleInfo.label}</Typography>
                        </Box>
                        <Typography variant="caption" color={roleInfo.color} sx={{ opacity: 0.8 }}>{roleInfo.desc}</Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                <Button onClick={handleSave} variant="contained" disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)' }}>
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// CREATE USER DIALOG
// ─────────────────────────────────────────────────────────────
const CreateUserDialog: React.FC<{ open: boolean; onClose: () => void; onCreated: () => void }> = ({ open, onClose, onCreated }) => {
    const [form, setForm] = useState({ username: '', fullName: '', email: '', phone: '', password: '', role: 'ROLE_CASHIER', warehouseId: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [warehouses, setWarehouses] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            setForm({ username: '', fullName: '', email: '', phone: '', password: '', role: 'ROLE_CASHIER', warehouseId: '' });
            setErr('');
            axiosInstance.get('/warehouses').then(r => setWarehouses(r.data?.data?.content ?? r.data?.data ?? [])).catch(() => { });
        }
    }, [open]);

    const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleCreate = async () => {
        if (!form.username.trim()) { setErr('Vui lòng nhập tên đăng nhập'); return; }
        if (!form.fullName.trim()) { setErr('Vui lòng nhập họ tên'); return; }
        if (!form.password || form.password.length < 6) { setErr('Mật khẩu tối thiểu 6 ký tự'); return; }
        setSaving(true); setErr('');
        try {
            await axiosInstance.post('/users', form);
            onCreated(); onClose();
        } catch (e: any) {
            setErr(e.response?.data?.message || 'Tạo tài khoản thất bại');
        } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={800} color="#fff" fontSize={16}>Tạo tài khoản mới</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)">Thêm người dùng vào hệ thống</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setErr('')}>{err}</Alert>}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Tên đăng nhập *</Typography>
                        <TextField fullWidth size="small" value={form.username} onChange={set('username')} placeholder="nguyenvana" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Họ và tên *</Typography>
                        <TextField fullWidth size="small" value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Email</Typography>
                        <TextField fullWidth size="small" value={form.email} onChange={set('email')} type="email" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Số điện thoại</Typography>
                        <TextField fullWidth size="small" value={form.phone} onChange={set('phone')} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Mật khẩu *</Typography>
                        <TextField fullWidth size="small" value={form.password} onChange={set('password')} type={showPwd ? 'text' : 'password'}
                            InputProps={{ endAdornment: <IconButton size="small" onClick={() => setShowPwd(v => !v)}>{showPwd ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton> }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Role</Typography>
                        <FormControl fullWidth size="small">
                            <Select value={form.role} onChange={set('role')}>
                                {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Chi nhánh phụ trách</Typography>
                        <FormControl fullWidth size="small">
                            <Select value={form.warehouseId} onChange={set('warehouseId')} displayEmpty>
                                <MenuItem value="">Không giới hạn chi nhánh</MenuItem>
                                {warehouses.map((w: any) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                <Button onClick={handleCreate} variant="contained" disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
                    {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// TAB 1: USERS
// ─────────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [editUser, setEditUser] = useState<User | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [snack, setSnack] = useState('');
    const [page, setPage] = useState(0);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['users-admin', search, roleFilter, page],
        queryFn: async () => {
            const q = new URLSearchParams({ page: String(page), size: '15' });
            if (search) q.set('keyword', search);
            if (roleFilter) q.set('role', roleFilter);
            const res = await axiosInstance.get(`/users?${q}`);
            return res.data?.data;
        },
    });

    const users: User[] = data?.content ?? data ?? [];
    const totalPages = data?.totalPages ?? 1;

    const toggleActive = async (user: User) => {
        setTogglingId(user.id);
        try {
            await axiosInstance.patch(`/users/${user.id}/toggle-active`);
            refetch();
            setSnack(`${user.active ? 'Khóa' : 'Kích hoạt'} tài khoản ${user.fullName} thành công`);
        } catch { /* silent */ }
        finally { setTogglingId(null); }
    };

    const handleUnlockUser = async (user: User) => {
        setTogglingId(`unlock_${user.id}`);
        try {
            await authApi.unlockUser(user.username ?? '');
            refetch();
            setSnack(`Đã mở khóa tài khoản ${user.username} thành công!`);
        } catch (e: any) {
            const msg = e.response?.data?.message || 'Có lỗi xảy ra khi mở khóa';
            setSnack(`Lỗi: ${msg}`);
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <Box>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" placeholder="Tìm theo tên, username, email..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment> }}
                    sx={{ flex: 1, minWidth: 220 }} />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0); }} displayEmpty>
                        <MenuItem value="">Tất cả role</MenuItem>
                        {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                    </Select>
                </FormControl>
                <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 14 }} />} onClick={() => refetch()}
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
                <Button variant="contained" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={() => setCreateOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    Tạo tài khoản
                </Button>
            </Box>

            {/* Role summary */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {ROLES.map(r => {
                    const count = users.filter(u => u.role === r.value).length;
                    return (
                        <Box key={r.value} sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: r.bg, border: `1px solid ${r.color}30`, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ color: r.color }}>{r.icon}</Box>
                            <Typography variant="caption" fontWeight={700} color={r.color}>{r.label}: {count}</Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                {['Người dùng', 'Username', 'Role', 'Chi nhánh', 'Trạng thái', 'Đăng nhập cuối', 'Thao tác'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#6b7280', py: 1.25 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4].map(i => <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7].map(j => <TableCell key={j}><Skeleton height={22} /></TableCell>)}</TableRow>)
                            ) : users.length > 0 ? (
                                users.map((u, idx) => {
                                    const roleInfo = ROLE_MAP[u.role ?? ''];
                                    return (
                                        <TableRow key={u.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', opacity: u.active === false ? 0.6 : 1 }}>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                    <Avatar sx={{ width: 34, height: 34, bgcolor: avatarColor(u.fullName), fontSize: 13, fontWeight: 700 }}>
                                                        {getInitials(u.fullName)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontSize={13} fontWeight={700}>{u.fullName}</Typography>
                                                        <Typography variant="caption" color="#9ca3af">{u.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontFamily="monospace" color="#374151">{u.username}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {roleInfo ? (
                                                    <Chip
                                                        icon={<Box sx={{ color: roleInfo.color, display: 'flex', pl: 0.5 }}>{roleInfo.icon}</Box>}
                                                        label={roleInfo.label} size="small"
                                                        sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: roleInfo.bg, color: roleInfo.color }} />
                                                ) : (
                                                    <Typography variant="caption" color="#9ca3af">{u.role}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="#6b7280">{u.warehouseName ?? '—'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        label={u.active !== false ? 'Hoạt động' : 'Bị khóa'}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: u.active !== false ? '#f0fdf4' : '#fef2f2', color: u.active !== false ? '#16a34a' : '#dc2626' }}
                                                    />
                                                    {u.isLocked && (
                                                        <Chip
                                                            label="Bị khóa đăng nhập"
                                                            size="small"
                                                            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="#9ca3af">{fmtDate(u.lastLoginAt)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {u.isLocked && (
                                                        <Tooltip title="Mở khóa đăng nhập (Lockout)">
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="warning"
                                                                disabled={togglingId === `unlock_${u.id}`}
                                                                onClick={() => handleUnlockUser(u)}
                                                                sx={{ height: 24, fontSize: 10, textTransform: 'none', px: 1, minWidth: 'auto', boxShadow: 'none' }}
                                                            >
                                                                {togglingId === `unlock_${u.id}` ? 'Đang mở...' : 'Mở khóa'}
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Chỉnh sửa">
                                                        <IconButton size="small" onClick={() => setEditUser(u)} sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}>
                                                            <Edit sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={u.active !== false ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}>
                                                        <IconButton size="small" onClick={() => toggleActive(u)} disabled={togglingId === u.id}
                                                            sx={{ color: u.active !== false ? '#ef4444' : '#22c55e', '&:hover': { bgcolor: u.active !== false ? '#fef2f2' : '#f0fdf4' } }}>
                                                            {togglingId === u.id ? <CircularProgress size={14} /> : u.active !== false ? <Lock sx={{ fontSize: 16 }} /> : <LockOpen sx={{ fontSize: 16 }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Person sx={{ fontSize: 48, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography color="#9ca3af" fontSize={13}>Không tìm thấy người dùng nào</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="#6b7280">Tổng <strong>{users.length}</strong> người dùng</Typography>
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <Button key={i} size="small" variant={page === i ? 'contained' : 'outlined'}
                                    onClick={() => setPage(i)}
                                    sx={{ minWidth: 32, height: 28, p: 0, fontSize: 11, borderColor: '#e0e0e0', color: page === i ? '#fff' : '#555' }}>
                                    {i + 1}
                                </Button>
                            ))}
                        </Box>
                    )}
                </Box>
            </Paper>

            <EditUserDialog open={!!editUser} user={editUser} onClose={() => setEditUser(null)} onSaved={() => { refetch(); setSnack('Cập nhật người dùng thành công!'); }} />
            <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { refetch(); setSnack('Tạo tài khoản thành công!'); }} />
            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 600 }}>{snack}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// TAB 2: PERMISSION MATRIX
// ─────────────────────────────────────────────────────────────
const PermissionMatrixTab: React.FC = () => {
    // Local state — initialized từ DEFAULT_PERMISSIONS
    const [matrix, setMatrix] = useState<Record<string, Set<string>>>({
        ROLE_ADMIN: new Set(DEFAULT_PERMISSIONS.ROLE_ADMIN),
        ROLE_MANAGER: new Set(DEFAULT_PERMISSIONS.ROLE_MANAGER),
        ROLE_CASHIER: new Set(DEFAULT_PERMISSIONS.ROLE_CASHIER),
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [snack, setSnack] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(PERMISSION_MODULES.map(m => m.key)));
    const [filterModule, setFilterModule] = useState('');

    // Load từ backend (nếu có endpoint GET /permissions/matrix)
    useEffect(() => {
        axiosInstance.get('/permissions/matrix')
            .then(res => {
                const data = res.data?.data;
                if (data) {
                    const next: Record<string, Set<string>> = {
                        ROLE_ADMIN: new Set(data.ROLE_ADMIN ?? DEFAULT_PERMISSIONS.ROLE_ADMIN),
                        ROLE_MANAGER: new Set(data.ROLE_MANAGER ?? DEFAULT_PERMISSIONS.ROLE_MANAGER),
                        ROLE_CASHIER: new Set(data.ROLE_CASHIER ?? DEFAULT_PERMISSIONS.ROLE_CASHIER),
                    };
                    setMatrix(next);
                }
            })
            .catch(() => { /* dùng default */ })
            .finally(() => setLoading(false));
    }, []);

    const toggle = (role: string, permKey: string) => {
        setMatrix(prev => {
            const next = { ...prev, [role]: new Set(prev[role]) };
            if (next[role].has(permKey)) next[role].delete(permKey);
            else next[role].add(permKey);
            return next;
        });
        setSaved(false);
    };

    const toggleModule = (role: string, moduleKey: string, checked: boolean) => {
        const mod = PERMISSION_MODULES.find(m => m.key === moduleKey);
        if (!mod) return;
        setMatrix(prev => {
            const next = { ...prev, [role]: new Set(prev[role]) };
            mod.permissions.forEach(p => {
                if (checked) next[role].add(p.key);
                else next[role].delete(p.key);
            });
            return next;
        });
        setSaved(false);
    };

    const toggleAll = (role: string, checked: boolean) => {
        setMatrix(prev => ({
            ...prev,
            [role]: checked ? new Set(PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key))) : new Set(),
        }));
        setSaved(false);
    };

    const resetToDefault = (role: string) => {
        setMatrix(prev => ({ ...prev, [role]: new Set(DEFAULT_PERMISSIONS[role]) }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosInstance.post('/permissions/matrix', {
                ROLE_ADMIN: Array.from(matrix.ROLE_ADMIN),
                ROLE_MANAGER: Array.from(matrix.ROLE_MANAGER),
                ROLE_CASHIER: Array.from(matrix.ROLE_CASHIER),
            });
            setSaved(true);
            setSnack('Lưu phân quyền thành công!');
        } catch (e: any) {
            setSnack(`Lưu thất bại: ${e.response?.data?.message ?? 'Lỗi hệ thống'}`);
        } finally { setSaving(false); }
    };

    const filteredModules = PERMISSION_MODULES.filter(m =>
        !filterModule || m.key === filterModule
    );

    const getModuleState = (role: string, moduleKey: string): 'all' | 'none' | 'partial' => {
        const mod = PERMISSION_MODULES.find(m => m.key === moduleKey);
        if (!mod) return 'none';
        const total = mod.permissions.length;
        const checked = mod.permissions.filter(p => matrix[role]?.has(p.key)).length;
        if (checked === 0) return 'none';
        if (checked === total) return 'all';
        return 'partial';
    };

    if (loading) {
        return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={filterModule} onChange={e => setFilterModule(e.target.value)} displayEmpty>
                        <MenuItem value="">Tất cả module</MenuItem>
                        {PERMISSION_MODULES.map(m => <MenuItem key={m.key} value={m.key}>{m.module}</MenuItem>)}
                    </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color={saved ? '#16a34a' : '#9ca3af'} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {saved && <Check sx={{ fontSize: 14 }} />} {saved ? 'Đã lưu' : 'Có thay đổi chưa lưu'}
                </Typography>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Save sx={{ fontSize: 16 }} />}
                    onClick={handleSave} disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
                    {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
                </Button>
            </Box>

            {/* Legend */}
            <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
                <Typography variant="caption">💡 <strong>Admin</strong> luôn có toàn bộ quyền và không thể bỏ. Thay đổi quyền <strong>Manager</strong> và <strong>Cashier</strong> sẽ áp dụng ngay sau khi lưu và yêu cầu đăng nhập lại.</Typography>
            </Alert>

            {/* Matrix table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#374151', bgcolor: '#f9fafb', py: 1.5, minWidth: 240, position: 'sticky', left: 0, zIndex: 3 }}>
                                    Module / Chức năng
                                </TableCell>
                                {ROLES.map(role => (
                                    <TableCell key={role.value} align="center" sx={{ fontWeight: 700, fontSize: 12, bgcolor: '#f9fafb', py: 1.5, minWidth: 140 }}>
                                        <Box>
                                            <Chip icon={<Box sx={{ color: role.color, display: 'flex', pl: 0.5 }}>{role.icon}</Box>} label={role.label} size="small"
                                                sx={{ height: 24, fontWeight: 700, bgcolor: role.bg, color: role.color, mb: 0.5 }} />
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 0.5 }}>
                                                {role.value !== 'ROLE_ADMIN' && (
                                                    <>
                                                        <Tooltip title="Chọn tất cả">
                                                            <IconButton size="small" onClick={() => toggleAll(role.value, true)} sx={{ p: 0.25 }}>
                                                                <CheckBox sx={{ fontSize: 14, color: role.color }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Bỏ tất cả">
                                                            <IconButton size="small" onClick={() => toggleAll(role.value, false)} sx={{ p: 0.25 }}>
                                                                <CheckBoxOutlineBlank sx={{ fontSize: 14, color: '#9ca3af' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reset về mặc định">
                                                            <IconButton size="small" onClick={() => resetToDefault(role.value)} sx={{ p: 0.25 }}>
                                                                <Refresh sx={{ fontSize: 14, color: '#9ca3af' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredModules.map(mod => (
                                <React.Fragment key={mod.key}>
                                    {/* Module header row */}
                                    <TableRow sx={{ bgcolor: '#f8faff', cursor: 'pointer' }} onClick={() => setExpandedModules(prev => {
                                        const next = new Set(prev);
                                        next.has(mod.key) ? next.delete(mod.key) : next.add(mod.key);
                                        return next;
                                    })}>
                                        <TableCell sx={{ py: 1.25, pl: 2, position: 'sticky', left: 0, bgcolor: '#f0f5ff', zIndex: 2, borderLeft: '3px solid #3b82f6' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography fontSize={12.5} fontWeight={800} color="#1d4ed8">{mod.module}</Typography>
                                                <Typography variant="caption" color="#9ca3af">({mod.permissions.length} quyền)</Typography>
                                            </Box>
                                        </TableCell>
                                        {ROLES.map(role => {
                                            const state = getModuleState(role.value, mod.key);
                                            return (
                                                <TableCell key={role.value} align="center" sx={{ bgcolor: '#f0f5ff' }}
                                                    onClick={e => { e.stopPropagation(); if (role.value !== 'ROLE_ADMIN') toggleModule(role.value, mod.key, state !== 'all'); }}>
                                                    {role.value === 'ROLE_ADMIN' ? (
                                                        <CheckBox sx={{ fontSize: 18, color: '#16a34a' }} />
                                                    ) : state === 'all' ? (
                                                        <CheckBox sx={{ fontSize: 18, color: role.color }} />
                                                    ) : state === 'partial' ? (
                                                        <IndeterminateCheckBox sx={{ fontSize: 18, color: role.color }} />
                                                    ) : (
                                                        <CheckBoxOutlineBlank sx={{ fontSize: 18, color: '#d1d5db' }} />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Permission rows */}
                                    {expandedModules.has(mod.key) && mod.permissions.map(perm => (
                                        <TableRow key={perm.key} hover sx={{ '&:hover': { bgcolor: '#fafbff' } }}>
                                            <TableCell sx={{ py: 1, pl: 4, position: 'sticky', left: 0, bgcolor: '#fff', zIndex: 2 }}>
                                                <Typography variant="caption" color="#374151" fontSize={12}>{perm.label}</Typography>
                                                <Typography variant="caption" color="#c4c9d4" fontSize={10} display="block" fontFamily="monospace">{perm.key}</Typography>
                                            </TableCell>
                                            {ROLES.map(role => {
                                                const checked = role.value === 'ROLE_ADMIN' ? true : matrix[role.value]?.has(perm.key);
                                                return (
                                                    <TableCell key={role.value} align="center" sx={{ py: 0.75 }}>
                                                        <Checkbox
                                                            checked={checked ?? false}
                                                            disabled={role.value === 'ROLE_ADMIN'}
                                                            onChange={() => toggle(role.value, perm.key)}
                                                            size="small"
                                                            sx={{
                                                                p: 0.5,
                                                                color: '#d1d5db',
                                                                '&.Mui-checked': { color: role.color },
                                                                '&.Mui-disabled': { color: '#d1d5db' },
                                                            }}
                                                        />
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.startsWith('Lưu thất bại') ? 'error' : 'success'} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// TAB 3: AUDIT LOG
// ─────────────────────────────────────────────────────────────
const AuditLogTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/permissions/audit-log?page=0&size=20');
            setLogs(res.data?.data?.content ?? res.data?.data ?? []);
            setTotal(res.data?.data?.totalElements ?? 0);
        } catch { setLogs([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const ACTION_STYLE: Record<string, { label: string; color: string; bg: string }> = {
        ROLE_CHANGED: { label: 'Đổi role', color: '#d97706', bg: '#fef3c7' },
        USER_CREATED: { label: 'Tạo user', color: '#16a34a', bg: '#dcfce7' },
        USER_LOCKED: { label: 'Khóa user', color: '#dc2626', bg: '#fee2e2' },
        USER_UNLOCKED: { label: 'Mở khóa', color: '#2563eb', bg: '#dbeafe' },
        PERM_UPDATED: { label: 'Đổi quyền', color: '#7c3aed', bg: '#ede9fe' },
        default: { label: 'Thay đổi', color: '#6b7280', bg: '#f3f4f6' },
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography fontWeight={700} color="#374151">Lịch sử thay đổi phân quyền</Typography>
                    <Typography variant="caption" color="#9ca3af">Tổng {total} bản ghi</Typography>
                </Box>
                <Button size="small" startIcon={<Refresh sx={{ fontSize: 14 }} />} onClick={load} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                {['Thời gian', 'Người thực hiện', 'Hành động', 'Đối tượng', 'Trước', 'Sau'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#6b7280', py: 1.25 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4].map(i => <TableRow key={i}>{[1, 2, 3, 4, 5, 6].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                            ) : logs.length > 0 ? (
                                logs.map((log, i) => {
                                    const st = ACTION_STYLE[log.action] ?? ACTION_STYLE.default;
                                    return (
                                        <TableRow key={i} hover sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <TableCell><Typography variant="caption" fontFamily="monospace" fontSize={11}>{fmtDate(log.createdAt)}</Typography></TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <Avatar sx={{ width: 24, height: 24, fontSize: 10, fontWeight: 700, bgcolor: avatarColor(log.performedByName) }}>{getInitials(log.performedByName)}</Avatar>
                                                    <Typography variant="caption" fontWeight={600}>{log.performedByName ?? log.performedBy}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Chip label={st.label} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: st.bg, color: st.color }} /></TableCell>
                                            <TableCell><Typography variant="caption" color="#374151">{log.targetName ?? log.targetId}</Typography></TableCell>
                                            <TableCell><Typography variant="caption" color="#9ca3af" fontFamily="monospace">{log.oldValue ?? '—'}</Typography></TableCell>
                                            <TableCell><Typography variant="caption" color="#374151" fontFamily="monospace" fontWeight={600}>{log.newValue ?? '—'}</Typography></TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <History sx={{ fontSize: 48, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography color="#9ca3af" fontSize={13}>Chưa có lịch sử thay đổi</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const RolePermissionPage: React.FC = () => {
    const [tab, setTab] = useState(0);

    const TAB_CONFIG = [
        { label: 'Người dùng', icon: <Person sx={{ fontSize: 16 }} />, desc: 'Quản lý tài khoản' },
        { label: 'Phân quyền', icon: <Security sx={{ fontSize: 16 }} />, desc: 'Ma trận quyền hạn' },
        { label: 'Lịch sử', icon: <History sx={{ fontSize: 16 }} />, desc: 'Audit log thay đổi' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>Dashboard / Cài đặt / <strong style={{ color: '#6b7280' }}>Phân quyền</strong></Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">Quản lý Phân quyền</Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>Quản lý người dùng, gán role và cấu hình quyền hạn theo module</Typography>
            </Box>

            {/* Role info cards */}
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {ROLES.map(r => (
                    <Grid size={{ xs: 12, sm: 4 }} key={r.value}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${r.color}30`, bgcolor: r.bg, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#fff', color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 1px ${r.color}30` }}>
                                {r.icon}
                            </Box>
                            <Box>
                                <Typography fontWeight={800} color={r.color} fontSize={14}>{r.label}</Typography>
                                <Typography variant="caption" color={r.color} sx={{ opacity: 0.75 }}>{r.desc}</Typography>
                                <Box sx={{ mt: 0.75 }}>
                                    <Typography variant="caption" color={r.color} fontSize={10} fontWeight={700}>
                                        {PERMISSION_MODULES.reduce((s, m) => s + m.permissions.filter(p => DEFAULT_PERMISSIONS[r.value]?.has(p.key)).length, 0)} / {PERMISSION_MODULES.reduce((s, m) => s + m.permissions.length, 0)} quyền mặc định
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Tab nav */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {TAB_CONFIG.map((t, i) => (
                    <Box key={i} onClick={() => setTab(i)} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer',
                        border: `1.5px solid ${tab === i ? '#1d4ed8' : '#e5e7eb'}`,
                        bgcolor: tab === i ? '#eff6ff' : '#fff',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' },
                    }}>
                        <Box sx={{ color: tab === i ? '#1d4ed8' : '#6b7280' }}>{t.icon}</Box>
                        <Box>
                            <Typography fontSize={13} fontWeight={700} color={tab === i ? '#1d4ed8' : '#374151'}>{t.label}</Typography>
                            <Typography variant="caption" color="#9ca3af" fontSize={10.5}>{t.desc}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {tab === 0 && <UsersTab />}
            {tab === 1 && <PermissionMatrixTab />}
            {tab === 2 && <AuditLogTab />}
        </Box>
    );
};

export default RolePermissionPage;