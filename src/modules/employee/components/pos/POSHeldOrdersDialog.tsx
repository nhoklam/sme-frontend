import React from 'react';
import {
    Dialog, Box, Typography, Button, IconButton,
    Chip, Divider, Tooltip,
} from '@mui/material';
import { Close, Pause, PlayArrow, Delete, ShoppingBasket } from '@mui/icons-material';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

interface HeldOrderItem {
    productName: string;
    quantity: number;
    unitPrice: number;
}

interface HeldOrder {
    id: string;
    label: string;
    heldAt: string;
    itemCount: number;
    totalAmount: number;
    customerName?: string;
    items: HeldOrderItem[];
    fullTab?: any;
}

interface Props {
    open: boolean;
    heldOrders: HeldOrder[];
    onClose: () => void;
    onRecall: (id: string) => void;
    onDelete: (id: string) => void;
}

const POSHeldOrdersDialog: React.FC<Props> = ({ open, heldOrders, onClose, onRecall, onDelete }) => {
    const fmtTime = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch { return '—'; }
    };

    const fmtAgo = (iso: string) => {
        try {
            const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
            return m < 1 ? 'Vừa giữ' : `${m} phút trước`;
        } catch { return '—'; }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5, bgcolor: '#1e293b', border: '1px solid #334155', overflow: 'hidden' } }}>
            <Box sx={{
                px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid #334155', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, bgcolor: '#f59e0b22', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f59e0b44' }}>
                        <Pause sx={{ color: '#f59e0b', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={800} color="#f1f5f9" fontSize={16}>Đơn đang giữ tạm</Typography>
                        <Typography variant="caption" color="#64748b" fontSize={11}>F5 để mở · Bấm "Gọi lại" để tiếp tục</Typography>
                    </Box>
                    {heldOrders.length > 0 && (
                        <Chip label={`${heldOrders.length} đơn`} size="small"
                            sx={{ bgcolor: '#f59e0b22', color: '#f59e0b', fontWeight: 700, height: 20, fontSize: 11 }} />
                    )}
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}><Close /></IconButton>
            </Box>

            <Box sx={{ p: 0 }}>
                {heldOrders.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Box sx={{ width: 64, height: 64, bgcolor: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, border: '1px solid #334155' }}>
                            <ShoppingBasket sx={{ fontSize: 28, color: '#334155' }} />
                        </Box>
                        <Typography color="#475569" fontWeight={600} fontSize={14}>Chưa có đơn nào được giữ tạm</Typography>
                        <Typography variant="caption" color="#334155" display="block" mt={0.5}>Nhấn F2 để giữ tạm đơn hiện tại</Typography>
                    </Box>
                ) : (
                    heldOrders.map((order, idx) => (
                        <Box key={order.id}>
                            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'flex-start', gap: 2, bgcolor: idx % 2 === 0 ? '#0f172a44' : 'transparent', '&:hover': { bgcolor: '#3b82f611' } }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                        <Typography fontWeight={700} color="#f1f5f9" fontSize={14}>{order.label}</Typography>
                                        <Chip label={`${order.itemCount} sản phẩm`} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#3b82f622', color: '#93c5fd', fontWeight: 600 }} />
                                        {order.customerName && <Typography variant="caption" color="#64748b" fontSize={11}>👤 {order.customerName}</Typography>}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        {order.items.slice(0, 3).map((item, i) => (
                                            <Chip key={i} label={`${item.productName.slice(0, 20)}... ×${item.quantity}`} size="small"
                                                sx={{ height: 20, fontSize: 10, bgcolor: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }} />
                                        ))}
                                        {order.items.length > 3 && (
                                            <Chip label={`+${order.items.length - 3} khác`} size="small"
                                                sx={{ height: 20, fontSize: 10, bgcolor: '#334155', color: '#64748b' }} />
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="#64748b" fontSize={11}>
                                        ⏰ {fmtTime(order.heldAt)} · {fmtAgo(order.heldAt)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.25, flexShrink: 0 }}>
                                    <Typography fontWeight={800} color="#22c55e" fontSize={16}>{fmt(order.totalAmount)}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Xóa đơn">
                                            <IconButton size="small" onClick={() => onDelete(order.id)}
                                                sx={{ color: '#475569', bgcolor: '#1e293b', border: '1px solid #334155', '&:hover': { color: '#ef4444', borderColor: '#ef4444' } }}>
                                                <Delete sx={{ fontSize: 15 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Button size="small" variant="contained" startIcon={<PlayArrow sx={{ fontSize: 15 }} />}
                                            onClick={() => { onRecall(order.id); onClose(); }}
                                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, bgcolor: '#f59e0b', color: '#1e293b', px: 1.5, '&:hover': { bgcolor: '#d97706' } }}>
                                            Gọi lại
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                            {idx < heldOrders.length - 1 && <Divider sx={{ borderColor: '#1e293b' }} />}
                        </Box>
                    ))
                )}
            </Box>

            <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0f172a' }}>
                <Typography variant="caption" color="#334155" fontSize={11}>💡 Mỗi đơn giữ tạm giữ nguyên KH, sản phẩm và giảm giá</Typography>
                <Button size="small" onClick={onClose} sx={{ textTransform: 'none', color: '#64748b', fontSize: 12 }}>Đóng (Esc)</Button>
            </Box>
        </Dialog>
    );
};

export default POSHeldOrdersDialog;