// src/modules/admin/pages/shifts/ShiftAssignmentPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Select, MenuItem, Chip, FormControl,
    InputLabel, Checkbox, ListItemText, OutlinedInput, Avatar, Tooltip,
    Skeleton, TextField
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, Add, Close, DeleteOutline
} from '@mui/icons-material';
import userService from '../../../../services/userService';
import authService from '../../../../services/authService';
import warehouseService from '../../../../services/warehouseService';
import { UserResponse } from '../../../../types';
import toast from 'react-hot-toast';

// ── Shift definitions ──────────────────────────────────────
interface ShiftDef {
    id: string;
    label: string;
    time: string;
    color: string;
    bgColor: string;
    short: string;
}

const SHIFT_DEFS: ShiftDef[] = [
    { id: 'S', label: 'Ca sáng', time: '08:00 - 12:00', color: '#2e7d32', bgColor: '#e8f5e9', short: 'S' },
    { id: 'C', label: 'Ca chiều', time: '12:00 - 17:00', color: '#ed6c02', bgColor: '#fff3e0', short: 'C' },
    { id: 'T', label: 'Ca tối', time: '17:00 - 22:00', color: '#1565c0', bgColor: '#e3f2fd', short: 'T' },
];

// ── Types ──────────────────────────────────────────────────
interface ShiftAssignment {
    date: string;       // YYYY-MM-DD
    userId: string;
    shiftId: string;    // S, C, T
}

const STORAGE_KEY = 'sme_shift_assignments';
const NOTES_STORAGE_KEY = 'sme_shift_notes';

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ── Helpers ────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function formatMonth(year: number, month: number) {
    return `${String(month + 1).padStart(2, '0')}/${year}`;
}

function loadAssignments(): ShiftAssignment[] {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        return s ? JSON.parse(s) : [];
    } catch { return []; }
}

