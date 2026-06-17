import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, InputAdornment,
    Chip, Snackbar, Alert, Skeleton, CircularProgress, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
    Divider, Tabs, Tab, List, ListItemButton, ListItemText,
} from '@mui/material';
import {
    Search, Save, FileDownloadOutlined, Inventory2, Close,
    CheckCircle, DeleteOutline, Refresh,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axiosInstance from '../../../../../services/axiosConfig';
import inventoryService from '../../../../../services/inventoryService';
import productService from '../../../../../services/productService';
import { Warehouse as WarehouseType, ProductResponse, Inventory } from '../../../../../types';

interface StockCountItem {
    productId: string;
    sku: string;
    isbnBarcode: string;
    productName: string;
    unit: string;
    systemQty: number;
    actualQty: number | '';
    diff: number;
    checked: boolean;
}

// Removed duplicated Props

export interface SavedReceipt {
    code: string;
    time: string;
    items: StockCountItem[];
    warehouseName: string;
}

interface Props { warehouses: WarehouseType[]; onClose?: () => void; initialReceipt?: SavedReceipt; }

export const StockCountTab: React.FC<Props> = ({ warehouses, onClose, initialReceipt }) => {
    const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(
        initialReceipt ? warehouses.find(w => w.name === initialReceipt.warehouseName) || null : null
    );
    const [items, setItems] = useState<StockCountItem[]>(initialReceipt?.items || []);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState(0);
    const [snack, setSnack] = useState('');
    const [note, setNote] = useState('');
    const [recentChecks, setRecentChecks] = useState<{ name: string; qty: number }[]>([]);
    const [detailReceipt, setDetailReceipt] = useState<SavedReceipt | null>(null);
    const [adjustErrors, setAdjustErrors] = useState<any[]>([]);

    // Search dropdown state
    const [searchResults, setSearchResults] = useState<{ productId: string; sku: string; barcode: string; name: string; unit: string; qty: number }[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const activeWarehouses = warehouses.filter(w => w.isActive);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Fetch products from inventory + product API
    const fetchProducts = async (keyword?: string) => {
        if (!selectedWarehouse) return;
        setSearching(true);
        try {
            const params = keyword?.trim() ? { keyword: keyword.trim(), size: 20 } : { size: 10 };
            const [invData, prodRes] = await Promise.all([
                inventoryService.getByWarehouse(selectedWarehouse.id, params),
                productService.search({ ...params, isActive: true }),
            ]);
            const prodMap = new Map<string, ProductResponse>();
            prodRes.content.forEach(p => prodMap.set(p.id, p));

            const results: typeof searchResults = [];
            const seen = new Set<string>();

            invData.forEach((inv: any) => {
                const pid = inv.productId ?? inv.id;
                if (seen.has(pid)) return;
                seen.add(pid);
                const p = prodMap.get(pid);
                results.push({
                    productId: pid,
                    sku: inv.productSku ?? inv.sku ?? p?.sku ?? '',
                    barcode: p?.isbnBarcode ?? '',
                    name: inv.productName ?? p?.name ?? pid,
                    unit: inv.unit ?? p?.unit ?? '',
                    qty: inv.availableQuantity ?? inv.quantity ?? 0,
                });
            });

            prodRes.content.forEach(p => {
                if (seen.has(p.id)) return;
                seen.add(p.id);
                results.push({
                    productId: p.id, sku: p.sku ?? '', barcode: p.isbnBarcode ?? '',
                    name: p.name, unit: p.unit ?? '', qty: 0,
                });
            });

            setSearchResults(results);
            setShowDropdown(results.length > 0);
        } catch { setSearchResults([]); }
        finally { setSearching(false); }
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val.trim()) { fetchProducts(); return; }
        debounceRef.current = setTimeout(() => fetchProducts(val), 350);
    };

    const handleFocus = () => {
        if (searchResults.length > 0) { setShowDropdown(true); return; }
        fetchProducts();
    };

    const addItem = (r: typeof searchResults[0]) => {
        if (items.some(it => it.productId === r.productId)) {
            setSnack('⚠️ Sản phẩm đã có trong danh sách kiểm');
            return;
        }
        setItems(prev => [...prev, {
            productId: r.productId, sku: r.sku, isbnBarcode: r.barcode,
            productName: r.name, unit: r.unit, systemQty: r.qty,
            actualQty: '', diff: 0, checked: false,
        }]);
        setSearch(''); setShowDropdown(false); setSearchResults([]);
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(it => it.productId !== productId));
    };

    const updateActual = (productId: string, val: string) => {
        setItems(prev => prev.map(it => {
            if (it.productId !== productId) return it;
            const actual = val === '' ? '' : Number(val);
            const diff = actual === '' ? 0 : (actual as number) - it.systemQty;
            if (actual !== '') {
                setRecentChecks(rc => {
                    const f = rc.filter(r => r.name !== it.productName);
                    return [{ name: it.productName, qty: actual as number }, ...f].slice(0, 10);
                });
            }
            return { ...it, actualQty: actual, diff, checked: actual !== '' };
        }));
    };

    const handleSave = async (retryItems?: StockCountItem[]) => {
        if (!selectedWarehouse) return;
        const itemsToAdjust = retryItems || items.filter(it => it.actualQty !== '' && it.diff !== 0);
        if (!itemsToAdjust.length) { setSnack('⚠️ Không có chênh lệch nào cần điều chỉnh'); return; }
        
        setSaving(true);
        setAdjustErrors([]);
        try {
            const code = `PKK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
            
            // Chunking to 500 items per request
            const chunks = [];
            for (let i = 0; i < itemsToAdjust.length; i += 500) {
                chunks.push(itemsToAdjust.slice(i, i + 500));
            }

            let totalSuccess = 0;
            let totalErrorsCount = 0;
            let allErrors: any[] = [];

            for (const chunk of chunks) {
                const payload = chunk.map(it => ({
                    productId: it.productId, 
                    warehouseId: selectedWarehouse.id,
                    actualQuantity: Number(it.actualQty),
                    reason: `[${code}] Kiểm kê: HT ${it.systemQty}, TT ${it.actualQty} (lệch ${it.diff > 0 ? '+' : ''}${it.diff})${note ? `. ${note}` : ''}`,
                }));

                try {
                    const res = await inventoryService.adjustBulk(payload);
                    totalSuccess += res.successCount || 0;
                    totalErrorsCount += res.errorCount || 0;
                    if (res.errors && res.errors.length > 0) {
                        // Map index back to original item index or just store the reason + retriable
                        allErrors = [...allErrors, ...res.errors.map((err: any) => ({
                            ...err,
                            item: chunk[err.line - 1] // line in backend is 1-indexed based on the payload chunk
                        }))];
                    }
                } catch (e: any) {
                    throw e; // Fail entirely if network error or 500
                }
            }

            if (totalErrorsCount > 0) {
                setAdjustErrors(allErrors);
                setSnack(`⚠️ Thành công ${totalSuccess}, thất bại ${totalErrorsCount} sản phẩm.`);
            } else {
                setSnack(`✅ Hoàn thành! ${totalSuccess} sản phẩm đã điều chỉnh`);
                setFilterTab(2);
                const receipt: SavedReceipt = {
                    code,
                    time: new Date().toLocaleString('vi-VN'),
                    items: itemsToAdjust, // Ideally only successful ones, but let's keep it simple
                    warehouseName: selectedWarehouse.name,
                };
                setDetailReceipt(receipt);


            }
        } catch (e: any) {
            setSnack(`❌ ${e.response?.data?.message ?? 'Lưu thất bại'}`);
        } finally { setSaving(false); }
    };

    const handleRetry = () => {
        const retriableItems = adjustErrors.filter(e => e.retriable).map(e => e.item);
        if (retriableItems.length > 0) {
            handleSave(retriableItems);
        }
    };

    const handleExport = () => {
        const data = filtered.map(it => ({
            SKU: it.sku, 'Tên sản phẩm': it.productName, ĐVT: it.unit,
            'Tồn kho': it.systemQty, 'Thực tế': it.actualQty === '' ? '' : it.actualQty,
            'SL lệch': it.actualQty === '' ? '' : it.diff,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kiểm kê');
        XLSX.writeFile(wb, `kiem-ke-${selectedWarehouse?.name ?? ''}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const goBack = () => {
        if (onClose) { onClose(); return; }
        setSelectedWarehouse(null); setItems([]); setSearch(''); setFilterTab(0); setNote(''); setRecentChecks([]);
    };

    const filtered = items.filter(it => {
        if (filterTab === 1) return it.checked && it.diff === 0;
        if (filterTab === 2) return it.checked && it.diff !== 0;
        if (filterTab === 3) return !it.checked;
        return true;
    });

    const checkedCount = items.filter(it => it.checked).length;
    const matchCount = items.filter(it => it.checked && it.diff === 0).length;
    const diffCount = items.filter(it => it.diff !== 0 && it.checked).length;
    const uncheckedCount = items.filter(it => !it.checked).length;
    const totalActual = items.filter(it => it.checked).reduce((s, it) => s + Number(it.actualQty), 0);
    const now = new Date();
    const fmtNow = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // ── STEP 1: Chọn kho ─────────────────────────────────────
    if (!selectedWarehouse) {
        return (
            <Dialog open={true} onClose={() => { if (onClose) onClose(); }} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800}>Chọn kho kiểm kê</Typography>
                    <IconButton onClick={() => { if (onClose) onClose(); }} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2.5}>Chọn chi nhánh để bắt đầu kiểm kê tồn kho thực tế</Typography>
                    {activeWarehouses.length === 0 ? (
                        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px dashed #e5e7eb' }}>
                            <Inventory2 sx={{ fontSize: 56, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                            <Typography color="#9ca3af" fontSize={13}>Không có chi nhánh nào đang hoạt động</Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {activeWarehouses.map(wh => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={wh.id}>
                                    <Paper elevation={0} onClick={() => { setSelectedWarehouse(wh); setItems([]); }}
                                        sx={{
                                            p: 2.5, borderRadius: 2, cursor: 'pointer', border: '1.5px solid #e5e7eb', bgcolor: '#fff', transition: 'all 0.15s',
                                            '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff', boxShadow: '0 4px 16px rgba(37,99,235,0.12)', transform: 'translateY(-2px)' }
                                        }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                            <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 1.5 }}><Inventory2 sx={{ fontSize: 22, color: '#2563eb' }} /></Box>
                                            <Chip label="Hoạt động" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#dcfce7', color: '#16a34a' }} />
                                        </Box>
                                        <Typography fontWeight={800} color="#1a1a2e" fontSize={15}>{wh.name}</Typography>
                                        {wh.address && <Typography variant="caption" color="#6b7280" display="block" mt={0.5} noWrap>📍 {wh.address}</Typography>}
                                        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                                            <Typography variant="caption" color="#2563eb" fontWeight={700}>Bắt đầu kiểm kê →</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                    <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                        {snack ? <Alert severity="error" sx={{ borderRadius: 2 }}>{snack}</Alert> : <div />}
                    </Snackbar>
                </DialogContent>
            </Dialog>
        );
    }

    // ── STEP 2: Dialog kiểm kê ───────────────────────────────
    return (
        <>
            <Dialog open={!!selectedWarehouse} onClose={goBack} maxWidth="lg" fullWidth
                PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh', height: '92vh' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 3, borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Inventory2 sx={{ fontSize: 22, color: '#2563eb' }} />
                        <Typography fontWeight={900} fontSize={16}>Kiểm kho</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} ref={searchRef}>
                        <Box sx={{ position: 'relative', width: 340 }}>
                            <TextField size="small" placeholder="Tìm theo mã hàng, barcode, tên để thêm..."
                                value={search} onChange={e => handleSearch(e.target.value)}
                                onFocus={handleFocus}
                                sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>,
                                    endAdornment: searching ? <CircularProgress size={16} /> : null,
                                }} />
                            {showDropdown && (
                                <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, maxHeight: 300, overflow: 'auto', mt: 0.5, borderRadius: 2, border: '1px solid #e5e7eb' }}>
                                    <List dense disablePadding>
                                        {searchResults.map(r => (
                                            <ListItemButton key={r.productId} onClick={() => addItem(r)}
                                                disabled={items.some(it => it.productId === r.productId)}
                                                sx={{ py: 1, '&:hover': { bgcolor: '#eff6ff' } }}>
                                                <ListItemText
                                                    primary={<Typography fontSize={12} fontWeight={600} noWrap>{r.name}</Typography>}
                                                    secondary={<Typography fontSize={10} color="#6b7280" fontFamily="monospace">
                                                        {r.sku}{r.barcode ? ` · ${r.barcode}` : ''} · Tồn: {r.qty} {r.unit}
                                                    </Typography>} />
                                                {items.some(it => it.productId === r.productId) && (
                                                    <Chip label="Đã thêm" size="small" sx={{ height: 18, fontSize: 9, bgcolor: '#dcfce7', color: '#16a34a' }} />
                                                )}
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Paper>
                            )}
                        </Box>
                        <IconButton size="small" onClick={goBack}><Close /></IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
                    {/* LEFT: Table */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Box sx={{ px: 2, borderBottom: '1px solid #f1f5f9' }}>
                            <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)} sx={{
                                minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none', fontSize: 12, fontWeight: 700 },
                                '& .Mui-selected': { color: '#2563eb' }, '& .MuiTabs-indicator': { bgcolor: '#2563eb' },
                            }}>
                                <Tab label={`Tất cả (${items.length})`} />
                                <Tab label={`Khớp (${matchCount})`} />
                                <Tab label={`Lệch (${diffCount})`} />
                                <Tab label={`Chưa kiểm (${uncheckedCount})`} />
                            </Tabs>
                        </Box>
                        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {['', 'STT', 'MÃ HÀNG', 'TÊN HÀNG', 'ĐVT', 'TỒN KHO', 'THỰC TẾ', 'SL LỆCH', 'GIÁ TRỊ LỆCH'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 10, color: '#6b7280', py: 1.25, bgcolor: '#f9fafb' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                                <Search sx={{ fontSize: 48, color: '#e5e7eb', mb: 1 }} />
                                                <Typography color="#9ca3af" fontSize={13}>Tìm kiếm sản phẩm để thêm vào danh sách kiểm kê</Typography>
                                                <Typography color="#c4c9d4" fontSize={11} mt={0.5}>Nhập tên, SKU hoặc quét mã vạch ở thanh tìm kiếm phía trên</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : filtered.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><Typography color="#9ca3af" fontSize={13}>Không có mục nào phù hợp bộ lọc</Typography></TableCell></TableRow>
                                    ) : filtered.map((item, idx) => {
                                        const hasActual = item.actualQty !== '';
                                        const rowBg = !hasActual ? '#fff' : item.diff === 0 ? '#f0fdf4' : '#fef3c7';
                                        return (
                                            <TableRow key={item.productId} sx={{ bgcolor: rowBg }}>
                                                <TableCell sx={{ py: 0.75, width: 40 }}>
                                                    <IconButton size="small" onClick={() => removeItem(item.productId)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                                                        <DeleteOutline sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.75, color: '#6b7280', fontSize: 12 }}>{idx + 1}</TableCell>
                                                <TableCell sx={{ py: 0.75 }}>
                                                    <Typography variant="caption" fontFamily="monospace" color="#2563eb" fontWeight={700} fontSize={11}>{item.sku || '—'}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.75 }}>
                                                    <Typography fontSize={12} fontWeight={600} noWrap sx={{ maxWidth: 280 }}>{item.productName}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 0.75 }}><Typography variant="caption" color="#6b7280">{item.unit || '—'}</Typography></TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}><Typography fontSize={12} fontWeight={700}>{item.systemQty}</Typography></TableCell>
                                                <TableCell align="center" sx={{ py: 0.75, minWidth: 90 }}>
                                                    <TextField size="small" type="number" placeholder="Nhập..."
                                                        value={item.actualQty} onChange={e => updateActual(item.productId, e.target.value)}
                                                        sx={{
                                                            width: 80, '& .MuiOutlinedInput-root': {
                                                                fontSize: 12, bgcolor: '#fff', borderRadius: 1.5,
                                                                '& fieldset': { borderColor: hasActual ? (item.diff === 0 ? '#16a34a' : '#f59e0b') : '#e5e7eb' }
                                                            },
                                                            '& .MuiInputBase-input': { textAlign: 'center', py: 0.75 }
                                                        }} />
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}>
                                                    {hasActual ? (
                                                        <Typography fontSize={12} fontWeight={800} color={item.diff === 0 ? '#16a34a' : item.diff > 0 ? '#2563eb' : '#d97706'}>
                                                            {item.diff > 0 ? '+' : ''}{item.diff}
                                                        </Typography>
                                                    ) : <Typography variant="caption" color="#c4c9d4">0</Typography>}
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.75 }}><Typography variant="caption" color="#6b7280">0</Typography></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* RIGHT SIDEBAR */}
                    <Box sx={{ width: 260, minWidth: 260, borderLeft: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
                        <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="#374151">{selectedWarehouse.name}</Typography>
                                <Typography variant="caption" color="#9ca3af">{fmtNow}</Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={700} color="#6b7280" display="block" mb={0.5}>Mã kiểm kho</Typography>
                            <TextField fullWidth size="small" placeholder="Mã phiếu tự động" disabled sx={{ mb: 2, '& .MuiOutlinedInput-root': { fontSize: 12, bgcolor: '#f9fafb' } }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="#6b7280">Trạng thái</Typography>
                                <Chip label="Phiếu tạm" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#fef3c7', color: '#d97706' }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="#6b7280">Tổng SL thực tế</Typography>
                                <Typography variant="body2" fontWeight={900} color="#1e293b">{totalActual}</Typography>
                            </Box>
                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="caption" fontWeight={700} color="#6b7280" display="block" mb={0.75}>Ghi chú</Typography>
                            <TextField fullWidth size="small" multiline rows={3} placeholder="Ghi chú kiểm kê..."
                                value={note} onChange={e => setNote(e.target.value)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { fontSize: 12 } }} />
                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="caption" fontWeight={700} color="#6b7280" display="block" mb={1}>Kiểm gần đây</Typography>
                            {recentChecks.length === 0 ? (
                                <Typography variant="caption" color="#c4c9d4">Chưa có mục nào</Typography>
                            ) : recentChecks.map((rc, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                    <CheckCircle sx={{ fontSize: 14, color: '#16a34a' }} />
                                    <Typography variant="caption" color="#374151" noWrap sx={{ flex: 1, fontSize: 11 }}>{rc.name}</Typography>
                                    <Typography variant="caption" color="#6b7280" fontWeight={700} fontSize={10}>({rc.qty})</Typography>
                                </Box>
                            ))}
                            
                            {adjustErrors.length > 0 && (
                                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fca5a5' }}>
                                    <Typography variant="caption" fontWeight={800} color="#dc2626" display="block" mb={1}>
                                        ⚠️ Lỗi kiểm kê ({adjustErrors.length})
                                    </Typography>
                                    <List dense disablePadding sx={{ maxHeight: 150, overflow: 'auto' }}>
                                        {adjustErrors.map((err, i) => (
                                            <ListItemText 
                                                key={i}
                                                primary={<Typography fontSize={11} fontWeight={600} noWrap>{err.item?.productName || `Dòng ${err.line}`}</Typography>}
                                                secondary={<Typography fontSize={10} color="#b91c1c">{err.reason}</Typography>}
                                                sx={{ m: 0, mb: 1 }}
                                            />
                                        ))}
                                    </List>
                                    {adjustErrors.some(e => e.retriable) && (
                                        <Button size="small" variant="contained" fullWidth onClick={handleRetry}
                                            sx={{ mt: 1, textTransform: 'none', bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontSize: 11, borderRadius: 1.5 }}>
                                            Thử lại dòng lỗi
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #f1f5f9', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => setSnack('✅ Phiếu kiểm kê đã lưu tạm')}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, borderColor: '#e0e0e0', color: '#555', borderRadius: 2, height: 36 }}>Lưu tạm</Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 14 }} />} onClick={handleExport}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, borderColor: '#16a34a', color: '#16a34a', borderRadius: 2, height: 36, '&:hover': { bgcolor: '#f0fdf4' } }}>Excel</Button>
                    <Button variant="contained" startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Save />}
                        onClick={() => handleSave()} disabled={saving || diffCount === 0}
                        sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontSize: 12, borderRadius: 2, height: 36, px: 3 }}>
                        {saving ? 'Đang lưu...' : 'Hoàn thành'}
                    </Button>
                    <Button size="small" variant="outlined" onClick={goBack}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, borderColor: '#e0e0e0', color: '#555', borderRadius: 2, height: 36 }}>Hủy</Button>
                </DialogActions>

                <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    {snack ? <Alert severity={snack.startsWith('✅') ? 'success' : snack.startsWith('⚠️') ? 'warning' : 'error'} sx={{ borderRadius: 2 }}>{snack}</Alert> : <div />}
                </Snackbar>
            </Dialog>

            {/* Chi tiết phiếu kiểm kho */}
            <Dialog open={!!detailReceipt} onClose={() => setDetailReceipt(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2, px: 3 }}>
                    <Box>
                        <Typography fontWeight={900} fontSize={16}>Chi tiết {detailReceipt?.code}</Typography>
                        <Typography variant="caption" color="#6b7280">
                            Thời gian: {detailReceipt?.time}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="#6b7280">Người tạo: <strong>Quản trị viên hệ thống</strong></Typography>
                        <br />
                        <Typography variant="caption" color="#6b7280">Kho: <strong>{detailReceipt?.warehouseName}</strong></Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 0 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Sản phẩm', 'SKU', 'Tồn PM', 'Thực tế', 'Lệch'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#6b7280', py: 1.25 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detailReceipt?.items.map(it => (
                                    <TableRow key={it.productId}>
                                        <TableCell sx={{ py: 1 }}>
                                            <Typography fontSize={12} fontWeight={600} noWrap sx={{ maxWidth: 300 }}>{it.productName}</Typography>
                                        </TableCell>
                                        <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={700}>{it.sku}</Typography></TableCell>
                                        <TableCell><Typography fontSize={12}>{it.systemQty}</Typography></TableCell>
                                        <TableCell><Typography fontSize={12} fontWeight={700}>{String(it.actualQty)}</Typography></TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={800}
                                                color={it.diff > 0 ? '#16a34a' : it.diff < 0 ? '#ef4444' : '#6b7280'}>
                                                {it.diff > 0 ? '+' : ''}{it.diff}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button size="small" variant="outlined"
                        onClick={() => {
                            if (!detailReceipt) return;
                            const text = `${detailReceipt.code}\n${detailReceipt.time}\n\n` +
                                detailReceipt.items.map(it => `${it.productName} | ${it.sku} | Tồn: ${it.systemQty} | TT: ${it.actualQty} | Lệch: ${it.diff}`).join('\n');
                            navigator.clipboard.writeText(text);
                            setSnack('✅ Đã sao chép phiếu');
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, borderRadius: 2 }}>
                        Sao chép phiếu
                    </Button>
                    <Button variant="contained" onClick={() => setDetailReceipt(null)}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, borderRadius: 2, bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' } }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default StockCountTab;