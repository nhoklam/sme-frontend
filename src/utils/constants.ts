// src/utils/constants.ts

/**
 * Format số tiền VNĐ
 */
export const fmt = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Tính phần trăm giảm giá
 */
export const calcDiscount = (oldPrice: number, price: number): number => {
    if (!oldPrice || oldPrice <= 0) return 0;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
};

/**
 * Tạo giảm giá ảo nhất quán dựa trên ID và số lượng đã bán
 * Bán chạy (sold >= 10) luôn giảm 30%, bình thường thì dưới 20%
 */
export const getFakeDiscount = (id: string | number, sold: number = 0): number => {
    if (sold >= 10) return 30;
    const discounts = [10, 12, 15, 18, 19];
    const sum = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return discounts[sum % discounts.length];
};

/**
 * Tính giá gốc ảo dựa trên giá hiện tại và phần trăm giảm
 */
export const getFakeOriginalPrice = (price: number, discountPercent: number): number => {
    if (discountPercent <= 0) return price;
    const calcPrice = price / (1 - discountPercent / 100);
    return Math.ceil(calcPrice / 1000) * 1000;
};

// ── Mock data ──────────────────────────────────────────────────

export interface MockProduct {
    id: number;
    title: string;
    author: string;
    publisher: string;
    year: number;
    price: number;
    oldPrice: number;
    rating: number;
    sold: number;
    stock: number;
    pages: number;
    category: string;
    badge: string;
    description: string;
    img?: string;
    images?: string[];
}

export const PRODUCTS: MockProduct[] = [
    {
        id: 1,
        title: 'Đắc Nhân Tâm',
        author: 'Dale Carnegie',
        publisher: 'NXB Tổng hợp TP.HCM',
        year: 2023,
        price: 79000,
        oldPrice: 110000,
        rating: 4.9,
        sold: 12500,
        stock: 48,
        pages: 320,
        category: 'Kỹ Năng',
        badge: 'Bestseller',
        description: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử, giúp bạn chinh phục mọi người xung quanh.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/df/7d/da/d340edde5e8e76144572f414e3e11463.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/df/7d/da/d340edde5e8e76144572f414e3e11463.jpg'],
    },
    {
        id: 2,
        title: 'Nhà Giả Kim',
        author: 'Paulo Coelho',
        publisher: 'NXB Hội Nhà Văn',
        year: 2022,
        price: 69000,
        oldPrice: 95000,
        rating: 4.8,
        sold: 9800,
        stock: 32,
        pages: 224,
        category: 'Văn Học',
        badge: 'Hot',
        description: 'Hành trình tìm kiếm kho báu và ý nghĩa cuộc đời của một chàng trai trẻ người Tây Ban Nha.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/45/05/a3/4b544f4f0d8debef0d27e7ef4f27283c.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/45/05/a3/4b544f4f0d8debef0d27e7ef4f27283c.jpg'],
    },
    {
        id: 3,
        title: 'Tư Duy Nhanh Và Chậm',
        author: 'Daniel Kahneman',
        publisher: 'NXB Thế Giới',
        year: 2023,
        price: 125000,
        oldPrice: 165000,
        rating: 4.7,
        sold: 5600,
        stock: 25,
        pages: 560,
        category: 'Tâm Lý',
        badge: 'Mới',
        description: 'Khám phá hai hệ thống tư duy của con người và cách chúng ảnh hưởng đến quyết định hàng ngày.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/72/a7/87/a2d8d20e02e5eb18d54e1e06ff60dcc8.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/72/a7/87/a2d8d20e02e5eb18d54e1e06ff60dcc8.jpg'],
    },
    {
        id: 4,
        title: 'Dám Nghĩ Lớn',
        author: 'David J. Schwartz',
        publisher: 'NXB Lao Động',
        year: 2023,
        price: 85000,
        oldPrice: 120000,
        rating: 4.6,
        sold: 7200,
        stock: 40,
        pages: 384,
        category: 'Kỹ Năng',
        badge: 'Bestseller',
        description: 'Hướng dẫn thực tế để phát triển tư duy lớn và đạt được những mục tiêu tưởng chừng không thể.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/7a/75/88/f90b86bd396e0d5ee4e51f0a5d76f0b0.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/7a/75/88/f90b86bd396e0d5ee4e51f0a5d76f0b0.jpg'],
    },
    {
        id: 5,
        title: 'Bí Mật Của May Mắn',
        author: 'Alex Rovira & Fernando Trias de Bes',
        publisher: 'NXB Trẻ',
        year: 2022,
        price: 55000,
        oldPrice: 75000,
        rating: 4.5,
        sold: 4300,
        stock: 60,
        pages: 192,
        category: 'Kỹ Năng',
        badge: 'Hot',
        description: 'Câu chuyện về hành trình tìm kiếm may mắn thực sự trong cuộc sống.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/9c/98/3c/74665f00a5085e23f0e6daeaa1a84a2a.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/9c/98/3c/74665f00a5085e23f0e6daeaa1a84a2a.jpg'],
    },
    {
        id: 6,
        title: 'Dế Mèn Phiêu Lưu Ký',
        author: 'Tô Hoài',
        publisher: 'NXB Kim Đồng',
        year: 2021,
        price: 45000,
        oldPrice: 60000,
        rating: 4.8,
        sold: 15000,
        stock: 80,
        pages: 168,
        category: 'Thiếu Nhi',
        badge: 'Bestseller',
        description: 'Tác phẩm kinh điển của văn học thiếu nhi Việt Nam, kể về những cuộc phiêu lưu của chú dế mèn.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/6e/03/04/06e6f9512ee4f7b36e97b5e1a25c1b7c.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/6e/03/04/06e6f9512ee4f7b36e97b5e1a25c1b7c.jpg'],
    },
    {
        id: 7,
        title: 'Cha Giàu Cha Nghèo',
        author: 'Robert T. Kiyosaki',
        publisher: 'NXB Trẻ',
        year: 2023,
        price: 99000,
        oldPrice: 140000,
        rating: 4.7,
        sold: 18000,
        stock: 35,
        pages: 336,
        category: 'Kinh Tế',
        badge: 'Bestseller',
        description: 'Bài học về tài chính cá nhân từ hai người cha với tư duy hoàn toàn khác nhau về tiền bạc.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/be/62/68/35b2929cff5aaad3eadf4d6def06e9db.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/be/62/68/35b2929cff5aaad3eadf4d6def06e9db.jpg'],
    },
    {
        id: 8,
        title: 'Người Đọc Sách Không Bao Giờ Cô Đơn',
        author: 'Phan Thị Vàng Anh',
        publisher: 'NXB Hội Nhà Văn',
        year: 2022,
        price: 65000,
        oldPrice: 88000,
        rating: 4.4,
        sold: 3200,
        stock: 50,
        pages: 252,
        category: 'Văn Học',
        badge: 'Mới',
        description: 'Tập truyện ngắn đặc sắc về những số phận con người trong cuộc sống hiện đại.',
        img: 'https://salt.tikicdn.com/cache/w1200/ts/product/3e/47/bb/d0a5d1c69ba09a7afe4bb0e7f0eee1c1.jpg',
        images: ['https://salt.tikicdn.com/cache/w1200/ts/product/3e/47/bb/d0a5d1c69ba09a7afe4bb0e7f0eee1c1.jpg'],
    },
];

