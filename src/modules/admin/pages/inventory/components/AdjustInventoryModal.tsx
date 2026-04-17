import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, TextField, Button, IconButton, Box, Divider,
} from '@mui/material';
import { Close, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { InventoryWithMeta } from '../../../../../types';

interface Props {
    open: boolean;
    inventory: InventoryWithMeta | null;
    onClose: () => void;
    onConfirm: (actualQty: number, reason: string) => void;
    saving: boolean;
}

const AdjustInventoryModal: React.FC<Props> = ({ open, inventory, onClose, onConfirm, saving }) => {
    const [actualQty, setActualQty] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (open && inventory) {
            setActualQty(String(inventory.quantity ?? 0));
            setReason('');
        }
    }, [open, inventory]);

    const diff = inventory ? Number(actualQty) - (inventory.quantity ?? 0) : 0;
    const canSubmit = actualQty !== '' && reason.trim().length > 0 && !saving;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography fontWeight={800} fontSize={16} color="#1a1a2e">Điều chỉnh tồn kho</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {inventory?.productName} · {inventory?.warehouseName}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 1 }} />

            <DialogContent sx={{ px: 3, pt: 2 }}>
                {inventory?.imageUrl && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Box component="img" src={inventory.imageUrl} alt={inventory.productName}
                            sx={{ width: 80, height: 100, objectFit: 'contain', borderRadius: 1.5, border: '1px solid #e0e0e0' }} />
                    </Box>
                )}

                <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1.5, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Tồn kho hiện tại</Typography>
                    <Typography variant="h5" fontWeight={800} color="#1976d2">
                        {inventory?.quantity?.toLocaleString() ?? 0}
                    </Typography>
                </Box>

                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                    Số lượng thực tế <span style={{ color: '#d32f2f' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" type="number"
                    value={actualQty} onChange={e => setActualQty(e.target.value)}
                    inputProps={{ min: 0 }} sx={{ mb: 1.5 }} />

                {actualQty !== '' && inventory && (
                    <Box sx={{
                        p: 1.25, borderRadius: 1.5, mb: 2,
                        bgcolor: diff === 0 ? '#f5f5f5' : diff > 0 ? '#e8f5e9' : '#ffebee',
                        border: `1px solid ${diff === 0 ? '#e0e0e0' : diff > 0 ? '#c8e6c9' : '#ffcdd2'}`,
                        display: 'flex', alignItems: 'center', gap: 0.75,
                    }}>
                        {diff > 0 ? <ArrowUpward sx={{ color: '#2e7d32', fontSize: 16 }} /> :
                            diff < 0 ? <ArrowDownward sx={{ color: '#d32f2f', fontSize: 16 }} /> : null}
                        <Typography variant="body2" fontWeight={700}
                            color={diff === 0 ? '#888' : diff > 0 ? '#2e7d32' : '#d32f2f'}>
                            {diff === 0 ? 'Không thay đổi' : `${diff > 0 ? '+' : ''}${diff} sản phẩm`}
                        </Typography>
                    </Box>
                )}

                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>
                    Lý do điều chỉnh <span style={{ color: '#d32f2f' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" multiline rows={2}
                    placeholder="VD: Kiểm kê thực tế, hàng hỏng, thất thoát..."
                    value={reason} onChange={e => setReason(e.target.value)} />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>
                    Hủy
                </Button>
                <Button variant="contained" disabled={!canSubmit}
                    onClick={() => onConfirm(Number(actualQty), reason.trim())}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1976d2', borderRadius: 1.5 }}>
                    {saving ? 'Đang lưu...' : 'Xác nhận điều chỉnh'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdjustInventoryModal;