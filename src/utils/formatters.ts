// src/utils/formatters.ts

/**
 * Format số tiền VNĐ
 * @example formatCurrency(1500000) → "1.500.000 ₫"
 */
export const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Format số lượng có dấu phân cách
 * @example formatNumber(1500000) → "1.500.000"
 */
export const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Format ngày theo locale vi-VN
 * @example formatDate("2024-01-15") → "15/01/2024"
 */
export const formatDate = (value: string | Date | null | undefined): string => {
    if (!value) return '';
    try {
        const d = typeof value === 'string' ? new Date(value) : value;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return String(value);
    }
};

/**
 * Format ngày giờ
 * @example formatDateTime("2024-01-15T10:30:00") → "15/01/2024 10:30"
 */
export const formatDateTime = (value: string | Date | null | undefined): string => {
    if (!value) return '';
    try {
        const d = typeof value === 'string' ? new Date(value) : value;
        return d.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return String(value);
    }
};

/**
 * Rút gọn text dài
 * @example truncate("Sản phẩm dài tên", 10) → "Sản phẩm ..."
 */
export const truncate = (text: string, maxLength = 50): string => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};