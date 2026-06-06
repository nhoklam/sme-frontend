// ─────────────────────────────────────────────────────────────
// STANDARD RESPONSE WRAPPERS
// ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface HomeBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  bannerType: 'HERO' | 'PROMO' | 'CATEGORY';
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  warehouseId?: string;
  warehouseName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  posSettings?: string;
}

export type UserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_CASHIER' | 'ROLE_CUSTOMER';

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  warehouseId?: string;
  posSettings?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─────────────────────────────────────────────────────────────
// WAREHOUSE
// ─────────────────────────────────────────────────────────────
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  provinceCode: string;
  address?: string;
  phone?: string;
  managerId?: string;
  warehouseType?: 'MAIN' | 'BRANCH' | 'DROPSHIP';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ─────────────────────────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  parentId?: string;
  name: string;
  slug?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// SUPPLIER
// ─────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  taxCode?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankAccount?: string;
  bankName?: string;
  paymentTerms: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  phoneNumber: string;
  fullName: string;
  acquisitionChannel?: string;
  email?: string;
  address?: string;
  provinceCode?: string;
  dateOfBirth?: string;
  gender?: string;
  loyaltyPoints: number;
  customerTier: CustomerTier;
  totalSpent: number;
  notes?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CustomerTier = 'STANDARD' | 'SILVER' | 'GOLD';

// ─────────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────────
export interface ProductResponse {
  id: string;
  categoryId: string;
  categoryName?: string;
  supplierId?: string;
  isbnBarcode: string;
  sku?: string;
  name: string;
  description?: string;
  retailPrice: number;
  wholesalePrice?: number;
  macPrice: number;
  imageUrl?: string;
  imageUrls?: string[];
  unit: string;
  weight?: number;
  author?: string;
  publisher?: string;
  publishYear?: number;
  numberOfPages?: number;
  isActive: boolean;
  availableQuantity?: number;
  createdAt: string;
}

export interface CreateProductRequest {
  categoryId: string;
  supplierId?: string;
  isbnBarcode: string;
  sku?: string;
  name: string;
  description?: string;
  retailPrice: number;
  wholesalePrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  unit?: string;
  weight?: number;
  author?: string;
  publisher?: string;
  publishYear?: number;
  numberOfPages?: number;
}

export interface UpdateProductRequest {
  categoryId?: string;
  supplierId?: string | null;
  hasSupplierId?: boolean;
  name?: string;
  isbnBarcode?: string;
  sku?: string;
  description?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  unit?: string;
  weight?: number;
  author?: string;
  publisher?: string;
  publishYear?: number;
  numberOfPages?: number;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────────────────────
export interface LowStockItem {
  inventoryId: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minQuantity: number;
  reservedQuantity: number;
}
export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  inTransit: number;
  minQuantity: number;
  lowStock: boolean;
  availableQuantity: number;
  location?: string;
  version: number;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  referenceId: string;
  transactionType: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  note?: string;
  createdBy?: string;
  createdAt: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface AdjustInventoryRequest {
  productId: string;
  warehouseId: string;
  actualQuantity: number;
  reason: string;
}

// ─────────────────────────────────────────────────────────────
// PURCHASE ORDER
// ─────────────────────────────────────────────────────────────
export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  warehouseId: string;
  createdByUserId?: string;
  approvedBy?: string;
  totalAmount: number;
  paidAmount: number;
  status: PurchaseStatus;
  note?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  items: PurchaseItem[];
}

export type PurchaseStatus = 'DRAFT' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
// ─────────────────────────────────────────────────────────────
// BATCH / LOT NUMBER (thêm vào types/index.ts)
// Paste các interface này vào cuối file types/index.ts
// ─────────────────────────────────────────────────────────────

// Thêm vào PurchaseItem (extend interface hiện tại)
// Thay thế interface PurchaseItem cũ bằng cái này:
export interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  receivedQty: number;
  importPrice: number;
  // ── Batch / Lot fields (mới) ──
  batchNumber?: string;     // Số lô sản xuất
  lotNumber?: string;       // Mã lô nhập
  expiryDate?: string;      // Ngày hết hạn (ISO date string: "2025-12-31")
  manufacturingDate?: string; // Ngày sản xuất
}

// Thêm vào CreatePurchaseOrderRequest:
export interface CreatePurchaseOrderRequest {
  supplierId: string;
  warehouseId: string;
  items: Array<{
    productId: string;
    quantity: number;
    importPrice: number;
    // ── Batch / Lot fields (mới) ──
    batchNumber?: string;
    lotNumber?: string;
    expiryDate?: string;
    manufacturingDate?: string;
  }>;
  note?: string;
}


// ─────────────────────────────────────────────────────────────
// INTERNAL TRANSFER
// ─────────────────────────────────────────────────────────────
export interface InternalTransfer {
  id: string;
  code: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  createdByUserId: string;
  receivedByUserId?: string;
  status: TransferStatus;
  note?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  referenceOrderId?: string;
  transferReason?: string;
  items: TransferItem[];
  createdAt: string;
}

export type TransferStatus = 'DRAFT' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED';

