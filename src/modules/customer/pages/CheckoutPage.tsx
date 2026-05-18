// src/modules/customer/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Paper, Button, TextField,
    Divider, FormControl, InputLabel, Select, MenuItem, Alert,
    CircularProgress, Radio, RadioGroup, Collapse,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    ArrowBack, ShoppingCart, LocalShipping, Security,
    ExpandMore, ExpandLess, CheckCircleOutline, Lock
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
            <Box sx={{ bgcolor: '#fafafb', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
                <Container maxWidth="sm" sx={{ textAlign: 'center', py: 6 }}>
                    <Typography fontSize={80} mb={3}>🛒</Typography>
                    <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 850, mb: 1.5, color: '#1a1a2e' }}>Giỏ hàng trống</Typography>
                    <Typography color="text.secondary" mb={4}>
                        Bạn chưa có sản phẩm nào trong giỏ hàng để tiếp tục thanh toán.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/shop')}
                        startIcon={<ArrowBack />}
                        sx={{
                            bgcolor: '#1a1a2e',
                            color: '#ffffff',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '10px',
                            px: 4,
                            py: 1.5,
                            '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' },
                        }}
                    >
                        Quay lại Trang chủ
                    </Button>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#fafafb', minHeight: '100vh', pb: 6 }}>
            {/* Compact Header */}
            <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #eef0f2', py: 2 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                            onClick={() => navigate('/cart')}
                            sx={{ color: '#1a1a2e', textTransform: 'none', fontWeight: 600, fontSize: 13, '&:hover': { color: '#f5a623' } }}
                        >
                            Quay lại giỏ hàng
                        </Button>
                        <Divider orientation="vertical" flexItem sx={{ borderColor: '#eef0f2' }} />
                        <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, color: '#1a1a2e' }}>
                            Thông tin thanh toán
                        </Typography>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {createOrder.isError && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, borderRadius: '8px' }}
                    >
                        Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin giao nhận và thử lại.
                    </Alert>
                )}

                <Grid container spacing={4}>
                    {/* ── LEFT: Delivery Form & Payment ── */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        {/* Shipping Info */}
                        <Paper
                            elevation={0}
                            sx={{ borderRadius: '12px', p: 3, mb: 3, border: '1px solid #eef0f2', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
                                <LocalShipping sx={{ color: '#1a1a2e', fontSize: 22 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                                    Thông tin giao nhận hàng
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Họ và tên người nhận *"
                                        size="medium"
                                        value={form.shippingName}
                                        onChange={handleTextChange('shippingName')}
                                        error={!!errors.shippingName}
                                        helperText={errors.shippingName}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#1a1a2e' },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Số điện thoại *"
                                        size="medium"
                                        value={form.shippingPhone}
                                        onChange={handleTextChange('shippingPhone')}
                                        error={!!errors.shippingPhone}
                                        helperText={errors.shippingPhone}
                                        inputProps={{ inputMode: 'tel' }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#1a1a2e' },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Địa chỉ nhận hàng chi tiết *"
                                        size="medium"
                                        value={form.shippingAddress}
                                        onChange={handleTextChange('shippingAddress')}
                                        error={!!errors.shippingAddress}
                                        helperText={errors.shippingAddress}
                                        placeholder="Số nhà, tên đường, phường/xã..."
                                        sx={{
                                            '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#1a1a2e' },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel sx={{ '&.Mui-focused': { color: '#1a1a2e' } }}>Tỉnh / Thành phố</InputLabel>
                                        <Select
                                            value={form.provinceCode}
                                            onChange={handleSelectChange('provinceCode')}
                                            label="Tỉnh / Thành phố"
                                            sx={{
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
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
                                        size="medium"
                                        multiline
                                        rows={3}
                                        value={form.note}
                                        onChange={handleTextChange('note')}
                                        placeholder="Ghi chú thêm cho người giao hàng (nếu có)..."
                                        sx={{
                                            '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#1a1a2e' },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Payment Methods */}
                        <Paper
                            elevation={0}
                            sx={{ borderRadius: '12px', p: 3, border: '1px solid #eef0f2', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
                                <Security sx={{ color: '#1a1a2e', fontSize: 22 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
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
                                            gap: 2,
                                            p: 2,
                                            mb: 1.5,
                                            borderRadius: '8px',
                                            border: form.paymentMethod === opt.value
                                                ? '2px solid #f5a623'
                                                : '1px solid #eef0f2',
                                            bgcolor: form.paymentMethod === opt.value ? 'rgba(245, 166, 35, 0.05)' : '#ffffff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': { borderColor: '#f5a623', bgcolor: 'rgba(245, 166, 35, 0.03)' },
                                        }}
                                    >
                                        <Radio
                                            value={opt.value}
                                            size="medium"
                                            sx={{ '&.Mui-checked': { color: '#f5a623' }, p: 0 }}
                                        />
                                        <Typography fontSize={24}>{opt.icon}</Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                                {opt.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {opt.desc}
                                            </Typography>
                                        </Box>
                                        {form.paymentMethod === opt.value && (
                                            <CheckCircleOutline sx={{ color: '#f5a623', fontSize: 22 }} />
                                        )}
                                    </Box>
                                ))}
                            </RadioGroup>
                        </Paper>
                    </Grid>

                    {/* ── RIGHT: Summary Box ── */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: '12px',
                                border: '1px solid #eef0f2',
                                position: 'sticky',
                                top: 100,
                                overflow: 'hidden',
                                boxShadow: '0 8px 30px rgba(26,26,46,0.04)'
                            }}
                        >
                            {/* Order summary header */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 3,
                                    py: 2.2,
                                    bgcolor: '#f8f9fa',
                                    borderBottom: '1px solid #eef0f2',
                                    cursor: { xs: 'pointer', md: 'default' },
                                }}
                                onClick={() => setOrderSummaryOpen(v => !v)}
                            >
                                <Typography variant="subtitle1" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, color: '#1a1a2e' }}>
                                    Đơn hàng của bạn ({totalItems} sản phẩm)
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
                            <Box sx={{ px: 3, py: 3 }}>
                                <Box sx={{
                                    p: 1.8,
                                    borderRadius: '8px',
                                    mb: 2.5,
                                    bgcolor: shipFee === 0 ? 'rgba(46, 125, 50, 0.06)' : 'rgba(245, 166, 35, 0.08)',
                                    display: 'flex',
                                    gap: 1.2,
                                    alignItems: 'center',
                                }}>
                                    <LocalShipping sx={{
                                        fontSize: 18,
                                        color: shipFee === 0 ? '#2e7d32' : '#db941e',
                                    }} />
                                    <Typography
                                        variant="caption"
                                        color={shipFee === 0 ? '#2e7d32' : '#db941e'}
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {shipFee === 0
                                            ? 'Ưu đãi: Miễn phí giao hàng toàn quốc!'
                                            : `Mua thêm ${fmt(FREE_SHIP - totalPrice)} để được freeship`}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary">Tạm tính</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a2e' }}>{fmt(totalPrice)}</Typography>
                                </Box>
                                
                                {discountAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Typography variant="body2" color="text.secondary">Mã giảm giá ({appliedPromotion?.code})</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff4d4f' }}>-{fmt(discountAmount)}</Typography>
                                    </Box>
                                )}
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 700, color: shipFee === 0 ? '#2e7d32' : '#1a1a2e' }}
                                    >
                                        {shipFee === 0 ? 'Miễn phí' : fmt(shipFee)}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2.5, borderColor: '#eef0f2' }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3.5 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>Tổng cộng</Typography>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a1a2e', lineHeight: 1.1 }}>
                                            {fmt(finalPrice)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                            Đã bao gồm VAT & phí dịch vụ
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
                                        bgcolor: '#1a1a2e',
                                        color: '#ffffff',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        py: 1.8,
                                        fontSize: '0.95rem',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(26,26,46,0.15)',
                                        '&:hover': { bgcolor: '#f5a623', color: '#1a1a2e' },
                                        '&:disabled': { bgcolor: '#f0f0f2', color: '#bbb' },
                                    }}
                                >
                                    {createOrder.isPending ? 'Đang xử lý đặt hàng...' : 'Xác nhận Đặt hàng'}
                                </Button>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.8,
                                    mt: 2,
                                }}>
                                    <Lock sx={{ fontSize: 14, color: '#8c9ba5' }} />
                                    <Typography variant="caption" sx={{ color: '#8c9ba5', fontWeight: 500 }}>
                                        Mọi giao dịch được mã hóa bảo mật tuyệt đối
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
                        mb: 2,
                        pb: 2,
                        borderBottom: '1px solid #eef0f2',
                        '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' },
                    }}
                >
                    <Box sx={{
                        width: 52,
                        height: 68,
                        bgcolor: '#ffffff',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid #eef0f2',
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
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.4,
                                mb: 0.5,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#1a1a2e'
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Số lượng: {item.qty}
                        </Typography>
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{ flexShrink: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1a1a2e' }}
                    >
                        {fmt(item.price * item.qty)}
                    </Typography>
                </Box>
            );
        })}
    </Box>
);

export default CheckoutPage;