// src/services/inventoryService.ts
import axiosInstance from './axiosConfig';
import {
    Inventory, InventoryTransaction, LowStockItem,
    AdjustInventoryRequest, ApiResponse, PageResponse
} from '../types';

const inventoryService = {
    // Lấy tồn kho theo kho
    getByWarehouse: async (warehouseId: string): Promise<Inventory[]> => {
        const res = await axiosInstance.get<ApiResponse<Inventory[]>>(`/inventory/warehouse/${warehouseId}`);
        return res.data.data ?? [];
    },

    // Lấy tồn kho theo sản phẩm + kho
    getOne: async (productId: string, warehouseId: string): Promise<Inventory> => {
        const res = await axiosInstance.get<ApiResponse<Inventory>>(`/inventory/${productId}/warehouse/${warehouseId}`);
        return res.data.data;
    },

    // Cảnh báo tồn kho thấp
    getLowStock: async (warehouseId?: string): Promise<LowStockItem[]> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<LowStockItem[]>>(`/inventory/low-stock${params}`);
        return res.data.data ?? [];
    },

    // Lịch sử giao dịch kho (có phân trang)
    getTransactions: async (inventoryId: string, page = 0, size = 10): Promise<PageResponse<InventoryTransaction>> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<InventoryTransaction>>>(
            `/inventory/${inventoryId}/transactions?page=${page}&size=${size}`
        );
        return res.data.data;
    },

    // Điều chỉnh tồn kho
    adjust: async (data: AdjustInventoryRequest): Promise<void> => {
        await axiosInstance.post('/inventory/adjust', data);
    },

    // Cập nhật mức tồn kho tối thiểu
    updateMinQuantity: async (inventoryId: string, minQuantity: number): Promise<void> => {
        await axiosInstance.put(`/inventory/${inventoryId}/min-quantity`, { minQuantity });
    },
};

export default inventoryService;