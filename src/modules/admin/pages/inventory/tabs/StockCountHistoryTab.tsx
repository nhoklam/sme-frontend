import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    IconButton, Skeleton, Pagination,
    Dialog, DialogTitle, DialogContent, Tooltip,
    Snackbar, Alert
} from '@mui/material';
import {
    Visibility, Edit, ContentCopy, Close, History,
    CalendarToday, Store, CheckCircle, Warning, Error
} from '@mui/icons-material';

import { Warehouse, ProductResponse } from '../../../../../types';
import inventoryService from '../../../../../services/inventoryService';
import productService from '../../../../../services/productService';
import StockCountTab from './StockCountTab'; // Để tái sử dụng modal kiểm kho

interface SavedReceipt {
    code: string;
    time: string;
    items: any[];
    warehouseName: string;
}

interface StockCountHistoryTabProps {
    warehouses: Warehouse[];
}

const StockCountHistoryTab: React.FC<StockCountHistoryTabProps> = ({ warehouses }) => {
    const qc = useQueryClient();
    
    const [stockPage, setStockPage] = useState(0);
    const [viewReceipt, setViewReceipt] = useState<SavedReceipt | null>(null);
    const [editReceipt, setEditReceipt] = useState<SavedReceipt | null>(null);
    const [stockCountOpen, setStockCountOpen] = useState(false);
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' | 'info' | 'warning' } | null>(null);

    // ── Lấy danh sách sản phẩm để map thông tin ──
    const { data: productsData, isLoading: loadingProducts } = useQuery({
        queryKey: ['products-all-for-history'],
        queryFn: async () => {
            const res = await productService.search({ size: 2000, isActive: true });
            return res.content;
        },
        staleTime: 5 * 60 * 1000,
    });

    const productMap = useMemo(() => {
        const m = new Map<string, ProductResponse>();
        productsData?.forEach(p => m.set(p.id, p));
        return m;
    }, [productsData]);

    // ── Lấy lịch sử kiểm kho từ API thật ──
    const { data: stockCountHistory = [], isLoading: loadingHistory, refetch } = useQuery({
        queryKey: ['stock-count-history', warehouses.length, !!productsData, stockCountOpen],
        queryFn: async () => {
            const history = await inventoryService.getHistory({ transactionType: 'ADJUSTMENT', size: 100 });
            const receipts: SavedReceipt[] = [];
            const groups: { [key: string]: SavedReceipt } = {};

            history.content.forEach(tx => {
                const match = tx.note?.match(/\[(PKK-\d+-\d+)\]/);
                const code = match ? match[1] : `PKK-${tx.createdAt.split('T')[0]}-${tx.id.slice(-4)}`;

                if (!groups[code]) {
                    groups[code] = {
                        code,
                        time: new Date(tx.createdAt).toLocaleString('vi-VN'),
                        items: [],
                        warehouseName: warehouses.find(w => w.id === (tx as any).warehouseId)?.name || 'N/A'
                    };
                    receipts.push(groups[code]);
                }

                const htMatch = tx.note?.match(/HT (\d+)/);
                const ttMatch = tx.note?.match(/TT (\d+)/);
                const p = productMap.get((tx as any).productId);

                groups[code].items.push({
                    productId: (tx as any).productId,
                    productName: p?.name || 'Sản phẩm đã xóa',
                    sku: p?.sku || 'N/A',
                    isbnBarcode: p?.isbnBarcode || 'N/A',
                    unit: p?.unit || 'N/A',
                    systemQty: htMatch ? Number(htMatch[1]) : tx.quantityBefore,
                    actualQty: ttMatch ? Number(ttMatch[1]) : tx.quantityAfter,
                    diff: tx.quantityChange,
                    checked: true
                });
            });
            return receipts;
        },
        enabled: warehouses.length > 0 && !!productsData
    });

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <History sx={{ color: '#6b7280' }} />
                    <Typography variant="h6" fontSize={16} fontWeight={800} color="#111">Lịch sử phiếu kiểm kho</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Mã phiếu</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Thời gian</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Kho</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Sản phẩm lệch</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#475569', textAlign: 'right' }}>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingHistory || loadingProducts ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Skeleton variant="text" width="60%" /></TableCell></TableRow>
                            ) : stockCountHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="#9ca3af">Chưa có lịch sử kiểm kho nào</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : stockCountHistory.slice(stockPage * 10, (stockPage + 1) * 10).map((h, i) => (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700} color="#2563eb">{h.code}</Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{h.time}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{h.warehouseName}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {h.items.length} <span style={{ color: '#6b7280', fontWeight: 400 }}>sản phẩm</span>
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Xem chi tiết">
                                            <IconButton size="small" onClick={() => setViewReceipt(h)} sx={{ color: '#1976d2' }}>
                                                <Visibility sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Sửa (Kiểm lại)">
                                            <IconButton size="small" onClick={() => { setEditReceipt(h); setStockCountOpen(true); }} sx={{ color: '#f59e0b' }}>
                                                <Edit sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Sao chép phiếu">
                                            <IconButton size="small" onClick={() => {
                                                const text = `${h.code}\n${h.time}\n\n` +
                                                    h.items.map((it: any) => `${it.productName} | ${it.sku} | Tồn: ${it.systemQty} | TT: ${it.actualQty} | Lệch: ${it.diff}`).join('\n');
                                                navigator.clipboard.writeText(text);
                                                setSnack({ msg: 'Đã sao chép phiếu', sev: 'success' });
                                            }} sx={{ color: '#6b7280' }}>
                                                <ContentCopy sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {Math.ceil(stockCountHistory.length / 10) > 1 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <Pagination count={Math.ceil(stockCountHistory.length / 10)} page={stockPage + 1} onChange={(_, v) => setStockPage(v - 1)} size="small" />
                    </Box>
                )}
            </Paper>

            {/* Kiểm kho Dialog */}
            {stockCountOpen && (
                <StockCountTab 
                    warehouses={warehouses} 
                    onClose={() => { 
                        setStockCountOpen(false); 
                        setEditReceipt(null); 
                        refetch(); 
                        qc.invalidateQueries({ queryKey: ['inventory-all'] });
                    }} 
                    initialReceipt={editReceipt ?? undefined} 
                />
            )}

            {/* Xem chi tiết phiếu */}
            <Dialog open={!!viewReceipt} onClose={() => setViewReceipt(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ 
                    fontWeight: 800, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 3,
                    pb: 2
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Chi tiết phiếu kiểm kho
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: 13, fontFamily: 'monospace' }}>
                            {viewReceipt?.code}
                        </Typography>
                    </Box>
                    <IconButton sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }} onClick={() => setViewReceipt(null)}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, bgcolor: '#f8fafc', pb: 2 }}>
                    <Box sx={{ px: 3, py: 2.5, display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2, color: '#3b82f6', display: 'flex' }}>
                                <CalendarToday fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="#64748b" fontWeight={600}>Thời gian kiểm</Typography>
                                <Typography variant="body2" fontWeight={700} color="#1e293b">{viewReceipt?.time}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, bgcolor: '#fef2f2', borderRadius: 2, color: '#ef4444', display: 'flex' }}>
                                <Store fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="#64748b" fontWeight={600}>Kho thực hiện</Typography>
                                <Typography variant="body2" fontWeight={700} color="#1e293b">{viewReceipt?.warehouseName}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
                            <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 2, color: '#22c55e', display: 'flex' }}>
                                <CheckCircle fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="#64748b" fontWeight={600}>Số lượng sản phẩm</Typography>
                                <Typography variant="body2" fontWeight={800} color="#1e293b" textAlign="right">{viewReceipt?.items?.length}</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="medium">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569', py: 1.5 }}>Sản phẩm</TableCell>
                                    <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569', py: 1.5 }}>SKU</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569', py: 1.5 }}>Tồn hệ thống</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569', py: 1.5 }}>Thực tế</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569', py: 1.5 }}>Lệch</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {viewReceipt?.items?.map((it: any, idx: number) => (
                                    <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="#0f172a">{it.productName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontFamily="monospace" color="#64748b" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1 }}>
                                                {it.sku}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={500} color="#64748b">{it.systemQty}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={800} color="#0f172a">{it.actualQty}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {it.diff === 0 ? (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', color: '#64748b', px: 1.5, py: 0.5, borderRadius: 2 }}>
                                                    <CheckCircle sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" fontWeight={700}>Khớp</Typography>
                                                </Box>
                                            ) : it.diff > 0 ? (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#f0fdf4', color: '#16a34a', px: 1.5, py: 0.5, borderRadius: 2 }}>
                                                    <Warning sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" fontWeight={700}>+{it.diff} Thừa</Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#fef2f2', color: '#dc2626', px: 1.5, py: 0.5, borderRadius: 2 }}>
                                                    <Error sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" fontWeight={700}>{it.diff} Thiếu</Typography>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
            </Dialog>

            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? (
                    <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
                ) : <div />}
            </Snackbar>
        </Box>
    );
};

export default StockCountHistoryTab;
