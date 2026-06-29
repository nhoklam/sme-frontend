import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Chip, IconButton, Button, Alert,
    Snackbar, CircularProgress, Tooltip, TextField,
    Select, MenuItem, FormControl, Menu, Popover,
    Divider, Badge, Checkbox, FormControlLabel, Switch,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle as MuiDialogTitle
} from '@mui/material';
import {
    Storefront, Dashboard as DashboardIcon,
    Logout as LogoutIcon, Logout,
    Add, Close, LocalOffer, Delete, Print, ReceiptLong,
    Pause, ShoppingBasket, PersonAdd, Undo, ArrowBack, Person, MonetizationOn, Percent, Lock, Star,
    ExpandMore, ExpandLess, Discount, CardGiftcard, History, Assessment, KeyboardReturn, ClearAll, Keyboard
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../../services/axiosConfig';
import authService from '../../../services/authService';
import { useWebSocket, WsPayload } from '../../../store/hooks/useWebSocket';
import { ProductResponse, Customer } from '../../../types';

import OpenShiftDialog from '../components/pos/OpenShiftDialog';
import CloseShiftDialog from '../components/pos/CloseShiftDialog';
import POSProductSearchBar from '../components/pos/POSProductSearchBar';
import InlineCustomerSearch from '../components/pos/InlineCustomerSearch';
import QuickCreateCustomerDialog from '../components/pos/QuickCreateCustomerDialog';
import POSHeldOrdersDialog from '../components/pos/POSHeldOrdersDialog';
import OrderDiscountDialog from '../components/pos/OrderDiscountDialog';
import POSInvoiceHistoryDialog from '../components/pos/POSInvoiceHistoryDialog';
import PrintInvoiceDialog from '../components/pos/PrintInvoiceDialog';
import RefundDialog from '../components/pos/RefundDialog';
import PromotionDialog from '../components/pos/PromotionDialog';
import RevenueReportDialog from '../components/pos/RevenueReportDialog';
import promotionService from '../../../services/promotionService';
import posService from '../../../services/posService';
import QrPaymentDialog from '../components/pos/QrPaymentDialog';
import { usePosPaymentWebSocket } from '../../../store/hooks/usePosPaymentWebSocket';
import POSReceipt from '../components/POSReceipt';
import productService from '../../../services/productService';

const fmt = (n?: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(n ?? 0);

const LS_ORDERS = 'pos_cart_orders';
const LS_ACTIVE = 'pos_cart_active';
const LS_COUNTER = 'pos_cart_counter';
const LS_HELD = 'pos_held_orders';

function loadLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw != null) return JSON.parse(raw) as T;
    } catch { }
    return fallback;
}
function saveLS(key: string, val: unknown) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

interface CartItem {
    productId: string;
    productName: string;
    isbnBarcode: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    originalRetailPrice: number;
    wholesalePrice: number;
    macPrice: number;
    subtotal: number;
    imageUrl?: string;
    unit?: string;
}

interface PaymentRow {
    id: string;
    method: string;
    amount: number;
    reference?: string;
}

interface HeldOrder {
    id: string;
    label: string;
    heldAt: string;
    itemCount: number;
    totalAmount: number;
    customerName?: string;
    items: { productName: string; quantity: number; unitPrice: number }[];
    fullTab?: OrderTab;
}

interface OrderTab {
    id: string;
    label: string;
    items: CartItem[];
    customer: Customer | null;
    pointsToUse: number;
    couponCode: string;
    couponDiscount: number;
    orderDiscount: number;
    orderDiscountAmt: number;
    volumeDiscountAmt: number;
    isDelivery: boolean;
    isWholesale: boolean;
}

interface Shift {
    id: string;
    status: string;
    startingCash: number;
    openedAt: string;
}

const newOrder = (id: string, label: string): OrderTab => ({
    id, label, items: [], customer: null, pointsToUse: 0,
    couponCode: '', couponDiscount: 0, orderDiscount: 0, orderDiscountAmt: 0,
    volumeDiscountAmt: 0,
    isDelivery: false, isWholesale: false,
});

