// src/modules/admin/pages/inventory/InventoryHistoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Chip, IconButton,
    Select, MenuItem, FormControl, Skeleton, Pagination,
    Alert, Grid, Card, CardContent,
} from '@mui/material';
import {
    Search, Refresh, ArrowBack, History as HistoryIcon,
    LocalShipping, Edit, SwapHoriz, CheckCircle, ShoppingCart,
} from '@mui/icons-material';
import warehouseService from '../../../../services/warehouseService';
import productService from '../../../../services/productService';
import { InventoryTransaction, ProductResponse } from '../../../../types';

// ── Helper ─────────────────────────────────────────────────────
const TX_TYPE_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
    IMPORT: { label: 'Nhập kho', color: '#1976d2', bg: '#e3f2fd', icon: <LocalShipping sx={{ fontSize: 14 }} /> },
    SALE: { label: 'Bán hàng', color: '#d32f2f', bg: '#ffebee', icon: <ShoppingCart sx={{ fontSize: 14 }} /> },
    ADJUSTMENT: { label: 'Điều chỉnh', color: '#e65100', bg: '#fff3e0', icon: <Edit sx={{ fontSize: 14 }} /> },
    TRANSFER_OUT: { label: 'Xuất chuyển', color: '#6a1b9a', bg: '#f3e5f5', icon: <SwapHoriz sx={{ fontSize: 14 }} /> },
    TRANSFER_IN: { label: 'Nhận chuyển', color: '#2e7d32', bg: '#e8f5e9', icon: <SwapHoriz sx={{ fontSize: 14 }} /> },
    RETURN: { label: 'Trả hàng', color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

// ── Main Component ─────────────────────────────────────────────
const InventoryHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [searchProduct, setSearchProduct] = useState('');
    const [products, setProducts] = useState<Map<string, ProductResponse>>(new Map());
    const PAGE_SIZE = 20;

    // Lấy danh sách kho
    const { data: warehouses } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => warehouseService.getAll(),
    });

    // Lấy danh sách sản phẩm để map
    useEffect(() => {
        productService.search({ size: 1000, isActive: true })
            .then(res => {
                const map = new Map<string, ProductResponse>();
                res.content.forEach(p => map.set(p.id, p));
                setProducts(map);
            })
            .catch(() => { });
    }, []);

    // Lấy lịch sử giao dịch (cần API tổng hợp, tạm thời dùng mock data)
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0); // THÊM state totalPages

    const loadHistory = async () => {
        setLoading(true);
        try {
            // TODO: Khi có API tổng hợp lịch sử, thay thế bằng:
            // const data = await inventoryService.getHistory({ page, size: PAGE_SIZE, warehouseId: selectedWarehouse });
            // setTransactions(data.content);
            // setTotalElements(data.totalElements);
            // setTotalPages(data.totalPages);

            // Tạm thời lấy dữ liệu rỗng
            setTransactions([]);
            setTotalElements(0);
            setTotalPages(0);
        } catch (error) {
            console.error('Lỗi tải lịch sử:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [page, selectedWarehouse]);

    const clearFilters = () => {
        setSelectedWarehouse('');
        setSearchProduct('');
        setPage(0);
    };

    const filteredTransactions = transactions.filter(tx => {
        if (!searchProduct) return true;
        const product = products.get(tx.inventoryId.split('-')[0]);
        return product?.name?.toLowerCase().includes(searchProduct.toLowerCase()) || false;
    });

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const userRole = userStr ? JSON.parse(userStr)?.user?.role : '';
    const isAdmin = userRole === 'ROLE_ADMIN';

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate('/admin/inventory')}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}
                    >
                        <ArrowBack sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Box>
                        <Typography variant="caption" color="#aaa" fontSize={11}>
                            Kho / <strong style={{ color: '#555' }}>Lịch sử kho</strong>
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="#1a1a2e" mt={0.25}>
                            Lịch sử giao dịch kho
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontSize={12}>
                            Xem toàn bộ lịch sử nhập, xuất, điều chỉnh tồn kho
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadHistory}
                    sx={{ textTransform: 'none' }}
                >
                    Làm mới
                </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="caption" color="text.secondary">Tổng giao dịch</Typography>
                            <Typography variant="h5" fontWeight={800} color="#1a1a2e">
                                {loading ? <Skeleton width={60} /> : totalElements}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="caption" color="text.secondary">Nhập kho</Typography>
                            <Typography variant="h5" fontWeight={800} color="#1976d2">
                                {loading ? <Skeleton width={60} /> : transactions.filter(t => t.transactionType === 'IMPORT').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="caption" color="text.secondary">Bán hàng</Typography>
                            <Typography variant="h5" fontWeight={800} color="#d32f2f">
                                {loading ? <Skeleton width={60} /> : transactions.filter(t => t.transactionType === 'SALE').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="caption" color="text.secondary">Điều chỉnh</Typography>
                            <Typography variant="h5" fontWeight={800} color="#e65100">
                                {loading ? <Skeleton width={60} /> : transactions.filter(t => t.transactionType === 'ADJUSTMENT').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên sản phẩm..."
                        value={searchProduct}
                        onChange={e => setSearchProduct(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment>
                        }}
                    />

                    {isAdmin && (
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select
                                value={selectedWarehouse}
                                onChange={e => setSelectedWarehouse(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="">Tất cả kho</MenuItem>
                                {warehouses?.filter(w => w.isActive).map(w => (
                                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <Button
                        size="small"
                        variant="outlined"
                        onClick={clearFilters}
                        sx={{ textTransform: 'none', color: '#d32f2f', borderColor: '#d32f2f' }}
                    >
                        Xóa bộ lọc
                    </Button>
                </Box>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Thời gian', 'Loại giao dịch', 'Sản phẩm', 'Thay đổi', 'Trước', 'Sau', 'Ghi chú', 'Người thực hiện'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>
                                        {c.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx, idx) => {
                                    const typeInfo = TX_TYPE_MAP[tx.transactionType] || {
                                        label: tx.transactionType,
                                        color: '#666',
                                        bg: '#f5f5f5',
                                        icon: <HistoryIcon sx={{ fontSize: 14 }} />
                                    };
                                    const product = products.get(tx.inventoryId.split('-')[0]);
                                    return (
                                        <TableRow key={tx.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption" fontFamily="monospace">
                                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Chip
                                                    icon={typeInfo.icon}
                                                    label={typeInfo.label}
                                                    size="small"
                                                    sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: typeInfo.bg, color: typeInfo.color }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="body2" fontWeight={600} fontSize={13}>
                                                    {product?.name || tx.inventoryId.slice(0, 8)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    color={tx.quantityChange > 0 ? '#2e7d32' : tx.quantityChange < 0 ? '#d32f2f' : '#888'}
                                                >
                                                    {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption">{tx.quantityBefore}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption" fontWeight={700}>{tx.quantityAfter}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption" color="#888">{tx.note || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption" color="text.secondary">{tx.createdBy || '—'}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">Chưa có dữ liệu lịch sử giao dịch</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #f0f0f0' }}>
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} size="small" />
                    </Box>
                )}
            </Paper>

            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography variant="caption">
                    💡 Lịch sử giao dịch hiển thị tất cả các hoạt động nhập kho, bán hàng, điều chỉnh tồn kho.
                    Để xem chi tiết từng sản phẩm, hãy nhấn vào nút "Lịch sử" trong trang Tồn kho.
                </Typography>
            </Alert>
        </Box>
    );
};

export default InventoryHistoryPage;