export interface MockCategory {
    id: number;
    name: string;
    icon: string;
    count: number;
    color: string;
    slug: string;
}

export const CATEGORIES: MockCategory[] = [
    { id: 1, name: 'Văn Học', icon: '📖', count: 120, color: '#fff3e0', slug: 'van-hoc' },
    { id: 2, name: 'Kỹ Năng', icon: '💡', count: 85, color: '#e8f5e9', slug: 'ky-nang' },
    { id: 3, name: 'Kinh Tế', icon: '💰', count: 64, color: '#e3f2fd', slug: 'kinh-te' },
    { id: 4, name: 'Thiếu Nhi', icon: '🧸', count: 93, color: '#fce4ec', slug: 'thieu-nhi' },
    { id: 5, name: 'Tâm Lý', icon: '🧠', count: 47, color: '#f3e5f5', slug: 'tam-ly' },
    { id: 6, name: 'Khoa Học', icon: '🔬', count: 38, color: '#e0f7fa', slug: 'khoa-hoc' },
    { id: 7, name: 'Lịch Sử', icon: '🏛️', count: 29, color: '#efebe9', slug: 'lich-su' },
    { id: 8, name: 'Ngoại Ngữ', icon: '🌍', count: 56, color: '#f9fbe7', slug: 'ngoai-ngu' },
];

export interface MockBanner {
    title: string;
    sub: string;
    btn: string;
    bg: string;
    tag: string;
}

export const BANNERS: MockBanner[] = [
    {
        title: 'Kho sách\nhàng đầu\nViệt Nam',
        sub: 'Hơn 50.000 đầu sách từ các NXB uy tín',
        btn: 'Khám phá ngay',
        bg: 'linear-gradient(135deg, #d32f2f 0%, #880e4f 100%)',
        tag: '🔥 HOT DEAL',
    },
    {
        title: 'Flash Sale\nmỗi ngày\n12h & 20h',
        sub: 'Giảm đến 70% — Số lượng có hạn!',
        btn: 'Săn ngay',
        bg: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
        tag: '⚡ FLASH SALE',
    },
    {
        title: 'Sách mới\nvề mỗi ngày\ncho bạn',
        sub: 'Cập nhật liên tục từ các nhà xuất bản',
        btn: 'Xem sách mới',
        bg: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
        tag: '📦 SÁCH MỚI',
    },
];

export interface MockService {
    icon: string;
    title: string;
    sub: string;
}

export const SERVICES: MockService[] = [
    { icon: '🚚', title: 'Miễn phí vận chuyển', sub: 'Đơn từ 150.000đ' },
    { icon: '✅', title: 'Sách chính hãng', sub: '100% có nguồn gốc' },
    { icon: '🔄', title: 'Đổi trả dễ dàng', sub: 'Trong vòng 7 ngày' },
    { icon: '🎁', title: 'Quà tặng hấp dẫn', sub: 'Mỗi đơn hàng' },
];

export const NAV_LINKS: string[] = [
    'Trang chủ',
    'Sách văn học',
    'Sách kinh tế',
    'Thiếu nhi',
    'Sách kỹ năng sống',
    'Combo sách',
    'Flash sale',
    'Tin tức',
];