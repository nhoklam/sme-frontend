import React, { useRef } from 'react';
import { Dialog, DialogContent, Box, Button } from '@mui/material';
import { Print } from '@mui/icons-material';

interface PrintShippingLabelDialogProps {
    open: boolean;
    onClose: () => void;
    order: any | null;
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
}

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(n ?? 0);

const PrintShippingLabelDialog: React.FC<PrintShippingLabelDialogProps> = ({
    open, onClose, order,
    storeName = 'SME BOOKSTORE',
    storeAddress = '123 Đường CRM, TP. Hồ Chí Minh',
    storePhone = '0123 456 789',
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!order) return null;

    const isCOD = order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID';
    const codAmount = isCOD ? order.finalAmount : 0;
    
    // Calculate total quantity of items
    const totalQuantity = (order.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const printWindow = window.open('', '_blank', 'width=600,height=800');
        if (!printWindow) return;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Phiếu gửi hàng ${order.code}</title>
                <style>
                    @page { margin: 0; size: 100mm 150mm; }
                    * { box-sizing: border-box; }
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        width: 100mm;
                        height: 150mm;
                        padding: 3mm;
                        color: #000;
                        margin: 0;
                    }
                    .container {
                        border: 2px solid #000;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        background-color: #fff;
                    }
                    .section {
                        border-bottom: 2px solid #000;
                        padding: 6px 8px;
                    }
                    .barcode-container {
                        text-align: center;
                        padding: 10px 0;
                        border-bottom: 2px dashed #000;
                    }
                    .barcode-container img {
                        height: 50px;
                        max-width: 90%;
                    }
                    .order-code {
                        font-size: 14px;
                        font-weight: bold;
                        margin-top: 4px;
                        letter-spacing: 1px;
                    }
                    .address-section {
                        display: flex;
                        border-bottom: 2px dashed #000;
                    }
                    .sender, .receiver {
                        flex: 1;
                        padding: 6px 8px;
                    }
                    .receiver {
                        border-left: 2px solid #000;
                    }
                    .title {
                        font-size: 11px;
                        color: #555;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                        font-weight: bold;
                    }
                    .name {
                        font-size: 13px;
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .receiver .name {
                        font-size: 15px;
                    }
                    .phone {
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .address {
                        font-size: 11px;
                        line-height: 1.3;
                    }
                    .cod-section {
                        display: flex;
                        align-items: center;
                        padding: 12px 8px;
                        border-bottom: 2px solid #000;
                    }
                    .cod-box {
                        flex: 1;
                        text-align: center;
                    }
                    .cod-title {
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 4px;
                    }
                    .cod-amount {
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .signature-box {
                        flex: 1;
                        border-left: 2px dashed #000;
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        min-height: 60px;
                    }
                    .signature-title {
                        font-size: 11px;
                        font-weight: bold;
                    }
                    .signature-space {
                        font-size: 10px;
                        color: #888;
                        margin-top: auto;
                    }
                    .items-section {
                        padding: 6px 8px;
                        flex: 1;
                    }
                    .items-title {
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 6px;
                    }
                    .item-row {
                        font-size: 11px;
                        margin-bottom: 4px;
                        display: flex;
                    }
                    .item-qty {
                        font-weight: bold;
                        width: 20px;
                    }
                    .item-name {
                        flex: 1;
                    }
                    .footer-note {
                        text-align: center;
                        font-size: 11px;
                        font-weight: bold;
                        padding: 6px;
                        border-top: 2px solid #000;
                        background-color: #f9f9f9;
                    }
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
        }, 800); // Give barcode image more time to load
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, bgcolor: '#e5e7eb', maxHeight: '80vh', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                    {/* Printable Content */}
                    <Box ref={printRef} sx={{
                        bgcolor: '#fff',
                        width: '100mm',
                        height: '150mm',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#000',
                        position: 'relative',
                        boxSizing: 'border-box'
                    }}>
                        <div className="container" style={{ border: '2px solid #000', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                            
                            {/* Barcode Section */}
                            <div className="barcode-container" style={{ textAlign: 'center', padding: '12px 0', borderBottom: '2px dashed #000' }}>
                                <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.code}&scaleX=2&scaleY=1&includetext=false`} alt="barcode" style={{ height: 45, maxWidth: '90%' }} />
                                <div className="order-code" style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 }}>
                                    MÃ ĐƠN: {order.code}
                                </div>
                            </div>
                            
                            {/* Address Section */}
                            <div className="address-section" style={{ display: 'flex', borderBottom: '2px dashed #000' }}>
                                <div className="sender" style={{ flex: 1, padding: '8px' }}>
                                    <div className="title" style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', fontWeight: 'bold' }}>TỪ:</div>
                                    <div className="name" style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}>{storeName}</div>
                                    <div className="phone" style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>{storePhone}</div>
                                    <div className="address" style={{ fontSize: 11, lineHeight: 1.3 }}>{storeAddress}</div>
                                </div>
                                <div className="receiver" style={{ flex: 1.3, borderLeft: '2px solid #000', padding: '8px' }}>
                                    <div className="title" style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', fontWeight: 'bold' }}>ĐẾN:</div>
                                    <div className="name" style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>{order.customerName}</div>
                                    <div className="phone" style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>{order.customerPhone}</div>
                                    <div className="address" style={{ fontSize: 12, lineHeight: 1.3 }}>{order.shippingAddress || '—'}</div>
                                    {order.note && <div style={{ fontSize: 11, fontStyle: 'italic', marginTop: 4, color: '#444' }}>Ghi chú: {order.note}</div>}
                                </div>
                            </div>

                            {/* COD Section */}
                            <div className="cod-section" style={{ display: 'flex', alignItems: 'center', padding: '12px 8px', borderBottom: '2px solid #000' }}>
                                <div className="cod-box" style={{ flex: 1.5, textAlign: 'center' }}>
                                    <div className="cod-title" style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>TIỀN THU NGƯỜI NHẬN:</div>
                                    <div className="cod-amount" style={{ fontSize: 24, fontWeight: 'bold' }}>
                                        {isCOD ? fmt(codAmount) : '0 VNĐ'}
                                    </div>
                                    {!isCOD && <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>(Người gửi đã thanh toán)</div>}
                                </div>
                                <div className="signature-box" style={{ flex: 1, borderLeft: '2px dashed #000', textAlign: 'center', display: 'flex', flexDirection: 'column', minHeight: 60, paddingLeft: 8 }}>
                                    <div className="signature-title" style={{ fontSize: 11, fontWeight: 'bold' }}>Chữ ký người nhận</div>
                                    <div className="signature-space" style={{ fontSize: 10, color: '#555', marginTop: 'auto', paddingTop: 20 }}>Xác nhận hàng nguyên vẹn</div>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div className="items-section" style={{ padding: '8px', flex: 1 }}>
                                <div className="items-title" style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>
                                    Nội dung hàng (Tổng SL: {totalQuantity}):
                                </div>
                                {(order.items || []).map((item: any, idx: number) => (
                                    <div className="item-row" key={idx} style={{ fontSize: 11, marginBottom: 4, display: 'flex' }}>
                                        <div className="item-name" style={{ flex: 1 }}>{idx + 1}. {item.productName || `SP #${item.productId?.slice(0, 8)}`}</div>
                                        <div className="item-qty" style={{ fontWeight: 'bold', marginLeft: 8 }}>SL: {item.quantity}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Note */}
                            <div className="footer-note" style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', padding: '8px', borderTop: '2px solid #000', backgroundColor: '#f0f0f0' }}>
                                Không cho xem hàng - Quay video khi mở kiện
                            </div>
                            
                        </div>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', color: '#555', borderColor: '#ccc', borderRadius: 2 }}>
                        Đóng
                    </Button>
                    <Button variant="contained" startIcon={<Print />} onClick={handlePrint} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                        In tem gửi hàng (100x150)
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default PrintShippingLabelDialog;
