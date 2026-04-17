import React from 'react';
import { Paper, Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Slider, Button } from '@mui/material';

const ProductFilters = ({ filters, setFilters }) => {
    const categories = ['Tất cả', 'Sách Thiếu Nhi', 'Văn Học', 'Kinh Tế', 'Kỹ Năng'];

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Bộ lọc
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Danh mục</FormLabel>
                <RadioGroup
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                    {categories.map((cat) => (
                        <FormControlLabel key={cat} value={cat} control={<Radio />} label={cat} />
                    ))}
                </RadioGroup>
            </FormControl>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Khoảng giá</FormLabel>
                <Slider
                    value={filters.priceRange || [0, 500000]}
                    onChange={(e, val) => setFilters({ ...filters, priceRange: val })}
                    valueLabelDisplay="auto"
                    min={0}
                    max={500000}
                    step={50000}
                />
            </FormControl>

            <Button
                fullWidth
                variant="outlined"
                onClick={() => setFilters({ category: '', priceRange: '', sort: 'newest' })}
                sx={{ borderColor: '#006994', color: '#006994' }}
            >
                Xóa bộ lọc
            </Button>
        </Paper>
    );
};

export default ProductFilters;