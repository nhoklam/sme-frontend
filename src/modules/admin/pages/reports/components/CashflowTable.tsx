// src/modules/admin/pages/reports/components/CashflowTable.jsx
import React from 'react';
import {
    Box, Paper, Typography, Table, TableBody,
    TableCell, TableHead, TableRow, TableContainer, Chip, Divider,
} from '@mui/material';
import { CASHFLOW_ROWS, SETTLEMENT } from '../_reportMockData';

const fmt = (n) => n === 0 ? '0 đ' : n.toLocaleString('vi-VN') + ' đ';

// ── Bảng Thu - Chi ─────────────────────────────────────────────
const CashflowList = () => (
    <Paper elevation={0} sx={{ p: 0, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff', flex: 1, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
            <Typography variant="subtitle2" fontWeight={700} color="#1a1a2e">THU - CHI</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.3 }}>
                <Typography variant="caption" color="#1976d2" fontSize={11}>Thu từ công nợ</Typography>
                <Typography variant="caption" color="#aaa">|</Typography>
                <Typography variant="caption" color="#d32f2f" fontSize={11}>Chi từ đơn hàng</Typography>
            </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 340 }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 0.3, bgcolor: '#fafafa' }}>
                            KHÁCH HÀNG
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 0.3, bgcolor: '#fafafa' }}>
                            THU
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 0.3, bgcolor: '#fafafa' }}>
                            CHI
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {CASHFLOW_ROWS.map((row, idx) => (
                        <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: '#f9fbff' } }}>
                            <TableCell sx={{ py: 1.2, fontSize: 13, fontWeight: 500 }}>
                                {row.customer}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
                                    {row.thu > 0 && (
                                        <Typography variant="body2" fontWeight={700} color="#1976d2" fontSize={12}>
                                            Thu {fmt(row.thu)}
                                        </Typography>
                                    )}
                                    {row.thuNote === 'CK' && (
                                        <Chip label="CK" size="small"
                                            sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0', px: 0.25 }} />
                                    )}
                                    {row.thu === 0 && (
                                        <Typography variant="body2" color="#bbb" fontSize={12}>Thu 0 đ</Typography>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.2 }}>
                                {row.chi > 0 ? (
                                    <Typography variant="body2" fontWeight={700} color="#d32f2f" fontSize={12}>
                                        Chi {fmt(row.chi)}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="#bbb" fontSize={12}>Chi 0 đ</Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
);

// ── Quyết toán panel ───────────────────────────────────────────
const SettlementPanel = () => {
    const s = SETTLEMENT;
    return (
        <Paper elevation={0} sx={{ p: 0, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff', width: 380, flexShrink: 0, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                <Typography variant="subtitle2" fontWeight={800} color="#1a1a2e" letterSpacing={0.5}>QUYẾT TOÁN</Typography>
                <Typography variant="caption" color="text.secondary" fontSize={11}>
                    Tiền mặt = THU tiền mặt - Chi tiền mặt
                </Typography>
            </Box>

            <Box sx={{ p: 2.5 }}>
                {/* Tổng thu */}
                <Box sx={{ bgcolor: '#e8f5e9', borderRadius: 1.5, p: 1.5, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2" fontWeight={700} color="#1a1a2e">TỔNG THU:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#2e7d32">{fmt(s.totalThu)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                        <Typography variant="caption" color="#555">Thu Tiền mặt:</Typography>
                        <Typography variant="caption" fontWeight={600}>{fmt(s.thuTienMat)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="#555">Thu Chuyển khoản:</Typography>
                        <Typography variant="caption" fontWeight={600}>{fmt(s.thuChuyenKhoan)}</Typography>
                    </Box>
                </Box>

                {/* Tổng chi */}
                <Box sx={{ bgcolor: '#ffebee', borderRadius: 1.5, p: 1.5, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2" fontWeight={700} color="#1a1a2e">TỔNG CHI:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#d32f2f">{fmt(s.totalChi)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                        <Typography variant="caption" color="#555">Chi Tiền mặt:</Typography>
                        <Typography variant="caption" fontWeight={600}>{fmt(s.chiTienMat)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="#555">Chi Chuyển khoản:</Typography>
                        <Typography variant="caption" fontWeight={600}>{fmt(s.chiChuyenKhoan)}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Quyết toán tiền mặt */}
                <Box sx={{ bgcolor: '#e3f2fd', borderRadius: 1.5, p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700} color="#1a1a2e">QUYẾT TOÁN TIỀN MẶT:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#1976d2">+{fmt(s.quyetToanTienMat)}</Typography>
                    </Box>
                    <Typography variant="caption" color="#888" fontSize={10}>
                        = Thu tiền mặt ({fmt(s.thuTienMat)}) - Chi tiền mặt ({fmt(s.chiTienMat)})
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

// ── Export chính ───────────────────────────────────────────────
const CashflowTable = () => (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <CashflowList />
        <SettlementPanel />
    </Box>
);

export default CashflowTable;