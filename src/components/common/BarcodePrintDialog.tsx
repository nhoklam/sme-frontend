import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, IconButton, Typography, Box, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Paper
} from '@mui/material';
import { Close, Print } from '@mui/icons-material';
import JsBarcode from 'jsbarcode';

const fmtCurrency = (n?: number) =>
    n == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export interface BarcodePrintItem {
    id?: string;
    name: string;
    sku: string;
    barcode: string;
    price: number;
    imageUrl?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    items: BarcodePrintItem[];
}

const BarcodePrintDialog: React.FC<Props> = ({ open, onClose, items }) => {
    const [printList, setPrintList] = useState<(BarcodePrintItem & { quantity: number })[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');

    useEffect(() => {
        if (open) {
            setPrintList(items.map(i => ({ ...i, quantity: 1 })));
        }
    }, [open, items]);

    const firstItem = printList[0];

    useEffect(() => {
        if (firstItem?.barcode && canvasRef.current) {
            try {
                JsBarcode(canvasRef.current, firstItem.barcode, {
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 12,
                    margin: 5,
                    background: '#fff',
                });
                setBarcodeDataUrl(canvasRef.current.toDataURL());
            } catch (e) {
                console.error(e);
            }
        }
    }, [firstItem?.barcode]);

    const handleQuantityChange = (idx: number, qty: number) => {
        const newList = [...printList];
        newList[idx].quantity = Math.max(1, qty);
        setPrintList(newList);
    };

    const handleRemove = (idx: number) => {
        const newList = [...printList];
        newList.splice(idx, 1);
        setPrintList(newList);
    };

    const handlePrint = () => {
        if (printList.length === 0) return;
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        let labelsHtml = '';
        printList.forEach(item => {
            const canvas = document.createElement('canvas');
            try {
                JsBarcode(canvas, item.barcode, { width: 1.5, height: 40, displayValue: true, fontSize: 12, margin: 5, background: '#fff' });
                const dataUrl = canvas.toDataURL();
                for (let i = 0; i < item.quantity; i++) {
                    labelsHtml += `
                        <div class="label">
                            <div class="name">${item.name}</div>
                            <img src="${dataUrl}" />
                            <div class="price">${fmtCurrency(item.price)}</div>
                        </div>
                    `;
                }
            } catch (e) {}
        });

        printWindow.document.write(`
            <html>
            <head>
                <title>In mã vạch</title>
                <style>
                    body { margin: 0; padding: 0; font-family: sans-serif; }
                    .print-container { display: flex; flex-wrap: wrap; gap: 10px; padding: 10px; }
                    .label {
                        width: 40mm; height: 30mm; border: 1px dashed #ccc; padding: 2mm; box-sizing: border-box;
                        display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-inside: avoid;
                    }
                    .name { font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; margin-bottom: 2px; }
                    .price { font-size: 12px; font-weight: bold; margin-top: 2px; }
                    img { max-width: 100%; height: auto; }
                    @media print { .label { border: none; } }
                </style>
            </head>
            <body>
                <div class="print-container">${labelsHtml}</div>
                <script>window.onload=function(){setTimeout(()=>{window.print();window.close();},250);};</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (items.length === 0 && !open) return null;
    const totalQuantity = printList.reduce((acc, curr) => acc + curr.quantity, 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 2, px: 3 }}>
                <Typography variant="h6" fontWeight={700} fontSize={18}>In tem mã vạch</Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: '#999' }}><Close fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: '0 !important' }}>
                <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                    <TableContainer sx={{ border: 'none' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, borderBottom: '1px solid #e0e0e0', color: '#555' }}>Ảnh</TableCell>
                                    <TableCell sx={{ fontWeight: 600, borderBottom: '1px solid #e0e0e0', color: '#555' }}>Sản phẩm</TableCell>
                                    <TableCell sx={{ fontWeight: 600, borderBottom: '1px solid #e0e0e0', color: '#555' }}>Barcode</TableCell>
                                    <TableCell sx={{ fontWeight: 600, borderBottom: '1px solid #e0e0e0', color: '#555' }}>Giá bán</TableCell>
                                    <TableCell sx={{ fontWeight: 600, borderBottom: '1px solid #e0e0e0', color: '#555', width: 100 }}>Số tem</TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #e0e0e0', width: 40 }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {printList.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell sx={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <Box sx={{ width: 40, height: 40, bgcolor: '#f1f5f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} /> : <Typography fontSize={18}>📦</Typography>}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <Typography variant="body2" fontWeight={600} color="#333">{item.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">SKU: {item.sku || '—'}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid #f0f0f0', fontFamily: 'monospace', color: '#555' }}>{item.barcode}</TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#333' }}>{fmtCurrency(item.price)}</TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <TextField 
                                                type="number" 
                                                size="small" 
                                                value={item.quantity} 
                                                onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                                                inputProps={{ min: 1, style: { padding: '6px', textAlign: 'center', borderRadius: 4 } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <IconButton size="small" onClick={() => handleRemove(idx)} sx={{ color: '#ef4444' }}>
                                                <Typography fontSize={16}>🗑️</Typography>
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="body2" sx={{ mt: 2, color: '#555' }}>
                        Tổng số tem: <span style={{ fontWeight: 600, color: '#000' }}>{totalQuantity}</span>
                    </Typography>

                    {firstItem && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} mb={1}>Tem mã vạch</Typography>
                            <Box sx={{ bgcolor: '#fafafa', p: 3, borderRadius: 2, border: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
                                <Box sx={{ p: 2, borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content', bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <Typography variant="caption" fontWeight={700} sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mb: 0.5 }}>
                                        {firstItem.name}
                                    </Typography>
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    {barcodeDataUrl && <img src={barcodeDataUrl} alt="barcode" style={{ maxWidth: '100%', height: 60 }} />}
                                    <Typography variant="subtitle2" fontWeight={800} mt={0.5}>
                                        {fmtCurrency(firstItem.price)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', color: '#555', borderColor: '#ccc', borderRadius: 2 }}>Đóng</Button>
                <Button onClick={handlePrint} variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, bgcolor: '#1d4ed8' }}>In tem</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BarcodePrintDialog;
