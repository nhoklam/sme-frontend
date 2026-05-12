import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogTitle, DialogActions,
    Table, TableBody, TableCell, TableHead, TableRow,
    Chip, Typography, Box, IconButton, Divider, Button, Pagination,
    CircularProgress, FormControl, Select, MenuItem, InputLabel,
} from '@mui/material';
import { Close, FileDownloadOutlined, FilterList } from '@mui/icons-material';
import inventoryService from '../../../../../services/inventoryService';
import { InventoryTransaction } from '../../../../../types';
import { exportToExcel } from '../../../../../utils/excelExport';

const TX_MAP: Record<string, { label: string; color: string; bg: string }> = {
    IMPORT: { label: 'Nhập kho', color: '#1976d2', bg: '#e3f2fd' },
    SALE: { label: 'Bán hàng', color: '#d32f2f', bg: '#ffebee' },
    SALE_POS: { label: 'Bán POS', color: '#d32f2f', bg: '#ffebee' },
    SALE_ONLINE: { label: 'Bán Online', color: '#e65100', bg: '#fff3e0' },
    ADJUSTMENT: { label: 'Điều chỉnh', color: '#7b1fa2', bg: '#f3e5f5' },
    RESERVE: { label: 'Giữ chỗ', color: '#0277bd', bg: '#e1f5fe' },
    RELEASE: { label: 'Giải phóng', color: '#2e7d32', bg: '#e8f5e9' },
    RETURN_TO_STOCK: { label: 'Trả về kho', color: '#2e7d32', bg: '#e8f5e9' },
    RETURN: { label: 'Trả hàng', color: '#2e7d32', bg: '#e8f5e9' },
    TRANSFER_OUT: { label: 'Xuất chuyển', color: '#6a1b9a', bg: '#f3e5f5' },
    TRANSFER_IN: { label: 'Nhận chuyển', color: '#2e7d32', bg: '#e8f5e9' },
};

interface Props {
    open: boolean;
    inventoryId: string | null;
    productName: string;
    productImage?: string;
    onClose: () => void;
}

const PAGE_SIZE = 10;

