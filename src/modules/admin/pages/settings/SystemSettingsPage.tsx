import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import {
    ManageAccounts, Warehouse, AutoAwesome, Assignment, Lock
} from '@mui/icons-material';
import authService from '../../../../services/authService';

// Tab components
import UsersTab from './tabs/UsersTab';
import WarehousesTab from './tabs/WarehousesTab';
import AIDocumentsTab from './tabs/AIDocumentsTab';
import AuditLogsTab from './tabs/AuditLogsTab';
import ChangePasswordTab from './tabs/ChangePasswordTab';

const TAB_CONFIG = [
    { id: 'users', label: 'Quản lý nhân sự', icon: <ManageAccounts sx={{ fontSize: 18 }} />, adminOnly: true },
    { id: 'warehouses', label: 'Chi nhánh', icon: <Warehouse sx={{ fontSize: 18 }} />, adminOnly: true },
    { id: 'ai', label: 'Dữ liệu AI', icon: <AutoAwesome sx={{ fontSize: 18 }} />, adminOnly: true },
    { id: 'audit', label: 'Nhật ký hệ thống', icon: <Assignment sx={{ fontSize: 18 }} />, adminOnly: true },
    { id: 'password', label: 'Bảo mật', icon: <Lock sx={{ fontSize: 18 }} />, adminOnly: false },
];

export default function SystemSettingsPage() {
    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';
    const tabs = TAB_CONFIG.filter(t => !t.adminOnly || isAdmin);
    const [tab, setTab] = useState(tabs[0]?.id || 'password');

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>
                    Dashboard / <strong style={{ color: '#6b7280' }}>Cài đặt hệ thống</strong>
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">
                    Cài đặt hệ thống
                </Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>
                    Quản lý tài khoản, phân quyền, cấu hình AI và bảo mật hệ thống.
                </Typography>
            </Box>

            {/* Tabs Navigation */}
            <Box sx={{
                display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap',
                bgcolor: 'white', p: 1, borderRadius: 3,
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 8px rgba(0,0,0,0.02)',
            }}>
                {tabs.map(t => {
                    const isActive = tab === t.id;
                    return (
                        <Box
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1.25,
                                px: 2.5, py: 1.5, borderRadius: 2, cursor: 'pointer',
                                border: `1.5px solid ${isActive ? '#1d4ed8' : 'transparent'}`,
                                bgcolor: isActive ? '#eff6ff' : 'transparent',
                                transition: 'all 0.15s ease',
                                '&:hover': { borderColor: '#93c5fd', bgcolor: '#f8fafc' },
                            }}
                        >
                            <Box sx={{ color: isActive ? '#1d4ed8' : '#9ca3af', display: 'flex' }}>{t.icon}</Box>
                            <Typography fontSize={13} fontWeight={700} color={isActive ? '#1d4ed8' : '#374151'}>
                                {t.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Tab Content */}
            {tab === 'users' && <UsersTab />}
            {tab === 'warehouses' && <WarehousesTab />}
            {tab === 'ai' && <AIDocumentsTab />}
            {tab === 'audit' && <AuditLogsTab />}
            {tab === 'password' && <ChangePasswordTab />}
        </Box>
    );
}