// src/modules/admin/pages/finance/FinancePage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Grid, Button, TextField,
    InputAdornment, Chip, IconButton, Select, MenuItem,
    FormControl, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Skeleton, Alert, Snackbar,
    Dialog, DialogContent, DialogActions,
    Tooltip, Pagination, LinearProgress,
    Avatar, CircularProgress, Collapse, Badge,
} from '@mui/material';
import {
    Search, Refresh, Add, FileDownloadOutlined,
    AccountBalance, History, CheckCircle, Close, Upload,
    TrendingUp, TrendingDown, SwapHoriz, Business, Print,
    HourglassEmpty, ExpandMore, ExpandLess, TaskAlt, Block,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

import authService from '../../../../services/authService';
import financeService from '../../../../services/financeService';
import supplierService from '../../../../services/supplierService';
import warehouseService from '../../../../services/warehouseService';
import userService from '../../../../services/userService';
import { exportToExcel, fmtVnd } from '../../../../utils/excelExport';
import { SupplierDebt, FundType, TransactionType, Supplier, Warehouse } from '../../../../types';

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────
const INCOME_CATEGORIES = [
    { value: 'CUSTOMER_PAYMENT',  label: 'Thu nợ khách hàng' },
    { value: 'DEPOSIT_IN',        label: 'Thu tiền đặt cọc' },
    { value: 'ASSET_LIQUIDATION', label: 'Thu thanh lý tài sản' },
    { value: 'EVENT_INCOME',      label: 'Thu tiền sự kiện' },
    { value: 'OTHER_INCOME',      label: 'Thu nhập khác' },
];

const EXPENSE_CATEGORIES = [
    { value: 'SALARY',        label: 'Chi lương nhân viên' },
    { value: 'UTILITIES',     label: 'Chi điện nước' },
    { value: 'RENT',          label: 'Chi thuê mặt bằng' },
    { value: 'TRANSPORT_FEE', label: 'Chi vận chuyển' },
    { value: 'MARKETING',     label: 'Chi marketing / quảng cáo' },
    { value: 'SUPPLIES',      label: 'Chi văn phòng phẩm' },
    { value: 'MAINTENANCE',   label: 'Chi bảo trì thiết bị' },
    { value: 'OTHER_EXPENSE', label: 'Chi phí khác' },
];

// ─────────────────────────────────────────────────────────────
// MAP CHỨNG TỪ
// ─────────────────────────────────────────────────────────────
const TX_REF_MAP: Record<string, { label: string; color: string; bg: string }> = {
    INVOICE:              { label: 'Hoá đơn POS',        color: '#16a34a', bg: '#dcfce7' },
    SALE_POS:             { label: 'Bán hàng POS',        color: '#16a34a', bg: '#dcfce7' },
    SALE_ONLINE:          { label: 'Bán hàng Online',     color: '#2563eb', bg: '#dbeafe' },
    PURCHASE:             { label: 'Nhập kho',            color: '#d97706', bg: '#fef3c7' },
    PURCHASE_ORDER:       { label: 'Nhập kho',            color: '#d97706', bg: '#fef3c7' },
    SUPPLIER_DEBT:        { label: 'Trả nợ NCC',          color: '#7c3aed', bg: '#ede9fe' },
    SUPPLIER_PAYMENT:     { label: 'Trả nợ NCC',          color: '#7c3aed', bg: '#ede9fe' },
    COD_RECONCILE:        { label: 'Đối soát COD',        color: '#065f46', bg: '#d1fae5' },
    COD_RECONCILIATION:   { label: 'Đối soát COD',        color: '#065f46', bg: '#d1fae5' },
    SHIFT_OPEN:           { label: 'Mở ca',               color: '#9ca3af', bg: '#f3f4f6' },
    SHIFT_CLOSE:          { label: 'Đóng ca',             color: '#9ca3af', bg: '#f3f4f6' },
    REFUND:               { label: 'Hoàn tiền',           color: '#d97706', bg: '#fef3c7' },
    RETURN:               { label: 'Trả hàng',            color: '#2e7d32', bg: '#e8f5e9' },
    ADJUSTMENT:           { label: 'Điều chỉnh',          color: '#e65100', bg: '#fff3e0' },
    MANUAL:               { label: 'Thủ công',            color: '#6b7280', bg: '#f3f4f6' },
    MANUAL_IN:            { label: 'Thu thủ công',        color: '#0891b2', bg: '#cffafe' },
    MANUAL_OUT:           { label: 'Chi thủ công',        color: '#dc2626', bg: '#fee2e2' },
    EXPENSE:              { label: 'Chi phí vận hành',    color: '#dc2626', bg: '#fee2e2' },
    // Thu categories
    CUSTOMER_PAYMENT:     { label: 'Thu nợ KH',           color: '#0891b2', bg: '#cffafe' },
    DEPOSIT_IN:           { label: 'Thu đặt cọc',         color: '#059669', bg: '#d1fae5' },
    ASSET_LIQUIDATION:    { label: 'Thu thanh lý',        color: '#047857', bg: '#ecfdf5' },
    EVENT_INCOME:         { label: 'Thu sự kiện',         color: '#0284c7', bg: '#e0f2fe' },
    OTHER_INCOME:         { label: 'Thu nhập khác',       color: '#0891b2', bg: '#cffafe' },
    // Chi categories
    SALARY:               { label: 'Chi lương',           color: '#b45309', bg: '#fef3c7' },
    UTILITIES:            { label: 'Chi điện nước',       color: '#7c3aed', bg: '#ede9fe' },
    RENT:                 { label: 'Chi thuê mặt bằng',   color: '#6d28d9', bg: '#ede9fe' },
    TRANSPORT_FEE:        { label: 'Chi vận chuyển',      color: '#0369a1', bg: '#e0f2fe' },
    MARKETING:            { label: 'Chi marketing',       color: '#db2777', bg: '#fce7f3' },
    SUPPLIES:             { label: 'Chi VP phẩm',         color: '#0f766e', bg: '#ccfbf1' },
    MAINTENANCE:          { label: 'Chi bảo trì',         color: '#4338ca', bg: '#e0e7ff' },
    OTHER_EXPENSE:        { label: 'Chi phí khác',        color: '#dc2626', bg: '#fee2e2' },
};

const FUND_LABELS: Record<string, string> = {
    CASH_111: 'Tiền mặt (TK 111)',
    BANK_112: 'Ngân hàng (TK 112)',
};

const DEBT_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    UNPAID:  { label: 'Chưa trả',  color: '#dc2626', bg: '#fee2e2' },
    PARTIAL: { label: 'Một phần',  color: '#d97706', bg: '#fef3c7' },
    PAID:    { label: 'Đã trả',    color: '#16a34a', bg: '#dcfce7' },
};

