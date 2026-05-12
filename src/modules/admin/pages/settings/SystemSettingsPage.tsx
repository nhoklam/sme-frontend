import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid,
    Divider, Switch, FormControlLabel, Chip, Alert,
    InputAdornment, Avatar,
} from '@mui/material';
import {
    Store, EmojiEvents, Security, Save, PhotoCamera,
    Phone, Email, LocationOn, Language, Receipt,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const TAB_CONFIG = [
    { label: 'Thông tin cửa hàng', icon: <Store sx={{ fontSize: 16 }} /> },
    { label: 'Chính sách điểm thưởng', icon: <EmojiEvents sx={{ fontSize: 16 }} /> },
    { label: 'Bảo mật & Hệ thống', icon: <Security sx={{ fontSize: 16 }} /> },
];

export default function SystemSettingsPage() {
    const [tab, setTab] = useState(0);

    const [storeInfo, setStoreInfo] = useState({
        name: 'Nhà Sách SME',
        phone: '028 3822 5678',
        email: 'info@smebookstore.vn',
        address: '123 Đinh Tiên Hoàng, Phường 1, Quận 1, TP. Hồ Chí Minh',
        website: 'https://smebookstore.vn',
        taxCode: '0123456789',
        invoicePrefix: 'INV',
    });

    const [loyalty, setLoyalty] = useState({
        pointsPerVnd: 1000,
        pointValue: 100,
        minPointsRedeem: 50,
        silverThreshold: 2000000,
        goldThreshold: 10000000,
        enabled: true,
    });

    const [security, setSecurity] = useState({
        sessionTimeout: 480,
        requirePasswordChange: false,
        twoFactorEnabled: false,
        maxLoginAttempts: 5,
        autoBackup: true,
    });

    const handleSaveStore = () => {
        toast.success('Đã lưu thông tin cửa hàng!');
    };

    const handleSaveLoyalty = () => {
        toast.success('Đã lưu chính sách điểm thưởng!');
    };

    const handleSaveSecurity = () => {
        toast.success('Đã lưu cài đặt bảo mật!');
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>
                    Dashboard / <strong style={{ color: '#6b7280' }}>Cài đặt hệ thống</strong>
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">
                    Cài đặt hệ thống
                </Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>
                    Cấu hình thông tin cửa hàng, chính sách và bảo mật
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {TAB_CONFIG.map((t, i) => (
                    <Box
                        key={i}
                        onClick={() => setTab(i)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1.25,
                            px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer',
                            border: `1.5px solid ${tab === i ? '#1d4ed8' : '#e5e7eb'}`,
                            bgcolor: tab === i ? '#eff6ff' : '#fff',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' },
                        }}
                    >
                        <Box sx={{ color: tab === i ? '#1d4ed8' : '#6b7280' }}>{t.icon}</Box>
                        <Typography fontSize={13} fontWeight={700} color={tab === i ? '#1d4ed8' : '#374151'}>
                            {t.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {tab === 0 && (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                        <Avatar
                            sx={{ width: 72, height: 72, bgcolor: '#1d4ed8', fontSize: 28, fontWeight: 800 }}
                        >
                            📚
                        </Avatar>
                        <Box>
                            <Typography fontWeight={700} fontSize={16}>{storeInfo.name}</Typography>
                            <Typography variant="body2" color="text.secondary">Logo & tên cửa hàng</Typography>
                            <Button size="small" startIcon={<PhotoCamera />} sx={{ mt: 0.5, textTransform: 'none', fontSize: 12 }}>
                                Đổi Logo
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Tên cửa hàng" size="small"
                                value={storeInfo.name}
                                onChange={e => setStoreInfo({ ...storeInfo, name: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Store sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Số điện thoại" size="small"
                                value={storeInfo.phone}
                                onChange={e => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Email liên hệ" size="small"
                                value={storeInfo.email}
                                onChange={e => setStoreInfo({ ...storeInfo, email: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Website" size="small"
                                value={storeInfo.website}
                                onChange={e => setStoreInfo({ ...storeInfo, website: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Language sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth label="Địa chỉ" size="small"
                                value={storeInfo.address}
                                onChange={e => setStoreInfo({ ...storeInfo, address: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Mã số thuế (MST)" size="small"
                                value={storeInfo.taxCode}
                                onChange={e => setStoreInfo({ ...storeInfo, taxCode: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Tiền tố mã hóa đơn" size="small"
                                value={storeInfo.invoicePrefix}
                                onChange={e => setStoreInfo({ ...storeInfo, invoicePrefix: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Receipt sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }}
                                helperText={`Hóa đơn sẽ có dạng: ${storeInfo.invoicePrefix}-00001`}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" startIcon={<Save />} onClick={handleSaveStore}
                            sx={{ textTransform: 'none', fontWeight: 700, px: 4, borderRadius: 2 }}>
                            Lưu thay đổi
                        </Button>
                    </Box>
                </Paper>
            )}

            {tab === 1 && (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography fontWeight={700} fontSize={16}>Chương trình tích điểm thành viên</Typography>
                            <Typography variant="body2" color="text.secondary">Cấu hình cách khách hàng tích và đổi điểm</Typography>
                        </Box>
                        <FormControlLabel
                            control={<Switch checked={loyalty.enabled} onChange={e => setLoyalty({ ...loyalty, enabled: e.target.checked })} color="primary" />}
                            label={loyalty.enabled ? 'Đang bật' : 'Đang tắt'}
                        />
                    </Box>

                    {!loyalty.enabled && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Chương trình tích điểm đang tắt. Khách hàng sẽ không tích hoặc đổi điểm được.
                        </Alert>
                    )}

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography fontWeight={600} fontSize={13} color="#374151" mb={2}>
                                Quy tắc tích điểm
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Tích 1 điểm mỗi (VNĐ)" size="small" type="number"
                                value={loyalty.pointsPerVnd}
                                onChange={e => setLoyalty({ ...loyalty, pointsPerVnd: Number(e.target.value) })}
                                helperText={`Mua ${loyalty.pointsPerVnd.toLocaleString('vi-VN')}đ → được 1 điểm`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="1 điểm = (VNĐ khi đổi)" size="small" type="number"
                                value={loyalty.pointValue}
                                onChange={e => setLoyalty({ ...loyalty, pointValue: Number(e.target.value) })}
                                helperText={`Đổi 1 điểm = ${loyalty.pointValue.toLocaleString('vi-VN')}đ giảm giá`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Số điểm tối thiểu để đổi" size="small" type="number"
                                value={loyalty.minPointsRedeem}
                                onChange={e => setLoyalty({ ...loyalty, minPointsRedeem: Number(e.target.value) })}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography fontWeight={600} fontSize={13} color="#374151" mt={2} mb={2}>
                                Ngưỡng thăng hạng thẻ
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth size="small" type="number"
                                label="Ngưỡng hạng Bạc (VNĐ chi tiêu)"
                                value={loyalty.silverThreshold}
                                onChange={e => setLoyalty({ ...loyalty, silverThreshold: Number(e.target.value) })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Chip label="SILVER" size="small" sx={{ bgcolor: '#e2e8f0', color: '#475569', fontWeight: 700, fontSize: 10 }} /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth size="small" type="number"
                                label="Ngưỡng hạng Vàng (VNĐ chi tiêu)"
                                value={loyalty.goldThreshold}
                                onChange={e => setLoyalty({ ...loyalty, goldThreshold: Number(e.target.value) })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Chip label="GOLD" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: 10 }} /></InputAdornment> }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ p: 2.5, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                                <Typography fontSize={12} fontWeight={600} color="#0369a1" mb={1}>
                                    Tóm tắt chính sách hiện tại
                                </Typography>
                                <Typography fontSize={12} color="#0c4a6e">
                                    • Mua <strong>{loyalty.pointsPerVnd.toLocaleString('vi-VN')}đ</strong> → 1 điểm &nbsp;|&nbsp;
                                    Đổi 1 điểm → <strong>{loyalty.pointValue.toLocaleString('vi-VN')}đ</strong> giảm giá
                                </Typography>
                                <Typography fontSize={12} color="#0c4a6e">
                                    • Hạng Bạc: chi tiêu &gt; <strong>{loyalty.silverThreshold.toLocaleString('vi-VN')}đ</strong> &nbsp;|&nbsp;
                                    Hạng Vàng: &gt; <strong>{loyalty.goldThreshold.toLocaleString('vi-VN')}đ</strong>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" startIcon={<Save />} onClick={handleSaveLoyalty}
                            sx={{ textTransform: 'none', fontWeight: 700, px: 4, borderRadius: 2 }}>
                            Lưu chính sách
                        </Button>
                    </Box>
                </Paper>
            )}

            {tab === 2 && (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography fontWeight={700} fontSize={16} mb={0.5}>Bảo mật & Hệ thống</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Cấu hình phiên đăng nhập, giới hạn và sao lưu dữ liệu
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Thời gian hết phiên (phút)" size="small" type="number"
                                value={security.sessionTimeout}
                                onChange={e => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })}
                                helperText="Tự động đăng xuất sau thời gian không hoạt động"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth label="Số lần đăng nhập sai tối đa" size="small" type="number"
                                value={security.maxLoginAttempts}
                                onChange={e => setSecurity({ ...security, maxLoginAttempts: Number(e.target.value) })}
                                helperText="Tài khoản bị khóa tạm thời nếu vượt quá"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={<Switch checked={security.requirePasswordChange} onChange={e => setSecurity({ ...security, requirePasswordChange: e.target.checked })} />}
                                label={
                                    <Box>
                                        <Typography fontSize={14} fontWeight={600}>Yêu cầu đổi mật khẩu định kỳ</Typography>
                                        <Typography variant="caption" color="text.secondary">Nhắc nhở sau 90 ngày</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={<Switch checked={security.twoFactorEnabled} onChange={e => setSecurity({ ...security, twoFactorEnabled: e.target.checked })} />}
                                label={
                                    <Box>
                                        <Typography fontSize={14} fontWeight={600}>Xác thực 2 bước (2FA)</Typography>
                                        <Typography variant="caption" color="text.secondary">Yêu cầu OTP khi đăng nhập</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={<Switch checked={security.autoBackup} onChange={e => setSecurity({ ...security, autoBackup: e.target.checked })} />}
                                label={
                                    <Box>
                                        <Typography fontSize={14} fontWeight={600}>Sao lưu tự động hàng ngày</Typography>
                                        <Typography variant="caption" color="text.secondary">Sao lưu lúc 2:00 AM mỗi ngày</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" startIcon={<Save />} onClick={handleSaveSecurity}
                            sx={{ textTransform: 'none', fontWeight: 700, px: 4, borderRadius: 2 }}>
                            Lưu cài đặt
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
}