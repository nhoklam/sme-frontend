import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button,
    Chip, Pagination, CircularProgress,
    Alert, Snackbar
} from '@mui/material';
import {
    Notifications, Delete, CheckCircle,
    Check, AccessTime, LocalOffer, ShoppingCart, Warning, Store
} from '@mui/icons-material';
import { notificationService, Notification } from '../../../../services/notificationService';
import warehouseService from '../../../../services/warehouseService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Render message thân thiện từ payload.
 * - Ưu tiên payload.warehouseName (records mới)
 * - Nếu không có, tra cứu trong warehouseMap theo payload.warehouseId (records cũ)
 * - Fallback về message gốc nếu không có productName
 */
const renderNotifMessage = (
    notif: Notification,
    warehouseMap: Map<string, string>
): string => {
    if (notif.type === 'LOW_STOCK' && notif.payload?.productName) {
        const product = notif.payload.productName;

        let warehousePart = '';
        if (notif.payload.warehouseName) {
            // Records mới — đã có tên kho trong payload
            warehousePart = ` tại kho '${notif.payload.warehouseName}'`;
        } else if (notif.payload.warehouseId) {
            // Records cũ — tra cứu từ map
            const warehouseId = String(notif.payload.warehouseId);
            const name = warehouseMap.get(warehouseId);
            warehousePart = name
                ? ` tại kho '${name}'`
                : ` tại kho (ID: ${warehouseId.slice(0, 8)}...)`;
        }

        const qty = notif.payload.quantity;
        const minQty = notif.payload.minQuantity;
        const qtyText = qty != null
            ? ` — còn lại ${qty} sản phẩm${minQty ? ` (ngưỡng tối thiểu: ${minQty})` : ''}`
            : '';

        return `Sản phẩm '${product}'${warehousePart} sắp hết hàng${qtyText}`;
    }
    return notif.message;
};

const NotificationListPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [warehouseMap, setWarehouseMap] = useState<Map<string, string>>(new Map());
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch danh sách kho một lần — dùng để resolve warehouseId → tên kho
    useEffect(() => {
        warehouseService.getAll()
            .then(warehouses => {
                const map = new Map<string, string>();
                warehouses.forEach(w => {
                    if (w.id) map.set(w.id, w.name);
                });
                setWarehouseMap(map);
            })
            .catch(() => { /* Bỏ qua lỗi, fallback về ID rút gọn */ });
    }, []);

    const loadData = async (currentPage = 0) => {
        setLoading(true);
        try {
            const res = await notificationService.getAll({ page: currentPage, size: 20 });
            setNotifications(res.data?.data?.content || []);
            setTotalPages(res.data?.data?.totalPages || 0);
        } catch {
            setSnack({ open: true, message: 'Lỗi khi tải thông báo', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(page); }, [page]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch { }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setSnack({ open: true, message: 'Đã đánh dấu tất cả là đã đọc', severity: 'success' });
        } catch { }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationService.delete(id);
            loadData(page);
            setSnack({ open: true, message: 'Đã xóa thông báo', severity: 'success' });
        } catch { }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_ORDER':     return <ShoppingCart sx={{ color: '#3b82f6' }} />;
            case 'LOW_STOCK':    return <Warning sx={{ color: '#eab308' }} />;
            case 'PROMOTION':    return <LocalOffer sx={{ color: '#10b981' }} />;
            case 'TRANSFER_ARRIVED': return <Store sx={{ color: '#8b5cf6' }} />;
            default:             return <Notifications sx={{ color: '#64748b' }} />;
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications sx={{ color: '#3b82f6' }} /> Quản lý thông báo
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<CheckCircle />}
                    onClick={handleMarkAllAsRead}
                    disabled={loading || notifications.length === 0}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                    Đánh dấu tất cả đã đọc
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Notifications sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                        <Typography variant="h6" color="#64748b">Không có thông báo nào</Typography>
                    </Box>
                ) : (
                    <Box>
                        {notifications.map((notif, index) => (
                            <Box
                                key={notif.id}
                                sx={{
                                    p: 2.5,
                                    borderBottom: index < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    bgcolor: notif.isRead ? '#fff' : '#f0fdf4',
                                    display: 'flex',
                                    gap: 2,
                                    alignItems: 'flex-start',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: '#f8fafc' }
                                }}
                            >
                                <Box sx={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    bgcolor: notif.isRead ? '#f1f5f9' : '#dcfce7',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getIcon(notif.type)}
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="subtitle1" fontWeight={notif.isRead ? 500 : 700} color="#1e293b" mb={0.5}>
                                            {notif.title}
                                            {!notif.isRead && (
                                                <Chip label="Mới" size="small" sx={{ ml: 1, height: 20, fontSize: 10, bgcolor: '#ef4444', color: '#fff', fontWeight: 700 }} />
                                            )}
                                        </Typography>
                                        <Typography variant="caption" color="#94a3b8" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                                            <AccessTime sx={{ fontSize: 14 }} />
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="#475569" mb={1} sx={{ lineHeight: 1.6 }}>
                                        {renderNotifMessage(notif, warehouseMap)}
                                    </Typography>

                                    {/* Badge tên kho nổi bật cho LOW_STOCK */}
                                    {notif.type === 'LOW_STOCK' && (() => {
                                        const wName = notif.payload?.warehouseName
                                            || (notif.payload?.warehouseId
                                                ? warehouseMap.get(String(notif.payload.warehouseId))
                                                : undefined);
                                        return wName ? (
                                            <Chip
                                                icon={<Store sx={{ fontSize: 13 }} />}
                                                label={wName}
                                                size="small"
                                                sx={{ mb: 1, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 11, border: '1px solid #bfdbfe' }}
                                            />
                                        ) : null;
                                    })()}

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {!notif.isRead && (
                                            <Button
                                                size="small"
                                                variant="text"
                                                startIcon={<Check />}
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                sx={{ textTransform: 'none', color: '#10b981', p: 0, minWidth: 'auto', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                                            >
                                                Đánh dấu đã đọc
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            variant="text"
                                            startIcon={<Delete />}
                                            onClick={() => handleDelete(notif.id)}
                                            sx={{ textTransform: 'none', color: '#ef4444', p: 0, minWidth: 'auto', ml: notif.isRead ? 0 : 2, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                                        >
                                            Xóa
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
                {totalPages > 1 && (
                    <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', bgcolor: '#f8fafc' }}>
                        <Pagination
                            count={totalPages}
                            page={page + 1}
                            onChange={(e, v) => setPage(v - 1)}
                            color="primary"
                            shape="rounded"
                        />
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default NotificationListPage;
