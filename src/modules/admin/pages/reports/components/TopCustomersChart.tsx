// src/modules/admin/pages/reports/components/TopCustomersChart.jsx
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TOP_CUSTOMERS } from '../_reportMockData';

const fmtM = (v) => `${(v / 1_000_000).toFixed(0)}M`;

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: 2, p: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
            <Typography variant="caption" color="#1976d2" fontWeight={700}>
                {(payload[0].value / 1_000_000).toFixed(1)}M đ
            </Typography>
        </Box>
    );
};

const COLORS = ['#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#c5cae9', '#d1c4e9'];

const TopCustomersChart = () => (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff', flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} color="#1a1a2e" mb={2}>
            Top khách hàng
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
            <BarChart data={TOP_CUSTOMERS} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#888' }}
                    tickLine={false}
                    axisLine={{ stroke: '#f0f0f0' }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                />
                <YAxis
                    tickFormatter={fmtM}
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(25,118,210,0.05)' }} />
                <Bar dataKey="revenue" name="Doanh thu" radius={[3, 3, 0, 0]}>
                    {TOP_CUSTOMERS.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#1976d2' }} />
            <Typography variant="caption" color="#888" fontSize={11}>Doanh thu</Typography>
        </Box>
    </Paper>
);

export default TopCustomersChart;