import React from 'react';
import { Dialog, DialogContent, DialogTitle, Typography, Box, CircularProgress, Button, IconButton } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Close, AccountBalanceWallet, PhoneAndroid } from '@mui/icons-material';
import { fmt } from '../../../../utils/constants';

interface QrPaymentDialogProps {
    open: boolean;
    onClose: () => void;
    checkoutUrl: string;
    qrCode?: string;
    orderCode: string;
    amount: number;
    gateway: string;
}

const QrPaymentDialog: React.FC<QrPaymentDialogProps> = ({ open, onClose, checkoutUrl, qrCode, orderCode, amount, gateway }) => {
    return (
        <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {gateway === 'VNPAY' ? <AccountBalanceWallet sx={{ color: '#005baa' }} /> : <PhoneAndroid sx={{ color: '#10b981' }} />}
                    Quét mã thanh toán {gateway}
                </Typography>
                <IconButton onClick={onClose} sx={{ p: 0.5 }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography color="text.secondary" mb={2}>
                    Vui lòng hướng dẫn khách hàng mở ứng dụng ngân hàng hoặc ví điện tử để quét mã QR bên dưới.
                </Typography>
                
                <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {(qrCode || checkoutUrl) ? (
                        <QRCodeSVG value={qrCode || checkoutUrl} size={250} level="H" />
                    ) : (
                        <Box sx={{ width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                            <CircularProgress />
                        </Box>
                    )}
                </Box>

                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Mã đơn hàng:</Typography>
                        <Typography fontWeight={700}>{orderCode}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Số tiền thanh toán:</Typography>
                        <Typography fontWeight={800} color="error.main" fontSize={18}>{fmt(amount)}</Typography>
                    </Box>
                </Box>

                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" fontWeight={600}>Đang chờ khách hàng thanh toán...</Typography>
                </Box>

                <Button 
                    variant="outlined" 
                    color="inherit" 
                    fullWidth 
                    sx={{ mt: 3, borderRadius: 2 }}
                    onClick={onClose}
                >
                    Hủy giao dịch
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default QrPaymentDialog;
