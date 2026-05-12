// src/modules/customer/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Paper, Button, TextField,
    Divider, FormControl, InputLabel, Select, MenuItem, Alert,
    CircularProgress, Radio, RadioGroup, FormControlLabel, Chip,
    Collapse,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    ArrowBack, ShoppingCart, LocalShipping, Security,
    ExpandMore, ExpandLess, CheckCircleOutline,
} from '@mui/icons-material';
import { useCartContext } from '../../../store/CartContext';
import { useCreateOrder } from '../hooks/useOrders';
import { useCurrentUser } from '../hooks/useAccount';
import { fmt } from '../../../utils/constants';

const FREE_SHIP = 150000;

const PROVINCES = [
    { code: 'HCM', label: 'TP. Hồ Chí Minh' },
    { code: 'HN', label: 'Hà Nội' },
    { code: 'DN', label: 'Đà Nẵng' },
    { code: 'HP', label: 'Hải Phòng' },
    { code: 'CT', label: 'Cần Thơ' },
    { code: 'BD', label: 'Bình Dương' },
    { code: 'OTHER', label: 'Tỉnh / Thành phố khác' },
];

interface CheckoutFormData {
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    provinceCode: string;
    paymentMethod: string;
    note: string;
}

// Unified cart item type that matches what CartContext provides
interface CartItemType {
    id: string;
    title?: string;
    name?: string;
    img?: string;
    images?: string[];
    qty: number;
    price: number;
    stock?: number;
    author?: string;
}

