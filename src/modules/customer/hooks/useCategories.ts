// src/modules/customer/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import categoryService from '../../../services/categoryService';
import { Category } from '../../../types';

// Icon mapping tĩnh — backend không lưu icon, map theo tên danh mục
const CATEGORY_ICONS: Record<string, string> = {
    'Văn Học': '📖',
    'Kỹ Năng': '💡',
    'Kinh Tế': '💰',
    'Thiếu Nhi': '🧸',
    'Tâm Lý': '🧠',
    'Khoa Học': '🔬',
    'Lịch Sử': '🏛️',
    'Ngoại Ngữ': '🌍',
};

const CATEGORY_COLORS: Record<string, string> = {
    'Văn Học': '#fff3e0',
    'Kỹ Năng': '#e8f5e9',
    'Kinh Tế': '#e3f2fd',
    'Thiếu Nhi': '#fce4ec',
    'Tâm Lý': '#f3e5f5',
    'Khoa Học': '#e0f7fa',
    'Lịch Sử': '#efebe9',
    'Ngoại Ngữ': '#f9fbe7',
};

export interface DisplayCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    slug: string;
}

/**
 * Hook lấy tất cả danh mục active, kèm icon và color mapping
 */
export const useCategories = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 phút
    });

    const categories: DisplayCategory[] = (data ?? [])
        .filter((cat: Category) => cat.isActive)
        .map((cat: Category) => ({
            id: cat.id,
            name: cat.name,
            icon: CATEGORY_ICONS[cat.name] ?? '📚',
            color: CATEGORY_COLORS[cat.name] ?? '#f5f5f5',
            slug: cat.slug ?? cat.name.toLowerCase().replace(/\s+/g, '-'),
        }));

    return { categories, isLoading, isError, error: error as Error | null };
};
