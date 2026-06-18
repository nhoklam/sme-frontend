import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Chip, IconButton,
    Select, MenuItem, FormControl, Skeleton, Pagination,
    Alert, Grid, Card, CardContent, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, Popover,
} from '@mui/material';
import {
    Search, Refresh, ArrowBack,
    History as HistoryIcon, LocalShipping, Edit,
    SwapHoriz, CheckCircle, ShoppingCart,
    CalendarToday, FilterAlt, FileDownloadOutlined,
    Close, OpenInNew, ErrorOutline, InfoOutlined,
    Warning as WarningIcon,
} from '@mui/icons-material';
import axiosInstance from '../../../../services/axiosConfig';
import warehouseService from '../../../../services/warehouseService';
import productService from '../../../../services/productService';
import userService from '../../../../services/userService';
import useAuth from '../../../../store/hooks/useAuth';
import { InventoryTransaction, PageResponse, ApiResponse, ProductResponse } from '../../../../types';
import { exportToExcel } from '../../../../utils/excelExport';

// ── helpers ────────────────────────────────────────────────────
const TX_TYPE_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
    IMPORT: { label: 'Nhập kho', color: '#1976d2', bg: '#e3f2fd', icon: <LocalShipping sx={{ fontSize: 14 }} /> },
    SALE: { label: 'Bán hàng', color: '#d32f2f', bg: '#ffebee', icon: <ShoppingCart sx={{ fontSize: 14 }} /> },
    SALE_POS: { label: 'Bán POS', color: '#d32f2f', bg: '#ffebee', icon: <ShoppingCart sx={{ fontSize: 14 }} /> },
    SALE_ONLINE: { label: 'Bán Online', color: '#e65100', bg: '#fff3e0', icon: <ShoppingCart sx={{ fontSize: 14 }} /> },
    ADJUSTMENT: { label: 'Điều chỉnh', color: '#e65100', bg: '#fff3e0', icon: <Edit sx={{ fontSize: 14 }} /> },
    TRANSFER_OUT: { label: 'Xuất chuyển', color: '#6a1b9a', bg: '#f3e5f5', icon: <SwapHoriz sx={{ fontSize: 14 }} /> },
    TRANSFER_IN: { label: 'Nhận chuyển', color: '#2e7d32', bg: '#e8f5e9', icon: <SwapHoriz sx={{ fontSize: 14 }} /> },
    RETURN: { label: 'Trả hàng', color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    RETURN_TO_STOCK: { label: 'Trả về kho', color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    RESERVE: { label: 'Giữ chỗ', color: '#0277bd', bg: '#e1f5fe', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    RELEASE: { label: 'Giải phóng', color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

const PAGE_SIZE = 10;

// ── Preset date ranges ──────────────────────────────────────────
const getDateRange = (preset: string): { from: string; to: string } => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    switch (preset) {
        case 'today': return { from: today, to: today };
        case 'yesterday': {
            const d = new Date(now); d.setDate(d.getDate() - 1);
            const s = d.toISOString().slice(0, 10);
            return { from: s, to: s };
        }
        case 'last7': {
            const d = new Date(now); d.setDate(d.getDate() - 6);
            return { from: d.toISOString().slice(0, 10), to: today };
        }
        case 'last30': {
            const d = new Date(now); d.setDate(d.getDate() - 29);
            return { from: d.toISOString().slice(0, 10), to: today };
        }
        case 'thisMonth': {
            const d = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: d.toISOString().slice(0, 10), to: today };
        }
        default: return { from: '', to: '' };
    }
};

interface EnrichedTransaction extends InventoryTransaction {
    productName?: string;
    productSku?: string;
    productImage?: string;
    warehouseName?: string;
    createdByName?: string;
}

// ── API fetch helper ──
const fetchInventoryHistory = async (params: {
    page: number;
    warehouseId?: string;
    transactionType?: string;
    keyword?: string;
    fromDate?: string;
    toDate?: string;
    size?: number;
}): Promise<PageResponse<InventoryTransaction>> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('size', String(params.size || PAGE_SIZE));
    if (params.warehouseId) query.set('warehouseId', params.warehouseId);
    if (params.transactionType) query.set('transactionType', params.transactionType);
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.fromDate) query.set('fromDate', params.fromDate);
    if (params.toDate) query.set('toDate', params.toDate);

    const res = await axiosInstance.get<ApiResponse<PageResponse<InventoryTransaction>>>(
        `/inventory/transactions?${query}`
    );
    return res.data.data;
};

