import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Grid, Chip, Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, LocationOn, Star } from '@mui/icons-material';
import { customerApi } from '../../../../services/customerApi';
import { CustomerAddress } from '../../../../types';

const DEFAULT_FORM: Partial<CustomerAddress> = {
    receiverName: '',
    receiverPhone: '',
    provinceCity: '',
    district: '',
    ward: '',
    specificAddress: '',
    isDefault: false
};

const AddressBook: React.FC = () => {
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form & Dialog state
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<CustomerAddress>>(DEFAULT_FORM);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Location API state
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const res = await customerApi.getAddresses();
            if (res.data) {
                setAddresses(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch addresses', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
        // Fetch provinces from public API
        fetch('https://provinces.open-api.vn/api/?depth=3')
            .then(res => res.json())
            .then(data => setProvinces(data))
            .catch(err => console.error('Error fetching provinces:', err));
    }, []);

    useEffect(() => {
        if (form.provinceCity) {
            const p = provinces.find(x => x.name === form.provinceCity);
            setDistricts(p ? p.districts : []);
        } else {
            setDistricts([]);
        }
    }, [form.provinceCity, provinces]);

    useEffect(() => {
        if (form.district) {
            const d = districts.find(x => x.name === form.district);
            setWards(d ? d.wards : []);
        } else {
            setWards([]);
        }
    }, [form.district, districts]);

    const openAdd = () => {
        setEditingId(null);
        setForm(DEFAULT_FORM);
        setError('');
        setOpen(true);
    };

    const openEdit = (addr: CustomerAddress) => {
        setEditingId(addr.id);
        setForm({ ...addr });
        setError('');
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.receiverName?.trim() || !form.receiverPhone?.trim() || 
            !form.provinceCity || !form.district || !form.specificAddress?.trim()) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                receiverName: form.receiverName.trim(),
                receiverPhone: form.receiverPhone.trim(),
                provinceCity: form.provinceCity,
                district: form.district,
                ward: form.ward || '',
                specificAddress: form.specificAddress.trim(),
                isDefault: form.isDefault || false
            };

            if (editingId) {
                await customerApi.updateAddress(editingId, payload);
            } else {
                await customerApi.addAddress(payload as any);
            }
            await fetchAddresses();
            setOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu địa chỉ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
        try {
            await customerApi.deleteAddress(id);
            await fetchAddresses();
        } catch (err) {
            console.error('Lỗi khi xóa địa chỉ', err);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await customerApi.setDefaultAddress(id);
            await fetchAddresses();
        } catch (err) {
            console.error('Lỗi khi đặt mặc định', err);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#f5a623' }} /></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700} color="#1a1a2e">Sổ địa chỉ</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={openAdd}
                    sx={{ bgcolor: '#f5a623', color: '#1a1a2e', '&:hover': { bgcolor: '#e0951a' }, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
                    Thêm địa chỉ mới
                </Button>
            </Box>

            {addresses.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed #eef0f2', boxShadow: 'none' }}>
                    <LocationOn sx={{ fontSize: 56, color: '#eef0f2', mb: 1.5 }} />
                    <Typography color="text.secondary" fontWeight={500}>Bạn chưa có địa chỉ nào</Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={openAdd}
                        sx={{ mt: 2, borderColor: '#1a1a2e', color: '#1a1a2e', textTransform: 'none', fontWeight: 600, borderRadius: '20px' }}>
                        Thêm địa chỉ ngay
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {addresses.map(addr => (
                        <Paper key={addr.id} sx={{ p: 2.5, borderRadius: 3, border: addr.isDefault ? '2px solid #f5a623' : '1px solid #eef0f2', boxShadow: addr.isDefault ? '0 4px 12px rgba(245, 166, 35, 0.15)' : 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        {addr.isDefault && <Chip icon={<Star sx={{ fontSize: 13 }} />} label="Địa chỉ mặc định" size="small"
                                            sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', color: '#db941e', fontWeight: 700, fontSize: 11 }} />}
                                    </Box>
                                    <Typography fontWeight={700} color="#1a1a2e" fontSize={16}>{addr.receiverName} <Typography component="span" color="text.secondary" sx={{ mx: 0.5 }}>|</Typography> {addr.receiverPhone}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{addr.specificAddress}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{`${addr.ward ? addr.ward + ', ' : ''}${addr.district}, ${addr.provinceCity}`}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => openEdit(addr)} sx={{ color: '#1a1a2e', bgcolor: '#fafafb', '&:hover': { bgcolor: '#eef0f2' } }}><Edit fontSize="small" /></IconButton>
                                    {!addr.isDefault && <IconButton size="small" onClick={() => handleDelete(addr.id)} sx={{ color: '#e8401c', bgcolor: 'rgba(232, 64, 28, 0.05)', '&:hover': { bgcolor: 'rgba(232, 64, 28, 0.1)' } }}><Delete fontSize="small" /></IconButton>}
                                </Box>
                            </Box>
                            {!addr.isDefault && (
                                <Button size="small" onClick={() => handleSetDefault(addr.id)}
                                    sx={{ mt: 1.5, color: '#f5a623', textTransform: 'none', fontSize: 12, fontWeight: 700, p: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                    Đặt làm mặc định
                                </Button>
                            )}
                        </Paper>
                    ))}
                </Box>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1a1a2e', pb: 1 }}>{editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Họ và tên người nhận *" size="small" value={form.receiverName}
                                onChange={e => setForm(f => ({ ...f, receiverName: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' }, '& .MuiInputLabel-root.Mui-focused': { color: '#1a1a2e' } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Số điện thoại *" size="small" value={form.receiverPhone}
                                onChange={e => setForm(f => ({ ...f, receiverPhone: e.target.value }))} inputProps={{ inputMode: 'tel' }}
                                sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' }, '& .MuiInputLabel-root.Mui-focused': { color: '#1a1a2e' } }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ '&.Mui-focused': { color: '#1a1a2e' } }}>Tỉnh/Thành phố *</InputLabel>
                                <Select
                                    label="Tỉnh/Thành phố *"
                                    value={form.provinceCity || ''}
                                    onChange={e => setForm(f => ({ ...f, provinceCity: e.target.value, district: '', ward: '' }))}
                                    sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' } }}
                                >
                                    {provinces.map(p => <MenuItem key={p.code} value={p.name}>{p.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small" disabled={!form.provinceCity}>
                                <InputLabel sx={{ '&.Mui-focused': { color: '#1a1a2e' } }}>Quận/Huyện *</InputLabel>
                                <Select
                                    label="Quận/Huyện *"
                                    value={form.district || ''}
                                    onChange={e => setForm(f => ({ ...f, district: e.target.value, ward: '' }))}
                                    sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' } }}
                                >
                                    {districts.map(d => <MenuItem key={d.code} value={d.name}>{d.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small" disabled={!form.district}>
                                <InputLabel sx={{ '&.Mui-focused': { color: '#1a1a2e' } }}>Phường/Xã</InputLabel>
                                <Select
                                    label="Phường/Xã"
                                    value={form.ward || ''}
                                    onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
                                    sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' } }}
                                >
                                    {wards.map(w => <MenuItem key={w.code} value={w.name}>{w.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Địa chỉ cụ thể *" size="small" value={form.specificAddress}
                                onChange={e => setForm(f => ({ ...f, specificAddress: e.target.value }))}
                                placeholder="Số nhà, tên đường, tòa nhà..."
                                sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' }, '& .MuiInputLabel-root.Mui-focused': { color: '#1a1a2e' } }} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: '#666', textTransform: 'none', fontWeight: 600 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}
                        sx={{ bgcolor: '#f5a623', color: '#1a1a2e', '&:hover': { bgcolor: '#e0951a' }, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
                        {saving ? <CircularProgress size={24} sx={{ color: '#1a1a2e' }} /> : (editingId ? 'Cập nhật' : 'Thêm mới')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddressBook;