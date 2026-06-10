import { Category } from '../types';

export interface CategoryWithLevel extends Category {
    level: number;
}

export function buildCategoryTreeFlat(categories: Category[], parentId?: string, level: number = 0): CategoryWithLevel[] {
    let result: CategoryWithLevel[] = [];
    
    const children = categories.filter(c => {
        if (!parentId) {
            return !c.parentId; // Root categories
        }
        return c.parentId === parentId;
    }).sort((a, b) => a.sortOrder - b.sortOrder);

    for (const child of children) {
        result.push({ ...child, level });
        result = result.concat(buildCategoryTreeFlat(categories, child.id, level + 1));
    }

    return result;
}