export interface TransferItem {
  id: string;
  productId: string;
  quantity: number;
  receivedQty: number;
}

// ─────────────────────────────────────────────────────────────
// SHIFT (Ca làm việc)
// ─────────────────────────────────────────────────────────────
export interface ShiftResponse {
  id: string;
  warehouseId: string;
  warehouseName?: string;
  cashierId: string;
  cashierName?: string;
  startingCash: number;
  reportedCash?: number;
  theoreticalCash?: number;
  discrepancyAmount?: number;
  discrepancyReason?: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  approvedAt?: string;
  invoiceCount?: number;
  totalRevenue?: number;
}

export type ShiftStatus = 'OPEN' | 'CLOSED' | 'MANAGER_APPROVED';

export interface OpenShiftRequest {
  startingCash: number;
}

export interface CloseShiftRequest {
  reportedCash: number;
  discrepancyReason?: string;
}

// ─────────────────────────────────────────────────────────────
// INVOICE (Hóa đơn POS)
// ─────────────────────────────────────────────────────────────
export interface InvoiceResponse {
  id: string;
  code: string;
  shiftId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  type: 'SALE' | 'RETURN' | 'VOIDED';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  pointsUsed: number;
  pointsEarned: number;
  cashierName?: string;
  note?: string;
  createdAt: string;
  items: InvoiceItemResponse[];
  payments: InvoicePaymentResponse[];
}

export interface InvoiceItemResponse {
  productId: string;
  productName?: string;
  isbnBarcode?: string;
  quantity: number;
  unitPrice: number;
  macPrice: number;
  subtotal: number;
}

export interface InvoicePaymentResponse {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'MOMO' | 'VNPAY' | 'POINTS';

export interface CheckoutRequest {
  shiftId: string;
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    reference?: string;
  }>;
  pointsToUse?: number;
  note?: string;
}

// ─────────────────────────────────────────────────────────────
// ORDER (Đơn hàng Online)
// ─────────────────────────────────────────────────────────────
export interface OrderResponse {
  id: string;
  code: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  assignedWarehouseId?: string;
  assignedWarehouseName?: string;
  status: OrderStatus;
  type: 'DELIVERY' | 'BOPIS';
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress: string;
  provinceCode: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  trackingCode?: string;
  shippingProvider?: string;
  cancelledReason?: string;
  packedBy?: string;
  packedByName?: string;
  packedAt?: string;
  codReconciled: boolean;
  note?: string;
  cashierName?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemResponse[];
  statusHistory?: OrderStatusHistoryResponse[];
}

export type OrderStatus = 'PENDING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface OrderItemResponse {
  productId: string;
  productName?: string;
  isbnBarcode?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isReviewed?: boolean;
  imageUrl?: string;
}

export interface OrderStatusHistoryResponse {
  oldStatus?: string;
  newStatus: string;
  note?: string;
  changedBy?: string;
  changedByName?: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  customerId: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  provinceCode: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: string;
  type?: string;
  note?: string;
  shippingFee?: number;
  couponCode?: string;
  discountAmount?: number;
  assignedWarehouseId?: string;
  shippingLatitude?: number;
  shippingLongitude?: number;
}

// ─────────────────────────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────────────────────────
export interface CashbookTransaction {
  id: string;
  warehouseId: string;
  shiftId?: string;
  fundType: FundType;
  transactionType: TransactionType;
  referenceType: string;
  referenceId?: string;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  createdBy?: string;
  createdAt: string;
}

export type FundType = 'CASH_111' | 'BANK_112';
export type TransactionType = 'IN' | 'OUT';

export interface CreateCashbookEntryRequest {
  warehouseId: string;
  fundType: string;
  transactionType: string;
  referenceType: string;
  amount: number;
  description: string;
}

export interface SupplierDebt {
  id: string;
  supplierId: string;
  purchaseOrderId: string;
  purchaseOrderCode?: string; // Bổ sung
  warehouseId?: string;       // Bổ sung
  warehouseName?: string;     // Bổ sung
  totalDebt: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  dueDate?: string;
  createdAt: string;
}

export interface PaySupplierDebtRequest {
  supplierDebtId: string;
  amount: number;
  fundType: string;
  note?: string;
}

export interface CodReconciliationResult {
  matched: number;
  notFound: number;
  totalReceived: number;
  totalShippingFee: number;
  netAmount: number;
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────
export interface ReportSummary {
  warehouseId: string;
  revenueToday: ReportDataPoint[];
  lowStockCount: number;
}

export interface ReportDataPoint {
  period?: string;
  invoice_count?: number;
  revenue?: number;
  cogs?: number;
  gross_profit?: number;
  warehouse_name?: string;
}

// ─────────────────────────────────────────────────────────────
// AI
// ─────────────────────────────────────────────────────────────
export interface AiChatRequest {
  message: string;
  conversationHistory?: string;
}

export interface AiChatResponse {
  reply: string;
}

// ─────────────────────────────────────────────────────────────
// CART (Client-side POS state)
// ─────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  productName: string;
  isbnBarcode: string;
  quantity: number;
  unitPrice: number;
  macPrice: number;
  subtotal: number;
  imageUrl?: string;
  unit?: string;
}

