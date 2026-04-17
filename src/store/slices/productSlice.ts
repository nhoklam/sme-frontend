import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 0,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setProducts: (state, action) => {
            state.products = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setSelectedProduct: (state, action) => {
            state.selectedProduct = action.payload;
        },
    },
});

export const { setProducts, setLoading, setError, setSelectedProduct } = productSlice.actions;
export default productSlice.reducer;