const EmployeePOSPage: React.FC = () => {
    const navigate = useNavigate();
    const [shift, setShift] = useState<Shift | null>(null);
    const [shiftLoading, setShiftLoading] = useState(true);
    const [openShiftLoading, setOpenShiftLoading] = useState(false);

    const [orders, setOrders] = useState<OrderTab[]>(() =>
        loadLS<OrderTab[]>(LS_ORDERS, [newOrder('1', 'Đơn 1')])
    );
    const [activeIdx, setActiveIdx] = useState<number>(() => loadLS<number>(LS_ACTIVE, 0));
    const [orderCounter, setOrderCounter] = useState<number>(() => loadLS<number>(LS_COUNTER, 2));
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => loadLS<HeldOrder[]>(LS_HELD, []));

    useEffect(() => { saveLS(LS_ORDERS, orders); }, [orders]);
    useEffect(() => { saveLS(LS_ACTIVE, activeIdx); }, [activeIdx]);
    useEffect(() => { saveLS(LS_COUNTER, orderCounter); }, [orderCounter]);
    useEffect(() => { saveLS(LS_HELD, heldOrders); }, [heldOrders]);

    useEffect(() => {
        if (activeIdx >= orders.length) setActiveIdx(Math.max(0, orders.length - 1));
    }, [orders.length, activeIdx]);

    const activeOrder = orders[activeIdx] ?? orders[0];

    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [discountOpen, setDiscountOpen] = useState(false);
    const [promotionOpen, setPromotionOpen] = useState(false);
    const [scannedCouponCode, setScannedCouponCode] = useState<string | undefined>(undefined);
    const [invoiceHistoryOpen, setInvoiceHistoryOpen] = useState(false);
    const [heldOpen, setHeldOpen] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<any | null>(null);
    const [printInvoice, setPrintInvoice] = useState<any>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false);
    const [refundInitialCode, setRefundInitialCode] = useState<string | undefined>(undefined);
    const [revenueOpen, setRevenueOpen] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(true);
    const [discountAnchorEl, setDiscountAnchorEl] = useState<HTMLElement | null>(null);
    const [shortcutsAnchorEl, setShortcutsAnchorEl] = useState<HTMLElement | null>(null);

    const [discountHint, setDiscountHint] = useState<{
        discountPct: number; discountAmount: number; tierLabel?: string;
        ruleName?: string; nextTierMinAmount?: number; nextTierPct?: number; nextTierLabel?: string;
    } | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'VNPAY' | 'PAYOS'>('CASH');
    const [customerGivenAmount, setCustomerGivenAmount] = useState<number | ''>('');
    const [autoPrint, setAutoPrint] = useState(true);

    const [qrDialogOpen, setQrDialogOpen] = useState(false);
    const [qrPaymentData, setQrPaymentData] = useState<{ checkoutUrl: string; qrCode?: string; orderCode: string; amount: number; gateway: string } | null>(null);

    const [closeShiftOpen, setCloseShiftOpen] = useState(false);
    const [closeShiftLoading, setCloseShiftLoading] = useState(false);

    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    usePosPaymentWebSocket(qrPaymentData?.orderCode || '', (invoice) => {
        setSnack({ msg: '✅ Khách hàng đã thanh toán thành công!', sev: 'success' });
        setQrDialogOpen(false);
        setQrPaymentData(null);
        updateOrder(o => ({ ...o, items: [], customer: null, pointsToUse: 0, couponCode: '', couponDiscount: 0, orderDiscount: 0, orderDiscountAmt: 0, volumeDiscountAmt: 0 }));
        setCheckoutOpen(false);
        setCustomerGivenAmount('');
        if (autoPrint) {
            setReceiptData(invoice);
        }
    });

    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editingPriceVal, setEditingPriceVal] = useState('');
    const priceInputRef = useRef<HTMLInputElement>(null);
    const addToCartRef = useRef<((p: ProductResponse) => void) | null>(null);
    const checkoutRef = useRef<(() => void) | null>(null);
    const holdCurrentCartRef = useRef<(() => void) | null>(null);
    const setPromotionOpenRef = useRef<((val: boolean) => void) | null>(null);
    const setInvoiceHistoryOpenRef = useRef<((val: boolean) => void) | null>(null);
    const setHeldOpenRef = useRef<((val: boolean) => void) | null>(null);
    const setDiscountOpenRef = useRef<((val: boolean) => void) | null>(null);
    const setRevenueOpenRef = useRef<((val: boolean) => void) | null>(null);
    const customerInputRef = useRef<HTMLInputElement>(null);
    const promoInputRef = useRef<HTMLInputElement>(null);

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(currentUser?.role || '');

    const handleWsMessage = useCallback((payload: WsPayload) => {
        if (payload.type === 'LOW_STOCK') {
            const product = payload.productName || 'Sản phẩm';
            const warehouse = payload.warehouseName ? ` tại kho '${payload.warehouseName}'` : '';
            setSnack({
                msg: `⚠️ ${product}${warehouse} sắp hết hàng! (Còn ${payload.quantity ?? 0} sản phẩm)`,
                sev: 'warning'
            });
        }
    }, []);

    const { isConnected } = useWebSocket({
        warehouseId: currentUser?.warehouseId,
        onMessage: handleWsMessage,
        enabled: !!currentUser?.warehouseId,
    });

    const handleScanBarcode = useCallback(async (barcode: string) => {
        if (!currentUser?.warehouseId) return;
        try {
            const product = await productService.getByBarcode(barcode);
            if (product && addToCartRef.current) {
                addToCartRef.current(product);
            }
        } catch (e) {
            try {
                const r = await productService.search({ keyword: barcode, page: 0, size: 10, isActive: true, warehouseId: currentUser.warehouseId });
                if (r.content.length === 1 && addToCartRef.current) {
                    addToCartRef.current(r.content[0]);
                } else if (r.content.length > 1) {
                    setSnack({ msg: `Tìm thấy nhiều sản phẩm cho mã: ${barcode}. Vui lòng dùng thanh tìm kiếm.`, sev: 'warning' });
                } else {
                    setSnack({ msg: `Mã vạch ${barcode} không tìm thấy trong hệ thống!`, sev: 'error' });
                }
            } catch {
                setSnack({ msg: `Lỗi quét mã vạch ${barcode} hoặc sản phẩm không tồn tại`, sev: 'error' });
            }
        }
    }, [currentUser?.warehouseId]);

    useEffect(() => {
        let buffer = '';
        let lastTime = Date.now();

        const handleGlobalKeydown = (e: KeyboardEvent) => {
            // Hotkeys (Bất kể đang focus vào input hay không)
            if (e.key === 'F1') { e.preventDefault(); checkoutRef.current?.(); }
            if (e.key === 'F2') { e.preventDefault(); holdCurrentCartRef.current?.(); }
            if (e.key === 'F4') { e.preventDefault(); customerInputRef.current?.focus(); }
            if (e.key === 'F5') { e.preventDefault(); setHeldOpenRef.current?.(true); }
            if (e.key === 'F6') { e.preventDefault(); setDiscountOpenRef.current?.(true); }
            if (e.key === 'F8') { e.preventDefault(); promoInputRef.current?.focus(); }
            if (e.key === 'F9') { e.preventDefault(); setInvoiceHistoryOpenRef.current?.(true); }
            if (e.key === 'F10') { e.preventDefault(); setRevenueOpenRef.current?.(true); }
            if (e.key === 'Escape') {
                setHeldOpenRef.current?.(false);
                setDiscountOpenRef.current?.(false);
                setPromotionOpenRef.current?.(false);
                setInvoiceHistoryOpenRef.current?.(false);
                setRevenueOpenRef.current?.(false);
            }

            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const now = Date.now();
            if (now - lastTime > 60) {
                buffer = '';
            }
            lastTime = now;

            if (e.key === 'Enter') {
                if (buffer.length >= 3) {
                    e.preventDefault();
                    handleScanBarcode(buffer);
                }
                buffer = '';
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                buffer += e.key;
            }
        };
        window.addEventListener('keydown', handleGlobalKeydown);
        return () => window.removeEventListener('keydown', handleGlobalKeydown);
    }, [handleScanBarcode]);

    const loadShift = useCallback(async () => {
        if (currentUser?.role === 'ROLE_ADMIN' && !currentUser?.warehouseId) {
            setShiftLoading(false);
            return;
        }
        setShiftLoading(true);
        try {
            const res = await axiosInstance.get('/pos/shifts/current');
            setShift(res.data?.data ?? null);
        } catch { setShift(null); }
        finally { setShiftLoading(false); }
    }, [currentUser?.role, currentUser?.warehouseId]);

    useEffect(() => { loadShift(); }, [loadShift]);

    const totalAmountForEffect = activeOrder.items.reduce((s, i) => s + i.subtotal, 0);
    useEffect(() => {
        if (totalAmountForEffect <= 0 || !currentUser?.warehouseId) {
            setDiscountHint(null);
            setOrders(prev => prev.map((o, i) => i === activeIdx ? { ...o, volumeDiscountAmt: 0 } : o));
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await axiosInstance.get('/discount-rules/calculate', {
                    params: { totalAmount: totalAmountForEffect, warehouseId: currentUser.warehouseId }
                });
                const data = res.data?.data;
                if (data) {
                    setDiscountHint(data);
                    setOrders(prev => prev.map((o, i) => i === activeIdx ? { ...o, volumeDiscountAmt: data.discountAmount ?? 0 } : o));
                }
            } catch { /* không có quy tắc = không có chiết khấu */ }
        }, 400);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalAmountForEffect, currentUser?.warehouseId, activeIdx]);

    const updateOrder = useCallback((updater: (o: OrderTab) => OrderTab) => {
        setOrders(prev => prev.map((o, i) => i === activeIdx ? updater(o) : o));
    }, [activeIdx]);

    const holdCurrentCart = useCallback(() => {
        if (activeOrder.items.length === 0) return;
        const held: HeldOrder = {
            id: `held-${Date.now()}`,
            label: activeOrder.label,
            heldAt: new Date().toISOString(),
            itemCount: activeOrder.items.reduce((s, i) => s + i.quantity, 0),
            totalAmount: activeOrder.items.reduce((s, i) => s + i.subtotal, 0),
            customerName: activeOrder.customer?.fullName,
            items: activeOrder.items.map(i => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice })),
            fullTab: { ...activeOrder },
        };
        setHeldOrders(prev => [...prev, held]);
        updateOrder(o => ({ ...o, items: [], customer: null, pointsToUse: 0, couponCode: '', couponDiscount: 0, orderDiscount: 0, orderDiscountAmt: 0, volumeDiscountAmt: 0 }));
        setSnack({ msg: `⏸ Đã giữ tạm "${activeOrder.label}" · F5 để gọi lại`, sev: 'info' });
    }, [activeOrder, updateOrder]);

    const handleApplyPromoCode = async () => {
        if (!activeOrder.couponCode) return;
        try {
            const res = await promotionService.validate(activeOrder.couponCode, totalAmount, 'POS');
            updateOrder(o => ({ ...o, couponDiscount: res.discountAmount }));
            setSnack({ msg: `✅ Áp dụng mã "${activeOrder.couponCode}" thành công!`, sev: 'success' });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Mã khuyến mãi không hợp lệ', sev: 'error' });
            updateOrder(o => ({ ...o, couponCode: '', couponDiscount: 0 }));
        }
    };

    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' | 'info' | 'warning' } | null>(null);

    const handleCheckout = async () => {
        if (!shift) return;
        if (activeOrder.items.some(i => i.quantity === 0)) {
            setSnack({ msg: 'Có sản phẩm số lượng bằng 0 trong giỏ hàng. Vui lòng cập nhật hoặc xóa trước khi thanh toán.', sev: 'error' });
            return;
        }
        setCheckoutLoading(true);
        try {
            let actualAmount = customerGivenAmount !== '' ? Number(customerGivenAmount) : finalAmount;
            if (actualAmount > finalAmount) actualAmount = finalAmount;
            const payments = [{ method: paymentMethod, amount: actualAmount }];

            const reqPayload = {
                shiftId: shift.id,
                customerId: activeOrder.customer?.id ?? null,
                items: activeOrder.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
                payments: payments.map(p => ({ method: p.method, amount: p.amount })),
                pointsToUse: activeOrder.pointsToUse > 0 ? activeOrder.pointsToUse : undefined,
                volumeDiscountAmt: volumeDiscountAmt > 0 ? volumeDiscountAmt : undefined,
                orderDiscountAmt: orderDiscountAmt > 0 ? orderDiscountAmt : undefined,
                couponDiscountAmt: couponDiscountAmt > 0 ? couponDiscountAmt : undefined,
                couponCodes: activeOrder.couponCode ? [activeOrder.couponCode] : undefined,
            };

            if (paymentMethod === 'VNPAY' || paymentMethod === 'PAYOS') {
                const data = await posService.initQrCheckout(paymentMethod, reqPayload);
                setQrPaymentData(data);
                setQrDialogOpen(true);
                setCheckoutLoading(false);
                return;
            }

            const res = await axiosInstance.post('/pos/checkout', reqPayload);
            const invoiceData = res.data?.data;
            if (invoiceData && invoiceData.items) {
                invoiceData.items = invoiceData.items.map((inv: any) => {
                    const cartItem = activeOrder.items.find(ci => ci.productId === inv.productId);
                    return {
                        ...inv,
                        productName: inv.productName || cartItem?.productName || `SP #${inv.productId?.slice(0, 8)}`,
                        isbnBarcode: inv.isbnBarcode || cartItem?.isbnBarcode,
                    };
                });
            }
            if (invoiceData) {
                invoiceData.customerName = invoiceData.customerName || activeOrder.customer?.fullName;
                invoiceData.customerPhone = invoiceData.customerPhone || activeOrder.customer?.phoneNumber;
                invoiceData.payments = [{ method: paymentMethod, amount: customerGivenAmount !== '' ? Number(customerGivenAmount) : finalAmount }];
            }
            setSnack({ msg: '✅ Thanh toán thành công!', sev: 'success' });
            updateOrder(o => ({ ...o, items: [], customer: null, pointsToUse: 0, couponCode: '', couponDiscount: 0, orderDiscount: 0, orderDiscountAmt: 0, volumeDiscountAmt: 0 }));
            setCheckoutOpen(false);
            setCustomerGivenAmount('');

            if (invoiceData && autoPrint) {
                setReceiptData(invoiceData);
            }
        } catch (e: any) {
            const errorMsg = e.response?.data?.message || e.response?.data?.error || 'Thanh toán thất bại';
            const errorCode = e.response?.data?.code;

            if (errorCode === 'INSUFFICIENT_STOCK') {
                setSnack({ msg: errorMsg, sev: 'warning' });
            } else {
                setSnack({ msg: errorMsg, sev: 'error' });
            }
            console.error('[Checkout Error]', e.response?.data);
        } finally { setCheckoutLoading(false); }
    };

    useEffect(() => {
        checkoutRef.current = handleCheckout;
        holdCurrentCartRef.current = holdCurrentCart;
        setPromotionOpenRef.current = setPromotionOpen;
        setInvoiceHistoryOpenRef.current = setInvoiceHistoryOpen;
        setHeldOpenRef.current = setHeldOpen;
        setDiscountOpenRef.current = setDiscountOpen;
        setRevenueOpenRef.current = setRevenueOpen;
    }, [handleCheckout, holdCurrentCart]);



    const recallHeldOrder = (heldId: string) => {
        const held = heldOrders.find(h => h.id === heldId);
        if (!held?.fullTab) { setSnack({ msg: 'Không tìm thấy đơn đã giữ', sev: 'error' }); return; }
        if (activeOrder.items.length === 0) {
            setOrders(prev => prev.map((o, i) => i === activeIdx ? { ...held.fullTab!, id: o.id, label: held.fullTab!.label } : o));
        } else {
            setOrders(prev => {
                const nextIdx = prev.length + 1;
                const newTab = { ...held.fullTab!, id: String(Date.now()), label: `Đơn ${nextIdx}` };
                return [...prev, newTab];
            });
            setActiveIdx(orders.length);
        }
        setHeldOrders(prev => prev.filter(h => h.id !== heldId));
        setSnack({ msg: `▶ Đã gọi lại đơn "${held.label}"`, sev: 'success' });
    };

    const deleteHeldOrder = (heldId: string) => setHeldOrders(prev => prev.filter(h => h.id !== heldId));

    const getNextOrderNumber = (currentOrders: OrderTab[]) => {
        const usedNumbers = currentOrders.map(o => {
            const match = o.label.match(/Đơn (\d+)/);
            return match ? parseInt(match[1]) : 0;
        }).filter(n => n > 0);
        let num = 1;
        while (usedNumbers.includes(num)) num++;
        return num;
    };

    const addTab = () => {
        setOrders(prev => {
            const nextNum = getNextOrderNumber(prev);
            return [...prev, newOrder(String(Date.now()), `Đơn ${nextNum}`)];
        });
        setActiveIdx(orders.length);
    };

    const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

    const removeTab = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (orders.length === 1) return;
        if (orders[idx].items.length > 0) {
            setConfirmDeleteIdx(idx);
            return;
        }
        doRemoveTab(idx);
    };

    const doRemoveTab = (idx: number) => {
        setOrders(prev => prev.filter((_, i) => i !== idx));
        setActiveIdx(prev => {
            if (prev === idx) return Math.max(0, idx - 1);
            if (prev > idx) return prev - 1;
            return prev;
        });
        setConfirmDeleteIdx(null);
    };

    const addToCart = (p: ProductResponse) => {
        const isWholesale = activeOrder.isWholesale;
        const unitPrice = isWholesale && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
        updateOrder(o => {
            const ex = o.items.find(i => i.productId === p.id);
            const items = ex
                ? o.items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } : i)
                : [...o.items, {
                    productId: p.id, productName: p.name, isbnBarcode: p.isbnBarcode, sku: p.sku,
                    quantity: 1, unitPrice, originalRetailPrice: p.retailPrice,
                    wholesalePrice: p.wholesalePrice ?? p.retailPrice,
                    macPrice: p.macPrice, subtotal: unitPrice, imageUrl: p.imageUrl, unit: p.unit,
                }];
            return { ...o, items };
        });
        setSnack({ msg: `✅ ${p.name}${isWholesale ? ' (Giá sỉ)' : ''}`, sev: 'success' });
    };

    addToCartRef.current = addToCart;

    const toggleWholesale = () => {
        updateOrder(o => {
            const isWholesale = !o.isWholesale;
            const items = o.items.map(item => {
                const newPrice = isWholesale && item.wholesalePrice ? item.wholesalePrice : item.originalRetailPrice;
                return { ...item, unitPrice: newPrice, subtotal: item.quantity * newPrice };
            });
            return { ...o, isWholesale, items };
        });
    };

    const startEditPrice = (productId: string, currentPrice: number) => {
        setEditingPriceId(productId);
        setEditingPriceVal(String(currentPrice));
        setTimeout(() => priceInputRef.current?.select(), 50);
    };

    const confirmEditPrice = (productId: string) => {
        const newPrice = Number(editingPriceVal) || 0;
        if (newPrice > 0) {
            updateOrder(o => ({
                ...o,
                items: o.items.map(i => i.productId === productId ? { ...i, unitPrice: newPrice, subtotal: i.quantity * newPrice } : i),
            }));
        }
        setEditingPriceId(null);
        setEditingPriceVal('');
    };

    const updateQty = (id: string, qty: number) => {
        if (qty < 0) qty = 0;
        updateOrder(o => ({ ...o, items: o.items.map(i => i.productId === id ? { ...i, quantity: qty, subtotal: qty * i.unitPrice } : i) }));
    };

    const removeItem = (id: string) => { updateOrder(o => ({ ...o, items: o.items.filter(i => i.productId !== id) })); };

    const totalAmount = activeOrder.items.reduce((s, i) => s + i.subtotal, 0);
    const volumeDiscountAmt = activeOrder.volumeDiscountAmt ?? 0;
    const orderDiscountAmt = activeOrder.orderDiscount > 0
        ? Math.round(totalAmount * activeOrder.orderDiscount / 100)
        : activeOrder.orderDiscountAmt;
    const couponDiscountAmt = activeOrder.couponDiscount ?? 0;
    const pointsDiscount = activeOrder.pointsToUse > 0 ? activeOrder.pointsToUse * 1000 : 0;
    const finalAmount = Math.max(0, totalAmount - volumeDiscountAmt - orderDiscountAmt - couponDiscountAmt - pointsDiscount);
    const totalDiscount = volumeDiscountAmt + orderDiscountAmt + couponDiscountAmt + pointsDiscount;

    const handleOpenShift = async (startingCash: number) => {
        setOpenShiftLoading(true);
        try {
            const res = await axiosInstance.post('/pos/shifts/open', { startingCash });
            setShift(res.data?.data);
            setSnack({ msg: '🎉 Mở ca thành công!', sev: 'success' });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Mở ca thất bại', sev: 'error' });
        } finally { setOpenShiftLoading(false); }
    };

    const handleCloseShift = async (reported: number, reason: string) => {
        setCloseShiftLoading(true);
        try {
            await axiosInstance.post('/pos/shifts/close', { reportedCash: reported, discrepancyReason: reason || undefined });
            setShift(null);
            setCloseShiftOpen(false);
            setSnack({ msg: '✅ Đóng ca thành công!', sev: 'success' });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Đóng ca thất bại', sev: 'error' });
        } finally {
            setCloseShiftLoading(false);
        }
    };

    if (currentUser?.role === 'ROLE_ADMIN' && !currentUser?.warehouseId) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Storefront sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                <Typography variant="h5" fontWeight={700} color="#1e293b" mb={1}>
                    Chọn chi nhánh làm việc
                </Typography>
                <Typography color="#64748b" textAlign="center" mb={3}>
                    Để thao tác bán hàng, vui lòng chọn một chi nhánh cụ thể ở thanh điều hướng phía trên.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/admin/dashboard')} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#1976d2', boxShadow: 'none', '&:hover': { bgcolor: '#1565c0' } }}>
                    Quay lại Dashboard
                </Button>
            </Box>
        );
    }

    if (shiftLoading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#f59e0b' }} size={48} />
            </Box>
        );
    }

    const handleLogout = () => {
        localStorage.removeItem(LS_ORDERS);
        localStorage.removeItem(LS_ACTIVE);
        localStorage.removeItem(LS_COUNTER);
        localStorage.removeItem(LS_HELD);
        authService.logout();
        navigate('/admin/login');
    };

    return (
        <Box sx={{ height: '100vh', bgcolor: '#f5f7fb', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
            <POSReceipt 
                invoice={receiptData} 
                warehouseName={currentUser?.warehouseName} 
                open={!!receiptData} 
                onClose={() => setReceiptData(null)} 
            />
            <OpenShiftDialog open={!shift} onOpen={handleOpenShift} loading={openShiftLoading} />
            <CloseShiftDialog 
                open={closeShiftOpen} 
                loading={closeShiftLoading} 
                onClose={() => setCloseShiftOpen(false)} 
                onConfirm={handleCloseShift} 
            />
            
            <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <MuiDialogTitle fontWeight={700}>Xác nhận đăng xuất</MuiDialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn có chắc chắn muốn đăng xuất? Thao tác này sẽ <strong>xóa toàn bộ giỏ hàng và các đơn hàng đang giữ</strong> trên máy này.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setLogoutConfirmOpen(false)} sx={{ color: '#595959', textTransform: 'none' }}>Hủy bỏ</Button>
                    <Button variant="contained" color="error" onClick={handleLogout} sx={{ textTransform: 'none', borderRadius: 1.5 }}>
                        Đăng xuất & Xóa dữ liệu
                    </Button>
                </DialogActions>
            </Dialog>

            {/* HEADER */}
            <Box sx={{
                height: 64, bgcolor: '#fff', borderBottom: '1px solid #f0f0f0', px: 3, display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, flexShrink: 0
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isAdmin && (
                        <Button variant="outlined" onClick={() => navigate('/admin/dashboard')} startIcon={<ArrowBack />}
                            sx={{ textTransform: 'none', color: '#595959', borderColor: '#d9d9d9', borderRadius: 1.5, height: 36, px: 2 }}>
                            Quay về Dashboard
                        </Button>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Storefront sx={{ color: '#1890ff', fontSize: 22 }} />
                        <Typography fontWeight={700} fontSize={15} color="#262626">CRM Bán hàng</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Store + employee info */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 0.5 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Storefront sx={{ fontSize: 13, color: '#1890ff' }} />
                            <Typography fontSize={13} fontWeight={700} color="#262626" noWrap maxWidth={160}>
                                {currentUser?.warehouseName || 'Cửa hàng'}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Person sx={{ fontSize: 12, color: '#8c8c8c' }} />
                            <Typography fontSize={11.5} color="#8c8c8c" noWrap maxWidth={160}>
                                {currentUser?.fullName || 'Nhân viên'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Phím tắt button */}
                    <Button
                        size="small" variant="outlined"
                        startIcon={<Keyboard sx={{ fontSize: 15 }} />}
                        onClick={e => setShortcutsAnchorEl(e.currentTarget)}
                        sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: '#595959', borderColor: '#d9d9d9', borderRadius: 1.5, height: 34, px: 1.5, bgcolor: '#fafafa', '&:hover': { borderColor: '#1890ff', color: '#1890ff', bgcolor: '#e6f7ff' } }}
                    >
                        Phím tắt
                    </Button>

                    {/* Shortcuts popover */}
                    <Popover
                        open={Boolean(shortcutsAnchorEl)}
                        anchorEl={shortcutsAnchorEl}
                        onClose={() => setShortcutsAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{ sx: { borderRadius: 2, p: 2, width: 340, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
                    >
                        <Typography fontSize={13} fontWeight={700} color="#262626" mb={1.5} display="flex" alignItems="center" gap={0.75}>
                            <Keyboard sx={{ fontSize: 16, color: '#1890ff' }} /> Danh sách phím tắt
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                            {[
                                ['F1', 'Tìm kiếm sản phẩm'],
                                ['F2', 'Giữ đơn hàng'],
                                ['F3', 'Thêm đơn mới'],
                                ['F4', 'Tìm khách hàng'],
                                ['F5', 'Đơn đã giữ'],
                                ['F6', 'Chiết khấu đơn'],
                                ['F8', 'Khuyến mãi / CK%'],
                                ['F9', 'Lịch sử hóa đơn'],
                                ['F10', 'Báo cáo doanh thu'],
                                ['Enter', 'Thanh toán nhanh'],
                            ].map(([key, desc]) => (
                                <Box key={key} display="flex" alignItems="center" gap={1} sx={{ py: '2px' }}>
                                    <Box component="span" sx={{
                                        bgcolor: '#f5f5f5', border: '1px solid #d9d9d9', borderBottom: '2px solid #bfbfbf',
                                        borderRadius: 1, px: 0.75, py: '1px', fontSize: 11, fontWeight: 700, color: '#434343',
                                        minWidth: 32, textAlign: 'center', flexShrink: 0,
                                    }}>
                                        {key}
                                    </Box>
                                    <Typography fontSize={12} color="#595959">{desc}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Popover>

                    {/* User menu */}
                    <Box
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', '&:hover': { opacity: 0.8 }, px: 1, py: 0.5, borderRadius: 1 }}
                    >
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Person sx={{ color: '#1890ff', fontSize: 18 }} />
                        </Box>
                    </Box>
                    <Menu
                        anchorEl={userMenuAnchor}
                        open={Boolean(userMenuAnchor)}
                        onClose={() => setUserMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        {shift && (
                            <MenuItem onClick={() => { setUserMenuAnchor(null); setCloseShiftOpen(true); }}>
                                <Lock fontSize="small" sx={{ mr: 1, color: '#faad14' }} />
                                <Typography color="#d48806" variant="body2" fontWeight={600}>Đóng ca làm việc</Typography>
                            </MenuItem>
                        )}
                        <MenuItem onClick={() => { setUserMenuAnchor(null); setLogoutConfirmOpen(true); }}>
                            <Logout fontSize="small" sx={{ mr: 1, color: '#ff4d4f' }} />
                            <Typography color="error" variant="body2" fontWeight={600}>Đăng xuất</Typography>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* MAIN BODY */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 2, gap: 2 }}>
                {/* LEFT COLUMN */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                    {/* SEARCH BAR & TABS */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', flexShrink: 0 }}>
                        <Box sx={{ flex: 1 }}>
                            <POSProductSearchBar 
                                onAdd={addToCart} 
                                onError={(msg) => setSnack({ msg, sev: 'error' })}
                                disabled={!shift} 
                                warehouseId={currentUser?.warehouseId} 
                            />
                        </Box>

                        {/* TABS CONTAINER */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, overflowX: 'auto', '&::-webkit-scrollbar': { height: 0 } }}>
                            {orders.map((order, idx) => (
                                <Box key={order.id} onClick={() => setActiveIdx(idx)} sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                                    bgcolor: activeIdx === idx ? '#e6f7ff' : '#f5f5f5',
                                    color: activeIdx === idx ? '#1890ff' : '#595959',
                                    border: `1px solid ${activeIdx === idx ? '#91d5ff' : 'transparent'}`,
                                    fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
                                }}>
                                    <Typography fontSize={13} fontWeight={activeIdx === idx ? 600 : 400} color="inherit">{order.label}</Typography>
                                    {order.isWholesale && <Chip label="Sỉ" size="small" sx={{ height: 16, fontSize: 10, fontWeight: 700, bgcolor: '#fffbe6', color: '#faad14', px: 0.25 }} />}
                                    {order.items.length > 0 && (
                                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography fontSize={10} color="#fff" fontWeight={700}>{order.items.length}</Typography>
                                        </Box>
                                    )}
                                    {orders.length > 1 && (
                                        <Box onClick={e => removeTab(idx, e)} sx={{ display: 'flex', ml: 0.5 }}>
                                            <Close sx={{ fontSize: 13, opacity: 0.6, '&:hover': { opacity: 1, color: '#ff4d4f' } }} />
                                        </Box>
                                    )}
                                </Box>
                            ))}
                            <Tooltip title="Thêm đơn mới">
                                <IconButton size="small" onClick={addTab} sx={{ color: '#8c8c8c', bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#e6f7ff', color: '#1890ff' }, width: 32, height: 32, ml: 0.5 }}>
                                    <Add sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Button color="error" variant="outlined" onClick={() => updateOrder(o => ({ ...o, items: [] }))} startIcon={<Delete />} sx={{ textTransform: 'none', borderRadius: 1.5, height: 40 }}>
                            Xóa tất cả
                        </Button>
                    </Box>

                    {/* CART TABLE */}
                    <Box sx={{ flex: 1, bgcolor: '#fff', borderRadius: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ backgroundColor: '#fafafa', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#262626', fontSize: 13 }}>Sản phẩm</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#262626', fontSize: 13, textAlign: 'right' }}>Đơn giá</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#262626', fontSize: 13 }}>SL</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#262626', fontSize: 13, textAlign: 'right' }}>Thành tiền</th>
                                        <th style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#262626', fontSize: 13 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeOrder.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#bfbfbf' }}>
                                                <ShoppingBasket sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                <Typography>Chưa có sản phẩm trong giỏ hàng</Typography>
                                            </td>
                                        </tr>
                                    ) : (
                                        activeOrder.items.map((item) => (
                                            <tr key={item.productId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{ width: 40, height: 40, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0' }}>
                                                            {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ShoppingBasket sx={{ color: '#d9d9d9' }} />}
                                                        </Box>
                                                        <Box sx={{ width: 250 }}>
                                                            <Tooltip title={item.productName} placement="top-start">
                                                                <Typography 
                                                                    fontSize={14} 
                                                                    fontWeight={500} 
                                                                    color="#262626"
                                                                    sx={{
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis'
                                                                    }}
                                                                >
                                                                    {item.productName}
                                                                </Typography>
                                                            </Tooltip>
                                                            <Typography fontSize={12} color="#8c8c8c">{item.sku || item.isbnBarcode}</Typography>
                                                        </Box>
                                                    </Box>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    {editingPriceId === item.productId ? (
                                                        <TextField inputRef={priceInputRef} size="small" type="number" value={editingPriceVal}
                                                            onChange={e => setEditingPriceVal(e.target.value)}
                                                            onBlur={() => confirmEditPrice(item.productId)}
                                                            onKeyDown={e => { if (e.key === 'Enter') confirmEditPrice(item.productId); if (e.key === 'Escape') setEditingPriceId(null); }}
                                                            sx={{ width: 90, '& input': { py: '4px', px: '8px', textAlign: 'right' } }} />
                                                    ) : (
                                                        <Typography fontSize={14} color="#595959" onClick={() => startEditPrice(item.productId, item.unitPrice)} sx={{ cursor: 'pointer', '&:hover': { color: '#1890ff' } }}>
                                                            {fmt(item.unitPrice)}
                                                        </Typography>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #d9d9d9', borderRadius: 1, width: 'fit-content' }}>
                                                        <Box onClick={() => updateQty(item.productId, item.quantity - 1)} sx={{ px: 1, py: 0.5, cursor: 'pointer', color: '#595959', '&:hover': { bgcolor: '#f5f5f5' } }}>-</Box>
                                                        <TextField size="small" value={item.quantity}
                                                            onChange={e => { const val = parseInt(e.target.value); if (!isNaN(val)) updateQty(item.productId, val); else if (e.target.value === '') updateQty(item.productId, 0); }}
                                                            sx={{ width: 45, '& fieldset': { border: 'none' }, '& input': { textAlign: 'center', py: 0.5, px: 0 } }} />
                                                        <Box onClick={() => updateQty(item.productId, item.quantity + 1)} sx={{ px: 1, py: 0.5, cursor: 'pointer', color: '#595959', '&:hover': { bgcolor: '#f5f5f5' } }}>+</Box>
                                                    </Box>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <Typography fontSize={14} fontWeight={600} color="#1890ff">{fmt(item.subtotal)}</Typography>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <IconButton size="small" onClick={() => removeItem(item.productId)} sx={{ color: '#ff4d4f' }}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Box>

                        {/* CART FOOTER SUMMARY */}
                        <Box sx={{ borderTop: '1px solid #f0f0f0', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa' }}>
                            <Typography variant="body2" color="#8c8c8c">{activeOrder.items.length} sản phẩm</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="#595959">Tạm tính:</Typography>
                                <Typography fontWeight={700} color="#262626">{fmt(totalAmount)}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* THAO TÁC NHANH */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                        {/* Header toggle */}
                        <Box
                            onClick={() => setQuickActionsOpen(o => !o)}
                            sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#fafafa' } }}
                        >
                            <Typography fontSize={12} fontWeight={600} color="#8c8c8c" letterSpacing={0.3}>THAO TÁC NHANH</Typography>
                            {quickActionsOpen
                                ? <ExpandLess sx={{ fontSize: 18, color: '#bfbfbf' }} />
                                : <ExpandMore sx={{ fontSize: 18, color: '#bfbfbf' }} />}
                        </Box>
                        {/* Buttons */}
                        {quickActionsOpen && (
                            <>
                            <Box sx={{ px: 1.5, pb: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                                {[
                                    { label: 'Chiết khấu', shortcut: 'F6', icon: <Discount sx={{ fontSize: 16 }} />, color: '#1890ff', onClick: () => setDiscountOpen(true) },
                                    { label: 'Khuyến mãi', shortcut: 'F8', icon: <CardGiftcard sx={{ fontSize: 16 }} />, color: '#52c41a', onClick: () => setPromotionOpen(true) },
                                    { label: 'Giữ đơn', shortcut: 'F2', icon: <Pause sx={{ fontSize: 16 }} />, color: '#faad14', onClick: () => holdCurrentCart() },
                                    { label: 'Đơn đã giữ', shortcut: 'F5', icon: <ShoppingBasket sx={{ fontSize: 16 }} />, color: '#722ed1', onClick: () => setHeldOpen(true) },
                                    { label: 'Hóa đơn', shortcut: 'F9', icon: <History sx={{ fontSize: 16 }} />, color: '#13c2c2', onClick: () => setInvoiceHistoryOpen(true) },
                                    { label: 'Doanh thu', shortcut: 'F10', icon: <Assessment sx={{ fontSize: 16 }} />, color: '#eb2f96', onClick: () => setRevenueOpen(true) },
                                    { label: 'Trả hàng', shortcut: '', icon: <KeyboardReturn sx={{ fontSize: 16 }} />, color: '#ff4d4f', onClick: () => setRefundOpen(true) },
                                    { label: 'Xóa đơn', shortcut: '', icon: <ClearAll sx={{ fontSize: 16 }} />, color: '#ff7875', onClick: () => updateOrder(o => ({ ...o, items: [] })) },
                                ].map(action => (
                                    <Button
                                        key={action.label}
                                        onClick={action.onClick}
                                        variant="outlined"
                                        sx={{
                                            textTransform: 'none',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#262626',
                                            borderColor: '#e0e0e0',
                                            bgcolor: '#fafafa',
                                            borderRadius: 2,
                                            py: 1.25,
                                            flexDirection: 'column',
                                            gap: 0.5,
                                            minHeight: 68,
                                            '&:hover': { bgcolor: '#f0f0f0', borderColor: '#bdbdbd' },
                                        }}
                                    >
                                        {React.cloneElement(action.icon, { sx: { fontSize: 18, color: action.color } })}
                                        <Box component="span" sx={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.2, textAlign: 'center', color: '#262626' }}>
                                            {action.label}
                                        </Box>
                                        {action.shortcut && (
                                            <Box component="span" sx={{
                                                bgcolor: '#eeeeee', color: '#595959',
                                                borderRadius: 0.5, px: 0.5, fontSize: 9.5, fontWeight: 700,
                                                lineHeight: 1.5,
                                            }}>
                                                {action.shortcut}
                                            </Box>
                                        )}
                                    </Button>
                                ))}
                            </Box>

                            </>
                        )}
                    </Box>
                </Box>

                {/* RIGHT COLUMN (PAYMENT) */}
                <Box sx={{ width: 360, bgcolor: '#fff', borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <Typography component="div" fontWeight={700} mb={1} display="flex" alignItems="center" gap={1} color="#262626" fontSize={16}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', bgcolor: '#e6f7ff', color: '#1890ff' }}>
                            <MonetizationOn sx={{ fontSize: 16 }} />
                        </Box>
                        Thanh toán
                    </Typography>


                    {/* Khách hàng */}
                    <Box mb={2}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                            <Person sx={{ fontSize: 16, color: '#595959' }} />
                            <Typography variant="body2" fontWeight={600} color="#595959">Khách hàng</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                                <InlineCustomerSearch customer={activeOrder.customer} onSelect={c => updateOrder(o => ({ ...o, customer: c, pointsToUse: 0 }))} inputRef={customerInputRef} />
                            </Box>
                            <Tooltip title="Thêm khách hàng">
                                <IconButton size="small" onClick={() => setQuickCreateOpen(true)} sx={{ color: '#1890ff' }}><PersonAdd /></IconButton>
                            </Tooltip>
                        </Box>

                        {activeOrder.customer && (activeOrder.customer.loyaltyPoints ?? 0) > 0 && (
                            <Box sx={{ mt: 1 }}>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                    <Typography variant="caption" color="#8c8c8c">Quy đổi điểm (1đ = 1.000₫)</Typography>
                                    <Typography variant="caption" color="#1890ff" fontWeight={600}>Khả dụng: {activeOrder.customer.loyaltyPoints}</Typography>
                                </Box>
                                <TextField
                                    fullWidth size="small" type="number"
                                    placeholder="Nhập số điểm muốn dùng..."
                                    value={activeOrder.pointsToUse || ''}
                                    onChange={e => {
                                        let val = parseInt(e.target.value);
                                        if (isNaN(val) || val < 0) val = 0;
                                        const maxAllowed = Math.min(activeOrder.customer!.loyaltyPoints, Math.ceil(Math.max(0, totalAmount - orderDiscountAmt - couponDiscountAmt) / 1000));
                                        if (val > maxAllowed) val = maxAllowed;
                                        updateOrder(o => ({ ...o, pointsToUse: val }));
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <Typography 
                                                variant="caption" color="#1890ff" fontWeight={600} 
                                                sx={{ cursor: 'pointer', whiteSpace: 'nowrap', ml: 1 }} 
                                                onClick={() => {
                                                    const maxAllowed = Math.min(activeOrder.customer!.loyaltyPoints, Math.ceil(Math.max(0, totalAmount - orderDiscountAmt - couponDiscountAmt) / 1000));
                                                    updateOrder(o => ({ ...o, pointsToUse: maxAllowed }));
                                                }}
                                            >
                                                Tối đa
                                            </Typography>
                                        ),
                                        sx: { fontSize: 13, height: 32 }
                                    }}
                                    sx={{ '& input': { py: 0 } }}
                                />
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: '#f0f0f0' }} />

                    <Box display="flex" justifyContent="space-between" mb={1.5}>
                        <Typography variant="body2" color="#8c8c8c">Tạm tính</Typography>
                        <Typography variant="body2" color="#262626">{fmt(totalAmount)}</Typography>
                    </Box>

                    {/* Banner chiết khấu sản lượng */}
                    {discountHint && discountHint.discountPct > 0 && (
                        <Box sx={{ bgcolor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 1.5, p: 1, mb: 1.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <LocalOffer sx={{ fontSize: 13, color: '#52c41a' }} />
                                    <Typography variant="caption" fontWeight={700} color="#52c41a">
                                        Chiết khấu {discountHint.discountPct}%{discountHint.tierLabel ? ` (${discountHint.tierLabel})` : ''}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" fontWeight={700} color="#52c41a">
                                    -{fmt(discountHint.discountAmount)}
                                </Typography>
                            </Box>
                            {discountHint.nextTierMinAmount && discountHint.nextTierMinAmount > totalAmount && (
                                <Typography variant="caption" color="#8c8c8c" sx={{ mt: 0.25, display: 'block', fontSize: 11 }}>
                                    💡 Mua thêm {fmt(discountHint.nextTierMinAmount - totalAmount)} → được {discountHint.nextTierPct}%
                                </Typography>
                            )}
                        </Box>
                    )}
                    {discountHint && discountHint.discountPct === 0 && discountHint.nextTierMinAmount && (
                        <Box sx={{ bgcolor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 1.5, p: 1, mb: 1.5 }}>
                            <Typography variant="caption" color="#d48806" sx={{ fontSize: 11 }}>
                                💡 Mua thêm {fmt(discountHint.nextTierMinAmount - totalAmount)} → được chiết khấu {discountHint.nextTierPct}%
                            </Typography>
                        </Box>
                    )}

                    {/* Mã khuyến mãi */}
                    <Box mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <LocalOffer sx={{ fontSize: 14, color: '#1890ff' }} />
                            <Typography variant="caption" fontWeight={600} color="#595959">Mã khuyến mãi</Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                            <TextField
                                size="small"
                                placeholder="Nhập mã khuyến mãi..."
                                fullWidth
                                value={activeOrder.couponCode}
                                onChange={e => updateOrder(o => ({ ...o, couponCode: e.target.value.toUpperCase(), couponDiscount: 0 }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromoCode(); } }}
                                sx={{ '& input': { py: 1, fontSize: 13 } }}
                                InputProps={{
                                    endAdornment: activeOrder.couponCode ? (
                                        <IconButton size="small" onClick={() => updateOrder(o => ({ ...o, couponCode: '', couponDiscount: 0 }))} sx={{ p: 0.25 }}>
                                            <Close sx={{ fontSize: 16, color: '#bfbfbf' }} />
                                        </IconButton>
                                    ) : undefined,
                                }}
                            />
                            <Button
                                variant="outlined"
                                disabled={!activeOrder.couponCode}
                                onClick={handleApplyPromoCode}
                                sx={{ whiteSpace: 'nowrap', textTransform: 'none', color: '#1890ff', borderColor: '#91d5ff', bgcolor: '#e6f7ff', fontWeight: 600, minWidth: 80 }}
                            >
                                Áp dụng
                            </Button>
                        </Box>
                        {activeOrder.couponDiscount > 0 && (
                            <Typography variant="caption" color="#52c41a" sx={{ mt: 0.5, display: 'block' }}>
                                ✅ Đã giảm {fmt(activeOrder.couponDiscount)}
                            </Typography>
                        )}
                    </Box>

                    {/* Chiết khấu đơn — button mở Popover */}
                    <Box mb={1.5} display="flex" alignItems="center" justifyContent="space-between">
                        <Button
                            size="small"
                            variant={(activeOrder.orderDiscount > 0 || activeOrder.orderDiscountAmt > 0) ? 'contained' : 'outlined'}
                            startIcon={<Percent sx={{ fontSize: 14 }} />}
                            onClick={e => setDiscountAnchorEl(e.currentTarget)}
                            sx={{
                                textTransform: 'none', fontSize: 13, fontWeight: 600,
                                ...(activeOrder.orderDiscount > 0 || activeOrder.orderDiscountAmt > 0) ? {
                                    color: '#fff', bgcolor: '#1890ff', borderColor: '#1890ff', boxShadow: 'none',
                                    '&:hover': { bgcolor: '#40a9ff', boxShadow: 'none' },
                                } : {
                                    color: '#595959', borderColor: '#d9d9d9', bgcolor: '#fafafa',
                                    '&:hover': { borderColor: '#1890ff', color: '#1890ff', bgcolor: '#e6f7ff' },
                                },
                                borderRadius: 1.5, height: 34, px: 1.5,
                            }}
                        >
                            Chiết khấu đơn
                            <Box component="span" sx={{ ml: 0.75, fontSize: 10, fontWeight: 700, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 0.5, px: 0.5, lineHeight: 1.6 }}>F6</Box>
                        </Button>
                        {(activeOrder.orderDiscount > 0 || activeOrder.orderDiscountAmt > 0) ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography variant="body2" color="#ff4d4f" fontWeight={700}>
                                    -{fmt(orderDiscountAmt)}
                                </Typography>
                                <IconButton size="small" onClick={() => updateOrder(o => ({ ...o, orderDiscount: 0, orderDiscountAmt: 0 }))} sx={{ p: 0.25, color: '#bfbfbf', '&:hover': { color: '#ff4d4f' } }}>
                                    <Close sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        ) : (
                            <Typography variant="caption" color="#bfbfbf">Chưa áp dụng</Typography>
                        )}
                    </Box>

                    {/* Popover nhập chiết khấu */}
                    <Popover
                        open={Boolean(discountAnchorEl)}
                        anchorEl={discountAnchorEl}
                        onClose={() => setDiscountAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        PaperProps={{ sx: { borderRadius: 2, p: 2, width: 260, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
                    >
                        <Typography fontSize={13} fontWeight={700} color="#262626" mb={1.5}>
                            Chiết khấu đơn hàng
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1.25}>
                            <TextField
                                size="small"
                                label="Theo phần trăm (%)"
                                type="number"
                                value={activeOrder.orderDiscount || ''}
                                onChange={e => {
                                    const pct = Number(e.target.value) || 0;
                                    updateOrder(o => ({ ...o, orderDiscount: pct, orderDiscountAmt: 0 }));
                                }}
                                placeholder="Ví dụ: 5"
                                InputProps={{ endAdornment: <Typography color="#8c8c8c" fontWeight={700} fontSize={13}>%</Typography> }}
                                inputProps={{ min: 0, max: 100 }}
                                fullWidth
                                autoFocus
                            />
                            <TextField
                                size="small"
                                label="Theo số tiền cố định (đ)"
                                type="number"
                                value={activeOrder.orderDiscountAmt || ''}
                                onChange={e => {
                                    const amt = Number(e.target.value) || 0;
                                    updateOrder(o => ({ ...o, orderDiscount: 0, orderDiscountAmt: amt }));
                                }}
                                placeholder="Ví dụ: 50000"
                                InputProps={{ endAdornment: <Typography color="#8c8c8c" fontWeight={700} fontSize={13}>đ</Typography> }}
                                fullWidth
                            />
                            {(activeOrder.orderDiscount > 0 || activeOrder.orderDiscountAmt > 0) && (
                                <Box sx={{ bgcolor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 1.5, px: 1.5, py: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography fontSize={12} color="#cf1322">Giảm</Typography>
                                    <Typography fontSize={14} fontWeight={700} color="#cf1322">-{fmt(orderDiscountAmt)}</Typography>
                                </Box>
                            )}
                            <Box display="flex" gap={1} mt={0.5}>
                                <Button
                                    fullWidth size="small" variant="outlined" color="error"
                                    onClick={() => { updateOrder(o => ({ ...o, orderDiscount: 0, orderDiscountAmt: 0 })); setDiscountAnchorEl(null); }}
                                    sx={{ textTransform: 'none', borderRadius: 1.5, whiteSpace: 'nowrap', fontWeight: 600 }}
                                >
                                    Xóa giảm giá
                                </Button>
                                <Button
                                    fullWidth size="small" variant="contained"
                                    onClick={() => setDiscountAnchorEl(null)}
                                    sx={{ textTransform: 'none', borderRadius: 1.5, bgcolor: '#1890ff', '&:hover': { bgcolor: '#40a9ff' }, whiteSpace: 'nowrap', fontWeight: 600 }}
                                >
                                    Xác nhận
                                </Button>
                            </Box>
                        </Box>
                    </Popover>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="body2" color="#8c8c8c">Thu khác</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Button variant="text" size="small" sx={{ textTransform: 'none' }}>Chọn</Button>
                            <Typography variant="body2" color="#262626">0đ</Typography>
                        </Box>
                    </Box>

                    {pointsDiscount > 0 && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <Star sx={{ fontSize: 14, color: '#faad14' }} />
                                <Typography variant="body2" color="#8c8c8c">Quy đổi điểm</Typography>
                            </Box>
                            <Typography variant="body2" color="#ff4d4f" fontWeight={600}>-{fmt(pointsDiscount)}</Typography>
                        </Box>
                    )}

                    <Box display="flex" gap={1} mb={1.5} bgcolor="#f5f5f5" p={0.5} borderRadius={1.5}>
                        <Button variant="contained" fullWidth onClick={() => setCheckoutOpen(true)} sx={{ bgcolor: '#1890ff', color: '#fff', boxShadow: 'none', textTransform: 'none', borderRadius: 1, '&:hover': { bgcolor: '#40a9ff', boxShadow: 'none' } }}>Thanh toán</Button>
                        <Button variant="text" fullWidth sx={{ color: '#8c8c8c', textTransform: 'none' }} onClick={() => holdCurrentCart()}>Giữ đơn (F2)</Button>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: '#f0f0f0' }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography fontWeight={700} color="#262626">Tổng thanh toán</Typography>
                        <Typography variant="h5" fontWeight={800} color="#1890ff">{fmt(finalAmount)}</Typography>
                    </Box>

                    {/* Hình thức thanh toán */}
                    <Box mb={2}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="caption" color="#8c8c8c">ⓘ Hình thức thanh toán</Typography>
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {[
                                { id: 'CASH', label: 'Tiền mặt' },
                                { id: 'BANK_TRANSFER', label: 'Chuyển khoản' },
                                { id: 'CARD', label: 'Quẹt thẻ' },
                                { id: 'VNPAY', label: 'VNPay' },
                                { id: 'PAYOS', label: 'PayOS' }
                            ].map(method => (
                                <FormControlLabel
                                    key={method.id}
                                    control={<Checkbox size="small" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id as any)} sx={{ '&.Mui-checked': { color: '#1890ff' } }} />}
                                    label={<Typography fontSize={13} color="#262626">{method.label}</Typography>}
                                    sx={{ m: 0 }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Tiền khách đưa */}
                    <Box mb={1.5}>
                        <Typography variant="caption" fontWeight={600} color="#595959" mb={0.5} display="block">Tiền khách đưa</Typography>
                        <TextField
                            fullWidth size="small"
                            placeholder={new Intl.NumberFormat('vi-VN').format(finalAmount)}
                            value={customerGivenAmount === '' ? '' : new Intl.NumberFormat('vi-VN').format(customerGivenAmount)}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCustomerGivenAmount(val === '' ? '' : Number(val));
                            }}
                            InputProps={{
                                endAdornment: <Typography fontWeight={700} color="#262626">₫</Typography>,
                                sx: { fontWeight: 700, fontSize: 16, color: '#262626' }
                            }}
                            sx={{ '& input': { fontWeight: 700, fontSize: 16, color: '#262626' } }}
                        />
                    </Box>

                    {/* Tiền thừa */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f6ffed" border="1px solid #b7eb8f" borderRadius={2} p={1.5} mb={2}>
                        <Typography variant="body2" fontWeight={600} color="#262626">Tiền thừa</Typography>
                        <Typography variant="h6" fontWeight={800} color="#52c41a">{fmt(Math.max(0, (customerGivenAmount === '' ? finalAmount : Number(customerGivenAmount)) - finalAmount))}</Typography>
                    </Box>

                    {/* Hoàn tất */}
                    <Box mb={1.5}>
                        <Button fullWidth variant="contained" size="large" onClick={handleCheckout} disabled={activeOrder.items.length === 0 || activeOrder.items.some(i => i.quantity === 0) || !shift || checkoutLoading} sx={{ height: 50, fontSize: 15, fontWeight: 700, borderRadius: 2, bgcolor: '#1890ff', textTransform: 'none', boxShadow: '0 2px 0 rgba(24,144,255,0.1)', '&:hover': { bgcolor: '#40a9ff' } }}>
                            {checkoutLoading ? <CircularProgress size={24} color="inherit" /> : `Thanh toán · ${fmt(finalAmount)}`}
                        </Button>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="#8c8c8c">In tự động</Typography>
                        <Switch size="small" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} color="primary" />
                    </Box>
                </Box>
            </Box>

            <QuickCreateCustomerDialog open={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} onCreated={c => { updateOrder(o => ({ ...o, customer: c })); setSnack({ msg: `✅ Đã chọn khách "${c.fullName}"`, sev: 'success' }); }} />
            <POSHeldOrdersDialog open={heldOpen} heldOrders={heldOrders} onClose={() => setHeldOpen(false)} onRecall={recallHeldOrder} onDelete={deleteHeldOrder} />
            <OrderDiscountDialog open={discountOpen} totalAmount={totalAmount} discount={activeOrder.orderDiscount} discountAmt={activeOrder.orderDiscountAmt} onClose={() => setDiscountOpen(false)} onApply={(pct, amt) => updateOrder(o => ({ ...o, orderDiscount: pct, orderDiscountAmt: amt }))} />
            <PromotionDialog open={promotionOpen} totalAmount={totalAmount} appliedCode={activeOrder.couponCode} scannedCode={scannedCouponCode} onClose={() => { setPromotionOpen(false); setScannedCouponCode(undefined); }} onApply={(code, discount) => { updateOrder(o => ({ ...o, couponCode: code, couponDiscount: discount })); setSnack({ msg: `🎁 Áp dụng mã "${code}"`, sev: 'success' }); }} onRemove={() => updateOrder(o => ({ ...o, couponCode: '', couponDiscount: 0 }))} />
            <POSInvoiceHistoryDialog open={invoiceHistoryOpen} onClose={() => setInvoiceHistoryOpen(false)} shiftId={shift?.id} onRefundRequest={(code) => { setInvoiceHistoryOpen(false); setRefundInitialCode(code); setRefundOpen(true); }} onPrintRequest={(inv) => { setPrintInvoice(inv as any); setPrintDialogOpen(true); }} />
            <PrintInvoiceDialog open={printDialogOpen} onClose={() => { setPrintDialogOpen(false); setPrintInvoice(null); }} invoice={printInvoice} cashierDisplayName={currentUser?.fullName} />
            <RefundDialog open={refundOpen} onClose={() => { setRefundOpen(false); setRefundInitialCode(undefined); }} shiftId={shift?.id ?? null} initialInvoiceCode={refundInitialCode} onRefundSuccess={(inv) => { setSnack({ msg: `✅ Trả hàng thành công! Mã: ${inv?.code || ''}`, sev: 'success' }); if (inv) { setPrintInvoice({ ...inv, type: 'RETURN' }); setPrintDialogOpen(true); } }} />
            <RevenueReportDialog
                open={revenueOpen}
                onClose={() => setRevenueOpen(false)}
                warehouseId={currentUser?.warehouseId}
                onPrintInvoice={(inv) => {
                    setPrintInvoice(inv);
                    setPrintDialogOpen(true);
                }}
            />

            {qrPaymentData && (
                <QrPaymentDialog 
                    open={qrDialogOpen} 
                    onClose={() => { setQrDialogOpen(false); setQrPaymentData(null); }} 
                    checkoutUrl={qrPaymentData.checkoutUrl} 
                    qrCode={qrPaymentData.qrCode}
                    orderCode={qrPaymentData.orderCode} 
                    amount={qrPaymentData.amount} 
                    gateway={qrPaymentData.gateway} 
                />
            )}

            {/* Confirm Delete Dialog */}
            <Dialog open={confirmDeleteIdx !== null} onClose={() => setConfirmDeleteIdx(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 380 } }}>
                <MuiDialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 0.5 }}>⚠️ Xác nhận xóa đơn hàng</MuiDialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: 14, color: '#333' }}>
                        <strong>{confirmDeleteIdx !== null ? orders[confirmDeleteIdx]?.label : ''}</strong> đang có{' '}
                        <strong>{confirmDeleteIdx !== null ? orders[confirmDeleteIdx]?.items?.length : 0}</strong> sản phẩm.
                        <br />Xóa sẽ mất toàn bộ sản phẩm trong đơn này. Bạn có chắc chắn?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDeleteIdx(null)} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button onClick={() => confirmDeleteIdx !== null && doRemoveTab(confirmDeleteIdx)} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>Xóa đơn</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snack} autoHideDuration={snack?.sev === 'error' ? 6000 : 3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2, fontWeight: 600, fontSize: 13 }}>{snack.msg}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

export default EmployeePOSPage;

