import React, { useState, useEffect, useRef } from 'react';
import {
    Box, TextField, InputAdornment, CircularProgress,
    Paper, Typography, IconButton, Chip, Avatar, Tooltip,
} from '@mui/material';
import { Search, Close, CheckCircle } from '@mui/icons-material';
import customerService from '../../../../services/customerService';
import { Customer } from '../../../../types';

const TIER_COLOR: Record<string, string> = {
    GOLD: '#f59e0b', SILVER: '#94a3b8', STANDARD: '#64748b',
};

interface Props {
    customer: Customer | null;
    onSelect: (c: Customer | null) => void;
    inputRef?: React.RefObject<HTMLInputElement>;
}

const InlineCustomerSearch: React.FC<Props> = ({ customer, onSelect, inputRef: externalRef }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [defaultCustomers, setDefaultCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDrop, setShowDrop] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = externalRef ?? internalRef;

    useEffect(() => {
        const loadDefault = async () => {
            try {
                const r = await customerService.search({ keyword: '', page: 0, size: 5 });
                setDefaultCustomers(r.content ?? []);
            } catch { }
        };
        loadDefault();
    }, []);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 1) { setResults([]); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const r = await customerService.search({ keyword: q, page: 0, size: 8 });
                setResults(r.content ?? []);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 280);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setShowDrop(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    if (customer) {
        return (
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                p: 1, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe',
            }}>
                <Box sx={{
                    width: 28, height: 28, bgcolor: '#2563eb', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#fff', fontWeight: 800, flexShrink: 0,
                }}>
                    {customer.fullName.charAt(0)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} fontSize={12} noWrap color="#1e293b">
                        {customer.fullName}
                    </Typography>
                    <Typography variant="caption" color="#64748b" fontSize={10}>
                        {customer.loyaltyPoints} điểm · {customer.customerTier}
                    </Typography>
                </Box>
                <Tooltip title="Bỏ chọn khách">
                    <IconButton size="small" onClick={() => onSelect(null)}
                        sx={{ p: 0.3, color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                        <Close sx={{ fontSize: 13 }} />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    return (
        <Box ref={containerRef} sx={{ position: 'relative' }}>
            <TextField
                fullWidth size="small"
                inputRef={inputRef}
                autoComplete="off"
                placeholder="Tìm tên hoặc số điện thoại..."
                value={query}
                onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            {loading
                                ? <CircularProgress size={13} sx={{ color: '#3b82f6' }} />
                                : <Search sx={{ fontSize: 15, color: '#94a3b8' }} />}
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        fontSize: 12,
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#93c5fd' },
                        '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                    },
                    '& input': { py: '6px' },
                }}
            />
            {showDrop && (
                <Paper elevation={10} sx={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                    borderRadius: 1.5, mt: 0.5, maxHeight: 280, overflowY: 'auto',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
                }}>
                    {!loading && (query.trim().length > 0 ? results : defaultCustomers).length === 0 ? (
                        <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
                            <Typography variant="caption" color="#94a3b8" fontSize={12}>
                                Không có khách hàng
                            </Typography>
                        </Box>
                    ) : (
                        (query.trim().length > 0 ? results : defaultCustomers).map((c, i) => (
                            <Box
                                key={c.id}
                                onClick={() => { onSelect(c); setQuery(''); setShowDrop(false); }}
                                sx={{
                                    px: 1.5, py: 1, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 1.25,
                                    bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                                    borderBottom: '1px solid #f1f5f9',
                                    '&:hover': { bgcolor: '#eff6ff' },
                                    transition: 'background 0.1s',
                                }}
                            >
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#3b82f6', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                    {c.fullName.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} fontSize={12} noWrap color="#1e293b">
                                        {c.fullName}
                                    </Typography>
                                    <Typography variant="caption" color="#64748b" fontSize={10}>
                                        📞 {c.phoneNumber}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                    <Chip
                                        label={c.customerTier} size="small"
                                        sx={{
                                            height: 16, fontSize: 9, fontWeight: 700,
                                            color: TIER_COLOR[c.customerTier] ?? '#64748b',
                                            bgcolor: `${TIER_COLOR[c.customerTier] ?? '#64748b'}22`,
                                        }}
                                    />
                                    <Typography variant="caption" color="#f59e0b" display="block" fontSize={9.5}>
                                        {c.loyaltyPoints} điểm
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default InlineCustomerSearch;