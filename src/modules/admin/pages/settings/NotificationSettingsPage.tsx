import React, { useState } from 'react';
import {
    Box, Typography, Paper, Switch, FormControlLabel,
    Divider, Chip, Grid, Button, Alert,
} from '@mui/material';
import {
    Notifications, Email, Inventory2,
    ShoppingCart, Warning, Save,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface NotifChannel {
    inApp: boolean;
    email: boolean;
}

interface NotifSettings {
    lowStock: NotifChannel;
    newOrder: NotifChannel;
    shiftClose: NotifChannel;
    transferRequest: NotifChannel;
    purchaseApproval: NotifChannel;
}

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState<NotifSettings>({
        lowStock: { inApp: true, email: true },
        newOrder: { inApp: true, email: false },
        shiftClose: { inApp: true, email: false },
        transferRequest: { inApp: true, email: false },
        purchaseApproval: { inApp: true, email: true },
    });

    const toggle = (key: keyof NotifSettings, channel: keyof NotifChannel) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], [channel]: !prev[key][channel] },
        }));
    };

    const NOTIF_ROWS: {
        key: keyof NotifSettings;
        label: string;
        desc: string;
        icon: React.ReactNode;
        color: string;
    }[] = [
        {
            key: 'lowStock', label: 'Cảnh báo sắp hết hàng',
            desc: 'Khi tồn kho sản phẩm xuống dưới mức tối thiểu',
            icon: <Warning sx={{ fontSize: 18 }} />, color: '#f59e0b',
        },
        {
            key: 'newOrder', label: 'Đơn hàng mới',
            desc: 'Khi khách hàng đặt đơn hàng online mới',
            icon: <ShoppingCart sx={{ fontSize: 18 }} />, color: '#3b82f6',
        },
        {
            key: 'transferRequest', label: 'Yêu cầu chuyển kho',
            desc: 'Khi có phiếu chuyển kho mới cần xử lý',
            icon: <Inventory2 sx={{ fontSize: 18 }} />, color: '#8b5cf6',
        },
        {
            key: 'purchaseApproval', label: 'Phiếu nhập kho cần duyệt',
            desc: 'Khi có phiếu nhập kho đang chờ phê duyệt',
            icon: <Inventory2 sx={{ fontSize: 18 }} />, color: '#10b981',
        },
        {
            key: 'shiftClose', label: 'Ca làm việc kết thúc',
            desc: 'Khi thu ngân đóng ca và cần đối soát',
            icon: <Notifications sx={{ fontSize: 18 }} />, color: '#6b7280',
        },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>
                    Cài đặt / <strong style={{ color: '#6b7280' }}>Thông báo</strong>
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5}>
                    Cài đặt Thông báo
                </Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>
                    Chọn kênh nhận thông báo cho từng loại sự kiện trong hệ thống
                </Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' }}>
                <Typography fontWeight={700} fontSize={13}>Cài đặt này chưa được lưu vào hệ thống. Tính năng đang hoàn thiện.</Typography>
                <Typography fontSize={12} mt={0.5}>Thông báo In-app hiển thị ngay trong hệ thống. Thông báo Email gửi đến địa chỉ đã đăng ký của tài khoản.</Typography>
            </Alert>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <Grid container>
                        <Grid size={{ xs: 6 }}>
                            <Typography fontSize={12} fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing="0.5px">
                                Loại thông báo
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 3 }} sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Notifications sx={{ fontSize: 14, color: '#64748b' }} />
                                <Typography fontSize={12} fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing="0.5px">
                                    In-app
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 3 }} sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Email sx={{ fontSize: 14, color: '#64748b' }} />
                                <Typography fontSize={12} fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing="0.5px">
                                    Email
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {NOTIF_ROWS.map((row, idx) => (
                    <React.Fragment key={row.key}>
                        {idx > 0 && <Divider />}
                        <Box sx={{ px: 3, py: 2.5, '&:hover': { bgcolor: '#f8fafc' }, transition: 'background 0.1s' }}>
                            <Grid container alignItems="center">
                                <Grid size={{ xs: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <Box sx={{
                                            p: 1, borderRadius: 1.5,
                                            bgcolor: `${row.color}18`,
                                            color: row.color,
                                            mt: 0.25, flexShrink: 0,
                                        }}>
                                            {row.icon}
                                        </Box>
                                        <Box>
                                            <Typography fontSize={14} fontWeight={600} color="#1e293b">
                                                {row.label}
                                            </Typography>
                                            <Typography variant="caption" color="#94a3b8" fontSize={11.5}>
                                                {row.desc}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 3 }} sx={{ textAlign: 'center' }}>
                                    <Switch
                                        checked={settings[row.key].inApp}
                                        onChange={() => toggle(row.key, 'inApp')}
                                        size="small"
                                        color="primary"
                                    />
                                </Grid>
                                <Grid size={{ xs: 3 }} sx={{ textAlign: 'center' }}>
                                    <Switch
                                        checked={settings[row.key].email}
                                        onChange={() => toggle(row.key, 'email')}
                                        size="small"
                                        color="primary"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </React.Fragment>
                ))}
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained" startIcon={<Save />}
                    disabled
                    sx={{ textTransform: 'none', fontWeight: 700, px: 4, borderRadius: 2 }}
                >
                    Lưu cài đặt
                </Button>
            </Box>
        </Box>
    );
}
