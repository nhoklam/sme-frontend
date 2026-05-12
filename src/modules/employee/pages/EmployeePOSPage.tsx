import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Chip, IconButton, Button, Alert,
    Snackbar, CircularProgress, Tooltip, TextField,
    Select, MenuItem, FormControl,
    Divider, Badge, Checkbox, FormControlLabel, Switch
} from '@mui/material';
import {
    Storefront, Dashboard as DashboardIcon,
    Logout as LogoutIcon,
    Add, Close, LocalOffer, Delete, Print, ReceiptLong,
    Pause, ShoppingBasket, PersonAdd, Undo,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../../services/axiosConfig';
import authService from '../../../services/authService';
import { useWebSocket, WsPayload } from '../../../store/hooks/useWebSocket';
import { ProductResponse, Customer } from '../../../types';

import OpenShiftDialog from '../components/pos/OpenShiftDialog';
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
    const [printInvoice, setPrintInvoice] = useState<any>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false);
    const [refundInitialCode, setRefundInitialCode] = useState<string | undefined>(undefined);
    const [revenueOpen, setRevenueOpen] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'E_WALLET'>('CASH');
    const [customerGivenAmount, setCustomerGivenAmount] = useState<number | ''>('');
    const [autoPrint, setAutoPrint] = useState(true);

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
            const res = await axiosInstance.get(`/inventory/warehouse/${currentUser.warehouseId}/search?keyword=${barcode}&page=0&size=5`);
            const items = res.data?.data?.content || [];
            const match = items.find((p: any) => p.isbnBarcode === barcode || p.sku === barcode);

            if (match) {
                const pRes = await axiosInstance.get(`/products/${match.productId}`);
                const product = pRes.data?.data;
                if (product && addToCartRef.current) {
                    addToCartRef.current(product);
                }
            } else {
                setSnack({ msg: `Mã vạch ${barcode} không tìm thấy trong kho!`, sev: 'error' });
            }
        } catch (e) {
            setSnack({ msg: `Lỗi quét mã vạch ${barcode}`, sev: 'error' });
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
        updateOrder(o => ({ ...o, items: [], customer: null, pointsToUse: 0, couponCode: '', couponDiscount: 0, orderDiscount: 0, orderDiscountAmt: 0 }));
        setSnack({ msg: `⏸ Đã giữ tạm "${activeOrder.label}" · F5 để gọi lại`, sev: 'info' });
    }, [activeOrder, updateOrder]);

    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' | 'info' | 'warning' } | null>(null);

    const handleCheckout = async () => {
        if (!shift) return;
        setCheckoutLoading(true);
        try {
            let actualAmount = customerGivenAmount !== '' ? Number(customerGivenAmount) : finalAmount;
            if (actualAmount > finalAmount) actualAmount = finalAmount;
            const payments = [{ method: paymentMethod, amount: actualAmount }];

            const res = await axiosInstance.post('/pos/checkout', {
                shiftId: shift.id,
                customerId: activeOrder.customer?.id ?? null,
                items: activeOrder.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
                payments: payments.map(p => ({ method: p.method, amount: p.amount })),
                pointsToUse: activeOrder.pointsToUse > 0 ? activeOrder.pointsToUse : undefined,
                orderDiscountAmt: orderDiscountAmt > 0 ? orderDiscountAmt : undefined,
                couponDiscountAmt: couponDiscountAmt > 0 ? couponDiscountAmt : undefined,
                couponCode: activeOrder.couponCode || undefined,
            });
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
            updateOrder(o => ({ ...o, items: [], customer: null, pointsToUse: 0, couponCode: '', couponDiscount: 0, orderDiscount: 0, orderDiscountAmt: 0 }));
            setCheckoutOpen(false);
            setCustomerGivenAmount('');

            if (invoiceData && autoPrint) {
                setPrintInvoice(invoiceData);
                setPrintDialogOpen(true);
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
            const newTab = { ...held.fullTab, id: String(orderCounter), label: held.fullTab.label };
            setOrders(prev => [...prev, newTab]);
            setActiveIdx(orders.length);
            setOrderCounter(c => c + 1);
        }
        setHeldOrders(prev => prev.filter(h => h.id !== heldId));
        setSnack({ msg: `▶ Đã gọi lại đơn "${held.label}"`, sev: 'success' });
    };

    const deleteHeldOrder = (heldId: string) => setHeldOrders(prev => prev.filter(h => h.id !== heldId));

    const addTab = () => {
        const label = `Đơn ${orderCounter}`;
        setOrders(prev => [...prev, newOrder(String(orderCounter), label)]);
        setActiveIdx(orders.length);
        setOrderCounter(c => c + 1);
    };

    const removeTab = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (orders.length === 1) return;
        setOrders(prev => prev.filter((_, i) => i !== idx));
        setActiveIdx(prev => Math.min(prev, orders.length - 2));
    };

    const addToCart = (p: ProductResponse) => {
        const isWholesale = activeOrder.isWholesale;
        const unitPrice = isWholesale && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
        updateOrder(o => {
            const ex = o.items.find(i => i.productId === p.id);
            const items = ex
                ? o.items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } : i)
                : [...o.items, {
                    productId: p.id, productName: p.name, isbnBarcode: p.isbnBarcode,
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
        if (qty < 1) { updateOrder(o => ({ ...o, items: o.items.filter(i => i.productId !== id) })); return; }
        updateOrder(o => ({ ...o, items: o.items.map(i => i.productId === id ? { ...i, quantity: qty, subtotal: qty * i.unitPrice } : i) }));
    };

    const removeItem = (id: string) => { updateOrder(o => ({ ...o, items: o.items.filter(i => i.productId !== id) })); };

    const totalAmount = activeOrder.items.reduce((s, i) => s + i.subtotal, 0);
    const orderDiscountAmt = activeOrder.orderDiscount > 0
        ? Math.round(totalAmount * activeOrder.orderDiscount / 100)
        : activeOrder.orderDiscountAmt;
    const couponDiscountAmt = activeOrder.couponDiscount ?? 0;
    const pointsDiscount = activeOrder.pointsToUse > 0 ? activeOrder.pointsToUse * 100 : 0;
    const finalAmount = Math.max(0, totalAmount - orderDiscountAmt - couponDiscountAmt - pointsDiscount);
    const totalDiscount = orderDiscountAmt + couponDiscountAmt + pointsDiscount;

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

    const handleCloseShift = async () => {
        const reported = window.prompt('Nhập số tiền thực đếm trong két (₫):');
        if (reported === null) return;
        const reason = window.prompt('Lý do chênh lệch (nếu có):') ?? '';
        try {
            await axiosInstance.post('/pos/shifts/close', { reportedCash: Number(reported), discrepancyReason: reason || undefined });
            setShift(null);
            setSnack({ msg: '✅ Đóng ca thành công!', sev: 'success' });
        } catch (e: any) {
            setSnack({ msg: e.response?.data?.message || 'Đóng ca thất bại', sev: 'error' });
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

    return (
        <Box sx={{ height: '100%', bgcolor: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <OpenShiftDialog open={!shift} onOpen={handleOpenShift} loading={openShiftLoading} />

            <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', height: 52, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 32, height: 32, bgcolor: '#334155', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Storefront sx={{ fontSize: 17, color: '#fff' }} />
                        </Box>
                        <Box>
                            <Typography fontWeight={700} fontSize={13.5} color="#1e293b" lineHeight={1.1}>{currentUser?.warehouseName || 'Cửa hàng'}</Typography>
                            <Typography variant="caption" color="#64748b" fontSize={10.5} lineHeight={1}>{currentUser?.fullName} · {new Date().toLocaleDateString('vi-VN')}</Typography>
                        </Box>
                    </Box>
                    {shift && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                            <Typography variant="caption" color="#22c55e" fontWeight={700} fontSize={11}>Ca {shift.id.slice(0, 6).toUpperCase()}</Typography>
                        </Box>
                    )}
                    <Tooltip title={isConnected ? 'Đang kết nối real-time' : 'Mất kết nối real-time'}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 1, bgcolor: isConnected ? '#22c55e15' : '#ef444415' }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isConnected ? '#22c55e' : '#ef4444' }} />
                            <Typography fontSize={9.5} color={isConnected ? '#22c55e' : '#ef4444'} fontWeight={600}>{isConnected ? 'Live' : 'Offline'}</Typography>
                        </Box>
                    </Tooltip>
                    {heldOrders.length > 0 && (
                        <Tooltip title={`${heldOrders.length} đơn đang giữ · F5`}>
                            <Box onClick={() => setHeldOpen(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.4, borderRadius: 1.5, cursor: 'pointer', bgcolor: '#f59e0b22', border: '1px solid #f59e0b44', '&:hover': { bgcolor: '#f59e0b33' } }}>
                                <Pause sx={{ fontSize: 14, color: '#f59e0b' }} />
                                <Typography fontSize={11} fontWeight={700} color="#f59e0b">{heldOrders.length} đang giữ</Typography>
                            </Box>
                        </Tooltip>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                    {shift && (
                        <>
                            <Tooltip title="Đơn đang giữ (F5)">
                                <Button size="small" startIcon={<Pause sx={{ fontSize: 14 }} />} onClick={() => setHeldOpen(true)} sx={{ textTransform: 'none', color: '#94a3b8', fontSize: 12, px: 1.5, '&:hover': { color: '#e2e8f0', bgcolor: '#1e293b' } }}>Giữ tạm</Button>
                            </Tooltip>
                            <Tooltip title="Lịch sử hóa đơn (F9)">
                                <Button size="small" startIcon={<ReceiptLong sx={{ fontSize: 14 }} />} onClick={() => setInvoiceHistoryOpen(true)} sx={{ textTransform: 'none', color: '#94a3b8', fontSize: 12, px: 1.5, '&:hover': { color: '#e2e8f0', bgcolor: '#1e293b' } }}>Hóa đơn</Button>
                            </Tooltip>
                            <Tooltip title="Trả hàng">
                                <Button size="small" startIcon={<Undo sx={{ fontSize: 14 }} />} onClick={() => setRefundOpen(true)} sx={{ textTransform: 'none', color: '#f87171', fontSize: 12, px: 1.5, '&:hover': { color: '#fca5a5', bgcolor: '#1e293b' } }}>Trả hàng</Button>
                            </Tooltip>
                            <Tooltip title="Báo cáo doanh thu (F10)">
                                <Button size="small" startIcon={<DashboardIcon sx={{ fontSize: 14 }} />} onClick={() => setRevenueOpen(true)} sx={{ textTransform: 'none', color: '#22c55e', fontSize: 12, px: 1.5, '&:hover': { color: '#4ade80', bgcolor: '#1e293b' } }}>Doanh thu</Button>
                            </Tooltip>
                        </>
                    )}
                    {isAdmin && (
                        <Button size="small" startIcon={<DashboardIcon sx={{ fontSize: 14 }} />} onClick={() => navigate('/admin/dashboard')} sx={{ textTransform: 'none', color: '#64748b', fontSize: 12, px: 1.5, '&:hover': { color: '#94a3b8', bgcolor: '#1e293b' } }}>Admin</Button>
                    )}
                    {shift && (
                        <Button size="small" variant="outlined" startIcon={<LogoutIcon sx={{ fontSize: 13 }} />} onClick={handleCloseShift}
                            sx={{ textTransform: 'none', fontSize: 11, borderColor: '#334155', color: '#64748b', '&:hover': { borderColor: '#ef4444', color: '#ef4444', bgcolor: 'transparent' }, px: 1.5, py: 0.4 }}>
                            Đóng ca
                        </Button>
                    )}
                </Box>
            </Box>

            <Box sx={{ bgcolor: '#1e293b', px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                <Box sx={{ flex: '0 0 420px' }}>
                    <POSProductSearchBar
                        onAdd={addToCart}
                        onScanCoupon={(code) => {
                            setScannedCouponCode(code);
                            setPromotionOpen(true);
                        }}
                        disabled={!shift}
                    />
                </Box>
                <Tooltip title={activeOrder.isWholesale ? 'Đang bán giá sỉ · Bấm để chuyển bán lẻ' : 'Chuyển sang bán giá sỉ'}>
                    <Box onClick={toggleWholesale} sx={{
                        display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: 1.5, cursor: 'pointer',
                        border: '1px solid', borderColor: activeOrder.isWholesale ? '#f59e0b' : '#334155',
                        bgcolor: activeOrder.isWholesale ? '#f59e0b22' : 'transparent',
                        '&:hover': { borderColor: '#f59e0b', bgcolor: '#f59e0b11' }, transition: 'all 0.15s', flexShrink: 0,
                    }}>
                        <ShoppingBasket sx={{ fontSize: 15, color: activeOrder.isWholesale ? '#f59e0b' : '#64748b' }} />
                        <Typography fontSize={11.5} fontWeight={700} color={activeOrder.isWholesale ? '#f59e0b' : '#64748b'}>
                            {activeOrder.isWholesale ? 'Bán sỉ' : 'Bán lẻ'}
                        </Typography>
                    </Box>
                </Tooltip>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, overflowX: 'auto', '&::-webkit-scrollbar': { height: 0 } }}>
                    {orders.map((order, idx) => (
                        <Box key={order.id} onClick={() => setActiveIdx(idx)} sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                            bgcolor: activeIdx === idx ? '#fff' : 'rgba(255,255,255,0.08)',
                            color: activeIdx === idx ? '#1e293b' : '#94a3b8',
                            border: `1.5px solid ${activeIdx === idx ? '#fff' : 'transparent'}`,
                            fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
                        }}>
                            <Typography fontSize={12} fontWeight={activeIdx === idx ? 700 : 500} color="inherit">{order.label}</Typography>
                            {order.isWholesale && <Chip label="Sỉ" size="small" sx={{ height: 14, fontSize: 9, fontWeight: 700, bgcolor: '#f59e0b33', color: '#f59e0b', px: 0.25 }} />}
                            {order.items.length > 0 && (
                                <Box sx={{ width: 17, height: 17, borderRadius: '50%', bgcolor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography fontSize={9} color="#fff" fontWeight={800}>{order.items.length}</Typography>
                                </Box>
                            )}
                            {orders.length > 1 && (
                                <Box onClick={e => removeTab(idx, e)} sx={{ display: 'flex', ml: 0.25 }}>
                                    <Close sx={{ fontSize: 11, opacity: 0.6, '&:hover': { opacity: 1, color: '#ef4444' } }} />
                                </Box>
                            )}
                        </Box>
                    ))}
                    <Tooltip title="Thêm đơn mới">
                        <IconButton size="small" onClick={addTab} sx={{ color: '#64748b', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }, width: 28, height: 28 }}>
                            <Add sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#f8fafc' }}>
                    <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 2 } }}>
                        {activeOrder.items.length === 0 ? (
                            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                                <Box sx={{ fontSize: 72, mb: 1.5, opacity: 0.3 }}>🛒</Box>
                                <Typography color="#94a3b8" fontSize={14} fontWeight={600}>Chưa có sản phẩm</Typography>
                                <Typography color="#cbd5e1" fontSize={12} mt={0.5}>Tìm sản phẩm hoặc quét mã vạch</Typography>
                                {activeOrder.isWholesale && <Chip label="🏷 Chế độ bán sỉ đang bật" size="small" sx={{ mt: 1.5, bgcolor: '#f59e0b22', color: '#f59e0b', fontWeight: 600 }} />}
                            </Box>
                        ) : (
                            <Box sx={{ p: 1.25 }}>
                                {activeOrder.isWholesale && (
                                    <Box sx={{ mb: 1, p: 1, borderRadius: 1.5, bgcolor: '#f59e0b11', border: '1px solid #f59e0b44', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ShoppingBasket sx={{ fontSize: 14, color: '#f59e0b' }} />
                                        <Typography variant="caption" color="#f59e0b" fontWeight={700} fontSize={11.5}>Đang áp dụng giá sỉ · Bấm "Bán sỉ" để tắt</Typography>
                                    </Box>
                                )}
                                {activeOrder.couponCode && (
                                    <Box sx={{ mb: 1, p: 1, borderRadius: 1.5, bgcolor: '#a855f711', border: '1px solid #a855f744', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocalOffer sx={{ fontSize: 14, color: '#a855f7' }} />
                                            <Typography variant="caption" color="#a855f7" fontWeight={700} fontSize={11.5}>
                                                Mã KM: <strong>{activeOrder.couponCode}</strong> · Giảm {fmt(couponDiscountAmt)}
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => updateOrder(o => ({ ...o, couponCode: '', couponDiscount: 0 }))} sx={{ p: 0.25, color: '#a855f7' }}>
                                            <Close sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    </Box>
                                )}
                                <Box sx={{ display: 'grid', gridTemplateColumns: '2.5fr 90px 90px 95px 28px', gap: 1, px: 1.25, py: 0.75, bgcolor: '#e8edf2', borderRadius: 1, mb: 0.75 }}>
                                    {['Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền', ''].map(h => (
                                        <Typography key={h} variant="caption" fontWeight={700} color="#64748b" fontSize={10.5} letterSpacing={0.2}>{h}</Typography>
                                    ))}
                                </Box>
                                {activeOrder.items.map((item, idx) => (
                                    <Box key={item.productId} sx={{
                                        display: 'grid', gridTemplateColumns: '2.5fr 90px 90px 95px 28px', gap: 1, px: 1.25, py: 1,
                                        bgcolor: idx % 2 === 0 ? '#fff' : '#f8fafc', borderRadius: 1, mb: 0.5,
                                        border: '1px solid #e8edf2', alignItems: 'center',
                                        '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff', '& .del-btn': { opacity: 1 } }, transition: 'all 0.12s',
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                            {item.imageUrl
                                                ? <Box component="img" src={item.imageUrl} alt={item.productName} sx={{ width: 34, height: 46, objectFit: 'contain', borderRadius: 0.5, flexShrink: 0, border: '1px solid #e2e8f0' }} />
                                                : <Box sx={{ width: 34, height: 46, bgcolor: '#e2e8f0', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📦</Box>}
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} fontSize={12.5} noWrap color="#1e293b">{item.productName}</Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                    <Typography variant="caption" color="#94a3b8" fontSize={10}>{item.isbnBarcode}</Typography>
                                                    {item.unitPrice !== item.originalRetailPrice && (
                                                        <Chip label={item.unitPrice < item.originalRetailPrice ? '↓ Sỉ' : '✏ Sửa'} size="small"
                                                            sx={{ height: 14, fontSize: 9, bgcolor: item.unitPrice < item.originalRetailPrice ? '#f59e0b22' : '#3b82f622', color: item.unitPrice < item.originalRetailPrice ? '#f59e0b' : '#3b82f6', px: 0.25 }} />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 1, overflow: 'hidden', width: 'fit-content', bgcolor: '#fff' }}>
                                            <Box onClick={() => updateQty(item.productId, item.quantity - 1)} sx={{ px: 0.75, py: 0.25, cursor: 'pointer', color: '#64748b', fontSize: 16, lineHeight: 1.2, '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' }, userSelect: 'none' }}>−</Box>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val)) updateQty(item.productId, val);
                                                    else if (e.target.value === '') updateQty(item.productId, 0); // Allow clearing to delete or reset
                                                }}
                                                onFocus={e => e.target.select()}
                                                sx={{
                                                    width: 40,
                                                    '& .MuiOutlinedInput-root': {
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: '#1e293b',
                                                        '& fieldset': { border: 'none' },
                                                        '& input': { textAlign: 'center', py: 0.25, px: 0, '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { display: 'none' } }
                                                    }
                                                }}
                                            />
                                            <Box onClick={() => updateQty(item.productId, item.quantity + 1)} sx={{ px: 0.75, py: 0.25, cursor: 'pointer', color: '#64748b', fontSize: 16, lineHeight: 1.2, '&:hover': { bgcolor: '#dcfce7', color: '#22c55e' }, userSelect: 'none' }}>+</Box>
                                        </Box>
                                        <Box>
                                            {editingPriceId === item.productId ? (
                                                <TextField inputRef={priceInputRef} size="small" type="number" value={editingPriceVal}
                                                    onChange={e => setEditingPriceVal(e.target.value)}
                                                    onBlur={() => confirmEditPrice(item.productId)}
                                                    onKeyDown={e => { if (e.key === 'Enter') confirmEditPrice(item.productId); if (e.key === 'Escape') setEditingPriceId(null); }}
                                                    sx={{ width: 86, '& .MuiOutlinedInput-root': { fontSize: 12, fontWeight: 700, color: '#1d4ed8', '& fieldset': { borderColor: '#3b82f6' } }, '& input': { py: '3px', px: '6px' } }} />
                                            ) : (
                                                <Tooltip title="Bấm để chỉnh sửa giá">
                                                    <Typography variant="body2" fontSize={12} color="#475569" onClick={() => startEditPrice(item.productId, item.unitPrice)}
                                                        sx={{ cursor: 'pointer', borderBottom: '1px dashed #cbd5e1', display: 'inline-block', '&:hover': { color: '#3b82f6', borderColor: '#3b82f6' } }}>
                                                        {fmt(item.unitPrice)}
                                                    </Typography>
                                                </Tooltip>
                                            )}
                                        </Box>
                                        <Typography variant="body2" fontWeight={700} fontSize={12.5} color="#1d4ed8">{fmt(item.subtotal)}</Typography>
                                        <Box onClick={() => removeItem(item.productId)} className="del-btn" sx={{ opacity: 0, cursor: 'pointer', color: '#cbd5e1', '&:hover': { color: '#ef4444' }, transition: 'all 0.12s', display: 'flex' }}>
                                            <Delete sx={{ fontSize: 15 }} />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ borderTop: '1px solid #e2e8f0', bgcolor: '#fff', p: 1 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.75 }}>
                            {[
                                { key: 'hold', label: 'Giữ tạm', icon: '⏸', short: 'F2', disabled: activeOrder.items.length === 0 },
                                { key: 'recall', label: 'Gọi lại', icon: '▶', short: 'F5', badge: heldOrders.length },
                                { key: 'discount', label: 'Chiết khấu', icon: '💸', short: 'F6', disabled: activeOrder.items.length === 0 },
                                { key: 'promo', label: 'Khuyến mãi', icon: '🎁', short: 'F8', badge: activeOrder.couponCode ? 1 : 0 },
                                { key: 'history', label: 'Hóa đơn', icon: '🧾', short: 'F9' },
                                { key: 'revenue', label: 'Doanh thu', icon: '📊', short: 'F10' },
                            ].map(action => (
                                <Badge key={action.key} badgeContent={(action as any).badge || 0} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16 } }}>
                                    <Button fullWidth size="small" disabled={(action as any).disabled}
                                        onClick={() => {
                                            if (action.key === 'hold') holdCurrentCart();
                                            if (action.key === 'recall') setHeldOpen(true);
                                            if (action.key === 'discount') setDiscountOpen(true);
                                            if (action.key === 'promo') setPromotionOpen(true);
                                            if (action.key === 'history') setInvoiceHistoryOpen(true);
                                            if (action.key === 'revenue') setRevenueOpen(true);
                                        }}
                                        sx={{
                                            textTransform: 'none', fontSize: 11.5, fontWeight: 600, borderColor: '#e8edf2', color: '#374151',
                                            py: 0.75, px: 1, borderRadius: 1.5, border: '1px solid #e8edf2', justifyContent: 'flex-start', gap: 0.5,
                                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#2563eb', color: '#1d4ed8' },
                                            '&.Mui-disabled': { opacity: 0.4 },
                                        }}>
                                        <Typography fontSize={14}>{action.icon}</Typography>
                                        <Box>
                                            <Typography fontSize={11.5} noWrap display="block">{action.label}</Typography>
                                            <Typography fontSize={9.5} color="#94a3b8">{action.short}</Typography>
                                        </Box>
                                    </Button>
                                </Badge>
                            ))}
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ width: 300, bgcolor: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, minHeight: 0 }}>
                    <Box sx={{ p: 1.5, borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="#64748b" fontSize={10.5} letterSpacing={0.4}>KHÁCH HÀNG</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <Typography variant="caption" color="#94a3b8" fontSize={9.5}>F4 để tìm</Typography>
                                <Tooltip title="Thêm khách hàng mới">
                                    <IconButton size="small" onClick={() => setQuickCreateOpen(true)}
                                        sx={{ p: 0.4, color: '#2563eb', bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 1, '&:hover': { bgcolor: '#dbeafe', borderColor: '#93c5fd' } }}>
                                        <PersonAdd sx={{ fontSize: 13 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <InlineCustomerSearch
                            customer={activeOrder.customer}
                            onSelect={c => updateOrder(o => ({ ...o, customer: c, pointsToUse: 0 }))}
                            inputRef={customerInputRef}
                        />
                        {activeOrder.customer && (activeOrder.customer.loyaltyPoints ?? 0) >= 500 && (
                            <Box sx={{ mt: 1.25 }}>
                                <Typography variant="caption" color="#64748b" fontWeight={600} display="block" mb={0.5} fontSize={11}>
                                    Quy đổi điểm (1đ = 100₫)
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={activeOrder.pointsToUse}
                                        onChange={e => updateOrder(o => ({ ...o, pointsToUse: Number(e.target.value) }))}
                                        sx={{ fontSize: 12, '& .MuiSelect-select': { py: '6px' } }}
                                    >
                                        <MenuItem value={0} sx={{ fontSize: 12 }}>Không dùng điểm</MenuItem>
                                        {[500, 1000, 1500, 2000]
                                            .filter(p => p <= (activeOrder.customer?.loyaltyPoints ?? 0))
                                            .map(p => (
                                                <MenuItem key={p} value={p} sx={{ fontSize: 12 }}>
                                                    {p} điểm → -{fmt(p * 100)}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ p: 1.5, flex: 1, overflowY: 'auto', minHeight: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography variant="body2" color="#64748b" fontSize={12}>Tổng tiền ({activeOrder.items.length} sp)</Typography>
                            <Typography variant="body2" fontWeight={600} fontSize={12} color="#1e293b">{fmt(totalAmount)}</Typography>
                        </Box>
                        {activeOrder.isWholesale && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="body2" color="#f59e0b" fontSize={12}>🏷 Giá sỉ</Typography>
                                <Typography variant="caption" color="#f59e0b" fontSize={10.5}>Đang áp dụng</Typography>
                            </Box>
                        )}
                        {orderDiscountAmt > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Button size="small" startIcon={<LocalOffer sx={{ fontSize: 11 }} />} onClick={() => setDiscountOpen(true)}
                                    sx={{ textTransform: 'none', fontSize: 11, color: '#f59e0b', py: 0, px: 0.5, '&:hover': { bgcolor: '#fef3c7' } }}>
                                    Chiết khấu {activeOrder.orderDiscount > 0 ? `${activeOrder.orderDiscount}%` : ''}
                                </Button>
                                <Typography variant="body2" color="#f59e0b" fontWeight={700} fontSize={12}>-{fmt(orderDiscountAmt)}</Typography>
                            </Box>
                        )}
                        {couponDiscountAmt > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="body2" color="#a855f7" fontSize={12}>🎁 Mã: {activeOrder.couponCode}</Typography>
                                <Typography variant="body2" color="#a855f7" fontWeight={700} fontSize={12}>-{fmt(couponDiscountAmt)}</Typography>
                            </Box>
                        )}
                        {activeOrder.pointsToUse > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="body2" color="#06b6d4" fontSize={12}>⭐ Điểm ({activeOrder.pointsToUse})</Typography>
                                <Typography variant="body2" color="#06b6d4" fontWeight={700} fontSize={12}>-{fmt(pointsDiscount)}</Typography>
                            </Box>
                        )}

                        {/* Khuyến mãi inline */}
                        <Box sx={{ mt: 1, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="caption" fontWeight={700} color="#a855f7" fontSize={10.5}>MÃ KHUYẾN MÃI (F8)</Typography>
                                {activeOrder.couponCode && (
                                    <Typography variant="caption" color="#94a3b8" sx={{ cursor: 'pointer', '&:hover': { color: '#ef4444' } }}
                                        onClick={() => updateOrder(o => ({ ...o, couponCode: '', couponDiscount: 0 }))}>
                                        Bỏ áp dụng
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <TextField
                                    fullWidth size="small"
                                    inputRef={promoInputRef}
                                    placeholder="Nhập mã KM..."
                                    value={activeOrder.couponCode}
                                    onChange={e => updateOrder(o => ({ ...o, couponCode: e.target.value.toUpperCase() }))}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && activeOrder.couponCode) {
                                            setPromotionOpen(true);
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: <LocalOffer sx={{ fontSize: 16, color: '#a855f7', mr: 1 }} />,
                                        sx: { borderRadius: 1.5, fontSize: 12, bgcolor: '#faf5ff', '& fieldset': { borderColor: '#e9d5ff' } }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={() => setPromotionOpen(true)}
                                    sx={{ minWidth: '40px', px: 1, bgcolor: '#a855f7', '&:hover': { bgcolor: '#9333ea' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                                >
                                    Áp
                                </Button>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="body2" fontWeight={800} fontSize={14}>Tổng thanh toán</Typography>
                            <Typography variant="h5" fontWeight={900} color="#1d4ed8" fontSize={22}>{fmt(finalAmount)}</Typography>
                        </Box>

                        <Typography variant="caption" color="#64748b" display="block" mb={0.5}>ⓘ Hình thức thanh toán</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                            {[
                                { id: 'CASH', label: 'Tiền mặt' },
                                { id: 'BANK_TRANSFER', label: 'Chuyển khoản' },
                                { id: 'CARD', label: 'Thẻ' },
                                { id: 'E_WALLET', label: 'Ví điện tử' }
                            ].map(method => (
                                <FormControlLabel
                                    key={method.id}
                                    control={<Checkbox size="small" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id as any)} />}
                                    label={<Typography fontSize={12}>{method.label}</Typography>}
                                    sx={{ m: 0, '& .MuiCheckbox-root': { p: 0.5 } }}
                                />
                            ))}
                        </Box>

                        <Typography variant="caption" color="#64748b" display="block" mb={0.5}>Tiền khách đưa</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={customerGivenAmount}
                            onChange={(e) => setCustomerGivenAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder={finalAmount.toString()}
                            sx={{ mb: 1, '& input': { fontSize: 13, fontWeight: 700 } }}
                            InputProps={{ endAdornment: <Typography fontSize={13} color="#94a3b8">₫</Typography> }}
                        />

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                            {[finalAmount, Math.ceil(finalAmount / 50000) * 50000, Math.ceil(finalAmount / 100000) * 100000, 500000, 1000000]
                                .filter((v, i, a) => a.indexOf(v) === i && v >= finalAmount)
                                .slice(0, 5)
                                .map(amt => (
                                    <Chip
                                        key={amt}
                                        label={fmt(amt)}
                                        size="small"
                                        onClick={() => setCustomerGivenAmount(amt)}
                                        sx={{ fontSize: 11, bgcolor: '#f1f5f9', color: '#475569', '&:hover': { bgcolor: '#e2e8f0' }, cursor: 'pointer' }}
                                    />
                                ))}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" color="#64748b" fontSize={13}>Tiền thừa</Typography>
                            <Typography variant="body2" fontWeight={700} color="#10b981" fontSize={14}>
                                {fmt(Math.max(0, (Number(customerGivenAmount) || finalAmount) - finalAmount))}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ p: 1.25, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 0.75, flexShrink: 0 }}>
                        <Button fullWidth variant="contained" size="large"
                            disabled={activeOrder.items.length === 0 || !shift || checkoutLoading}
                            onClick={handleCheckout}
                            sx={{ py: 1.25, bgcolor: '#1d4ed8', fontWeight: 800, fontSize: 13.5, textTransform: 'none', borderRadius: 1.5, boxShadow: '0 4px 12px rgba(29,78,216,0.35)', '&:hover': { bgcolor: '#1e40af' }, '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' } }}>
                            {checkoutLoading ? <CircularProgress size={20} color="inherit" /> : 'Hoàn tất thanh toán (F1)'}
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, px: 0.5 }}>
                            <FormControlLabel
                                control={<Switch size="small" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} />}
                                label={<Typography fontSize={11} color="#64748b">In tự động</Typography>}
                                sx={{ m: 0 }}
                            />
                            {shift && (
                                <Typography variant="caption" color="#94a3b8" fontSize={10}>Tiền đầu ca: {fmt(shift.startingCash)}</Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <QuickCreateCustomerDialog
                open={quickCreateOpen}
                onClose={() => setQuickCreateOpen(false)}
                onCreated={c => {
                    updateOrder(o => ({ ...o, customer: c }));
                    setSnack({ msg: `✅ Đã tạo và chọn khách "${c.fullName}"`, sev: 'success' });
                }}
            />
            <POSHeldOrdersDialog
                open={heldOpen}
                heldOrders={heldOrders}
                onClose={() => setHeldOpen(false)}
                onRecall={recallHeldOrder}
                onDelete={deleteHeldOrder}
            />
            <OrderDiscountDialog
                open={discountOpen}
                totalAmount={totalAmount}
                discount={activeOrder.orderDiscount}
                discountAmt={activeOrder.orderDiscountAmt}
                onClose={() => setDiscountOpen(false)}
                onApply={(pct, amt) => updateOrder(o => ({ ...o, orderDiscount: pct, orderDiscountAmt: amt }))}
            />
            <PromotionDialog
                open={promotionOpen}
                totalAmount={totalAmount}
                appliedCode={activeOrder.couponCode}
                scannedCode={scannedCouponCode}
                onClose={() => { setPromotionOpen(false); setScannedCouponCode(undefined); }}
                onApply={(code, discount) => {
                    updateOrder(o => ({ ...o, couponCode: code, couponDiscount: discount }));
                    setSnack({ msg: `🎁 Áp dụng mã "${code}" - Giảm ${fmt(discount)}`, sev: 'success' });
                }}
                onRemove={() => updateOrder(o => ({ ...o, couponCode: '', couponDiscount: 0 }))}
            />
            <POSInvoiceHistoryDialog
                open={invoiceHistoryOpen}
                onClose={() => setInvoiceHistoryOpen(false)}
                onRefundRequest={(code) => {
                    setInvoiceHistoryOpen(false);
                    setRefundInitialCode(code);
                    setRefundOpen(true);
                }}
            />
            <PrintInvoiceDialog
                open={printDialogOpen}
                onClose={() => { setPrintDialogOpen(false); setPrintInvoice(null); }}
                invoice={printInvoice}
                cashierDisplayName={currentUser?.fullName}
            />
            <RefundDialog
                open={refundOpen}
                onClose={() => { setRefundOpen(false); setRefundInitialCode(undefined); }}
                shiftId={shift?.id ?? null}
                initialInvoiceCode={refundInitialCode}
                onRefundSuccess={(inv) => {
                    setSnack({ msg: `✅ Trả hàng thành công! Mã: ${inv?.code || ''}`, sev: 'success' });
                    if (inv) {
                        setPrintInvoice({ ...inv, type: 'RETURN' });
                        setPrintDialogOpen(true);
                    }
                }}
            />
            <RevenueReportDialog
                open={revenueOpen}
                onClose={() => setRevenueOpen(false)}
                warehouseId={currentUser?.warehouseId}
            />

            <Snackbar
                open={!!snack}
                autoHideDuration={snack?.sev === 'error' ? 6000 : 3000}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {snack ? (
                    <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2, fontWeight: 600, fontSize: 13 }}>
                        {snack.msg}
                    </Alert>
                ) : <div />}
            </Snackbar>
        </Box>
    );
};

export default EmployeePOSPage;