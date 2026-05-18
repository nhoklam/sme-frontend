import { useState, useEffect, useCallback } from 'react';
import { customerApi } from '../services/customerApi';
import { Order } from '../types';

export const useOrders = (initialPage = 0, size = 10) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchOrders = useCallback(async (pageIndex: number) => {
    setLoading(true);
    try {
      const res = await customerApi.getOrders(pageIndex, size);
      if (res.success) {
        setOrders(res.data.content);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.page);
      }
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  }, [size]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const setPage = (page: number) => {
    setCurrentPage(page);
  };

  return { orders, loading, totalPages, currentPage, setPage };
};

export const useOrderDetail = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await customerApi.getOrderDetail(orderId);
        if (res.success) setOrder(res.data);
      } catch (err) {
        console.error('Error fetching order detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  return { order, loading };
};
