import React, { useState, useEffect, useRef } from 'react';
import {
    Box, TextField, InputAdornment, CircularProgress,
    Paper, Typography, Button, Alert,
} from '@mui/material';
import { Search, QrCodeScanner } from '@mui/icons-material';
import productService from '../../../../services/productService';
import { ProductResponse } from '../../../../types';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

interface Props {
    onAdd: (p: ProductResponse) => void;
    onScanCoupon?: (code: string) => void;
    disabled?: boolean;
}

const POSProductSearchBar: React.FC<Props> = ({ onAdd, onScanCoupon, disabled }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [barcodeErr, setBarcodeErr] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const isBarcode = (q: string) => /^[0-9a-zA-Z\-]{8,}$/.test(q.trim()) && !q.includes(' ');
    const isCouponCode = (q: string) => q.trim().toUpperCase().startsWith('KM') || /^[A-Z0-9]{6,12}$/.test(q.trim().toUpperCase());

    useEffect(() => {
        const q = query.trim();
        if (isBarcode(q)) { setResults([]); setBarcodeErr(''); return; }
        if (!q && !isFocused) { setResults([]); setBarcodeErr(''); return; }

        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const r = await productService.search({ keyword: q || '', page: 0, size: 15, isActive: true });
                setResults(r.content);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 220);
        return () => clearTimeout(t);
    }, [query, isFocused]);

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
                onAdd(p); setQuery(''); setResults([]);
                inputRef.current?.focus();
            } catch {
                try {
                    const r = await productService.search({ keyword: q, page: 0, size: 10, isActive: true });
                    if (r.content.length === 1) { onAdd(r.content[0]); setQuery(''); setResults([]); }
                    else if (r.content.length > 1) setResults(r.content);
                    else setBarcodeErr(`Không tìm thấy: ${q}`);
                } catch { setBarcodeErr(`Không tìm thấy: ${q}`); }
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
                placeholder="Thêm sản phẩm vào đơn (F3) — Tìm tên hoặc quét ISBN"
                value={query}
                onChange={e => { setQuery(e.target.value); setBarcodeErr(''); }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 1.5, fontSize: 13,
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#fff', borderWidth: 2 },
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
                        : undefined,
                }}
            />
            {(results.length > 0 || barcodeErr) && (
                <Paper elevation={8} sx={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                    bgcolor: '#fff', borderRadius: 1.5, mt: 0.5, maxHeight: 380, overflowY: 'auto',
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
                            {results.map((p, i) => (
                                <Box key={p.id} onClick={() => handleSelect(p)} sx={{
                                    px: 2, py: 0.875, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                                    borderBottom: '1px solid #f1f5f9',
                                    '&:hover': { bgcolor: '#eff6ff' },
                                }}>
                                    {p.imageUrl
                                        ? <Box component="img" src={p.imageUrl} alt={p.name} sx={{ width: 30, height: 40, objectFit: 'contain', borderRadius: 0.5, flexShrink: 0 }} />
                                        : <Box sx={{ width: 30, height: 40, bgcolor: '#f1f5f9', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📦</Box>}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight={600} fontSize={12} noWrap color="#1e293b">{p.name}</Typography>
                                        <Typography variant="caption" color="#94a3b8" fontSize={10}>{p.isbnBarcode}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                        <Typography variant="body2" fontWeight={700} fontSize={12} color="#1d4ed8">{fmt(p.retailPrice)}</Typography>
                                        <Typography variant="caption" color={!p.availableQuantity ? '#ef4444' : '#22c55e'} fontSize={10}>
                                            {!p.availableQuantity ? 'Hết hàng' : `Còn ${p.availableQuantity}`}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default POSProductSearchBar;