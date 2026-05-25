import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Grid, IconButton, Avatar, Card, CardContent,
    Skeleton, Divider, InputAdornment, Select, MenuItem, FormControl
} from '@mui/material';
import {
    AccessTime, PlayArrow, Stop, Search, FilterList,
    AttachMoney, LocalAtm, AccountBalanceWallet,
    Close, MoreVert, CheckCircleOutline
} from '@mui/icons-material';
import shiftService, { PosShift } from '../../../../services/shiftService';
import authService from '../../../../services/authService';
import toast from 'react-hot-toast';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const ShiftStatCard = ({ title, value, sub, icon, color, loading }: any) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', bgcolor: '#fff' }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1, bgcolor: `${color}15`, borderRadius: 2, color: color, display: 'flex' }}>
                    {icon}
                </Box>
                <IconButton size="small"><MoreVert sx={{ fontSize: 18, color: '#aaa' }} /></IconButton>
            </Box>
            {loading ? <Skeleton width="70%" height={32} /> : (
                <Typography variant="h6" fontWeight={800} color="#1a1a2e">{value}</Typography>
            )}
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{title}</Typography>
            <Typography variant="caption" color="text.secondary" fontSize={10}>{sub}</Typography>
        </CardContent>
    </Card>
);

export default function ShiftListPage() {
    const navigate = useNavigate();
    const [shifts, setShifts] = useState<PosShift[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const [openModal, setOpenModal] = useState(false);
    const [actionType, setActionType] = useState<'OPEN' | 'CLOSE'>('OPEN');
    const [selectedShift, setSelectedShift] = useState<PosShift | null>(null);
    const [cashAmount, setCashAmount] = useState<string>('');
    const [note, setNote] = useState('');

    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await shiftService.getAll({ page: 0, size: 50, warehouseId: selectedWarehouseId || undefined });
            const content = (data as any)?.content || (Array.isArray(data) ? data : []);
            setShifts(content);
        } catch (e) {
            toast.error('Không thể tải danh sách ca làm việc');
            setShifts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenShift = () => {
        setActionType('OPEN');
        setCashAmount('');
        setOpenModal(true);
    };

    const handleCloseShift = (shift: PosShift) => {
        setSelectedShift(shift);
        setActionType('CLOSE');
        setCashAmount('');
        setNote('');
        setOpenModal(true);
    };

    const handleApproveShift = async (shift: PosShift) => {
        try {
            await shiftService.approveShift(shift.id);
            toast.success('Đã duyệt ca thành công!');
            loadData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi duyệt.');
        }
    };

    const handleSubmit = async () => {
        try {
            if (actionType === 'OPEN') {
                await shiftService.openShift(currentUser?.warehouseId || 'W01', Number(cashAmount));
                toast.success('Mở ca làm việc thành công!');
            } else {
                const diff = (selectedShift?.theoreticalCash || 0) - Number(cashAmount);
                if (diff !== 0 && (!note || note.trim() === '')) {
                    toast.error('Bắt buộc phải nhập ghi chú khi có chênh lệch tiền mặt!');
                    return;
                }
                await shiftService.closeShift(selectedShift!.id, Number(cashAmount), note);
                toast.success('Đã đóng ca và gửi yêu cầu đối soát!');
            }
            setOpenModal(false);
            loadData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra, thử lại sau.');
        }
    };

    const activeShifts = shifts.filter(s => s.status === 'OPEN').length;
    const totalRevenue = shifts.reduce((s, i) => s + (i.totalRevenue || 0), 0);

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>
                        Quản lý Ca Thu Ngân
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Theo dõi dòng tiền mặt, doanh thu theo ca và đối soát cuối ngày
                    </Typography>
                </Box>
                {!isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={handleOpenShift}
                        sx={{
                            bgcolor: '#1976d2', fontWeight: 700, px: 2.5, py: 1,
                            borderRadius: 2, textTransform: 'none', boxShadow: '0 4px 12px rgba(25,118,210,0.2)'
                        }}
                    >
                        Mở Ca Mới
                    </Button>
                )}
            </Box>

            {/* Stats */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <ShiftStatCard
                        title="Ca đang hoạt động"
                        value={activeShifts}
                        sub="Số thu ngân đang trong phiên bán hàng"
                        icon={<AccessTime />}
                        color="#1976d2"
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <ShiftStatCard
                        title="Doanh thu tổng"
                        value={fmt(totalRevenue)}
                        sub="Tổng doanh số ghi nhận từ tất cả các ca"
                        icon={<AttachMoney />}
                        color="#2e7d32"
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <ShiftStatCard
                        title="Tổng chênh lệch"
                        value={fmt(shifts.reduce((s, i) => s + (i.discrepancyAmount || 0), 0))}
                        sub="Tổng số tiền chênh lệch đối soát"
                        icon={<LocalAtm />}
                        color="#d32f2f"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            {/* List */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {isAdmin && (
                            <FormControl size="small" sx={{ width: 200 }}>
                                <Select
                                    value={selectedWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    displayEmpty
                                    sx={{ borderRadius: 2, bgcolor: '#f9fafb' }}
                                >
                                    <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                    {currentUser?.warehouses?.map((w: any) => (
                                        <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <TextField
                            size="small" placeholder="Tìm thu ngân..."
                            value={keyword} onChange={e => setKeyword(e.target.value)}
                            sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
                            slotProps={{
                                input: {
                                    startAdornment: <Search sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                }
                            }}
                        />
                        <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>
                            Lọc
                        </Button>
                    </Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                        HIỂN THỊ {shifts.length} PHIÊN LÀM VIỆC
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: '#fafafa', fontSize: 11, fontWeight: 800, color: '#888', py: 2 } }}>
                                <TableCell>THU NGÂN</TableCell>
                                <TableCell>THỜI GIAN</TableCell>
                                <TableCell align="right">VỐN ĐẦU CA</TableCell>
                                <TableCell align="right">DOANH THU</TableCell>
                                <TableCell align="right">CHÊNH LỆCH</TableCell>
                                <TableCell align="center">TRẠNG THÁI</TableCell>
                                <TableCell align="center">HÀNH ĐỘNG</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i}><TableCell colSpan={7} sx={{ p: 0 }}><Skeleton height={60} /></TableCell></TableRow>
                                ))
                            ) : shifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <AccountBalanceWallet sx={{ fontSize: 48, color: '#eee', mb: 1 }} />
                                        <Typography color="text.secondary">Chưa có ca làm việc nào được ghi nhận</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shifts.map((s) => (
                                    <TableRow key={s.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#e3f2fd', color: '#1976d2', fontSize: 13, fontWeight: 700 }}>
                                                    {(s.cashierName || s.cashierId || '?').charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700} color="#1a1a2e">{s.cashierName || s.cashierId}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{s.warehouseName || s.warehouseId}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTime sx={{ fontSize: 14, color: '#aaa' }} />
                                                <Typography variant="body2" fontSize={13}>
                                                    {new Date(s.openedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    {s.closedAt && ` - ${new Date(s.closedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(s.openedAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>{fmt(s.startingCash)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={700} color="#2e7d32">{fmt(s.totalRevenue)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={900} color={(s.discrepancyAmount || 0) !== 0 ? '#d32f2f' : '#1a1a2e'}>
                                                {fmt(s.discrepancyAmount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={s.status === 'OPEN' ? 'Đang mở' : s.status === 'MANAGER_APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800, fontSize: 10,
                                                    bgcolor: s.status === 'OPEN' ? '#e8f5e9' : s.status === 'MANAGER_APPROVED' ? '#e3f2fd' : '#fff3e0',
                                                    color: s.status === 'OPEN' ? '#2e7d32' : s.status === 'MANAGER_APPROVED' ? '#1976d2' : '#ed6c02',
                                                    border: '1px solid',
                                                    borderColor: s.status === 'OPEN' ? '#c8e6c9' : s.status === 'MANAGER_APPROVED' ? '#bbdefb' : '#ffe0b2'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                <Button
                                                    size="small" variant="outlined" disableElevation
                                                    onClick={() => navigate(`/admin/shifts/${s.id}`)}
                                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, fontSize: 11, minWidth: 0, px: 1.5, py: 0.5 }}
                                                >
                                                    Chi tiết
                                                </Button>
                                                {s.status === 'OPEN' && !isAdmin && (
                                                    <Button
                                                        size="small" variant="contained" color="error" disableElevation
                                                        startIcon={<Stop sx={{ fontSize: 14 }} />}
                                                        onClick={(e) => { e.stopPropagation(); handleCloseShift(s); }}
                                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, fontSize: 11, minWidth: 0, px: 1.5, py: 0.5 }}
                                                    >
                                                        Đóng ca
                                                    </Button>
                                                )}
                                                {s.status === 'CLOSED' && isAdmin && (
                                                    <Button
                                                        size="small" variant="contained" color="primary" disableElevation
                                                        startIcon={<CheckCircleOutline sx={{ fontSize: 14 }} />}
                                                        onClick={(e) => { e.stopPropagation(); handleApproveShift(s); }}
                                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, fontSize: 11, minWidth: 0, px: 1.5, py: 0.5 }}
                                                    >
                                                        Duyệt
                                                    </Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography fontWeight={900}>
                        {actionType === 'OPEN' ? 'Mở Ca Làm Việc' : 'Kết Thúc Ca'}
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenModal(false)}><Close /></IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ py: 3 }}>
                    {actionType === 'CLOSE' && selectedShift && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid #e0f2fe' }}>
                            <Typography variant="caption" color="primary" fontWeight={700}>TIỀN MẶT HỆ THỐNG TÍNH</Typography>
                            <Typography variant="h5" fontWeight={900} color="#1976d2">{fmt(selectedShift.theoreticalCash)}</Typography>
                        </Box>
                    )}

                    <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1}>
                        {actionType === 'OPEN' ? 'SỐ TIỀN MẶT ĐẦU CA (VỐN):' : 'KIỂM KÊ TIỀN MẶT THỰC TẾ TRONG KÉT:'}
                    </Typography>
                    <TextField
                        fullWidth type="number" size="small"
                        placeholder="Nhập số tiền..."
                        value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                            }
                        }}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {actionType === 'CLOSE' && (
                        <>
                            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1}>GHI CHÚ CHÊNH LỆCH:</Typography>
                            <TextField
                                fullWidth multiline rows={2} size="small"
                                placeholder="Ghi chú nếu có chênh lệch..."
                                value={note} onChange={e => setNote(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#888' }}>Hủy</Button>
                    <Button
                        variant="contained"
                        fullWidth
                        color={actionType === 'OPEN' ? 'success' : 'error'}
                        onClick={handleSubmit}
                        disabled={!cashAmount}
                        sx={{
                            textTransform: 'none', fontWeight: 900, borderRadius: 2, py: 1,
                            bgcolor: actionType === 'OPEN' ? '#2e7d32' : '#d32f2f'
                        }}
                    >
                        {actionType === 'OPEN' ? 'XÁC NHẬN MỞ CA' : 'XÁC NHẬN ĐÓNG CA'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
