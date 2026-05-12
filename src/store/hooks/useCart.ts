import { useReducer, useCallback, useEffect } from 'react';

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
            return { ...state, items: [], appliedPromotion: null };

        case 'SET_PROMOTION':
            return { ...state, appliedPromotion: action.promotion };

        default:
            return state;
    }
};

const initialState = { 
    items: JSON.parse(localStorage.getItem('cart_items') || '[]'),
    appliedPromotion: JSON.parse(localStorage.getItem('cart_promo') || 'null')
};

// ── Hook ───────────────────────────────────────────────────────
export const useCart = () => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    const addToCart = useCallback((product) => dispatch({ type: 'ADD', product }), []);
    const removeItem = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);
    const updateQty = useCallback((id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty }), []);
    
    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR' });
        localStorage.removeItem('cart_items');
        localStorage.removeItem('cart_promo');
    }, []);

    const setAppliedPromotion = useCallback((promotion) => {
        dispatch({ type: 'SET_PROMOTION', promotion });
        localStorage.setItem('cart_promo', JSON.stringify(promotion));
    }, []);

    // Sync items to localStorage
    useEffect(() => {
        localStorage.setItem('cart_items', JSON.stringify(state.items));
    }, [state.items]);

    const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
    const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0);
    const totalSaved = state.items.reduce((s, i) => s + ((i.oldPrice || i.price) - i.price) * i.qty, 0);

    return { 
        items: state.items, 
        appliedPromotion: state.appliedPromotion,
        addToCart, 
        removeItem, 
        updateQty, 
        clearCart, 
        setAppliedPromotion,
        totalItems, 
        totalPrice, 
        totalSaved 
    };
};

export default useCart;