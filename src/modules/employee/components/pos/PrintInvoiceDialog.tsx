import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
    Dialog, DialogContent, Box, Typography,
    Button, CircularProgress,
} from '@mui/material';
import { Print, CheckCircle } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';

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
    volumeDiscountAmt?: number;
    orderDiscountAmt?: number;
    couponDiscountAmt?: number;
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
    mode?: 'receipt' | 'qr-slip';
    qrValue?: string;
    autoTriggerPrint?: boolean;
    onConfirmPayment?: () => void;
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
    storeName = 'SME BOOKSTORE',
    storeAddress = '491 Đỗ Xuân Hợp, Phước Long B, Thủ Đức',
    storePhone = '0367287044',
    cashierDisplayName,
    warehouseName,
    mode = 'receipt',
    qrValue,
    autoTriggerPrint = false,
    onConfirmPayment,
}) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [waitingPayment, setWaitingPayment] = useState(false);

    useEffect(() => {
        if (!open) setWaitingPayment(false);
    }, [open]);

    const handlePrint = useCallback(() => {
        const content = printRef.current;
        if (!content || !invoice) return;

        const printWindow = window.open('', '_blank', 'width=320,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${mode === 'qr-slip' ? 'Phiếu QR ' + invoice.code : 'Hóa đơn ' + invoice.code}</title>
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
                    svg { display: block; margin: 0 auto; }
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
        }, 400);
        if (mode === 'qr-slip') setWaitingPayment(true);
    }, [invoice, mode]);

    useEffect(() => {
        if (autoTriggerPrint && open && invoice) {
            const timer = setTimeout(() => handlePrint(), 500);
            return () => clearTimeout(timer);
        }
    }, [autoTriggerPrint, open, invoice, handlePrint]);

    if (!invoice) return null;

    const totalPaid = invoice.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
    const changeAmount = totalPaid - invoice.finalAmount;
    const createdDate = new Date(invoice.createdAt);

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
                    <div
                        ref={printRef}
                        style={{
                            backgroundColor: '#fff',
                            padding: '16px',
                            width: '300px',
                            minHeight: '400px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: '12px',
                            color: '#000',
                            margin: 'auto'
                        }}
                    >
                        {/* Header — shared for both modes */}
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textTransform: 'uppercase' }}>
                                {storeName}
                            </div>
                            <div style={{ fontSize: '11px', marginBottom: '1px' }}>
                                {storeAddress}
                            </div>
                            {storePhone && (
                                <div style={{ fontSize: '11px', marginBottom: '1px' }}>
                                    ĐT: {storePhone}
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                        {mode === 'qr-slip' ? (
                            <>
                                {/* QR Slip title */}
                                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', margin: '4px 0', textTransform: 'uppercase' }}>
                                    PHIẾU CHỜ THANH TOÁN
                                </div>

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                                <div style={{ display: 'flex', marginBottom: '2px' }}>
                                    <span style={{ width: '80px', display: 'inline-block' }}>Mã đơn:</span>
                                    <span>{invoice.code}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '2px' }}>
                                    <span style={{ width: '80px', display: 'inline-block' }}>Ngày giờ:</span>
                                    <span>{createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {createdDate.toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '2px' }}>
                                    <span style={{ width: '80px', display: 'inline-block' }}>Thu ngân:</span>
                                    <span>{cashierDisplayName || invoice.cashierName || '—'}</span>
                                </div>
                                {invoice.customerName && (
                                    <div style={{ display: 'flex', marginBottom: '2px' }}>
                                        <span style={{ width: '80px', display: 'inline-block' }}>Khách hàng:</span>
                                        <span>{invoice.customerName}</span>
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                                {/* Items */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Sản phẩm</th>
                                            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>T.Tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(invoice.items || []).map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                <tr>
                                                    <td colSpan={2} style={{ paddingTop: '4px', paddingBottom: '2px' }}>
                                                        {item.productName || `SP #${item.productId.slice(0, 8)}`}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ paddingBottom: '4px', color: '#555', paddingLeft: '8px' }}>
                                                        {Math.abs(item.quantity)} x {fmt(item.unitPrice)}
                                                    </td>
                                                    <td style={{ textAlign: 'right', paddingBottom: '4px' }}>{fmt(item.subtotal)}</td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

                                {/* Amount */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
                                    <span>SỐ TIỀN THANH TOÁN:</span>
                                    <span>{fmt(invoice.finalAmount)}</span>
                                </div>

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                                {/* QR Code */}
                                {qrValue && (
                                    <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                                        <div style={{ fontSize: '11px', marginBottom: '8px', fontWeight: 'bold' }}>
                                            QUÉT MÃ QR ĐỂ THANH TOÁN
                                        </div>
                                        <QRCodeSVG
                                            value={qrValue}
                                            size={180}
                                            level="M"
                                            style={{ display: 'block', margin: '0 auto' }}
                                        />
                                        <div style={{ fontSize: '10px', marginTop: '8px', color: '#555' }}>
                                            Thanh toán qua PayOS
                                        </div>
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>
                                <div style={{ textAlign: 'center', fontSize: '11px', color: '#555' }}>
                                    Hóa đơn sẽ được in sau khi thanh toán thành công
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Invoice Info */}
                                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', margin: '4px 0', textTransform: 'uppercase' }}>
                                    {invoice.type === 'RETURN' ? 'PHIẾU TRẢ HÀNG' : 'HÓA ĐƠN'}
                                </div>

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                                <div style={{ display: 'flex', marginBottom: '2px' }}>
                                    <span style={{ width: '80px', display: 'inline-block' }}>Số HD:</span>
                                    <span>{invoice.code}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '2px' }}>
                                    <span style={{ width: '80px', display: 'inline-block' }}>Ngày giờ:</span>
                                    <span>{createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {createdDate.toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '2px' }}>
                                    <span style={{ width: '80px', display: 'inline-block' }}>Thu ngân:</span>
                                    <span>{cashierDisplayName || invoice.cashierName || '—'}</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '2px' }}>
                                    <span style={{ width: '80px', display: 'inline-block' }}>Khách hàng:</span>
                                    <span>{invoice.customerName || 'Khách lẻ'}</span>
                                </div>

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                                {/* Items */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Sản phẩm</th>
                                            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>T.Tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(invoice.items || []).map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                <tr>
                                                    <td colSpan={2} style={{ paddingTop: '4px', paddingBottom: '2px' }}>
                                                        {item.productName || `SP #${item.productId.slice(0, 8)}`}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ paddingBottom: '4px', color: '#555', paddingLeft: '8px' }}>
                                                        {Math.abs(item.quantity)} x {fmt(item.unitPrice)}
                                                    </td>
                                                    <td style={{ textAlign: 'right', paddingBottom: '4px' }}>{fmt(item.subtotal)}</td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                                {/* Totals */}
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                        <span style={{ width: '110px', display: 'inline-block' }}>Tổng cộng:</span>
                                        <span>{fmt(invoice.totalAmount)}</span>
                                    </div>
                                    {(invoice.volumeDiscountAmt ?? 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span style={{ width: '110px', display: 'inline-block' }}>CK sản lượng:</span>
                                            <span>-{fmt(invoice.volumeDiscountAmt)}</span>
                                        </div>
                                    )}
                                    {(invoice.orderDiscountAmt ?? 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span style={{ width: '110px', display: 'inline-block' }}>CK đơn hàng:</span>
                                            <span>-{fmt(invoice.orderDiscountAmt)}</span>
                                        </div>
                                    )}
                                    {(invoice.couponDiscountAmt ?? 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span style={{ width: '110px', display: 'inline-block' }}>Mã KM:</span>
                                            <span>-{fmt(invoice.couponDiscountAmt)}</span>
                                        </div>
                                    )}
                                    {(invoice.volumeDiscountAmt ?? 0) === 0 && (invoice.orderDiscountAmt ?? 0) === 0 && (invoice.couponDiscountAmt ?? 0) === 0 && (invoice.discountAmount ?? 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span style={{ width: '110px', display: 'inline-block' }}>Giảm giá:</span>
                                            <span>-{fmt(invoice.discountAmount)}</span>
                                        </div>
                                    )}
                                    {(invoice.pointsUsed ?? 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span style={{ width: '110px', display: 'inline-block' }}>Dùng điểm:</span>
                                            <span>-{fmt((invoice.pointsUsed ?? 0) * 100)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                                        <span style={{ textTransform: 'uppercase' }}>THANH TOÁN:</span>
                                        <span>{fmt(invoice.finalAmount)}</span>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

                                {/* Payments */}
                                {invoice.payments && invoice.payments.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        {invoice.payments.map((p, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                <span style={{ width: '100px', display: 'inline-block' }}>Khách đưa:</span>
                                                <span>{fmt(p.amount)}</span>
                                            </div>
                                        ))}
                                        {changeAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                                <span style={{ width: '100px', display: 'inline-block' }}>Tiền trả lại:</span>
                                                <span>{fmt(changeAmount)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div style={{ textAlign: 'center', marginTop: '16px', color: '#666', fontSize: '11px' }}>
                                    (Thanh toán qua: {paymentLabel(invoice.payments?.[0]?.method || 'CASH')})
                                </div>

                                {/* Footer */}
                                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                                    Cảm ơn quý khách!
                                </div>

                                {/* Note */}
                                {invoice.note && (
                                    <div style={{ fontSize: '10px', marginTop: '16px', fontStyle: 'italic', textAlign: 'center' }}>
                                        Ghi chú: {invoice.note}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Box>
                {mode === 'qr-slip' && waitingPayment ? (
                    <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1.5 }}>
                            <CircularProgress size={20} sx={{ color: '#f59e0b' }} />
                            <Typography fontSize={14} fontWeight={600} color="#92400e">
                                Đang chờ khách hàng thanh toán...
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                onClick={onClose}
                                variant="outlined"
                                sx={{ flex: 1, textTransform: 'none', color: '#555', borderColor: '#ccc', borderRadius: 2, fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                                Hủy đơn
                            </Button>
                            <Button
                                startIcon={<Print sx={{ fontSize: 14 }} />}
                                onClick={handlePrint}
                                variant="outlined"
                                sx={{ flex: 1, textTransform: 'none', borderRadius: 2, fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                                In lại QR
                            </Button>
                            {onConfirmPayment && (
                                <Button
                                    startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                                    onClick={onConfirmPayment}
                                    variant="contained"
                                    sx={{ flex: 1.4, textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: 12, whiteSpace: 'nowrap', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                                >
                                    Kiểm tra TT
                                </Button>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', color: '#555', borderColor: '#ccc', borderRadius: 2 }}>
                            {mode === 'qr-slip' ? 'Hủy đơn' : 'Đóng'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Print />}
                            onClick={handlePrint}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                        >
                            {mode === 'qr-slip' ? 'In phiếu QR' : 'In hóa đơn (F10)'}
                        </Button>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PrintInvoiceDialog;
