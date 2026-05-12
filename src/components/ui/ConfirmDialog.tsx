import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    danger?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    description,
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {danger && <Warning sx={{ color: '#d32f2f' }} />}
                <Typography variant="h6" fontWeight={700}>
                    {title}
                </Typography>
            </DialogTitle>
            {description && (
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </DialogContent>
            )}
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onCancel} variant="outlined" disabled={loading}>
                    Hủy
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={danger ? 'error' : 'primary'}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={20} /> : 'Xác nhận'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};