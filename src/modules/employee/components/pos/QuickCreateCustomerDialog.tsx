// src/modules/employee/components/pos/QuickCreateCustomerDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, TextField, Button, IconButton,
    Alert, CircularProgress, FormControl, Select, MenuItem,
} from '@mui/material';
import { PersonAdd, Close } from '@mui/icons-material';
import customerService from '../../../../services/customerService';
import { Customer } from '../../../../types';

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (c: Customer) => void;
}

const QuickCreateCustomerDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
    const [form, setForm] = useState({ phoneNumber: '', fullName: '', email: '', gender: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) { setForm({ phoneNumber: '', fullName: '', email: '', gender: '' }); setError(''); }
    }, [open]);

    const handleCreate = async () => {
        if (!form.phoneNumber.trim() || !form.fullName.trim()) {
            setError('Vui lòng nhập SĐT và họ tên'); return;
        }
        setLoading(true); setError('');
        try {
            const c = await customerService.create({
                phoneNumber: form.phoneNumber.trim(),
                fullName: form.fullName.trim(),
                email: form.email.trim() || undefined,
                gender: form.gender || undefined,
            });
            onCreated(c); onClose();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Tạo khách hàng thất bại');
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' } }}>
            <Box sx={{
                px: 3, py: 2, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', borderBottom: '1px solid #334155',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAdd sx={{ fontSize: 18, color: '#3b82f6' }} />
                    <Typography fontWeight={800} color="#f1f5f9" fontSize={15}>Thêm khách hàng mới</Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}><Close /></IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{error}</Alert>}
                {[
                    { label: 'Số điện thoại *', key: 'phoneNumber', type: 'tel' },
                    { label: 'Họ và tên *', key: 'fullName', type: 'text' },
                    { label: 'Email', key: 'email', type: 'email' },
                ].map(f => (
                    <Box key={f.key} sx={{ mb: 1.75 }}>
                        <Typography variant="caption" fontWeight={700} color="#94a3b8" display="block" mb={0.5}>
                            {f.label}
                        </Typography>
                        <TextField
                            fullWidth size="small" type={f.type}
                            value={(form as any)[f.key]}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: '#f1f5f9',
                                    '& fieldset': { borderColor: '#334155' },
                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                },
                            }}
                        />
                    </Box>
                ))}
                <Box sx={{ mb: 1.75 }}>
                    <Typography variant="caption" fontWeight={700} color="#94a3b8" display="block" mb={0.5}>Giới tính</Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            value={form.gender}
                            onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                            displayEmpty
                            sx={{
                                color: '#f1f5f9',
                                '& fieldset': { borderColor: '#334155' },
                                '& .MuiSelect-icon': { color: '#64748b' },
                            }}
                        >
                            <MenuItem value="">Chọn giới tính</MenuItem>
                            <MenuItem value="MALE">Nam</MenuItem>
                            <MenuItem value="FEMALE">Nữ</MenuItem>
                            <MenuItem value="OTHER">Khác</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ textTransform: 'none', borderColor: '#334155', color: '#64748b', borderRadius: 2 }}>
                    Hủy
                </Button>
                <Button fullWidth variant="contained" disabled={loading} onClick={handleCreate}
                    sx={{ py: 1.2, bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                    {loading ? <CircularProgress size={18} color="inherit" /> : '+ Tạo khách hàng'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickCreateCustomerDialog;