import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Skeleton, Divider, Alert, LinearProgress
} from '@mui/material';
import { CloudUpload, Delete, Visibility, Close, Description, Storage } from '@mui/icons-material';
import { aiDocumentApi, KnowledgeDocument } from '../../../../services/aiDocumentApi';
import toast from 'react-hot-toast';

export default function AiKnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewChunks, setViewChunks] = useState<{ title: string; chunks: string[] } | null>(null);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiDocumentApi.getAll();
      setDocs(res.data || []);
    } catch { toast.error('Không thể tải danh sách tài liệu AI'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['.pdf', '.docx', '.pptx', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) { toast.error('Chỉ hỗ trợ: PDF, DOCX, PPTX, TXT'); return; }

    setUploading(true);
    try {
      const res = await aiDocumentApi.upload(file);
      toast.success(`Đã tải lên "${res.data.title}" — ${res.data.chunks} phân mảnh`);
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Tải tài liệu thất bại'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await aiDocumentApi.delete(confirmDelete);
      toast.success('Đã xóa tài liệu và dữ liệu vector AI');
      setConfirmDelete(null);
      loadData();
    } catch { toast.error('Xóa thất bại'); }
  };

  const handleViewChunks = async (doc: KnowledgeDocument) => {
    setLoadingChunks(true);
    try {
      const res = await aiDocumentApi.getChunks(doc.id);
      setViewChunks({ title: doc.title, chunks: res.data || [] });
    } catch { toast.error('Không thể tải phân mảnh tài liệu'); }
    finally { setLoadingChunks(false); }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fb', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="#1a1a2e" letterSpacing={-0.5} mb={0.5}>Kho Tri thức AI</Typography>
          <Typography variant="body2" color="text.secondary">Quản lý tài liệu huấn luyện cho trợ lý AI Chatbot (RAG)</Typography>
        </Box>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => fileRef.current?.click()} disabled={uploading}
          sx={{ bgcolor: '#1976d2', fontWeight: 700, px: 2.5, py: 1, borderRadius: 2, textTransform: 'none', boxShadow: '0 4px 12px rgba(25,118,210,0.2)' }}>
          Tải lên Tài liệu
        </Button>
        <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.pptx,.txt" onChange={handleUpload} />
      </Box>

      {uploading && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} icon={<Storage />}>
          Đang xử lý và phân mảnh tài liệu... Vui lòng chờ.
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary">{docs.length} TÀI LIỆU ĐÃ NẠP</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#fafafa', fontSize: 11, fontWeight: 800, color: '#888', py: 2 } }}>
                <TableCell>TÊN TÀI LIỆU</TableCell>
                <TableCell align="center">PHÂN MẢNH</TableCell>
                <TableCell>NGÀY TẠO</TableCell>
                <TableCell align="center">HÀNH ĐỘNG</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [1, 2, 3].map(i => (
                <TableRow key={i}><TableCell colSpan={4} sx={{ p: 0 }}><Skeleton height={56} /></TableCell></TableRow>
              )) : docs.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Description sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                  <Typography color="text.secondary">Chưa có tài liệu nào được nạp vào kho tri thức AI</Typography>
                </TableCell></TableRow>
              ) : docs.map(doc => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Description sx={{ color: '#1976d2' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="#1a1a2e">{doc.title}</Typography>
                        {doc.fileName && <Typography variant="caption" color="text.secondary">{doc.fileName}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`${doc.chunkCount || '—'} chunks`} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontSize={12} color="text.secondary">
                      {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleViewChunks(doc)} color="primary"><Visibility sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton size="small" onClick={() => setConfirmDelete(doc.id)} color="error"><Delete sx={{ fontSize: 18 }} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* View Chunks Dialog */}
      <Dialog open={!!viewChunks} onClose={() => setViewChunks(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={900}>Phân mảnh: {viewChunks?.title}</Typography>
          <IconButton size="small" onClick={() => setViewChunks(null)}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2 }}>
          {loadingChunks ? <Skeleton height={200} /> : viewChunks?.chunks.map((chunk, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2, mb: 1.5, bgcolor: '#f9fafb', borderRadius: 2, border: '1px solid #f0f0f0' }}>
              <Typography variant="caption" fontWeight={800} color="#1976d2" display="block" mb={0.5}>Đoạn #{i + 1}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6 }}>{chunk}</Typography>
            </Paper>
          ))}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle><Typography fontWeight={900} color="error">Xóa tài liệu AI?</Typography></DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>Tài liệu và toàn bộ dữ liệu vector nhúng sẽ bị xóa vĩnh viễn. AI sẽ không còn tham khảo được nội dung này nữa.</Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2 }}>Xóa tài liệu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
