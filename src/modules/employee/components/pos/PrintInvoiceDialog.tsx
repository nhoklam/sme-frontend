import React, { useRef } from 'react';
import {
    Dialog, DialogContent, Box, Typography,
    Button, Divider, IconButton,
} from '@mui/material';
import { Print, Close } from '@mui/icons-material';

interface InvoiceItem {
    productId: string;
    productName?: string;
    isbnBarcode?: string;
    quantity: number;
    unitPrice: number;
    macPrice?: number;
    subtotal: number;
}

interface PaymentRow {
    method: string;
    amount: number;
    reference?: string;
}

interface InvoiceData {
    id: string;
    code: string;
    type?: string;
    totalAmount: number;
    discountAmount?: number;
    finalAmount: number;
    pointsUsed?: number;
    pointsEarned?: number;
    cashierName?: string;
    customerName?: string;
    customerPhone?: string;
    note?: string;
    createdAt: string;
    items: InvoiceItem[];
    payments: PaymentRow[];
}

interface PrintInvoiceDialogProps {
    open: boolean;
    onClose: () => void;
    invoice: InvoiceData | null;
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
    cashierDisplayName?: string;
    warehouseName?: string;
}

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(n ?? 0);

const paymentLabel = (method: string) => {
    switch (method?.toUpperCase()) {
        case 'CASH': return 'Tiền mặt';
        case 'CARD': return 'Thẻ';
        case 'MOMO': return 'MoMo';
        case 'VNPAY': return 'VNPay';
        case 'POINTS': return 'Điểm tích lũy';
        default: return method;
    }
};

