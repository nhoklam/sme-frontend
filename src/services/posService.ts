// src/services/posService.ts
import axiosInstance from './axiosConfig';
import { ApiResponse } from '../types';

export interface RefundItem {
    productId: string;
    quantity: number;
}

export interface RefundRequest {
    originalInvoiceId: string;
    shiftId: string;
    items: RefundItem[];
    returnDestination: string; // STOCK, DEFECT
    cashierId: string;
    warehouseId: string;
    note?: string;
}

const posService = {
    // API Lấy hóa đơn theo mã code (dùng để tìm kiếm khi trả hàng)
    // Cần tạo hàm này trên Backend nếu chưa có, hoặc dùng getById
    getInvoiceByCode: async (code: string): Promise<any> => {
        // Tùy theo backend của bạn có endpoint này không, tạm dùng endpoint get theo code
        const res = await axiosInstance.get<ApiResponse<any>>(`/pos/invoices/code/${code}`);
        return res.data.data;
    },

    getCurrentShift: async (): Promise<any> => {
        const res = await axiosInstance.get<ApiResponse<any>>('/pos/shifts/current');
        return res.data.data;
    },

    // Thực hiện trả hàng
    refund: async (originalInvoiceId: string, payload: Omit<RefundRequest, 'originalInvoiceId'>): Promise<any> => {
        const res = await axiosInstance.post<ApiResponse<any>>(
            `/pos/refund/${originalInvoiceId}`,
            payload
        );
        return res.data.data;
    },

    // Khởi tạo mã QR thanh toán (VNPay / PayOS)
    initQrCheckout: async (gateway: string, req: any): Promise<{ checkoutUrl: string; orderCode: string; amount: number; gateway: string }> => {
        const res = await axiosInstance.post<ApiResponse<any>>(`/pos/qr-checkout-init?gateway=${gateway}`, req);
        return res.data.data;
    },
};

export default posService;
