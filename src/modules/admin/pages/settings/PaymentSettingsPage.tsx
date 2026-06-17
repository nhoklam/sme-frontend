import React, { useState } from 'react';
import {
    Box, Typography, Paper, Switch, FormControlLabel,
    Divider, Chip, Grid, Button, TextField, Alert,
    InputAdornment,
} from '@mui/material';
import {
    CreditCard, AccountBalance, QrCode2, LocalShipping, Save,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function PaymentSettingsPage() {
    const [methods, setMethods] = useState({
        cash: true,
        card: true,
        momo: false,
        vnpay: false,
        cod: true,
        bankTransfer: true,
    });

    const [cod, setCod] = useState({
        minOrderValue: 0,
        feePercentage: 0,
        maxCodValue: 10000000,
    });

    const toggle = (key: keyof typeof methods) => {
        setMethods(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const PAYMENT_ROWS = [
        { key: 'cash' as const, label: 'Tiền mặt', desc: 'Thanh toán trực tiếp tại quầy', icon: <CreditCard />, color: '#10b981', chip: 'POS' },
        { key: 'card' as const, label: 'Thẻ ngân hàng (POS)', desc: 'Quẹt thẻ Visa/Mastercard tại máy POS', icon: <CreditCard />, color: '#3b82f6', chip: 'POS' },
        { key: 'momo' as const, label: 'MoMo', desc: 'Thanh toán qua ví MoMo', icon: <QrCode2 />, color: '#e91e8c', chip: 'Online' },
        { key: 'vnpay' as const, label: 'VNPay QR', desc: 'Thanh toán qua cổng VNPay', icon: <QrCode2 />, color: '#d32f2f', chip: 'Online' },
        { key: 'bankTransfer' as const, label: 'Chuyển khoản ngân hàng', desc: 'Khách chuyển khoản trước khi giao', icon: <AccountBalance />, color: '#6366f1', chip: 'Online' },
        { key: 'cod' as const, label: 'COD — Thu hộ khi giao', desc: 'Thu tiền mặt tại địa chỉ giao hàng', icon: <LocalShipping />, color: '#f59e0b', chip: 'Giao hàng' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>
                    Cài đặt / <strong style={{ color: '#6b7280' }}>Phương thức thanh toán</strong>
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5}>
                    Phương thức Thanh toán
                </Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>
                    Bật/tắt các phương thức thanh toán cho POS và cửa hàng online
                </Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' }}>
                <Typography fontWeight={700} fontSize={13}>Cài đặt này chưa được lưu vào hệ thống. Tính năng đang hoàn thiện.</Typography>
                <Typography fontSize={12} mt={0.5}>Phương thức bị tắt sẽ không hiển thị trong màn hình thanh toán POS và trang Checkout.</Typography>
            </Alert>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <Typography fontSize={12} fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing="0.5px">
                        Phương thức thanh toán
                    </Typography>
                </Box>

                {PAYMENT_ROWS.map((row, idx) => (
                    <React.Fragment key={row.key}>
                        {idx > 0 && <Divider />}
                        <Box sx={{ px: 3, py: 2.5, '&:hover': { bgcolor: '#f8fafc' }, transition: 'background 0.1s' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${row.color}18`, color: row.color }}>
                                        {row.icon}
                                    </Box>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography fontSize={14} fontWeight={600} color="#1e293b">
                                                {row.label}
                                            </Typography>
                                            <Chip label={row.chip} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                                        </Box>
                                        <Typography variant="caption" color="#94a3b8" fontSize={11.5}>
                                            {row.desc}
                                        </Typography>
                                    </Box>
                                </Box>
                                <FormControlLabel
                                    control={<Switch checked={methods[row.key]} onChange={() => toggle(row.key)} color="primary" />}
                                    label={methods[row.key] ? <Typography fontSize={12} color="#10b981" fontWeight={700}>Bật</Typography> : <Typography fontSize={12} color="#94a3b8">Tắt</Typography>}
                                    labelPlacement="start"
                                    sx={{ mr: 0 }}
                                />
                            </Box>
                        </Box>
                    </React.Fragment>
                ))}
            </Paper>

            {methods.cod && (
                <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                    <Typography fontWeight={700} fontSize={14} mb={0.5} display="flex" alignItems="center" gap={1}>
                        <LocalShipping sx={{ fontSize: 18, color: '#f59e0b' }} /> Cấu hình COD
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2.5} fontSize={12}>
                        Giới hạn và phí áp dụng cho đơn thu hộ
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth label="Giá trị đơn tối thiểu (đ)" size="small" type="number"
                                value={cod.minOrderValue}
                                onChange={e => setCod({ ...cod, minOrderValue: Number(e.target.value) })}
                                helperText="0 = không giới hạn"
                                InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth label="Giá trị đơn tối đa (đ)" size="small" type="number"
                                value={cod.maxCodValue}
                                onChange={e => setCod({ ...cod, maxCodValue: Number(e.target.value) })}
                                InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth label="Phí COD (%)" size="small" type="number"
                                value={cod.feePercentage}
                                onChange={e => setCod({ ...cod, feePercentage: Number(e.target.value) })}
                                helperText="0 = miễn phí COD"
                                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained" startIcon={<Save />}
                    disabled
                    sx={{ textTransform: 'none', fontWeight: 700, px: 4, borderRadius: 2 }}
                >
                    Lưu cài đặt
                </Button>
            </Box>
        </Box>
    );
}
