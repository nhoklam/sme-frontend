import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Grid, Avatar, Button } from '@mui/material';
import { Person, ShoppingBag, Favorite, LocationOn } from '@mui/icons-material';
import AccountInfo from '../components/account/AccountInfo';
import OrderHistory from '../components/account/OrderHistory';
import Wishlist from '../components/account/Wishlist';
import AddressBook from '../components/account/AddressBook';

const AccountPage = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const user = {
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0123456789',
        avatar: 'https://via.placeholder.com/100x100?text=Avatar',
    };

    const renderTabContent = () => {
        switch (tabValue) {
            case 0:
                return <AccountInfo user={user} />;
            case 1:
                return <OrderHistory />;
            case 2:
                return <Wishlist />;
            case 3:
                return <AddressBook />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Tài khoản của tôi
            </Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                        <Avatar
                            src={user.avatar}
                            sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#006994' }}
                        >
                            {user.fullName.charAt(0)}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {user.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {user.email}
                        </Typography>
                        <Button variant="outlined" size="small" sx={{ borderColor: '#006994', color: '#006994' }}>
                            Chỉnh sửa hồ sơ
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={9}>
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            sx={{
                                borderBottom: '1px solid #e2e8f0',
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 },
                                '& .Mui-selected': { color: '#006994' },
                                '& .MuiTabs-indicator': { backgroundColor: '#006994' },
                            }}
                        >
                            <Tab icon={<Person />} label="Thông tin" />
                            <Tab icon={<ShoppingBag />} label="Đơn hàng" />
                            <Tab icon={<Favorite />} label="Yêu thích" />
                            <Tab icon={<LocationOn />} label="Địa chỉ" />
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