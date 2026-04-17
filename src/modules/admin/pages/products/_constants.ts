// src/modules/admin/pages/products/_constants.ts

export const fmt = (val: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val ?? 0);

export const getTotalStock = (stock: Record<string, number> = {}): number =>
    Object.values(stock).reduce((s, v) => s + v, 0);

export const getCategoryName = (categories: Array<{ id: string; name: string }>, id?: string): string =>
    categories.find(c => c.id === id)?.name || '—';

export const getSupplierName = (suppliers: Array<{ id: string; name: string }>, id?: string): string =>
    suppliers.find(s => s.id === id)?.name || '—';

export const SORT_OPTIONS = [
    { value: 'name_asc', label: 'Tên A → Z' },
    { value: 'name_desc', label: 'Tên Z → A' },
    { value: 'price_asc', label: 'Giá bán tăng dần' },
    { value: 'price_desc', label: 'Giá bán giảm dần' },
    { value: 'stock_asc', label: 'Tồn kho ít nhất' },
    { value: 'sold_desc', label: 'Bán nhiều nhất' },
];

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const SOLD_FILTERS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Hôm nay', value: 'today' },
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
];

export const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang bán' },
    { value: 'inactive', label: 'Ngừng bán' },
    { value: 'out', label: 'Hết hàng' },
];

export const TABLE_COLUMNS = [
    { label: 'Sản phẩm', width: '26%' },
    { label: 'Mã SP / ISBN', width: '11%' },
    { label: 'Danh mục', width: '9%' },
    { label: 'Tồn kho', width: '11%', align: 'center' },
    { label: 'Giá vốn (MAC)', width: '10%', align: 'right' },
    { label: 'Giá bán lẻ', width: '10%', align: 'right' },
    { label: 'Giá sỉ', width: '9%', align: 'right' },
    { label: 'Đơn vị', width: '5%', align: 'center' },
    { label: 'Trạng thái', width: '8%', align: 'center' },
    { label: '', width: '4%', align: 'center' },
];