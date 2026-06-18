import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { WarningRounded } from '@mui/icons-material';

interface ConfirmOptions {
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ description: '' });
    const [resolveFn, setResolveFn] = useState<(value: boolean) => void>();

    const confirm = (options: ConfirmOptions) => {
        setOptions(options);
        setOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolveFn(() => resolve);
        });
    };

    const handleClose = () => {
        setOpen(false);
        if (resolveFn) resolveFn(false);
    };

    const handleConfirm = () => {
        setOpen(false);
        if (resolveFn) resolveFn(true);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <Dialog 
                open={open} 
                onClose={handleClose} 
                PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 350, maxWidth: 450 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, pb: 1, fontSize: 18 }}>
                    <WarningRounded color={options.color === 'error' ? 'error' : 'warning'} sx={{ fontSize: 28 }} />
                    {options.title || 'Xác nhận thao tác'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
                        {options.description}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                    <Button 
                        onClick={handleClose} 
                        color="inherit" 
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2 }}
                    >
                        {options.cancelText || 'Hủy bỏ'}
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        variant="contained" 
                        color={options.color || 'error'} 
                        disableElevation 
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
                    >
                        {options.confirmText || 'Đồng ý'}
                    </Button>
                </DialogActions>
            </Dialog>
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
    return context;
};
