import { useQuery } from '@tanstack/react-query';
import { authorApi } from '../services/authorApi';
import { Author } from '../types';

export const useFeaturedAuthors = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['authors', 'featured'],
    queryFn: async () => {
      const res = await authorApi.getFeatured();
      return res.success ? (res.data as Author[]) : [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    authors: data ?? ([] as Author[]),
    loading: isLoading,
  };
};
