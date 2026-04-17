
export const REPORT_SUMMARY = {
    cashIn: 483259000,
    cashOut: 21781089,
    cashNet: 461477911,
    newCustomers: 9,
    totalOrders: 140,
    monthRevenue: 689948810,
};

// Doanh thu + số đơn theo ngày (tháng 1/2026)
export const REVENUE_BY_DAY = [
    { date: '02/01', revenue: 18500000, orders: 12 },
    { date: '03/01', revenue: 22000000, orders: 15 },
    { date: '04/01', revenue: 19800000, orders: 13 },
    { date: '05/01', revenue: 16200000, orders: 10 },
    { date: '06/01', revenue: 14500000, orders: 9 },
    { date: '07/01', revenue: 11000000, orders: 7 },
    { date: '08/01', revenue: 13800000, orders: 8 },
    { date: '09/01', revenue: 17500000, orders: 11 },
    { date: '10/01', revenue: 20200000, orders: 14 },
    { date: '11/01', revenue: 18900000, orders: 12 },
    { date: '12/01', revenue: 15600000, orders: 10 },
    { date: '13/01', revenue: 14200000, orders: 9 },
    { date: '14/01', revenue: 19100000, orders: 13 },
    { date: '15/01', revenue: 16800000, orders: 11 },
    { date: '16/01', revenue: 12500000, orders: 8 },
    { date: '17/01', revenue: 9800000, orders: 6 },
    { date: '18/01', revenue: 11200000, orders: 7 },
    { date: '19/01', revenue: 14600000, orders: 9 },
    { date: '20/01', revenue: 17300000, orders: 11 },
    { date: '21/01', revenue: 19800000, orders: 13 },
    { date: '22/01', revenue: 22100000, orders: 15 },
    { date: '23/01', revenue: 18400000, orders: 12 },
    { date: '24/01', revenue: 15700000, orders: 10 },
    { date: '25/01', revenue: 13900000, orders: 9 },
    { date: '26/01', revenue: 10500000, orders: 7 },
    { date: '27/01', revenue: 12800000, orders: 8 },
    { date: '28/01', revenue: 16400000, orders: 11 },
    { date: '29/01', revenue: 19200000, orders: 13 },
    { date: '30/01', revenue: 4800000, orders: 3 },
];

// Top khách hàng theo doanh thu
export const TOP_CUSTOMERS = [
    { name: 'Lê Quang Thu', revenue: 112000000 },
    { name: 'Bùi Hải Mai', revenue: 87500000 },
    { name: 'Phan Ngọc Quân', revenue: 65200000 },
    { name: 'Huỳnh Thanh Vy', revenue: 54800000 },
    { name: 'Đặng Thị Thảo', revenue: 48300000 },
    { name: 'Dương Gia Hiếu', revenue: 42100000 },
    { name: 'Phạm Ngọc Quân', revenue: 38600000 },
    { name: 'Phan Ngọc Quân', revenue: 35200000 },
    { name: 'Mai Văn Cường', revenue: 31900000 },
    { name: 'Đỗ Đức Giang', revenue: 29400000 },
];

// Bảng thu - chi
export const CASHFLOW_ROWS = [
    { customer: 'Trịnh Khánh Lan', thu: 100000, thuNote: 'CK', chi: 20000, chiNote: '' },
    { customer: 'Trịnh Khánh Lan', thu: 3045000, thuNote: '', chi: 200000, chiNote: '' },
    { customer: 'Dương Gia Hiếu', thu: 10420000, thuNote: 'CK', chi: 520000, chiNote: '' },
    { customer: 'Hoàng Gia Hiếu', thu: 325000, thuNote: '', chi: 0, chiNote: '' },
    { customer: 'Trần Đức Giang', thu: 4000000, thuNote: '', chi: 220000, chiNote: '' },
    { customer: 'Dương Gia Hiếu', thu: 0, thuNote: '', chi: 200000, chiNote: '' },
    { customer: 'Huỳnh Thanh Vy', thu: 190000, thuNote: '', chi: 0, chiNote: '' },
    { customer: 'Đinh Ngọc Quân', thu: 1600000, thuNote: '', chi: 0, chiNote: '' },
    { customer: 'Huỳnh Thanh Vy', thu: 0, thuNote: '', chi: 0, chiNote: '' },
    { customer: 'Lê Quang Thu', thu: 15020000, thuNote: '', chi: 0, chiNote: '' },
];

// Quyết toán
export const SETTLEMENT = {
    totalThu: 775253514,
    thuTienMat: 483259000,
    thuChuyenKhoan: 291994514,
    totalChi: 106081089,
    chiTienMat: 21781089,
    chiChuyenKhoan: 84300000,
    quyetToanTienMat: 461477911,
};

// Doanh thu theo danh mục sản phẩm
export const REVENUE_BY_CATEGORY = [
    { category: 'Văn học', revenue: 185000000, percent: 26.8 },
    { category: 'Kỹ năng sống', revenue: 152000000, percent: 22.1 },
    { category: 'Kinh tế', revenue: 128000000, percent: 18.6 },
    { category: 'Thiếu nhi', revenue: 95000000, percent: 13.8 },
    { category: 'Khoa học', revenue: 62000000, percent: 9.0 },
    { category: 'Tâm lý học', revenue: 42000000, percent: 6.1 },
    { category: 'Ngoại ngữ', revenue: 15000000, percent: 2.2 },
    { category: 'Lịch sử', revenue: 10948810, percent: 1.4 },
];