// ── Error code helper ──
const getErrorCode = (err: unknown): number | null => {
    const e = err as any;
    return e?.response?.status ?? null;
};

// ── Transaction Detail Dialog ──
const TransactionDetailDialog: React.FC<{
    open: boolean;
    transaction: EnrichedTransaction | null;
    onClose: () => void;
    onNavigate?: (referenceId: string, type: string) => void;
}> = ({ open, transaction, onClose, onNavigate }) => {
    if (!transaction) return null;
    const typeInfo = TX_TYPE_MAP[transaction.transactionType] ?? {
        label: transaction.transactionType, color: '#666', bg: '#f5f5f5',
        icon: <HistoryIcon sx={{ fontSize: 14 }} />,
    };

    const getReferenceLabel = (type: string) => {
        if (['SALE', 'SALE_POS', 'SALE_ONLINE'].includes(type)) return 'Mã hóa đơn / Đơn hàng';
        if (type === 'IMPORT') return 'Mã phiếu nhập';
        if (['TRANSFER_IN', 'TRANSFER_OUT'].includes(type)) return 'Mã phiếu chuyển';
        if (['RETURN', 'RETURN_TO_STOCK'].includes(type)) return 'Mã phiếu trả hàng';
        return 'Mã tham chiếu';
    };

    const canNavigate = transaction.referenceId &&
        ['SALE', 'SALE_POS', 'SALE_ONLINE', 'IMPORT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(transaction.transactionType);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography fontWeight={800} fontSize={16}>Chi tiết giao dịch</Typography>
                        <Chip
                            icon={<Box sx={{ color: typeInfo.color, display: 'flex', pl: 0.5 }}>{typeInfo.icon}</Box>}
                            label={typeInfo.label} size="small"
                            sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: typeInfo.bg, color: typeInfo.color }}
                        />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('vi-VN') : '—'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />
            <DialogContent sx={{ px: 3, pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#f8f9fb', borderRadius: 2, mb: 2 }}>
                    {transaction.productImage && (
                        <Box component="img" src={transaction.productImage} alt={transaction.productName}
                            sx={{ width: 56, height: 72, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fff' }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight={700}>{transaction.productName}</Typography>
                        {transaction.productSku && (
                            <Typography variant="caption" color="#888" fontFamily="monospace">{transaction.productSku}</Typography>
                        )}
                        {transaction.warehouseName && (
                            <Chip label={transaction.warehouseName} size="small"
                                sx={{ mt: 0.5, height: 20, fontSize: 10, bgcolor: '#f0f0f0', color: '#555', display: 'block', width: 'fit-content' }} />
                        )}
                    </Box>
                </Box>

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[
                        { label: 'Tồn trước', value: transaction.quantityBefore, color: '#555' },
                        {
                            label: 'Thay đổi',
                            value: `${transaction.quantityChange > 0 ? '+' : ''}${transaction.quantityChange}`,
                            color: transaction.quantityChange > 0 ? '#2e7d32' : transaction.quantityChange < 0 ? '#d32f2f' : '#888',
                        },
                        { label: 'Tồn sau', value: transaction.quantityAfter, color: '#1976d2' },
                    ].map(s => (
                        <Grid key={s.label} size={{ xs: 4 }}>
                            <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                                <Typography variant="h6" fontWeight={800} color={s.color}>{s.value}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {transaction.batchNumber && (
                        <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#fff7ed', borderRadius: 1.5, border: '1px solid #ffedd5' }}>
                                <Typography variant="caption" color="#9a3412" display="block">Số lô (Batch)</Typography>
                                <Typography variant="body2" fontWeight={700} color="#9a3412">{transaction.batchNumber}</Typography>
                            </Box>
                        </Grid>
                    )}
                    {transaction.expiryDate && (
                        <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fee2e2' }}>
                                <Typography variant="caption" color="#991b1b" display="block">Hạn sử dụng</Typography>
                                <Typography variant="body2" fontWeight={700} color="#991b1b">{new Date(transaction.expiryDate).toLocaleDateString('vi-VN')}</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>

                {transaction.referenceId && (
                    <Box sx={{ p: 1.5, bgcolor: '#f0f7ff', borderRadius: 1.5, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="caption" color="#555" display="block">{getReferenceLabel(transaction.transactionType)}</Typography>
                            <Typography variant="body2" fontWeight={700} fontFamily="monospace" color="#1976d2">
                                {transaction.referenceId.slice(0, 12)}...
                            </Typography>
                        </Box>
                        {canNavigate && onNavigate && (
                            <Button size="small" variant="outlined" endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                                onClick={() => { onNavigate(transaction.referenceId, transaction.transactionType); onClose(); }}
                                sx={{ textTransform: 'none', fontSize: 11, borderColor: '#1976d2', color: '#1976d2' }}>
                                Xem chi tiết
                            </Button>
                        )}
                    </Box>
                )}

                {transaction.note && (
                    <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5 }}>
                        <Typography variant="caption" fontWeight={700} color="#555">Ghi chú:</Typography>
                        <Typography variant="body2" color="#555" mt={0.5}>{transaction.note}</Typography>
                    </Box>
                )}

                {transaction.createdBy && (
                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoOutlined sx={{ fontSize: 13, color: '#bbb' }} />
                        <Typography variant="caption" color="#888">Thực hiện bởi: <strong>{transaction.createdByName || transaction.createdBy}</strong></Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Main Component ──────────────────────────────────────────────
const InventoryHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin, warehouseId: myWarehouseId } = useAuth();

    const [page, setPage] = useState(0);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [keyword, setKeyword] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activePreset, setActivePreset] = useState('');
    const [exporting, setExporting] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<EnrichedTransaction | null>(null);
    const [dateMenuAnchor, setDateMenuAnchor] = useState<HTMLButtonElement | null>(null);

    const applyPreset = (preset: string) => {
        const range = getDateRange(preset);
        setFromDate(range.from);
        setToDate(range.to);
        setActivePreset(preset);
        setPage(0);
    };

    const clearDateFilter = () => { setFromDate(''); setToDate(''); setActivePreset(''); setPage(0); };

    const { data: warehouses } = useQuery({
        queryKey: ['warehouses'],
        queryFn: warehouseService.getAll,
    });

    const { data: productsData } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productService.search({ size: 2000, isActive: true }).then(r => r.content),
        staleTime: 5 * 60 * 1000,
    });

    const productMap = React.useMemo(() => {
        const m = new Map<string, ProductResponse>();
        productsData?.forEach(p => m.set(p.id, p));
        return m;
    }, [productsData]);

    const warehouseMap = React.useMemo(() => {
        const m = new Map<string, string>();
        warehouses?.forEach(w => m.set(w.id, w.name));
        return m;
    }, [warehouses]);

    const { data: usersData } = useQuery({
        queryKey: ['users-all'],
        queryFn: () => userService.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    const userMap = React.useMemo(() => {
        const m = new Map<string, string>();
        usersData?.forEach(u => m.set(u.id, u.fullName || u.username));
        return m;
    }, [usersData]);

    const {
        data: historyData,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['inventory-history', page, selectedWarehouse, selectedType, keyword, fromDate, toDate],
        queryFn: () => fetchInventoryHistory({
            page,
            warehouseId: selectedWarehouse || (isAdmin ? undefined : myWarehouseId ?? undefined),
            transactionType: selectedType || undefined,
            keyword: keyword || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
        }),
        placeholderData: (prev) => prev,
    });

    const transactions = historyData?.content ?? [];
    const totalPages = historyData?.totalPages ?? 0;
    const totalElements = historyData?.totalElements ?? 0;

    const enrichedTransactions: EnrichedTransaction[] = React.useMemo(() => {
        return transactions.map(tx => {
            const anyTx = tx as any;
            const productId = anyTx.productId ?? anyTx.product_id;
            const warehouseId = anyTx.warehouseId ?? anyTx.warehouse_id;
            const product = productId ? productMap.get(productId) : undefined;
            return {
                ...tx,
                productName: anyTx.productName ?? product?.name ?? `Kho: ${tx.inventoryId?.slice(0, 8) ?? '—'}`,
                productSku: anyTx.productSku ?? product?.sku ?? product?.isbnBarcode,
                productImage: anyTx.productImage ?? product?.imageUrl,
                warehouseName: anyTx.warehouseName ?? (warehouseId ? warehouseMap.get(warehouseId) : undefined),
                createdByName: tx.createdBy ? (userMap.get(tx.createdBy) || tx.createdBy) : undefined,
            };
        });
    }, [transactions, productMap, warehouseMap, userMap]);

    const clearAllFilters = () => {
        setSelectedWarehouse(''); setSelectedType(''); setKeyword('');
        clearDateFilter(); setPage(0);
    };

    const activeFilterCount = [selectedWarehouse, selectedType, keyword, fromDate || toDate].filter(Boolean).length;

    const stats = {
        total: totalElements,
        import: enrichedTransactions.filter(t => t.transactionType === 'IMPORT').length,
        sale: enrichedTransactions.filter(t => ['SALE', 'SALE_POS', 'SALE_ONLINE'].includes(t.transactionType)).length,
        transfer: enrichedTransactions.filter(t => ['TRANSFER_IN', 'TRANSFER_OUT'].includes(t.transactionType)).length,
    };

    const dateRangeLabel = React.useMemo(() => {
        if (!fromDate && !toDate) return null;
        if (fromDate === toDate) return fromDate;
        if (fromDate && toDate) return `${fromDate} → ${toDate}`;
        if (fromDate) return `Từ ${fromDate}`;
        return `Đến ${toDate}`;
    }, [fromDate, toDate]);

    const handleExportAll = async () => {
        setExporting(true);
        try {
            const bigData = await fetchInventoryHistory({
                page: 0,
                warehouseId: selectedWarehouse || (isAdmin ? undefined : myWarehouseId ?? undefined),
                transactionType: selectedType || undefined,
                keyword: keyword || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                size: 10000,
            } as any);
            const rows = (bigData.content ?? []).map(tx => {
                const anyTx = tx as any;
                const productId = anyTx.productId ?? anyTx.product_id;
                const product = productId ? productMap.get(productId) : undefined;
                const warehouseId = anyTx.warehouseId ?? anyTx.warehouse_id;
                return {
                    createdAt: tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '',
                    transactionType: TX_TYPE_MAP[tx.transactionType]?.label ?? tx.transactionType,
                    productName: anyTx.productName ?? product?.name ?? '',
                    productSku: anyTx.productSku ?? product?.sku ?? '',
                    warehouseName: anyTx.warehouseName ?? (warehouseId ? warehouseMap.get(warehouseId) : '') ?? '',
                    quantityChange: tx.quantityChange,
                    quantityBefore: tx.quantityBefore,
                    quantityAfter: tx.quantityAfter,
                    note: tx.note ?? '',
                    createdBy: tx.createdBy ?? '',
                    referenceId: tx.referenceId ?? '',
                    batchNumber: tx.batchNumber ?? '',
                    expiryDate: tx.expiryDate ? new Date(tx.expiryDate).toLocaleDateString('vi-VN') : '',
                };
            });
            exportToExcel(rows, [
                { header: 'Thời gian', key: 'createdAt', width: 22 },
                { header: 'Loại giao dịch', key: 'transactionType', width: 16 },
                { header: 'Sản phẩm', key: 'productName', width: 40 },
                { header: 'SKU / ISBN', key: 'productSku', width: 18 },
                { header: 'Kho', key: 'warehouseName', width: 22 },
                { header: 'Thay đổi', key: 'quantityChange', width: 12 },
                { header: 'Tồn trước', key: 'quantityBefore', width: 12 },
                { header: 'Tồn sau', key: 'quantityAfter', width: 12 },
                { header: 'Số lô', key: 'batchNumber', width: 15 },
                { header: 'Hạn dùng', key: 'expiryDate', width: 15 },
                { header: 'Ghi chú', key: 'note', width: 30 },
                { header: 'Người TH', key: 'createdBy', width: 20 },
                { header: 'Mã tham chiếu', key: 'referenceId', width: 30 },
            ], `lich-su-kho-${fromDate || 'all'}-${toDate || 'all'}`, 'Lịch sử kho');
        } catch {
            // Silent fail
        } finally {
            setExporting(false);
        }
    };

    const handleNavigate = (referenceId: string, type: string) => {
        if (['SALE', 'SALE_POS', 'SALE_ONLINE'].includes(type)) {
            navigate('/admin/orders');
        } else if (type === 'IMPORT') {
            navigate('/admin/inventory/import');
        } else if (['TRANSFER_IN', 'TRANSFER_OUT'].includes(type)) {
            navigate('/admin/inventory/transfers');
        }
    };

    const PRESETS = [
        { key: 'today', label: 'Hôm nay' },
        { key: 'yesterday', label: 'Hôm qua' },
        { key: 'last7', label: '7 ngày' },
        { key: 'last30', label: '30 ngày' },
        { key: 'thisMonth', label: 'Tháng này' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton size="small" onClick={() => navigate('/admin/inventory')}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
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
                            Xem toàn bộ lịch sử nhập, xuất, điều chỉnh, chuyển kho
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                        onClick={handleExportAll} disabled={exporting}
                        sx={{ textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32', fontSize: 12 }}>
                        {exporting ? 'Đang xuất...' : 'Excel (tất cả)'}
                    </Button>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} sx={{ textTransform: 'none' }}>
                        Làm mới
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[
                        { label: 'Tổng giao dịch', value: stats.total, color: '#1a1a2e' },
                        { label: 'Nhập kho', value: stats.import, color: '#1976d2' },
                        { label: 'Bán hàng', value: stats.sale, color: '#d32f2f' },
                        { label: 'Chuyển kho', value: stats.transfer, color: '#6a1b9a' },
                    ].map(s => (
                        <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                                    {isLoading ? <Skeleton width={60} height={32} /> : (
                                        <Typography variant="h5" fontWeight={800} color={s.color}>
                                            {s.value.toLocaleString()}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

            {/* Filters Bar */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FilterAlt sx={{ fontSize: 15, color: '#888' }} />
                    <TextField size="small" placeholder="Tìm theo tên sản phẩm, mã..."
                        value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }}
                        sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#bbb' }} /></InputAdornment> }} />
                    
                    <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<CalendarToday sx={{ fontSize: 16 }} />}
                        onClick={(e) => setDateMenuAnchor(e.currentTarget)}
                        sx={{ 
                            textTransform: 'none', 
                            color: dateRangeLabel ? '#1976d2' : '#555', 
                            borderColor: dateRangeLabel ? '#1976d2' : '#e0e0e0',
                            height: 40,
                            bgcolor: dateRangeLabel ? '#eff6ff' : 'transparent',
                        }}
                    >
                        {dateRangeLabel || 'Lọc ngày'}
                    </Button>
                    <Popover
                        open={Boolean(dateMenuAnchor)}
                        anchorEl={dateMenuAnchor}
                        onClose={() => setDateMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        PaperProps={{ sx: { p: 2, width: 320, mt: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
                    >
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1.5}>Gợi ý nhanh</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {PRESETS.map(p => (
                                <Button key={p.key} size="small"
                                    variant={activePreset === p.key ? 'contained' : 'outlined'}
                                    onClick={() => applyPreset(p.key)}
                                    sx={{
                                        textTransform: 'none', fontSize: 11, minWidth: 0, px: 1.25, py: 0.4, height: 26,
                                        bgcolor: activePreset === p.key ? '#1976d2' : undefined,
                                        borderColor: activePreset === p.key ? '#1976d2' : '#e0e0e0',
                                        color: activePreset === p.key ? '#fff' : '#555',
                                    }}>
                                    {p.label}
                                </Button>
                            ))}
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={1.5}>Tùy chọn khoảng thời gian</Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" color="#888" display="block" mb={0.5}>Từ ngày</Typography>
                                <TextField fullWidth size="small" type="date" value={fromDate}
                                    onChange={e => { setFromDate(e.target.value); setActivePreset(''); setPage(0); }}
                                    inputProps={{ max: toDate || undefined, style: { fontSize: 13, padding: '6.5px 8px' } }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" color="#888" display="block" mb={0.5}>Đến ngày</Typography>
                                <TextField fullWidth size="small" type="date" value={toDate}
                                    onChange={e => { setToDate(e.target.value); setActivePreset(''); setPage(0); }}
                                    inputProps={{ min: fromDate || undefined, style: { fontSize: 13, padding: '6.5px 8px' } }} />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {(fromDate || toDate) && (
                                <Button size="small" onClick={clearDateFilter} sx={{ textTransform: 'none', color: '#d32f2f' }}>
                                    Xóa trắng
                                </Button>
                            )}
                            <Button size="small" variant="contained" onClick={() => setDateMenuAnchor(null)} sx={{ textTransform: 'none' }}>
                                Đóng
                            </Button>
                        </Box>
                    </Popover>

                    {isAdmin && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <Select value={selectedWarehouse} onChange={e => { setSelectedWarehouse(e.target.value); setPage(0); }} displayEmpty sx={{ height: 40 }}>
                                <MenuItem value="">Tất cả kho</MenuItem>
                                {warehouses?.filter(w => w.isActive).map(w => (
                                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select value={selectedType} onChange={e => { setSelectedType(e.target.value); setPage(0); }} displayEmpty sx={{ height: 40 }}>
                            <MenuItem value="">Tất cả loại</MenuItem>
                            {Object.entries(TX_TYPE_MAP).map(([k, v]) => (
                                <MenuItem key={k} value={k}>{v.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {activeFilterCount > 0 && (
                        <Button size="small" variant="outlined" onClick={clearAllFilters}
                            sx={{ textTransform: 'none', color: '#d32f2f', borderColor: '#d32f2f', height: 40, px: 2 }}>
                            Xóa lọc ({activeFilterCount})
                        </Button>
                    )}
                </Box>
            </Paper>

            {isError && (
                <Alert severity="error" icon={<ErrorOutline />} sx={{ mb: 2, borderRadius: 2 }}
                    action={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" color="error" variant="outlined"
                                onClick={() => { clearDateFilter(); setSelectedType(''); refetch(); }}
                                sx={{ textTransform: 'none', fontSize: 11 }}>
                                Xóa filter & thử lại
                            </Button>
                            <Button size="small" color="error" onClick={() => refetch()} sx={{ textTransform: 'none', fontSize: 11 }}>
                                Thử lại
                            </Button>
                        </Box>
                    }>
                    <Typography variant="body2" fontWeight={700}>Lỗi tải dữ liệu</Typography>
                    <Typography variant="caption">Không thể kết nối tới server.</Typography>
                </Alert>
            )}

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Thời gian', 'Loại giao dịch', 'Sản phẩm', 'Kho', 'Thay đổi', 'Trước', 'Sau', 'Ghi chú', 'Người TH'].map(c => (
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
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                            ) : enrichedTransactions.length > 0 ? (
                                enrichedTransactions.map((tx, idx) => {
                                    const typeInfo = TX_TYPE_MAP[tx.transactionType] ?? {
                                        label: tx.transactionType, color: '#666', bg: '#f5f5f5',
                                        icon: <HistoryIcon sx={{ fontSize: 14 }} />,
                                    };
                                    return (
                                        <TableRow key={tx.id} hover
                                            onClick={() => { setSelectedTx(tx); setDetailOpen(true); }}
                                            sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}>
                                            <TableCell sx={{ py: 1.25, whiteSpace: 'nowrap' }}>
                                                <Typography variant="caption" fontFamily="monospace" fontSize={11}>
                                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Chip
                                                    icon={<Box sx={{ color: typeInfo.color, display: 'flex', pl: 0.5 }}>{typeInfo.icon}</Box>}
                                                    label={typeInfo.label} size="small"
                                                    sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: typeInfo.bg, color: typeInfo.color }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {tx.productImage && (
                                                        <Box component="img" src={tx.productImage} alt={tx.productName}
                                                            sx={{ width: 28, height: 36, objectFit: 'contain', borderRadius: 0.5, border: '1px solid #e0e0e0' }} />
                                                    )}
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Tooltip title={tx.productName}>
                                                            <Typography variant="body2" fontWeight={600} fontSize={12} sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {tx.productName}
                                                            </Typography>
                                                        </Tooltip>
                                                        {tx.productSku && (
                                                            <Typography variant="caption" color="text.secondary" fontFamily="monospace" fontSize={10}>
                                                                {tx.productSku}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                {tx.warehouseName ? (
                                                    <Chip label={tx.warehouseName} size="small"
                                                        sx={{ height: 20, fontSize: 10, bgcolor: '#f5f5f5', color: '#555' }} />
                                                ) : <Typography variant="caption" color="#bbb">—</Typography>}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="body2" fontWeight={700}
                                                    color={tx.quantityChange > 0 ? '#2e7d32' : tx.quantityChange < 0 ? '#d32f2f' : '#888'}>
                                                    {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption">{tx.quantityBefore}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption" fontWeight={700}>{tx.quantityAfter}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25, maxWidth: 180 }}>
                                                <Tooltip title={tx.note || ''} placement="top">
                                                    <Typography variant="caption" color="#888" noWrap sx={{ maxWidth: 160, display: 'block' }}>
                                                        {tx.note || '—'}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.25 }}>
                                                <Typography variant="caption" color="text.secondary">{tx.createdByName || tx.createdBy || '—'}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {fromDate || toDate ? 'Không có giao dịch trong khoảng thời gian đã chọn'
                                                : 'Chưa có dữ liệu lịch sử giao dịch'}
                                        </Typography>
                                        {(fromDate || toDate) && (
                                            <Button size="small" variant="outlined" onClick={clearDateFilter} sx={{ mt: 1, textTransform: 'none' }}>
                                                Xóa bộ lọc ngày
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderTop: '1px solid #f0f0f0' }}>
                        <Typography variant="caption" color="text.secondary">
                            Tổng <strong>{totalElements.toLocaleString()}</strong> giao dịch
                            {dateRangeLabel && <span> · <strong>{dateRangeLabel}</strong></span>}
                        </Typography>
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} size="small" />
                    </Box>
                )}
            </Paper>

            

            <TransactionDetailDialog
                open={detailOpen}
                transaction={selectedTx}
                onClose={() => setDetailOpen(false)}
                onNavigate={handleNavigate}
            />
        </Box>
    );
};

export default InventoryHistoryPage;