const PAYMENT_OPTIONS = [
    {
        value: 'COD',
        label: 'Thanh toán khi nhận hàng',
        desc: 'Trả tiền mặt khi nhận hàng (COD)',
        icon: '💵',
    },
    {
        value: 'BANK_TRANSFER',
        label: 'Chuyển khoản ngân hàng',
        desc: 'Chuyển khoản qua Internet Banking / ATM',
        icon: '🏦',
    },
    {
        value: 'MOMO',
        label: 'Ví MoMo',
        desc: 'Thanh toán qua ứng dụng MoMo',
        icon: '📱',
    },
];

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    // Cast items to our unified type to avoid CartItem type conflicts
    const { items: rawItems, totalPrice, totalItems, clearCart, appliedPromotion } = useCartContext();
    const items = rawItems as unknown as CartItemType[];
    const { user } = useCurrentUser();
    const createOrder = useCreateOrder();
    const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);

    const [form, setForm] = useState<CheckoutFormData>({
        shippingName: '',
        shippingPhone: '',
        shippingAddress: '',
        provinceCode: 'HCM',
        paymentMethod: 'COD',
        note: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Prefill form with user data when available
    useEffect(() => {
        if (user) {
            setForm(f => ({
                ...f,
                shippingName: f.shippingName || user.fullName || '',
                shippingPhone: f.shippingPhone || user.phone || '',
            }));
        }
    }, [user]);

    const calcDiscount = () => {
        if (!appliedPromotion) return 0;
        if (appliedPromotion.type === 'FIXED_AMOUNT') {
            return Math.min(appliedPromotion.discountValue, totalPrice);
        }
        if (appliedPromotion.type === 'PERCENTAGE') {
            let d = (totalPrice * appliedPromotion.discountValue) / 100;
            if (appliedPromotion.maxDiscountAmount) d = Math.min(d, appliedPromotion.maxDiscountAmount);
            return Math.round(d);
        }
        return 0;
    };

    const discountAmount = calcDiscount();
    const shipFee = totalPrice >= FREE_SHIP ? 0 : 30000;
    const finalPrice = totalPrice - discountAmount + shipFee;

    const handleTextChange = (field: keyof CheckoutFormData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm(f => ({ ...f, [field]: e.target.value }));
            if (errors[field]) setErrors(err => ({ ...err, [field]: '' }));
        };

    const handleSelectChange = (field: keyof CheckoutFormData) =>
        (e: SelectChangeEvent) => {
            setForm(f => ({ ...f, [field]: e.target.value }));
        };

    const handleRadioChange = (_e: React.ChangeEvent<HTMLInputElement>, value: string) => {
        setForm(f => ({ ...f, paymentMethod: value }));
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.shippingName.trim()) errs.shippingName = 'Vui lòng nhập họ và tên';
        if (!form.shippingPhone.trim()) errs.shippingPhone = 'Vui lòng nhập số điện thoại';
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.shippingPhone.replace(/\s/g, '')))
            errs.shippingPhone = 'Số điện thoại không hợp lệ';
        if (!form.shippingAddress.trim()) errs.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!validate()) return;
        try {
            const orderData = {
                customerId: user?.id ?? '',
                shippingName: form.shippingName.trim(),
                shippingPhone: form.shippingPhone.trim(),
                shippingAddress: form.shippingAddress.trim(),
                provinceCode: form.provinceCode,
                paymentMethod: form.paymentMethod,
                note: form.note.trim(),
                items: items.map((item: CartItemType) => ({
                    productId: item.id,
                    quantity: item.qty,
                })),
                couponCode: appliedPromotion?.code,
                discountAmount: discountAmount,
            };
            const result = await createOrder.mutateAsync(orderData);
            clearCart();
            navigate('/order-success', { state: { order: result } });
        } catch {
            // Error handled by mutation's isError state
        }
    };

    if (items.length === 0) {
        return (
            <Box sx={{ bgcolor: '#f7f7f8', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
                <Container maxWidth="sm" sx={{ textAlign: 'center', py: 6 }}>
                    <Typography fontSize={72} mb={2}>🛒</Typography>
                    <Typography variant="h5" fontWeight={700} mb={1}>Giỏ hàng trống</Typography>
                    <Typography color="text.secondary" mb={4}>
                        Bạn chưa có sản phẩm nào trong giỏ hàng
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/shop')}
                        startIcon={<ArrowBack />}
                        sx={{
                            bgcolor: '#d32f2f',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 4,
                            '&:hover': { bgcolor: '#b71c1c' },
                        }}
                    >
                        Tiếp tục mua sắm
                    </Button>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f7f7f8', minHeight: '100vh' }}>
            {/* Compact top bar */}
            <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #f0f0f0', py: 1.5 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                            onClick={() => navigate('/cart')}
                            sx={{ color: '#666', textTransform: 'none', fontWeight: 500, fontSize: 13 }}
                        >
                            Quay lại giỏ hàng
                        </Button>
                        <Divider orientation="vertical" flexItem />
                        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.3px' }}>
                            Thanh toán
                        </Typography>
                        <Chip
                            label={`${totalItems} sản phẩm`}
                            size="small"
                            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700, ml: 'auto' }}
                        />
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {createOrder.isError && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2.5, borderRadius: 2 }}
                        onClose={() => { }}
                    >
                        Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin và thử lại.
                    </Alert>
                )}

                {/* MUI v6 Grid2 — use "size" prop instead of "item xs md" */}
                <Grid container spacing={3}>
                    {/* ── LEFT: Form ── */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        {/* Shipping Info */}
                        <Paper
                            elevation={0}
                            sx={{ borderRadius: 3, p: 3, mb: 2.5, border: '1px solid #f0f0f0' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                                <LocalShipping sx={{ color: '#d32f2f', fontSize: 22 }} />
                                <Typography variant="h6" fontWeight={700}>
                                    Thông tin giao hàng
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Họ và tên *"
                                        size="small"
                                        value={form.shippingName}
                                        onChange={handleTextChange('shippingName')}
                                        error={!!errors.shippingName}
                                        helperText={errors.shippingName}
                                        sx={{
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#d32f2f',
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#d32f2f' },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Số điện thoại *"
                                        size="small"
                                        value={form.shippingPhone}
                                        onChange={handleTextChange('shippingPhone')}
                                        error={!!errors.shippingPhone}
                                        helperText={errors.shippingPhone}
                                        inputProps={{ inputMode: 'tel' }}
                                        sx={{
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#d32f2f',
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#d32f2f' },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Địa chỉ giao hàng *"
                                        size="small"
                                        value={form.shippingAddress}
                                        onChange={handleTextChange('shippingAddress')}
                                        error={!!errors.shippingAddress}
                                        helperText={errors.shippingAddress}
                                        placeholder="Số nhà, tên đường, phường/xã..."
                                        sx={{
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#d32f2f',
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#d32f2f' },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Tỉnh / Thành phố</InputLabel>
                                        <Select
                                            value={form.provinceCode}
                                            onChange={handleSelectChange('provinceCode')}
                                            label="Tỉnh / Thành phố"
                                            sx={{
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#d32f2f',
                                                },
                                            }}
                                        >
                                            {PROVINCES.map(p => (
                                                <MenuItem key={p.code} value={p.code}>
                                                    {p.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Ghi chú đơn hàng"
                                        size="small"
                                        multiline
                                        rows={2}
                                        value={form.note}
                                        onChange={handleTextChange('note')}
                                        placeholder="Ghi chú thêm cho người giao hàng..."
                                        sx={{
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#d32f2f',
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#d32f2f' },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Payment Methods */}
                        <Paper
                            elevation={0}
                            sx={{ borderRadius: 3, p: 3, border: '1px solid #f0f0f0' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                                <Security sx={{ color: '#d32f2f', fontSize: 22 }} />
                                <Typography variant="h6" fontWeight={700}>
                                    Phương thức thanh toán
                                </Typography>
                            </Box>

                            <RadioGroup value={form.paymentMethod} onChange={handleRadioChange}>
                                {PAYMENT_OPTIONS.map(opt => (
                                    <Box
                                        key={opt.value}
                                        onClick={() => setForm(f => ({ ...f, paymentMethod: opt.value }))}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1.5,
                                            mb: 1,
                                            borderRadius: 2,
                                            border: form.paymentMethod === opt.value
                                                ? '1.5px solid #d32f2f'
                                                : '1.5px solid #e0e0e0',
                                            bgcolor: form.paymentMethod === opt.value ? '#ffebee' : '#fff',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff5f5' },
                                        }}
                                    >
                                        <Radio
                                            value={opt.value}
                                            size="small"
                                            sx={{ '&.Mui-checked': { color: '#d32f2f' }, p: 0 }}
                                        />
                                        <Typography fontSize={22}>{opt.icon}</Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {opt.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {opt.desc}
                                            </Typography>
                                        </Box>
                                        {form.paymentMethod === opt.value && (
                                            <CheckCircleOutline sx={{ color: '#d32f2f', fontSize: 20 }} />
                                        )}
                                    </Box>
                                ))}
                            </RadioGroup>
                        </Paper>
                    </Grid>

                    {/* ── RIGHT: Summary ── */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: '1px solid #f0f0f0',
                                position: 'sticky',
                                top: 80,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Order items header (collapsible on mobile) */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 3,
                                    py: 2,
                                    bgcolor: '#fafafa',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: { xs: 'pointer', md: 'default' },
                                }}
                                onClick={() => setOrderSummaryOpen(v => !v)}
                            >
                                <Typography variant="h6" fontWeight={800}>
                                    Đơn hàng ({totalItems} sản phẩm)
                                </Typography>
                                <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                                    {orderSummaryOpen ? <ExpandLess /> : <ExpandMore />}
                                </Box>
                            </Box>

                            {/* Items list */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                <OrderItemsList items={items} />
                            </Box>
                            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                <Collapse in={orderSummaryOpen}>
                                    <OrderItemsList items={items} />
                                </Collapse>
                            </Box>

                            {/* Price breakdown */}
                            <Box sx={{ px: 3, py: 2.5 }}>
                                {/* Free ship notice */}
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    mb: 2,
                                    bgcolor: shipFee === 0 ? '#e8f5e9' : '#fff8e1',
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'center',
                                }}>
                                    <LocalShipping sx={{
                                        fontSize: 18,
                                        color: shipFee === 0 ? '#2e7d32' : '#f57c00',
                                    }} />
                                    <Typography
                                        variant="caption"
                                        color={shipFee === 0 ? '#2e7d32' : '#f57c00'}
                                        fontWeight={600}
                                    >
                                        {shipFee === 0
                                            ? '🎉 Bạn được miễn phí vận chuyển!'
                                            : `Mua thêm ${fmt(FREE_SHIP - totalPrice)} để miễn phí ship`}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Tạm tính</Typography>
                                    <Typography variant="body2" fontWeight={600}>{fmt(totalPrice)}</Typography>
                                </Box>
                                {discountAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="#d32f2f">Giảm giá ({appliedPromotion?.code})</Typography>
                                        <Typography variant="body2" fontWeight={600} color="#d32f2f">-{fmt(discountAmount)}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color={shipFee === 0 ? '#2e7d32' : 'text.primary'}
                                    >
                                        {shipFee === 0 ? 'Miễn phí' : fmt(shipFee)}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 1.5 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                                    <Typography variant="body1" fontWeight={700}>Tổng cộng</Typography>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h5" fontWeight={900} color="#d32f2f" lineHeight={1}>
                                            {fmt(finalPrice)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Đã bao gồm VAT
                                        </Typography>
                                    </Box>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handleSubmit}
                                    disabled={createOrder.isPending}
                                    startIcon={
                                        createOrder.isPending
                                            ? <CircularProgress size={20} color="inherit" />
                                            : <ShoppingCart />
                                    }
                                    sx={{
                                        bgcolor: '#d32f2f',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        py: 1.6,
                                        fontSize: 15,
                                        borderRadius: 2.5,
                                        '&:hover': { bgcolor: '#b71c1c' },
                                        '&:disabled': { bgcolor: '#e57373', color: '#fff' },
                                    }}
                                >
                                    {createOrder.isPending ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                                </Button>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.5,
                                    mt: 1.5,
                                }}>
                                    <Security sx={{ fontSize: 14, color: '#999' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Thanh toán được bảo mật 100%
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

// Sub-component: order items list
const OrderItemsList: React.FC<{ items: CartItemType[] }> = ({ items }) => (
    <Box sx={{ px: 3, py: 2, maxHeight: 280, overflowY: 'auto' }}>
        {items.map((item: CartItemType) => {
            const imgSrc = item.img || item.images?.[0] || '';
            const title = item.title ?? item.name ?? '';
            return (
                <Box
                    key={item.id}
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        mb: 1.5,
                        pb: 1.5,
                        borderBottom: '1px solid #f5f5f5',
                        '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' },
                    }}
                >
                    <Box sx={{
                        width: 52,
                        height: 68,
                        bgcolor: '#f9f9f9',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {imgSrc ? (
                            <Box
                                component="img"
                                src={imgSrc}
                                alt={title}
                                sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
                                onError={(e: any) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <Typography fontSize={20}>📖</Typography>
                        )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.4,
                                mb: 0.5,
                                fontSize: 12.5,
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            x{item.qty}
                        </Typography>
                    </Box>
                    <Typography
                        variant="body2"
                        fontWeight={700}
                        color="#d32f2f"
                        sx={{ flexShrink: 0, fontSize: 13 }}
                    >
                        {fmt(item.price * item.qty)}
                    </Typography>
                </Box>
            );
        })}
    </Box>
);

export default CheckoutPage;