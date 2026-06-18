import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Grid, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    TextField, InputAdornment, Chip, LinearProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import {
    CloudUpload, Delete, Search, Description, 
    Science, AutoAwesome, CheckCircle, Info
} from '@mui/icons-material';
import { aiService, KnowledgeDocument } from '../../../../../services/aiService';
import toast from 'react-hot-toast';
import { useConfirm } from '../../../../../contexts/ConfirmContext';

export default function AIDocumentsTab() {
    const { confirm } = useConfirm();
    const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [showTest, setShowTest] = useState(false);
    
    // View Document state
    const [viewDoc, setViewDoc] = useState<KnowledgeDocument | null>(null);
    const [viewChunks, setViewChunks] = useState<string[]>([]);
    const [loadingChunks, setLoadingChunks] = useState(false);

    const loadDocs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiService.getDocuments();
            setDocs(res.data?.data || []);
        } catch (err) {
            console.error('Load docs failed:', err);
            toast.error('Không thể tải danh sách tài liệu tri thức');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDocs();
    }, [loadDocs]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = toast.loading(`Đang tải lên và xử lý: ${file.name}...`);
        try {
            await aiService.uploadDocument(file);
            toast.success('Đã tải lên và huấn luyện AI thành công!', { id: toastId });
            loadDocs();
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error('Lỗi khi tải lên tài liệu', { id: toastId });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: 'Xóa tài liệu AI',
            description: 'Bạn có chắc chắn muốn xóa tài liệu này? AI sẽ không còn truy cập được kiến thức này.',
            confirmText: 'Xóa',
            color: 'error'
        });
        if (!ok) return;
        
        try {
            await aiService.deleteDocument(id);
            toast.success('Đã xóa tài liệu');
            loadDocs();
        } catch (err) {
            toast.error('Lỗi khi xóa tài liệu');
        }
    };

    const handleTestSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await aiService.searchSemantic(searchQuery);
            setSearchResults(res.data.data);
            if ((res.data?.data?.length ?? 0) === 0) {
                toast.error('Không tìm thấy thông tin liên quan trong kho tri thức');
            }
        } catch (err) {
            toast.error('Lỗi khi tìm kiếm ngữ nghĩa');
        } finally {
            setSearching(false);
        }
    };

    const handleViewDoc = async (doc: KnowledgeDocument) => {
        setViewDoc(doc);
        setLoadingChunks(true);
        try {
            const res = await aiService.getDocumentChunks(doc.id);
            setViewChunks(res.data.data);
        } catch (err) {
            toast.error('Lỗi khi tải chi tiết tài liệu');
        } finally {
            setLoadingChunks(false);
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Typography fontWeight={700} fontSize={18} display="flex" alignItems="center" gap={1}>
                            <AutoAwesome sx={{ color: '#8b5cf6' }} /> Quản lý tri thức AI (RAG)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tải lên tài liệu PDF/Word để huấn luyện AI Co-pilot về nghiệp vụ cửa hàng của bạn.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Science />}
                            onClick={() => setShowTest(true)}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                            Thử nghiệm trí tuệ
                        </Button>
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<CloudUpload />}
                            disabled={uploading}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#1d4ed8' }}
                        >
                            {uploading ? 'Đang xử lý...' : 'Tải lên tài liệu'}
                            <input type="file" hidden accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                        </Button>
                    </Box>
                </Box>

                {uploading && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" color="primary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                            Đang xử lý tài liệu (Vectorizing)... Vui lòng đợi.
                        </Typography>
                        <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                )}

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>TÀI LIỆU</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>ĐỊNH DẠNG</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>DỮ LIỆU (CHUNKS)</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>NGÀY TẢI LÊN</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b' }} align="right">THAO TÁC</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i}><TableCell colSpan={5}><LinearProgress /></TableCell></TableRow>
                                ))
                            ) : docs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Description sx={{ fontSize: 48, color: '#e2e8f0', mb: 1.5 }} />
                                        <Typography color="text.secondary" fontSize={14}>Chưa có tài liệu tri thức nào được tải lên</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                docs.map(doc => (
                                    <TableRow key={doc.id} hover>
                                        <TableCell>
                                            <Typography 
                                                fontWeight={700} fontSize={14} color="#2563eb" 
                                                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                onClick={() => handleViewDoc(doc)}
                                            >
                                                {doc.title || doc.fileName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">{doc.fileName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={doc.fileType.toUpperCase()} size="small" sx={{ fontWeight: 700, fontSize: 10 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={13} fontWeight={600}>{doc.chunkCount} đoạn tri thức</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} color="text.secondary">
                                                {new Date(doc.createdAt).toLocaleString('vi-VN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Xóa tri thức">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                                                    <Delete sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

     

            {/* Dialog Test Semantic Search */}
            <Dialog open={showTest} onClose={() => setShowTest(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Kiểm thử truy xuất tri thức</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Nhập một câu hỏi để kiểm tra xem hệ thống tìm thấy những đoạn thông tin nào trong kho tri thức của bạn.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        <TextField
                            fullWidth size="small" placeholder="Ví dụ: Quy định đổi trả hàng của cửa hàng là gì?"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleTestSearch()}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search sx={{ color: '#64748b' }} /></InputAdornment>
                            }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleTestSearch} 
                            disabled={searching}
                            sx={{ minWidth: 120, textTransform: 'none', fontWeight: 700 }}
                        >
                            {searching ? 'Đang tìm...' : 'Truy xuất'}
                        </Button>
                    </Box>

                    {searchResults.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="caption" fontWeight={800} color="#64748b" letterSpacing={1}> KẾT QUẢ TRUY XUẤT (Top 5)</Typography>
                            {searchResults.map((res, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', position: 'relative' }}>
                                    <Chip 
                                        label={`Độ khớp: ${(res.score * 100).toFixed(1)}%`} 
                                        size="small" 
                                        color="success"
                                        sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, fontSize: 10 }}
                                    />
                                    <Typography variant="body2" sx={{ pr: 12, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                        "...{res.content || res.text || res.formattedContent || (res.metadata && res.metadata.content) || (res.metadata && res.metadata.text) || 'Không có nội dung'}..."
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Description sx={{ fontSize: 14, color: '#94a3b8' }} />
                                        <Typography variant="caption" color="text.secondary">Nguồn: {res.metadata?.source || res.metadata?.fileName || res.metadata?.documentId || 'Tài liệu hệ thống'}</Typography>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTest(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>Đóng</Button>
                </DialogActions>
            </Dialog>
            {/* Dialog View Document Chunks */}
            <Dialog open={!!viewDoc} onClose={() => setViewDoc(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Nội dung tài liệu: {viewDoc?.title}</DialogTitle>
                <DialogContent dividers>
                    {loadingChunks ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" color="text.secondary" align="center">Đang tải nội dung...</Typography>
                        </Box>
                    ) : viewChunks.length === 0 ? (
                        <Alert severity="info">Không tìm thấy nội dung cho tài liệu này.</Alert>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {viewChunks.map((chunk, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                    <Typography variant="caption" fontWeight={800} color="#64748b" display="block" mb={1}>
                                        ĐOẠN {i + 1}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {chunk}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDoc(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
