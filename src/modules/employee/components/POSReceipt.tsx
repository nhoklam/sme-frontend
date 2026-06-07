import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography, Divider } from '@mui/material';
import { InvoiceResponse } from '../../../types';

interface Props {
    open: boolean;
    onClose: () => void;
    invoice: InvoiceResponse | null;
    warehouseName?: string;
}

export default function POSReceipt({ open, onClose, invoice, warehouseName }: Props) {
    const handlePrint = () => {
        window.print();
    };

    if (!invoice) return null;

    const fmtMoney = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const fmtDate = (d: string) => {
        try {
            return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return d; }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#f9fafb' }}>
                <Box
                    id="printable-receipt"
                    sx={{
                        width: '80mm',
                        bgcolor: '#fff',
                        p: '10px 15px',
                        fontFamily: '"Courier New", Courier, monospace',
                        color: '#000',
                        fontSize: '12px',
                        lineHeight: 1.4,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '18px', fontFamily: 'inherit' }}>SME BOOKSTORE</Typography>
                        <Typography sx={{ fontSize: '12px', fontFamily: 'inherit' }}>{warehouseName || 'Chi nhánh trung tâm'}</Typography>
                        <Typography sx={{ fontSize: '12px', fontFamily: 'inherit' }}>---------------------------------</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', mt: 1, fontFamily: 'inherit' }}>HÓA ĐƠN BÁN LẺ</Typography>
                    </Box>

                    <Box sx={{ mb: 2, fontSize: '11px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Box>Số HĐ:</Box>
                            <Box sx={{ fontWeight: 700 }}>{invoice.code}</Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Box>Ngày giờ:</Box>
                            <Box>{fmtDate(invoice.createdAt)}</Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Box>Thu ngân:</Box>
                            <Box>{invoice.cashierName || 'System'}</Box>
                        </Box>
                        {invoice.customerName && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>Khách hàng:</Box>
                                <Box>{invoice.customerName}</Box>
                            </Box>
                        )}
                    </Box>

                    <Typography sx={{ fontSize: '12px', fontFamily: 'inherit', mb: 1 }}>---------------------------------</Typography>

                    <Box sx={{ mb: 2 }}>
                        {invoice.items.map((item, idx) => (
                            <Box key={idx} sx={{ mb: 1, fontSize: '11px' }}>
                                <Typography sx={{ fontSize: '11px', fontFamily: 'inherit', fontWeight: 700 }}>
                                    {item.productName || 'Sản phẩm'}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box>{item.quantity} x {fmtMoney(item.unitPrice)}</Box>
                                    <Box sx={{ fontWeight: 700 }}>{fmtMoney(item.subtotal)}</Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <Typography sx={{ fontSize: '12px', fontFamily: 'inherit', mb: 1 }}>---------------------------------</Typography>

                    <Box sx={{ mb: 2, fontSize: '12px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box>Tổng cộng:</Box>
                            <Box>{fmtMoney(invoice.totalAmount)}</Box>
                        </Box>
                        {invoice.discountAmount > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Box>Chiết khấu:</Box>
                                <Box>-{fmtMoney(invoice.discountAmount)}</Box>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Box sx={{ fontWeight: 800, fontSize: '14px' }}>THANH TOÁN:</Box>
                            <Box sx={{ fontWeight: 800, fontSize: '14px' }}>{fmtMoney(invoice.finalAmount)}</Box>
                        </Box>
                    </Box>

                    <Typography sx={{ fontSize: '12px', fontFamily: 'inherit', mb: 1 }}>---------------------------------</Typography>

                    <Box sx={{ mb: 2, fontSize: '11px', textAlign: 'center' }}>
                        {invoice.payments?.map((p, i) => (
                            <Box key={i}>
                                Thanh toán qua: <strong>{p.method}</strong> ({fmtMoney(p.amount)})
                            </Box>
                        ))}
                    </Box>

                    <Box sx={{ textAlign: 'center', fontSize: '11px', fontStyle: 'italic', mt: 3, mb: 1 }}>
                        Cảm ơn quý khách và hẹn gặp lại!
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', color: '#555', borderColor: '#e5e7eb' }}>
                    Đóng
                </Button>
                <Button onClick={handlePrint} variant="contained" sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
                    In hóa đơn
                </Button>
            </DialogActions>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                        font-family: "Courier New", Courier, monospace !important;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 10px;
                        width: 80mm;
                        box-shadow: none !important;
                    }
                    /* Ẩn các Dialog backdrop và container thừa */
                    .MuiDialog-container {
                        background: none !important;
                        height: auto !important;
                    }
                    .MuiPaper-root {
                        box-shadow: none !important;
                        background: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .MuiDialogActions-root, .MuiDialogTitle-root {
                        display: none !important;
                    }
                }
            `}</style>
        </Dialog>
    );
}