const PrintInvoiceDialog: React.FC<PrintInvoiceDialogProps> = ({
    open, onClose, invoice,
    storeName = 'CỬA HÀNG CRM SYSTEM',
    storeAddress = '123 Đường CRM, TP. Hồ Chí Minh',
    storePhone = '0123 456 789',
    cashierDisplayName,
    warehouseName,
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!invoice) return null;

    const totalPaid = invoice.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
    const changeAmount = totalPaid - invoice.finalAmount;
    const createdDate = new Date(invoice.createdAt);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=320,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Hóa đơn ${invoice.code}</title>
                <style>
                    @page { margin: 0; size: 80mm auto; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 11px;
                        width: 76mm;
                        padding: 4mm;
                        color: #000;
                        margin: auto;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .store-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .store-info { font-size: 11px; margin-bottom: 1px; }
                    .title { font-size: 14px; font-weight: bold; margin: 10px 0 4px 0; text-transform: uppercase; }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 6px 0;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 2px;
                    }
                    .item-name {
                        margin-top: 4px;
                        margin-bottom: 1px;
                        text-transform: uppercase;
                    }
                    .item-detail {
                        display: flex;
                        justify-content: space-between;
                        padding-left: 0;
                    }
                    .footer { font-size: 11px; font-style: italic; text-align: center; margin-top: 12px; }
                    .powered { font-size: 10px; text-align: center; margin-top: 2px; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
                    th { border-bottom: 1px dashed #000; padding-bottom: 4px; text-align: right; font-weight: bold; font-size: 11px; }
                    th:first-child { text-align: left; }
                    th:nth-child(2) { text-align: center; }
                    td { vertical-align: top; padding-top: 4px; }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2, maxWidth: 400 } }}
        >
            <DialogContent sx={{ p: 0 }}>
                {/* Preview Container */}
                <Box sx={{ p: 3, bgcolor: '#e5e7eb', maxHeight: '80vh', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                    {/* Printable Content */}
                    <Box
                        ref={printRef}
                        sx={{
                            bgcolor: '#fff',
                            p: 3,
                            width: '300px',
                            minHeight: '400px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: 11,
                            color: '#000'
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ textAlign: 'center', mb: 1 }}>
                            <div className="store-name" style={{ fontSize: 14, fontWeight: 800, marginBottom: 2, textTransform: 'uppercase' }}>
                                {storeName}
                            </div>
                            <div className="store-info" style={{ fontSize: 11, marginBottom: 1 }}>
                                Địa chỉ: {storeAddress}
                            </div>
                            {storePhone && (
                                <div className="store-info" style={{ fontSize: 11, marginBottom: 1 }}>
                                    Hotline: {storePhone}
                                </div>
                            )}
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1.5, borderWidth: '1px 0 0 0' }} />

                        {/* Invoice Info */}
                        <Box sx={{ mb: 1.5 }}>
                            <div className="center title" style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginBottom: 4, textTransform: 'uppercase' }}>
                                {invoice.type === 'RETURN' ? 'PHIẾU TRẢ HÀNG' : 'HÓA ĐƠN THANH TOÁN'}
                            </div>
                            <Box sx={{ textAlign: 'center', fontSize: 11, mb: 0.5 }}>
                                Số: {invoice.code}
                            </Box>
                            <Box sx={{ textAlign: 'center', fontSize: 11, mb: 1.5 }}>
                                Ngày: {createdDate.toLocaleDateString('vi-VN')} {createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, mb: 0.5 }}>
                                <span>Thu ngân:</span>
                                <span>{cashierDisplayName || invoice.cashierName || '—'}</span>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, mb: 0.5 }}>
                                <span>Khách hàng:</span>
                                <span>{invoice.customerName || 'Khách lẻ'}</span>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1.5, borderWidth: '1px 0 0 0' }} />

                        {/* Items */}
                        <Box sx={{ mb: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', borderBottom: '1px dashed #000', paddingBottom: 4 }}>Tên hàng</th>
                                        <th style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 4 }}>SL</th>
                                        <th style={{ textAlign: 'right', borderBottom: '1px dashed #000', paddingBottom: 4 }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.items || []).map((item, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr>
                                                <td colSpan={3} style={{ paddingTop: 6, paddingBottom: 2, textTransform: 'uppercase' }}>
                                                    {item.productName || `SP #${item.productId.slice(0, 8)}`}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ paddingBottom: 4 }}>{fmt(item.unitPrice)}</td>
                                                <td style={{ textAlign: 'center', paddingBottom: 4 }}>x {Math.abs(item.quantity)}</td>
                                                <td style={{ textAlign: 'right', paddingBottom: 4 }}>{fmt(item.subtotal)}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1.5, borderWidth: '1px 0 0 0' }} />

                        {/* Totals */}
                        <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, mb: 0.5 }}>
                                <span>Tổng tiền hàng:</span>
                                <span>{fmt(invoice.totalAmount)}</span>
                            </Box>
                            {(invoice.discountAmount ?? 0) > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, mb: 0.5 }}>
                                    <span>Giảm giá:</span>
                                    <span>-{fmt(invoice.discountAmount)}</span>
                                </Box>
                            )}
                            {(invoice.pointsUsed ?? 0) > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, mb: 0.5 }}>
                                    <span>Dùng điểm:</span>
                                    <span>-{fmt((invoice.pointsUsed ?? 0) * 100)}</span>
                                </Box>
                            )}
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1.5, borderWidth: '1px 0 0 0' }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, my: 1.5 }}>
                            <span>TỔNG CỘNG:</span>
                            <span>{fmt(invoice.finalAmount)}</span>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1.5, borderWidth: '1px 0 0 0' }} />

                        {/* Payments */}
                        {invoice.payments && invoice.payments.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                                {invoice.payments.map((p, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, mb: 0.5 }}>
                                        <span>Khách thanh toán:</span>
                                        <span>{fmt(p.amount)}</span>
                                    </Box>
                                ))}
                                {changeAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, mt: 0.5 }}>
                                        <span>Tiền thừa:</span>
                                        <span>{fmt(changeAmount)}</span>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Note */}
                        {invoice.note && (
                            <Box sx={{ fontSize: 10, mt: 1.5, fontStyle: 'italic' }}>
                                Ghi chú: {invoice.note}
                            </Box>
                        )}

                        {/* Footer */}
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <div className="footer" style={{ fontSize: 11, fontStyle: 'italic', marginBottom: 2 }}>
                                Cảm ơn Quý khách. Hẹn gặp lại!
                            </div>
                            <div className="powered" style={{ fontSize: 10, fontStyle: 'italic' }}>
                                Powered by CRM System
                            </div>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', color: '#555', borderColor: '#ccc', borderRadius: 2 }}>
                        Đóng
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                        In hóa đơn (F10)
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default PrintInvoiceDialog;
