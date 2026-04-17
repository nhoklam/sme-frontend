import { createSlice } from '@reduxjs/toolkit';

const loadCartFromStorage = () => {
    try {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : { items: [], totalQuantity: 0, totalAmount: 0 };
    } catch {
        return { items: [], totalQuantity: 0, totalAmount: 0 };
    }
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const existingItem = state.items.find(item => item.id === action.payload.id);
            if (existingItem) {
                existingItem.quantity += action.payload.quantity;
            } else {
                state.items.push(action.payload);
            }
            state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
            state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            localStorage.setItem('cart', JSON.stringify(state));
        },
        removeFromCart: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
            state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
            state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            localStorage.setItem('cart', JSON.stringify(state));
        },
        updateQuantity: (state, action) => {
            const item = state.items.find(item => item.id === action.payload.id);
            if (item) {
                item.quantity = action.payload.quantity;
            }
            state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
            state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            localStorage.setItem('cart', JSON.stringify(state));
        },
        clearCart: (state) => {
            state.items = [];
            state.totalQuantity = 0;
            state.totalAmount = 0;
            localStorage.removeItem('cart');
        },
    },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;