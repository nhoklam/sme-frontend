// src/modules/customer/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import categoryService from '../../../services/categoryService';
import { Category } from '../../../types';

// Icon mapping tĩnh — backend không lưu icon, map theo tên danh mục
const CATEGORY_ICONS: Record<string, string> = {
    'Văn Học': '📚',
    'Kỹ Năng': '💡',
    'Kinh Tế': '💰',
    'Thiếu Nhi': '🧸',
    'Tâm Lý': '🧠',
    'Khoa Học': '🔬',
    'Lịch Sử': '🏛️',
    'Ngoại Ngữ': '🌍',
    'Sách Mầm Non': '👶',
    'Sách Thiếu Nhi': '🧸',
    'Sách Kĩ Năng': '💡',
    'Sách Kinh Doanh': '📈',
    'Sách Mẹ Và Bé': '🤱',
    'Sách Văn Học': '📖',
    'Sách Tham Khảo': '📓',
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

const getCategoryIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tư duy') || lowerName.includes('kỹ năng') || lowerName.includes('kĩ năng')) return '💡';
    if (lowerName.includes('văn hóa') || lowerName.includes('nghệ thuật') || lowerName.includes('văn học')) return '📚';
    if (lowerName.includes('kinh tế') || lowerName.includes('tài chính') || lowerName.includes('kinh doanh')) return '💰';
    if (lowerName.includes('lịch sử') || lowerName.includes('chính trị')) return '🏛️';
    if (lowerName.includes('khoa học') || lowerName.includes('giáo dục')) return '🔬';
    if (lowerName.includes('gia đình') || lowerName.includes('mẹ và bé')) return '🏠';
    if (lowerName.includes('thiếu nhi') || lowerName.includes('mầm non')) return '🧸';
    if (lowerName.includes('tâm lý')) return '🧠';
    if (lowerName.includes('ngoại ngữ') || lowerName.includes('tiếng')) return '🌍';
    if (lowerName.includes('công nghệ') || lowerName.includes('it')) return '💻';
    if (lowerName.includes('y học') || lowerName.includes('sức khỏe')) return '⚕️';
    if (lowerName.includes('tôn giáo') || lowerName.includes('tâm linh')) return '🕉️';
    if (lowerName.includes('tiểu thuyết') || lowerName.includes('truyện')) return '📖';
    if (lowerName.includes('tham khảo')) return '📓';
    
    return CATEGORY_ICONS[name] ?? '📔'; // Icon mặc định
};

export interface DisplayCategory {
    id: string;
    parentId?: string | null;
    name: string;
    icon: string;
    color: string;
    slug: string;
    children: DisplayCategory[];
}

/**
 * Hook lấy tất cả danh mục active, hỗ trợ cấu trúc phân cấp Parent-Child
 */
export const useCategories = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 phút
    });

    const { categories, flatCategories } = useMemo(() => {
        const activeList = (data ?? []).filter((cat: Category) => cat.isActive);
        
        // 1. Tạo danh sách phẳng được map thông tin icon/color
        const mappedList: DisplayCategory[] = activeList.map((cat: Category) => ({
            id: cat.id,
            parentId: cat.parentId,
            name: cat.name,
            icon: getCategoryIcon(cat.name),
            color: CATEGORY_COLORS[cat.name] ?? '#f5f5f5',
            slug: cat.slug ?? cat.name.toLowerCase().replace(/\s+/g, '-'),
            children: [],
        }));

        // 2. Xây dựng cây thư mục cha-con
        const categoryMap = new Map<string, DisplayCategory>();
        const rootCategories: DisplayCategory[] = [];

        mappedList.forEach(cat => {
            categoryMap.set(cat.id, cat);
        });

        mappedList.forEach(cat => {
            if (cat.parentId && categoryMap.has(cat.parentId)) {
                categoryMap.get(cat.parentId)!.children.push(cat);
            } else {
                rootCategories.push(cat);
            }
        });

        // Sắp xếp các danh mục con theo thứ tự bảng chữ cái hoặc logic
        rootCategories.forEach(root => {
            root.children.sort((a, b) => a.name.localeCompare(b.name));
        });

        return {
            categories: rootCategories,
            flatCategories: mappedList
        };
    }, [data]);

    return { 
        categories, 
        flatCategories, 
        isLoading, 
        isError, 
        error: error as Error | null 
    };
};
