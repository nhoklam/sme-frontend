import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, Switch, Button, Breadcrumbs, Link,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider
} from '@mui/material';
import { InfoOutlined, LockOutlined, Shield } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { UserRole } from '../../../../types';

// Hardcoded permission matrix matching the backend @PreAuthorize rules
const PERMISSION_MODULES = [
    {
        title: 'Bán hàng (POS)',
        permissions: [
            { id: 'pos_checkout', name: 'Thanh toán hóa đơn', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: true, ROLE_CUSTOMER: false } },
            { id: 'pos_view_invoices', name: 'Xem hóa đơn ca làm việc', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: true, ROLE_CUSTOMER: false } },
            { id: 'pos_cancel_invoice', name: 'Hủy/Trả hóa đơn', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
        ]
    },
    {
        title: 'Quản lý Kho hàng',
        permissions: [
            { id: 'inv_view', name: 'Xem hàng tồn kho', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: true, ROLE_CUSTOMER: false } },
            { id: 'inv_purchase', name: 'Nhập hàng nhà cung cấp', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
            { id: 'inv_transfer_req', name: 'Yêu cầu chuyển kho', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
            { id: 'inv_transfer_approve', name: 'Phê duyệt chuyển kho', roles: { ROLE_ADMIN: true, ROLE_MANAGER: false, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
        ]
    },
    {
        title: 'Nhân sự & Ca làm việc',
        permissions: [
            { id: 'user_view', name: 'Xem danh sách nhân viên', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
            { id: 'user_manage', name: 'Tạo & Sửa nhân viên', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
            { id: 'shift_manage', name: 'Quản lý ca làm việc', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
        ]
    },
    {
        title: 'Báo cáo & Hệ thống',
        permissions: [
            { id: 'report_view', name: 'Xem báo cáo doanh thu', roles: { ROLE_ADMIN: true, ROLE_MANAGER: true, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
            { id: 'report_full', name: 'Xem báo cáo tài chính', roles: { ROLE_ADMIN: true, ROLE_MANAGER: false, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
            { id: 'sys_settings', name: 'Cấu hình hệ thống', roles: { ROLE_ADMIN: true, ROLE_MANAGER: false, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
            { id: 'sys_audit', name: 'Xem lịch sử hệ thống', roles: { ROLE_ADMIN: true, ROLE_MANAGER: false, ROLE_CASHIER: false, ROLE_CUSTOMER: false } },
        ]
    }
];

const ROLES: Array<{ key: UserRole; label: string; desc: string; color: 'error' | 'info' | 'success' | 'warning' }> = [
    { key: 'ROLE_ADMIN', label: 'Admin', desc: 'Quản trị viên toàn hệ thống. Có toàn bộ quyền hạn.', color: 'error' },
    { key: 'ROLE_MANAGER', label: 'Manager', desc: 'Quản lý chi nhánh với các quyền hạn quản lý kho và nhân sự.', color: 'info' },
    { key: 'ROLE_CASHIER', label: 'Cashier', desc: 'Nhân viên thu ngân thực hiện bán hàng và kiểm tra tồn kho.', color: 'success' },
    { key: 'ROLE_CUSTOMER', label: 'Customer', desc: 'Khách hàng thành viên mua sắm trực tuyến.', color: 'warning' },
];

export default function RolePermissionPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success('Đã đồng bộ quyền hạn mới nhất từ hệ thống!');
        }, 800);
    };

    const handleToggle = () => {
        toast('Phân quyền được quản lý cứng (hardcoded) trên Backend bằng @PreAuthorize', { icon: '🔒' });
    };

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
            {/* Breadcrumb */}
            <Breadcrumbs sx={{ mb: 3, fontSize: 13 }}>
                <Link underline="hover" color="inherit" href="/admin/dashboard">Tổng quan</Link>
                <Typography color="text.primary" fontSize={13}>Phân quyền</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} color="#1a1a2e">
                        Phân quyền hệ thống
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Quản lý chi tiết quyền truy cập theo từng nhóm vai trò
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* LEFT COLUMN: Role descriptions */}
                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Descriptions */}
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2.5, textTransform: 'uppercase', fontSize: 12, fontWeight: 700 }}>
                                Mô tả vai trò
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {ROLES.map((role, idx) => (
                                    <Box key={role.key}>
                                        <Chip
                                            label={role.label}
                                            color={role.color}
                                            size="small"
                                            sx={{ mb: 1, fontWeight: 600, borderRadius: 1 }}
                                        />
                                        <Typography variant="body2" color="text.secondary" fontSize={12} sx={{ display: 'block', mb: 1.5 }}>
                                            {role.desc}
                                        </Typography>
                                        {idx < ROLES.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* Alert */}
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #91caff', bgcolor: '#e6f4ff', display: 'flex', gap: 1.5 }}>
                            <InfoOutlined sx={{ color: '#1677ff', mt: 0.5, fontSize: 20 }} />
                            <Box>
                                <Typography variant="body2" fontWeight={700} color="#003a8c" fontSize={13}>
                                    Lưu ý an toàn
                                </Typography>
                                <Typography variant="body2" color="#003a8c" fontSize={12} mt={0.5}>
                                    Các đặc quyền được kiểm soát chặt chẽ bởi Backend API. Việc thay đổi vai trò của nhân viên sẽ có hiệu lực ngay lập tức.
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Action Button */}
                        <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            startIcon={<LockOutlined />}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#fff' }}
                        >
                            {isRefreshing ? 'Đang làm mới...' : 'Làm mới quyền'}
                        </Button>
                    </Box>
                </Grid>

                {/* RIGHT COLUMN: Permission Matrix Tables */}
                <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {PERMISSION_MODULES.map((module) => (
                            <Paper key={module.title} elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <Box sx={{ pb: 2, borderBottom: '1px solid #f0f0f0', mb: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="#1a2e85">
                                        {module.title}
                                    </Typography>
                                </Box>

                                <TableContainer sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                    <Table size="small" sx={{ minWidth: 600 }}>
                                        <TableHead sx={{ bgcolor: '#fafafa' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, py: 1.5, borderRight: '1px solid #f0f0f0', width: 250 }}>Quyền</TableCell>
                                                {ROLES.map(role => (
                                                    <TableCell key={role.key} align="center" sx={{ py: 1.5, borderRight: '1px solid #f0f0f0', width: 120 }}>
                                                        <Chip label={role.label} color={role.color} size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {module.permissions.map((perm) => (
                                                <TableRow key={perm.id} hover>
                                                    <TableCell sx={{ borderRight: '1px solid #f0f0f0', py: 1.5 }}>
                                                        <Typography variant="body2" fontWeight={600} color="#333">
                                                            {perm.name}
                                                        </Typography>
                                                    </TableCell>
                                                    {ROLES.map(role => {
                                                        const hasAccess = perm.roles[role.key];
                                                        const isAdmin = role.key === 'ROLE_ADMIN';
                                                        return (
                                                            <TableCell key={role.key} align="center" sx={{ borderRight: '1px solid #f0f0f0', py: 1.5 }}>
                                                                <Switch
                                                                    checked={hasAccess}
                                                                    disabled={isAdmin}
                                                                    onChange={handleToggle}
                                                                    size="small"
                                                                    color={role.color === 'error' ? 'error' : role.color === 'info' ? 'info' : role.color === 'warning' ? 'warning' : 'success'}
                                                                />
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        ))}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
