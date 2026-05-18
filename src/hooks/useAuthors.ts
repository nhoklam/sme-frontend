import { useState, useEffect } from 'react';
import { authorApi } from '../services/authorApi';
import { Author } from '../types';

export const useFeaturedAuthors = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      setLoading(true);
      try {
        const res = await authorApi.getFeatured();
        if (res.success) setAuthors(res.data);
      } catch (err) {
        console.error('Error fetching featured authors', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  return { authors, loading };
};
