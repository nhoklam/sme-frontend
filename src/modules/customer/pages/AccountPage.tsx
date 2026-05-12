import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Grid, Avatar, Button, Skeleton, Chip } from '@mui/material';
import { Person, ShoppingBag, LocationOn, Favorite, Logout } from '@mui/icons-material';
import AccountInfo from '../components/account/AccountInfo';
import OrderHistory from '../components/account/OrderHistory';
import AddressBook from '../components/account/AddressBook';
import Wishlist from '../components/account/Wishlist';
import { useCurrentUser } from '../hooks/useAccount';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';

const AccountPage = () => {
    const [tabValue, setTabValue] = useState(0);
    const { user, isLoading } = useCurrentUser();
    const navigate = useNavigate();

    const handleTabChange = (_event: any, newValue: number) => {
        setTabValue(newValue);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const displayUser = user ?? { fullName: 'Khách', email: '', phone: '' };

    const renderTabContent = () => {
        switch (tabValue) {
            case 0: return <AccountInfo user={displayUser} />;
            case 1: return <OrderHistory />;
            case 2: return <AddressBook />;
            case 3: return <Wishlist />;
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
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Tài khoản của tôi
            </Typography>

            <Grid container spacing={4}>
                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#d32f2f', fontSize: 32 }}>
                            {displayUser.fullName?.charAt(0)?.toUpperCase() ?? 'K'}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {displayUser.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {displayUser.email}
                        </Typography>
                        {displayUser.phone && (
                            <Chip label={displayUser.phone} size="small" sx={{ mb: 2, bgcolor: '#f5f5f5' }} />
                        )}
                        <Button
                            fullWidth variant="outlined" color="error"
                            startIcon={<Logout />}
                            onClick={handleLogout}
                            sx={{ textTransform: 'none', fontWeight: 600, mt: 1, borderRadius: 2 }}
                        >
                            Đăng xuất
                        </Button>
                    </Paper>
                </Grid>

                {/* Content */}
                <Grid size={{ xs: 12, md: 9 }}>
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                borderBottom: '1px solid #e2e8f0',
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 56 },
                                '& .Mui-selected': { color: '#d32f2f' },
                                '& .MuiTabs-indicator': { backgroundColor: '#d32f2f' },
                            }}
                        >
                            <Tab icon={<Person />} iconPosition="start" label="Thông tin" />
                            <Tab icon={<ShoppingBag />} iconPosition="start" label="Đơn hàng" />
                            <Tab icon={<LocationOn />} iconPosition="start" label="Địa chỉ" />
                            <Tab icon={<Favorite />} iconPosition="start" label="Yêu thích" />
                        </Tabs>
                        <Box sx={{ p: 3 }}>
                            {renderTabContent()}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AccountPage;