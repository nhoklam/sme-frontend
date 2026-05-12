import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, IconButton, Typography, TextField,
    Avatar, CircularProgress, Tooltip, Zoom, Fade,
} from '@mui/material';
import {
    SmartToy, Send, Close, Minimize,
    Psychology, History, DeleteSweep,
} from '@mui/icons-material';
import { aiService } from '../../services/aiService';
import toast from 'react-hot-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Xin chào! Tôi là trợ lý AI SME. Tôi có thể giúp gì cho bạn hôm nay?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages
                .slice(-6)
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');

            const res = await aiService.chat({
                message: userMsg.content,
                conversationHistory: history,
            });

            const assistantMsg: Message = {
                role: 'assistant',
                content: res.data.data.reply,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            toast.error('AI đang bận, vui lòng thử lại sau');
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: 'Hộp thoại đã được làm mới. Tôi có thể giúp gì cho bạn?',
                timestamp: new Date(),
            },
        ]);
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
            <Zoom in={!isOpen}>
                <IconButton
                    onClick={() => setIsOpen(true)}
                    sx={{
                        width: 56, height: 56, bgcolor: '#1d4ed8', color: 'white',
                        boxShadow: '0 4px 12px rgba(29, 78, 216, 0.4)',
                        '&:hover': { bgcolor: '#1e40af', transform: 'scale(1.05)' },
                    }}
                >
                    <SmartToy sx={{ fontSize: 28 }} />
                </IconButton>
            </Zoom>

            <Fade in={isOpen}>
                <Paper
                    sx={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 380, height: 520, borderRadius: 4,
                        display: isOpen ? 'flex' : 'none', flexDirection: 'column',
                        overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                    }}
                >
                    <Box sx={{
                        p: 2, bgcolor: '#1d4ed8', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                                <Psychology sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Box>
                                <Typography fontWeight={700} fontSize={14}>Trợ lý AI SME</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: -0.5 }}>
                                    Online • Đang sẵn sàng
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Tooltip title="Xóa lịch sử">
                                <IconButton size="small" onClick={clearChat} sx={{ color: 'white' }}>
                                    <DeleteSweep sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                                <Close sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Box>
                    </Box>

                    <Box
                        ref={scrollRef}
                        sx={{
                            flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f8fafc',
                            display: 'flex', flexDirection: 'column', gap: 2,
                        }}
                    >
                        {messages.map((m, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap: 1,
                                }}
                            >
                                {m.role === 'assistant' && (
                                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#1d4ed8', fontSize: 14 }}>
                                        🤖
                                    </Avatar>
                                )}
                                <Box sx={{ maxWidth: '80%' }}>
                                    <Paper
                                        sx={{
                                            p: 1.5, borderRadius: 2.5,
                                            bgcolor: m.role === 'user' ? '#1d4ed8' : 'white',
                                            color: m.role === 'user' ? 'white' : '#1e293b',
                                            borderTopRightRadius: m.role === 'user' ? 2 : 2.5,
                                            borderTopLeftRadius: m.role === 'assistant' ? 2 : 2.5,
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        }}
                                    >
                                        <Typography fontSize={13} sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                            {m.content}
                                        </Typography>
                                    </Paper>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: m.role === 'user' ? 'right' : 'left', fontSize: 10 }}>
                                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#1d4ed8', fontSize: 14 }}>
                                    🤖
                                </Avatar>
                                <Paper sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} thickness={5} />
                                    <Typography fontSize={12} color="text.secondary">Đang suy nghĩ...</Typography>
                                </Paper>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #f1f5f9' }}>
                        <TextField
                            fullWidth size="small" multiline maxRows={3}
                            placeholder="Nhập câu hỏi của bạn..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        sx={{ color: '#1d4ed8' }}
                                    >
                                        <Send sx={{ fontSize: 20 }} />
                                    </IconButton>
                                ),
                                sx: { borderRadius: 3, bgcolor: '#f8fafc', fontSize: 13 },
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center', fontSize: 10 }}>
                            AI có thể nhầm lẫn, vui lòng kiểm tra lại thông tin quan trọng.
                        </Typography>
                    </Box>
                </Paper>
            </Fade>
        </Box>
    );
}
