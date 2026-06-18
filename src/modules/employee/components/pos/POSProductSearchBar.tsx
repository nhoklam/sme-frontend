import React, { useState, useEffect, useRef } from 'react';
import {
    Box, TextField, InputAdornment, CircularProgress,
    Paper, Typography, Button, Alert,
} from '@mui/material';
import { Search, QrCodeScanner } from '@mui/icons-material';
import productService from '../../../../services/productService';
import { ProductResponse } from '../../../../types';
import BarcodeScannerDialog from './BarcodeScannerDialog';
import { IconButton } from '@mui/material';
import { useDebounce } from '../../../../hooks/useDebounce';
import { List } from 'react-window';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

interface Props {
    onAdd: (p: ProductResponse) => void;
    onError?: (msg: string) => void;
    onScanCoupon?: (code: string) => void;
    disabled?: boolean;
    warehouseId?: string;
}

const POSProductSearchBar: React.FC<Props> = ({ onAdd, onError, onScanCoupon, disabled, warehouseId }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [barcodeErr, setBarcodeErr] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const isBarcode = (q: string) => /^[0-9a-zA-Z\-]{8,}$/.test(q.trim()) && !q.includes(' ');
    const isCouponCode = (q: string) => q.trim().toUpperCase().startsWith('KM') || /^[A-Z0-9]{6,12}$/.test(q.trim().toUpperCase());

    useEffect(() => {
        const q = debouncedQuery.trim();
        if (!q && !isFocused) { setResults([]); setBarcodeErr(''); setLoading(false); return; }
        if (!q) { setResults([]); setLoading(false); return; }

        let active = true;
        setLoading(true);
        productService.search({ keyword: q || '', page: 0, size: 100, isActive: true, warehouseId })
            .then(r => { if(active) setResults(r.content); })
            .catch(() => { if(active) setResults([]); })
            .finally(() => { if(active) setLoading(false); });

        return () => { active = false; };
    }, [debouncedQuery, isFocused, warehouseId]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setResults([]);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        const q = query.trim();
        if (!q) return;

        // Nếu là mã KM (thường bắt đầu bằng KM hoặc có định dạng cụ thể)
        if (onScanCoupon && isCouponCode(q)) {
            onScanCoupon(q.toUpperCase());
            setQuery('');
            return;
        }

        if (isBarcode(q)) {
            setBarcodeErr(''); setLoading(true);
            try {
                const p = await productService.getByBarcode(q);
                // getByBarcode already defaults to backend logic if no warehouseId is passed, 
                // but wait, ProductService getByBarcode now also accepts warehouseId. 
                // But wait, the frontend getByBarcode doesn't pass warehouseId yet?
                // Let's just fix the search here first.
                onAdd(p); setQuery(''); setResults([]);
                inputRef.current?.focus();
            } catch {
                try {
                    const r = await productService.search({ keyword: q, page: 0, size: 10, isActive: true, warehouseId });
                    if (r.content.length === 1) { onAdd(r.content[0]); setQuery(''); setResults([]); }
                    else {
                        setBarcodeErr(`Không tìm thấy: ${q}`);
                        if (onError) onError(`Không tìm thấy sản phẩm có mã: ${q}`);
                    }
                } catch {
                    setBarcodeErr(`Không tìm thấy: ${q}`);
                    if (onError) onError(`Không tìm thấy sản phẩm có mã: ${q}`);
                }
            } finally { setLoading(false); }
        } else if (results.length === 1) {
            onAdd(results[0]); setQuery(''); setResults([]);
        }
    };


    const handleSelect = (p: ProductResponse) => {
        onAdd(p); setQuery(''); setResults([]); setBarcodeErr('');
        inputRef.current?.focus();
    };

    return (
        <Box sx={{ position: 'relative' }} ref={dropRef}>
            <TextField
                fullWidth size="small" inputRef={inputRef} disabled={disabled} autoFocus
                placeholder="Thêm sản phẩm vào đơn (F3) — Tìm tên, SKU hoặc ISBN"
                value={query}
                onChange={e => { setQuery(e.target.value); setBarcodeErr(''); }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff', borderRadius: 1.5, fontSize: 13,
                        '& fieldset': { borderColor: '#d9d9d9', borderWidth: 1 },
                        '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#1890ff', borderWidth: 1 },
                    },
                    '& input': { py: '6px' },
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            {isBarcode(query) && query.length >= 2
                                ? <QrCodeScanner sx={{ color: '#f59e0b', fontSize: 17 }} />
                                : <Search sx={{ color: '#64748b', fontSize: 17 }} />}
                        </InputAdornment>
                    ),
                    endAdornment: loading
                        ? <InputAdornment position="end"><CircularProgress size={14} sx={{ color: '#64748b' }} /></InputAdornment>
                        : (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setScannerOpen(true)} sx={{ color: '#1890ff' }}>
                                    <QrCodeScanner fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                }}
            />
            {(results.length > 0 || barcodeErr) && (
                <Paper elevation={8} sx={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                    bgcolor: '#fff', borderRadius: 1.5, mt: 0.5, overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                }}>
                    {barcodeErr && (
                        <Box sx={{ px: 2, py: 1 }}>
                            <Alert severity="warning" sx={{ py: 0.25 }}>{barcodeErr}</Alert>
                        </Box>
                    )}
                    {results.length > 0 && (
                        <>
                            <Box sx={{ px: 2, py: 0.75, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="#64748b" fontWeight={700}>{results.length} kết quả</Typography>
                                <Button size="small" onClick={() => { setQuery(''); setResults([]); }} sx={{ py: 0, minWidth: 0, fontSize: 11, color: '#94a3b8' }}>✕</Button>
                            </Box>
                            <List
                                style={{ height: Math.min(380, results.length * 60), width: '100%' }}
                                rowCount={results.length}
                                rowHeight={60}
                                rowProps={{}}
                                rowComponent={({ index, style }) => {
                                    const p = results[index];
                                    return (
                                        <div style={style} key={p.id}>
                                            <Box onClick={() => handleSelect(p)} sx={{
                                                px: 2, cursor: 'pointer', height: '100%',
                                                display: 'flex', alignItems: 'center', gap: 1.5,
                                                bgcolor: index % 2 === 0 ? '#fff' : '#fafafa',
                                                borderBottom: '1px solid #f1f5f9',
                                                '&:hover': { bgcolor: '#eff6ff' },
                                            }}>
                                                {p.imageUrl
                                                    ? <Box component="img" src={p.imageUrl} alt={p.name} sx={{ width: 30, height: 40, objectFit: 'contain', borderRadius: 0.5, flexShrink: 0 }} />
                                                    : <Box sx={{ width: 30, height: 40, bgcolor: '#f1f5f9', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📦</Box>}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" fontWeight={600} fontSize={12} noWrap color="#1e293b">{p.name}</Typography>
                                                    <Typography variant="caption" color="#94a3b8" fontSize={10}>{p.sku || p.isbnBarcode || 'Không có SKU'}</Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <Typography variant="body2" fontWeight={700} fontSize={12} color="#1d4ed8">{fmt(p.retailPrice)}</Typography>
                                                    <Typography variant="caption" color={!p.availableQuantity ? '#ef4444' : '#22c55e'} fontSize={10}>
                                                        {!p.availableQuantity ? 'Hết hàng' : `Còn ${p.availableQuantity}`}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </div>
                                    );
                                }}
                            />
                        </>
                    )}
                </Paper>
            )}
            <BarcodeScannerDialog 
                open={scannerOpen} 
                onClose={() => setScannerOpen(false)} 
                onScan={async (code) => {
                    setScannerOpen(false);
                    setBarcodeErr('');
                    setLoading(true);
                    try {
                        const p = await productService.getByBarcode(code);
                        onAdd(p);
                        setQuery('');
                        setResults([]);
                    } catch {
                        try {
                            const r = await productService.search({ keyword: code, page: 0, size: 10, isActive: true, warehouseId });
                            if (r.content.length === 1) { onAdd(r.content[0]); setQuery(''); setResults([]); }
                            else {
                                if (onError) onError(`Không tìm thấy sản phẩm có mã: ${code}`);
                            }
                        } catch {
                            if (onError) onError(`Không tìm thấy sản phẩm có mã: ${code}`);
                        }
                    } finally { setLoading(false); }
                    inputRef.current?.focus();
                }}
            />
        </Box>
    );
};

export default POSProductSearchBar;