function saveAssignments(data: ShiftAssignment[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface DayNote {
    date: string;
    userId: string;
    note: string;
}

function loadNotes(): DayNote[] {
    try {
        const s = localStorage.getItem(NOTES_STORAGE_KEY);
        return s ? JSON.parse(s) : [];
    } catch { return []; }
}

function saveNotes(data: DayNote[]) {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(data));
}

// ── Component ──────────────────────────────────────────────
export default function ShiftAssignmentPage() {
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [month, setMonth] = useState(() => new Date().getMonth());
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>(loadAssignments);
    const [notes, setNotes] = useState<DayNote[]>(loadNotes);

    const currentUser = authService.getCurrentUser()?.user;
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
    const [warehouses, setWarehouses] = useState<any[]>([]);

    const displayedUsers = useMemo(() => {
        if (!selectedWarehouseId) return users;
        return users.filter(u => u.isActive && u.warehouseId === selectedWarehouseId);
    }, [users, selectedWarehouseId]);

    // Quick assign dialog
    const [openQuick, setOpenQuick] = useState(false);
    const [qShift, setQShift] = useState('S');
    const [qUsers, setQUsers] = useState<string[]>([]);
    const [qDays, setQDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Mon-Sat

    // Single cell click
    const [dayDialog, setDayDialog] = useState<{ date: string; userId: string } | null>(null);
    const [cellShift, setCellShift] = useState('S');
    const [dayNote, setDayNote] = useState('');

    // Delete confirm dialog
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ userId: string; date: string; shiftId: string } | null>(null);

    const daysCount = useMemo(() => getDaysInMonth(year, month), [year, month]);
    const today = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.getAll();
            setUsers(data.filter(u => u.isActive && u.role !== 'ROLE_ADMIN' && u.role !== 'ROLE_CUSTOMER'));
        } catch { toast.error('Không thể tải danh sách nhân viên'); }
        finally { setLoading(false); }
    }, []);

    const loadWarehouses = useCallback(async () => {
        try {
            const data = await warehouseService.getAll();
            setWarehouses(data.filter(w => w.isActive));
        } catch (err) {
            console.error('Lỗi tải danh sách chi nhánh:', err);
        }
    }, []);

    useEffect(() => {
        loadUsers();
        loadWarehouses();
    }, [loadUsers, loadWarehouses]);

    // Save whenever assignments or notes change
    useEffect(() => { saveAssignments(assignments); }, [assignments]);
    useEffect(() => { saveNotes(notes); }, [notes]);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const getAssignmentsForCell = (userId: string, date: string) =>
        assignments.filter(a => a.userId === userId && a.date === date);

    const getNoteForCell = (userId: string, date: string) => notes.find(n => n.userId === userId && n.date === date)?.note || '';

    const setNoteForCell = (userId: string, date: string, note: string) => {
        setNotes(prev => {
            const filtered = prev.filter(n => !(n.userId === userId && n.date === date));
            if (note.trim()) {
                return [...filtered, { userId, date, note: note.trim() }];
            }
            return filtered;
        });
    };

    const addAssignment = (userId: string, date: string, shiftId: string) => {
        const exists = assignments.some(a => a.userId === userId && a.date === date && a.shiftId === shiftId);
        if (exists) return;
        setAssignments(prev => [...prev, { userId, date, shiftId }]);
    };

    const removeAssignment = (userId: string, date: string, shiftId: string) => {
        setAssignments(prev => prev.filter(a => !(a.userId === userId && a.date === date && a.shiftId === shiftId)));
    };

    const handleCellClick = (userId: string, day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setDayDialog({ date: dateStr, userId });
        setCellShift('S');
        setDayNote(getNoteForCell(userId, dateStr));
    };

    const handleCellAdd = () => {
        if (!dayDialog) return;
        addAssignment(dayDialog.userId, dayDialog.date, cellShift);
        toast.success('Đã thêm ca');
    };

    const handleQuickAssign = () => {
        if (qUsers.length === 0) { toast.error('Chọn ít nhất 1 nhân viên'); return; }
        if (qDays.length === 0) { toast.error('Chọn ít nhất 1 ngày'); return; }

        let count = 0;
        for (let day = 1; day <= daysCount; day++) {
            const d = new Date(year, month, day);
            const dow = d.getDay(); // 0=CN,1=T2...6=T7
            if (!qDays.includes(dow)) continue;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            for (const uid of qUsers) {
                const exists = assignments.some(a => a.userId === uid && a.date === dateStr && a.shiftId === qShift);
                if (!exists) { count++; }
            }
        }

        const newAssignments: ShiftAssignment[] = [];
        for (let day = 1; day <= daysCount; day++) {
            const d = new Date(year, month, day);
            const dow = d.getDay();
            if (!qDays.includes(dow)) continue;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            for (const uid of qUsers) {
                const exists = assignments.some(a => a.userId === uid && a.date === dateStr && a.shiftId === qShift);
                if (!exists) {
                    newAssignments.push({ userId: uid, date: dateStr, shiftId: qShift });
                }
            }
        }

        setAssignments(prev => [...prev, ...newAssignments]);
        setOpenQuick(false);
        toast.success(`Đã phân ${newAssignments.length} ca cho ${qUsers.length} nhân viên`);
    };

    const dayOfWeekNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>
                        Phân ca làm việc
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Click <strong>+</strong> để thêm ca, click ca để xóa
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isAdmin && (
                        <FormControl size="small" sx={{ width: 220 }}>
                            <Select
                                value={selectedWarehouseId}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                displayEmpty
                                sx={{ borderRadius: 2, bgcolor: '#fff' }}
                            >
                                <MenuItem value="">Tất cả chi nhánh</MenuItem>
                                {warehouses.map((w: any) => (
                                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <Button variant="outlined" startIcon={<Add />} onClick={() => {
                        setOpenQuick(true);
                        setQShift('S');
                        setQUsers([]);
                        setQDays([1, 2, 3, 4, 5, 6]);
                    }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#e0e0e0', color: '#555' }}>
                        Phân ca nhanh
                    </Button>
                </Box>
            </Box>

            {/* Month Nav */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={prevMonth} size="small"><ChevronLeft /></IconButton>
                <Typography variant="h6" fontWeight={800}>{formatMonth(year, month)}</Typography>
                <IconButton onClick={nextMonth} size="small"><ChevronRight /></IconButton>
            </Box>

            {/* Shift Legend */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                {SHIFT_DEFS.map(s => (
                    <Chip key={s.id} label={`${s.short} ${s.label} (${s.time})`} size="small"
                        sx={{ fontWeight: 700, fontSize: 11, bgcolor: s.bgColor, color: s.color, border: `1px solid ${s.color}30` }} />
                ))}
            </Box>

            {/* Calendar Grid */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'auto' }}>
                <Box sx={{ minWidth: daysCount * 44 + 180, display: 'grid', gridTemplateColumns: `180px repeat(${daysCount}, minmax(42px, 1fr))` }}>
                    {/* Header row */}
                    <Box sx={{ p: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', position: 'sticky', left: 0, zIndex: 2 }}>
                        <Typography variant="caption" fontWeight={800} color="#888">NHÂN VIÊN</Typography>
                    </Box>
                    {Array.from({ length: daysCount }, (_, i) => {
                        const day = i + 1;
                        const d = new Date(year, month, day);
                        const dow = d.getDay();
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = dateStr === today;
                        const isWeekend = dow === 0 || dow === 6;
                        return (
                            <Box key={day} sx={{
                                p: 0.5, textAlign: 'center', bgcolor: isToday ? '#e3f2fd' : '#fafafa',
                                borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f5f5f5',
                            }}>
                                <Typography variant="caption" fontSize={9} fontWeight={700} display="block"
                                    color={isWeekend ? '#d32f2f' : '#888'}>
                                    {DAY_NAMES[dow]}
                                </Typography>
                                <Typography variant="body2" fontSize={12} fontWeight={isToday ? 900 : 600}
                                    color={isToday ? '#1976d2' : isWeekend ? '#d32f2f' : '#333'}>
                                    {day}
                                </Typography>
                            </Box>
                        );
                    })}

                    {/* User rows */}
                    {loading ? (
                        Array.from({ length: 4 }, (_, i) => (
                            <React.Fragment key={i}>
                                <Box sx={{ p: 1, borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', position: 'sticky', left: 0, bgcolor: '#fff', zIndex: 1 }}>
                                    <Skeleton width={120} height={20} />
                                </Box>
                                {Array.from({ length: daysCount }, (_, j) => (
                                    <Box key={j} sx={{ borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f5f5f5' }}>
                                        <Skeleton height={36} />
                                    </Box>
                                ))}
                            </React.Fragment>
                        ))
                    ) : displayedUsers.map(user => (
                        <React.Fragment key={user.id}>
                            {/* User name cell */}
                            <Box sx={{
                                p: 1, borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0',
                                position: 'sticky', left: 0, bgcolor: '#fff', zIndex: 1,
                                display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#e3f2fd', color: '#1976d2', fontSize: 11, fontWeight: 700 }}>
                                    {(user.fullName || user.username).charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ overflow: 'hidden' }}>
                                    <Typography variant="body2" fontSize={12} fontWeight={700} color="#1a1a2e" noWrap>
                                        {user.fullName || user.username}
                                    </Typography>
                                    <Typography variant="caption" fontSize={10} color="text.secondary" noWrap>
                                        {user.username}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Day cells */}
                            {Array.from({ length: daysCount }, (_, i) => {
                                const day = i + 1;
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const cellAssigns = getAssignmentsForCell(user.id, dateStr);
                                const isToday = dateStr === today;
                                return (
                                    <Box key={day} sx={{
                                        borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f5f5f5',
                                        bgcolor: isToday ? '#f0f7ff' : '#fff',
                                        p: 0.25, display: 'flex', flexDirection: 'column', gap: 0.25,
                                        minHeight: 38, position: 'relative',
                                        '&:hover .add-btn': { opacity: 1 },
                                    }}>
                                        {cellAssigns.map(a => {
                                            const def = SHIFT_DEFS.find(s => s.id === a.shiftId);
                                            if (!def) return null;
                                            return (
                                                <Tooltip key={a.shiftId} title={`${def.label} (${def.time})`} arrow>
                                                    <Box onClick={() => setDeleteConfirmDialog({ userId: user.id, date: dateStr, shiftId: a.shiftId })}
                                                        sx={{
                                                            bgcolor: def.bgColor, color: def.color,
                                                            fontSize: 10, fontWeight: 800, textAlign: 'center',
                                                            borderRadius: 1, py: 0.25, cursor: 'pointer',
                                                            border: `1px solid ${def.color}30`,
                                                            '&:hover': { opacity: 0.7 },
                                                        }}>
                                                        {def.short}
                                                    </Box>
                                                </Tooltip>
                                            );
                                        })}
                                        {cellAssigns.length < 3 && (
                                            <Box className="add-btn" onClick={() => handleCellClick(user.id, day)}
                                                sx={{
                                                    opacity: 0, transition: '0.15s', cursor: 'pointer',
                                                    fontSize: 14, color: '#bbb', textAlign: 'center',
                                                    '&:hover': { color: '#1976d2' },
                                                }}>
                                                +
                                            </Box>
                                        )}
                                        {getNoteForCell(user.id, dateStr) && (
                                            <Tooltip title={getNoteForCell(user.id, dateStr)} arrow>
                                                <Box onClick={() => handleCellClick(user.id, day)} sx={{ 
                                                    bgcolor: '#fff9c4', color: '#f57f17', fontSize: 9, fontWeight: 700, 
                                                    textAlign: 'center', borderRadius: 1, py: 0.25, mt: 'auto', cursor: 'pointer',
                                                    border: '1px solid #fbc02d30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    '&:hover': { opacity: 0.8 }
                                                }}>
                                                    {getNoteForCell(user.id, dateStr)}
                                                </Box>
                                            </Tooltip>
                                        )}
                                    </Box>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </Box>
            </Paper>

            {/* Day management dialog */}
            <Dialog open={!!dayDialog} onClose={() => setDayDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography fontWeight={900}>Quản lý ngày làm việc</Typography>
                    <IconButton size="small" onClick={() => setDayDialog(null)}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    {dayDialog && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Ngày: <strong>{dayDialog.date}</strong> — Nhân viên: <strong>{users.find(u => u.id === dayDialog.userId)?.fullName || ''}</strong>
                            </Typography>
                            
                            <Box sx={{ p: 1.5, bgcolor: '#f8f9fb', borderRadius: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="#555" mb={1} display="block">THÊM CA LÀM VIỆC</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Chọn ca</InputLabel>
                                        <Select value={cellShift} onChange={e => setCellShift(e.target.value)} label="Chọn ca">
                                            {SHIFT_DEFS.map(s => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label={s.short} size="small" sx={{ bgcolor: s.bgColor, color: s.color, fontWeight: 800, fontSize: 11 }} />
                                                        {s.label} ({s.time})
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button variant="contained" onClick={handleCellAdd} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Thêm</Button>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" fontWeight={700} color="#555" mb={1} display="block">GHI CHÚ / XIN NGHỈ</Typography>
                                <TextField 
                                    fullWidth size="small" multiline rows={3}
                                    placeholder="Nhập ghi chú (ví dụ: Nghỉ ốm, đi muộn...)" 
                                    value={dayNote} onChange={e => setDayNote(e.target.value)}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setDayDialog(null)} sx={{ textTransform: 'none', fontWeight: 700, color: '#888' }}>Đóng</Button>
                    <Button variant="contained" onClick={() => {
                        if (dayDialog) {
                            setNoteForCell(dayDialog.userId, dayDialog.date, dayNote);
                            setDayDialog(null);
                            toast.success('Đã lưu ghi chú');
                        }
                    }} sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2, px: 3, bgcolor: '#1976d2' }}>Lưu ghi chú</Button>
                </DialogActions>
            </Dialog>

            {/* Quick assign dialog */}
            <Dialog open={openQuick} onClose={() => setOpenQuick(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography fontWeight={900}>Phân ca nhanh (nhiều người, nhiều ngày)</Typography>
                    <IconButton size="small" onClick={() => setOpenQuick(false)}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Shift select */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="#d32f2f" display="inline">* </Typography>
                        <Typography variant="caption" fontWeight={700} color="#555" display="inline">Ca</Typography>
                        <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                            <Select value={qShift} onChange={e => setQShift(e.target.value)}>
                                {SHIFT_DEFS.map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={s.short} size="small" sx={{ bgcolor: s.bgColor, color: s.color, fontWeight: 800 }} />
                                            {s.label} ({s.time})
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* User multi-select */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="#d32f2f" display="inline">* </Typography>
                        <Typography variant="caption" fontWeight={700} color="#555" display="inline">Nhân viên</Typography>
                        <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                            <Select multiple value={qUsers} onChange={e => setQUsers(e.target.value as string[])}
                                input={<OutlinedInput />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map(id => {
                                            const u = users.find(u => u.id === id);
                                            return <Chip key={id} label={`${u?.fullName || u?.username} (${u?.username})`} size="small"
                                                onDelete={() => setQUsers(prev => prev.filter(x => x !== id))}
                                                deleteIcon={<Close sx={{ fontSize: '14px !important' }} />}
                                                sx={{ fontWeight: 600, fontSize: 11 }} />;
                                        })}
                                    </Box>
                                )}>
                                {displayedUsers.map(u => (
                                    <MenuItem key={u.id} value={u.id}>
                                        <Checkbox checked={qUsers.includes(u.id)} size="small" />
                                        <ListItemText primary={u.fullName || u.username} secondary={u.username} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Day-of-week multi-select */}
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="#555" display="block" mb={0.5}>Lặp lại các ngày</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {dayOfWeekNames.map((name, idx) => {
                                const isSelected = qDays.includes(idx);
                                return (
                                    <Chip key={idx} label={name} size="small"
                                        onClick={() => setQDays(prev => isSelected ? prev.filter(d => d !== idx) : [...prev, idx])}
                                        onDelete={isSelected ? () => setQDays(prev => prev.filter(d => d !== idx)) : undefined}
                                        deleteIcon={isSelected ? <Close sx={{ fontSize: '14px !important' }} /> : undefined}
                                        sx={{
                                            fontWeight: 700, fontSize: 12, cursor: 'pointer',
                                            bgcolor: isSelected ? '#e3f2fd' : '#f5f5f5',
                                            color: isSelected ? '#1976d2' : '#888',
                                            border: isSelected ? '1px solid #90caf9' : '1px solid #e0e0e0',
                                        }} />
                                );
                            })}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button onClick={() => setOpenQuick(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#888' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleQuickAssign}
                        sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2, px: 3, bgcolor: '#1976d2' }}>Phân ca</Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirm dialog */}
            <Dialog open={!!deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography fontWeight={900} color="#d32f2f">Xóa ca làm việc</Typography>
                </DialogTitle>
                <DialogContent sx={{ py: 1 }}>
                    <Typography>Bạn có chắc chắn muốn xóa ca làm việc này không?</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setDeleteConfirmDialog(null)} sx={{ textTransform: 'none', fontWeight: 700, color: '#888' }}>Hủy</Button>
                    <Button variant="contained" color="error" onClick={() => {
                        if (deleteConfirmDialog) {
                            removeAssignment(deleteConfirmDialog.userId, deleteConfirmDialog.date, deleteConfirmDialog.shiftId);
                            setDeleteConfirmDialog(null);
                            toast.success('Đã xóa ca');
                        }
                    }} sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2 }}>Xóa ca</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
