// src/modules/admin/pages/DashboardPage.tsx
// ✅ NÂNG CẤP ĐẦY ĐỦ:
//   - WebSocket real-time (tồn kho thấp, đơn mới, ca chờ duyệt, chuyển kho)
//   - AI Co-pilot chat (dùng aiService.ts + /ai/chat endpoint)
//   - Notification panel đọc/đánh dấu đã đọc
//   - Stat cards animation, Revenue trend chart
//   - Top products, Pending orders, Balance card
//   - Toàn bộ gọi service đúng type

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Typography, Paper, Chip, Avatar,
    Skeleton, IconButton, Button, LinearProgress,
    Table, TableBody, TableCell, TableHead, TableRow,
    Badge, Fab, TextField, Tooltip, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemText, ListItemIcon,
    CircularProgress, Alert, Snackbar,
} from '@mui/material';
import {
    TrendingUp, ShoppingCart, Warning, Schedule,
    Refresh, ArrowForward, CheckCircle, Notifications,
    Send, Close, Chat, SmartToy, Circle,
    Inventory2, AttachMoney, Assessment, ShowChart,
    NotificationsNone, DoneAll, FiberManualRecord,
    KeyboardArrowRight, Bolt, BarChart,
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RTooltip, ResponsiveContainer, BarChart as RechartBar,
    Bar, Cell,
} from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import axiosInstance from '../../../services/axiosConfig';
import dashboardService from '../../../services/dashboardService';
import orderService from '../../../services/orderService';
import { aiService } from '../../../services/aiService';
import { notificationService, Notification } from '../../../services/notificationService';
import { useWebSocket, WsPayload } from '../../../store/hooks/useWebSocket';
import authService from '../../../services/authService';
import { OrderResponse, DashboardStats, RevenueTrendPoint } from '../../../types';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtCurrency = (n: number | null | undefined) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Chờ xử lý', color: '#d97706', bg: '#fef3c7' },
    PACKING: { label: 'Đóng gói', color: '#2563eb', bg: '#dbeafe' },
    SHIPPING: { label: 'Đang giao', color: '#7c3aed', bg: '#ede9fe' },
    DELIVERED: { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
    CANCELLED: { label: 'Đã hủy', color: '#6b7280', bg: '#f3f4f6' },
    RETURNED: { label: 'Hoàn trả', color: '#dc2626', bg: '#fee2e2' },
};

const NOTIF_STYLE: Record<string, { dot: string; bg: string; color: string; border: string }> = {
    LOW_STOCK: { dot: '#ef4444', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    NEW_ORDER: { dot: '#3b82f6', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    SHIFT_PENDING_APPROVAL: { dot: '#8b5cf6', bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
    TRANSFER_ARRIVED: { dot: '#f59e0b', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    default: { dot: '#9ca3af', bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
};

const TOP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

// ── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
    title: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    loading?: boolean;
    trend?: number; // positive = up, negative = down
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, iconBg, iconColor, loading, trend, onClick }) => (
    <Paper elevation={0} onClick={onClick} sx={{
        p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', bgcolor: '#fff',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderColor: '#d1d5db' } : {},
    }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </Box>
            {trend !== undefined && !loading && (
                <Chip size="small" label={`${trend >= 0 ? '+' : ''}${trend}%`}
                    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: trend >= 0 ? '#dcfce7' : '#fee2e2', color: trend >= 0 ? '#16a34a' : '#dc2626' }} />
            )}
        </Box>
        {loading ? (
            <>
                <Skeleton width="60%" height={32} sx={{ mb: 0.5 }} />
                <Skeleton width="40%" height={16} />
            </>
        ) : (
            <>
                <Typography variant="h5" fontWeight={800} color="#111" sx={{ mb: 0.25, letterSpacing: '-0.5px' }}>{value}</Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12} fontWeight={500}>{title}</Typography>
                {sub && <Typography variant="caption" color="#9ca3af" fontSize={11} display="block" mt={0.25}>{sub}</Typography>}
            </>
        )}
    </Paper>
);

// ── Balance Card ─────────────────────────────────────────────
const BalanceCard: React.FC<{ cash: number; bank: number; total: number; loading: boolean }> = ({ cash, bank, total, loading }) => (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#fff', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="#374151">💰 Số dư quỹ</Typography>
            <AttachMoney sx={{ fontSize: 18, color: '#9ca3af' }} />
        </Box>
        {loading ? (
            [1, 2].map(i => <Skeleton key={i} height={48} sx={{ borderRadius: 2, mb: 1 }} />)
        ) : (
            <>
                <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, mb: 1, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" color="#16a34a" fontWeight={700} display="block" fontSize={10} letterSpacing={0.5}>TIỀN MẶT (TK 111)</Typography>
                    <Typography variant="h6" fontWeight={800} color="#15803d">{fmtCurrency(cash)}</Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, mb: 1.5, border: '1px solid #bfdbfe' }}>
                    <Typography variant="caption" color="#2563eb" fontWeight={700} display="block" fontSize={10} letterSpacing={0.5}>NGÂN HÀNG (TK 112)</Typography>
                    <Typography variant="h6" fontWeight={800} color="#1d4ed8">{fmtCurrency(bank)}</Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600} color="#374151">Tổng quỹ</Typography>
                    <Typography variant="body1" fontWeight={800} color="#111">{fmtCurrency(total)}</Typography>
                </Box>
            </>
        )}
    </Paper>
);

