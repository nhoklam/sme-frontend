import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, LinearProgress,
    FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { UploadFile, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import productService from '../../../../services/productService';
import { CreateProductRequest } from '../../../../types';

interface ProductImportDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: any[];
    suppliers: any[];
}

export default function ProductImportDialog({ open, onClose, onSuccess, categories, suppliers }: ProductImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<{ success: number; error: number; details: string[] } | null>(null);

    const [defaultCategory, setDefaultCategory] = useState<string>('');
    const [defaultSupplier, setDefaultSupplier] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFile(selected);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setPreviewData(data);
            setResults(null);
            setProgress(0);
        };
        reader.readAsBinaryString(selected);
    };

    const handleImport = async () => {
        if (!defaultCategory) {
            alert('Vui lòng chọn danh mục mặc định cho các sản phẩm import.');
            return;
        }

        setImporting(true);
        let success = 0;
        let error = 0;
        const details: string[] = [];

        for (let i = 0; i < previewData.length; i++) {
            const row = previewData[i];
            try {
                // Map columns - adjust these based on expected Excel template
                const name = row['Tên sản phẩm'] || row['Name'] || '';
                const barcode = row['Mã vạch/ISBN'] || row['Barcode'] || row['ISBN'] || '';
                
                if (!name || !barcode) {
                    throw new Error('Thiếu Tên sản phẩm hoặc Mã vạch');
                }

                const req: CreateProductRequest = {
                    name: String(name),
                    isbnBarcode: String(barcode),
                    sku: row['SKU'] ? String(row['SKU']) : undefined,
                    retailPrice: Number(row['Giá bán lẻ'] || row['Retail Price'] || 0),
                    wholesalePrice: row['Giá sỉ'] ? Number(row['Giá sỉ']) : undefined,
                    unit: row['Đơn vị tính'] || row['Unit'] || 'Cuốn',
                    weight: row['Trọng lượng (g)'] ? Number(row['Trọng lượng (g)']) : undefined,
                    author: row['Tác giả'] ? String(row['Tác giả']) : undefined,
                    publisher: row['Nhà xuất bản'] ? String(row['Nhà xuất bản']) : undefined,
                    publishYear: row['Năm xuất bản'] ? Number(row['Năm xuất bản']) : undefined,
                    numberOfPages: row['Số trang'] ? Number(row['Số trang']) : undefined,
                    description: row['Mô tả'] || row['Description'] || '',
                    categoryId: defaultCategory,
                    supplierId: defaultSupplier || undefined
                };

                await productService.create(req);
                success++;
            } catch (err: any) {
                error++;
                details.push(`Dòng ${i + 2}: ${err.response?.data?.message || err.message}`);
            }
            setProgress(Math.round(((i + 1) / previewData.length) * 100));
        }

        setResults({ success, error, details });
        setImporting(false);
        if (success > 0) {
            onSuccess();
        }
    };

    const handleClose = () => {
        if (importing) return;
        setFile(null);
        setPreviewData([]);
        setResults(null);
        setProgress(0);
        onClose();
    };

    const downloadTemplate = () => {
        const template = [
            {
                'Tên sản phẩm': 'Sách Đắc Nhân Tâm',
                'Mã vạch/ISBN': '9786043236056',
                'SKU': 'SA001',
                'Giá bán lẻ': 85000,
                'Giá sỉ': 70000,
                'Đơn vị tính': 'Cuốn',
                'Tác giả': 'Dale Carnegie',
                'Nhà xuất bản': 'NXB Tổng hợp TP.HCM',
                'Năm xuất bản': 2023,
                'Số trang': 320,
                'Trọng lượng (g)': 200,
                'Mô tả': 'Sách kỹ năng sống'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Product_Import_Template.xlsx');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Import Sản phẩm từ Excel</DialogTitle>
            <DialogContent dividers>
                {!importing && !results && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Tải file Excel mẫu để điền thông tin sản phẩm. Đảm bảo các cột tên đúng như template.
                        </Typography>
                        <Button variant="outlined" size="small" onClick={downloadTemplate} sx={{ mb: 2 }}>
                            Tải Template Excel
                        </Button>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Danh mục mặc định *</InputLabel>
                                <Select
                                    value={defaultCategory}
                                    onChange={(e) => setDefaultCategory(e.target.value)}
                                    label="Danh mục mặc định *"
                                >
                                    {categories.filter(c => c.isActive).map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Nhà cung cấp</InputLabel>
                                <Select
                                    value={defaultSupplier}
                                    onChange={(e) => setDefaultSupplier(e.target.value)}
                                    label="Nhà cung cấp"
                                >
                                    <MenuItem value="">-- Không chọn --</MenuItem>
                                    {suppliers.map(s => (
                                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<UploadFile />}
                            sx={{ bgcolor: '#2563eb' }}
                        >
                            Chọn File Excel
                            <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
                        </Button>
                        {file && <Typography variant="caption" sx={{ ml: 2 }}>{file.name}</Typography>}
                    </Box>
                )}

                {previewData.length > 0 && !importing && !results && (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tên sản phẩm</TableCell>
                                    <TableCell>Mã vạch</TableCell>
                                    <TableCell>Giá bán lẻ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {previewData.slice(0, 5).map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{row['Tên sản phẩm'] || row['Name']}</TableCell>
                                        <TableCell>{row['Mã vạch/ISBN'] || row['Barcode']}</TableCell>
                                        <TableCell>{row['Giá bán lẻ']}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {previewData.length > 5 && (
                            <Typography variant="caption" sx={{ p: 1, display: 'block', textAlign: 'center' }}>
                                ... và {previewData.length - 5} sản phẩm khác
                            </Typography>
                        )}
                    </TableContainer>
                )}

                {importing && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" mb={2}>Đang Import... {progress}%</Typography>
                        <LinearProgress variant="determinate" value={progress} />
                    </Box>
                )}

                {results && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Đã xử lý xong {previewData.length} sản phẩm.
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Paper sx={{ p: 2, flex: 1, bgcolor: '#ecfdf5', border: '1px solid #10b981' }}>
                                <Typography variant="subtitle2" color="#065f46" display="flex" alignItems="center" gap={1}>
                                    <CheckCircle fontSize="small" /> Thành công: {results.success}
                                </Typography>
                            </Paper>
                            <Paper sx={{ p: 2, flex: 1, bgcolor: '#fef2f2', border: '1px solid #ef4444' }}>
                                <Typography variant="subtitle2" color="#991b1b" display="flex" alignItems="center" gap={1}>
                                    <ErrorIcon fontSize="small" /> Thất bại: {results.error}
                                </Typography>
                            </Paper>
                        </Box>
                        {results.details.length > 0 && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1, maxHeight: 150, overflowY: 'auto' }}>
                                <Typography variant="caption" color="error" fontWeight="bold">Chi tiết lỗi:</Typography>
                                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '13px', color: '#dc2626' }}>
                                    {results.details.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={importing} color="inherit">Đóng</Button>
                {!results && (
                    <Button
                        onClick={handleImport}
                        disabled={!file || importing || previewData.length === 0}
                        variant="contained"
                        color="primary"
                    >
                        Bắt đầu Import
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
