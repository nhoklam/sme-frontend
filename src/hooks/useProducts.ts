import { useState, useEffect } from 'react';
import { productApi } from '../services/productApi';
import { Product } from '../types';

export const useProducts = (initialParams: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [params, setParams] = useState(initialParams);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productApi.getProducts(params);
        if (res.success) {
          setProducts(res.data.content);
          setTotalPages(res.data.totalPages);
          setCurrentPage(res.data.page);
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [params]);

  const setPage = (page: number) => {
    setParams((prev: any) => ({ ...prev, page }));
  };

  return { products, loading, error, totalPages, currentPage, setPage, setParams };
};

export const useProductDetail = (slug: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productApi.getBySlug(slug);
        if (res.success) setProduct(res.data);
      } catch (err: any) {
        setError(err.message || 'Lỗi tải chi tiết sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  return { product, loading, error };
};

export const useFlashSale = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSale = async () => {
      setLoading(true);
      try {
        const res = await productApi.getFlashSale();
        if (res.success) setProducts(res.data);
      } catch (err) {
        console.error('Error fetching flash sale', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  return { products, loading };
};