export interface CartPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}
// ─────────────────────────────────────────────────────────────
// AUDIT LOGS (Nhật ký hệ thống)
// ─────────────────────────────────────────────────────────────
export interface AuditLogResponse {
  entityName: string;
  entityId: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
  changedBy: string;
  changedAt: string;
  revision: number;
}

// ─────────────────────────────────────────────────────────────
// INVENTORY HISTORY (Tổng hợp lịch sử giao dịch)
// ─────────────────────────────────────────────────────────────
export interface InventoryHistoryParams {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  productId?: string;
  transactionType?: string;
  page?: number;
  size?: number;
}

export interface InventoryHistoryResponse {
  content: InventoryTransaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ── Inventory extended (UI-only) ─────────────────────────────
export interface InventoryWithMeta {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  inTransit: number;
  minQuantity: number;
  version: number;
  availableQuantity: number;
  lowStock: boolean;
  // enriched fields
  productName?: string;
  productSku?: string;
  isbnBarcode?: string;
  warehouseName?: string;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  retailPrice?: number;
  macPrice?: number;
  location?: string;
}

// ── Inventory filters ────────────────────────────────────────
export type StockStatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryFilter {
  search?: string;
  warehouseId?: string;
  categoryId?: string;
  stockStatus?: StockStatusFilter;
}

// ── Purchase cart item (UI-only) ─────────────────────────────
export interface PurchaseCartItem {
  productId: string;
  productName: string;
  isbnBarcode?: string;
  sku?: string;
  quantity: number;
  importPrice: number;
  subtotal: number;
  imageUrl?: string;
  currentStock?: number;
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  showBatchFields?: boolean;
}

// ── Transfer cart item (UI-only) ─────────────────────────────
export interface TransferCartItem {
  productId: string;
  productName: string;
  isbnBarcode?: string;
  sku?: string;
  quantity: number;
  availableStock: number;
  imageUrl?: string;
}

// ── Warehouse with enriched name (for display) ───────────────
export interface WarehouseMap {
  [id: string]: string; // id → name
}

// ─────────────────────────────────────────────────────────────
// SUPPLIER (extended types for frontend)
// ─────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  taxCode?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankAccount?: string;
  bankName?: string;
  paymentTerms: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankAccount?: string;
  bankName?: string;
  paymentTerms?: number;
  notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────
export interface RevenueDataPoint {
  period: string;
  invoice_count: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
}

export interface TopProduct {
  id: string;
  name: string;
  total_sold: number;
}

export interface InventoryValueReport {
  warehouse_name: string;
  sku_count: number;
  total_qty: number;
  total_value: number;
}

export interface DeadStockItem {
  id: string;
  quantity: number;
  product_name: string;
  isbn_barcode: string;
}

export interface DashboardSummary {
  warehouseId: string;
  revenueToday: RevenueDataPoint[];
  lowStockCount: number;
}

export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface RevenueReportParams {
  from: string; // ISO string
  to: string;   // ISO string
  period?: ReportPeriod;
  warehouseId?: string;
  paymentMethod?: string;
  cashierId?: string;
}

export interface TopProductParams {
  from: string;
  to: string;
  limit?: number;
  warehouseId?: string;
  paymentMethod?: string;
}

// ─────────────────────────────────────────────────────────────
// STOREFRONT TYPES (Added for E-commerce)
// ─────────────────────────────────────────────────────────────
export type PageData<T> = PageResponse<T>;

export interface Product extends ProductResponse {
  publisher?: string;
  publishYear?: number;
  numberOfPages?: number;
  dimensions?: string;
  coverType?: string;
  language?: string;
  authorId?: string;
  averageRating?: number;
  totalReviews?: number;
  slug?: string;
  coverPrice?: number;
}

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  biography?: string;
  isFeatured: boolean;
}

export interface HomeBanner {
  id: string;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  sortOrder: number;
  bannerType: 'HERO' | 'PROMO' | 'CATEGORY';
  isActive: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  imageUrls?: string[];
  isVerifiedPurchase: boolean;
  isApproved?: boolean;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  receiverName: string;
  receiverPhone: string;
  provinceCity: string;
  district: string;
  ward?: string;
  specificAddress: string;
  isDefault: boolean;
}



export interface RegisterRequest {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
}

export interface AuthUser extends UserResponse {}
export interface Order extends OrderResponse {}
export interface OrderItem extends OrderItemResponse {}


export interface DashboardStats {
  todayRevenue: number;
  todayGrossProfit: number;
  todayInvoiceCount: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  pendingShiftsCount: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

// ─────────────────────────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────────────────────────
export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: PromotionType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsage?: number;
  usedCount: number;
  applicableProductId?: string;
  applicableCategoryId?: string;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  valid: boolean;
  createdAt: string;
  // Aliases for backward compat in PromotionDialog
  type?: PromotionType;
  minOrderAmount?: number;
  promotionSlot?: string;
  applicableChannel?: string;
  triggerType?: string;
  conditionType?: string;
  conditionValue?: string;
}

export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';
