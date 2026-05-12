import React, { useState } from 'react';
import {
    Dialog, Box, Typography, TextField, Button, CircularProgress,
} from '@mui/material';
import { ShoppingCart, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Props {
    open: boolean;
    loading: boolean;
    onOpen: (startingCash: number) => void;
}

const QUICK_AMOUNTS = [200_000, 500_000, 1_000_000];

const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const OpenShiftDialog: React.FC<Props> = ({ open, loading, onOpen }) => {
    const [cash, setCash] = useState('');
    const navigate = useNavigate();

    const handleOpen = () => {
        const amount = Number(cash);
        if (amount < 0) return;
        onOpen(amount);
    };

    return (
        <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{
            sx: { borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' },
        }}>
            <Box sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{
                        width: 64, height: 64, borderRadius: '50%',
                        bgcolor: '#f59e0b22', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', mx: 'auto', mb: 2,
                    }}>
                        <ShoppingCart sx={{ fontSize: 32, color: '#f59e0b' }} />
                    </Box>
                    <Typography fontWeight={800} fontSize={20} color="#f1f5f9">Mở ca làm việc</Typography>
                    <Typography variant="body2" color="#94a3b8" mt={0.5}>
                        Nhập tiền đầu ca để bắt đầu bán hàng
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="Tiền đầu ca (₫)"
                    type="number"
                    value={cash}
                    onChange={e => setCash(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleOpen()}
                    placeholder="VD: 500000"
                    autoFocus
                    InputLabelProps={{ style: { color: '#94a3b8' } }}
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            color: '#f1f5f9',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#f59e0b' },
                            '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                        },
                    }}
                />

                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    {QUICK_AMOUNTS.map(v => (
                        <Button key={v} size="small" variant="outlined"
                            onClick={() => setCash(String(v))}
                            sx={{
                                flex: 1, textTransform: 'none', borderColor: '#334155',
                                color: '#94a3b8', fontSize: 11,
                                '&:hover': { borderColor: '#f59e0b', color: '#f59e0b' },
                            }}>
                            {v / 1000}K
                        </Button>
                    ))}
                </Box>

                <Button
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    onClick={handleOpen}
                    sx={{
                        py: 1.5, borderRadius: 2, fontWeight: 700,
                        bgcolor: '#f59e0b', color: '#1e293b',
                        '&:hover': { bgcolor: '#d97706' },
                        '&:disabled': { bgcolor: '#374151' },
                    }}>
                    {loading
                        ? <CircularProgress size={20} sx={{ color: '#1e293b' }} />
                        : '🔓 Mở ca ngay'}
                </Button>

                <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate('/admin/dashboard')}
                    startIcon={<DashboardIcon />}
                    sx={{ mt: 1.5, color: '#64748b', textTransform: 'none', fontSize: 13 }}>
                    Quay về Dashboard
                </Button>
            </Box>
        </Dialog>
    );
};

export default OpenShiftDialog;