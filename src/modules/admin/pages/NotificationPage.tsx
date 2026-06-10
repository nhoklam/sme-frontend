import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, List, ListItem, ListItemAvatar, Avatar,
    ListItemText, Pagination, Button, Divider, ListItemButton, CircularProgress
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    ShoppingCart as ShoppingCartIcon,
    WarningAmber as WarningAmberIcon,
    Circle as CircleIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification } from '../../../services/notificationService';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import warehouseService from '../../../services/warehouseService';
import { decrementUnread, resetUnread } from '../../../store/notificationCount';

const NotificationPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [warehouseMap, setWarehouseMap] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        warehouseService.getAll()
            .then(warehouses => {
                const map = new Map<string, string>();
                warehouses.forEach(w => { if (w.id) map.set(w.id, w.name); });
                setWarehouseMap(map);
            })
            .catch(() => { });
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationService.getAll({ page: page - 1, size: 20 });
            setNotifications(res.data?.data?.content || []);
            setTotalPages(res.data?.data?.totalPages || 1);
        } catch (error) {
            console.error('Lỗi khi tải thông báo', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleMarkAsRead = async (notif: Notification) => {
        if (!notif.isRead) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            decrementUnread();
            notificationService.markAsRead(notif.id);
        }

        if (notif.type === 'LOW_STOCK') navigate('/admin/inventory/import');
        else if (notif.type === 'TRANSFER_ARRIVED') navigate('/admin/inventory/transfer');
        else if (notif.type === 'NEW_ORDER' && notif.payload?.orderId) navigate(`/admin/orders/${notif.payload.orderId}`);
    };

    const handleMarkAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            resetUnread();
            notificationService.markAllAsRead();
        } catch (err) { }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'NEW_ORDER': return '#1890ff';
            case 'LOW_STOCK': return '#faad14';
            case 'OUT_OF_STOCK': return '#f5222d';
            case 'IMPORT_SUCCESS': return '#52c41a';
            case 'TRANSFER_ARRIVED': return '#722ed1';
            case 'SHIFT_PENDING_APPROVAL': return '#fa8c16';
            default: return '#8c8c8c';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_ORDER': return <ShoppingCartIcon />;
            case 'LOW_STOCK': return <WarningAmberIcon />;
            case 'OUT_OF_STOCK': return <WarningAmberIcon />;
            case 'IMPORT_SUCCESS': return <CheckCircleOutlineIcon />;
            default: return <NotificationsIcon />;
        }
    };

    const renderNotifMessage = (notif: Notification): string => {
        if (notif.type === 'LOW_STOCK' && notif.payload?.productName) {
            const product = notif.payload.productName;
            let warehousePart = '';
            if (notif.payload.warehouseName) {
                warehousePart = ` tại kho '${notif.payload.warehouseName}'`;
            } else if (notif.payload.warehouseId) {
                const wid = String(notif.payload.warehouseId);
                const name = warehouseMap.get(wid);
                warehousePart = name ? ` tại kho '${name}'` : ` tại kho (${wid.slice(0, 8)}...)`;
            }
            const qty = notif.payload.quantity;
            const qtyText = qty != null ? ` — còn lại ${qty} sản phẩm` : '';
            return `Sản phẩm '${product}'${warehousePart} sắp hết hàng${qtyText}`;
        }
        return notif.message;
    };

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Quay lại</Button>
                <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>Tất cả thông báo</Typography>
                <Button variant="outlined" onClick={handleMarkAllAsRead}>Đánh dấu tất cả đã đọc</Button>
            </Box>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 8, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">Bạn không có thông báo nào</Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {notifications.map((notif, index) => (
                            <React.Fragment key={notif.id}>
                                <ListItemButton
                                    onClick={() => handleMarkAsRead(notif)}
                                    sx={{
                                        px: 3, py: 2.5,
                                        bgcolor: notif.isRead ? 'transparent' : '#f0f7ff',
                                        '&:hover': { bgcolor: notif.isRead ? '#f8fafc' : '#e6f0ff' }
                                    }}
                                >
                                    <ListItemAvatar sx={{ mt: 0, alignSelf: 'flex-start' }}>
                                        <Avatar sx={{ bgcolor: getIconColor(notif.type), color: '#fff', width: 48, height: 48 }}>
                                            {getIcon(notif.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography variant="subtitle1" fontWeight={notif.isRead ? 500 : 700} color="#1e293b" mb={0.5}>
                                                    {notif.title}
                                                </Typography>
                                                <Typography variant="caption" color="#94a3b8" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                                                    {format(new Date(notif.createdAt), 'HH:mm dd/MM/yyyy')}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="#475569" sx={{ mb: 1, mt: 0.5 }}>
                                                    {renderNotifMessage(notif)}
                                                </Typography>
                                                <Typography variant="caption" color="#64748b" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {!notif.isRead && <CircleIcon sx={{ fontSize: 10, color: '#3b82f6' }} />}
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                                {index < notifications.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}

                {totalPages > 1 && (
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f0f0f0' }}>
                        <Pagination 
                            count={totalPages} 
                            page={page} 
                            onChange={(e, value) => setPage(value)} 
                            color="primary" 
                            size="large" 
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default NotificationPage;
