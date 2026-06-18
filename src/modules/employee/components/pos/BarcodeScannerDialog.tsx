import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
    open: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
}

const BarcodeScannerDialog: React.FC<Props> = ({ open, onClose, onScan }) => {
    const [errorMsg, setErrorMsg] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const runningRef = useRef(false);

    const stopScanner = async () => {
        if (scannerRef.current && runningRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                // ignore
            }
            runningRef.current = false;
        }
        scannerRef.current = null;
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    useEffect(() => {
        if (!open) {
            setErrorMsg('');
            stopScanner();
            return;
        }

        let cancelled = false;

        const initScanner = async () => {
            const el = document.getElementById('barcode-reader');
            if (!el) {
                if (!cancelled) setTimeout(initScanner, 150);
                return;
            }

            try {
                const qr = new Html5Qrcode('barcode-reader');
                scannerRef.current = qr;

                await qr.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        // Quét thành công
                        if (!runningRef.current) return;
                        runningRef.current = false;
                        qr.stop().then(() => qr.clear()).catch(() => {});
                        onScan(decodedText);
                        onClose();
                    },
                    () => {
                        // frame scan - bỏ qua
                    }
                );
                runningRef.current = true;
            } catch (err: any) {
                if (!cancelled) {
                    setErrorMsg('Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.');
                }
            }
        };

        const timer = setTimeout(initScanner, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Quét mã vạch
                <IconButton onClick={handleClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {errorMsg && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>{errorMsg}</Typography>
                )}
                <Box
                    id="barcode-reader"
                    sx={{
                        width: '100%',
                        minHeight: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="inherit" variant="outlined">Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};
export default BarcodeScannerDialog;
