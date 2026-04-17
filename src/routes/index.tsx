// src/routes/index.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

// ── Layouts ──────────────────────────────────────────────────
import AdminLayout from '../layouts/AdminLayout';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

// ── Auth pages ───────────────────────────────────────────────
import LoginPage from '../pages/auth/LoginPage';

// ── Admin: Core ──────────────────────────────────────────────
import DashboardPage from '../modules/admin/pages/DashboardPage';

// ── Admin: Products ──────────────────────────────────────────
import ProductListPage from '../modules/admin/pages/products/ProductListPage';
import ProductCreatePage from '../modules/admin/pages/products/ProductCreatePage';
import ProductDetailPage from '../modules/admin/pages/products/ProductDetailPage';
import ProductEditPage from '../modules/admin/pages/products/ProductEditPage';

// ── Admin: Categories ────────────────────────────────────────
import CategoryPage from '../modules/admin/pages/categories/CategoryPage';

// ── Admin: Orders ────────────────────────────────────────────
import OrderListPage from '../modules/admin/pages/orders/OrderListPage';

// ── Admin: Inventory ─────────────────────────────────────────
import InventoryPage from '../modules/admin/pages/inventory/InventoryPage';
import ImportPage from '../modules/admin/pages/inventory/ImportPage';
import TransfersPage from '../modules/admin/pages/inventory/TransfersPage';
import InventoryHistoryPage from '../modules/admin/pages/inventory/InventoryHistoryPage';

// ── Admin: Customers ─────────────────────────────────────────
import CustomerListPage from '../modules/admin/pages/customers/CustomerListPage';

// ── Admin: Suppliers ─────────────────────────────────────────
import SupplierPage from '../modules/admin/pages/suppliers/SupplierPage';

// ── Admin: Reports ───────────────────────────────────────────
import RevenueReportPage from '../modules/admin/pages/reports/RevenueReportPage';
import InventoryReportPage from '../modules/admin/pages/reports/InventoryReportPage';

// ── Admin: Settings ──────────────────────────────────────────
import SystemSettingsPage from '../modules/admin/pages/settings/SystemSettingsPage';

// ── Admin: Users ────────────────────────────────────────────
import UserListPage from '../modules/admin/pages/users/UserListPage';
import UserCreatePage from '../modules/admin/pages/users/UserCreatePage';

// ── Customer (public storefront) ─────────────────────────────
import HomePage from '../modules/customer/pages/HomePage';
import ShopPage from '../modules/customer/pages/ShopPage';
import ProductDetailPageCustomer from '../modules/customer/pages/ProductDetailPage';
import CartPage from '../modules/customer/pages/CartPage';
import CheckoutPage from '../modules/customer/pages/CheckoutPage';
import AccountPage from '../modules/customer/pages/AccountPage';
import OrderSuccessPage from '../modules/customer/pages/OrderSuccessPage';
import OrderTrackingPage from '../modules/customer/pages/OrderTrackingPage';
import WishlistPage from '../modules/customer/pages/WishlistPage';

// ─────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────
const getAuthData = () => {
    const str = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!str) return null;
    try { return JSON.parse(str); } catch { return null; }
};
const isAuthenticated = () => !!getAuthData()?.accessToken;
const getUserRole = () => getAuthData()?.user?.role || null;

// Route guards
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    const role = getUserRole();
    if (role !== 'ROLE_ADMIN' && role !== 'ROLE_MANAGER') return <Navigate to="/" replace />;
    return <>{children}</>;
};

const AdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (getUserRole() !== 'ROLE_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <>{children}</>;
};

const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
    <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700}>{title}</Typography>
        <Typography color="text.secondary" mt={1}>Tính năng đang phát triển</Typography>
    </Box>
);

// ─────────────────────────────────────────────────────────────
// App Routes
// ─────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
    <Routes>
        {/* Auth */}
        <Route path="/login" element={<AuthLayout />}>
            <Route index element={<LoginPage />} />
        </Route>

        {/* Customer / Storefront (public) */}
        <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="product/:id" element={<ProductDetailPageCustomer />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="order-success" element={<OrderSuccessPage />} />
            <Route path="order-tracking" element={<OrderTrackingPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
        </Route>

        {/* Admin / Manager (protected) */}
        <Route
            path="/admin"
            element={
                <AdminGuard>
                    <AdminLayout />
                </AdminGuard>
            }
        >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Products */}
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/create" element={<ProductCreatePage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="products/:id/edit" element={<ProductEditPage />} />

            {/* Categories */}
            <Route path="categories" element={<CategoryPage />} />
            <Route path="products/categories" element={<CategoryPage />} />

            {/* Orders */}
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:id" element={<OrderListPage />} />

            {/* Inventory */}
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/import" element={<ImportPage />} />
            <Route path="inventory/transfer" element={<TransfersPage />} />
            <Route path="inventory/history" element={<InventoryHistoryPage />} />
            <Route path="inventory/alerts" element={<InventoryPage />} />

            {/* Customers */}
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/:id" element={<CustomerListPage />} />

            {/* ── Suppliers ── */}
            <Route path="suppliers" element={<SupplierPage />} />

            {/* Finance */}
            <Route path="finance" element={<Navigate to="/admin/finance/cashbook" replace />} />
            <Route path="finance/cashbook" element={<ComingSoon title="Sổ quỹ" />} />
            <Route path="finance/supplier-debts" element={<ComingSoon title="Công nợ NCC" />} />
            <Route path="finance/cod" element={<ComingSoon title="Đối soát COD" />} />

            {/* ── Reports ── */}
            <Route path="reports" element={<Navigate to="/admin/reports/revenue" replace />} />
            <Route path="reports/revenue" element={<RevenueReportPage />} />
            <Route path="reports/inventory" element={<InventoryReportPage />} />
            <Route path="reports/products" element={<RevenueReportPage />} />
            <Route path="reports/employees" element={<ComingSoon title="Báo cáo nhân viên" />} />

            {/* Admin-only */}
            <Route path="users" element={<AdminOnlyGuard><UserListPage /></AdminOnlyGuard>} />
            <Route path="users/create" element={<AdminOnlyGuard><UserCreatePage /></AdminOnlyGuard>} />
            <Route path="users/roles" element={<AdminOnlyGuard><ComingSoon title="Phân quyền" /></AdminOnlyGuard>} />
            <Route path="warehouses" element={<AdminOnlyGuard><ComingSoon title="Chi nhánh / Kho" /></AdminOnlyGuard>} />
            <Route path="notifications" element={<ComingSoon title="Thông báo" />} />
            <Route path="audit-logs" element={<AdminOnlyGuard><ComingSoon title="Nhật ký hệ thống" /></AdminOnlyGuard>} />
            <Route path="settings" element={<AdminOnlyGuard><SystemSettingsPage /></AdminOnlyGuard>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default AppRoutes;