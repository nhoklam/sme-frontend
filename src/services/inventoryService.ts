import axiosInstance from './axiosConfig';
import {
    Inventory, InventoryTransaction, LowStockItem,
    AdjustInventoryRequest, ApiResponse, PageResponse,
    InventoryHistoryParams, InventoryHistoryResponse,
} from '../types';

const inventoryService = {
    // Lấy tồn kho theo kho — hỗ trợ server-side filter + pagination
    getByWarehouse: async (
        warehouseId: string,
        params?: {
            keyword?: string;
            stockStatus?: string;
            categoryId?: string;
            page?: number;
            size?: number;
        }
    ): Promise<Inventory[]> => {
        const query = new URLSearchParams();
        if (params?.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params?.stockStatus && params.stockStatus !== 'all') query.set('stockStatus', params.stockStatus);
        if (params?.categoryId) query.set('categoryId', params.categoryId);
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 500));

        // Đúng endpoint: /inventory/warehouse/{id}/search
        const res = await axiosInstance.get<ApiResponse<Inventory[] | PageResponse<Inventory>>>(
            `/inventory/warehouse/${warehouseId}/search?${query}`
        );
        const data = res.data.data;
        // Backend có thể trả về array hoặc PageResponse
        if (Array.isArray(data)) return data;
        return (data as PageResponse<Inventory>)?.content ?? [];
    },

    // Lấy tồn kho có phân trang — dùng cho InventoryListTab (server-side pagination)
    getByWarehousePaged: async (
        warehouseId: string | null | undefined,
        params?: {
            keyword?: string;
            stockStatus?: string;
            categoryId?: string;
            page?: number;
            size?: number;
        }
    ): Promise<PageResponse<any>> => {
        const query = new URLSearchParams();
        if (params?.keyword?.trim()) query.set('keyword', params.keyword.trim());
        if (params?.stockStatus && params.stockStatus !== 'all') query.set('stockStatus', params.stockStatus);
        if (params?.categoryId) query.set('categoryId', params.categoryId);
        query.set('page', String(params?.page ?? 0));
        query.set('size', String(params?.size ?? 30));

        const url = warehouseId ? `/inventory/warehouse/${warehouseId}/search?${query}` : `/inventory/search?${query}`;
        const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>(url);
        const data = res.data.data;
        // Nếu backend trả array, wrap thành PageResponse
        if (Array.isArray(data)) {
            return {
                content: data,
                page: 0,
                size: data.length,
                totalElements: data.length,
                totalPages: 1,
                last: true,
            };
        }
        return data as PageResponse<any>;
    },

    // Lấy tồn kho theo sản phẩm + kho
    getOne: async (productId: string, warehouseId: string): Promise<Inventory> => {
        const res = await axiosInstance.get<ApiResponse<Inventory>>(
            `/inventory/${productId}/warehouse/${warehouseId}`
        );
        return res.data.data;
    },

    // Lấy tồn kho tổng hợp tất cả chi nhánh cho 1 sản phẩm
    getAllWarehousesInventory: async (productId: string): Promise<any[]> => {
        const res = await axiosInstance.get<ApiResponse<any[]>>(
            `/inventory/product/${productId}/all-warehouses`
        );
        return res.data.data;
    },

    // Cảnh báo tồn kho thấp
    getLowStock: async (warehouseId?: string): Promise<LowStockItem[]> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const res = await axiosInstance.get<ApiResponse<LowStockItem[]>>(
            `/inventory/low-stock${params}`
        );
        return res.data.data ?? [];
    },

    // Lịch sử giao dịch của 1 item tồn kho cụ thể
    getTransactions: async (
        inventoryId: string,
        page = 0,
        size = 10
    ): Promise<PageResponse<InventoryTransaction>> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<InventoryTransaction>>>(
            `/inventory/${inventoryId}/transactions?page=${page}&size=${size}`
        );
        return res.data.data;
    },

    // Lịch sử giao dịch tổng hợp toàn kho
    getHistory: async (params: InventoryHistoryParams): Promise<InventoryHistoryResponse> => {
        const query = new URLSearchParams();
        query.set('page', String(params.page ?? 0));
        query.set('size', String(params.size ?? 20));
        if (params.warehouseId) query.set('warehouseId', params.warehouseId);
        if (params.transactionType) query.set('transactionType', params.transactionType);
        if (params.productId) query.set('productId', params.productId);
        if (params.fromDate) query.set('fromDate', params.fromDate);
        if (params.toDate) query.set('toDate', params.toDate);

        const res = await axiosInstance.get<ApiResponse<InventoryHistoryResponse>>(
            `/inventory/transactions?${query}`
        );
        return res.data.data;
    },

    // Điều chỉnh tồn kho
    adjust: async (data: AdjustInventoryRequest): Promise<void> => {
        await axiosInstance.post('/inventory/adjust', data);
    },

    // Điều chỉnh tồn kho hàng loạt
    adjustBulk: async (data: AdjustInventoryRequest[]): Promise<any> => {
        const res = await axiosInstance.post('/inventory/adjust/bulk', data);
        return res.data.data;
    },

    // Cập nhật mức tồn kho tối thiểu
    updateMinQuantity: async (inventoryId: string, minQuantity: number): Promise<void> => {
        await axiosInstance.put(`/inventory/${inventoryId}/min-quantity`, { minQuantity });
    },
};

export default inventoryService;