import { useState, useEffect } from 'react';
import { bannerApi } from '../services/bannerApi';
import { HomeBanner } from '../types';

export const useBanners = (type?: HomeBanner['bannerType']) => {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const res = await bannerApi.getActiveBanners(type);
        if (res.success) setBanners(res.data);
      } catch (err) {
        console.error('Error fetching banners', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [type]);

  return { banners, loading };
};
