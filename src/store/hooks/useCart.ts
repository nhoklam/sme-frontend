import { useReducer, useCallback, useEffect } from 'react';

// ── Reducer ────────────────────────────────────────────────────
const cartReducer = (state, action) => {
    switch (action.type) {
        case 'LOAD':
            return action.payload;
        case 'ADD': {
            const existing = state.items.find(i => i.id === action.product.id);
            if (existing) {
                return {
                    ...state,
                    items: state.items.map(i =>
                        i.id === action.product.id
                            ? { ...i, qty: Math.min(i.qty + (action.product.qty || 1), i.stock) }
                            : i
                    ),
                };
            }
            return {
                ...state,
                items: [...state.items, { ...action.product, qty: action.product.qty || 1 }],
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
            return { ...state, items: [], appliedPromotions: [] };

        case 'SET_PROMOTIONS':
            return { ...state, appliedPromotions: action.promotions };

        default:
            return state;
    }
};

// Initial state moved inside the hook to be dynamic

// ── Hook ───────────────────────────────────────────────────────
export const useCart = () => {
    const getAccountId = () => {
        try {
            const customerData = localStorage.getItem('customer_auth');
            if (customerData) {
                const parsed = JSON.parse(customerData);
                if (parsed?.user?.id) return parsed.user.id;
            }
            const userData = localStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed?.id) return parsed.id;
                if (parsed?.user?.id) return parsed.user.id;
            }
        } catch (e) {
            console.error('Failed to parse auth data for cart', e);
        }
        return null;
    };

    const accountId = getAccountId();
    const cartItemsKey = accountId ? `cart_items_${accountId}` : 'cart_items_guest';
    const cartPromosKey = accountId ? `cart_promos_${accountId}` : 'cart_promos_guest';

    const getInitialState = useCallback(() => {
        return {
            items: JSON.parse(localStorage.getItem(cartItemsKey) || '[]'),
            appliedPromotions: JSON.parse(localStorage.getItem(cartPromosKey) || '[]')
        };
    }, [cartItemsKey, cartPromosKey]);

    const [state, dispatch] = useReducer(cartReducer, { items: [], appliedPromotions: [] });

    // Load state when user changes
    useEffect(() => {
        dispatch({ type: 'LOAD', payload: getInitialState() });
    }, [getInitialState]);

    const addToCart = useCallback((product) => dispatch({ type: 'ADD', product }), []);
    const removeItem = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);
    const updateQty = useCallback((id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty }), []);
    
    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR' });
        localStorage.removeItem(cartItemsKey);
        localStorage.removeItem(cartPromosKey);
    }, [cartItemsKey, cartPromosKey]);

    const setAppliedPromotions = useCallback((promotions) => {
        dispatch({ type: 'SET_PROMOTIONS', promotions });
        localStorage.setItem(cartPromosKey, JSON.stringify(promotions));
    }, [cartPromosKey]);

    // Sync items to localStorage
    useEffect(() => {
        if (state.items) {
            localStorage.setItem(cartItemsKey, JSON.stringify(state.items));
        }
    }, [state.items, cartItemsKey]);

    const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
    const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0);
    const totalSaved = state.items.reduce((s, i) => s + ((i.oldPrice || i.price) - i.price) * i.qty, 0);

    return { 
        items: state.items, 
        appliedPromotions: state.appliedPromotions || [],
        addToCart, 
        removeItem, 
        updateQty, 
        clearCart, 
        setAppliedPromotions,
        totalItems, 
        totalPrice, 
        totalSaved 
    };
};

export default useCart;