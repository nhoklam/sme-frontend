import { useQuery } from '@tanstack/react-query';
import { bannerApi } from '../services/bannerApi';
import { HomeBanner } from '../types';

export const useBanners = (type?: HomeBanner['bannerType']) => {
  const { data, isLoading } = useQuery({
    queryKey: ['banners', type],
    queryFn: async () => {
      const res = await bannerApi.getActiveBanners(type);
      return res.success ? (res.data as HomeBanner[]) : [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    banners: data ?? ([] as HomeBanner[]),
    loading: isLoading,
  };
};
