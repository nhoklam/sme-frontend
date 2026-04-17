import React from 'react';
import { Box } from '@mui/material';
import ProductCard from './ProductCard';
import { PRODUCTS } from '../../../../utils/constants';

const CARD_W = 200;

const ProductGrid = ({ filters, products }) => {
    const data = products ?? PRODUCTS;

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, ${CARD_W}px)`,
            gap: '16px',
            justifyContent: 'start',
        }}>
            {data.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </Box>
    );
};

export default ProductGrid;