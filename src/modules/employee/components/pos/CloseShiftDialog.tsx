import React, { useState } from 'react';
import {
    Dialog, Box, Typography, TextField, Button, CircularProgress,
} from '@mui/material';
import { Lock } from '@mui/icons-material';

interface Props {
    open: boolean;
    loading: boolean;
    onClose: () => void;
    onConfirm: (reportedCash: number, discrepancyReason: string) => void;
}

const CloseShiftDialog: React.FC<Props> = ({ open, loading, onClose, onConfirm }) => {
    const [cash, setCash] = useState('');
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        const amount = Number(cash);
        if (isNaN(amount) || cash === '') return;
        onConfirm(amount, reason);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{
            sx: { borderRadius: 3, bgcolor: '#fff', border: '1px solid #f0f0f0' },
        }}>
            <Box sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{
                        width: 64, height: 64, borderRadius: '50%',
                        bgcolor: '#fffbe6', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', mx: 'auto', mb: 2,
                    }}>
                        <Lock sx={{ fontSize: 32, color: '#faad14' }} />
                    </Box>
                    <Typography fontWeight={800} fontSize={20} color="#1a1a2e">Đóng ca làm việc</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Nhập số tiền thực đếm trong két để chốt ca
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="Số tiền thực đếm (₫) *"
                    type="number"
                    value={cash}
                    onChange={e => setCash(e.target.value)}
                    placeholder="VD: 5000000"
                    autoFocus
                    size="small"
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Lý do chênh lệch (nếu có)"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    placeholder="Ghi chú chênh lệch tiền mặt"
                    size="small"
                    multiline
                    rows={2}
                    sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        sx={{ py: 1.25, borderRadius: 2, fontWeight: 600, color: '#595959', borderColor: '#d9d9d9', textTransform: 'none' }}>
                        Hủy
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        disabled={loading || cash === ''}
                        onClick={handleConfirm}
                        sx={{
                            py: 1.25, borderRadius: 2, fontWeight: 700,
                            bgcolor: '#faad14', color: '#fff', textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#d48806' },
                        }}>
                        {loading
                            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                            : 'Xác nhận đóng ca'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default CloseShiftDialog;
