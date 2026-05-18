import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, IconButton, Chip, Select,
    MenuItem, FormControl, InputAdornment, CircularProgress, Pagination
} from '@mui/material';
import { Search, Refresh, Add, Edit, Delete } from '@mui/icons-material';
import { auditLogService, AuditLog } from '../../../../../services/auditLogService';

export default function AuditLogsTab() {
    const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 15;

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await auditLogService.getLogs({ size: 200 });
            const data = res.data?.data;
            const logs: AuditLog[] = (Array.isArray(data) ? data : []).map((item: any) => ({
                entityName: item.entityName || '',
                entityId: item.entityId || '',
                action: item.actionType || item.action || '',
                performedBy: item.changedBy || item.performedBy || 'SYSTEM',
                performedAt: item.changedAt || item.performedAt || '',
                revision: item.revision,
            }));
            setAllLogs(logs);
        } catch {
            setAllLogs([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const filtered = allLogs.filter(log => {
        if (actionFilter && log.action !== actionFilter) return false;
        if (keyword) {
            const kw = keyword.toLowerCase();
            return log.performedBy.toLowerCase().includes(kw) || log.entityName.toLowerCase().includes(kw) || log.entityId.toLowerCase().includes(kw);
        }
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const getActionStyle = (action: string) => {
        switch (action) {
            case 'CREATE': return { bg: '#dcfce7', color: '#16a34a', label: 'Thêm mới', icon: <Add sx={{ fontSize: 14 }} /> };
            case 'UPDATE': return { bg: '#fef3c7', color: '#d97706', label: 'Cập nhật', icon: <Edit sx={{ fontSize: 14 }} /> };
            case 'DELETE': return { bg: '#fee2e2', color: '#dc2626', label: 'Xóa', icon: <Delete sx={{ fontSize: 14 }} /> };
            default: return { bg: '#f3f4f6', color: '#4b5563', label: action, icon: null };
        }
    };

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={700} fontSize={16} color="#1e293b">Ghi nhận thay đổi (Audit Trail)</Typography>
                    <Typography fontSize={12} color="#64748b">Giám sát các tác vụ thay đổi dữ liệu gần nhất</Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <TextField size="small" placeholder="Tìm user, đối tượng..."
                    value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
                    sx={{ minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }} displayEmpty>
                        <MenuItem value="">Tất cả thao tác</MenuItem>
                        <MenuItem value="CREATE">Thêm mới</MenuItem>
                        <MenuItem value="UPDATE">Cập nhật</MenuItem>
                        <MenuItem value="DELETE">Xóa</MenuItem>
                    </Select>
                </FormControl>
                <IconButton onClick={loadData} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}><Refresh /></IconButton>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>THỜI GIAN</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>NGƯỜI THỰC HIỆN</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>HÀNH ĐỘNG</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>BẢNG DỮ LIỆU</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="center">ID TARGET</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }} align="right">PHIÊN BẢN</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={32} /></TableCell></TableRow>
                            ) : paged.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, color: '#94a3b8' }}>Không tìm thấy nhật ký nào</TableCell></TableRow>
                            ) : paged.map((log, idx) => {
                                const as = getActionStyle(log.action);
                                return (
                                    <TableRow key={`${log.entityId}-${log.revision}-${idx}`} hover>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={500} color="#475569">
                                                {log.performedAt ? new Date(log.performedAt).toLocaleString('vi-VN') : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1d4ed8', fontSize: 11 }}>
                                                    {log.performedBy.charAt(0).toUpperCase()}
                                                </Box>
                                                <Typography fontSize={13} fontWeight={700} color="#1e293b">{log.performedBy}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip icon={as.icon || undefined} label={as.label} size="small"
                                                sx={{ bgcolor: as.bg, color: as.color, fontWeight: 700, fontSize: 10, height: 22 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={600} color="#475569">{log.entityName}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography fontSize={10} fontFamily="monospace" fontWeight={700} color="#64748b"
                                                sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.25, borderRadius: 0.75, display: 'inline-block' }}>
                                                {log.entityId?.toString().slice(0, 8)}...
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontSize={12} fontFamily="monospace" color="#94a3b8" fontWeight={800}>
                                                v{log.revision}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (
                    <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                        <Typography variant="caption" color="#64748b">
                            Hiển thị <strong>{paged.length}</strong> / <strong>{filtered.length}</strong> kết quả
                        </Typography>
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} color="primary" shape="rounded" />
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