const REF_TYPE_OPTIONS = [
    { value: '',                  label: 'Tất cả nguồn' },
    { value: 'INVOICE',           label: 'Hoá đơn POS' },
    { value: 'SALE_ONLINE',       label: 'Bán hàng Online' },
    { value: 'PURCHASE_ORDER',    label: 'Nhập kho' },
    { value: 'SUPPLIER_PAYMENT',  label: 'Trả nợ NCC' },
    { value: 'COD_RECONCILIATION',label: 'Đối soát COD' },
    { value: 'CUSTOMER_PAYMENT',  label: 'Thu nợ KH' },
    { value: 'DEPOSIT_IN',        label: 'Thu đặt cọc' },
    { value: 'ASSET_LIQUIDATION', label: 'Thu thanh lý' },
    { value: 'EVENT_INCOME',      label: 'Thu sự kiện' },
    { value: 'OTHER_INCOME',      label: 'Thu nhập khác' },
    { value: 'SALARY',            label: 'Chi lương' },
    { value: 'UTILITIES',         label: 'Chi điện nước' },
    { value: 'RENT',              label: 'Chi thuê mặt bằng' },
    { value: 'TRANSPORT_FEE',     label: 'Chi vận chuyển' },
    { value: 'MARKETING',         label: 'Chi marketing' },
    { value: 'SUPPLIES',          label: 'Chi văn phòng phẩm' },
    { value: 'MAINTENANCE',       label: 'Chi bảo trì' },
    { value: 'OTHER_EXPENSE',     label: 'Chi phí khác' },
    { value: 'SHIFT_OPEN',        label: 'Mở ca' },
    { value: 'SHIFT_CLOSE',       label: 'Đóng ca' },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtCurrency = (n?: number) => {
    if (n == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
};
const fmtDate = (s: string) => { try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; } };
const fmtDateTime = (s: string) => {
    try { return new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
};
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────
// IN PHIẾU THU / CHI
// ─────────────────────────────────────────────────────────────
const handlePrintReceipt = (txn: any) => {
    const isIn = txn.transactionType === 'IN';
    const typeStr = isIn ? 'PHIẾU THU' : 'PHIẾU CHI';
    const personLabel = isIn ? 'Người nộp tiền' : 'Người nhận tiền';
    const refInfo = TX_REF_MAP[txn.referenceType] ?? { label: txn.referenceType || '—', color: '#666', bg: '#f3f4f6' };
    const date = txn.createdAt ? new Date(txn.createdAt) : new Date();
    const dateStr = `Ngày ${date.getDate().toString().padStart(2,'0')} tháng ${(date.getMonth()+1).toString().padStart(2,'0')} năm ${date.getFullYear()}`;

    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${typeStr}</title>
    <style>
      body{font-family:'Times New Roman',serif;color:#000;padding:40px;font-size:15px}
      .hdr{display:flex;justify-content:space-between;margin-bottom:30px}
      h1{text-align:center;font-size:24px;margin:0}
      .sub{text-align:center;font-style:italic;margin:6px 0 20px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      td{padding:9px 4px;border-bottom:1px dotted #ccc;vertical-align:top}
      .lbl{width:190px;font-weight:bold}
      .amt{font-weight:bold;font-size:19px;border:2px solid #000;padding:6px 14px;display:inline-block;margin-top:2px}
      .sigs{display:flex;justify-content:space-between;margin-top:54px;text-align:center}
      .sig{width:30%}.sig b{display:block;margin-bottom:4px}.sig i{font-size:12px;color:#555}
    </style></head>
    <body onload="window.print();window.close();">
      <div class="hdr">
        <div><b>HỆ THỐNG CỬA HÀNG SÁCH</b><br/><span style="font-size:12px">Mã phiếu: ${txn.id?.slice(0,12)??'—'}</span></div>
        <div style="text-align:right"><b>Mẫu số: ${isIn?'01-TT':'02-TT'}</b><br/><span style="font-size:12px">Theo TT 200/2014/TT-BTC</span></div>
      </div>
      <h1>${typeStr}</h1>
      <p class="sub">${dateStr}</p>
      <table>
        <tr><td class="lbl">Loại giao dịch:</td><td>${refInfo.label}</td></tr>
        <tr><td class="lbl">${personLabel}:</td><td><b>${txn.personName||txn.createdBy||'—'}</b></td></tr>
        <tr><td class="lbl">Loại quỹ:</td><td>${FUND_LABELS[txn.fundType]||txn.fundType||'—'}</td></tr>
        <tr><td class="lbl">Nội dung:</td><td>${txn.description||'—'}</td></tr>
        <tr><td class="lbl">Số tiền:</td><td><span class="amt">${fmtCurrency(txn.amount)}</span></td></tr>
        <tr><td class="lbl">Người lập phiếu:</td><td>${txn.createdBy||'—'}</td></tr>
      </table>
      <div class="sigs">
        <div class="sig"><b>Người lập phiếu</b><i>(Ký, họ tên)</i><br/><br/><br/></div>
        <div class="sig"><b>${personLabel}</b><i>(Ký, họ tên)</i><br/><br/><br/></div>
        <div class="sig"><b>Thủ quỹ</b><i>(Ký, họ tên)</i><br/><br/><br/></div>
      </div>
    </body></html>`;

    const w = window.open('','_blank');
    if (w) { w.document.write(html); w.document.close(); }
};

// ─────────────────────────────────────────────────────────────
// 1. CREATE ENTRY DIALOG — enhanced
// ─────────────────────────────────────────────────────────────
const CreateEntryDialog: React.FC<{
    open: boolean; onClose: () => void; onSaved: () => void; warehouses: Warehouse[];
}> = ({ open, onClose, onSaved, warehouses }) => {
    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';
    const myWarehouseId = !isAdmin ? (currentUser?.warehouseId ?? '') : '';

    type Step = 'form' | 'success-direct' | 'success-pending';
    const [step, setStep] = useState<Step>('form');
    const [createdEntry, setCreatedEntry] = useState<any>(null);
    const [form, setForm] = useState({
        warehouseId: myWarehouseId, fundType: 'CASH_111' as FundType,
        transactionType: 'IN' as TransactionType, category: '',
        amount: '', description: '', personName: '',
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (open) {
            setStep('form'); setCreatedEntry(null); setErr('');
            setForm({ warehouseId: myWarehouseId, fundType: 'CASH_111', transactionType: 'IN', category: '', amount: '', description: '', personName: '' });
        }
    }, [open]);

    const isThu = form.transactionType === 'IN';
    const categories = isThu ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const handleSave = async () => {
        if (!form.warehouseId) { setErr('Vui lòng chọn chi nhánh'); return; }
        if (!form.category) { setErr(`Vui lòng chọn loại ${isThu ? 'thu' : 'chi'}`); return; }
        if (!form.amount || Number(form.amount) <= 0) { setErr('Số tiền phải lớn hơn 0'); return; }
        if (!form.description.trim()) { setErr('Vui lòng nhập nội dung'); return; }
        setSaving(true); setErr('');
        const payload = {
            warehouseId: form.warehouseId, fundType: form.fundType,
            transactionType: form.transactionType, referenceType: form.category,
            amount: Number(form.amount), description: form.description.trim(),
            personName: form.personName.trim() || undefined,
        };
        try {
            if (isAdmin) {
                const result = await financeService.createEntry(payload);
                setCreatedEntry({ ...result, personName: form.personName.trim() });
                setStep('success-direct');
            } else {
                await financeService.createPendingEntry(payload);
                setStep('success-pending');
            }
            onSaved();
        } catch (e: any) {
            setErr(e.response?.data?.message || 'Tạo phiếu thất bại');
        } finally { setSaving(false); }
    };

    const headerBg = step === 'success-pending'
        ? 'linear-gradient(135deg,#d97706,#b45309)'
        : isThu ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)';

    return (
        <Dialog open={open} onClose={step !== 'form' ? onClose : undefined} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: headerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {step === 'form' ? (isThu ? <TrendingUp sx={{ color: '#fff', fontSize: 22 }} /> : <TrendingDown sx={{ color: '#fff', fontSize: 22 }} />) :
                     step === 'success-direct' ? <CheckCircle sx={{ color: '#fff', fontSize: 22 }} /> : <HourglassEmpty sx={{ color: '#fff', fontSize: 22 }} />}
                    <Box>
                        <Typography fontWeight={800} color="#fff" fontSize={16}>
                            {step === 'form' ? (isThu ? 'Tạo Phiếu Thu' : 'Tạo Phiếu Chi')
                             : step === 'success-direct' ? 'Tạo phiếu thành công!'
                             : 'Gửi phiếu chờ duyệt!'}
                        </Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.8)">
                            {step === 'form' ? (isAdmin ? 'Admin — áp dụng vào quỹ ngay' : 'Nhân viên — phiếu sẽ gửi quản lý duyệt')
                             : step === 'success-direct' ? 'Quỹ đã được cập nhật'
                             : 'Đang chờ quản lý phê duyệt'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {/* ── FORM STEP ── */}
                {step === 'form' && (
                    <>
                        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{err}</Alert>}
                        {!isAdmin && (
                            <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5, fontSize: 12 }}>
                                Phiếu do nhân viên tạo sẽ được gửi quản lý duyệt trước khi áp dụng vào quỹ.
                            </Alert>
                        )}
                        {/* Thu / Chi selector */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                            {[{ v: 'IN', label: '💰 Phiếu Thu', c: '#16a34a', bg: '#dcfce7' }, { v: 'OUT', label: '💸 Phiếu Chi', c: '#dc2626', bg: '#fee2e2' }].map(opt => (
                                <Box key={opt.v} onClick={() => setForm(f => ({ ...f, transactionType: opt.v as TransactionType, category: '' }))}
                                    sx={{ flex: 1, p: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center', border: `2px solid ${form.transactionType === opt.v ? opt.c : '#e5e7eb'}`, bgcolor: form.transactionType === opt.v ? opt.bg : 'transparent', transition: 'all .15s' }}>
                                    <Typography fontWeight={700} fontSize={14} color={form.transactionType === opt.v ? opt.c : '#6b7280'}>{opt.label}</Typography>
                                </Box>
                            ))}
                        </Box>
                        <Grid container spacing={2}>
                            {/* Loại */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Loại {isThu ? 'thu nhập' : 'chi phí'} *</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} displayEmpty>
                                        <MenuItem value="" disabled>— Chọn loại {isThu ? 'thu' : 'chi'} —</MenuItem>
                                        {categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {/* Chi nhánh + Quỹ */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Chi nhánh *</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} displayEmpty disabled={!isAdmin}>
                                        <MenuItem value="">Chọn chi nhánh</MenuItem>
                                        {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Quỹ</Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={form.fundType} onChange={e => setForm(f => ({ ...f, fundType: e.target.value as FundType }))}>
                                        <MenuItem value="CASH_111">💵 Tiền mặt (TK 111)</MenuItem>
                                        <MenuItem value="BANK_112">🏦 Ngân hàng (TK 112)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {/* Số tiền + Người nộp/nhận */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Số tiền *</Typography>
                                <TextField fullWidth size="small" placeholder="0" inputProps={{ inputMode: 'numeric' }}
                                    value={form.amount ? Number(form.amount).toLocaleString('vi-VN') : ''}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/\D/g,'') }))}
                                    InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>{isThu ? 'Người nộp tiền' : 'Người nhận tiền'}</Typography>
                                <TextField fullWidth size="small" placeholder={isThu ? 'Tên người nộp...' : 'Tên người nhận...'}
                                    value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))} />
                            </Grid>
                            {/* Nội dung */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Nội dung *</Typography>
                                <TextField fullWidth size="small" multiline rows={2} placeholder="Mô tả nội dung giao dịch..."
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </Grid>
                        </Grid>
                        {/* Preview */}
                        {form.amount && Number(form.amount) > 0 && form.category && (
                            <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: isThu ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isThu ? '#bbf7d0' : '#fecaca'}` }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color={isThu ? '#15803d' : '#dc2626'} display="block">
                                            {isThu ? '+ Thu' : '- Chi'}: {fmtCurrency(Number(form.amount))}
                                        </Typography>
                                        <Typography variant="caption" color="#6b7280">
                                            {TX_REF_MAP[form.category]?.label || form.category} · {FUND_LABELS[form.fundType]}
                                        </Typography>
                                    </Box>
                                    {!isAdmin && <Chip label="Chờ duyệt" size="small" icon={<HourglassEmpty sx={{ fontSize: 12 }}/>} sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: 11 }} />}
                                </Box>
                            </Box>
                        )}
                    </>
                )}

                {/* ── SUCCESS DIRECT ── */}
                {step === 'success-direct' && createdEntry && (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                        <CheckCircle sx={{ fontSize: 56, color: '#16a34a', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight={800} color="#111" mb={0.5}>Tạo phiếu thành công!</Typography>
                        <Typography variant="body2" color="#6b7280" mb={2.5}>Quỹ đã được cập nhật ngay lập tức.</Typography>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'left', mb: 3 }}>
                            {[
                                { label: 'Loại', value: <Chip label={TX_REF_MAP[createdEntry.referenceType]?.label || createdEntry.referenceType} size="small" sx={{ height: 20, fontSize: 10, bgcolor: TX_REF_MAP[createdEntry.referenceType]?.bg, color: TX_REF_MAP[createdEntry.referenceType]?.color }} /> },
                                { label: 'Số tiền', value: <Typography fontWeight={800} fontSize={14} color={createdEntry.transactionType === 'IN' ? '#16a34a' : '#dc2626'}>{createdEntry.transactionType === 'IN' ? '+' : '-'}{fmtCurrency(createdEntry.amount)}</Typography> },
                                ...(createdEntry.personName ? [{ label: createdEntry.transactionType === 'IN' ? 'Người nộp' : 'Người nhận', value: <Typography variant="caption" fontWeight={600}>{createdEntry.personName}</Typography> }] : []),
                                { label: 'Nội dung', value: <Typography variant="caption" color="#374151">{createdEntry.description}</Typography> },
                            ].map(row => (
                                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" color="#6b7280">{row.label}</Typography>
                                    {row.value}
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button fullWidth variant="outlined" startIcon={<Print />} onClick={() => handlePrintReceipt(createdEntry)}
                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#2563eb', color: '#2563eb', borderRadius: 1.5, height: 42 }}>
                                In phiếu ngay
                            </Button>
                            <Button fullWidth variant="contained" onClick={onClose}
                                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 1.5, height: 42 }}>
                                Đóng
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* ── SUCCESS PENDING ── */}
                {step === 'success-pending' && (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                        <HourglassEmpty sx={{ fontSize: 56, color: '#d97706', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight={800} color="#111" mb={0.5}>Phiếu đã gửi chờ duyệt!</Typography>
                        <Typography variant="body2" color="#6b7280" mb={2.5}>Quản lý sẽ xem xét và phê duyệt phiếu của bạn.</Typography>
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 1.5, textAlign: 'left' }}>
                            Số dư quỹ chưa thay đổi cho đến khi quản lý phê duyệt.
                        </Alert>
                        <Button fullWidth variant="contained" onClick={onClose}
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' }, borderRadius: 1.5, height: 42 }}>
                            Đã hiểu, đóng
                        </Button>
                    </Box>
                )}
            </DialogContent>

            {step === 'form' && (
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: isThu ? '#16a34a' : '#ef4444', '&:hover': { filter: 'brightness(0.9)' }, height: 36, minWidth: 160 }}>
                        {saving ? <><CircularProgress size={14} sx={{ mr: 1, color: '#fff' }} />Đang xử lý...</> : isAdmin ? `Tạo ${isThu ? 'Phiếu Thu' : 'Phiếu Chi'}` : `Gửi duyệt ${isThu ? 'Phiếu Thu' : 'Phiếu Chi'}`}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// 2. REJECT REASON DIALOG
// ─────────────────────────────────────────────────────────────
const RejectReasonDialog: React.FC<{
    open: boolean; entryId: string | null; onClose: () => void; onRejected: () => void;
}> = ({ open, entryId, onClose, onRejected }) => {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    useEffect(() => { if (open) { setReason(''); setErr(''); } }, [open]);

    const handleReject = async () => {
        if (!entryId) return;
        if (!reason.trim()) { setErr('Vui lòng nhập lý do từ chối'); return; }
        setSaving(true);
        try { await financeService.rejectEntry(entryId, reason.trim()); onRejected(); onClose(); }
        catch (e: any) { setErr(e.response?.data?.message || 'Từ chối thất bại'); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Block sx={{ color: '#fff', fontSize: 20 }} />
                    <Typography fontWeight={800} color="#fff" fontSize={15}>Từ chối phiếu</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small"><Close /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Lý do từ chối *</Typography>
                <TextField fullWidth multiline rows={3} size="small" placeholder="Nhập lý do từ chối phiếu này..."
                    value={reason} onChange={e => setReason(e.target.value)} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                <Button onClick={handleReject} variant="contained" disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, height: 36 }}>
                    {saving ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// 3. PENDING VOUCHERS SECTION (admin-only)
// ─────────────────────────────────────────────────────────────
const PendingVouchersSection: React.FC<{
    warehouseId: string; onRefresh: () => void;
}> = ({ warehouseId, onRefresh }) => {
    const [expanded, setExpanded] = useState(true);
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);
    const [approving, setApproving] = useState<string | null>(null);

    const { data: pending = [], isLoading, refetch, error } = useQuery({
        queryKey: ['pending-cashbook', warehouseId],
        queryFn: () => financeService.getPendingEntries(warehouseId || undefined),
        retry: false, staleTime: 0,
    });

    if (error) return (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700} display="block">Tính năng phê duyệt phiếu cần thêm backend:</Typography>
            <Typography variant="caption" color="#6b7280" component="span">
                <code>POST /finance/cashbook/pending</code> · <code>GET /finance/cashbook/pending</code> · <code>PUT /finance/cashbook/{'{id}'}/approve</code> · <code>PUT /finance/cashbook/{'{id}'}/reject</code>
            </Typography>
        </Alert>
    );

    if (isLoading) return <Skeleton height={80} sx={{ mb: 2, borderRadius: 2 }} />;
    if (!pending.length) return null;

    const handleApprove = async (id: string) => {
        setApproving(id);
        try { await financeService.approveEntry(id); refetch(); onRefresh(); }
        catch { /* silent */ }
        finally { setApproving(null); }
    };

    return (
        <>
            <Paper elevation={0} sx={{ mb: 2.5, borderRadius: 2, border: '1.5px solid #fde68a', bgcolor: '#fffbeb', overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#fef3c7' } }}
                    onClick={() => setExpanded(e => !e)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HourglassEmpty sx={{ color: '#d97706', fontSize: 20 }} />
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography fontWeight={800} fontSize={14} color="#92400e">Phiếu chờ duyệt</Typography>
                                <Badge badgeContent={pending.length} color="warning" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }} />
                            </Box>
                            <Typography variant="caption" color="#b45309">Nhân viên đã gửi, đang chờ quản lý phê duyệt</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); refetch(); }} sx={{ color: '#d97706' }}><Refresh sx={{ fontSize: 16 }} /></IconButton>
                        {expanded ? <ExpandLess sx={{ color: '#d97706' }} /> : <ExpandMore sx={{ color: '#d97706' }} />}
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#fef3c7' }}>
                                    {['Ngày tạo','Loại','Danh mục','Người nộp/nhận','Số tiền','Nội dung','Người tạo','Thao tác'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#92400e', py: 1, borderBottom: '1px solid #fde68a' }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pending.map((entry: any) => {
                                    const isIn = entry.transactionType === 'IN';
                                    const refInfo = TX_REF_MAP[entry.referenceType] ?? { label: entry.referenceType || '—', color: '#6b7280', bg: '#f3f4f6' };
                                    return (
                                        <TableRow key={entry.id} hover sx={{ '&:hover': { bgcolor: '#fffbeb' } }}>
                                            <TableCell><Typography variant="caption" fontFamily="monospace" fontSize={11}>{fmtDateTime(entry.createdAt)}</Typography></TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {isIn ? <TrendingUp sx={{ fontSize: 13, color: '#16a34a' }} /> : <TrendingDown sx={{ fontSize: 13, color: '#dc2626' }} />}
                                                    <Typography variant="caption" fontWeight={700} color={isIn ? '#16a34a' : '#dc2626'}>{isIn ? 'Thu' : 'Chi'}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Chip label={refInfo.label} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: refInfo.bg, color: refInfo.color, borderRadius: 1 }} /></TableCell>
                                            <TableCell><Typography variant="caption" color="#374151">{entry.personName || '—'}</Typography></TableCell>
                                            <TableCell>
                                                <Typography fontWeight={800} fontSize={12} color={isIn ? '#16a34a' : '#dc2626'}>
                                                    {isIn ? '+' : '-'}{fmtCurrency(entry.amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 150 }}>
                                                <Tooltip title={entry.description || ''}><Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{entry.description || '—'}</Typography></Tooltip>
                                            </TableCell>
                                            <TableCell><Typography variant="caption" color="#6b7280">{entry.createdBy || '—'}</Typography></TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                                    <Tooltip title="Duyệt phiếu">
                                                        <span>
                                                            <IconButton size="small" disabled={approving === entry.id} onClick={() => handleApprove(entry.id)}
                                                                sx={{ bgcolor: '#dcfce7', color: '#16a34a', '&:hover': { bgcolor: '#bbf7d0' }, borderRadius: 1.5, width: 28, height: 28 }}>
                                                                {approving === entry.id ? <CircularProgress size={12} /> : <TaskAlt sx={{ fontSize: 16 }} />}
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip title="Từ chối">
                                                        <IconButton size="small" onClick={() => setRejectTarget(entry.id)}
                                                            sx={{ bgcolor: '#fee2e2', color: '#dc2626', '&:hover': { bgcolor: '#fecaca' }, borderRadius: 1.5, width: 28, height: 28 }}>
                                                            <Block sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Collapse>
            </Paper>
            <RejectReasonDialog open={!!rejectTarget} entryId={rejectTarget} onClose={() => setRejectTarget(null)} onRejected={() => { refetch(); onRefresh(); }} />
        </>
    );
};

// ─────────────────────────────────────────────────────────────
// 4. PAY SUPPLIER DEBT DIALOG — with success screen + print
// ─────────────────────────────────────────────────────────────
const PayDebtDialog: React.FC<{
    open: boolean; debt: SupplierDebt | null; supplierName: string;
    onClose: () => void; onPaid: (updatedDebt: any, paidAmount: number, fundType: string) => void;
}> = ({ open, debt, supplierName, onClose, onPaid }) => {
    const [amount, setAmount] = useState('');
    const [fundType, setFundType] = useState('CASH_111');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [done, setDone] = useState<{ paidAmount: number; remaining: number; status: string } | null>(null);

    useEffect(() => {
        if (open && debt) { setAmount(String(debt.remainingAmount)); setFundType('CASH_111'); setNote(''); setErr(''); setDone(null); }
    }, [open, debt]);

    const handlePay = async () => {
        if (!debt) return;
        const amt = Number(amount);
        if (amt <= 0) { setErr('Số tiền phải lớn hơn 0'); return; }
        if (amt > debt.remainingAmount) { setErr(`Vượt quá dư nợ còn lại (${fmtCurrency(debt.remainingAmount)})`); return; }
        setSaving(true); setErr('');
        try {
            const result = await financeService.paySupplierDebt({ supplierDebtId: debt.id, amount: amt, fundType, note: note || undefined });
            const newRemaining = Math.max(0, debt.remainingAmount - amt);
            const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIAL';
            setDone({ paidAmount: amt, remaining: newRemaining, status: newStatus });
            onPaid(result ?? { ...debt, paidAmount: debt.paidAmount + amt, remainingAmount: newRemaining, status: newStatus }, amt, fundType);
        } catch (e: any) { setErr(e.response?.data?.message || 'Thanh toán thất bại'); }
        finally { setSaving(false); }
    };

    const handlePrintReceipt = () => {
        if (!debt || !done) return;
        const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Phiếu Chi</title>
        <style>body{font-family:'Times New Roman',serif;padding:40px;font-size:15px}h1{text-align:center;font-size:22px}
        .sub{text-align:center;font-style:italic;margin:4px 0 20px}table{width:100%;border-collapse:collapse;margin-top:14px}
        td{padding:8px 4px;border-bottom:1px dotted #ccc;vertical-align:top}.lbl{width:180px;font-weight:bold}
        .amt{font-weight:bold;font-size:18px;border:2px solid #000;padding:5px 14px;display:inline-block}
        .sigs{display:flex;justify-content:space-between;margin-top:50px;text-align:center}.sig{width:30%}</style>
        </head><body onload="window.print();window.close();">
        <h1>PHIẾU CHI THANH TOÁN NHÀ CUNG CẤP</h1>
        <p class="sub">Ngày ${new Date().toLocaleDateString('vi-VN')}</p>
        <table>
            <tr><td class="lbl">Nhà cung cấp:</td><td><b>${supplierName}</b></td></tr>
            <tr><td class="lbl">Mã đơn nhập:</td><td>${debt.purchaseOrderCode || '—'}</td></tr>
            <tr><td class="lbl">Hình thức:</td><td>${fundType === 'CASH_111' ? 'Tiền mặt (TK 111)' : 'Ngân hàng (TK 112)'}</td></tr>
            <tr><td class="lbl">Số tiền thanh toán:</td><td><span class="amt">${fmtCurrency(done.paidAmount)}</span></td></tr>
            <tr><td class="lbl">Ghi chú:</td><td>${note || '—'}</td></tr>
            <tr><td class="lbl">Còn lại sau TT:</td><td><b>${fmtCurrency(done.remaining)}</b></td></tr>
        </table>
        <div class="sigs">
            <div class="sig"><b>Người lập phiếu</b><br/><br/><br/><i>(Ký, họ tên)</i></div>
            <div class="sig"><b>Thủ quỹ</b><br/><br/><br/><i>(Ký, họ tên)</i></div>
            <div class="sig"><b>Đại diện NCC</b><br/><br/><br/><i>(Ký, họ tên)</i></div>
        </div></body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); }
    };

    if (!debt) return null;
    const pct = debt.totalDebt > 0 ? Math.round((debt.paidAmount / debt.totalDebt) * 100) : 0;
    const amt = Number(amount) || 0;

    return (
        <Dialog open={open} onClose={done ? onClose : undefined} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: done ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography fontWeight={800} color="#fff" fontSize={16}>{done ? 'Thanh toán thành công!' : 'Thanh toán công nợ'}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)">{supplierName}</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
            <DialogContent sx={{ p: 3 }}>
                {/* ── SUCCESS SCREEN ── */}
                {done ? (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                        <CheckCircle sx={{ fontSize: 54, color: '#16a34a', mb: 1.5 }} />
                        <Typography fontWeight={800} fontSize={17} color="#111" mb={0.5}>Đã thanh toán {fmtCurrency(done.paidAmount)}</Typography>
                        <Typography variant="body2" color="#6b7280" mb={2.5}>
                            {done.status === 'PAID' ? '✅ Khoản nợ đã tất toán hoàn toàn!' : `Còn lại: ${fmtCurrency(done.remaining)}`}
                        </Typography>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb', border: '1px solid #e5e7eb', mb: 3, textAlign: 'left' }}>
                            {[
                                { label: 'Nhà cung cấp', value: supplierName },
                                { label: 'Số đã thanh toán', value: <Typography fontWeight={800} color="#16a34a">{fmtCurrency(done.paidAmount)}</Typography> },
                                { label: 'Hình thức', value: fundType === 'CASH_111' ? '💵 Tiền mặt' : '🏦 Ngân hàng' },
                                { label: 'Còn nợ lại', value: <Typography fontWeight={700} color={done.remaining > 0 ? '#dc2626' : '#16a34a'}>{fmtCurrency(done.remaining)}</Typography> },
                                { label: 'Trạng thái', value: <Chip label={DEBT_STATUS_MAP[done.status]?.label ?? done.status} size="small" sx={{ bgcolor: DEBT_STATUS_MAP[done.status]?.bg, color: DEBT_STATUS_MAP[done.status]?.color, fontWeight: 700, fontSize: 11 }} /> },
                            ].map(row => (
                                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" color="#6b7280">{row.label}</Typography>
                                    {typeof row.value === 'string' ? <Typography variant="caption" fontWeight={600}>{row.value}</Typography> : row.value}
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button fullWidth variant="outlined" startIcon={<Print />} onClick={handlePrintReceipt}
                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#7c3aed', color: '#7c3aed', borderRadius: 1.5, height: 42 }}>In phiếu chi</Button>
                            <Button fullWidth variant="contained" onClick={onClose}
                                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 1.5, height: 42 }}>Đóng</Button>
                        </Box>
                    </Box>
                ) : (
                    /* ── FORM ── */
                    <>
                        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{err}</Alert>}
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="caption" color="#7c3aed" fontWeight={700}>Tổng nợ đơn này</Typography>
                                <Typography fontWeight={700} color="#7c3aed">{fmtCurrency(debt.totalDebt)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="caption" color="#6b7280">Đã thanh toán</Typography>
                                <Typography color="#16a34a" fontWeight={600}>{fmtCurrency(debt.paidAmount)}</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#e9d5ff', mb: 0.75, '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="#dc2626" fontWeight={700}>Còn phải trả</Typography>
                                <Typography fontWeight={800} color="#dc2626">{fmtCurrency(debt.remainingAmount)}</Typography>
                            </Box>
                        </Box>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Số tiền thanh toán lần này *</Typography>
                        <TextField fullWidth size="small" placeholder="0" inputProps={{ inputMode: 'numeric' }} sx={{ mb: 1.5 }}
                            value={amount ? Number(amount).toLocaleString('vi-VN') : ''}
                            onChange={e => setAmount(e.target.value.replace(/\D/g,''))}
                            InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }} />
                        <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
                            {[25,50,75,100].map(p => {
                                const v = Math.round(debt.remainingAmount * p / 100);
                                return <Button key={p} size="small" variant="outlined" onClick={() => setAmount(String(v))}
                                    sx={{ flex: 1, textTransform: 'none', fontSize: 11, borderColor: p===100?'#7c3aed':'#e5e7eb', color: p===100?'#7c3aed':'#6b7280', fontWeight: p===100?700:400, '&:hover': { borderColor: '#7c3aed', color: '#7c3aed' } }}>
                                    {p===100 ? 'Tất cả' : `${p}%`}
                                </Button>;
                            })}
                        </Box>
                        {amt > 0 && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Typography variant="caption" fontWeight={700} color="#16a34a">
                                    Còn lại sau thanh toán: {fmtCurrency(Math.max(0, debt.remainingAmount - amt))}
                                    {amt >= debt.remainingAmount && ' — Tất toán hoàn toàn ✅'}
                                </Typography>
                            </Box>
                        )}
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Quỹ thanh toán</Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <Select value={fundType} onChange={e => setFundType(e.target.value)}>
                                <MenuItem value="CASH_111">💵 Tiền mặt (TK 111)</MenuItem>
                                <MenuItem value="BANK_112">🏦 Ngân hàng (TK 112)</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.75}>Ghi chú</Typography>
                        <TextField fullWidth size="small" placeholder="Nội dung thanh toán..." value={note} onChange={e => setNote(e.target.value)} />
                    </>
                )}
            </DialogContent>
            {!done && (
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555', borderRadius: 1.5 }}>Hủy</Button>
                    <Button onClick={handlePay} variant="contained" disabled={saving || amt <= 0}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#5b21b6' }, height: 36 }}>
                        {saving ? <><CircularProgress size={14} sx={{ mr: 1, color: '#fff' }} />Đang xử lý...</> : `Thanh toán ${amt > 0 ? fmtCurrency(amt) : ''}`}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// 4b. PAYMENT HISTORY DIALOG
// ─────────────────────────────────────────────────────────────
const PaymentHistoryDialog: React.FC<{
    open: boolean; debt: SupplierDebt | null; supplierName: string; onClose: () => void;
}> = ({ open, debt, supplierName, onClose }) => {
    const { data: history = [], isLoading, error } = useQuery({
        queryKey: ['debt-payment-history', debt?.id],
        queryFn: () => financeService.getDebtPaymentHistory(debt!.id),
        enabled: open && !!debt,
        retry: false,
        staleTime: 0,
    });

    const totalPaidInHistory = history.reduce((s: number, h: any) => s + (h.amount ?? 0), 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography fontWeight={800} color="#fff" fontSize={16}>Lịch sử thanh toán</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)">{supplierName} · {debt?.purchaseOrderCode || '—'}</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
            <DialogContent sx={{ p: 0 }}>
                {/* Tổng quan đơn */}
                {debt && (
                    <Box sx={{ px: 3, py: 2, bgcolor: '#f0fdfa', borderBottom: '1px solid #a7f3d0', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box><Typography variant="caption" color="#6b7280">Tổng nợ</Typography><Typography fontWeight={800} color="#0891b2">{fmtCurrency(debt.totalDebt)}</Typography></Box>
                        <Box><Typography variant="caption" color="#6b7280">Đã trả</Typography><Typography fontWeight={800} color="#16a34a">{fmtCurrency(debt.paidAmount)}</Typography></Box>
                        <Box><Typography variant="caption" color="#6b7280">Còn lại</Typography><Typography fontWeight={800} color={debt.remainingAmount > 0 ? '#dc2626' : '#16a34a'}>{fmtCurrency(debt.remainingAmount)}</Typography></Box>
                        <Box><Typography variant="caption" color="#6b7280">Hạn trả</Typography><Typography fontWeight={700} color="#374151">{debt.dueDate ? fmtDate(debt.dueDate) : '—'}</Typography></Box>
                        <Box sx={{ ml: 'auto' }}>
                            <Chip label={DEBT_STATUS_MAP[debt.status]?.label ?? debt.status} size="small"
                                sx={{ bgcolor: DEBT_STATUS_MAP[debt.status]?.bg, color: DEBT_STATUS_MAP[debt.status]?.color, fontWeight: 800 }} />
                        </Box>
                    </Box>
                )}

                {isLoading ? (
                    <Box sx={{ p: 3 }}>{[1,2,3].map(i => <Skeleton key={i} height={40} sx={{ mb: 1 }} />)}</Box>
                ) : error ? (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                            Backend chưa có endpoint <code>GET /finance/supplier-debts/{'{id}'}/payments</code>. Cần thêm để xem lịch sử thanh toán chi tiết.
                        </Alert>
                    </Box>
                ) : history.length === 0 ? (
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                        <History sx={{ fontSize: 40, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography color="#9ca3af" fontSize={13}>Chưa có lần thanh toán nào</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f0fdfa' }}>
                                    {['Ngày thanh toán','Số tiền','Hình thức','Ghi chú','Người TH'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#0891b2', py: 1.25, borderBottom: '1px solid #a7f3d0' }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((h: any, i: number) => (
                                    <TableRow key={h.id ?? i} hover sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                        <TableCell><Typography variant="caption" fontFamily="monospace" fontSize={11}>{fmtDateTime(h.createdAt ?? h.paidAt ?? '')}</Typography></TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'inline-flex', px: 1.25, py: 0.3, borderRadius: 1.5, bgcolor: '#dcfce7', border: '1px solid #86efac' }}>
                                                <Typography fontWeight={800} fontSize={12} color="#16a34a">-{fmtCurrency(h.amount)}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Chip label={h.fundType === 'CASH_111' ? '💵 Tiền mặt' : '🏦 Ngân hàng'} size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700 }} /></TableCell>
                                        <TableCell><Typography variant="caption" color="#6b7280">{h.description ?? h.note ?? '—'}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" color="#374151">{h.createdBy ?? '—'}</Typography></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            {history.length > 0 && (
                <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="#6b7280"><strong>{history.length}</strong> lần thanh toán</Typography>
                    <Typography variant="caption" color="#16a34a" fontWeight={700}>Tổng đã trả: {fmtCurrency(totalPaidInHistory)}</Typography>
                </Box>
            )}
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// 5. COD RECONCILIATION DIALOG
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

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target?.result, { type: 'binary' });
                const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const parsed: CodRow[] = data.map(d => ({ orderCode: String(d['Mã đơn'] ?? d['orderCode'] ?? ''), amountReceived: Number(d['Tiền nhận'] ?? 0), shippingFee: Number(d['Phí ship'] ?? 0), shippingProvider: String(d['Đơn vị VC'] ?? 'GHN') })).filter(r => r.orderCode);
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
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
                            <Button size="small" startIcon={<Add sx={{ fontSize: 15 }} />} onClick={() => setRows(r => [...r, { orderCode: '', amountReceived: 0, shippingFee: 0, shippingProvider: 'GHN' }])} sx={{ textTransform: 'none', color: '#2563eb', fontWeight: 700 }}>Thêm dòng</Button>
                        </Box>
                        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f0fdfa' }}>
                                        {['Mã đơn hàng','Tiền nhận (₫)','Phí ship (₫)','Đơn vị VC',''].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#0891b2' }}>{h}</TableCell>)}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell><TextField size="small" placeholder="ORD-001" value={row.orderCode} onChange={e => setRows(r => r.map((x,j) => j===i ? {...x, orderCode: e.target.value} : x))} /></TableCell>
                                            <TableCell><TextField size="small" type="number" value={row.amountReceived||''} onChange={e => setRows(r => r.map((x,j) => j===i ? {...x, amountReceived: Number(e.target.value)} : x))} /></TableCell>
                                            <TableCell><TextField size="small" type="number" value={row.shippingFee||''} onChange={e => setRows(r => r.map((x,j) => j===i ? {...x, shippingFee: Number(e.target.value)} : x))} /></TableCell>
                                            <TableCell>
                                                <FormControl size="small" sx={{ minWidth: 90 }}>
                                                    <Select value={row.shippingProvider} onChange={e => setRows(r => r.map((x,j) => j===i ? {...x, shippingProvider: e.target.value} : x))}>
                                                        {['GHN','GHTK','VTP','BEST','SPX'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>{rows.length > 1 && <IconButton size="small" onClick={() => setRows(r => r.filter((_,j) => j!==i))} sx={{ color: '#dc2626' }}><Close sx={{ fontSize: 16 }} /></IconButton>}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        <Box sx={{ p: 2, bgcolor: '#f0fdfa', borderRadius: 1.5, border: '1px solid #a7f3d0' }}>
                            <Typography variant="caption" color="#065f46" fontWeight={600}>
                                Tổng: <strong>{rows.filter(r => r.orderCode).length}</strong> đơn · Tổng nhận: <strong>{fmtCurrency(rows.reduce((s,r)=>s+r.amountReceived,0))}</strong> · Phí ship: <strong>{fmtCurrency(rows.reduce((s,r)=>s+r.shippingFee,0))}</strong>
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
                            {[
                                { label: 'Đơn khớp', value: result.matched, color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
                                { label: 'Không tìm thấy', value: result.notFound, color: '#dc2626', bg: '#fef2f2', icon: '❌' },
                                { label: 'Tổng tiền nhận', value: fmtCurrency(result.totalReceived), color: '#2563eb', bg: '#eff6ff', icon: '💰' },
                                { label: 'Tổng phí ship', value: fmtCurrency(result.totalShippingFee), color: '#d97706', bg: '#fef3c7', icon: '🚚' },
                                { label: 'Thực nhận ròng', value: fmtCurrency(result.netAmount), color: '#065f46', bg: '#d1fae5', icon: '✨' },
                            ].map(s => (
                                <Grid size={{ xs: 6 }} key={s.label}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: s.bg, textAlign: 'center' }}>
                                        <Typography fontSize={24}>{s.icon}</Typography>
                                        <Typography fontWeight={800} color={s.color} fontSize={15}>{s.value}</Typography>
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
                        <Button onClick={handleReconcile} variant="contained" disabled={loading} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#2563eb', height: 36 }}>
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
// TRANSACTION DETAIL DIALOG
// ─────────────────────────────────────────────────────────────
const TransactionDetailDialog: React.FC<{ open: boolean; txn: any | null; onClose: () => void }> = ({ open, txn, onClose }) => {
    if (!txn) return null;
    const isIn = txn.transactionType === 'IN';
    const refInfo = TX_REF_MAP[txn.referenceType] ?? { label: txn.referenceType || '—', color: '#6b7280', bg: '#f3f4f6' };

    const rows = [
        { label: 'Mã giao dịch',    value: <Typography variant="caption" fontFamily="monospace" fontSize={11}>{txn.id}</Typography> },
        { label: 'Thời gian',        value: fmtDateTime(txn.createdAt) },
        { label: 'Loại giao dịch',   value: <Box sx={{ display:'flex', gap: 0.75, alignItems:'center' }}>{isIn ? <TrendingUp sx={{ fontSize: 14, color: '#16a34a' }} /> : <TrendingDown sx={{ fontSize: 14, color: '#dc2626' }} />}<Typography variant="caption" fontWeight={700} color={isIn ? '#16a34a' : '#dc2626'}>{isIn ? 'Phiếu Thu' : 'Phiếu Chi'}</Typography></Box> },
        { label: 'Danh mục',         value: <Chip label={refInfo.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: refInfo.bg, color: refInfo.color, borderRadius: 1.5 }} /> },
        { label: 'Quỹ',              value: txn.fundType === 'CASH_111' ? '💵 Tiền mặt (TK 111)' : '🏦 Ngân hàng (TK 112)' },
        { label: 'Số tiền',          value: <Typography fontWeight={800} fontSize={15} color={isIn ? '#16a34a' : '#dc2626'}>{isIn ? '+' : '-'}{fmtCurrency(txn.amount)}</Typography> },
        ...(txn.personName ? [{ label: isIn ? 'Người nộp tiền' : 'Người nhận tiền', value: <Typography fontWeight={600}>{txn.personName}</Typography> }] : []),
        { label: 'Nội dung',         value: txn.description || '—' },
        ...(txn.balanceBefore != null ? [{ label: 'Số dư trước',  value: fmtCurrency(txn.balanceBefore) }] : []),
        ...(txn.balanceAfter  != null ? [{ label: 'Số dư sau',    value: <Typography fontWeight={700} color="#2563eb">{fmtCurrency(txn.balanceAfter)}</Typography> }] : []),
        { label: 'Người thực hiện',  value: txn._displayName || txn.createdBy || '—' },
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
            <Box sx={{ px: 3, py: 2.5, background: isIn ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography fontWeight={800} color="#fff" fontSize={16}>{isIn ? 'Chi tiết Phiếu Thu' : 'Chi tiết Phiếu Chi'}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)">{fmtDateTime(txn.createdAt)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="In phiếu"><IconButton onClick={() => handlePrintReceipt(txn)} sx={{ color: '#fff' }} size="small"><Print sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                    <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small"><Close /></IconButton>
                </Box>
            </Box>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    {/* Amount highlight */}
                    <Box sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: isIn ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${isIn ? '#86efac' : '#fca5a5'}`, textAlign: 'center' }}>
                        <Typography variant="caption" color={isIn ? '#16a34a' : '#dc2626'} fontWeight={700} display="block">{isIn ? 'SỐ TIỀN THU VÀO' : 'SỐ TIỀN CHI RA'}</Typography>
                        <Typography fontWeight={900} fontSize={26} color={isIn ? '#16a34a' : '#dc2626'} letterSpacing="-1px">{isIn ? '+' : '-'}{fmtCurrency(txn.amount)}</Typography>
                    </Box>
                    {/* Details */}
                    {rows.map(r => (
                        <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.9, borderBottom: '1px solid #f3f4f6' }}>
                            <Typography variant="caption" color="#9ca3af" fontWeight={600} sx={{ minWidth: 120 }}>{r.label}</Typography>
                            {typeof r.value === 'string'
                                ? <Typography variant="caption" color="#111" fontWeight={500} textAlign="right">{r.value}</Typography>
                                : r.value}
                        </Box>
                    ))}
                    {/* Balance flow nếu có */}
                    {txn.balanceBefore != null && txn.balanceAfter != null && (
                        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: '#eff6ff', border: '1px solid #93c5fd' }}>
                            <Typography variant="caption" color="#2563eb" fontWeight={700} display="block" mb={0.5}>Biến động số dư quỹ</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" fontWeight={600}>{fmtCurrency(txn.balanceBefore)}</Typography>
                                <Typography variant="caption" color={isIn ? '#16a34a' : '#dc2626'} fontWeight={800}>{isIn ? '+ ' : '– '}{fmtCurrency(txn.amount)}</Typography>
                                <Typography variant="caption" color="#6b7280">=</Typography>
                                <Typography variant="caption" fontWeight={800} color="#2563eb">{fmtCurrency(txn.balanceAfter)}</Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button variant="outlined" startIcon={<Print />} onClick={() => handlePrintReceipt(txn)} sx={{ textTransform: 'none', fontWeight: 700, borderColor: isIn ? '#16a34a' : '#dc2626', color: isIn ? '#16a34a' : '#dc2626', borderRadius: 1.5 }}>In phiếu</Button>
                <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: isIn ? '#16a34a' : '#dc2626', '&:hover': { filter: 'brightness(0.9)' } }}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

// ─────────────────────────────────────────────────────────────
// TAB 1: SỔ QUỸ
// ─────────────────────────────────────────────────────────────
const CashbookTab: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const userRole = userStr ? JSON.parse(userStr)?.user?.role : '';
    const userWarehouseId = userStr ? JSON.parse(userStr)?.user?.warehouseId : '';
    const isAdmin = userRole === 'ROLE_ADMIN';

    // Map username → UserResponse để hiện fullName
    const { data: allUsers = [] } = useQuery({
        queryKey: ['users-all'],
        queryFn: () => userService.getAll(),
        staleTime: 300000,
    });
    const userMap = React.useMemo(() => {
        const m = new Map<string, { fullName: string; warehouseName?: string }>();
        allUsers.forEach((u: any) => {
            const info = { fullName: u.fullName || u.username || '—', warehouseName: u.warehouseName };
            if (u.id)       m.set(u.id, info);        // backend lưu createdBy = UUID
            if (u.username) m.set(u.username, info);  // fallback nếu lưu username
        });
        return m;
    }, [allUsers]);

    // Map warehouseId → tên kho
    const warehouseMap = React.useMemo(() => {
        const m = new Map<string, string>();
        warehouses.forEach(w => m.set(w.id, w.name));
        return m;
    }, [warehouses]);

    const [params, setParams] = useState({
        from: monthStart(), to: today(),
        warehouseId: isAdmin ? '' : userWarehouseId,
        fundType: '', transactionType: '', referenceType: '', keyword: '',
        page: 0, size: 50,
    });
    const [createOpen, setCreateOpen] = useState(false);
    const [detailTxn, setDetailTxn] = useState<any | null>(null);
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
            } else { setSystemTotal(null); }
        } catch { /* silent */ }
        finally { setLoadingBalance(false); }
    }, [params.warehouseId, isAdmin]);

    useEffect(() => { loadBalance(); }, [loadBalance]);

    const queryParams = {
        from: new Date(params.from).toISOString(),
        to: new Date(params.to + 'T23:59:59').toISOString(),
        warehouseId: params.warehouseId || undefined,
        fundType: params.fundType || undefined,
        transactionType: params.transactionType || undefined,
        keyword: params.referenceType ? params.referenceType : (params.keyword || undefined),
    };

    const { data: cashbookData, isLoading, refetch } = useQuery({
        queryKey: ['cashbook', params],
        queryFn: () => financeService.searchCashbook({ ...queryParams, page: params.page, size: params.size }),
    });

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
            { header: 'Danh mục', key: 'referenceType', width: 22, formatter: (v: any) => TX_REF_MAP[v]?.label ?? v },
            { header: 'Mô tả', key: 'description', width: 40 },
            { header: 'Người nộp/nhận', key: 'personName', width: 20 },
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
            {/* Phiếu chờ duyệt — admin only */}
            {isAdmin && <PendingVouchersSection warehouseId={params.warehouseId} onRefresh={() => { refetch(); loadBalance(); }} />}

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
                                    {c.key === '_totalIn' ? fmtCurrency(totalIn) : c.key === '_totalOut' ? fmtCurrency(totalOut) : c.key === '_systemTotal' ? fmtCurrency(systemTotal ?? 0) : fmtCurrency(balance[c.key] ?? 0)}
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
                    <TextField size="small" placeholder={params.referenceType ? 'Đang lọc theo danh mục...' : 'Tìm nội dung, mô tả...'}
                        value={params.keyword} disabled={!!params.referenceType}
                        onChange={e => set('keyword')(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment> }}
                        sx={{ flex: 1, minWidth: 160 }} />
                    <TextField size="small" type="date" label="Từ ngày" value={params.from} onChange={e => set('from')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />
                    <TextField size="small" type="date" label="Đến ngày" value={params.to} onChange={e => set('to')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 145 }} />
                    {isAdmin && (
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <Select value={params.warehouseId} onChange={e => set('warehouseId')(e.target.value)} displayEmpty>
                                <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <Select value={params.transactionType} onChange={e => set('transactionType')(e.target.value)} displayEmpty>
                            <MenuItem value="">Cả Thu/Chi</MenuItem>
                            <MenuItem value="IN">⬆️ Chỉ Thu</MenuItem>
                            <MenuItem value="OUT">⬇️ Chỉ Chi</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 155 }}>
                        <Select value={params.fundType} onChange={e => set('fundType')(e.target.value)} displayEmpty>
                            <MenuItem value="">Tất cả quỹ</MenuItem>
                            <MenuItem value="CASH_111">💵 Tiền mặt</MenuItem>
                            <MenuItem value="BANK_112">🏦 Ngân hàng</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 175 }}>
                        <Select value={params.referenceType} onChange={e => setParams(p => ({ ...p, referenceType: e.target.value, keyword: '', page: 0 }))} displayEmpty>
                            {REF_TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />} onClick={() => refetch()} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />} onClick={handleExport} sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a', borderRadius: 1.5, height: 36 }}>Excel</Button>
                    <Button variant="contained" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={() => setCreateOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, borderRadius: 1.5, height: 36 }}>Tạo phiếu</Button>
                </Box>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                                {['Ngày','Quỹ','Loại','Danh mục','Mô tả','Người nộp/nhận','Số tiền','Người thực hiện','Thao tác'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#3730a3', py: 1.5, borderBottom: '2px solid #c7d2fe', letterSpacing: 0.3 }}>{h.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1,2,3,4,5].map(i => <TableRow key={i}>{[1,2,3,4,5,6,7,8,9].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                            ) : transactions.length > 0 ? (
                                transactions.map((t: any, idx: number) => {
                                    const refInfo = TX_REF_MAP[t.referenceType] ?? { label: t.referenceType || '—', color: '#6b7280', bg: '#f3f4f6' };
                                    const isIn = t.transactionType === 'IN';
                                    const raw = t.createdBy ?? '';
                                    const userInfo = userMap.get(raw);
                                    const isUuid = !userInfo && /^[0-9a-f]{8}-/i.test(raw);
                                    const displayName = userInfo?.fullName
                                        || (raw === 'SYSTEM' || raw === 'system' ? 'Hệ thống' : '')
                                        || (isUuid ? raw.slice(0, 8) + '…' : raw)
                                        || '—';
                                    const wName = warehouseMap.get(t.warehouseId ?? '') || userInfo?.warehouseName || '';
                                    const enrichedTxn = { ...t, _displayName: displayName };
                                    return (
                                        <TableRow key={t.id} hover onClick={() => setDetailTxn(enrichedTxn)} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', '&:hover': { bgcolor: '#f0f4ff' }, transition: 'background-color 0.1s', cursor: 'pointer' }}>
                                            <TableCell sx={{ py: 1.5, minWidth: 110 }}>
                                                <Typography variant="caption" fontFamily="monospace" fontSize={11} color="#374151">{fmtDateTime(t.createdAt)}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip label={t.fundType === 'CASH_111' ? 'Tiền mặt' : 'Ngân hàng'} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: t.fundType === 'CASH_111' ? '#dcfce7' : '#dbeafe', color: t.fundType === 'CASH_111' ? '#16a34a' : '#2563eb' }} />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {isIn ? <TrendingUp sx={{ fontSize: 14, color: '#16a34a' }} /> : <TrendingDown sx={{ fontSize: 14, color: '#dc2626' }} />}
                                                    <Typography variant="caption" fontWeight={700} color={isIn ? '#16a34a' : '#dc2626'}>{isIn ? 'Thu' : 'Chi'}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip label={refInfo.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: refInfo.bg, color: refInfo.color }} />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, maxWidth: 180 }}>
                                                <Tooltip title={t.description || ''} placement="top">
                                                    <Typography variant="caption" color="#374151" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{t.description || '—'}</Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="caption" color="#374151" fontWeight={500}>{t.personName || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.25, py: 0.4, borderRadius: 1.5, bgcolor: isIn ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isIn ? '#86efac' : '#fca5a5'}` }}>
                                                    <Typography fontWeight={800} fontSize={13} color={isIn ? '#16a34a' : '#dc2626'}>{isIn ? '+' : '-'}{fmtCurrency(t.amount)}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, minWidth: 150 }}>
                                                {(() => {
                                                    const isSystem = raw === 'SYSTEM' || raw === 'system';
                                                    const initials = isSystem ? 'SY'
                                                        : (userInfo?.fullName || '').split(' ').map((p: string) => p[0]).filter(Boolean).slice(-2).join('').toUpperCase()
                                                        || displayName.slice(0, 2).toUpperCase() || '?';
                                                    const avatarBg = isSystem ? '#f0f9ff' : isUuid ? '#fef3c7' : '#e0e7ff';
                                                    const avatarColor = isSystem ? '#0284c7' : isUuid ? '#b45309' : '#3730a3';
                                                    return (
                                                        <Tooltip title={`${displayName}${wName ? ' · ' + wName : ''}`} placement="top">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                <Avatar sx={{ width: 26, height: 26, bgcolor: avatarBg, color: avatarColor, fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{initials}</Avatar>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography variant="caption" color="#111" fontWeight={600} display="block" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{displayName}</Typography>
                                                                    {wName && <Typography sx={{ fontSize: 10, color: '#9ca3af', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{wName}</Typography>}
                                                                </Box>
                                                            </Box>
                                                        </Tooltip>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }} onClick={e => e.stopPropagation()}>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Xem chi tiết" placement="top">
                                                        <IconButton size="small" onClick={() => setDetailTxn(enrichedTxn)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' }, borderRadius: 1.5 }}>
                                                            <AccountBalance sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="In phiếu" placement="top">
                                                        <IconButton size="small" onClick={() => handlePrintReceipt(t)} sx={{ color: '#6b7280', '&:hover': { color: '#16a34a', bgcolor: '#f0fdf4' }, borderRadius: 1.5 }}>
                                                            <Print sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <History sx={{ fontSize: 48, color: '#e5e7eb', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography color="#9ca3af" fontSize={13}>Không có giao dịch nào trong khoảng thời gian này</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" color="#6b7280">Hiển thị <strong>{transactions.length}</strong> / <strong>{totalElements}</strong> giao dịch</Typography>
                        <Select size="small" value={params.size} onChange={e => setParams(p => ({ ...p, size: Number(e.target.value), page: 0 }))}
                            sx={{ height: 26, fontSize: 11, '& .MuiSelect-select': { py: 0.3, px: 1 } }}>
                            {[20, 50, 100, 200].map(n => <MenuItem key={n} value={n} sx={{ fontSize: 12 }}>{n} dòng</MenuItem>)}
                        </Select>
                        {!isLoading && transactions.length > 0 && (
                            <>
                                <Typography variant="caption" color="#16a34a" fontWeight={600}>↑ Thu: {fmtCurrency(totalIn)}</Typography>
                                <Typography variant="caption" color="#dc2626" fontWeight={600}>↓ Chi: {fmtCurrency(totalOut)}</Typography>
                                <Typography variant="caption" color="#374151" fontWeight={700}>= Chênh: {fmtCurrency(totalIn - totalOut)}</Typography>
                            </>
                        )}
                    </Box>
                    {totalPages > 1 && <Pagination count={totalPages} page={params.page + 1} onChange={(_,v) => setParams(p => ({ ...p, page: v-1 }))} size="small" color="primary" shape="rounded" />}
                </Box>
            </Paper>

            <CreateEntryDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={() => { refetch(); loadBalance(); }} warehouses={warehouses} />
            <TransactionDetailDialog open={!!detailTxn} txn={detailTxn} onClose={() => setDetailTxn(null)} />
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// TAB 2: CÔNG NỢ NCC
// ─────────────────────────────────────────────────────────────
const SupplierDebtTab: React.FC<{ warehouses: Warehouse[] }> = ({ warehouses }) => {
    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';
    const queryClient = useQueryClient();

    const [payTarget, setPayTarget] = useState<SupplierDebt | null>(null);
    const [historyTarget, setHistoryTarget] = useState<SupplierDebt | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouseId, setWarehouseId] = useState(() => isAdmin ? '' : (currentUser?.warehouseId ?? ''));
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [snack, setSnack] = useState('');
    const [page, setPage] = useState(0);
    const pageSize = 20;

    useEffect(() => { supplierService.getAllSimple().then(setSuppliers).catch(() => {}); }, []);
    const supplierMap = React.useMemo(() => {
        const m = new Map<string, Supplier>(); suppliers.forEach(s => m.set(s.id, s)); return m;
    }, [suppliers]);

    const queryKey = ['supplier-debts-paged', warehouseId, search, statusFilter, overdueOnly, page];

    const { data: debtsData, isLoading, refetch } = useQuery({
        queryKey,
        queryFn: () => financeService.getSupplierDebtsPaged({
            warehouseId: warehouseId || undefined,
            search: search || undefined,
            status: statusFilter || undefined,
            page, size: pageSize,
        }),
        staleTime: 0,
    });

    // Summary luôn lấy KHÔNG filter status → tổng toàn bộ
    const { data: summaryData, refetch: refetchSummary } = useQuery({
        queryKey: ['supplier-debts-summary', warehouseId, search],
        queryFn: () => financeService.getSupplierDebtSummary({ warehouseId: warehouseId || undefined, search: search || undefined }),
        staleTime: 0,
    });

    const rawDebts: any[] = debtsData?.content ?? [];
    const totalPages = debtsData?.totalPages ?? 0;
    const totalElements = debtsData?.totalElements ?? 0;

    // Client-side filter — fallback khi backend không hỗ trợ filter status
    const debts = React.useMemo(() => {
        let result = rawDebts;
        if (statusFilter) result = result.filter((d: any) => d.status === statusFilter);
        if (overdueOnly) result = result.filter((d: any) => d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'PAID');
        return result;
    }, [rawDebts, statusFilter, overdueOnly]);

    const totalRemaining = summaryData?.totalRemaining ?? 0;
    const totalPaid = summaryData?.totalPaid ?? 0;
    const totalDebt = summaryData?.totalDebt ?? 0;
    const suppliersWithDebtCount = summaryData?.suppliersWithDebtCount ?? 0;

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['supplier-debts-paged'] });
        queryClient.invalidateQueries({ queryKey: ['supplier-debts-summary'] });
    };

    const handlePaid = (updatedDebt: any, _paidAmount: number, _fundType: string) => {
        // Cập nhật optimistic trực tiếp trong cache — debt không biến mất
        queryClient.setQueryData(queryKey, (old: any) => {
            if (!old) return old;
            return {
                ...old,
                content: old.content.map((d: any) =>
                    d.id === updatedDebt.id ? { ...d, ...updatedDebt } : d
                ),
            };
        });
        // Invalidate sau 1 giây để backend sync
        setTimeout(() => { invalidateAll(); }, 1200);
        setSnack('Thanh toán công nợ thành công!');
    };

    const handleExport = () => {
        exportToExcel(rawDebts.map((d: any) => ({ ...d, supplierName: supplierMap.get(d.supplierId)?.name ?? d.supplierId })), [
            { header: 'Nhà cung cấp', key: 'supplierName', width: 30 },
            { header: 'Mã đơn nhập', key: 'purchaseOrderCode', width: 20 },
            { header: 'Chi nhánh', key: 'warehouseName', width: 20 },
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
                    { label: 'Tổng nợ phát sinh', value: fmtCurrency(totalDebt), color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fca5a5', icon: '📋', sub: 'Tổng tiền nhập hàng chịu' },
                    { label: 'Đã thanh toán', value: fmtCurrency(totalPaid), color: '#16a34a', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#86efac', icon: '✅', sub: 'Đã chi trả cho NCC' },
                    { label: 'Còn phải trả', value: fmtCurrency(totalRemaining), color: '#d97706', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#fde68a', icon: '⏳', sub: 'Cần thanh toán thêm' },
                    { label: 'NCC còn nợ', value: suppliersWithDebtCount, color: '#7c3aed', bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)', border: '#c4b5fd', icon: '🏢', sub: 'Nhà cung cấp chưa tất toán' },
                ].map(c => (
                    <Grid size={{ xs: 6, sm: 3 }} key={c.label}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: `1.5px solid ${c.border}`, background: c.bg, boxShadow: `0 4px 12px ${c.border}50`, transition: 'transform 0.15s', '&:hover': { transform: 'translateY(-2px)' } }}>
                            <Typography fontSize={26} display="block" mb={1} lineHeight={1}>{c.icon}</Typography>
                            <Typography fontWeight={800} color={c.color} fontSize={17} letterSpacing="-0.5px">{c.value}</Typography>
                            <Typography variant="caption" color="#374151" fontSize={11} fontWeight={600} mt={0.25} display="block">{c.label}</Typography>
                            <Typography variant="caption" color="#9ca3af" fontSize={10} display="block">{c.sub}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" placeholder="Tìm nhà cung cấp, mã đơn nhập..."
                        value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment> }}
                        sx={{ flex: 1, minWidth: 220 }} />
                    <FormControl size="small" sx={{ minWidth: 165 }}>
                        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} displayEmpty>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="UNPAID">⭕ Chưa trả</MenuItem>
                            <MenuItem value="PARTIAL">🔵 Một phần</MenuItem>
                            <MenuItem value="PAID">✅ Đã tất toán</MenuItem>
                        </Select>
                    </FormControl>
                    {isAdmin && (
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(0); }} displayEmpty>
                                <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                {warehouses.filter(w => w.isActive).map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                    <Tooltip title={overdueOnly ? 'Bỏ lọc quá hạn' : 'Chỉ hiện đơn quá hạn'}>
                        <Button size="small" variant={overdueOnly ? 'contained' : 'outlined'} onClick={() => setOverdueOnly(v => !v)}
                            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderColor: '#dc2626', color: overdueOnly ? '#fff' : '#dc2626', bgcolor: overdueOnly ? '#dc2626' : 'transparent', '&:hover': { bgcolor: overdueOnly ? '#b91c1c' : '#fef2f2' } }}>
                            ⚠️ Quá hạn
                        </Button>
                    </Tooltip>
                    <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 15 }} />} onClick={() => { refetch(); refetchSummary(); }} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}>Làm mới</Button>
                    <Button size="small" variant="outlined" startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />} onClick={handleExport} sx={{ textTransform: 'none', borderColor: '#7c3aed', color: '#7c3aed' }}>Excel</Button>
                </Box>
                {(statusFilter || overdueOnly) && (
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="#6b7280">Đang lọc:</Typography>
                        {statusFilter && <Chip label={DEBT_STATUS_MAP[statusFilter]?.label ?? statusFilter} size="small" onDelete={() => setStatusFilter('')} sx={{ height: 22, fontSize: 11 }} />}
                        {overdueOnly && <Chip label="Quá hạn" size="small" onDelete={() => setOverdueOnly(false)} sx={{ height: 22, fontSize: 11, bgcolor: '#fee2e2', color: '#dc2626' }} />}
                    </Box>
                )}
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#faf5ff' }}>
                                {['Nhà cung cấp','Mã đơn nhập','Chi nhánh','Tổng nợ / Tiến độ','Đã trả','Còn lại','Hạn trả','Trạng thái','Thao tác'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#5b21b6', py: 1.5, borderBottom: '2px solid #e9d5ff', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1,2,3,4].map(i => <TableRow key={i}>{[1,2,3,4,5,6,7,8,9].map(j => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>)
                            ) : debts.length > 0 ? (
                                debts.map((d: any, idx: number) => {
                                    const supplier = supplierMap.get(d.supplierId);
                                    const st = DEBT_STATUS_MAP[d.status] ?? { label: d.status, color: '#666', bg: '#f3f4f6' };
                                    const pct = d.totalDebt > 0 ? Math.round((d.paidAmount / d.totalDebt) * 100) : 0;
                                    const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'PAID';
                                    const isPaid = d.status === 'PAID';
                                    return (
                                        <TableRow key={d.id} hover sx={{
                                            bgcolor: isPaid ? '#f9fdf9' : isOverdue ? '#fff8f8' : idx % 2 === 0 ? '#fff' : '#fafafa',
                                            opacity: isPaid ? 0.75 : 1,
                                            '&:hover': { bgcolor: isPaid ? '#f0fdf4' : '#faf5ff' },
                                        }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                    <Avatar sx={{ width: 34, height: 34, bgcolor: isPaid ? '#dcfce7' : '#f3e8ff', color: isPaid ? '#16a34a' : '#7c3aed', fontSize: 13, fontWeight: 800 }}>
                                                        {isPaid ? '✓' : supplier?.name?.charAt(0) ?? 'N'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontSize={13} fontWeight={600} color={isPaid ? '#6b7280' : '#111'}>{supplier?.name ?? d.supplierId.slice(0,8)}</Typography>
                                                        {supplier?.phone && <Typography variant="caption" color="#9ca3af" display="block">{supplier.phone}</Typography>}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontFamily="monospace" color="#7c3aed" fontWeight={600}>{d.purchaseOrderCode || d.purchaseOrderId?.slice(0,12) || '—'}</Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="caption" color="#6b7280">{d.warehouseName || '—'}</Typography></TableCell>
                                            <TableCell sx={{ minWidth: 140 }}>
                                                <Typography fontWeight={700} fontSize={13} color={isPaid ? '#6b7280' : '#111'}>{fmtCurrency(d.totalDebt)}</Typography>
                                                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 5, borderRadius: 2, bgcolor: '#f3e8ff', '& .MuiLinearProgress-bar': { bgcolor: isPaid ? '#16a34a' : '#7c3aed' } }} />
                                                    <Typography sx={{ fontSize: 10, color: isPaid ? '#16a34a' : '#7c3aed', fontWeight: 700, minWidth: 28 }}>{pct}%</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography fontSize={12} color="#16a34a" fontWeight={600}>{fmtCurrency(d.paidAmount)}</Typography></TableCell>
                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={800} color={d.remainingAmount > 0 ? '#dc2626' : '#16a34a'}>{fmtCurrency(d.remainingAmount)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="caption" color={isOverdue ? '#dc2626' : '#6b7280'} fontWeight={isOverdue ? 700 : 400}>
                                                        {d.dueDate ? fmtDate(d.dueDate) : '—'}
                                                    </Typography>
                                                    {isOverdue && <Typography sx={{ fontSize: 10, color: '#dc2626', fontWeight: 700, display: 'block' }}>⚠️ Quá hạn</Typography>}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={st.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: st.bg, color: st.color, borderRadius: 1.5 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                                                    <Tooltip title="Lịch sử thanh toán">
                                                        <IconButton size="small" onClick={() => setHistoryTarget(d)}
                                                            sx={{ bgcolor: '#f0fdfa', color: '#0891b2', '&:hover': { bgcolor: '#ccfbf1' }, borderRadius: 1.5, width: 28, height: 28 }}>
                                                            <History sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {!isPaid ? (
                                                        <Button size="small" variant="contained" onClick={() => setPayTarget(d)}
                                                            sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#5b21b6' }, py: 0.4, px: 1.5, borderRadius: 1.5, minWidth: 80 }}>
                                                            Thanh toán
                                                        </Button>
                                                    ) : (
                                                        <Chip label="Tất toán" size="small" icon={<CheckCircle sx={{ fontSize: 12 }} />}
                                                            sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 11, height: 26 }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <CheckCircle sx={{ fontSize: 48, color: '#d1d5db', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography color="#9ca3af" fontSize={13}>
                                            {overdueOnly ? 'Không có công nợ quá hạn' : statusFilter === 'PAID' ? 'Chưa có khoản nợ nào tất toán' : 'Không có công nợ nào'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="#6b7280">Hiển thị <strong>{debts.length}</strong> / <strong>{totalElements}</strong> công nợ</Typography>
                        {debts.length > 0 && !isLoading && (
                            <>
                                <Typography variant="caption" color="#dc2626" fontWeight={600}>Còn lại: {fmtCurrency(debts.reduce((s: number, d: any) => s + (d.remainingAmount || 0), 0))}</Typography>
                                <Typography variant="caption" color="#16a34a" fontWeight={600}>Đã trả (trang này): {fmtCurrency(debts.reduce((s: number, d: any) => s + (d.paidAmount || 0), 0))}</Typography>
                            </>
                        )}
                    </Box>
                    {totalPages > 1 && <Pagination count={totalPages} page={page + 1} onChange={(_,v) => setPage(v-1)} size="small" color="primary" shape="rounded" />}
                </Box>
            </Paper>

            <PayDebtDialog
                open={!!payTarget} debt={payTarget}
                supplierName={supplierMap.get(payTarget?.supplierId ?? '')?.name ?? ''}
                onClose={() => setPayTarget(null)}
                onPaid={handlePaid}
            />
            <PaymentHistoryDialog
                open={!!historyTarget} debt={historyTarget}
                supplierName={supplierMap.get(historyTarget?.supplierId ?? '')?.name ?? ''}
                onClose={() => setHistoryTarget(null)}
            />
            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack ? <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 3 }}>{snack}</Alert> : <div />}
            </Snackbar>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────
// TAB 3: ĐỐI SOÁT COD
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
                {[
                    { icon: '📦', title: 'Nhập dữ liệu', desc: 'Nhập tay từng đơn hoặc import file Excel từ GHN, GHTK, VTP...' },
                    { icon: '🔍', title: 'Đối chiếu', desc: 'Hệ thống tự động so khớp mã đơn hàng và số tiền COD' },
                    { icon: '📊', title: 'Kết quả', desc: 'Xem báo cáo đơn khớp / không khớp và tổng thực nhận ròng' },
                    { icon: '✅', title: 'Xác nhận', desc: 'Ghi nhận vào sổ quỹ, tự động tạo phiếu thu COD' },
                ].map(c => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={c.title}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', height: '100%', '&:hover': { borderColor: '#67e8f9', boxShadow: '0 4px 12px #cffafe' } }}>
                            <Typography fontSize={32} mb={1}>{c.icon}</Typography>
                            <Typography fontWeight={700} fontSize={14} color="#111" mb={0.5}>{c.title}</Typography>
                            <Typography variant="caption" color="#6b7280" lineHeight={1.6}>{c.desc}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
                <Typography fontWeight={700} color="#374151" mb={2}>Đơn vị vận chuyển hỗ trợ</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {['GHN','GHTK','Viettel Post','BEST Express','SPX Express','JT Express'].map(p => (
                        <Chip key={p} label={p} sx={{ fontWeight: 600, bgcolor: '#f0fdfa', color: '#0891b2', border: '1px solid #a7f3d0' }} />
                    ))}
                </Box>
                <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5 }}>
                    <Typography variant="caption">Download template Excel, điền thông tin COD từ báo cáo đơn vị vận chuyển, sau đó import vào để đối soát tự động.</Typography>
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
    useEffect(() => { warehouseService.getAll().then(setWarehouses).catch(() => {}); }, []);

    const TAB_LABELS = [
        { label: 'Sổ quỹ', icon: <AccountBalance sx={{ fontSize: 16 }} />, desc: 'Thu, chi và phê duyệt phiếu' },
        { label: 'Công nợ NCC', icon: <Business sx={{ fontSize: 16 }} />, desc: 'Quản lý thanh toán nhà cung cấp' },
        { label: 'Đối soát COD', icon: <SwapHoriz sx={{ fontSize: 16 }} />, desc: 'Đối chiếu tiền thu hộ' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="#9ca3af" fontSize={11}>Dashboard / <strong style={{ color: '#6b7280' }}>Tài chính</strong></Typography>
                <Typography variant="h5" fontWeight={800} color="#111" mt={0.5} letterSpacing="-0.5px">Quản lý Tài chính</Typography>
                <Typography variant="body2" color="#6b7280" fontSize={12}>Sổ quỹ, phê duyệt phiếu thu/chi, công nợ nhà cung cấp và đối soát COD</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {TAB_LABELS.map((t, i) => (
                    <Box key={i} onClick={() => setTab(i)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', border: `1.5px solid ${tab===i ? '#1d4ed8' : '#e5e7eb'}`, bgcolor: tab===i ? '#eff6ff' : '#fff', transition: 'all .15s', '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' } }}>
                        <Box sx={{ color: tab===i ? '#1d4ed8' : '#6b7280' }}>{t.icon}</Box>
                        <Box>
                            <Typography fontSize={13} fontWeight={700} color={tab===i ? '#1d4ed8' : '#374151'}>{t.label}</Typography>
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
