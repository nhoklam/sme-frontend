// src/modules/customer/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Typography, Paper, Button, TextField,
    Divider, FormControl, InputLabel, Select, MenuItem, Alert,
    CircularProgress, Radio, RadioGroup, Collapse, Dialog, DialogTitle,
    DialogContent, DialogActions, List, ListItem, ListItemText, ListItemButton, Chip, IconButton
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    ArrowBack, ShoppingCart, LocalShipping, Security,
    ExpandMore, ExpandLess, CheckCircleOutline, Lock, Close as CloseIcon, LocationOn, MonetizationOn
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useCartContext } from '../../../store/CartContext';
import { useCreateOrder } from '../hooks/useOrders';
import { useCurrentUser } from '../hooks/useAccount';
import { fmt } from '../../../utils/constants';
import orderService from '../../../services/orderService';
import { customerApi } from '../../../services/customerApi';
import { CustomerAddress } from '../../../types';
import { useShippingCoordinates } from '../../../hooks/useShippingCoordinates';

const FREE_SHIP = 150000;

interface CheckoutFormData {
    shippingName: string;
    shippingPhone: string;
    specificAddress: string;
    provinceCity: string;
    district: string;
    ward: string;
    paymentMethod: string;
    note: string;
    pointsToUse: number;
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
        value: 'VNPAY',
        label: 'Ví VNPay / Thẻ ATM',
        desc: 'Thanh toán qua ví VNPay hoặc thẻ ATM/Visa',
        icon: '💳',
    },
    {
        value: 'PAYOS',
        label: 'Chuyển khoản QR (PayOS)',
        desc: 'Thanh toán bằng mã QR chuyển khoản nhanh',
        icon: '📱',
    },
];

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { items: rawItems, totalPrice, totalItems, clearCart, appliedPromotions } = useCartContext();
    const items = rawItems as unknown as CartItemType[];
    const { user, isLoggedIn } = useCurrentUser();
    const createOrder = useCreateOrder();
    const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);

    // Location API state
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    // Address Selection State
    const [addressModalOpen, setAddressModalOpen] = useState(false);

    const [form, setForm] = useState<CheckoutFormData>({
        shippingName: '',
        shippingPhone: '',
        specificAddress: '',
        provinceCity: '',
        district: '',
        ward: '',
        paymentMethod: 'COD',
        note: '',
        pointsToUse: 0,
    });

    // Derived state for district code
    const selectedDistrict = form.district ? districts.find(d => d.name === form.district) : undefined;
    const districtCode = selectedDistrict ? String(selectedDistrict.code) : undefined;
    const coordinates = useShippingCoordinates(districtCode);

    const { data: addressData } = useQuery({
        queryKey: ['customerAddresses'],
        queryFn: () => customerApi.getAddresses(),
        enabled: isLoggedIn,
    });
    const savedAddresses = addressData?.data || [];

    const handleSelectAddress = (addr: CustomerAddress) => {
        setForm(f => ({
            ...f,
            shippingName: addr.receiverName,
            shippingPhone: addr.receiverPhone,
            provinceCity: addr.provinceCity,
            district: addr.district,
            ward: addr.ward || '',
            specificAddress: addr.specificAddress,
        }));
        setErrors({});
        setAddressModalOpen(false);
    };


    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Fetch provinces
        fetch('https://provinces.open-api.vn/api/?depth=3')
            .then(res => res.json())
            .then(data => setProvinces(data))
            .catch(err => console.error('Error fetching provinces:', err));
    }, []);

    useEffect(() => {
        if (user) {
            setForm(f => ({
                ...f,
                shippingName: f.shippingName || user.fullName || '',
                shippingPhone: f.shippingPhone || user.phone || '',
            }));
        }
    }, [user]);

    useEffect(() => {
        if (form.provinceCity) {
            const p = provinces.find(x => x.name === form.provinceCity);
            setDistricts(p ? p.districts : []);
        } else {
            setDistricts([]);
        }
    }, [form.provinceCity, provinces]);

    useEffect(() => {
        if (form.district) {
            const d = districts.find(x => x.name === form.district);
            setWards(d ? d.wards : []);
        } else {
            setWards([]);
        }
    }, [form.district, districts]);

    const rawShipFee = totalPrice >= FREE_SHIP ? 0 : 30000;

    const calcDiscount = () => {
        let orderDiscount = 0;
        let shipDiscount = 0;
        
        appliedPromotions.forEach(promo => {
            let d = 0;
            if (promo.discountAmount !== undefined) {
                d = promo.discountAmount;
            } else {
                if (promo.type === 'FIXED_AMOUNT') {
                    d = promo.discountValue;
                } else if (promo.type === 'PERCENTAGE') {
                    d = (totalPrice * promo.discountValue) / 100;
                    if (promo.maxDiscountAmount) d = Math.min(d, promo.maxDiscountAmount);
                }
                d = Math.round(d);
            }
            
            const isShipping = promo.promotionSlot === 'SHIPPING' || promo.code?.toUpperCase().includes('SHIP') || promo.code?.toUpperCase().includes('FREE');
            
            if (isShipping) {
                shipDiscount += Math.min(d, rawShipFee);
            } else {
                orderDiscount += Math.min(d, totalPrice);
            }
        });
        
        return { orderDiscount, shipDiscount };
    };

    const { orderDiscount, shipDiscount } = calcDiscount();
    const discountAmount = orderDiscount + shipDiscount;
    const finalShipFee = rawShipFee - shipDiscount;
    const pointsDiscount = form.pointsToUse * 100;
    const finalPrice = Math.max(0, totalPrice - orderDiscount + finalShipFee - pointsDiscount);

    const handleTextChange = (field: keyof CheckoutFormData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm(f => ({ ...f, [field]: e.target.value }));
            if (errors[field]) setErrors(err => ({ ...err, [field]: '' }));
        };

    const handleSelectChange = (field: keyof CheckoutFormData) =>
        (e: SelectChangeEvent) => {
            setForm(f => {
                const newForm = { ...f, [field]: e.target.value };
                if (field === 'provinceCity') {
                    newForm.district = '';
                    newForm.ward = '';
                }
                if (field === 'district') {
                    newForm.ward = '';
                }
                return newForm;
            });
            if (errors[field]) setErrors(err => ({ ...err, [field]: '' }));
        };

    const handleRadioChange = (_e: React.ChangeEvent<HTMLInputElement>, value: string) => {
        setForm(f => ({ ...f, paymentMethod: value }));
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!isLoggedIn) {
            errs.general = 'Vui lòng đăng nhập để tiến hành thanh toán trực tuyến.';
        }
        if (!form.shippingName.trim()) errs.shippingName = 'Vui lòng nhập họ và tên';
        if (!form.shippingPhone.trim()) errs.shippingPhone = 'Vui lòng nhập số điện thoại';
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.shippingPhone.replace(/\s/g, '')))
            errs.shippingPhone = 'Số điện thoại không hợp lệ';
        if (!form.provinceCity) errs.provinceCity = 'Vui lòng chọn Tỉnh/Thành phố';
        if (!form.district) errs.district = 'Vui lòng chọn Quận/Huyện';
        if (!form.specificAddress.trim()) errs.specificAddress = 'Vui lòng nhập địa chỉ cụ thể';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!validate()) return;
        try {
            const fullAddress = `${form.specificAddress.trim()}, ${form.ward ? form.ward + ', ' : ''}${form.district}, ${form.provinceCity}`;
            
            const selectedProvince = provinces.find(p => p.name === form.provinceCity);
            const provCode = selectedProvince ? selectedProvince.code.toString() : form.provinceCity.substring(0, 20);

            // Backend expects a provinceCode, we use the numerical code to avoid DB constraint violation (max 20 chars)
            const orderData = {
                shippingName: form.shippingName.trim(),
                shippingPhone: form.shippingPhone.trim(),
                shippingAddress: fullAddress,
                provinceCode: provCode, 
                paymentMethod: form.paymentMethod,
                note: form.note.trim(),
                items: items.map((item: CartItemType) => ({
                    productId: item.id,
                    quantity: item.qty,
                })),
                couponCodes: appliedPromotions.map((p: any) => p.code),
                discountAmount: discountAmount,
                // NV-1: Tọa độ tự động tra cứu từ tên Quận/Huyện. Gửi đi optional, Backend có fallback.
                shippingLatitude: coordinates?.lat,
                shippingLongitude: coordinates?.lng,
                pointsToUse: form.pointsToUse > 0 ? form.pointsToUse : undefined,
            };

            const result = await createOrder.mutateAsync(orderData as any);
            clearCart();
            
            const returnUrl = `${window.location.origin}/payment/return`;

            if (form.paymentMethod === 'VNPAY') {
                const { checkoutUrl } = await orderService.createVnPayUrl(result.id, returnUrl);
                window.location.href = checkoutUrl;
                return;
            }

            if (form.paymentMethod === 'PAYOS') {
                const { checkoutUrl } = await orderService.createPayosUrl(result.id, returnUrl, returnUrl);
                window.location.href = checkoutUrl;
                return;
            }

            navigate('/order-success', { state: { order: result } });
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || 'Lỗi hệ thống trong quá trình xử lý đơn hàng.';
            setErrors(errs => ({ ...errs, general: `Đặt hàng thất bại: ${errorMsg}` }));
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
                {(createOrder.isError || errors.general) && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, borderRadius: '8px' }}
                    >
                        {errors.general || (createOrder.error as any)?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin giao nhận và thử lại.'}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                    <LocalShipping sx={{ color: '#1a1a2e', fontSize: 22 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                                        Thông tin giao nhận hàng
                                    </Typography>
                                </Box>
                                {isLoggedIn && savedAddresses.length > 0 && (
                                    <Button 
                                        variant="outlined" 
                                        size="small" 
                                        onClick={() => setAddressModalOpen(true)}
                                        startIcon={<LocationOn />}
                                        sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#eef0f2', color: '#1a1a2e', fontWeight: 600 }}
                                    >
                                        Chọn địa chỉ đã lưu
                                    </Button>
                                )}
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

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth size="medium" error={!!errors.provinceCity}>
                                        <InputLabel sx={{ '&.Mui-focused': { color: '#1a1a2e' } }}>Tỉnh/Thành phố *</InputLabel>
                                        <Select
                                            value={form.provinceCity || ''}
                                            onChange={handleSelectChange('provinceCity')}
                                            label="Tỉnh/Thành phố *"
                                            sx={{
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                            }}
                                        >
                                            {provinces.map(p => (
                                                <MenuItem key={p.code} value={p.name}>{p.name}</MenuItem>
                                            ))}
                                        </Select>
                                        {errors.provinceCity && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{errors.provinceCity}</Typography>}
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth size="medium" disabled={!form.provinceCity} error={!!errors.district}>
                                        <InputLabel sx={{ '&.Mui-focused': { color: '#1a1a2e' } }}>Quận/Huyện *</InputLabel>
                                        <Select
                                            value={form.district || ''}
                                            onChange={handleSelectChange('district')}
                                            label="Quận/Huyện *"
                                            sx={{
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                            }}
                                        >
                                            {districts.map(d => (
                                                <MenuItem key={d.code} value={d.name}>{d.name}</MenuItem>
                                            ))}
                                        </Select>
                                        {errors.district && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{errors.district}</Typography>}
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth size="medium" disabled={!form.district}>
                                        <InputLabel sx={{ '&.Mui-focused': { color: '#1a1a2e' } }}>Phường/Xã</InputLabel>
                                        <Select
                                            value={form.ward || ''}
                                            onChange={handleSelectChange('ward')}
                                            label="Phường/Xã"
                                            sx={{
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f5a623' },
                                            }}
                                        >
                                            {wards.map(w => (
                                                <MenuItem key={w.code} value={w.name}>{w.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Địa chỉ chi tiết (số nhà, tên đường...) *"
                                        size="medium"
                                        value={form.specificAddress}
                                        onChange={handleTextChange('specificAddress')}
                                        error={!!errors.specificAddress}
                                        helperText={errors.specificAddress}
                                        placeholder="Số nhà, tên đường, tòa nhà..."
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
                                        label="Ghi chú đơn hàng"
                                        size="medium"
                                        multiline
                                        rows={2}
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

                        {/* Điểm thưởng (Loyalty Points) */}
                        {isLoggedIn && user && (user.loyaltyPoints ?? 0) >= 500 && (
                            <Paper
                                elevation={0}
                                sx={{ borderRadius: '12px', p: 3, mt: 3, border: '1px solid #eef0f2', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                                    <MonetizationOn sx={{ color: '#f5a623', fontSize: 22 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                                        Sử dụng điểm tích lũy
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Bạn đang có <strong>{user.loyaltyPoints} điểm</strong>. Quy đổi: 1 điểm = 100₫.
                                </Typography>
                                <FormControl fullWidth size="medium">
                                    <Select
                                        value={form.pointsToUse}
                                        onChange={(e) => setForm(f => ({ ...f, pointsToUse: Number(e.target.value) }))}
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        <MenuItem value={0}>Không sử dụng điểm</MenuItem>
                                        {[500, 1000, 1500, 2000, 5000].filter(p => p <= (user.loyaltyPoints ?? 0)).map(p => (
                                            <MenuItem key={p} value={p}>{p} điểm (giảm {fmt(p * 100)})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Paper>
                        )}
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
                                    bgcolor: finalShipFee === 0 ? 'rgba(46, 125, 50, 0.06)' : 'rgba(245, 166, 35, 0.08)',
                                    display: 'flex',
                                    gap: 1.2,
                                    alignItems: 'center',
                                }}>
                                    <LocalShipping sx={{
                                        fontSize: 18,
                                        color: finalShipFee === 0 ? '#2e7d32' : '#db941e',
                                    }} />
                                    <Typography
                                        variant="caption"
                                        color={finalShipFee === 0 ? '#2e7d32' : '#db941e'}
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {finalShipFee === 0
                                            ? 'Ưu đãi: Miễn phí giao hàng toàn quốc!'
                                            : `Mua thêm ${fmt(FREE_SHIP - totalPrice)} để được freeship`}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary">Tạm tính</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a2e' }}>{fmt(totalPrice)}</Typography>
                                </Box>
                                
                                {appliedPromotions.map((promo: any, idx: number) => {
                                    const isShipping = promo.promotionSlot === 'SHIPPING' || promo.code?.toUpperCase().includes('SHIP') || promo.code?.toUpperCase().includes('FREE');
                                    let d = 0;
                                    if (promo.discountAmount !== undefined) d = promo.discountAmount;
                                    else if (promo.type === 'FIXED_AMOUNT') d = promo.discountValue;
                                    else if (promo.type === 'PERCENTAGE') d = (totalPrice * promo.discountValue) / 100;
                                    const finalD = isShipping ? Math.min(d, rawShipFee) : Math.min(d, totalPrice);
                                    
                                    if (finalD === 0) return null;
                                    return (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography variant="body2" color="text.secondary">Mã giảm giá ({promo.code})</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff4d4f' }}>-{fmt(finalD)}</Typography>
                                        </Box>
                                    );
                                })}

                                {pointsDiscount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Typography variant="body2" color="text.secondary">Dùng điểm thưởng ({form.pointsToUse} điểm)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff4d4f' }}>-{fmt(pointsDiscount)}</Typography>
                                    </Box>
                                )}
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 700, color: finalShipFee === 0 ? '#2e7d32' : '#1a1a2e' }}
                                    >
                                        {finalShipFee === 0 ? 'Miễn phí' : (
                                            rawShipFee !== finalShipFee ? (
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                  <Box component="span" sx={{ textDecoration: 'line-through', color: '#8c9ba5', fontSize: '0.75rem', fontWeight: 500 }}>{fmt(rawShipFee)}</Box>
                                                  {fmt(finalShipFee)}
                                                </Box>
                                            ) : fmt(rawShipFee)
                                        )}
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
            {/* Address Selection Modal */}
            <Dialog open={addressModalOpen} onClose={() => setAddressModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography variant="h6" fontWeight={700}>Chọn địa chỉ giao hàng</Typography>
                    <IconButton onClick={() => setAddressModalOpen(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <List sx={{ p: 0 }}>
                        {savedAddresses.map((addr) => (
                            <React.Fragment key={addr.id}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleSelectAddress(addr)} sx={{ py: 2, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                            <Typography fontWeight={700} color="#1a1a2e">{addr.receiverName}</Typography>
                                            <Typography color="text.secondary">| {addr.receiverPhone}</Typography>
                                            {addr.isDefault && <Chip label="Mặc định" size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{addr.specificAddress}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {addr.ward ? `${addr.ward}, ` : ''}{addr.district}, {addr.provinceCity}
                                        </Typography>
                                    </ListItemButton>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

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