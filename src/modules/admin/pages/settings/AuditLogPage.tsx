import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Skeleton, TextField, InputAdornment
} from '@mui/material';
import { Search, History, Create, Edit, DeleteForever, HelpOutline } from '@mui/icons-material';
import { auditLogApi } from '../../../../services/auditLogApi';
import { AuditLogResponse } from '../../../../types';
import toast from 'react-hot-toast';

const ACTION_CONFIG: Record<string, { label: string; color: string; bgcolor: string; icon: React.ReactNode }> = {
  CREATE: { label: 'Tạo mới', color: '#2e7d32', bgcolor: '#e8f5e9', icon: <Create sx={{ fontSize: 14 }} /> },
  UPDATE: { label: 'Cập nhật', color: '#1976d2', bgcolor: '#e3f2fd', icon: <Edit sx={{ fontSize: 14 }} /> },
  DELETE: { label: 'Xóa bỏ', color: '#d32f2f', bgcolor: '#ffebee', icon: <DeleteForever sx={{ fontSize: 14 }} /> },
  UNKNOWN: { label: 'Khác', color: '#888', bgcolor: '#f5f5f5', icon: <HelpOutline sx={{ fontSize: 14 }} /> },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditLogApi.getAll(200);
      setLogs(res.data || []);
    } catch { toast.error('Không thể tải nhật ký hệ thống'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = keyword
    ? logs.filter(l => l.entityName.toLowerCase().includes(keyword.toLowerCase()) || l.changedBy.toLowerCase().includes(keyword.toLowerCase()))
    : logs;

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>Nhật ký Hệ thống</Typography>
        <Typography variant="body2" color="text.secondary">Giám sát toàn bộ thao tác thay đổi dữ liệu của nhân viên trong hệ thống</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField size="small" placeholder="Tìm theo đối tượng hoặc người thực hiện..." value={keyword}
            onChange={e => setKeyword(e.target.value)}
            sx={{ width: 360, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#aaa' }} /></InputAdornment> } }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary">{filtered.length} BẢN GHI</Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#fafafa', fontSize: 11, fontWeight: 800, color: '#888', py: 2 } }}>
                <TableCell>THỜI GIAN</TableCell>
                <TableCell>NGƯỜI THỰC HIỆN</TableCell>
                <TableCell>HÀNH ĐỘNG</TableCell>
                <TableCell>ĐỐI TƯỢNG</TableCell>
                <TableCell>MÃ ĐỐI TƯỢNG</TableCell>
                <TableCell align="center">PHIÊN BẢN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}><TableCell colSpan={6} sx={{ p: 0 }}><Skeleton height={48} /></TableCell></TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <History sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                  <Typography color="text.secondary">Không có bản ghi nhật ký nào</Typography>
                </TableCell></TableRow>
              ) : filtered.map((log, idx) => {
                const config = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.UNKNOWN;
                return (
                  <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontSize={12} fontWeight={600}>
                        {new Date(log.changedAt).toLocaleString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#1a1a2e">{log.changedBy || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={config.label} size="small" icon={config.icon as any}
                        sx={{ fontWeight: 800, fontSize: 10, bgcolor: config.bgcolor, color: config.color, '& .MuiChip-icon': { color: config.color } }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="#555">{log.entityName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {log.entityId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`v${log.revision}`} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 10, height: 20 }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
