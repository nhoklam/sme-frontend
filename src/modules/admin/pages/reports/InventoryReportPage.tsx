// src/modules/admin/pages/reports/InventoryReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button,
    Select, MenuItem, FormControl, InputLabel, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Stack, TextField, Chip,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Warning, Inventory2 } from '@mui/icons-material';
import reportService from '../../../../services/reportService';
import warehouseService from '../../../../services/warehouseService';
import type { DeadStockItem, InventoryValueReport } from '../../../../types/index';
import type { Warehouse } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';

const InventoryReportPage: React.FC = () => {
    const [warehouseId, setWarehouseId] = useState('');
    const [deadDays, setDeadDays] = useState(90);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [deadStock, setDeadStock] = useState<DeadStockItem[]>([]);
    const [invValue, setInvValue] = useState<InventoryValueReport[]>([]);

    const [loadingDead, setLoadingDead] = useState(false);
    const [loadingValue, setLoadingValue] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    const fetchDeadStock = useCallback(async () => {
        setLoadingDead(true);
        try {
            const data = await reportService.getDeadStock(deadDays, warehouseId || undefined);
            setDeadStock(data);
        } catch {
            setError('Không thể tải hàng chậm luân chuyển');
        } finally {
            setLoadingDead(false);
        }
    }, [deadDays, warehouseId]);

    const fetchInventoryValue = useCallback(async () => {
        setLoadingValue(true);
        try {
            const data = await reportService.getInventoryValue(warehouseId || undefined);
            setInvValue(data);
        } catch {
            // silent
        } finally {
            setLoadingValue(false);
        }
    }, [warehouseId]);

    useEffect(() => {
        fetchDeadStock();
        fetchInventoryValue();
    }, [fetchDeadStock, fetchInventoryValue]);

    const totalValue = invValue.reduce((s, d) => s + (d.total_value ?? 0), 0);
    const totalQty = invValue.reduce((s, d) => s + (d.total_qty ?? 0), 0);

    const chartData = invValue.map(d => ({
        name: d.warehouse_name,
        'Giá trị (M)': Math.round((d.total_value ?? 0) / 1_000_000),
        SKU: d.sku_count,
    }));

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Báo cáo Tồn kho</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Giá trị tồn kho và hàng chậm luân chuyển
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Chi nhánh</InputLabel>
                        <Select value={warehouseId} label="Chi nhánh" onChange={e => setWarehouseId(e.target.value)}>
                            <MenuItem value="">Tất cả</MenuItem>
                            {warehouses.map(w => (
                                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Summary — use size prop (MUI v6) instead of item xs sm */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Tổng giá trị tồn kho</Typography>
                            {loadingValue
                                ? <Skeleton height={36} />
                                : <Typography variant="h6" fontWeight={700} color="primary">{formatCurrency(totalValue)}</Typography>
                            }
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Tổng số lượng tồn</Typography>
                            {loadingValue
                                ? <Skeleton height={36} />
                                : <Typography variant="h6" fontWeight={700}>{totalQty.toLocaleString('vi-VN')}</Typography>
                            }
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Hàng chậm luân chuyển</Typography>
                            {loadingDead
                                ? <Skeleton height={36} />
                                : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h6" fontWeight={700} color="warning.main">{deadStock.length}</Typography>
                                        {deadStock.length > 0 && <Warning color="warning" />}
                                    </Box>
                                )
                            }
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Inventory value chart */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                Giá trị tồn kho theo chi nhánh
                            </Typography>
                            {loadingValue ? (
                                <Skeleton variant="rectangular" height={260} />
                            ) : chartData.length === 0 ? (
                                <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                                    Không có dữ liệu
                                </Typography>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v: number) => [`${v.toLocaleString('vi-VN')}M`, 'Giá trị']} />
                                        <Bar dataKey="Giá trị (M)" fill="#1976d2" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}

                            {/* Detail table */}
                            {!loadingValue && invValue.length > 0 && (
                                <TableContainer sx={{ mt: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Chi nhánh</TableCell>
                                                <TableCell align="right">SKU</TableCell>
                                                <TableCell align="right">Tổng SL</TableCell>
                                                <TableCell align="right">Giá trị</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invValue.map((iv, i) => (
                                                <TableRow key={i} hover>
                                                    <TableCell>{iv.warehouse_name}</TableCell>
                                                    <TableCell align="right">{iv.sku_count}</TableCell>
                                                    <TableCell align="right">{iv.total_qty?.toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(iv.total_value)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Dead stock */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Hàng chậm luân chuyển
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField size="small" label="Số ngày" type="number" value={deadDays}
                                        onChange={e => setDeadDays(Number(e.target.value))}
                                        sx={{ width: 80 }} inputProps={{ min: 7, max: 365 }} />
                                    <Button size="small" variant="outlined" onClick={fetchDeadStock}>Áp dụng</Button>
                                </Box>
                            </Box>

                            {loadingDead ? (
                                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} sx={{ mb: 0.5 }} />)
                            ) : deadStock.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: 'center' }}>
                                    <Inventory2 sx={{ fontSize: 48, color: 'success.light' }} />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                                        Không có hàng chậm luân chuyển
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{ maxHeight: 380, overflow: 'auto' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Sản phẩm</TableCell>
                                                <TableCell>Barcode</TableCell>
                                                <TableCell align="right">Tồn kho</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {deadStock.map((d) => (
                                                <TableRow key={d.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                                                            {d.product_name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {d.isbn_barcode}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip label={d.quantity} size="small"
                                                            color={d.quantity > 50 ? 'warning' : 'default'} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InventoryReportPage;