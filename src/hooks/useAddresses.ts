import { useState, useEffect, useCallback } from 'react';
import { customerApi } from '../services/customerApi';
import { CustomerAddress } from '../types';

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAddresses();
      if (res.success) {
        setAddresses(res.data);
      }
    } catch (err) {
      console.error('Error fetching addresses', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = async (data: Omit<CustomerAddress, 'id' | 'customerId'>) => {
    try {
      await customerApi.addAddress(data);
      await fetchAddresses();
    } catch (err) {
      throw err;
    }
  };

  const updateAddress = async (id: string, data: Partial<CustomerAddress>) => {
    try {
      await customerApi.updateAddress(id, data);
      await fetchAddresses();
    } catch (err) {
      throw err;
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await customerApi.deleteAddress(id);
      await fetchAddresses();
    } catch (err) {
      throw err;
    }
  };

  const setDefault = async (id: string) => {
    try {
      await customerApi.setDefaultAddress(id);
      await fetchAddresses();
    } catch (err) {
      throw err;
    }
  };

  return { addresses, loading, addAddress, updateAddress, deleteAddress, setDefault, refetch: fetchAddresses };
};
