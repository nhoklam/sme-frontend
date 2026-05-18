import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR' };

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('bookly_cart') || '[]'),
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) => item.productId === product.id
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        const newQuantity = newItems[existingIndex].quantity + quantity;
        const available = product.availableQuantity || 0;

        newItems[existingIndex].quantity = Math.min(newQuantity, available);
        newItems[existingIndex].subtotal = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
        return { ...state, items: newItems };
      }
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        isbnBarcode: product.isbnBarcode || '',
        quantity: quantity,
        unitPrice: product.retailPrice,
        macPrice: product.macPrice || product.retailPrice,
        subtotal: product.retailPrice * quantity,
        imageUrl: product.imageUrl,
        unit: product.unit,
      };
      return {
        ...state,
        items: [...state.items, newItem],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.payload),
      };
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.productId === action.payload.productId) {
            // Note: we can't easily validate against availableQuantity here unless we fetch the product or store it in cart.
            // But we will allow the update, assuming UI limits it.
            const newQty = Math.max(1, action.payload.quantity);
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        }),
      };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    localStorage.setItem('bookly_cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + item.subtotal, 0);

  const addItem = (product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
  };

  const isInCart = (productId: string) => {
    return state.items.some((item) => item.productId === productId);
  };

  const getItemQuantity = (productId: string) => {
    const item = state.items.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    items: state.items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
