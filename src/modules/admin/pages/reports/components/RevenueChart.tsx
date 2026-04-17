// src/modules/admin/pages/reports/components/RevenueChart.jsx
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { REVENUE_BY_DAY } from '../_reportMockData';

const fmtM = (v) => `${(v / 1_000_000).toFixed(0)}M`;

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: 2, p: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>{label}</Typography>
            {payload.map((p, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                    <Typography variant="caption" color="#555">{p.name}:</Typography>
                    <Typography variant="caption" fontWeight={700}>
                        {p.name === 'Doanh thu' ? `${(p.value / 1_000_000).toFixed(1)}M đ` : p.value}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

const RevenueChart = () => (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #f0f0f0', bgcolor: '#fff', flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} color="#1a1a2e" mb={2}>
            Doanh thu theo thời gian
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
            <LineChart data={REVENUE_BY_DAY} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={{ stroke: '#f0f0f0' }}
                    interval={3}
                />
                <YAxis
                    yAxisId="revenue"
                    orientation="right"
                    tickFormatter={fmtM}
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    yAxisId="orders"
                    orientation="left"
                    tick={{ fontSize: 10, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
                <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name="Số đơn"
                    stroke="#90caf9"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#90caf9' }}
                    activeDot={{ r: 5 }}
                />
                <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#1976d2"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#1976d2' }}
                    activeDot={{ r: 5 }}
                />
            </LineChart>
        </ResponsiveContainer>
    </Paper>
);

export default RevenueChart;