import { useReducer, useCallback } from 'react';

// ── Reducer ────────────────────────────────────────────────────
const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD': {
            const existing = state.items.find(i => i.id === action.product.id);
            if (existing) {
                return {
                    ...state,
                    items: state.items.map(i =>
                        i.id === action.product.id
                            ? { ...i, qty: Math.min(i.qty + 1, i.stock) }
                            : i
                    ),
                };
            }
            return {
                ...state,
                items: [...state.items, { ...action.product, qty: 1 }],
            };
        }
        case 'REMOVE':
            return { ...state, items: state.items.filter(i => i.id !== action.id) };

        case 'UPDATE_QTY':
            return {
                ...state,
                items: state.items.map(i =>
                    i.id === action.id
                        ? { ...i, qty: Math.max(1, Math.min(action.qty, i.stock)) }
                        : i
                ),
            };
        case 'CLEAR':
            return { ...state, items: [] };

        default:
            return state;
    }
};

const initialState = { items: [] };

// ── Hook ───────────────────────────────────────────────────────
export const useCart = () => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    const addToCart = useCallback((product) => dispatch({ type: 'ADD', product }), []);
    const removeItem = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);
    const updateQty = useCallback((id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty }), []);
    const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

    const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
    const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0);
    const totalSaved = state.items.reduce((s, i) => s + (i.oldPrice - i.price) * i.qty, 0);

    return { items: state.items, addToCart, removeItem, updateQty, clearCart, totalItems, totalPrice, totalSaved };
};

export default useCart;