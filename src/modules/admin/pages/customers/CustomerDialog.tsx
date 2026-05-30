import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, FormControl, InputLabel,
    Select, MenuItem, FormControlLabel, Switch, Grid
} from '@mui/material';
import toast from 'react-hot-toast';
import customerService from '../../../../services/customerService';
import { Customer } from '../../../../types';

interface CustomerDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (customer: Customer) => void;
    initialData?: Customer | null;
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onClose, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phoneNumber: '',
        fullName: '',
        email: '',
        address: '',
        gender: '',
        dateOfBirth: '',
        notes: '',
        isActive: true
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    phoneNumber: initialData.phoneNumber || '',
                    fullName: initialData.fullName || '',
                    email: initialData.email || '',
                    address: initialData.address || '',
                    gender: initialData.gender || '',
                    dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
                    notes: initialData.notes || '',
                    isActive: initialData.isActive !== false
                });
            } else {
                setFormData({
                    phoneNumber: '',
                    fullName: '',
                    email: '',
                    address: '',
                    gender: '',
                    dateOfBirth: '',
                    notes: '',
                    isActive: true
                });
            }
        }
    }, [open, initialData]);

    const handleChange = (field: string) => (e: any) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.fullName.trim()) {
            toast.error('Vui lòng nhập họ tên khách hàng');
            return;
        }
        if (!formData.phoneNumber.trim()) {
            toast.error('Vui lòng nhập số điện thoại');
            return;
        }

        setLoading(true);
        try {
            const dataToSubmit: any = { ...formData };
            if (!dataToSubmit.dateOfBirth) delete dataToSubmit.dateOfBirth;
            if (!dataToSubmit.gender) delete dataToSubmit.gender;

            let result: Customer;
            if (initialData?.id) {
                result = await customerService.update(initialData.id, dataToSubmit);
                toast.success('Đã cập nhật thông tin khách hàng');
            } else {
                result = await customerService.create(dataToSubmit);
                toast.success('Đã thêm khách hàng mới');
            }
            onSuccess(result);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu khách hàng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>
                {initialData ? 'Chỉnh sửa Khách hàng' : 'Thêm mới Khách hàng'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth label="Họ và tên (*)" size="small"
                                value={formData.fullName} onChange={handleChange('fullName')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth label="Số điện thoại (*)" size="small"
                                value={formData.phoneNumber} onChange={handleChange('phoneNumber')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth label="Email" size="small" type="email"
                                value={formData.email} onChange={handleChange('email')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Giới tính</InputLabel>
                                <Select value={formData.gender} label="Giới tính" onChange={handleChange('gender')}>
                                    <MenuItem value=""><em>Chưa rõ</em></MenuItem>
                                    <MenuItem value="MALE">Nam</MenuItem>
                                    <MenuItem value="FEMALE">Nữ</MenuItem>
                                    <MenuItem value="OTHER">Khác</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth label="Ngày sinh" size="small" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.dateOfBirth} onChange={handleChange('dateOfBirth')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {initialData && (
                                <FormControlLabel
                                    control={<Switch checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} color="primary" />}
                                    label="Đang hoạt động"
                                />
                            )}
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth label="Địa chỉ" size="small"
                                value={formData.address} onChange={handleChange('address')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth label="Ghi chú nội bộ (CRM)" size="small" multiline rows={3}
                                value={formData.notes} onChange={handleChange('notes')}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f9fafb' }}>
                    <Button onClick={onClose} disabled={loading} color="inherit" sx={{ textTransform: 'none' }}>
                        Hủy
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        {loading ? 'Đang lưu...' : 'Lưu lại'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CustomerDialog;
