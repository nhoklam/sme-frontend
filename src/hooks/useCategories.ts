import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../services/categoryApi';
import { Category } from '../types';

export const useCategories = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return res.success ? (res.data as Category[]) : [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    categories: data ?? ([] as Category[]),
    loading: isLoading,
  };
};
