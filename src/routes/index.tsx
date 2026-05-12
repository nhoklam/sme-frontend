    // src/routes/index.tsx
    import React, { Suspense, lazy } from 'react';
    import { Routes, Route, Navigate } from 'react-router-dom';
    import { Box, Typography, CircularProgress } from '@mui/material';

    import AdminLayout from '../layouts/AdminLayout';
    import AuthLayout from '../layouts/AuthLayout';
    import MainLayout from '../layouts/MainLayout';
    import LoginPage from '../pages/auth/LoginPage';
    import authService from '../services/authService';

    // ─────────────────────────────────────────────────────────────
    // LAZY LOADING COMPONENTS
    // ─────────────────────────────────────────────────────────────

    // Admin Pages
    const DashboardPage = lazy(() => import('../modules/admin/pages/DashboardPage'));
    const ProductListPage = lazy(() => import('../modules/admin/pages/products/ProductListPage'));
    const ProductCreatePage = lazy(() => import('../modules/admin/pages/products/ProductCreatePage'));
    const ProductDetailPage = lazy(() => import('../modules/admin/pages/products/ProductDetailPage'));
    const ProductEditPage = lazy(() => import('../modules/admin/pages/products/ProductEditPage'));
    const CategoryPage = lazy(() => import('../modules/admin/pages/categories/CategoryPage'));
    const OrderListPage = lazy(() => import('../modules/admin/pages/orders/OrderListPage'));
    const InventoryPage = lazy(() => import('../modules/admin/pages/inventory/InventoryPage'));
    const ImportPage = lazy(() => import('../modules/admin/pages/inventory/ImportPage'));
    const TransfersPage = lazy(() => import('../modules/admin/pages/inventory/TransfersPage'));
    const InventoryHistoryPage = lazy(() => import('../modules/admin/pages/inventory/InventoryHistoryPage'));
    const CustomerListPage = lazy(() => import('../modules/admin/pages/customers/CustomerListPage'));
    const SupplierPage = lazy(() => import('../modules/admin/pages/suppliers/SupplierPage'));
    const RevenueReportPage = lazy(() => import('../modules/admin/pages/reports/RevenueReportPage'));
    const InventoryReportPage = lazy(() => import('../modules/admin/pages/reports/InventoryReportPage'));
    const SystemSettingsPage = lazy(() => import('../modules/admin/pages/settings/SystemSettingsPage'));
    const NotificationListPage = lazy(() => import('../modules/admin/pages/settings/NotificationListPage'));
    const NotificationSettingsPage = lazy(() => import('../modules/admin/pages/settings/NotificationSettingsPage'));
    const PaymentSettingsPage = lazy(() => import('../modules/admin/pages/settings/PaymentSettingsPage'));
    const AuditLogsPage = lazy(() => import('../modules/admin/pages/settings/AuditLogsPage'));
    const UserListPage = lazy(() => import('../modules/admin/pages/users/UserListPage'));
    const UserCreatePage = lazy(() => import('../modules/admin/pages/users/UserCreatePage'));
    const FinancePage = lazy(() => import('../modules/admin/pages/finance/FinancePage'));
    const WarehousePage = lazy(() => import('../modules/admin/pages/warehouses/WarehousePage'));
    const CodReconciliationPage = lazy(() => import('../modules/admin/pages/orders/CodReconciliationPage'));
    const EmployeeReportPage = lazy(() => import('../modules/admin/pages/reports/EmployeeReportPage'));
    const CustomerDetailPage = lazy(() => import('../modules/admin/pages/customers/CustomerDetailPage'));
    const PromotionPage = lazy(() => import('../modules/admin/pages/promotions/PromotionPage'));
    const CustomerAnalysisReportPage = lazy(() => import('../modules/admin/pages/reports/CustomerAnalysisReportPage'));
    const ShiftListPage = lazy(() => import('../modules/admin/pages/shifts/ShiftListPage'));
    const ShiftDetailPage = lazy(() => import('../modules/admin/pages/shifts/ShiftDetailPage'));

    // Customer Pages
    const HomePage = lazy(() => import('../modules/customer/pages/HomePage'));
    const ShopPage = lazy(() => import('../modules/customer/pages/ShopPage'));
    const ProductDetailPageCustomer = lazy(() => import('../modules/customer/pages/ProductDetailPage'));
    const CartPage = lazy(() => import('../modules/customer/pages/CartPage'));
    const CheckoutPage = lazy(() => import('../modules/customer/pages/CheckoutPage'));
    const AccountPage = lazy(() => import('../modules/customer/pages/AccountPage'));
    const OrderSuccessPage = lazy(() => import('../modules/customer/pages/OrderSuccessPage'));
    const OrderTrackingPage = lazy(() => import('../modules/customer/pages/OrderTrackingPage'));
    const ForgotPasswordPage = lazy(() => import('../modules/customer/pages/ForgotPasswordPage'));
    const WishlistPage = lazy(() => import('../modules/customer/pages/WishlistPage'));

    // Employee Pages
    const EmployeePOSPage = lazy(() => import('../modules/employee/pages/EmployeePOSPage'));
    const EmployeeRevenuePage = lazy(() => import('../modules/employee/pages/EmployeeRevenuePage'));

    // ─────────────────────────────────────────────────────────────
    // LOADING COMPONENT
    // ─────────────────────────────────────────────────────────────
    const PageLoader: React.FC = () => (
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', flexDirection: 'column', gap: 2,
        }}>
            <CircularProgress size={48} thickness={4} />
            <Typography variant="body2" color="text.secondary">Đang tải...</Typography>
        </Box>
    );

    const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
        <Suspense fallback={<PageLoader />}>
            <Component />
        </Suspense>
    );

    // ─────────────────────────────────────────────────────────────
    // AUTH HELPERS
    // ─────────────────────────────────────────────────────────────
    const getRole = (): string | null => authService.getCurrentUser()?.user?.role ?? null;
    const isLoggedIn = (): boolean => !!authService.getCurrentUser()?.accessToken;

    // ─────────────────────────────────────────────────────────────
    // GUARDS
    // ─────────────────────────────────────────────────────────────

    const AdminLayoutGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        if (!isLoggedIn()) return <Navigate to="/login" replace />;
        const role = getRole();
        if (!['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CASHIER'].includes(role ?? '')) {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    };

    const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        if (!isLoggedIn()) return <Navigate to="/login" replace />;
        const role = getRole();
        if (role === 'ROLE_CASHIER') return <Navigate to="/admin/pos" replace />;
        if (role !== 'ROLE_ADMIN' && role !== 'ROLE_MANAGER') return <Navigate to="/" replace />;
        return <>{children}</>;
    };

    const AdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        if (getRole() !== 'ROLE_ADMIN') return <Navigate to="/admin/dashboard" replace />;
        return <>{children}</>;
    };

    /**
     * POSGuard — cho phép CASHIER, MANAGER, ADMIN vào.
     * Nếu là ADMIN/MANAGER → POS vẫn render được (họ đã biết cần TK thu ngân).
     * Nếu chưa đăng nhập → /login
     */
    const POSGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        if (!isLoggedIn()) return <Navigate to="/login" replace />;
        const role = getRole();
        if (!['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CASHIER'].includes(role ?? '')) {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    };

    // ─────────────────────────────────────────────────────────────
    // COMING SOON PLACEHOLDER
    // ─────────────────────────────────────────────────────────────
    const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700}>{title}</Typography>
            <Typography color="text.secondary" mt={1}>Tính năng đang phát triển</Typography>
        </Box>
    );

    // ─────────────────────────────────────────────────────────────
    // INDEX REDIRECT
    // ─────────────────────────────────────────────────────────────
    const IndexRedirect: React.FC = () => {
        const role = getRole();
        if (role === 'ROLE_CASHIER') return <Navigate to="/admin/pos" replace />;
        return <Navigate to="/admin/dashboard" replace />;
    };

    // ─────────────────────────────────────────────────────────────
    // APP ROUTES
    // ─────────────────────────────────────────────────────────────
    const AppRoutes: React.FC = () => (
        <Routes>
            <Route path="/login" element={<AuthLayout />}>
                <Route index element={<LoginPage />} />
            </Route>

            <Route path="/forgot-password" element={withSuspense(ForgotPasswordPage)} />

            <Route path="/" element={<MainLayout />}>
                <Route index element={withSuspense(HomePage)} />
                <Route path="shop" element={withSuspense(ShopPage)} />
                <Route path="product/:id" element={withSuspense(ProductDetailPageCustomer)} />
                <Route path="cart" element={withSuspense(CartPage)} />
                <Route path="checkout" element={withSuspense(CheckoutPage)} />
                <Route path="account" element={withSuspense(AccountPage)} />
                <Route path="order-success" element={withSuspense(OrderSuccessPage)} />
                <Route path="order-tracking" element={withSuspense(OrderTrackingPage)} />
                <Route path="wishlist" element={withSuspense(WishlistPage)} />
            </Route>

            <Route
                path="/admin"
                element={
                    <AdminLayoutGuard>
                        <AdminLayout />
                    </AdminLayoutGuard>
                }
            >
                <Route index element={<IndexRedirect />} />

                {/* POS: tất cả role nội bộ đều vào được */}
                <Route
                    path="pos"
                    element={
                        <POSGuard>
                            {withSuspense(EmployeePOSPage)}
                        </POSGuard>
                    }
                />
                <Route
                    path="pos/revenue"
                    element={
                        <POSGuard>
                            {withSuspense(EmployeeRevenuePage)}
                        </POSGuard>
                    }
                />

                <Route path="dashboard" element={<AdminGuard>{withSuspense(DashboardPage)}</AdminGuard>} />

                <Route path="products" element={<AdminGuard>{withSuspense(ProductListPage)}</AdminGuard>} />
                <Route path="products/create" element={<AdminGuard>{withSuspense(ProductCreatePage)}</AdminGuard>} />
                <Route path="products/:id" element={<AdminGuard>{withSuspense(ProductDetailPage)}</AdminGuard>} />
                <Route path="products/:id/edit" element={<AdminGuard>{withSuspense(ProductEditPage)}</AdminGuard>} />

                <Route path="categories" element={<AdminGuard>{withSuspense(CategoryPage)}</AdminGuard>} />
                <Route path="products/categories" element={<AdminGuard>{withSuspense(CategoryPage)}</AdminGuard>} />
                <Route path="promotions" element={<AdminGuard>{withSuspense(PromotionPage)}</AdminGuard>} />

                <Route path="orders" element={<AdminGuard>{withSuspense(OrderListPage)}</AdminGuard>} />
                <Route path="orders/:id" element={<AdminGuard>{withSuspense(OrderListPage)}</AdminGuard>} />

                <Route path="inventory" element={<AdminGuard>{withSuspense(InventoryPage)}</AdminGuard>} />
                <Route path="inventory/import" element={<AdminGuard>{withSuspense(ImportPage)}</AdminGuard>} />
                <Route path="inventory/transfer" element={<AdminGuard>{withSuspense(TransfersPage)}</AdminGuard>} />
                <Route path="inventory/history" element={<AdminGuard>{withSuspense(InventoryHistoryPage)}</AdminGuard>} />
                <Route path="inventory/alerts" element={<AdminGuard>{withSuspense(InventoryPage)}</AdminGuard>} />

                <Route path="customers" element={<AdminGuard>{withSuspense(CustomerListPage)}</AdminGuard>} />
                <Route path="customers/:id" element={<AdminGuard>{withSuspense(CustomerDetailPage)}</AdminGuard>} />

                <Route path="suppliers" element={<AdminGuard>{withSuspense(SupplierPage)}</AdminGuard>} />

                <Route path="finance" element={<AdminGuard>{withSuspense(FinancePage)}</AdminGuard>} />
                <Route path="finance/cashbook" element={<AdminGuard>{withSuspense(FinancePage)}</AdminGuard>} />
                <Route path="finance/supplier-debts" element={<AdminGuard>{withSuspense(FinancePage)}</AdminGuard>} />
                <Route path="finance/cod" element={<AdminGuard>{withSuspense(CodReconciliationPage)}</AdminGuard>} />

                <Route path="reports" element={<AdminGuard><Navigate to="/admin/reports/revenue" replace /></AdminGuard>} />
                <Route path="reports/revenue" element={<AdminGuard>{withSuspense(RevenueReportPage)}</AdminGuard>} />
                <Route path="reports/inventory" element={<AdminGuard>{withSuspense(InventoryReportPage)}</AdminGuard>} />
                <Route path="reports/products" element={<AdminGuard>{withSuspense(RevenueReportPage)}</AdminGuard>} />
                <Route path="reports/employees" element={<AdminGuard>{withSuspense(EmployeeReportPage)}</AdminGuard>} />
                <Route path="reports/customers" element={<AdminGuard>{withSuspense(CustomerAnalysisReportPage)}</AdminGuard>} />

                <Route path="users" element={<AdminOnlyGuard>{withSuspense(UserListPage)}</AdminOnlyGuard>} />
                <Route path="users/create" element={<AdminOnlyGuard>{withSuspense(UserCreatePage)}</AdminOnlyGuard>} />
                <Route path="users/roles" element={<AdminOnlyGuard><ComingSoon title="Phân quyền" /></AdminOnlyGuard>} />
                <Route path="warehouses" element={<AdminOnlyGuard>{withSuspense(WarehousePage)}</AdminOnlyGuard>} />
                <Route path="audit-logs" element={<AdminOnlyGuard>{withSuspense(AuditLogsPage)}</AdminOnlyGuard>} />
                <Route path="settings" element={<AdminOnlyGuard>{withSuspense(SystemSettingsPage)}</AdminOnlyGuard>} />
                <Route path="settings/notifications" element={<AdminOnlyGuard>{withSuspense(NotificationSettingsPage)}</AdminOnlyGuard>} />
                <Route path="settings/payments" element={<AdminOnlyGuard>{withSuspense(PaymentSettingsPage)}</AdminOnlyGuard>} />
                <Route path="shifts" element={<AdminGuard>{withSuspense(ShiftListPage)}</AdminGuard>} />
                <Route path="shifts/:id" element={<AdminGuard>{withSuspense(ShiftDetailPage)}</AdminGuard>} />
                <Route path="notifications" element={<AdminGuard>{withSuspense(NotificationListPage)}</AdminGuard>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );

    export default AppRoutes;