import React, { useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, InputAdornment, Chip, Select, MenuItem,
    FormControl, Skeleton, Alert, Button, Typography, Card, CardContent,
    Grid, Tooltip, Slider,
} from '@mui/material';
import { Search, FileDownloadOutlined, Refresh, TrendingDown, Warning } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import reportService from '../../../../../services/reportService';
import categoryService from '../../../../../services/categoryService';
import productService from '../../../../../services/productService';
import { exportToExcel, fmtVnd } from '../../../../../utils/excelExport';
import useAuth from '../../../../../store/hooks/useAuth';
import { Warehouse, ProductResponse, DeadStockItem } from '../../../../../types';

const fmtCurrency = (n?: number) =>
    n == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

interface Props {
    warehouses: Warehouse[];
}

const DeadStockTab: React.FC<Props> = ({ warehouses }) => {
    const { isAdmin, warehouseId: myWarehouseId } = useAuth();

    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [search, setSearch] = useState('');
    const [days, setDays] = useState(90);

    const effectiveWarehouseId = isAdmin ? (selectedWarehouse || undefined) : (myWarehouseId ?? undefined);

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryService.getAll,
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productService.search({ size: 2000, isActive: true }).then(r => r.content),
        staleTime: 5 * 60 * 1000,
    });

    const productMap = React.useMemo(() => {
        const m = new Map<string, ProductResponse>();
        products.forEach(p => m.set(p.id, p));
        return m;
    }, [products]);

    const {
        data: deadStockRaw = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['dead-stock', days, effectiveWarehouseId],
        queryFn: () => reportService.getDeadStock(days, effectiveWarehouseId),
        staleTime: 2 * 60 * 1000,
    });

    // Enrich với product info
    const deadStock = React.useMemo(() => {
        return deadStockRaw.map(item => {
            const p = productMap.get(item.id);
            return {
                ...item,
                productName: p?.name ?? item.product_name,
                categoryName: p?.categoryName,
                categoryId: p?.categoryId,
                imageUrl: p?.imageUrl,
                retailPrice: p?.retailPrice,
                macPrice: p?.macPrice,
                stockValue: item.quantity * (p?.macPrice ?? 0),
            };
        });
    }, [deadStockRaw, productMap]);

    const filtered = deadStock.filter(item => {
        if (selectedCategory && item.categoryId !== selectedCategory) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            if (!item.productName.toLowerCase().includes(q) &&
                !item.isbn_barcode.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    // Thống kê
    const stats = {
        total: filtered.length,
        totalQty: filtered.reduce((s, i) => s + i.quantity, 0),
        totalValue: filtered.reduce((s, i) => s + (i.stockValue ?? 0), 0),
    };

    const handleExport = () => {
        exportToExcel(
            filtered.map(item => ({
                isbnBarcode: item.isbn_barcode,
                productName: item.productName,
                categoryName: item.categoryName ?? '',
                quantity: item.quantity,
                retailPrice: item.retailPrice ?? 0,
                macPrice: item.macPrice ?? 0,
                stockValue: item.stockValue ?? 0,
            })),
            [
                { header: 'Mã vạch / ISBN', key: 'isbnBarcode', width: 20 },
                { header: 'Tên sản phẩm', key: 'productName', width: 40 },
                { header: 'Danh mục', key: 'categoryName', width: 18 },
                { header: 'Tồn kho', key: 'quantity', width: 12 },
                { header: 'Giá bán lẻ (VND)', key: 'retailPrice', width: 18, formatter: fmtVnd },
                { header: 'Giá vốn MAC (VND)', key: 'macPrice', width: 18, formatter: fmtVnd },
                { header: 'Giá trị tồn đọng (VND)', key: 'stockValue', width: 22, formatter: fmtVnd },
            ],
            `hang-ton-dong-${days}ngay`,
            `Hàng Tồn Đọng ${days} Ngày`
        );
    };

    const clearFilters = () => { setSearch(''); setSelectedCategory(''); setSelectedWarehouse(''); };
    const activeCount = [search, selectedCategory, isAdmin ? selectedWarehouse : ''].filter(Boolean).length;

    return (
        <Box>
            {/* Header alert */}
            {filtered.length > 0 && (
                <Alert severity="warning" icon={<TrendingDown />} sx={{ mb: 2, borderRadius: 2 }}>
                    Có <strong>{filtered.length}</strong> sản phẩm không có giao dịch trong{' '}
                    <strong>{days} ngày</strong> qua, giá trị tồn đọng{' '}
                    <strong>{fmtCurrency(stats.totalValue)}</strong>.
                    Cân nhắc giảm giá, trả nhà cung cấp hoặc thanh lý.
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                    { label: 'Mặt hàng tồn đọng', value: stats.total, color: '#d97706' },
                    { label: 'Tổng tồn kho', value: stats.totalQty.toLocaleString(), color: '#374151' },
                    { label: 'Giá trị tồn đọng', value: fmtCurrency(stats.totalValue), color: '#d32f2f' },
                ].map(s => (
                    <Grid size={{ xs: 12, sm: 4 }} key={s.label}>
                        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                                {isLoading ? <Skeleton height={32} /> : (
                                    <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Days slider */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Warning sx={{ fontSize: 15, color: '#d97706' }} />
                    <Typography variant="caption" fontWeight={700} color="#555" sx={{ minWidth: 180 }}>
                        Không có GD trong <strong style={{ color: '#d97706' }}>{days} ngày</strong>
                    </Typography>
                    <Slider
                        value={days}
                        onChange={(_, v) => setDays(v as number)}
                        onChangeCommitted={() => refetch()}
                        min={30} max={365} step={30}
                        marks={[
                            { value: 30, label: '30n' },
                            { value: 60, label: '60n' },
                            { value: 90, label: '90n' },
                            { value: 180, label: '6t' },
                            { value: 365, label: '1 năm' },
                        ]}
                        sx={{ flex: 1, minWidth: 200, color: '#d97706', '& .MuiSlider-markLabel': { fontSize: 10 } }}
                    />
                </Box>
            </Paper>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" placeholder="Tìm theo tên, ISBN..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment> }} />
                {isAdmin && (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả kho</MenuItem>
                            {warehouses.filter(w => w.isActive).map(w => (
                                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} displayEmpty>
                        <MenuItem value="">Tất cả danh mục</MenuItem>
                        {categories.filter(c => c.isActive).map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />}
                    onClick={() => refetch()} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>
                    Làm mới
                </Button>
                <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                    onClick={handleExport}
                    sx={{ textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32' }}>
                    Excel ({filtered.length})
                </Button>
                {activeCount > 0 && (
                    <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none', color: '#d32f2f', fontSize: 12 }}>
                        Xóa bộ lọc ({activeCount})
                    </Button>
                )}
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Sản phẩm', 'ISBN / Mã vạch', 'Danh mục', 'Tồn kho', 'Giá bán lẻ', 'Giá vốn (MAC)', 'Giá trị tồn đọng', 'Đề xuất'].map(c => (
                                    <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, color: '#888', py: 1.5 }}>
                                        {c.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                            ) : filtered.length > 0 ? (
                                filtered.map((item, idx) => {
                                    const value = item.stockValue ?? 0;
                                    const urgency = value > 5_000_000 ? 'high' : value > 1_000_000 ? 'medium' : 'low';
                                    return (
                                        <TableRow key={item.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {item.imageUrl && (
                                                        <Box component="img" src={item.imageUrl} alt={item.productName}
                                                            sx={{ width: 36, height: 48, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />
                                                    )}
                                                    <Typography variant="body2" fontWeight={600} fontSize={13}>{item.productName}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontFamily="monospace" color="#888">{item.isbn_barcode || '—'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.categoryName ? (
                                                    <Chip label={item.categoryName} size="small"
                                                        sx={{ height: 20, fontSize: 10, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                                                ) : <Typography variant="caption" color="#bbb">—</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color="#d97706">
                                                    {item.quantity.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontSize={12}>{fmtCurrency(item.retailPrice)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontSize={12}>{fmtCurrency(item.macPrice)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}
                                                    color={urgency === 'high' ? '#d32f2f' : urgency === 'medium' ? '#e65100' : '#888'}>
                                                    {fmtCurrency(value)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={
                                                    urgency === 'high' ? 'Giá trị cao — ưu tiên xử lý ngay' :
                                                        urgency === 'medium' ? 'Cân nhắc giảm giá hoặc khuyến mãi' :
                                                            'Theo dõi thêm'
                                                }>
                                                    <Chip
                                                        label={urgency === 'high' ? 'Ưu tiên' : urgency === 'medium' ? 'Giảm giá' : 'Theo dõi'}
                                                        size="small"
                                                        sx={{
                                                            height: 20, fontSize: 10, fontWeight: 700,
                                                            bgcolor: urgency === 'high' ? '#ffebee' : urgency === 'medium' ? '#fff3e0' : '#f5f5f5',
                                                            color: urgency === 'high' ? '#d32f2f' : urgency === 'medium' ? '#e65100' : '#888',
                                                            cursor: 'help',
                                                        }}
                                                    />
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <TrendingDown sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {isLoading ? 'Đang tải...' : `Không có hàng tồn đọng trong ${days} ngày qua`}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default DeadStockTab;