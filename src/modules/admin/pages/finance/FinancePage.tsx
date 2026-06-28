// src/modules/admin/pages/finance/FinancePage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Grid, Button, TextField,
    InputAdornment, Chip, IconButton, Select, MenuItem,
    FormControl, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Skeleton, Alert, Snackbar,
    Dialog, DialogContent, DialogActions,
    Tooltip, Pagination, LinearProgress,
    Avatar, CircularProgress,
} from '@mui/material';
import {
    Search, Refresh, Add, FileDownloadOutlined,
    AccountBalance, History,
    CheckCircle, Close, Upload,
    TrendingUp, TrendingDown, SwapHoriz,
    Business, Print,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

import authService from '../../../../services/authService';
import financeService from '../../../../services/financeService';
import supplierService from '../../../../services/supplierService';
import warehouseService from '../../../../services/warehouseService';
import { exportToExcel, fmtVnd } from '../../../../utils/excelExport';
import {
    SupplierDebt, FundType, TransactionType,
    Supplier, Warehouse,
} from '../../../../types';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtCurrency = (n?: number) => {
    if (n == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
};

const fmtDate = (s: string) => {
    try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
};

const fmtDateTime = (s: string) => {
    try {
        return new Date(s).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return s; }
};

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────
// MAP CHỨNG TỪ — hiển thị tiếng Việt đầy đủ
// ─────────────────────────────────────────────────────────────
const TX_REF_MAP: Record<string, { label: string; color: string; bg: string }> = {
    INVOICE: { label: 'Hoá đơn POS', color: '#16a34a', bg: '#dcfce7' },
    SALE_POS: { label: 'Bán hàng POS', color: '#16a34a', bg: '#dcfce7' },
    SALE_ONLINE: { label: 'Bán hàng Online', color: '#2563eb', bg: '#dbeafe' },
    PURCHASE: { label: 'Nhập kho', color: '#d97706', bg: '#fef3c7' },
    PURCHASE_ORDER: { label: 'Nhập kho', color: '#d97706', bg: '#fef3c7' },
    SUPPLIER_DEBT: { label: 'Trả nợ NCC', color: '#7c3aed', bg: '#ede9fe' },
    SUPPLIER_PAYMENT: { label: 'Trả nợ NCC', color: '#7c3aed', bg: '#ede9fe' },
    MANUAL: { label: 'Thủ công', color: '#6b7280', bg: '#f3f4f6' },
    MANUAL_IN: { label: 'Thu thủ công', color: '#0891b2', bg: '#cffafe' },
    MANUAL_OUT: { label: 'Chi thủ công', color: '#dc2626', bg: '#fee2e2' },
    EXPENSE: { label: 'Chi phí vận hành', color: '#dc2626', bg: '#fee2e2' },
    OTHER_INCOME: { label: 'Thu nhập khác', color: '#0891b2', bg: '#cffafe' },
    COD_RECONCILE: { label: 'Đối soát COD', color: '#065f46', bg: '#d1fae5' },
    COD_RECONCILIATION: { label: 'Đối soát COD', color: '#065f46', bg: '#d1fae5' },
    SHIFT_OPEN: { label: 'Mở ca', color: '#9ca3af', bg: '#f3f4f6' },
    SHIFT_CLOSE: { label: 'Đóng ca', color: '#9ca3af', bg: '#f3f4f6' },
    REFUND: { label: 'Hoàn tiền', color: '#d97706', bg: '#fef3c7' },
    TRANSFER: { label: 'Chuyển khoản', color: '#0891b2', bg: '#cffafe' },
    RETURN: { label: 'Trả hàng', color: '#2e7d32', bg: '#e8f5e9' },
    ADJUSTMENT: { label: 'Điều chỉnh', color: '#e65100', bg: '#fff3e0' },
};

// Dropdown lọc loại nguồn / chứng từ
const REF_TYPE_OPTIONS = [
    { value: '', label: 'Tất cả nguồn' },
    { value: 'INVOICE', label: 'Hoá đơn POS' },
    { value: 'SALE_ONLINE', label: 'Bán hàng Online' },
    { value: 'PURCHASE_ORDER', label: 'Nhập kho' },
    { value: 'SUPPLIER_PAYMENT', label: 'Trả nợ NCC' },
    { value: 'COD_RECONCILIATION', label: 'Đối soát COD' },
    { value: 'EXPENSE', label: 'Chi phí vận hành' },
    { value: 'OTHER_INCOME', label: 'Thu nhập khác' },
    { value: 'MANUAL', label: 'Thủ công' },
    { value: 'SHIFT_OPEN', label: 'Mở ca' },
    { value: 'SHIFT_CLOSE', label: 'Đóng ca' },
];

const FUND_LABELS: Record<string, string> = {
    CASH_111: 'Tiền mặt (TK 111)',
    BANK_112: 'Ngân hàng (TK 112)',
};

// Map trạng thái công nợ → tiếng Việt
const DEBT_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    UNPAID: { label: 'Chưa trả', color: '#dc2626', bg: '#fee2e2' },
    PARTIAL: { label: 'Một phần', color: '#d97706', bg: '#fef3c7' },
    PAID: { label: 'Đã trả', color: '#16a34a', bg: '#dcfce7' },
};

// Rút gọn UUID / tên dài
const formatCreatedBy = (val?: string) => {
    if (!val) return '—';
    if (/^[0-9a-f]{8}-/i.test(val) || val.length > 30) {
        const parts = val.split('-');
        return parts.length > 1 ? `...${parts[parts.length - 1]}` : val.slice(0, 10) + '…';
    }
    return val;
};

// ─────────────────────────────────────────────────────────────
// HELPER: IN PHIẾU THU / CHI
// ─────────────────────────────────────────────────────────────
const handlePrintReceipt = (txn: any) => {
    const isIn = txn.transactionType === 'IN';
    const typeStr = isIn ? 'PHIẾU THU' : 'PHIẾU CHI';
    const personStr = isIn ? 'Người nộp tiền' : 'Người nhận tiền';
    const refInfo = TX_REF_MAP[txn.referenceType] ?? { label: txn.referenceType || '—', color: '#666', bg: '#f3f4f6' };
    const date = new Date(txn.createdAt);
    const dateStr = `Ngày ${date.getDate().toString().padStart(2, '0')} tháng ${(date.getMonth() + 1).toString().padStart(2, '0')} năm ${date.getFullYear()}`;

    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>In ${typeStr}</title>
      <style>
        body{font-family:'Times New Roman',serif;color:#000;padding:40px;font-size:15px}
        .header{display:flex;justify-content:space-between;margin-bottom:30px}
        .title{text-align:center;margin-bottom:20px}
        .title h1{margin:0;font-size:24px;font-weight:bold}
        .title p{margin:5px 0 0;font-style:italic}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        td{padding:8px 0;vertical-align:top}
        .label{width:160px;font-weight:bold}
        .signatures{display:flex;justify-content:space-between;margin-top:50px;text-align:center}
        .sig-box{width:30%}
        .sig-title{font-weight:bold;margin-bottom:5px}
        .sig-sub{font-style:italic;font-size:13px;color:#555}
        .amount{font-weight:bold;font-size:18px}
      </style></head>
      <body onload="window.print();window.close();">
        <div class="header">
          <div><strong>ĐƠN VỊ: HỆ THỐNG CỬA HÀNG SÁCH</strong><br/><span>Mã phiếu: ${txn.id?.slice(0, 12) ?? '—'}</span></div>
          <div style="text-align:right"><strong>Mẫu số: 01-TT / 02-TT</strong><br/><span>(Ban hành theo Thông tư 200/2014/TT-BTC)</span></div>
        </div>
        <div class="title"><h1>${typeStr}</h1><p>${dateStr}</p></div>
        <table>
          <tr><td class="label">Loại chứng từ:</td><td>${refInfo.label}</td></tr>
          <tr><td class="label">Loại quỹ:</td><td>${txn.fundType === 'CASH_111' ? 'Tiền mặt (TK 111)' : 'Ngân hàng (TK 112)'}</td></tr>
          <tr><td class="label">Lý do / Nội dung:</td><td>${txn.description || '—'}</td></tr>
          <tr><td class="label">Số tiền:</td><td class="amount">${fmtCurrency(txn.amount)}</td></tr>
          <tr><td class="label">Người thực hiện:</td><td>${txn.createdBy || '—'}</td></tr>
        </table>
        <div class="signatures">
          <div class="sig-box"><div class="sig-title">Người lập phiếu</div><div class="sig-sub">(Ký, họ tên)</div></div>
          <div class="sig-box"><div class="sig-title">${personStr}</div><div class="sig-sub">(Ký, họ tên)</div></div>
          <div class="sig-box"><div class="sig-title">Thủ quỹ</div><div class="sig-sub">(Ký, họ tên)</div></div>
        </div>
      </body></html>`;

    const printWin = window.open('', '_blank');
    if (printWin) { printWin.document.write(html); printWin.document.close(); }
};

// ─────────────────────────────────────────────────────────────
// ── 1. CREATE CASHBOOK ENTRY DIALOG
// ─────────────────────────────────────────────────────────────
const CreateEntryDialog: React.FC<{
    open: boolean; onClose: () => void; onSaved: () => void; warehouses: Warehouse[];
}> = ({ open, onClose, onSaved, warehouses }) => {
    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';
    const myWarehouseId = !isAdmin ? (currentUser?.warehouseId ?? '') : '';

    const [form, setForm] = useState({
        warehouseId: myWarehouseId, fundType: 'CASH_111' as FundType,
        transactionType: 'IN' as TransactionType, referenceType: 'MANUAL_IN', amount: '', description: '',
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (open) { setForm({ warehouseId: myWarehouseId, fundType: 'CASH_111', transactionType: 'IN', referenceType: 'MANUAL_IN', amount: '', description: '' }); setErr(''); }
    }, [open]);

    const set = (k: string) => (e: any) => {
        const v = e.target?.value ?? e;
        setForm(f => ({ ...f, [k]: v }));
        if (k === 'transactionType') setForm(f => ({ ...f, [k]: v, referenceType: v === 'IN' ? 'MANUAL_IN' : 'MANUAL_OUT' }));
    };

    const handleSave = async () => {
        if (!form.warehouseId) { setErr('Vui lòng chọn chi nhánh'); return; }
        if (!form.amount || Number(form.amount) <= 0) { setErr('Số tiền phải lớn hơn 0'); return; }
        if (!form.description.trim()) { setErr('Vui lòng nhập mô tả'); return; }
        setSaving(true); setErr('');
        try {
            await financeService.createEntry({ warehouseId: form.warehouseId, fundType: form.fundType, transactionType: form.transactionType, referenceType: form.referenceType, amount: Number(form.amount), description: form.description.trim() });
            onSaved(); onClose();
        } catch (e: any) { setErr(e.response?.data?.message || 'Tạo phiếu thất bại'); }
        finally { setSaving(false); }
    };

    const isThu = form.transactionType === 'IN';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: isThu ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {isThu ? <TrendingUp sx={{ color: '#fff', fontSize: 22 }} /> : <TrendingDown sx={{ color: '#fff', fontSize: 22 }} />}
                    <Box>
                        <Typography fontWeight={800} color="#fff" fontSize={16}>{isThu ? 'Tạo Phiếu Thu' : 'Tạo Phiếu Chi'}</Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.8)">Nhập thông tin giao dịch thủ công</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{err}</Alert>}
                <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                    {[{ v: 'IN', label: '💰 Phiếu Thu', color: '#16a34a', bg: '#dcfce7' }, { v: 'OUT', label: '💸 Phiếu Chi', color: '#dc2626', bg: '#fee2e2' }].map(opt => (
                        <Box key={opt.v} onClick={() => set('transactionType')(opt.v)} sx={{ flex: 1, p: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center', border: `2px solid ${form.transactionType === opt.v ? opt.color : '#e5e7eb'}`, bgcolor: form.transactionType === opt.v ? opt.bg : 'transparent', transition: 'all 0.15s' }}>
                            <Typography fontWeight={700} fontSize={14} color={form.transactionType === opt.v ? opt.color : '#6b7280'}>{opt.label}</Typography>
                        </Box>
                    ))}
                </Box>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Chi nhánh *</Typography>
                        <FormControl fullWidth size="small">
                            <Select value={form.warehouseId} onChange={set('warehouseId')} displayEmpty disabled={!isAdmin}>
                                <MenuItem value="">Chọn chi nhánh</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Quỹ</Typography>
                        <FormControl fullWidth size="small">
                            <Select value={form.fundType} onChange={set('fundType')}>
                                <MenuItem value="CASH_111">💵 Tiền mặt (TK 111)</MenuItem>
                                <MenuItem value="BANK_112">🏦 Ngân hàng (TK 112)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Số tiền *</Typography>
                        <TextField fullWidth size="small" type="number" placeholder="0" value={form.amount} onChange={set('amount')} InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Mô tả *</Typography>
                        <TextField fullWidth size="small" multiline rows={2} placeholder="Nội dung giao dịch..." value={form.description} onChange={set('description')} />
                    </Grid>
                </Grid>
                {form.amount && Number(form.amount) > 0 && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: isThu ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isThu ? '#bbf7d0' : '#fecaca'}` }}>
                        <Typography variant="caption" fontWeight={700} color={isThu ? '#15803d' : '#dc2626'} display="block">
                            {isThu ? '+ Thu' : '- Chi'}: {fmtCurrency(Number(form.amount))}
                        </Typography>
                        <Typography variant="caption" color="#6b7280">{FUND_LABELS[form.fundType]} · {warehouses.find(w => w.id === form.warehouseId)?.name || 'Chưa chọn chi nhánh'}</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                <Button onClick={handleSave} variant="contained" disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: isThu ? '#16a34a' : '#ef4444', '&:hover': { filter: 'brightness(0.9)' }, height: 36 }}>
                    {saving ? 'Đang lưu...' : `Tạo ${isThu ? 'Phiếu Thu' : 'Phiếu Chi'}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// ── 2. PAY SUPPLIER DEBT DIALOG
// ─────────────────────────────────────────────────────────────
const PayDebtDialog: React.FC<{
    open: boolean; debt: SupplierDebt | null; supplierName: string; onClose: () => void; onPaid: () => void;
}> = ({ open, debt, supplierName, onClose, onPaid }) => {
    const [amount, setAmount] = useState('');
    const [fundType, setFundType] = useState('CASH_111');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (open && debt) { setAmount(String(debt.remainingAmount)); setFundType('CASH_111'); setNote(''); setErr(''); }
    }, [open, debt]);

    const handlePay = async () => {
        if (!debt) return;
        const amt = Number(amount);
        if (amt <= 0) { setErr('Số tiền phải lớn hơn 0'); return; }
        if (amt > debt.remainingAmount) { setErr(`Vượt quá dư nợ còn lại (${fmtCurrency(debt.remainingAmount)})`); return; }
        setSaving(true); setErr('');
        try { await financeService.paySupplierDebt({ supplierDebtId: debt.id, amount: amt, fundType, note: note || undefined }); onPaid(); onClose(); }
        catch (e: any) { setErr(e.response?.data?.message || 'Thanh toán thất bại'); }
        finally { setSaving(false); }
    };

    if (!debt) return null;
    const pct = debt.totalDebt > 0 ? Math.round((debt.paidAmount / debt.totalDebt) * 100) : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography fontWeight={800} color="#fff" fontSize={16}>Thanh toán công nợ</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)">{supplierName}</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{err}</Alert>}
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="#7c3aed" fontWeight={700}>Tổng nợ</Typography>
                        <Typography fontWeight={700} color="#7c3aed">{fmtCurrency(debt.totalDebt)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="#6b7280">Đã thanh toán</Typography>
                        <Typography color="#16a34a" fontWeight={600}>{fmtCurrency(debt.paidAmount)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#e9d5ff', mb: 1, '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="#dc2626" fontWeight={700}>Còn lại</Typography>
                        <Typography fontWeight={800} color="#dc2626">{fmtCurrency(debt.remainingAmount)}</Typography>
                    </Box>
                </Box>
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Số tiền thanh toán *</Typography>
                <TextField fullWidth size="small" type="number" value={amount} onChange={e => setAmount(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
                    {[25, 50, 100].map(p => {
                        const v = Math.round(debt.remainingAmount * p / 100);
                        return <Button key={p} size="small" variant="outlined" onClick={() => setAmount(String(v))} sx={{ flex: 1, textTransform: 'none', fontSize: 11, borderColor: '#e5e7eb', color: '#6b7280', '&:hover': { borderColor: '#7c3aed', color: '#7c3aed' } }}>{p}%</Button>;
                    })}
                    <Button size="small" variant="outlined" onClick={() => setAmount(String(debt.remainingAmount))} sx={{ flex: 1, textTransform: 'none', fontSize: 11, borderColor: '#7c3aed', color: '#7c3aed' }}>Toàn bộ</Button>
                </Box>
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Quỹ thanh toán</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <Select value={fundType} onChange={e => setFundType(e.target.value)}>
                        <MenuItem value="CASH_111">💵 Tiền mặt (TK 111)</MenuItem>
                        <MenuItem value="BANK_112">🏦 Ngân hàng (TK 112)</MenuItem>
                    </Select>
                </FormControl>
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Ghi chú</Typography>
                <TextField fullWidth size="small" placeholder="Nội dung thanh toán..." value={note} onChange={e => setNote(e.target.value)} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                <Button onClick={handlePay} variant="contained" disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, height: 36 }}>
                    {saving ? 'Đang xử lý...' : `Thanh toán ${amount ? fmtCurrency(Number(amount)) : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// ── 3. COD RECONCILIATION DIALOG
// ─────────────────────────────────────────────────────────────
interface CodRow { orderCode: string; amountReceived: number; shippingFee: number; shippingProvider: string }

const CodReconcileDialog: React.FC<{ open: boolean; onClose: () => void; warehouses: Warehouse[]; onDone: () => void }> = ({ open, onClose, warehouses, onDone }) => {
    const [rows, setRows] = useState<CodRow[]>([{ orderCode: '', amountReceived: 0, shippingFee: 0, shippingProvider: 'GHN' }]);
    const [warehouseId, setWarehouseId] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (open) { setRows([{ orderCode: '', amountReceived: 0, shippingFee: 0, shippingProvider: 'GHN' }]); setResult(null); setErr(''); setWarehouseId(''); } }, [open]);
    const addRow = () => setRows(r => [...r, { orderCode: '', amountReceived: 0, shippingFee: 0, shippingProvider: 'GHN' }]);
    const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
    const updateRow = (i: number, k: keyof CodRow, v: string | number) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target?.result, { type: 'binary' });
                const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const parsed: CodRow[] = data.map(d => ({ orderCode: String(d['Mã đơn'] ?? d['orderCode'] ?? ''), amountReceived: Number(d['Tiền nhận'] ?? d['amountReceived'] ?? 0), shippingFee: Number(d['Phí ship'] ?? d['shippingFee'] ?? 0), shippingProvider: String(d['Đơn vị VC'] ?? d['shippingProvider'] ?? 'GHN') })).filter(r => r.orderCode);
                if (parsed.length) setRows(parsed);
            } catch { setErr('File Excel không đúng định dạng'); }
        };
        reader.readAsBinaryString(file); e.target.value = '';
    };

    const handleReconcile = async () => {
        if (!warehouseId) { setErr('Vui lòng chọn chi nhánh'); return; }
        const valid = rows.filter(r => r.orderCode.trim());
        if (!valid.length) { setErr('Vui lòng nhập ít nhất 1 đơn hàng'); return; }
        setLoading(true); setErr('');
        try { const res = await financeService.reconcileCOD(valid, warehouseId); setResult(res); }
        catch (e: any) { setErr(e.response?.data?.message || 'Đối soát thất bại'); }
        finally { setLoading(false); }
    };

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ 'Mã đơn': 'ORD-001', 'Tiền nhận': 250000, 'Phí ship': 25000, 'Đơn vị VC': 'GHN' }]), 'COD Template');
        XLSX.writeFile(wb, 'COD_Template.xlsx');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography fontWeight={800} color="#fff" fontSize={16}>Đối soát COD</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)">Nhập file từ đơn vị vận chuyển để đối soát</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setErr('')}>{err}</Alert>}
                {!result ? (
                    <>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} displayEmpty>
                                    <MenuItem value="">Chọn chi nhánh *</MenuItem>
                                    {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button size="small" variant="outlined" startIcon={<Upload sx={{ fontSize: 15 }} />} onClick={() => fileRef.current?.click()} sx={{ textTransform: 'none', borderColor: '#0891b2', color: '#0891b2' }}>Import Excel</Button>
                            <Button size="small" variant="text" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />} onClick={downloadTemplate} sx={{ textTransform: 'none', color: '#6b7280' }}>Tải template</Button>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImportExcel} />
                            <Box sx={{ flex: 1 }} />
                            <Button size="small" startIcon={<Add sx={{ fontSize: 15 }} />} onClick={addRow} sx={{ textTransform: 'none', color: '#2563eb', fontWeight: 700 }}>Thêm dòng</Button>
                        </Box>
                        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f0fdfa' }}>
                                        {['Mã đơn hàng', 'Tiền nhận (₫)', 'Phí ship (₫)', 'Đơn vị VC', ''].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#0891b2' }}>{h}</TableCell>)}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell><TextField size="small" placeholder="ORD-001" value={row.orderCode} onChange={e => updateRow(i, 'orderCode', e.target.value)} /></TableCell>
                                            <TableCell><TextField size="small" type="number" value={row.amountReceived || ''} onChange={e => updateRow(i, 'amountReceived', Number(e.target.value))} /></TableCell>
                                            <TableCell><TextField size="small" type="number" value={row.shippingFee || ''} onChange={e => updateRow(i, 'shippingFee', Number(e.target.value))} /></TableCell>
                                            <TableCell>
                                                <FormControl size="small" sx={{ minWidth: 90 }}>
                                                    <Select value={row.shippingProvider} onChange={e => updateRow(i, 'shippingProvider', e.target.value)}>
                                                        {['GHN', 'GHTK', 'VTP', 'BEST', 'SPX'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>{rows.length > 1 && <IconButton size="small" onClick={() => removeRow(i)} sx={{ color: '#dc2626' }}><Close sx={{ fontSize: 16 }} /></IconButton>}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        <Box sx={{ p: 2, bgcolor: '#f0fdfa', borderRadius: 1.5, border: '1px solid #a7f3d0' }}>
                            <Typography variant="caption" color="#065f46" fontWeight={600}>
                                📋 Tổng: <strong>{rows.filter(r => r.orderCode).length}</strong> đơn ·
                                Tổng nhận: <strong>{fmtCurrency(rows.reduce((s, r) => s + r.amountReceived, 0))}</strong> ·
                                Phí ship: <strong>{fmtCurrency(rows.reduce((s, r) => s + r.shippingFee, 0))}</strong>
                            </Typography>
                        </Box>
                    </>
                ) : (
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <CheckCircle sx={{ fontSize: 52, color: '#16a34a', mb: 1 }} />
                            <Typography variant="h6" fontWeight={800} color="#111">Đối soát hoàn thành!</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {[{ label: 'Đơn khớp', value: result.matched, color: '#16a34a', bg: '#f0fdf4', icon: '✅' }, { label: 'Không tìm thấy', value: result.notFound, color: '#dc2626', bg: '#fef2f2', icon: '❌' }, { label: 'Tổng tiền nhận', value: fmtCurrency(result.totalReceived), color: '#2563eb', bg: '#eff6ff', icon: '💰' }, { label: 'Tổng phí ship', value: fmtCurrency(result.totalShippingFee), color: '#d97706', bg: '#fef3c7', icon: '🚚' }, { label: 'Thực nhận ròng', value: fmtCurrency(result.netAmount), color: '#065f46', bg: '#d1fae5', icon: '✨' }].map(s => (
                                <Grid size={{ xs: 6 }} key={s.label}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: s.bg, textAlign: 'center' }}>
                                        <Typography fontSize={24}>{s.icon}</Typography>
                                        <Typography fontWeight={800} color={s.color} fontSize={16}>{s.value}</Typography>
                                        <Typography variant="caption" color="#6b7280">{s.label}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                {!result ? (
                    <>
                        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                        <Button onClick={handleReconcile} variant="contained" disabled={loading} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, height: 36 }}>
                            {loading ? <><CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />Đang đối soát...</> : 'Thực hiện đối soát'}
                        </Button>
                    </>
                ) : (
                    <Button fullWidth onClick={() => { onDone(); onClose(); }} variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#16a34a', height: 40 }}>Hoàn thành</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// ── TAB 1: SỔ QUỸ
// ─────────────────────────────────────────────────────────────
const CashbookTab: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const userRole = userStr ? JSON.parse(userStr)?.user?.role : '';
    const userWarehouseId = userStr ? JSON.parse(userStr)?.user?.warehouseId : '';
    const isAdmin = userRole === 'ROLE_ADMIN';

    const [params, setParams] = useState({
        from: monthStart(), to: today(),
        warehouseId: isAdmin ? '' : userWarehouseId,
        fundType: '', transactionType: '',
        referenceType: '',   // ← BỘ LỌC LOẠI NGUỒN / CHỨNG TỪ
        keyword: '',
        page: 0, size: 20,
    });
    const [createOpen, setCreateOpen] = useState(false);
    const [balance, setBalance] = useState<Record<string, number>>({});
    const [loadingBalance, setLoadingBalance] = useState(false);

    const [systemTotal, setSystemTotal] = useState<number | null>(null);

    const loadBalance = useCallback(async () => {
        setLoadingBalance(true);
        try { 
            const res = await financeService.getBalance(params.warehouseId || undefined); 
            setBalance(res); 
            if (isAdmin && !params.warehouseId) {
                const total = await financeService.getTotalBalance();
                setSystemTotal(total);
            } else {
                setSystemTotal(null);
            }
        }
        catch { /* silent */ }
        finally { setLoadingBalance(false); }
    }, [params.warehouseId, isAdmin]);

    useEffect(() => { loadBalance(); }, [loadBalance]);

    const queryParams = {
        from: new Date(params.from).toISOString(),
        to: new Date(params.to + 'T23:59:59').toISOString(),
        warehouseId: params.warehouseId || undefined,
        fundType: params.fundType || undefined,
        transactionType: params.transactionType || undefined,
        // Khi chọn loại nguồn → dùng làm keyword; ngược lại dùng keyword tự nhập
        keyword: params.referenceType ? params.referenceType : (params.keyword || undefined),
    };

    const { data: cashbookData, isLoading, refetch } = useQuery({
        queryKey: ['cashbook', params],
        queryFn: () => financeService.searchCashbook({
            ...queryParams,
            page: params.page, size: params.size,
        }),
    });

    // ── Summary — SUM tại DB level, gọi SONG SONG với search (Promise.all pattern) ──
    // (Lý do xóa .reduce(): chỉ tính trên 1 trang data — sai hoàn toàn khi có phân trang)
    const { data: summaryData } = useQuery({
        queryKey: ['cashbook-summary', params.from, params.to, params.warehouseId, params.fundType, params.transactionType, params.referenceType, params.keyword],
        queryFn: () => financeService.getCashbookSummary(queryParams),
    });
    const totalIn = summaryData?.totalIn ?? 0;
    const totalOut = summaryData?.totalOut ?? 0;

    const transactions = cashbookData?.content ?? [];
    const totalPages = cashbookData?.totalPages ?? 0;
    const totalElements = cashbookData?.totalElements ?? 0;

    const handleExport = () => {
        exportToExcel(transactions, [
            { header: 'Ngày', key: 'createdAt', width: 22, formatter: (v: any) => fmtDateTime(v) },
            { header: 'Quỹ', key: 'fundType', width: 20, formatter: (v: any) => FUND_LABELS[v] ?? v },
            { header: 'Loại', key: 'transactionType', width: 10, formatter: (v: any) => v === 'IN' ? 'Thu' : 'Chi' },
            { header: 'Chứng từ', key: 'referenceType', width: 22, formatter: (v: any) => TX_REF_MAP[v]?.label ?? v },
            { header: 'Mô tả', key: 'description', width: 40 },
            { header: 'Số tiền', key: 'amount', width: 18, formatter: fmtVnd },
            { header: 'Số dư trước', key: 'balanceBefore', width: 18, formatter: fmtVnd },
            { header: 'Số dư sau', key: 'balanceAfter', width: 18, formatter: fmtVnd },
            { header: 'Người TH', key: 'createdBy', width: 20 },
        ], 'so-quy', 'Sổ Quỹ');
    };

    const set = (k: string) => (v: any) => setParams(p => ({ ...p, [k]: v, page: 0 }));

    const balanceCards = [
        ...(isAdmin && !params.warehouseId ? [{ label: 'Tổng quỹ hệ thống', key: '_systemTotal', color: '#7c3aed', bg: 'linear-gradient(135deg,#faf5ff,#e9d5ff)', border: '#c084fc', icon: '🌍', tag: 'TỔNG' }] : []),
        { label: 'Tiền mặt (TK 111)', key: 'CASH_111', color: '#16a34a', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#86efac', icon: '💵', tag: 'SỐ DƯ' },
        { label: 'Ngân hàng (TK 112)', key: 'BANK_112', color: '#2563eb', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#93c5fd', icon: '🏦', tag: 'SỐ DƯ' },
        { label: 'Tổng thu kỳ này', key: '_totalIn', color: '#0891b2', bg: 'linear-gradient(135deg,#f0fdfa,#ccfbf1)', border: '#67e8f9', icon: '⬆️', tag: 'THU' },
        { label: 'Tổng chi kỳ này', key: '_totalOut', color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fca5a5', icon: '⬇️', tag: 'CHI' },
    ];

    return (
        <Box>
            {/* Balance Cards */}
            <Box sx={{ mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {balanceCards.map(c => (
                    <Box key={c.key} sx={{ flex: '1 1 18%' }}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1.5px solid ${c.border}`, background: c.bg, boxShadow: `0 4px 12px ${c.border}50`, transition: 'transform 0.15s,box-shadow 0.15s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 20px ${c.border}70` } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                                <Typography fontSize={26} lineHeight={1}>{c.icon}</Typography>
                                <Box sx={{ px: 1, py: 0.35, borderRadius: 1, bgcolor: `${c.border}60`, border: `1px solid ${c.border}` }}>
                                    <Typography fontSize={9} fontWeight={800} color={c.color} letterSpacing={0.5}>{c.tag}</Typography>
                                </Box>
                            </Box>
                            {loadingBalance || isLoading ? <Skeleton height={30} sx={{ borderRadius: 1 }} /> : (
                                <Typography fontWeight={800} color={c.color} fontSize={17} letterSpacing="-0.5px" lineHeight={1.2}>
                                    {c.key === '_totalIn' ? fmtCurrency(totalIn) : 
                                     c.key === '_totalOut' ? fmtCurrency(totalOut) : 
                                     c.key === '_systemTotal' ? fmtCurrency(systemTotal ?? 0) :
                                     fmtCurrency(balance[c.key] ?? 0)}
                                </Typography>
                            )}
                            <Typography variant="caption" color="#6b7280" fontSize={11} mt={0.75} display="block">{c.label}</Typography>
                        </Paper>
                    </Box>
                ))}
            </Box>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Tìm kiếm — disable khi lọc theo loại nguồn */}
                    <TextField size="small"
                        placeholder={params.referenceType ? 'Đang lọc theo nguồn...' : 'Tìm nội dung, mô tả...'}
                        value={params.keyword}
                        disabled={!!params.referenceType}
                        onChange={e => set('keyword')(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment> }}
                        sx={{ flex: 1, minWidth: 160 }} />

                    {/* Từ ngày / Đến ngày */}
                    <TextField size="small" type="date" label="Từ ngày" value={params.from} onChange={e => set('from')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />
                    <TextField size="small" type="date" label="Đến ngày" value={params.to} onChange={e => set('to')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />

                    {/* Chi nhánh (chỉ admin) */}
                    {isAdmin && (
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select value={params.warehouseId} onChange={e => set('warehouseId')(e.target.value)} displayEmpty>
                                <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}

                    {/* Thu / Chi */}
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <Select value={params.transactionType} onChange={e => set('transactionType')(e.target.value)} displayEmpty>
                            <MenuItem value="">Cả Thu/Chi</MenuItem>
                            <MenuItem value="IN">⬆️ Chỉ Thu</MenuItem>
                            <MenuItem value="OUT">⬇️ Chỉ Chi</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Quỹ */}
                    <FormControl size="small" sx={{ minWidth: 155 }}>
                        <Select value={params.fundType} onChange={e => set('fundType')(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả quỹ</MenuItem>
                            <MenuItem value="CASH_111">💵 Tiền mặt</MenuItem>
                            <MenuItem value="BANK_112">🏦 Ngân hàng</MenuItem>
                        </Select>
                    </FormControl>

                    {/* ← LOẠI NGUỒN / CHỨNG TỪ */}
                    <FormControl size="small" sx={{ minWidth: 175 }}>
                        <Select
                            value={params.referenceType}
                            onChange={e => {
                                const v = e.target.value;
                                setParams(p => ({ ...p, referenceType: v, keyword: '', page: 0 }));
                            }}
                            displayEmpty
                        >
                            {REF_TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />} onClick={() => refetch()} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />} onClick={handleExport} sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a', borderRadius: 1.5, height: 36 }}>Excel</Button>
                    <Button variant="contained" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={() => setCreateOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, borderRadius: 1.5, height: 36 }}>Tạo phiếu</Button>
                </Box>
            </Paper>

            {/* Table: NGÀY | QUỸ | LOẠI | CHỨNG TỪ | MÔ TẢ | SỐ TIỀN | NGƯỜI TH | THAO TÁC */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                                {['Ngày', 'Quỹ', 'Loại', 'Chứng từ', 'Mô tả', 'Số tiền', 'Người TH', 'Thao tác'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#3730a3', py: 1.5, borderBottom: '2px solid #c7d2fe', letterSpacing: 0.3 }}>
                                        {h.toUpperCase()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7, 8].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                            ) : transactions.length > 0 ? (
                                transactions.map((t: any, idx: number) => {
                                    const refInfo = TX_REF_MAP[t.referenceType] ?? { label: t.referenceType || '—', color: '#6b7280', bg: '#f3f4f6' };
                                    const isIn = t.transactionType === 'IN';
                                    return (
                                        <TableRow key={t.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#f0f4ff' }, transition: 'background-color 0.1s' }}>

                                            {/* NGÀY */}
                                            <TableCell sx={{ py: 1.5, minWidth: 120 }}>
                                                <Typography variant="caption" fontFamily="monospace" fontSize={11} color="#374151">{fmtDateTime(t.createdAt)}</Typography>
                                            </TableCell>

                                            {/* QUỸ — chip màu */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip
                                                    label={t.fundType === 'CASH_111' ? 'Tiền mặt' : 'Ngân hàng'}
                                                    size="small"
                                                    sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: t.fundType === 'CASH_111' ? '#dcfce7' : '#dbeafe', color: t.fundType === 'CASH_111' ? '#16a34a' : '#2563eb' }}
                                                />
                                            </TableCell>

                                            {/* LOẠI: Thu / Chi với icon */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {isIn ? <TrendingUp sx={{ fontSize: 14, color: '#16a34a' }} /> : <TrendingDown sx={{ fontSize: 14, color: '#dc2626' }} />}
                                                    <Typography variant="caption" fontWeight={700} color={isIn ? '#16a34a' : '#dc2626'}>{isIn ? 'Thu' : 'Chi'}</Typography>
                                                </Box>
                                            </TableCell>

                                            {/* CHỨNG TỪ — tiếng Việt */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip label={refInfo.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: refInfo.bg, color: refInfo.color }} />
                                            </TableCell>

                                            {/* MÔ TẢ */}
                                            <TableCell sx={{ py: 1.5, maxWidth: 200 }}>
                                                <Tooltip title={t.description || ''} placement="top">
                                                    <Typography variant="caption" color="#374151" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                                                        {t.description || '—'}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>

                                            {/* SỐ TIỀN — badge màu */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.25, py: 0.4, borderRadius: 1.5, bgcolor: isIn ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isIn ? '#86efac' : '#fca5a5'}` }}>
                                                    <Typography fontWeight={800} fontSize={13} color={isIn ? '#16a34a' : '#dc2626'}>{isIn ? '+' : '-'}{fmtCurrency(t.amount)}</Typography>
                                                </Box>
                                            </TableCell>

                                            {/* NGƯỜI TH — avatar + tên rút gọn */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Tooltip title={t.createdBy || ''} placement="top">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <Avatar sx={{ width: 22, height: 22, bgcolor: '#e0e7ff', color: '#3730a3', fontSize: 10, fontWeight: 700 }}>
                                                            {(t.createdBy || '?').charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Typography variant="caption" color="#6b7280" fontWeight={500} sx={{ maxWidth: 90, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {formatCreatedBy(t.createdBy)}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>

                                            {/* THAO TÁC — nút in */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Tooltip title="In phiếu" placement="top">
                                                    <IconButton size="small" onClick={() => handlePrintReceipt(t)}
                                                        sx={{ color: '#6b7280', '&:hover': { color: '#16a34a', bgcolor: '#f0fdf4' }, borderRadius: 1.5 }}>
                                                        <Print sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <History sx={{ fontSize: 48, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography color="#9ca3af" fontSize={13}>Không có giao dịch nào trong khoảng thời gian này</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Footer tổng kết */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="#6b7280">Hiển thị <strong>{transactions.length}</strong> / <strong>{totalElements}</strong> giao dịch</Typography>
                        {!isLoading && transactions.length > 0 && (
                            <>
                                <Typography variant="caption" color="#16a34a" fontWeight={600}>↑ Thu: {fmtCurrency(totalIn)}</Typography>
                                <Typography variant="caption" color="#dc2626" fontWeight={600}>↓ Chi: {fmtCurrency(totalOut)}</Typography>
                                <Typography variant="caption" color="#374151" fontWeight={700}>= Chênh lệch: {fmtCurrency(totalIn - totalOut)}</Typography>
                            </>
                        )}
                    </Box>
                    {totalPages > 1 && (
                        <Pagination count={totalPages} page={params.page + 1} onChange={(_, v) => setParams(p => ({ ...p, page: v - 1 }))} size="small" color="primary" shape="rounded" />
                    )}
                </Box>
            </Paper>

            <CreateEntryDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={() => { refetch(); loadBalance(); }} warehouses={warehouses} />
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// ── TAB 2: CÔNG NỢ NCC
// ─────────────────────────────────────────────────────────────
const SupplierTotalDebtLabel: React.FC<{ supplierId: string }> = ({ supplierId }) => {
    const { data } = useQuery({
        queryKey: ['supplier-total-debt', supplierId],
        queryFn: () => financeService.getTotalOutstandingBySupplier(supplierId),
        staleTime: 300000,
    });
    if (data === undefined || data === 0) return null;
    return (
        <Typography variant="caption" color="#dc2626" fontWeight={700} sx={{ display: 'block', mt: 0.5 }}>
            Tổng nợ NCC: {fmtCurrency(data)}
        </Typography>
    );
};

const SupplierDebtTab: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const [payTarget, setPayTarget] = useState<SupplierDebt | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouseId, setWarehouseId] = useState(() => isAdmin ? '' : (currentUser?.warehouseId ?? ''));
    const [search, setSearch] = useState('');
    const [snack, setSnack] = useState('');
    const [page, setPage] = useState(0);
    const pageSize = 20;

    useEffect(() => { supplierService.getAllSimple().then(setSuppliers).catch(() => { }); }, []);

    const supplierMap = React.useMemo(() => { const m = new Map<string, Supplier>(); suppliers.forEach(s => m.set(s.id, s)); return m; }, [suppliers]);

    // ── Server-side pagination — thay thế fetch-all cũ gây memory issue ──
    const { data: debtsData, isLoading, refetch } = useQuery({
        queryKey: ['supplier-debts-paged', warehouseId, search, page],
        queryFn: () => financeService.getSupplierDebtsPaged({
            warehouseId: warehouseId || undefined,
            search: search || undefined,
            page,
            size: pageSize,
        }),
    });

    // ── Summary — SUM tại DB level, gọi SONG SONG với search ──
    // (Lý do xóa .reduce(): frontend cũ fetch toàn bộ list rồi tính, gây memory issue và sai khi data lớn)
    const { data: summaryData } = useQuery({
        queryKey: ['supplier-debts-summary', warehouseId, search],
        queryFn: () => financeService.getSupplierDebtSummary({
            warehouseId: warehouseId || undefined,
            search: search || undefined,
        }),
    });

    const debts = debtsData?.content ?? [];
    const totalPages = debtsData?.totalPages ?? 0;
    const totalElements = debtsData?.totalElements ?? 0;

    const totalRemaining = summaryData?.totalRemaining ?? 0;
    const totalPaid = summaryData?.totalPaid ?? 0;
    const totalDebt = summaryData?.totalDebt ?? 0;
    const suppliersWithDebtCount = summaryData?.suppliersWithDebtCount ?? 0;

    const handleExport = () => {
        exportToExcel(debts.map((d: any) => ({ ...d, supplierName: supplierMap.get(d.supplierId)?.name ?? d.supplierId })), [
            { header: 'Nhà cung cấp', key: 'supplierName', width: 30 },
            { header: 'Mã đơn nhập', key: 'purchaseOrderCode', width: 20 },
            { header: 'Tổng nợ', key: 'totalDebt', width: 18, formatter: fmtVnd },
            { header: 'Đã trả', key: 'paidAmount', width: 18, formatter: fmtVnd },
            { header: 'Còn lại', key: 'remainingAmount', width: 18, formatter: fmtVnd },
            { header: 'Trạng thái', key: 'status', width: 14, formatter: (v: any) => DEBT_STATUS_MAP[v]?.label ?? v },
            { header: 'Hạn trả', key: 'dueDate', width: 16, formatter: (v: any) => v ? fmtDate(v) : '—' },
        ], 'cong-no-ncc', 'Công Nợ NCC');
    };

    return (
        <Box>
            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {[
                    { label: 'Tổng nợ', value: fmtCurrency(totalDebt), color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fca5a5', icon: '📋' },
                    { label: 'Đã thanh toán', value: fmtCurrency(totalPaid), color: '#16a34a', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#86efac', icon: '✅' },
                    { label: 'Còn phải trả', value: fmtCurrency(totalRemaining), color: '#d97706', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#fde68a', icon: '⏳' },
                    { label: 'NCC có nợ', value: suppliersWithDebtCount, color: '#7c3aed', bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)', border: '#c4b5fd', icon: '🏢' },
                ].map(c => (
                    <Grid size={{ xs: 6, sm: 3 }} key={c.label}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1.5px solid ${c.border}`, background: c.bg, boxShadow: `0 4px 12px ${c.border}50`, transition: 'transform 0.15s', '&:hover': { transform: 'translateY(-2px)' } }}>
                            <Typography fontSize={26} display="block" mb={1} lineHeight={1}>{c.icon}</Typography>
                            <Typography fontWeight={800} color={c.color} fontSize={17} letterSpacing="-0.5px">{c.value}</Typography>
                            <Typography variant="caption" color="#6b7280" fontSize={11} mt={0.5} display="block">{c.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" placeholder="Tìm nhà cung cấp, mã đơn..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment> }}
                    sx={{ flex: 1, minWidth: 200 }} />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(0); }} displayEmpty disabled={!isAdmin}>
                        <MenuItem value="">Tất cả chi nhánh</MenuItem>
                        {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                    </Select>
                </FormControl>
                <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
                <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined />} onClick={handleExport} sx={{ textTransform: 'none', borderColor: '#7c3aed', color: '#7c3aed' }}>Excel</Button>
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#faf5ff' }}>
                                {['Nhà cung cấp', 'Mã đơn nhập', 'Chi nhánh', 'Tổng nợ', 'Đã trả', 'Còn lại', 'Hạn trả', 'Trạng thái', 'Thao tác'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#5b21b6', py: 1.5, borderBottom: '2px solid #e9d5ff', letterSpacing: 0.3 }}>{h.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3].map(i => <TableRow key={i}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                            ) : debts.length > 0 ? (
                                debts.map((d: any, idx: number) => {
                                    const supplier = supplierMap.get(d.supplierId);
                                    const st = DEBT_STATUS_MAP[d.status] ?? { label: d.status, color: '#666', bg: '#f3f4f6' };
                                    const pct = d.totalDebt > 0 ? Math.round((d.paidAmount / d.totalDebt) * 100) : 0;
                                    const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'PAID';
                                    return (
                                        <TableRow key={d.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#faf5ff' } }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#f3e8ff', color: '#7c3aed', fontSize: 13, fontWeight: 800 }}>{supplier?.name?.charAt(0) ?? 'N'}</Avatar>
                                                    <Box>
                                                        <Typography fontSize={13} fontWeight={600}>{supplier?.name ?? d.supplierId.slice(0, 8)}</Typography>
                                                        {supplier?.phone && <Typography variant="caption" color="#9ca3af" display="block">{supplier.phone}</Typography>}
                                                        <SupplierTotalDebtLabel supplierId={d.supplierId} />
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography variant="caption" fontFamily="monospace" color="#7c3aed" fontWeight={600}>{d.purchaseOrderCode || d.purchaseOrderId?.slice(0, 12) || '—'}</Typography></TableCell>
                                            <TableCell><Typography variant="caption" color="#6b7280">{d.warehouseName || '—'}</Typography></TableCell>
                                            <TableCell>
                                                <Typography fontWeight={700} fontSize={13}>{fmtCurrency(d.totalDebt)}</Typography>
                                                <LinearProgress variant="determinate" value={pct} sx={{ height: 4, mt: 0.5, borderRadius: 2, bgcolor: '#f3e8ff', '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }} />
                                            </TableCell>
                                            <TableCell><Typography fontSize={12} color="#16a34a" fontWeight={600}>{fmtCurrency(d.paidAmount)}</Typography></TableCell>
                                            <TableCell><Typography fontSize={13} fontWeight={800} color={d.remainingAmount > 0 ? '#dc2626' : '#16a34a'}>{fmtCurrency(d.remainingAmount)}</Typography></TableCell>
                                            <TableCell>
                                                {/* HẠN TRẢ — định dạng tiếng Việt */}
                                                <Typography variant="caption" color={isOverdue ? '#dc2626' : '#6b7280'} fontWeight={isOverdue ? 700 : 400}>
                                                    {d.dueDate ? fmtDate(d.dueDate) : '—'}{isOverdue && ' ⚠️'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {/* TRẠNG THÁI — tiếng Việt */}
                                                <Chip label={st.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: st.bg, color: st.color, borderRadius: 1.5 }} />
                                            </TableCell>
                                            <TableCell>
                                                {d.status !== 'PAID' && (
                                                    <Button size="small" variant="outlined" onClick={() => setPayTarget(d)}
                                                        sx={{ textTransform: 'none', fontSize: 11, borderColor: '#7c3aed', color: '#7c3aed', py: 0.4, px: 1.5, borderRadius: 1.5, '&:hover': { bgcolor: '#faf5ff', borderColor: '#5b21b6' } }}>
                                                        Thanh toán
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <CheckCircle sx={{ fontSize: 48, color: '#d1d5db', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography color="#9ca3af" fontSize={13}>Không có công nợ nào</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Footer: count + pagination */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="#6b7280">Hiển thị <strong>{debts.length}</strong> / <strong>{totalElements}</strong> công nợ</Typography>
                    {totalPages > 1 && (
                        <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} size="small" color="primary" shape="rounded" />
                    )}
                </Box>
            </Paper>

            <PayDebtDialog open={!!payTarget} debt={payTarget} supplierName={supplierMap.get(payTarget?.supplierId ?? '')?.name ?? ''} onClose={() => setPayTarget(null)} onPaid={() => { refetch(); setSnack('Thanh toán công nợ thành công!'); }} />
            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// ── TAB 3: ĐỐI SOÁT COD
// ─────────────────────────────────────────────────────────────
const CodTab: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    const [codOpen, setCodOpen] = useState(false);
    const [snack, setSnack] = useState('');

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} color="#111">Đối soát COD</Typography>
                    <Typography variant="body2" color="#6b7280" mt={0.5}>Đối chiếu tiền COD từ các đơn vị vận chuyển với hệ thống</Typography>
                </Box>
                <Button variant="contained" startIcon={<SwapHoriz />} onClick={() => setCodOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>Thực hiện đối soát</Button>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[{ icon: '📦', title: 'Nhập dữ liệu', desc: 'Nhập tay từng đơn hoặc import file Excel từ GHN, GHTK, VTP...' }, { icon: '🔍', title: 'Đối chiếu', desc: 'Hệ thống tự động so khớp mã đơn hàng và số tiền COD' }, { icon: '📊', title: 'Kết quả', desc: 'Xem báo cáo đơn khớp / không khớp và tổng thực nhận ròng' }, { icon: '✅', title: 'Xác nhận', desc: 'Ghi nhận vào sổ quỹ, tự động tạo phiếu thu COD' }].map(c => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={c.title}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', height: '100%', bgcolor: '#fff', transition: 'all 0.15s', '&:hover': { borderColor: '#67e8f9', boxShadow: '0 4px 12px #cffafe' } }}>
                            <Typography fontSize={32} mb={1}>{c.icon}</Typography>
                            <Typography fontWeight={700} fontSize={14} color="#111" mb={0.5}>{c.title}</Typography>
                            <Typography variant="caption" color="#6b7280" lineHeight={1.6}>{c.desc}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                <Typography fontWeight={700} color="#374151" mb={2}>Đơn vị vận chuyển hỗ trợ</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {['GHN', 'GHTK', 'Viettel Post', 'BEST Express', 'SPX Express', 'JT Express'].map(p => (
                        <Chip key={p} label={p} sx={{ fontWeight: 600, bgcolor: '#f0fdfa', color: '#0891b2', border: '1px solid #a7f3d0' }} />
                    ))}
                </Box>
                <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5 }}>
                    <Typography variant="caption">💡 Download template Excel, điền thông tin COD từ báo cáo của đơn vị vận chuyển, sau đó import vào hệ thống để đối soát tự động.</Typography>
                </Alert>
            </Paper>
            <CodReconcileDialog open={codOpen} onClose={() => setCodOpen(false)} warehouses={warehouses} onDone={() => setSnack('Đối soát COD hoàn thành!')} />
            <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const FinancePage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    useEffect(() => { warehouseService.getAll().then(setWarehouses).catch(() => { }); }, []);

    const TAB_LABELS = [
        { label: 'Sổ quỹ', icon: <AccountBalance sx={{ fontSize: 16 }} />, desc: 'Xem và tạo phiếu thu chi' },
        { label: 'Công nợ NCC', icon: <Business sx={{ fontSize: 16 }} />, desc: 'Quản lý thanh toán nhà cung cấp' },
        { label: 'Đối soát COD', icon: <SwapHoriz sx={{ fontSize: 16 }} />, desc: 'Đối chiếu tiền thu hộ' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>Dashboard / <strong style={{ color: '#6b7280' }}>Tài chính</strong></Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">Quản lý Tài chính</Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>Sổ quỹ, công nợ nhà cung cấp và đối soát COD</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {TAB_LABELS.map((t, i) => (
                    <Box key={i} onClick={() => setTab(i)} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', border: `1.5px solid ${tab === i ? '#1d4ed8' : '#e5e7eb'}`, bgcolor: tab === i ? '#eff6ff' : '#fff', transition: 'all 0.15s', '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' } }}>
                        <Box sx={{ color: tab === i ? '#1d4ed8' : '#6b7280' }}>{t.icon}</Box>
                        <Box>
                            <Typography fontSize={13} fontWeight={700} color={tab === i ? '#1d4ed8' : '#374151'}>{t.label}</Typography>
                            <Typography variant="caption" color="#9ca3af" fontSize={10.5}>{t.desc}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {tab === 0 && <CashbookTab warehouses={warehouses} />}
            {tab === 1 && <SupplierDebtTab warehouses={warehouses} />}
            {tab === 2 && <CodTab warehouses={warehouses} />}
        </Box>
    );
};

export default FinancePage;