// src/modules/customer/hooks/useWishlist.ts
// Vì backend không có Wishlist entity, dùng localStorage để lưu trữ
import { useState, useEffect, useCallback } from 'react';

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    author?: string;
    rating?: number;
    sold?: number;
}

const STORAGE_KEY = 'customer_wishlist';

const load = (): WishlistItem[] => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

export const useWishlist = () => {
    const [items, setItems] = useState<WishlistItem[]>(load);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addToWishlist = useCallback((item: WishlistItem) => {
        setItems(prev => {
            if (prev.some(i => i.id === item.id)) return prev;
            return [...prev, item];
        });
    }, []);

    const removeFromWishlist = useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const clearWishlist = useCallback(() => {
        setItems([]);
    }, []);

    const isInWishlist = useCallback((id: string) => {
        return items.some(i => i.id === id);
    }, [items]);

    const toggleWishlist = useCallback((item: WishlistItem) => {
        setItems(prev => {
            if (prev.some(i => i.id === item.id)) return prev.filter(i => i.id !== item.id);
            return [...prev, item];
        });
    }, []);

    return { items, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist, toggleWishlist };
};
