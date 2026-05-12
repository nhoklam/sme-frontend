import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Box, Button } from '@mui/material';
import { Print } from '@mui/icons-material';

interface BarcodeGeneratorProps {
    value: string;
    width?: number;
    height?: number;
    format?: string;
    displayValue?: boolean;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
    value,
    width = 2,
    height = 50,
    format = 'CODE128',
    displayValue = true,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            try {
                JsBarcode(canvasRef.current, value, {
                    width,
                    height,
                    format,
                    displayValue,
                    fontSize: 14,
                    margin: 10,
                });
            } catch (e) {
                console.error('Barcode generation error:', e);
            }
        }
    }, [value, width, height, format, displayValue]);

    const handlePrint = () => {
        if (!canvasRef.current) return;
        
        const dataUrl = canvasRef.current.toDataURL();
        const windowContent = `
            <!DOCTYPE html>
            <html>
            <head><title>Print Barcode</title></head>
            <body style="display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
                <img src="${dataUrl}" style="max-width:100%;" />
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                </script>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank', 'width=400,height=300');
        if (printWindow) {
            printWindow.document.write(windowContent);
            printWindow.document.close();
        }
    };

    if (!value) return null;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
            </Box>
            <Button
                variant="outlined"
                size="small"
                startIcon={<Print />}
                onClick={handlePrint}
                sx={{ textTransform: 'none', borderRadius: 1.5 }}
            >
                In mã vạch
            </Button>
        </Box>
    );
};

export default BarcodeGenerator;
