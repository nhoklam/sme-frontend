import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    Pagination, CircularProgress, TextField, MenuItem,
    FormControl, Select, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import { Assignment, Search, Refresh, Info } from '@mui/icons-material';
import { auditLogService, AuditLog } from '../../../../services/auditLogService';

const AuditLogsPage: React.FC = () => {
    const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await auditLogService.getLogs({ size: 200 });
            const data = res.data?.data;
            // Backend trả về List<AuditLogResponse> (không phải PageResponse)
            const logs: AuditLog[] = (Array.isArray(data) ? data : []).map((item: any) => ({
                entityName: item.entityName || '',
                entityId: item.entityId || '',
                action: item.actionType || item.action || '',
                performedBy: item.changedBy || item.performedBy || 'SYSTEM',
                performedAt: item.changedAt || item.performedAt || '',
                revision: item.revision,
            }));
            setAllLogs(logs);
        } catch (error) {
            console.error('Lỗi khi tải audit logs:', error);
            setAllLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Client-side filtering
    const filtered = allLogs.filter(log => {
        if (actionFilter && log.action !== actionFilter) return false;
        if (entityFilter && !log.entityName.toLowerCase().includes(entityFilter.toLowerCase())) return false;
        if (keyword) {
            const kw = keyword.toLowerCase();
            return (
                log.performedBy.toLowerCase().includes(kw) ||
                log.entityName.toLowerCase().includes(kw) ||
                log.entityId.toLowerCase().includes(kw)
            );
        }
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setPage(0);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return { color: '#16a34a', bg: '#dcfce7' };
            case 'UPDATE': return { color: '#d97706', bg: '#fef3c7' };
            case 'DELETE': return { color: '#dc2626', bg: '#fee2e2' };
            default: return { color: '#4b5563', bg: '#f3f4f6' };
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return 'Thêm mới';
            case 'UPDATE': return 'Cập nhật';
            case 'DELETE': return 'Xóa';
            default: return action;
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Assignment sx={{ color: '#475569' }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="#1e293b">Nhật ký hệ thống (Audit Logs)</Typography>
                    <Typography variant="caption" color="#64748b">Theo dõi lịch sử thay đổi dữ liệu trong hệ thống</Typography>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Tìm kiếm user, đối tượng..."
                    value={keyword}
                    onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                    onKeyDown={handleSearch}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment>,
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                        displayEmpty
                    >
                        <MenuItem value="">Tất cả thao tác</MenuItem>
                        <MenuItem value="CREATE">Thêm mới (CREATE)</MenuItem>
                        <MenuItem value="UPDATE">Cập nhật (UPDATE)</MenuItem>
                        <MenuItem value="DELETE">Xóa (DELETE)</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                        value={entityFilter}
                        onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
                        displayEmpty
                    >
                        <MenuItem value="">Tất cả đối tượng</MenuItem>
                        <MenuItem value="Sản phẩm">Sản phẩm</MenuItem>
                        <MenuItem value="Đơn hàng">Đơn hàng</MenuItem>
                        <MenuItem value="Người dùng">Người dùng</MenuItem>
                        <MenuItem value="Chi nhánh">Chi nhánh</MenuItem>
                    </Select>
                </FormControl>
                <IconButton onClick={() => loadData()} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                    <Refresh />
                </IconButton>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Thời gian</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Người thực hiện</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Thao tác</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Đối tượng</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ID Đối tượng</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Revision</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : paged.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <Typography color="#64748b">Không tìm thấy nhật ký nào</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paged.map((log, idx) => {
                                    const actionColor = getActionColor(log.action);
                                    return (
                                        <TableRow key={`${log.entityId}-${log.revision}-${idx}`} hover>
                                            <TableCell>
                                                <Typography variant="body2" color="#1e293b" fontWeight={500}>
                                                    {log.performedAt ? new Date(log.performedAt).toLocaleString('vi-VN') : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color="#3b82f6">{log.performedBy}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getActionLabel(log.action)}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: actionColor.bg,
                                                        color: actionColor.color,
                                                        fontWeight: 700,
                                                        fontSize: 11,
                                                        height: 22
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="#475569" fontWeight={500}>{log.entityName}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontFamily="monospace" color="#64748b" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1 }}>
                                                    {log.entityId?.toString().slice(0, 8)}...
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={`Rev ${log.revision}`} size="small"
                                                    sx={{ height: 20, fontSize: 10, bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (
                    <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                        <Typography variant="caption" color="#64748b">
                            Hiển thị <strong>{paged.length}</strong> / <strong>{filtered.length}</strong> kết quả
                        </Typography>
                        <Pagination
                            count={totalPages}
                            page={page + 1}
                            onChange={(e, v) => setPage(v - 1)}
                            color="primary"
                            shape="rounded"
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default AuditLogsPage;
