import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Grid, Chip, Alert,
} from '@mui/material';
import { Add, Edit, Delete, LocationOn, Star } from '@mui/icons-material';

interface Address {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    address: string;
    isDefault: boolean;
}

const STORAGE_KEY = 'customer_addresses';

const loadAddresses = (): Address[] => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const DEFAULT_FORM: Omit<Address, 'id'> = { label: 'Nhà', fullName: '', phone: '', address: '', isDefault: false };

const AddressBook: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>(loadAddresses);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Address | null>(null);
    const [form, setForm] = useState<Omit<Address, 'id'>>(DEFAULT_FORM);
    const [error, setError] = useState('');

    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses)); }, [addresses]);

    const openAdd = () => { setEditing(null); setForm(DEFAULT_FORM); setError(''); setOpen(true); };
    const openEdit = (addr: Address) => { setEditing(addr); setForm({ ...addr }); setError(''); setOpen(true); };

    const handleSave = () => {
        if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc'); return;
        }
        setAddresses(prev => {
            let updated: Address[];
            if (editing) {
                updated = prev.map(a => a.id === editing.id ? { ...form, id: editing.id } : a);
            } else {
                updated = [...prev, { ...form, id: Date.now().toString() }];
            }
            if (form.isDefault) {
                const targetId = editing?.id ?? updated[updated.length - 1].id;
                updated = updated.map(a => ({ ...a, isDefault: a.id === targetId }));
            }
            return updated;
        });
        setOpen(false);
    };

    const handleDelete = (id: string) => setAddresses(prev => prev.filter(a => a.id !== id));
    const handleSetDefault = (id: string) => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Sổ địa chỉ</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={openAdd}
                    sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 600 }}>
                    Thêm địa chỉ
                </Button>
            </Box>

            {addresses.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                    <LocationOn sx={{ fontSize: 56, color: '#e0e0e0', mb: 1.5 }} />
                    <Typography color="text.secondary" fontWeight={500}>Bạn chưa có địa chỉ nào</Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={openAdd}
                        sx={{ mt: 2, borderColor: '#d32f2f', color: '#d32f2f', textTransform: 'none' }}>
                        Thêm địa chỉ mới
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {addresses.map(addr => (
                        <Paper key={addr.id} sx={{ p: 2.5, borderRadius: 2, border: addr.isDefault ? '1.5px solid #d32f2f' : '1px solid #f0f0f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Chip label={addr.label} size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600, fontSize: 11 }} />
                                        {addr.isDefault && <Chip icon={<Star sx={{ fontSize: 13 }} />} label="Mặc định" size="small"
                                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: 11 }} />}
                                    </Box>
                                    <Typography fontWeight={700}>{addr.fullName} · {addr.phone}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{addr.address}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => openEdit(addr)} sx={{ color: '#1976d2' }}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(addr.id)} sx={{ color: '#d32f2f' }}><Delete fontSize="small" /></IconButton>
                                </Box>
                            </Box>
                            {!addr.isDefault && (
                                <Button size="small" onClick={() => handleSetDefault(addr.id)}
                                    sx={{ mt: 1, color: '#d32f2f', textTransform: 'none', fontSize: 12, p: 0 }}>
                                    Đặt làm mặc định
                                </Button>
                            )}
                        </Paper>
                    ))}
                </Box>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>{editing ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Họ và tên *" size="small" value={form.fullName}
                                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Số điện thoại *" size="small" value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} inputProps={{ inputMode: 'tel' }} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Địa chỉ chi tiết *" size="small" value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                                multiline rows={2} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {['Nhà', 'Công ty', 'Khác'].map(lbl => (
                                    <Chip key={lbl} label={lbl} onClick={() => setForm(f => ({ ...f, label: lbl }))}
                                        variant={form.label === lbl ? 'outlined' : 'filled'}
                                        sx={{ cursor: 'pointer', fontWeight: form.label === lbl ? 700 : 500,
                                            bgcolor: form.label === lbl ? '#ffebee' : undefined,
                                            borderColor: form.label === lbl ? '#d32f2f' : undefined,
                                            color: form.label === lbl ? '#d32f2f' : undefined }} />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: '#666', textTransform: 'none' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave}
                        sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 600 }}>
                        {editing ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddressBook;