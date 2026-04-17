import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    inventory: [],
    loading: false,
    error: null,
    alerts: [],
};

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        setInventory: (state, action) => {
            state.inventory = action.payload;
        },
        setAlerts: (state, action) => {
            state.alerts = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const { setInventory, setAlerts, setLoading, setError } = inventorySlice.actions;
export default inventorySlice.reducer;