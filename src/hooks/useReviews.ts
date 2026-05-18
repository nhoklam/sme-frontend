import { useState, useEffect, useCallback } from 'react';
import { productApi } from '../services/productApi';
import { ProductReview } from '../types';

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async (pageIndex: number = 0) => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await productApi.getReviews(productId, pageIndex, 5);
      if (res.success) {
        setReviews(res.data.content);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      }
    } catch (err) {
      console.error('Error fetching reviews', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews(0);
  }, [fetchReviews]);

  const submitReview = async (data: { orderId: string; rating: number; comment?: string }) => {
    setSubmitting(true);
    try {
      await productApi.createReview(productId, data);
      await fetchReviews(0); // Refresh lại
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { reviews, loading, totalPages, page, setPage: fetchReviews, submitReview, submitting };
};