const TransactionHistoryModal: React.FC<Props> = ({
    open, inventoryId, productName, productImage, onClose,
}) => {
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // ── NEW: Type filter ──────────────────────────────────────
    const [typeFilter, setTypeFilter] = useState('');

    const load = useCallback(async () => {
        if (!inventoryId) return;
        setLoading(true);
        try {
            const data = await inventoryService.getTransactions(inventoryId, page, PAGE_SIZE);
            let content = data.content ?? [];
            // Client-side filter by type (nếu backend không hỗ trợ param)
            if (typeFilter) {
                content = content.filter(tx => tx.transactionType === typeFilter);
            }
            setTransactions(content);
            setTotalPages(data.totalPages ?? 0);
            setTotalElements(data.totalElements ?? 0);
        } catch {
            setTransactions([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [inventoryId, page, typeFilter]);

    useEffect(() => { if (open) load(); }, [open, load]);
    useEffect(() => { if (!open) { setPage(0); setTransactions([]); setTypeFilter(''); } }, [open]);

    // Reset page khi đổi filter
    useEffect(() => { setPage(0); }, [typeFilter]);

    const handleExport = async () => {
        if (!inventoryId) return;
        try {
            const first = await inventoryService.getTransactions(inventoryId, 0, 1000);
            let rows = first.content ?? [];
            if (typeFilter) rows = rows.filter(tx => tx.transactionType === typeFilter);
            exportToExcel(rows, [
                { header: 'Thời gian', key: 'createdAt', width: 22, formatter: (v: any) => v ? new Date(v).toLocaleString('vi-VN') : '' },
                { header: 'Loại giao dịch', key: 'transactionType', width: 18, formatter: (v: any) => TX_MAP[v]?.label ?? v },
                { header: 'Thay đổi', key: 'quantityChange', width: 12 },
                { header: 'Trước', key: 'quantityBefore', width: 10 },
                { header: 'Sau', key: 'quantityAfter', width: 10 },
                { header: 'Ghi chú', key: 'note', width: 30 },
                { header: 'Người thực hiện', key: 'createdBy', width: 20 },
            ], `lich-su-kho-${productName}${typeFilter ? `-${typeFilter}` : ''}`);
        } catch { /* silent */ }
    };

    // Thống kê nhanh theo loại GD đang hiển thị
    const txTypeCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        transactions.forEach(tx => {
            counts[tx.transactionType] = (counts[tx.transactionType] ?? 0) + 1;
        });
        return counts;
    }, [transactions]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {productImage && (
                        <Box component="img" src={productImage} alt={productName}
                            sx={{ width: 40, height: 50, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />
                    )}
                    <Box>
                        <Typography fontWeight={800} fontSize={16}>Lịch sử giao dịch kho</Typography>
                        <Typography variant="caption" color="text.secondary">{productName}</Typography>
                        {totalElements > 0 && (
                            <Typography variant="caption" color="#888" display="block">
                                {totalElements.toLocaleString()} giao dịch
                                {typeFilter && ` · lọc: ${TX_MAP[typeFilter]?.label ?? typeFilter}`}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
                        onClick={handleExport}
                        sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', fontSize: 12 }}>
                        Excel
                    </Button>
                    <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
                </Box>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />

            {/* ── NEW: Type filter bar ─────────────────────────────── */}
            <Box sx={{ px: 3, py: 1.25, bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <FilterList sx={{ fontSize: 15, color: '#888' }} />
                <Typography variant="caption" fontWeight={700} color="#555">Lọc loại GD:</Typography>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                    <Select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        displayEmpty
                        sx={{ fontSize: 12, height: 30 }}
                    >
                        <MenuItem value="">Tất cả loại ({totalElements})</MenuItem>
                        {Object.entries(TX_MAP).map(([k, v]) => (
                            <MenuItem key={k} value={k}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                        width: 8, height: 8, borderRadius: '50%', bgcolor: v.color,
                                        flexShrink: 0,
                                    }} />
                                    {v.label}
                                    {txTypeCounts[k] && (
                                        <Chip label={txTypeCounts[k]} size="small"
                                            sx={{ height: 16, fontSize: 9, ml: 'auto', bgcolor: v.bg, color: v.color }} />
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {typeFilter && (
                    <Button size="small" onClick={() => setTypeFilter('')}
                        sx={{ textTransform: 'none', color: '#d32f2f', fontSize: 11, py: 0, minWidth: 0 }}>
                        Xóa lọc
                    </Button>
                )}
                {/* Quick filter chips */}
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', ml: 'auto' }}>
                    {[
                        { key: 'IMPORT', label: 'Nhập kho' },
                        { key: 'SALE_POS', label: 'Bán' },
                        { key: 'ADJUSTMENT', label: 'Điều chỉnh' },
                        { key: 'TRANSFER_IN', label: 'Nhận chuyển' },
                    ].map(item => (
                        <Chip
                            key={item.key}
                            label={item.label}
                            size="small"
                            clickable
                            onClick={() => setTypeFilter(typeFilter === item.key ? '' : item.key)}
                            sx={{
                                height: 22, fontSize: 10, fontWeight: 600,
                                bgcolor: typeFilter === item.key ? TX_MAP[item.key]?.bg : '#f5f5f5',
                                color: typeFilter === item.key ? TX_MAP[item.key]?.color : '#555',
                                border: typeFilter === item.key ? `1px solid ${TX_MAP[item.key]?.color}` : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={36} />
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                {['Thời gian', 'Loại', 'Thay đổi', 'Trước', 'Sau', 'Ghi chú', 'Người TH'].map(c => (
                                    <TableCell key={c} sx={{ fontSize: 11, fontWeight: 700, color: '#888', py: 1.25 }}>{c}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map((tx, idx) => {
                                const info = TX_MAP[tx.transactionType] || { label: tx.transactionType, color: '#666', bg: '#f5f5f5' };
                                return (
                                    <TableRow key={tx.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography variant="caption" fontFamily="monospace" color="#555">
                                                {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Chip label={info.label} size="small"
                                                sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: info.bg, color: info.color }} />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography variant="body2" fontWeight={700}
                                                color={tx.quantityChange > 0 ? '#2e7d32' : tx.quantityChange < 0 ? '#d32f2f' : '#888'}>
                                                {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
                                            </Typography>
                                        </TableCell>
                                        <TableCell><Typography variant="caption">{tx.quantityBefore}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" fontWeight={700}>{tx.quantityAfter}</Typography></TableCell>
                                        <TableCell sx={{ py: 1.25, maxWidth: 200 }}>
                                            <Typography variant="caption" color="#888" noWrap>{tx.note || '—'}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25 }}>
                                            <Typography variant="caption" color="text.secondary">{tx.createdBy || '—'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {typeFilter
                                                ? `Không có giao dịch loại "${TX_MAP[typeFilter]?.label ?? typeFilter}"`
                                                : 'Chưa có giao dịch nào'}
                                        </Typography>
                                        {typeFilter && (
                                            <Button size="small" variant="outlined" onClick={() => setTypeFilter('')}
                                                sx={{ mt: 1, textTransform: 'none', fontSize: 11 }}>
                                                Xem tất cả loại
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #f0f0f0' }}>
                    <Typography variant="caption" color="text.secondary">
                        Trang {page + 1} / {totalPages}
                        {typeFilter && <span> · lọc: <strong>{TX_MAP[typeFilter]?.label}</strong></span>}
                    </Typography>
                    <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)}
                        size="small" color="primary" shape="rounded" />
                </Box>
            )}
        </Dialog>
    );
};

export default TransactionHistoryModal;