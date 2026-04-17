// src/modules/admin/pages/reports/components/ReportTabs.jsx
import React from 'react';
import {
    Box, Tabs, Tab, Paper, Typography,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    LinearProgress,
} from '@mui/material';
import RevenueChart from './RevenueChart';
import TopCustomersChart from './TopCustomersChart';
import CashflowTable from './CashflowTable';
import { REVENUE_BY_CATEGORY, TOP_CUSTOMERS, REPORT_SUMMARY } from '../_reportMockData';

const fmt = (n) => n.toLocaleString('vi-VN') + ' đ';

// ── Tab: Tổng quan ─────────────────────────────────────────────
const TabTongQuan = () => (
    <Box>
        {/* Biểu đồ hàng đầu */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <RevenueChart />
            <Box sx={{ width: 420, flexShrink: 0 }}>
                <TopCustomersChart />
            </Box>
        </Box>
        {/* Thu Chi + Quyết toán */}
        <CashflowTable />
    </Box>
);

// ── Tab: Doanh thu ─────────────────────────────────────────────
const TabDoanhThu = () => (
    <Box>
        <Box sx={{ mb: 2 }}>
            <RevenueChart />
        </Box>
        {/* Doanh thu theo danh mục */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#1a1a2e">Doanh thu theo danh mục</Typography>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                            {['Danh mục', 'Doanh thu', 'Tỷ lệ', ''].map(col => (
                                <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 0.3, py: 1.5 }}>{col.toUpperCase()}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {REVENUE_BY_CATEGORY.map((row, idx) => (
                            <TableRow key={idx} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{row.category}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={700} color="#1976d2">{fmt(row.revenue)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600} color="#555">{row.percent}%</Typography>
                                </TableCell>
                                <TableCell sx={{ width: 180 }}>
                                    <LinearProgress variant="determinate" value={row.percent}
                                        sx={{ height: 6, borderRadius: 3, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { bgcolor: '#1976d2', borderRadius: 3 } }} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    </Box>
);

// ── Tab: Thu Chi ───────────────────────────────────────────────
const TabThuChi = () => <CashflowTable />;

// ── Tab: Khách hàng ────────────────────────────────────────────
const TabKhachHang = () => (
    <Box>
        <Box sx={{ mb: 2 }}>
            <TopCustomersChart />
        </Box>
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#1a1a2e">Top 10 khách hàng theo doanh thu</Typography>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                            {['#', 'Khách hàng', 'Doanh thu', 'Tỷ lệ'].map(col => (
                                <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 0.3, py: 1.5 }}>{col}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {TOP_CUSTOMERS.map((row, idx) => {
                            const max = TOP_CUSTOMERS[0].revenue;
                            return (
                                <TableRow key={idx} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <TableCell sx={{ width: 36, color: '#bbb', fontWeight: 700 }}>{idx + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{row.name}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700} color="#1976d2">{fmt(row.revenue)}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: 160 }}>
                                        <LinearProgress variant="determinate" value={(row.revenue / max) * 100}
                                            sx={{ height: 6, borderRadius: 3, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { bgcolor: '#1976d2', borderRadius: 3 } }} />
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

// ── Tab: Chi phí ───────────────────────────────────────────────
const TabChiPhi = () => (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Typography fontSize={36}>📊</Typography>
        <Typography variant="h6" fontWeight={700} color="#555" mt={1}>Báo cáo chi phí</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>Tính năng đang phát triển</Typography>
    </Paper>
);

// ── Main ReportTabs ────────────────────────────────────────────
const TABS = [
    { label: 'Tổng quan', component: <TabTongQuan /> },
    { label: 'Doanh thu', component: <TabDoanhThu /> },
    { label: 'Thu Chi', component: <TabThuChi /> },
    { label: 'Khách hàng', component: <TabKhachHang /> },
    { label: 'Chi phí', component: <TabChiPhi /> },
];

const ReportTabs = () => {
    const [tab, setTab] = React.useState(0);
    return (
        <Box>
            <Box sx={{ borderBottom: '1px solid #eee', mb: 2.5 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 0, px: 2, color: '#888' },
                        '& .Mui-selected': { color: '#fff !important', fontWeight: 700 },
                        '& .MuiTabs-indicator': { display: 'none' },
                    }}>
                    {TABS.map((t, i) => (
                        <Tab key={t.label} label={t.label}
                            sx={{
                                borderRadius: 1.5,
                                mr: 0.5,
                                bgcolor: tab === i ? '#1976d2' : 'transparent',
                                color: tab === i ? '#fff !important' : '#555',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: tab === i ? '#1565c0' : '#f5f5f5' },
                            }}
                        />
                    ))}
                </Tabs>
            </Box>
            {TABS[tab].component}
        </Box>
    );
};

export default ReportTabs;