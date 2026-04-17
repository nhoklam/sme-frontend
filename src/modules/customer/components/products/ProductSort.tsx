import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';

const ProductSort = ({ sort, setSort }) => {
    return (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sắp xếp</InputLabel>
                <Select value={sort} label="Sắp xếp" onChange={(e) => setSort(e.target.value)}>
                    <MenuItem value="newest">Mới nhất</MenuItem>
                    <MenuItem value="price-asc">Giá tăng dần</MenuItem>
                    <MenuItem value="price-desc">Giá giảm dần</MenuItem>
                    <MenuItem value="best-seller">Bán chạy</MenuItem>
                </Select>
            </FormControl>
        </Paper>
    );
};

export default ProductSort;