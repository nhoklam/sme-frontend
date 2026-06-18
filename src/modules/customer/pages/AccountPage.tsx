import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Grid, Avatar, Button, Skeleton, Chip, Badge, IconButton, CircularProgress } from '@mui/material';
import { Person, ShoppingBag, LocationOn, Logout, PhotoCamera } from '@mui/icons-material';
import AccountInfo from '../components/account/AccountInfo';
import OrderHistory from '../components/account/OrderHistory';
import AddressBook from '../components/account/AddressBook';
import { useCurrentUser } from '../hooks/useAccount';
import { useNavigate, useSearchParams } from 'react-router-dom';
import customerAuthService from '../../../services/customerAuthService';
import { customerApi } from '../../../services/customerApi';
import toast from 'react-hot-toast';

const AccountPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, isLoading } = useCurrentUser();
    const navigate = useNavigate();

    const tabMap: Record<string, number> = { 'info': 0, 'orders': 1, 'address': 2 };
    const reverseTabMap: Record<number, string> = { 0: 'info', 1: 'orders', 2: 'address' };
    
    const currentTabParam = searchParams.get('tab') || 'info';
    const tabValue = tabMap[currentTabParam] ?? 0;

    const handleTabChange = (_event: any, newValue: number) => {
        setSearchParams({ tab: reverseTabMap[newValue] });
    };

    const handleLogout = () => {
        customerAuthService.logout();
        navigate('/login');
        window.location.reload();
    };

    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        try {
            setUploadingAvatar(true);
            const res = await customerApi.uploadImage(file);
            const newAvatarUrl = res.data.url;
            await customerApi.updateProfile({ avatarUrl: newAvatarUrl });
            window.location.reload();
        } catch (error) {
            console.error('Lỗi upload avatar:', error);
            toast.error('Có lỗi xảy ra khi cập nhật ảnh đại diện');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const displayUser = user ?? { fullName: 'Khách', email: '', phoneNumber: '' };

    const renderTabContent = () => {
        switch (tabValue) {
            case 0: return <AccountInfo user={displayUser} />;
            case 1: return <OrderHistory />;
            case 2: return <AddressBook />;
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ py: 4 }}>
                <Skeleton width="30%" height={40} sx={{ mb: 4 }} />
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 3 }}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} /></Grid>
                    <Grid size={{ xs: 12, md: 9 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>


            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* Top Center Profile Card */}
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px solid #eef0f2', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                                <IconButton
                                    component="label"
                                    sx={{ bgcolor: '#fff', boxShadow: 1, '&:hover': { bgcolor: '#f5f5f5' }, width: 32, height: 32 }}
                                    disabled={uploadingAvatar}
                                >
                                    {uploadingAvatar ? <CircularProgress size={16} /> : <PhotoCamera sx={{ fontSize: 18, color: '#1a1a2e' }} />}
                                    <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                                </IconButton>
                            }
                        >
                            <Avatar src={(displayUser as any).avatarUrl} sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: '#1a1a2e', fontSize: 40, fontWeight: 700 }}>
                                {!(displayUser as any).avatarUrl && (displayUser.fullName?.charAt(0)?.toUpperCase() ?? 'K')}
                            </Avatar>
                        </Badge>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1a1a2e' }}>
                            {displayUser.fullName}
                        </Typography>
                        <Button
                            variant="outlined" color="error"
                            startIcon={<Logout />}
                            onClick={handleLogout}
                            sx={{ textTransform: 'none', fontWeight: 600, mt: 2, borderRadius: 2, borderColor: '#eef0f2', color: '#e8401c', '&:hover': { borderColor: '#e8401c', bgcolor: 'rgba(232, 64, 28, 0.04)' }, px: 4 }}
                        >
                            Đăng xuất
                        </Button>
                    </Paper>
                </Box>

                {/* Content Area Below */}
                <Box sx={{ width: '100%', maxWidth: 1100 }}>
                    <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef0f2', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            sx={{
                                borderBottom: '1px solid #eef0f2',
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 64, fontSize: '15px' },
                                '& .Mui-selected': { color: '#f5a623' },
                                '& .MuiTabs-indicator': { backgroundColor: '#f5a623', height: 4 },
                            }}
                        >
                            <Tab icon={<Person />} iconPosition="start" label="Thông tin cá nhân" />
                            <Tab icon={<ShoppingBag />} iconPosition="start" label="Lịch sử đơn hàng" />
                            <Tab icon={<LocationOn />} iconPosition="start" label="Sổ địa chỉ" />
                        </Tabs>
                        <Box sx={{ p: 4, bgcolor: '#ffffff' }}>
                            {renderTabContent()}
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};

export default AccountPage;