// ── Notification Panel ───────────────────────────────────────
const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const qc = useQueryClient();
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationService.getUnread();
            setNotifs(res.data.data ?? []);
        } catch { setNotifs([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const markRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifs(prev => prev.filter(n => n.id !== id));
            qc.invalidateQueries({ queryKey: ['notifications-count'] });
        } catch { /* silent */ }
    };

    const markAll = async () => {
        setMarkingAll(true);
        try {
            await notificationService.markAllAsRead();
            setNotifs([]);
            qc.invalidateQueries({ queryKey: ['notifications-count'] });
        } catch { /* silent */ }
        finally { setMarkingAll(false); }
    };

    return (
        <Paper elevation={8} sx={{
            position: 'fixed', top: 64, right: 16, width: 380, maxHeight: 520,
            borderRadius: 2.5, zIndex: 1400, overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
        }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications sx={{ fontSize: 18, color: '#374151' }} />
                    <Typography fontWeight={700} fontSize={15}>Thông báo</Typography>
                    {notifs.length > 0 && <Chip label={notifs.length} size="small" color="error" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {notifs.length > 0 && (
                        <Tooltip title="Đánh dấu tất cả đã đọc">
                            <IconButton size="small" onClick={markAll} disabled={markingAll}>
                                <DoneAll sx={{ fontSize: 18, color: '#6b7280' }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
                </Box>
            </Box>

            {/* Body */}
            <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                {loading ? (
                    <Box sx={{ p: 2 }}>{[1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ mb: 0.75, borderRadius: 1.5 }} />)}</Box>
                ) : notifs.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <NotificationsNone sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
                        <Typography color="#9ca3af" fontSize={14} fontWeight={500}>Không có thông báo mới</Typography>
                    </Box>
                ) : (
                    notifs.map((n) => {
                        const style = NOTIF_STYLE[n.type] ?? NOTIF_STYLE.default;
                        return (
                            <Box key={n.id} sx={{
                                p: 1.75, borderBottom: '1px solid #f9fafb', cursor: 'pointer', bgcolor: style.bg,
                                transition: 'filter 0.12s', '&:hover': { filter: 'brightness(0.97)' },
                                display: 'flex', gap: 1.5,
                            }} onClick={() => markRead(n.id)}>
                                <FiberManualRecord sx={{ fontSize: 10, color: style.dot, mt: 0.6, flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} color={style.color} fontSize={13}>{n.title}</Typography>
                                    <Typography variant="caption" color={style.color} sx={{ opacity: 0.8, display: 'block', mt: 0.25 }} fontSize={11.5}>{n.message}</Typography>
                                    <Typography variant="caption" color="#9ca3af" fontSize={10.5} display="block" mt={0.5}>{new Date(n.createdAt).toLocaleString('vi-VN')}</Typography>
                                </Box>
                                <IconButton size="small" onClick={e => { e.stopPropagation(); markRead(n.id); }} sx={{ alignSelf: 'flex-start', color: '#d1d5db', '&:hover': { color: '#6b7280' } }}>
                                    <Close sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        );
                    })
                )}
            </Box>
        </Paper>
    );
};

// ── AI Chat Panel ────────────────────────────────────────────
interface ChatMsg { role: 'user' | 'assistant'; content: string; ts: Date; loading?: boolean }

const AIChatPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<ChatMsg[]>([{
        role: 'assistant',
        content: 'Xin chào! Tôi là AI Co-pilot của hệ thống SME ERP & POS.\n\nTôi có thể giúp bạn:\n• Phân tích dữ liệu kinh doanh\n• Tra cứu chính sách nội bộ\n• Trả lời câu hỏi nghiệp vụ\n\nBạn cần hỗ trợ gì?',
        ts: new Date(),
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const SUGGESTIONS = ['Doanh thu hôm nay bao nhiêu?', 'Sản phẩm nào sắp hết hàng?', 'Chính sách đổi trả hàng?', 'Hướng dẫn tạo phiếu nhập kho'];

    const sendMessage = async (text?: string) => {
        const userMsg = (text ?? input).trim();
        if (!userMsg || loading) return;
        setInput('');

        setMessages(prev => [...prev, { role: 'user', content: userMsg, ts: new Date() }]);
        setLoading(true);

        // Thêm placeholder loading
        setMessages(prev => [...prev, { role: 'assistant', content: '', ts: new Date(), loading: true }]);

        try {
            const history = messages.slice(-8)
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
            const res = await aiService.chat({ message: userMsg, conversationHistory: history });
            const reply = res.data.data.reply;
            setMessages(prev => [
                ...prev.filter(m => !m.loading),
                { role: 'assistant', content: reply, ts: new Date() },
            ]);
        } catch {
            setMessages(prev => [
                ...prev.filter(m => !m.loading),
                { role: 'assistant', content: '❌ Xin lỗi, đã xảy ra lỗi kết nối. Vui lòng thử lại.', ts: new Date() },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    return (
        <Box sx={{
            position: 'fixed', right: 24, bottom: 24, zIndex: 1300,
            width: 400, height: 560, bgcolor: '#fff', borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', border: '1px solid #e5e7eb',
        }}>
            {/* Header */}
            <Box sx={{
                p: 2, background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SmartToy sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={800} color="#fff" fontSize={14} lineHeight={1.2}>AI Co-pilot</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, bgcolor: '#4ade80', borderRadius: '50%' }} />
                            <Typography variant="caption" color="rgba(255,255,255,0.8)" fontSize={10.5}>Đang hoạt động</Typography>
                        </Box>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 1.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 2 } }}>
                {messages.map((msg, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 1 }}>
                        {msg.role === 'assistant' && (
                            <Box sx={{ width: 26, height: 26, bgcolor: '#1d4ed8', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mb: 0.25 }}>
                                <SmartToy sx={{ fontSize: 14, color: '#fff' }} />
                            </Box>
                        )}
                        <Box sx={{
                            maxWidth: '78%', px: 1.75, py: 1.25, borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            bgcolor: msg.role === 'user' ? '#1d4ed8' : '#fff',
                            color: msg.role === 'user' ? '#fff' : '#374151',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                        }}>
                            {msg.loading ? (
                                <Box sx={{ display: 'flex', gap: 0.5, py: 0.5, px: 0.25 }}>
                                    {[0, 1, 2].map(i => (
                                        <Box key={i} sx={{
                                            width: 7, height: 7, bgcolor: '#94a3b8', borderRadius: '50%',
                                            animation: 'bounce 1.4s infinite ease-in-out',
                                            animationDelay: `${i * 0.2}s`,
                                        }} />
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, fontSize: 13 }}>
                                    {msg.content}
                                </Typography>
                            )}
                            {!msg.loading && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.5, fontSize: 10 }}>
                                    {msg.ts.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                ))}
                <div ref={bottomRef} />
            </Box>

            {/* Suggestions */}
            {messages.length === 1 && (
                <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75, bgcolor: '#f8fafc' }}>
                    {SUGGESTIONS.map(s => (
                        <Button key={s} size="small" variant="outlined" onClick={() => sendMessage(s)}
                            sx={{ textTransform: 'none', fontSize: 11, borderRadius: 2, borderColor: '#e2e8f0', color: '#4b5563', '&:hover': { borderColor: '#1d4ed8', color: '#1d4ed8', bgcolor: '#eff6ff' }, py: 0.4 }}>
                            {s}
                        </Button>
                    ))}
                </Box>
            )}

            {/* Input */}
            <Box sx={{ p: 1.5, borderTop: '1px solid #e5e7eb', bgcolor: '#fff', display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder="Nhập câu hỏi..." value={input} inputRef={inputRef}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }} />
                <Button variant="contained" onClick={() => sendMessage()} disabled={!input.trim() || loading}
                    sx={{ minWidth: 40, px: 1.5, bgcolor: '#1d4ed8', borderRadius: 2, '&:hover': { bgcolor: '#1e40af' } }}>
                    <Send sx={{ fontSize: 16 }} />
                </Button>
            </Box>

            <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)} }`}</style>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const currentUser = authService.getCurrentUser()?.user;
    const displayName = currentUser?.fullName || 'Quản trị viên';
    const isStaff = currentUser?.role === 'ROLE_CASHIER';

    // UI state
    const [showAI, setShowAI] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [wsSnack, setWsSnack] = useState<string | null>(null);

    // Data state
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
    const [pendingOrders, setPendingOrders] = useState<OrderResponse[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [pendingShiftsCount, setPendingShiftsCount] = useState(0);
    const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });

    // Loading state
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingChart, setLoadingChart] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [loadingTop, setLoadingTop] = useState(true);

    // ── WebSocket handler ──────────────────────────────────────
    const handleWsMessage = useCallback((payload: WsPayload) => {
        switch (payload.type) {
            case 'LOW_STOCK':
                qc.invalidateQueries({ queryKey: ['low-stock-dashboard'] });
                setLowStockCount(c => c + 1);
                setWsSnack(`⚠️ ${payload.productName || 'Sản phẩm'} sắp hết hàng! (Còn ${payload.quantity})`);
                toast(`⚠️ ${payload.productName || 'Sản phẩm'} sắp hết hàng!`, {
                    icon: '📦', duration: 5000,
                    style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
                });
                // Tăng unread count thông báo
                setUnreadCount(c => c + 1);
                break;
            case 'NEW_ORDER':
                qc.invalidateQueries({ queryKey: ['orders-pending-dashboard'] });
                setStats(prev => prev ? { ...prev, pendingOrdersCount: (prev.pendingOrdersCount || 0) + 1 } : prev);
                toast.success(`🛒 Đơn hàng mới ${payload.orderCode || ''}`, { duration: 4000 });
                setUnreadCount(c => c + 1);
                break;
            case 'SHIFT_PENDING_APPROVAL':
                qc.invalidateQueries({ queryKey: ['pending-shifts-dashboard'] });
                setPendingShiftsCount(c => c + 1);
                toast('🕐 Có ca làm việc mới chờ duyệt', {
                    icon: '👤', duration: 5000,
                    style: { background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff' },
                });
                setUnreadCount(c => c + 1);
                break;
            case 'TRANSFER_ARRIVED':
                qc.invalidateQueries({ queryKey: ['low-stock-dashboard'] });
                toast('📦 Hàng chuyển kho vừa đến nơi', {
                    duration: 3000,
                    style: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
                });
                break;
            default:
                break;
        }
    }, [qc]);

    const { isConnected } = useWebSocket({
        warehouseId: currentUser?.warehouseId,
        onMessage: handleWsMessage,
        enabled: !isStaff,
    });

    // ── Fetch unread count ────────────────────────────────────
    const loadUnreadCount = useCallback(async () => {
        try {
            const res = await notificationService.countUnread();
            setUnreadCount(res.data.data ?? 0);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        if (!isStaff) {
            loadUnreadCount();
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isStaff, loadUnreadCount]);

    // ── Load all dashboard data ───────────────────────────────
    const load = useCallback(async () => {
        if (isStaff) return;

        setLoadingStats(true);
        setLoadingChart(true);
        setLoadingOrders(true);
        setLoadingBalance(true);
        setLoadingTop(true);

        // Stats
        try {
            const s = await dashboardService.getStats(currentUser?.warehouseId);
            setStats(s);
            setLowStockCount(s.lowStockCount);
        } catch { /* silent */ }
        finally { setLoadingStats(false); }

        // Pending orders
        try {
            const orders = await orderService.getOrders({ status: 'PENDING', page: 0, size: 6 });
            setPendingOrders(orders.content ?? []);
            setStats(prev => prev ? { ...prev, pendingOrdersCount: orders.totalElements ?? 0 } : prev);
        } catch { /* silent */ }
        finally { setLoadingOrders(false); }

        // Revenue trend
        try {
            const trend = await dashboardService.getRevenueTrend(currentUser?.warehouseId);
            setRevenueTrend(trend);
        } catch { /* silent */ }
        finally { setLoadingChart(false); }

        // Balance
        try {
            const res = await axiosInstance.get('/finance/cashbook/balance');
            const d = res.data?.data;
            const c = Number(d?.CASH_111 ?? 0);
            const b = Number(d?.BANK_112 ?? 0);
            setBalance({ cash: c, bank: b, total: Number(d?.total ?? c + b) });
        } catch { /* silent */ }
        finally { setLoadingBalance(false); }

        // Top products
        try {
            const now = new Date();
            const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const query = new URLSearchParams({ from, to, limit: '8' });
            if (currentUser?.warehouseId) query.set('warehouseId', currentUser.warehouseId);
            const res = await axiosInstance.get(`/reports/top-products?${query}`);
            setTopProducts(res.data?.data ?? []);
        } catch { /* silent */ }
        finally { setLoadingTop(false); }

        // Pending shifts
        try {
            const res = await axiosInstance.get('/pos/shifts/pending');
            setPendingShiftsCount((res.data?.data ?? []).length);
        } catch { /* silent */ }
    }, [isStaff, currentUser?.warehouseId]);

    useEffect(() => { load(); }, [load]);

    // ── Chart data ────────────────────────────────────────────
    const chartData = revenueTrend.map(d => ({
        date: (() => {
            try { return new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); }
            catch { return d.date; }
        })(),
        revenue: d.revenue,
        orders: d.orders,
    }));

    const maxTop = topProducts[0]?.total_sold ?? 1;
    const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // ── Staff view ────────────────────────────────────────────
    if (isStaff) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
                <Typography variant="h5" fontWeight={800} color="#111">Xin chào, {displayName} 👋</Typography>
                <Typography variant="body2" color="#6b7280" mt={0.25}>{todayStr}</Typography>
                <Paper sx={{ p: 6, textAlign: 'center', mt: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} color="#374151" mb={1}>Bạn đang đăng nhập với quyền <strong>Thu ngân</strong></Typography>
                    <Typography variant="body2" color="#6b7280" mb={3}>Vui lòng điều hướng tới màn hình Bán hàng (POS) để thực hiện nghiệp vụ.</Typography>
                    <Button variant="contained" onClick={() => navigate('/admin/pos')} sx={{ bgcolor: '#1976d2', textTransform: 'none', fontWeight: 700, px: 4 }}>Đi đến POS</Button>
                </Paper>
            </Box>
        );
    }

    // ─────────────────────────────────────────────────────────
    // MAIN RENDER
    // ─────────────────────────────────────────────────────────
    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            {/* ── HEADER ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="#111" letterSpacing="-0.5px">
                        Xin chào, {displayName} 👋
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                        <Typography variant="body2" color="#6b7280" fontSize={12}>{todayStr}</Typography>
                        {/* WS status badge */}
                        <Tooltip title={isConnected ? 'Real-time đang kết nối' : 'Real-time ngắt kết nối'}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.2, borderRadius: 1, bgcolor: isConnected ? '#dcfce7' : '#fee2e2', cursor: 'default' }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isConnected ? '#16a34a' : '#dc2626', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
                                <Typography fontSize={10} fontWeight={700} color={isConnected ? '#16a34a' : '#dc2626'}>{isConnected ? 'Live' : 'Offline'}</Typography>
                            </Box>
                        </Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Notification bell */}
                    <Tooltip title="Thông báo">
                        <IconButton onClick={() => setShowNotifications(v => !v)} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fff', position: 'relative' }}>
                            <Badge badgeContent={unreadCount} color="error" max={99}>
                                <Notifications sx={{ fontSize: 20 }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Refresh */}
                    <Tooltip title="Làm mới dữ liệu">
                        <IconButton onClick={load} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fff' }}>
                            <Refresh sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    {/* AI toggle */}
                    <Button variant="contained" size="small" startIcon={<SmartToy sx={{ fontSize: 16 }} />}
                        onClick={() => setShowAI(v => !v)}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: 2, background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)', '&:hover': { filter: 'brightness(1.1)' } }}>
                        AI Co-pilot
                    </Button>
                </Box>
            </Box>

            {/* Notification panel */}
            {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}

            {/* ── STAT CARDS ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    {
                        title: 'Doanh thu hôm nay', icon: <TrendingUp />,
                        value: fmtCurrency(stats?.todayRevenue),
                        sub: stats?.todayInvoiceCount ? `${stats.todayInvoiceCount} hóa đơn · Lãi gộp ${fmtCurrency(stats?.todayGrossProfit)}` : undefined,
                        iconBg: '#dbeafe', iconColor: '#2563eb', onClick: () => navigate('/admin/reports/revenue'),
                    },
                    {
                        title: 'Đơn hàng chờ xử lý', icon: <ShoppingCart />,
                        value: stats?.pendingOrdersCount ?? '—',
                        sub: 'Đang chờ đóng gói',
                        iconBg: '#fef3c7', iconColor: '#d97706', onClick: () => navigate('/admin/orders?status=PENDING'),
                    },
                    {
                        title: 'Tồn kho thấp', icon: <Warning />,
                        value: lowStockCount,
                        sub: 'Sản phẩm cần nhập',
                        iconBg: '#fee2e2', iconColor: '#dc2626', onClick: () => navigate('/admin/inventory/alerts'),
                    },
                    {
                        title: 'Ca chờ duyệt', icon: <Schedule />,
                        value: pendingShiftsCount,
                        sub: 'Cần Manager xem xét',
                        iconBg: '#ede9fe', iconColor: '#7c3aed', onClick: () => navigate('/admin/pos'),
                    },
                ].map((card, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <StatCard {...card} loading={loadingStats} />
                    </Grid>
                ))}
            </Grid>

            {/* ── ROW 2: Chart + Balance + Shifts ── */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Revenue chart */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#fff', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#374151">Doanh thu 7 ngày qua</Typography>
                                <Typography variant="caption" color="#9ca3af">Xanh = Doanh thu · Xanh lá = Số đơn</Typography>
                            </Box>
                            <Button size="small" endIcon={<KeyboardArrowRight sx={{ fontSize: 14 }} />} onClick={() => navigate('/admin/reports')}
                                sx={{ textTransform: 'none', fontSize: 12, color: '#2563eb' }}>Xem chi tiết</Button>
                        </Box>
                        {loadingChart ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /> :
                            chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                        <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                        <RTooltip
                                            formatter={(v: any, name: string) => [name === 'revenue' ? fmtCurrency(v) : v, name === 'revenue' ? 'Doanh thu' : 'Đơn']}
                                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#gRev)" dot={false} activeDot={{ r: 4 }} />
                                        <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fill="url(#gOrd)" dot={false} activeDot={{ r: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="#9ca3af" fontSize={13}>Chưa có dữ liệu doanh thu</Typography>
                                </Box>
                            )}
                    </Paper>
                </Grid>

                {/* Balance */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <BalanceCard cash={balance.cash} bank={balance.bank} total={balance.total} loading={loadingBalance} />
                </Grid>

                {/* Pending shifts */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#fff', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#374151">Ca chờ duyệt</Typography>
                            <Button size="small" onClick={() => navigate('/admin/pos')} sx={{ textTransform: 'none', fontSize: 12, color: '#2563eb' }}>POS</Button>
                        </Box>
                        {loadingStats ? <Skeleton height={120} sx={{ borderRadius: 2 }} /> :
                            pendingShiftsCount === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CheckCircle sx={{ fontSize: 40, color: '#16a34a', mb: 1 }} />
                                    <Typography variant="body2" color="#16a34a" fontWeight={600}>Không có ca chờ duyệt</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2, textAlign: 'center', border: '1px solid #fde68a' }}>
                                    <Typography variant="h3" fontWeight={900} color="#d97706">{pendingShiftsCount}</Typography>
                                    <Typography variant="body2" color="#92400e" fontWeight={600}>ca cần duyệt</Typography>
                                    <Button size="small" variant="contained" onClick={() => navigate('/admin/pos')} sx={{ mt: 1.5, textTransform: 'none', fontSize: 11, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}>
                                        Xem ngay
                                    </Button>
                                </Box>
                            )}
                    </Paper>
                </Grid>
            </Grid>

            {/* ── ROW 3: Pending Orders + Top Products ── */}
            <Grid container spacing={2}>
                {/* Pending orders table */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden', bgcolor: '#fff' }}>
                        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#374151">Đơn hàng chờ xử lý</Typography>
                                {pendingOrders.length > 0 && <Typography variant="caption" color="#9ca3af">{pendingOrders.length} đơn đang chờ xử lý</Typography>}
                            </Box>
                            <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} onClick={() => navigate('/admin/orders')} sx={{ textTransform: 'none', fontSize: 12, color: '#2563eb' }}>Xem tất cả</Button>
                        </Box>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                    {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map(c => (
                                        <TableCell key={c} sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280', py: 1.25 }}>{c}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingOrders ? (
                                    [1, 2, 3].map(i => (
                                        <TableRow key={i}>{[1, 2, 3, 4].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>
                                    ))
                                ) : pendingOrders.length > 0 ? (
                                    pendingOrders.map((o, i) => {
                                        const st = STATUS_MAP[o.status] ?? { label: o.status, color: '#666', bg: '#f3f4f6' };
                                        return (
                                            <TableRow key={o.id} hover sx={{ cursor: 'pointer', bgcolor: i % 2 === 0 ? '#fff' : '#fafafa' }}
                                                onClick={() => navigate(`/admin/orders/${o.id}`)}>
                                                <TableCell sx={{ fontSize: 12, fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>{o.code}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} fontSize={12}>{o.customerName || o.shippingName || 'Khách lẻ'}</Typography>
                                                    <Typography variant="caption" color="#9ca3af">{o.shippingPhone}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{fmtCurrency(o.finalAmount)}</TableCell>
                                                <TableCell>
                                                    <Chip label={st.label} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: st.bg, color: st.color }} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 5, color: '#9ca3af', fontSize: 13 }}>
                                            <CheckCircle sx={{ fontSize: 36, color: '#d1d5db', display: 'block', mx: 'auto', mb: 1 }} />
                                            Không có đơn hàng chờ xử lý
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                {/* Top products */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#374151">🏆 Top bán chạy tháng này</Typography>
                                <Typography variant="caption" color="#9ca3af">Dựa trên số lượng bán ra</Typography>
                            </Box>
                            <Button size="small" onClick={() => navigate('/admin/reports')} sx={{ textTransform: 'none', fontSize: 12, color: '#2563eb' }}>Xem chi tiết</Button>
                        </Box>

                        {loadingTop ? (
                            [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={44} sx={{ mb: 1, borderRadius: 1.5 }} />)
                        ) : topProducts.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <BarChart sx={{ fontSize: 48, color: '#d1d5db', display: 'block', mx: 'auto', mb: 1 }} />
                                <Typography color="#9ca3af" fontSize={13}>Chưa có dữ liệu bán hàng</Typography>
                            </Box>
                        ) : (
                            topProducts.map((p, i) => {
                                const pct = Math.round((Number(p.total_sold ?? 0) / maxTop) * 100);
                                const bgColors = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#e0f7fa', '#fce8d5', '#e8f5e9'];
                                return (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 800, bgcolor: bgColors[i % bgColors.length], color: TOP_COLORS[i % TOP_COLORS.length] }}>
                                            {i + 1}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight={600} fontSize={12.5} noWrap>{p.name}</Typography>
                                                <Typography variant="caption" fontWeight={700} color={TOP_COLORS[i % TOP_COLORS.length]}>{p.total_sold?.toLocaleString()}</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={pct}
                                                sx={{ height: 5, borderRadius: 4, bgcolor: bgColors[i % bgColors.length], '& .MuiLinearProgress-bar': { bgcolor: TOP_COLORS[i % TOP_COLORS.length], borderRadius: 4 } }} />
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* ── AI Chat FAB ── */}
            {!showAI && (
                <Fab color="primary" onClick={() => setShowAI(true)} sx={{
                    position: 'fixed', right: 24, bottom: 24,
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 16px rgba(29,78,216,0.45)',
                    '&:hover': { filter: 'brightness(1.1)' },
                }}>
                    <SmartToy />
                </Fab>
            )}
            {showAI && <AIChatPanel onClose={() => setShowAI(false)} />}

            {/* WS Snack */}
            <Snackbar open={!!wsSnack} autoHideDuration={5000} onClose={() => setWsSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                {wsSnack ? (
                    <Alert severity="warning" onClose={() => setWsSnack(null)} sx={{ borderRadius: 2, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                        {wsSnack}
                    </Alert>
                ) : <div />}
            </Snackbar>

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </Box>
    );
};

export default DashboardPage;