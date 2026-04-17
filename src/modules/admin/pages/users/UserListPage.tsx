// src/modules/admin/pages/users/UserListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Chip, IconButton, Menu,
    MenuItem, Divider, Select, FormControl, Snackbar, Alert,
    Avatar, Tooltip, Skeleton,
} from '@mui/material';
import {
    Search, Add, MoreVert, LockOpen, Lock as LockIcon,
    Edit, ManageAccounts, Refresh,
} from '@mui/icons-material';
import userService from '../../../../services/userService';
import { UserResponse, UserRole } from '../../../../types';

const ROLE_MAP: Record<UserRole, { label: string; color: string; bg: string }> = {
    ROLE_ADMIN: { label: 'Admin', color: '#7b1fa2', bg: '#f3e5f5' },
    ROLE_MANAGER: { label: 'Quản lý', color: '#1976d2', bg: '#e3f2fd' },
    ROLE_CASHIER: { label: 'Thu ngân', color: '#2e7d32', bg: '#e8f5e9' },
};

const ROLE_OPTIONS = [
    { value: 'all', label: 'Tất cả vai trò' },
    { value: 'ROLE_ADMIN', label: 'Admin' },
    { value: 'ROLE_MANAGER', label: 'Quản lý' },
    { value: 'ROLE_CASHIER', label: 'Thu ngân' },
];

interface RowMenuProps {
    user: UserResponse;
    onToggleActive: (user: UserResponse) => void;
}

const RowMenu: React.FC<RowMenuProps> = ({ user, onToggleActive }) => {
    const navigate = useNavigate();
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);
    return (
        <>
            <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
                <MoreVert sx={{ fontSize: 18 }} />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
                PaperProps={{ sx: { minWidth: 160, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}>
                <MenuItem
                    onClick={() => { navigate(`/admin/users/${user.id}/edit`); setAnchor(null); }}
                    sx={{ fontSize: 13, gap: 1 }}>
                    <Edit sx={{ fontSize: 16, color: '#1976d2' }} /> Chỉnh sửa
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => { onToggleActive(user); setAnchor(null); }}
                    sx={{ fontSize: 13, gap: 1, color: user.isActive ? '#d32f2f' : '#2e7d32' }}>
                    {user.isActive
                        ? <><LockIcon sx={{ fontSize: 16 }} /> Vô hiệu hóa</>
                        : <><LockOpen sx={{ fontSize: 16 }} /> Kích hoạt</>}
                </MenuItem>
            </Menu>
        </>
    );
};

const UserListPage: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [snack, setSnack] = useState('');

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await userService.getAll({
                keyword: search.trim() || undefined,
                role: roleFilter !== 'all' ? roleFilter : undefined,
            });
            setUsers(data);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        const t = setTimeout(loadUsers, 400);
        return () => clearTimeout(t);
    }, [search, roleFilter]);

    const handleToggleActive = async (user: UserResponse) => {
        try {
            if (user.isActive) {
                await userService.deactivate(user.id);
            } else {
                await userService.activate(user.id);
            }
            setSnack(user.isActive
                ? `Đã vô hiệu hóa tài khoản ${user.username}`
                : `Đã kích hoạt tài khoản ${user.username}`);
            loadUsers();
        } catch (e: any) {
            setSnack(e.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const filtered = users.filter(u => {
        const matchSearch = !search ||
            u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const stats = [
        { label: 'Tổng tài khoản', value: users.length, color: '#1a1a2e' },
        { label: 'Đang hoạt động', value: users.filter(u => u.isActive).length, color: '#2e7d32' },
        { label: 'Quản trị viên', value: users.filter(u => u.role === 'ROLE_ADMIN').length, color: '#7b1fa2' },
        { label: 'Thu ngân', value: users.filter(u => u.role === 'ROLE_CASHIER').length, color: '#1976d2' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="caption" color="#aaa" fontSize={11}>
                        Dashboard / <strong style={{ color: '#555' }}>Nhân viên</strong>
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.5}>
                        Quản lý Tài khoản
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                        Tạo và quản lý tài khoản nhân viên
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Làm mới">
                        <IconButton onClick={loadUsers} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Refresh sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Button variant="contained" startIcon={<Add />}
                        onClick={() => navigate('/admin/users/create')}
                        sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1565c0' } }}>
                        Tạo tài khoản mới
                    </Button>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, mb: 3 }}>
                {stats.map(s => (
                    <Paper key={s.label} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                        {loading
                            ? <Skeleton height={30} />
                            : <Typography variant="h4" fontWeight={900} color={s.color}>{s.value}</Typography>
                        }
                        <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Paper>
                ))}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <TextField size="small" placeholder="Tìm theo tên, username, email..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    sx={{ flex: 1 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">
                            <Search sx={{ fontSize: 17, color: '#bbb' }} />
                        </InputAdornment>
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} sx={{ fontSize: 13 }}>
                        {ROLE_OPTIONS.map(o => (
                            <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Tài khoản', 'Liên hệ', 'Vai trò', 'Chi nhánh', 'Đăng nhập gần đây', 'Trạng thái', ''].map(col => (
                                    <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5, letterSpacing: 0.3 }}>
                                        {col.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7].map(j => (
                                            <TableCell key={j}><Skeleton height={20} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.map((user, idx) => {
                                const roleInfo = ROLE_MAP[user.role as UserRole] ?? { label: user.role, color: '#666', bg: '#f3f4f6' };
                                return (
                                    <TableRow key={user.id} hover
                                        sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#f5f9ff' } }}>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{
                                                    width: 34, height: 34,
                                                    bgcolor: roleInfo.bg, color: roleInfo.color,
                                                    fontSize: 14, fontWeight: 700
                                                }}>
                                                    {user.fullName.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700} fontSize={13}>
                                                        {user.fullName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                                        @{user.username}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" fontSize={12}>{user.email || '—'}</Typography>
                                            <Typography variant="caption" color="text.secondary">{user.phone || '—'}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Chip label={roleInfo.label} size="small"
                                                sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: roleInfo.bg, color: roleInfo.color }} />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" fontSize={12} color="#555">
                                                {user.warehouseName || 'Tất cả chi nhánh'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {user.lastLoginAt
                                                    ? new Date(user.lastLoginAt).toLocaleString('vi-VN')
                                                    : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Chip
                                                label={user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                                                size="small"
                                                sx={{
                                                    height: 22, fontSize: 11, fontWeight: 700,
                                                    bgcolor: user.isActive ? '#e8f5e9' : '#f5f5f5',
                                                    color: user.isActive ? '#2e7d32' : '#888',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }} align="center">
                                            <RowMenu user={user} onToggleActive={handleToggleActive} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!loading && filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={32} mb={1}>👤</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Không tìm thấy tài khoản nào
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                    <Typography variant="caption" color="text.secondary">
                        Hiển thị <strong>{filtered.length}</strong> / <strong>{users.length}</strong> tài khoản
                    </Typography>
                </Box>
            </Paper>

            <Snackbar
                open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2 }}>{snack}</Alert>
            </Snackbar>
        </Box>
    );
};

export default UserListPage;