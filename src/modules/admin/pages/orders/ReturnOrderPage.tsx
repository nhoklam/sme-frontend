import React, { useState } from 'react';
import {
    Box, Typography, Button, Paper, Grid, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Search, AssignmentReturn } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import posService from '../../../../services/posService';
import toast from 'react-hot-toast';
import useAuth from '../../../../store/hooks/useAuth';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

export default function ReturnOrderPage() {
    const { user } = useAuth();
    const [searchCode, setSearchCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [invoice, setInvoice] = useState<any>(null);
    const [error, setError] = useState('');

    // Form trả hàng
    const [returnItems, setReturnItems] = useState<{ productId: string; maxQty: number; quantity: number }[]>([]);
    const [returnDestination, setReturnDestination] = useState('STOCK');
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    // Lấy ca làm việc hiện tại
    const { data: currentShift } = useQuery({
        queryKey: ['current-shift'],
        queryFn: () => posService.getCurrentShift()
    });

    const handleSearch = async () => {
        if (!searchCode.trim()) return;
        setLoading(true);
        setError('');
        setInvoice(null);
        try {
            const data = await posService.getInvoiceByCode(searchCode.trim());
            setInvoice(data);

            // Khởi tạo state trả hàng
            if (data && data.items) {
                setReturnItems(data.items.map((i: any) => ({
                    productId: i.productId,
                    productName: i.productName || 'Sản phẩm ' + i.productId.substring(0, 5),
                    unitPrice: i.unitPrice,
                    maxQty: i.quantity,
                    quantity: 0 // Mặc định là không trả
                })));
            }
        } catch (e: any) {
            setError(e.response?.data?.message || 'Không tìm thấy hóa đơn này.');
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (productId: string, val: number) => {
        setReturnItems(items => items.map(i => {
            if (i.productId === productId) {
                const qty = Math.max(0, Math.min(val, i.maxQty));
                return { ...i, quantity: qty };
            }
            return i;
        }));
    };

    const handleSubmit = async () => {
        const itemsToReturn = returnItems.filter(i => i.quantity > 0);
        if (itemsToReturn.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 sản phẩm để trả!');
            return;
        }

        setProcessing(true);
        try {
            await posService.refund(invoice.id, {
                shiftId: currentShift?.id || "", 
                items: itemsToReturn.map(i => ({ productId: i.productId, quantity: i.quantity })),
                returnDestination,
                cashierId: user?.id || 'SYSTEM',
                warehouseId: user?.warehouseId || 'SYSTEM',
                note
            });
            toast.success('Trả hàng thành công!');
            setInvoice(null);
            setSearchCode('');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Lỗi khi trả hàng.');
        } finally {
            setProcessing(false);
        }
    };

    const totalRefund = returnItems.reduce((sum, item) => sum + (item.quantity * (item as any).unitPrice), 0);

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Typography variant="h5" fontWeight={800} color="#111" mb={3}>
                Xử lý Trả Hàng (POS)
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700} mb={2}>Tra cứu hóa đơn gốc</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth size="small"
                                placeholder="Nhập mã hóa đơn (VD: INV-...)"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button variant="contained" onClick={handleSearch} disabled={loading}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : <Search />}
                            </Button>
                        </Box>
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </Paper>

                    {invoice && (
                        <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} mb={2}>Thông tin Hóa đơn</Typography>
                            <Typography variant="body2" mb={1}><b>Mã:</b> {invoice.code}</Typography>
                            <Typography variant="body2" mb={1}><b>Ngày mua:</b> {new Date(invoice.createdAt).toLocaleString()}</Typography>
                            <Typography variant="body2" mb={1}><b>Tổng tiền:</b> {fmt(invoice.finalAmount)}</Typography>
                            <Typography variant="body2" mb={1}><b>Trạng thái:</b> Đã thanh toán</Typography>
                        </Paper>
                    )}
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    {invoice ? (
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} mb={2}>Chọn Sản phẩm Trả lại</Typography>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableCell><b>Sản phẩm</b></TableCell>
                                            <TableCell align="right"><b>Đơn giá</b></TableCell>
                                            <TableCell align="center"><b>Đã mua</b></TableCell>
                                            <TableCell align="center"><b>Số lượng trả</b></TableCell>
                                            <TableCell align="right"><b>Hoàn tiền</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {returnItems.map((item: any) => (
                                            <TableRow key={item.productId}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell align="right">{fmt(item.unitPrice)}</TableCell>
                                                <TableCell align="center">{item.maxQty}</TableCell>
                                                <TableCell align="center">
                                                    <TextField
                                                        type="number" size="small"
                                                        inputProps={{ min: 0, max: item.maxQty, style: { textAlign: 'center' } }}
                                                        value={item.quantity}
                                                        onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0)}
                                                        sx={{ width: 80 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                                                    {fmt(item.quantity * item.unitPrice)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                            <InputLabel>Tình trạng hàng trả</InputLabel>
                                            <Select
                                                value={returnDestination}
                                                onChange={(e) => setReturnDestination(e.target.value)}
                                                label="Tình trạng hàng trả"
                                            >
                                                <MenuItem value="STOCK">Hàng còn tốt (Nhập lại vào Kho bán)</MenuItem>
                                                <MenuItem value="DEFECT">Hàng lỗi (Nhập vào Kho lỗi)</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            fullWidth size="small" multiline rows={2}
                                            label="Ghi chú (Lý do trả hàng)"
                                            value={note} onChange={e => setNote(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'right' }}>
                                        <Typography variant="body1" color="text.secondary">Tổng tiền hoàn lại:</Typography>
                                        <Typography variant="h4" color="#d32f2f" fontWeight={800} mb={2}>
                                            {fmt(totalRefund)}
                                        </Typography>
                                        {(user?.role === 'ROLE_CASHIER' && !currentShift) && (
                                            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                                                Cần mở ca trước khi thực hiện trả hàng
                                            </Alert>
                                        )}
                                        <Button
                                            variant="contained" color="error" size="large"
                                            startIcon={<AssignmentReturn />}
                                            onClick={handleSubmit}
                                            disabled={processing || totalRefund === 0 || (user?.role === 'ROLE_CASHIER' && !currentShift)}
                                        >
                                            {processing ? 'Đang xử lý...' : 'Xác nhận Trả Hàng & Hoàn Tiền'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    ) : (
                        <Box sx={{ height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: 2, bgcolor: '#fff' }}>
                            <Typography color="text.secondary">Vui lòng tra cứu hóa đơn để tiến hành trả hàng</Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}