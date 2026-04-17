// src/modules/admin/pages/reports/components/ReportSummaryCards.jsx
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { TrendingUp, PersonAdd, ShoppingCart, AccountBalance } from '@mui/icons-material';
import { REPORT_SUMMARY } from '../_reportMockData';

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' đ';

interface SubRow {
    label: string;
    value: string;
    color?: string;
}

interface StatCardProps {
    title: string;
    value: string | number;
    sub?: string;
    subRows?: SubRow[];
    icon: React.ReactNode;
    iconBg: string;
    color?: string;
}

const StatCard = ({ title, value, sub, subRows, icon, iconBg, color }: StatCardProps) => (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff', flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize={12}>
                {title}
            </Typography>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </Box>
        </Box>

        {/* Main value */}
        <Typography variant="h5" fontWeight={900} color={color || '#1a1a2e'} lineHeight={1.2} mb={1}>
            {value}
        </Typography>

        {/* Sub rows — only render when provided */}
        {subRows && subRows.map((row, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography variant="caption" color="text.secondary" fontSize={11}>{row.label}:</Typography>
                <Typography variant="caption" fontWeight={700} fontSize={11} color={row.color || '#333'}>{row.value}</Typography>
            </Box>
        ))}

        {/* sub text — only render when provided */}
        {sub && <Typography variant="caption" color="text.secondary" fontSize={11}>{sub}</Typography>}
    </Paper>
);

const ReportSummaryCards = () => {
    const { cashIn, cashOut, cashNet, newCustomers, totalOrders, monthRevenue } = REPORT_SUMMARY;

    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {/* Quyết toán tiền mặt */}
            <StatCard
                title="Quyết toán tiền mặt"
                value={`+${fmt(cashNet)}`}
                color="#1976d2"
                iconBg="#e3f2fd"
                icon={<AccountBalance sx={{ fontSize: 18, color: '#1976d2' }} />}
                subRows={[
                    { label: 'Thu tiền mặt', value: `+${fmt(cashIn)}`, color: '#2e7d32' },
                    { label: 'Chi tiền mặt', value: `-${fmt(cashOut)}`, color: '#d32f2f' },
                    { label: 'Quyết toán', value: `+${fmt(cashNet)}`, color: '#1976d2' },
                ]}
            />

            {/* Khách hàng mới */}
            <StatCard
                title="Khách hàng mới tháng này"
                value={newCustomers}
                color="#7b1fa2"
                iconBg="#f3e5f5"
                icon={<PersonAdd sx={{ fontSize: 18, color: '#7b1fa2' }} />}
                sub="khách hàng mới trong tháng"
            />

            {/* Tổng đơn hàng */}
            <StatCard
                title="Tổng đơn hàng tháng này"
                value={totalOrders}
                color="#e65100"
                iconBg="#fff3e0"
                icon={<ShoppingCart sx={{ fontSize: 18, color: '#e65100' }} />}
                sub="đơn hàng trong tháng"
            />

            {/* Doanh số */}
            <StatCard
                title="Doanh số tháng này"
                value={fmt(monthRevenue)}
                color="#2e7d32"
                iconBg="#e8f5e9"
                icon={<TrendingUp sx={{ fontSize: 18, color: '#2e7d32' }} />}
                sub="tổng doanh thu tháng"
            />
        </Box>
    );
};

export default ReportSummaryCards;