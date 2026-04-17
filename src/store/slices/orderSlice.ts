import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    orders: [],
    selectedOrder: null,
    loading: false,
    error: null,
};

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setOrders: (state, action) => {
            state.orders = action.payload;
        },
        setSelectedOrder: (state, action) => {
            state.selectedOrder = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const { setOrders, setSelectedOrder, setLoading, setError } = orderSlice.actions;
export default orderSlice.reducer;