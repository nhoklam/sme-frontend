import re

file_path = r'd:\DATN\bookstore-sales-management\src\modules\admin\pages\orders\OrderListPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useQuery import if not exists
if 'useQuery' not in content:
    content = content.replace("import { useAuth } from", "import { useQuery } from '@tanstack/react-query';\nimport { useAuth } from")

new_component = '''
// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const OrderListPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: urlOrderId } = useParams<{ id: string }>();
    const { user, isAdmin, isManager, warehouseId: userWarehouseId } = useAuth();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [dateRange, setDateRange] = useState('last_30_days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const [tabIndex, setTabIndex] = useState(0); // 0: ONLINE, 1: OFFLINE
    const [pageOnline, setPageOnline] = useState(0);
    const [pageOffline, setPageOffline] = useState(0);
    const PAGE_SIZE = 10;

    const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);
    const [detailOrder, setDetailOrder] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [printInvoice, setPrintInvoice] = useState<any>(null);
    const [printOpen, setPrintOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(() => { });
    }, []);

    useEffect(() => {
        setWarehouseFilter(userWarehouseId || '');
        if (isManager || isAdmin) {
            import('../../../../services/userService').then(({ default: userService }) => {
                userService.getAll({ warehouseId: userWarehouseId || undefined }).then(users => {
                    setEmployees(users.filter(u => u.role === 'ROLE_CASHIER' || u.role === 'ROLE_MANAGER'));
                }).catch(() => {});
            });
        }
    }, [userWarehouseId, isManager, isAdmin]);

    useEffect(() => {
        if (urlOrderId) {
            const loadUrlOrder = async () => {
                try {
                    const full = await orderService.getById(urlOrderId);
                    setDetailOrder({ ...full, _source: 'ONLINE' });
                    setDetailOpen(true);
                } catch {
                    try {
                        const res = await axiosInstance.get(`/pos/invoices/code/${urlOrderId}`);
                        const inv = res.data?.data;
                        if (inv) {
                            const mapped = {
                                id: inv.id, code: inv.code,
                                items: inv.items, discountAmount: inv.discountAmount,
                                assignedWarehouseName: inv.warehouseName,
                                shippingAddress: 'Bán tại quầy',
                                paymentMethod: inv.payments?.[0]?.method || 'Tiền mặt',
                                payments: inv.payments,
                                _source: 'OFFLINE', cashierName: inv.cashierName,
                                totalAmount: inv.totalAmount, finalAmount: inv.finalAmount,
                                status: 'DELIVERED', createdAt: inv.createdAt,
                                customerName: inv.customerName, customerPhone: inv.customerPhone
                            };
                            setDetailOrder(mapped);
                            setDetailOpen(true);
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            };
            loadUrlOrder();
        }
    }, [urlOrderId]);

    const handleCloseDetail = useCallback(() => {
        setDetailOpen(false);
        if (urlOrderId) {
            navigate('/admin/orders', { replace: true });
        }
    }, [urlOrderId, navigate]);

    // Lấy ngày fromDate, toDate
    const getDateParams = () => {
        let fromDate: string | undefined = undefined;
        let toDate: string | undefined = undefined;
        const now = new Date();
        if (dateRange !== 'all') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (dateRange === 'today') {
                fromDate = today.toISOString();
                toDate = new Date(today.getTime() + 86400000 - 1).toISOString();
            } else if (dateRange === 'yesterday') {
                const yesterday = new Date(today.getTime() - 86400000);
                fromDate = yesterday.toISOString();
                toDate = new Date(yesterday.getTime() + 86400000 - 1).toISOString();
            } else if (dateRange === 'this_week') {
                const firstDayOfWeek = new Date(today.getTime());
                firstDayOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                fromDate = firstDayOfWeek.toISOString();
                toDate = new Date(today.getTime() + 86400000 - 1).toISOString();
            } else if (dateRange === 'last_week') {
                const firstDayOfLastWeek = new Date(today.getTime());
                firstDayOfLastWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) - 7);
                fromDate = firstDayOfLastWeek.toISOString();
                toDate = new Date(firstDayOfLastWeek.getTime() + 7 * 86400000 - 1).toISOString();
            } else if (dateRange === 'this_month') {
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            } else if (dateRange === 'last_month') {
                fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
            } else if (dateRange === 'this_year') {
                fromDate = new Date(now.getFullYear(), 0, 1).toISOString();
                toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
            } else if (dateRange === 'last_year') {
                fromDate = new Date(now.getFullYear() - 1, 0, 1).toISOString();
                toDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).toISOString();
            } else if (dateRange === 'last_30_days') {
                fromDate = new Date(today.getTime() - 29 * 86400000).toISOString();
                toDate = new Date(today.getTime() + 86400000 - 1).toISOString();
            } else if (dateRange === 'custom') {
                if (customStartDate) fromDate = new Date(customStartDate + "T00:00:00").toISOString();
                if (customEndDate) toDate = new Date(customEndDate + "T23:59:59.999").toISOString();
            }
        }
        return { fromDate, toDate };
    };

    const { fromDate, toDate } = getDateParams();

    // Reset page khi thay đổi filter
    useEffect(() => {
        if (tabIndex === 0) setPageOnline(0);
        else setPageOffline(0);
    }, [search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter, warehouseFilter, employeeFilter, dateRange, customStartDate, customEndDate, tabIndex]);

    // 1. ONLINE QUERY
    const onlineQuery = useQuery({
        queryKey: ["orders-online", pageOnline, PAGE_SIZE, search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter, warehouseFilter, fromDate, toDate],
        queryFn: async () => {
            const res = await orderService.getOrders({
                page: pageOnline, size: PAGE_SIZE, keyword: search.trim() || undefined,
                status: statusFilter || undefined, paymentStatus: paymentStatusFilter || undefined,
                provinceCode: provinceFilter || undefined, warehouseId: warehouseFilter || undefined,
                fromDate, toDate
            });
            // Filter paymentMethod client-side for Online since API does not support it directly
            if (paymentMethodFilter && res.content) {
                res.content = res.content.filter(o => o.paymentMethod?.includes(paymentMethodFilter));
            }
            return res;
        },
        enabled: tabIndex === 0
    });

    const onlineStatsQuery = useQuery({
        queryKey: ["orders-online-stats", search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter, warehouseFilter, fromDate, toDate],
        queryFn: async () => {
            return orderService.getStats({
                keyword: search.trim() || undefined, status: statusFilter || undefined, paymentStatus: paymentStatusFilter || undefined,
                provinceCode: provinceFilter || undefined, warehouseId: warehouseFilter || undefined,
                source: "ONLINE", fromDate, toDate
            });
        },
        enabled: tabIndex === 0
    });

    // 2. OFFLINE QUERY
    const offlineQuery = useQuery({
        queryKey: ["orders-offline", pageOffline, PAGE_SIZE, search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter, employeeFilter, warehouseFilter, fromDate, toDate],
        queryFn: async () => {
            // Mapping offline status
            let typeParam = "";
            if (statusFilter) {
                if (statusFilter === "DELIVERED") typeParam = "&type=SALE";
                else if (statusFilter === "RETURNED") typeParam = "&type=RETURN";
                else if (statusFilter === "CANCELLED") typeParam = "&type=VOIDED";
                else return { content: [], totalElements: 0, totalPages: 0 };
            }
            if (paymentStatusFilter === "UNPAID") return { content: [], totalElements: 0, totalPages: 0 };
            if (provinceFilter) return { content: [], totalElements: 0, totalPages: 0 };

            const kwParam = search ? `&keyword=${encodeURIComponent(search)}` : "";
            const whParam = warehouseFilter ? `&warehouseId=${warehouseFilter}` : "";
            const fromParam = fromDate ? `&from=${encodeURIComponent(fromDate)}` : "";
            const toParam = toDate ? `&to=${encodeURIComponent(toDate)}` : "";
            
            // Lấy ID nhân viên từ tên nhân viên
            let cashierIdParam = "";
            if (employeeFilter) {
                const emp = employees.find(e => e.fullName === employeeFilter || e.username === employeeFilter);
                if (emp) cashierIdParam = `&cashierId=${emp.id}`;
            }

            const pmParam = paymentMethodFilter ? `&paymentMethod=${paymentMethodFilter}` : "";

            const res = await axiosInstance.get(`/pos/invoices?page=${pageOffline}&size=${PAGE_SIZE}${kwParam}${typeParam}${whParam}${fromParam}${toParam}${pmParam}${cashierIdParam}`);
            
            const content = (res.data?.data?.content || []).map((inv: any) => {
                let mappedStatus = "DELIVERED";
                if (inv.type === "RETURN") mappedStatus = "RETURNED";
                if (inv.type === "VOIDED") mappedStatus = "CANCELLED";

                return {
                    id: inv.id, code: inv.code, customerName: inv.customerName || "Khách lẻ",
                    customerPhone: inv.customerPhone || "—", totalAmount: inv.totalAmount, finalAmount: inv.finalAmount,
                    status: mappedStatus, paymentStatus: "PAID", paymentMethod: inv.payments?.[0]?.method || "CASH",
                    createdAt: inv.createdAt, assignedWarehouseName: inv.warehouseName, type: inv.type === "RETURN" ? "RETURN" : "POS",
                    _source: "OFFLINE", cashierName: inv.cashierName, cancelledReason: inv.voidReason
                };
            });
            return {
                content,
                totalElements: res.data?.data?.totalElements || 0,
                totalPages: res.data?.data?.totalPages || 0
            };
        },
        enabled: tabIndex === 1
    });

    const handleAction = React.useCallback(async (action: string, order: OrderResponse) => {
        if (action === "view") {
            setDetailOrder(order); setDetailOpen(true); return;
        }
        const statusMap: Record<string, OrderStatus> = {
            packing: "PACKING", shipping: "SHIPPING", delivered: "DELIVERED", cancel: "CANCELLED",
        };
        const newStatus = statusMap[action];
        if (!newStatus) return;
        try {
            await orderService.updateStatus(order.id, newStatus);
            setSnack({ message: `Đã cập nhật đơn ${order.code} → ${STATUS_MAP[newStatus]?.label}`, severity: "success" });
            onlineQuery.refetch();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || "Cập nhật thất bại", severity: "error" });
        }
    }, [onlineQuery]);

    const handleRowClick = React.useCallback(async (order: any) => {
        if (order._source === "OFFLINE") {
            try {
                const res = await axiosInstance.get(`/pos/invoices/code/${order.code}`);
                const inv = res.data?.data;
                const mapped = {
                    ...order, items: inv.items, discountAmount: inv.discountAmount,
                    assignedWarehouseName: inv.warehouseName || order.assignedWarehouseName,
                    shippingAddress: "Bán tại quầy", paymentMethod: inv.payments?.[0]?.method || "Tiền mặt",
                    payments: inv.payments, _source: "OFFLINE", cashierName: inv.cashierName || order.cashierName
                };
                setDetailOrder(mapped);
            } catch { setDetailOrder(order); }
        } else {
            try {
                const full = await orderService.getById(order.id);
                setDetailOrder({ ...full, _source: "ONLINE" });
            } catch { setDetailOrder(order); }
        }
        setDetailOpen(true);
    }, []);

    const handlePrintOrder = (order: any) => {
        const invoiceData = {
            id: order.id, code: order.code, type: order.type, totalAmount: order.totalAmount || order.finalAmount,
            discountAmount: order.discountAmount || 0, finalAmount: order.finalAmount,
            cashierName: order.cashierName || order.createdByName, customerName: order.customerName || order.shippingName,
            customerPhone: order.customerPhone || order.shippingPhone, shippingAddress: order.shippingAddress,
            note: order.note, createdAt: order.createdAt, items: order.items || [],
            payments: [{ method: order.paymentMethod || "CASH", amount: order.finalAmount }],
            _source: order._source, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus
        };
        setPrintInvoice(invoiceData);
        setPrintOpen(true);
    };

    const handleStatusChange = async (order: OrderResponse, newStatus: string) => {
        try {
            await orderService.updateStatus(order.id, newStatus);
            setSnack({ message: `Đã cập nhật trạng thái đơn ${order.code}`, severity: "success" });
            onlineQuery.refetch();
        } catch (e: any) {
            setSnack({ message: e.response?.data?.message || "Cập nhật thất bại", severity: "error" });
        }
    };

    const clearFilters = () => {
        setSearch(""); setStatusFilter(""); setPaymentStatusFilter("");
        setPaymentMethodFilter(""); setProvinceFilter(""); setEmployeeFilter("");
    };

    const activeFilterCount = [search, statusFilter, paymentStatusFilter, paymentMethodFilter, provinceFilter, employeeFilter].filter(Boolean).length;
    
    const isLoading = tabIndex === 0 ? onlineQuery.isFetching : offlineQuery.isFetching;
    const currentOrders = tabIndex === 0 ? (onlineQuery.data?.content || []) : (offlineQuery.data?.content || []);
    const currentTotalElements = tabIndex === 0 ? (onlineQuery.data?.totalElements || 0) : (offlineQuery.data?.totalElements || 0);
    const currentTotalPages = tabIndex === 0 ? (onlineQuery.data?.totalPages || 0) : (offlineQuery.data?.totalPages || 0);
    const currentPage = tabIndex === 0 ? pageOnline : pageOffline;

    const stats = {
        totalCount: tabIndex === 0 ? (onlineStatsQuery.data?.totalCount || 0) : currentTotalElements,
        pendingCount: tabIndex === 0 ? (onlineStatsQuery.data?.pendingCount || 0) : 0,
        paidCount: tabIndex === 0 ? (onlineStatsQuery.data?.paidCount || 0) : currentTotalElements,
        totalRevenue: tabIndex === 0 ? (onlineStatsQuery.data?.totalRevenue || 0) : currentOrders.reduce((s: number, o: any) => s + (o.finalAmount||0), 0)
    };

    return (
        <Box sx={{ p: 3, bgcolor: "#f8f9fb", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="#aaa" fontSize={11}>
                    Dashboard / <strong style={{ color: "#555" }}>Đơn hàng</strong>
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1a1a2e">Quản lý Đơn hàng</Typography>
                        <Typography variant="body2" color="text.secondary" fontSize={12}>
                            Quản lý và theo dõi đơn hàng bán hàng
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Làm mới">
                            <IconButton onClick={() => tabIndex === 0 ? onlineQuery.refetch() : offlineQuery.refetch()} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                                <Refresh sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <Button variant="contained" size="small" startIcon={<Add sx={{ fontSize: 15 }} />}
                            onClick={() => setCreateOpen(true)}
                            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
                            Tạo đơn hàng
                        </Button>
                    </Box>
                </Box>
                {/* Tabs chọn nguồn */}
                <Box sx={{ mb: 3 }}>
                    <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}
                        sx={{
                            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: "#1976d2" },
                            borderBottom: "1px solid #e0e0e0"
                        }}>
                        <Tab label="Đơn Online (Giao hàng)" value={0} sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }} />
                        <Tab label="Hóa đơn POS (Tại quầy)" value={1} sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }} />
                    </Tabs>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1.5, mb: 2.5 }}>
                {[
                    { label: "Tổng đơn", value: stats.totalCount.toLocaleString(), color: "#1a1a2e" },
                    { label: "Chờ xử lý", value: stats.pendingCount.toLocaleString(), color: "#e65100" },
                    { label: "Đã thanh toán", value: stats.paidCount.toLocaleString(), color: "#2e7d32" },
                    { label: tabIndex === 0 ? "Doanh thu" : "Doanh thu (Trang hiện tại)", value: `${(stats.totalRevenue / 1_000_000).toFixed(1)}M đ`, color: "#1976d2" },
                ].map(s => (
                    <Paper key={s.label} elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #f0f0f0" }}>
                        <Typography variant="caption" color="text.secondary" fontSize={11} fontWeight={600} letterSpacing={0.3} display="block">
                            {s.label.toUpperCase()}
                        </Typography>
                        {isLoading && tabIndex === 0 ? <Skeleton height={32} /> : (
                            <Typography variant="h5" fontWeight={800} color={s.color} mt={0.5}>{s.value}</Typography>
                        )}
                    </Paper>
                ))}
            </Box>

            {/* Filter Panel */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #f0f0f0", mb: 2, overflow: "hidden" }}>
                <Box sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                    <TextField size="small" placeholder="Tìm theo mã đơn, tên KH, SĐT..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        sx={{ flex: 1, minWidth: 220 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: "#bbb" }} /></InputAdornment> }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select value={dateRange} onChange={(e: SelectChangeEvent<string>) => setDateRange(e.target.value)}
                            displayEmpty sx={{ fontSize: 13, bgcolor: "#fff", borderRadius: 1.5 }}>
                            <MenuItem value="all" sx={{ fontSize: 13 }}>Tất cả thời gian</MenuItem>
                            <MenuItem value="today" sx={{ fontSize: 13 }}>Hôm nay</MenuItem>
                            <MenuItem value="yesterday" sx={{ fontSize: 13 }}>Hôm qua</MenuItem>
                            <MenuItem value="this_week" sx={{ fontSize: 13 }}>Tuần này</MenuItem>
                            <MenuItem value="last_week" sx={{ fontSize: 13 }}>Tuần trước</MenuItem>
                            <MenuItem value="this_month" sx={{ fontSize: 13 }}>Tháng này</MenuItem>
                            <MenuItem value="last_month" sx={{ fontSize: 13 }}>Tháng trước</MenuItem>
                            <MenuItem value="this_year" sx={{ fontSize: 13 }}>Năm nay</MenuItem>
                            <MenuItem value="last_year" sx={{ fontSize: 13 }}>Năm trước</MenuItem>
                            <MenuItem value="last_30_days" sx={{ fontSize: 13 }}>30 ngày qua</MenuItem>
                            <MenuItem value="custom" sx={{ fontSize: 13 }}>Tùy chỉnh...</MenuItem>
                        </Select>
                    </FormControl>
                    {dateRange === "custom" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField type="date" size="small" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} sx={{ width: 130 }} InputProps={{ sx: { fontSize: 13, borderRadius: 1.5 } }} />
                            <TextField type="date" size="small" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} sx={{ width: 130 }} InputProps={{ sx: { fontSize: 13, borderRadius: 1.5 } }} />
                        </Box>
                    )}
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {STATUS_OPTIONS.map(opt => (
                            <Button key={opt.value} size="small" onClick={() => setStatusFilter(opt.value)}
                                sx={{
                                    textTransform: "none", fontSize: 12, fontWeight: 600,
                                    px: 1.5, py: 0.5, borderRadius: 1.5, border: "1px solid",
                                    borderColor: statusFilter === opt.value ? "#1976d2" : "#e0e0e0",
                                    bgcolor: statusFilter === opt.value ? "#e3f2fd" : "transparent",
                                    color: statusFilter === opt.value ? "#1976d2" : "#555",
                                    "&:hover": { borderColor: "#1976d2", bgcolor: "#e3f2fd" },
                                }}>
                                {opt.label}
                            </Button>
                        ))}
                    </Box>
                    <Button size="small"
                        endIcon={showAdvanced ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        sx={{
                            textTransform: "none", color: showAdvanced ? "#1976d2" : "#555",
                            border: "1px solid", borderColor: showAdvanced ? "#1976d2" : "#e0e0e0",
                            borderRadius: 1.5, bgcolor: showAdvanced ? "#e3f2fd" : "transparent",
                        }}>
                        Bộ lọc nâng cao
                        {activeFilterCount > 0 && (
                            <Box component="span" sx={{ ml: 0.5, px: 0.75, borderRadius: 1, bgcolor: "#1976d2", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                                {activeFilterCount}
                            </Box>
                        )}
                    </Button>
                </Box>

                <Collapse in={showAdvanced}>
                    <Box sx={{ px: 2, pb: 2, display: "flex", gap: 1.5, flexWrap: "wrap", borderTop: "1px solid #f5f5f5", pt: 1.5, bgcolor: "#fafafa" }}>
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select value={paymentStatusFilter}
                                onChange={(e: SelectChangeEvent<string>) => setPaymentStatusFilter(e.target.value)}
                                displayEmpty sx={{ fontSize: 13 }}>
                                {PAYMENT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select value={paymentMethodFilter}
                                onChange={(e: SelectChangeEvent<string>) => setPaymentMethodFilter(e.target.value)}
                                displayEmpty sx={{ fontSize: 13 }}>
                                {PAYMENT_METHOD_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select value={provinceFilter}
                                onChange={(e: SelectChangeEvent<string>) => setProvinceFilter(e.target.value)}
                                displayEmpty sx={{ fontSize: 13 }}>
                                <MenuItem value="">Tất cả khu vực</MenuItem>
                                {Object.entries(globalProvincesCache).length > 0 
                                    ? Object.entries(globalProvincesCache).map(([code, name]) => <MenuItem key={code} value={code} sx={{ fontSize: 13 }}>{name}</MenuItem>) 
                                    : PROVINCES.map(p => <MenuItem key={p.code} value={p.code} sx={{ fontSize: 13 }}>{p.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        {isManager && (
                            <FormControl size="small" sx={{ minWidth: 170 }}>
                                <Select value={employeeFilter}
                                    onChange={(e: SelectChangeEvent<string>) => setEmployeeFilter(e.target.value)}
                                    displayEmpty sx={{ fontSize: 13 }}>
                                    <MenuItem value="">Tất cả nhân viên</MenuItem>
                                    {employees.map(emp => (
                                        <MenuItem key={emp.id} value={emp.fullName || emp.username} sx={{ fontSize: 13 }}>
                                            {emp.fullName || emp.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {activeFilterCount > 0 && (
                            <Button size="small" onClick={clearFilters}
                                sx={{ textTransform: "none", color: "#d32f2f", fontSize: 12, fontWeight: 600 }}>
                                Xóa bộ lọc ({activeFilterCount})
                            </Button>
                        )}
                    </Box>
                </Collapse>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                    <Box sx={{ px: 2, pb: 1.5, display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary">Đang lọc:</Typography>
                        {search && <Chip size="small" label={`"${search}"`} onDelete={() => setSearch("")} sx={{ bgcolor: "#e3f2fd", color: "#1976d2", fontWeight: 600 }} />}
                        {statusFilter && <Chip size="small" label={STATUS_OPTIONS.find(o => o.value === statusFilter)?.label} onDelete={() => setStatusFilter("")} sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600 }} />}
                        {paymentStatusFilter && <Chip size="small" label={PAYMENT_OPTIONS.find(o => o.value === paymentStatusFilter)?.label} onDelete={() => setPaymentStatusFilter("")} sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }} />}
                        {paymentMethodFilter && <Chip size="small" label={paymentMethodFilter} onDelete={() => setPaymentMethodFilter("")} sx={{ bgcolor: "#f3e5f5", color: "#6a1b9a", fontWeight: 600 }} />}
                        {provinceFilter && <Chip size="small" label={getProvinceName(provinceFilter)} onDelete={() => setProvinceFilter("")} sx={{ bgcolor: "#e1f5fe", color: "#0277bd", fontWeight: 600 }} />}
                        {employeeFilter && <Chip size="small" label={`Nhân viên: ${employeeFilter}`} onDelete={() => setEmployeeFilter("")} sx={{ bgcolor: "#e8eaf6", color: "#3f51b5", fontWeight: 600 }} />}
                    </Box>
                )}
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#fafafa" }}>
                                {[
                                    { label: "STT", width: 48 },
                                    { label: "Mã đơn & Loại", width: 170 },
                                    { label: "Khách hàng", width: 170 },
                                    { label: "Khu vực", width: 130 },
                                    { label: "Kho đóng gói", width: 130 },
                                    { label: "Ngày tạo", width: 100 },
                                    { label: "Người tạo", width: 130 },
                                    { label: "Tổng tiền", width: 110, align: "right" },
                                    { label: "Hình thức TT", width: 100 },
                                    { label: "Thanh toán", width: 90, align: "center" },
                                    { label: "Trạng thái", width: 100, align: "center" },
                                    { label: "", width: 50, align: "center" },
                                ].map(col => (
                                    <TableCell key={col.label} align={(col.align as any) || "left"}
                                        sx={{ fontWeight: 700, fontSize: 11, color: "#888", width: col.width, py: 1.5, letterSpacing: 0.3 }}>
                                        {col.label.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(j => (
                                            <TableCell key={j}><Skeleton height={20} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : currentOrders.length > 0 ? (
                                currentOrders.map((order: any, idx: number) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                        idx={idx}
                                        page={currentPage}
                                        PAGE_SIZE={PAGE_SIZE}
                                        onClick={handleRowClick}
                                        onAction={handleAction}
                                    />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                                        <Typography fontSize={36} mb={1}>🔍</Typography>
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            Không tìm thấy đơn hàng nào
                                        </Typography>
                                        {activeFilterCount > 0 && (
                                            <Button size="small" variant="outlined" onClick={clearFilters} sx={{ mt: 1, textTransform: "none", fontSize: 12 }}>
                                                Xóa bộ lọc
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5, borderTop: "1px solid #f0f0f0", bgcolor: "#fafafa" }}>
                    <Typography variant="caption" color="text.secondary">
                        Hiển thị <strong>{currentOrders.length}</strong> / <strong>{currentTotalElements}</strong> đơn hàng
                    </Typography>
                    {currentTotalPages > 1 && (
                        <Pagination count={currentTotalPages} page={currentPage + 1} onChange={(_, v) => tabIndex === 0 ? setPageOnline(v - 1) : setPageOffline(v - 1)}
                            color="primary" shape="rounded" size="small" />
                    )}
                </Box>
            </Paper>

            {/* ORDER DETAIL DIALOG */}
            <OrderDetailDialog
                order={detailOrder}
                open={detailOpen}
                onClose={handleCloseDetail}
                onStatusChange={handleStatusChange}
                onPrint={() => handlePrintOrder(detailOrder)}
            />

            {/* CREATE ORDER DIALOG */}
            <CreateOrderDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => { onlineQuery.refetch(); setSnack({ message: "Tạo đơn hàng thành công!", severity: "success" }); }}
                warehouses={warehouses}
            />

            {/* PRINT INVOICE DIALOG */}
            {printInvoice?._source === "ONLINE" ? (
                <PrintShippingLabelDialog
                    open={printOpen}
                    onClose={() => setPrintOpen(false)}
                    order={printInvoice}
                />
            ) : (
                <PrintInvoiceDialog
                    open={printOpen}
                    onClose={() => setPrintOpen(false)}
                    invoice={printInvoice}
                    cashierDisplayName={printInvoice?.cashierName || user?.fullName}
                />
            )}

            {/* Snackbar */}
            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                {snack ? (
                    <Alert onClose={() => setSnack(null)} severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {snack.message}
                    </Alert>
                ) : <div />}
            </Snackbar>
        </Box>
    );
};

export default OrderListPage;
'''

start_idx = content.find('const OrderListPage: React.FC = () => {')
if start_idx != -1:
    content = content[:start_idx] + new_component
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Start index not found')
