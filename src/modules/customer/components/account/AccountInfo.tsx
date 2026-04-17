import React from 'react';
import { Box, Typography, Grid, TextField, Button } from '@mui/material';

const AccountInfo = ({ user }) => {
    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Thông tin cá nhân
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Họ và tên"
                        defaultValue={user.fullName}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Email"
                        defaultValue={user.email}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Số điện thoại"
                        defaultValue={user.phone}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" sx={{ backgroundColor: '#006994' }}>
                        Cập nhật thông tin
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AccountInfo;