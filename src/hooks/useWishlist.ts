import { useState, useEffect, useCallback } from 'react';
import { customerApi } from '../services/customerApi';
import { WishlistItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useWishlist = () => {
  const { isAuthenticated, isCustomer } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !isCustomer) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await customerApi.getWishlist();
      if (res.success) setItems(res.data);
    } catch (err) {
      console.error('Error fetching wishlist', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated || !isCustomer) return;
    try {
      await customerApi.addToWishlist(productId);
      await fetchWishlist();
    } catch (err) {
      console.error('Error adding to wishlist', err);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!isAuthenticated || !isCustomer) return;
    try {
      await customerApi.removeFromWishlist(productId);
      await fetchWishlist();
    } catch (err) {
      console.error('Error removing from wishlist', err);
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product.id === productId);
  };

  const toggle = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return { items, loading, addToWishlist, removeFromWishlist, isInWishlist, toggle };
};
