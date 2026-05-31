import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, IconButton, Typography, TextField,
    Avatar, CircularProgress, Tooltip, Zoom, Fade,
    Chip, Stack, useTheme
} from '@mui/material';
import {
    SmartToy, Send, Close, Minimize,
    Psychology, History, DeleteSweep,
    AutoAwesome, HelpOutline, Inventory,
    TrendingUp, PersonSearch
} from '@mui/icons-material';
import { aiService } from '../../services/aiService';
import toast from 'react-hot-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTIONS = [
    { label: 'Doanh thu hôm nay', icon: <TrendingUp fontSize="small" />, prompt: 'Tổng doanh thu hôm nay là bao nhiêu?' },
    { label: 'Hàng tồn kho thấp', icon: <Inventory fontSize="small" />, prompt: 'Liệt kê các sản phẩm sắp hết hàng?' },
    { label: 'Kiểm tra khách hàng', icon: <PersonSearch fontSize="small" />, prompt: 'Ai là khách hàng thân thiết nhất?' },
    { label: 'Quy định đổi trả', icon: <HelpOutline fontSize="small" />, prompt: 'Quy định đổi trả hàng của cửa hàng như thế nào?' },
];

const CHAT_STORAGE_KEY = 'ai_chat_history';
const MAX_HISTORY = 50;

const loadChatHistory = (): Message[] => {
    try {
        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            }
        }
    } catch { /* ignore */ }
    return [{
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI SME. Tôi đã sẵn sàng hỗ trợ bạn quản lý cửa hàng và tra cứu tri thức nghiệp vụ.',
        timestamp: new Date(),
    }];
};

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(loadChatHistory);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();

    // Persist messages to localStorage
    useEffect(() => {
        try {
            const toSave = messages.slice(-MAX_HISTORY);
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
        } catch { /* ignore quota errors */ }
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (customText?: string) => {
        const textToSend = customText || input;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: Message = {
            role: 'user',
            content: textToSend.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customText) setInput('');
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

            // Phát âm thanh khi AI trả lời
            const audio = new Audio('/assets/ting.mp3');
            audio.play().catch(e => console.log('Audio error:', e));
        } catch (error) {
            toast.error('AI đang bận, vui lòng thử lại sau');
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        const freshMessages: Message[] = [{
            role: 'assistant',
            content: 'Hộp thoại đã được làm mới. Tôi có thể giúp gì cho bạn?',
            timestamp: new Date(),
        }];
        setMessages(freshMessages);
        try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch { /* ignore */ }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 100, right: 30, zIndex: 9999 }}>
            {/* Floating Action Button (FAB) */}
            <Zoom in={!isOpen}>
                <Box sx={{ position: 'relative' }}>
                    <IconButton
                        onClick={() => setIsOpen(true)}
                        sx={{
                            width: 60, height: 60, 
                            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)', 
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(29, 78, 216, 0.4)',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            '&:hover': { 
                                transform: 'scale(1.1) rotate(5deg)',
                                boxShadow: '0 12px 40px rgba(29, 78, 216, 0.6)',
                            },
                        }}
                    >
                        <SmartToy sx={{ fontSize: 32 }} />
                    </IconButton>
                    <Box sx={{ 
                        position: 'absolute', top: -5, right: -5, 
                        width: 18, height: 18, bgcolor: '#10b981', 
                        borderRadius: '50%', border: '3px solid white',
                        animation: 'pulse 2s infinite'
                    }} />
                </Box>
            </Zoom>

            {/* Chat Panel */}
            <Fade in={isOpen}>
                <Paper
                    elevation={24}
                    sx={{
                        position: 'fixed', top: '50%', right: 30,
                        transform: 'translateY(-50%)',
                        width: 400, height: '85vh', maxHeight: 750, borderRadius: 4,
                        display: isOpen ? 'flex' : 'none', flexDirection: 'column',
                        overflow: 'hidden', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 80px rgba(0,0,0,0.25)',
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2, background: 'linear-gradient(90deg, #1d4ed8 0%, #1e40af 100%)', 
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                                    <Psychology sx={{ fontSize: 24 }} />
                                </Avatar>
                                <Box sx={{ 
                                    position: 'absolute', bottom: 0, right: 0, 
                                    width: 10, height: 10, bgcolor: '#10b981', 
                                    borderRadius: '50%', border: '2px solid #1d4ed8'
                                }} />
                            </Box>
                            <Box>
                                <Typography fontWeight={800} fontSize={15} letterSpacing="-0.3px">
                                    AI Co-pilot <AutoAwesome sx={{ fontSize: 12, ml: 0.5 }} />
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 10 }}>
                                    ● Đang trực tuyến
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Làm mới">
                                <IconButton size="small" onClick={clearChat} sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}>
                                    <DeleteSweep sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}>
                                <Close sx={{ fontSize: 22 }} />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Messages Area */}
                    <Box
                        ref={scrollRef}
                        sx={{
                            flexGrow: 1, p: 2, overflowY: 'auto', 
                            bgcolor: '#f8fafc',
                            backgroundImage: 'radial-gradient(#e2e8f0 0.5px, transparent 0.5px)',
                            backgroundSize: '15px 15px',
                            display: 'flex', flexDirection: 'column', gap: 2.5,
                        }}
                    >
                        {messages.map((m, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap: 1.5,
                                }}
                            >
                                {m.role === 'assistant' && (
                                    <Avatar sx={{ 
                                        width: 32, height: 32, 
                                        bgcolor: '#1d4ed8', 
                                        boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)'
                                    }}>
                                        🤖
                                    </Avatar>
                                )}
                                <Box sx={{ maxWidth: '85%' }}>
                                    <Paper
                                        sx={{
                                            p: 2, borderRadius: 3,
                                            bgcolor: m.role === 'user' ? '#1d4ed8' : 'white',
                                            color: m.role === 'user' ? 'white' : '#1e293b',
                                            borderTopRightRadius: m.role === 'user' ? 0 : 3,
                                            borderTopLeftRadius: m.role === 'assistant' ? 0 : 3,
                                            boxShadow: m.role === 'user' 
                                                ? '0 4px 12px rgba(29, 78, 216, 0.2)' 
                                                : '0 2px 8px rgba(0,0,0,0.05)',
                                        }}
                                    >
                                        <Typography fontSize={13.5} sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                            {m.content}
                                        </Typography>
                                    </Paper>
                                    <Typography variant="caption" color="text.secondary" sx={{ 
                                        display: 'block', mt: 0.75, px: 0.5,
                                        textAlign: m.role === 'user' ? 'right' : 'left', 
                                        fontSize: 10, fontWeight: 600, opacity: 0.7
                                    }}>
                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        
                        {isLoading && (
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1d4ed8' }}>🤖</Avatar>
                                <Paper sx={{ 
                                    px: 2, py: 1.5, borderRadius: 3, borderTopLeftRadius: 0,
                                    bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 1.5,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Box className="dot-flashing" sx={{ animation: 'bounce 1s infinite', delay: '0s' }}>●</Box>
                                        <Box className="dot-flashing" sx={{ animation: 'bounce 1s infinite', delay: '0.2s' }}>●</Box>
                                        <Box className="dot-flashing" sx={{ animation: 'bounce 1s infinite', delay: '0.4s' }}>●</Box>
                                    </Box>
                                    <Typography fontSize={12} color="text.secondary" fontWeight={600}>AI đang phân tích dữ liệu...</Typography>
                                </Paper>
                            </Box>
                        )}
                    </Box>

                    {/* Quick Suggestions */}
                    {!isLoading && messages.length < 5 && (
                        <Box sx={{ px: 2, pb: 1, pt: 1, bgcolor: '#f8fafc' }}>
                            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                                {SUGGESTIONS.map((s, i) => (
                                    <Chip
                                        key={i}
                                        icon={s.icon}
                                        label={s.label}
                                        onClick={() => handleSend(s.prompt)}
                                        sx={{ 
                                            bgcolor: 'white', border: '1px solid #e2e8f0', 
                                            fontSize: 11.5, fontWeight: 600, py: 1.8,
                                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8' }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Input Area */}
                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #f1f5f9' }}>
                        <TextField
                            fullWidth size="small" multiline maxRows={4}
                            placeholder="Nhập câu hỏi hoặc yêu cầu..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: '#f8fafc',
                                    fontSize: 13.5,
                                    pr: 1,
                                    transition: 'all 0.2s',
                                    '&.Mui-focused': { bgcolor: 'white' }
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isLoading}
                                        sx={{ 
                                            color: '#1d4ed8', 
                                            bgcolor: input.trim() ? '#eff6ff' : 'transparent',
                                            '&:hover': { bgcolor: '#dbeafe' }
                                        }}
                                    >
                                        <Send sx={{ fontSize: 22 }} />
                                    </IconButton>
                                ),
                            }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1.5, gap: 0.5, opacity: 0.5 }}>
                            <AutoAwesome sx={{ fontSize: 10 }} />
                            <Typography variant="caption" sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5 }}>
                                POWERED BY SME AI ENGINE
                            </Typography>
                        </Box>
                    </Box>

                    {/* Global Styles for Animations */}
                    <style>
                        {`
                            @keyframes pulse {
                                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                            }
                            @keyframes bounce {
                                0%, 100% { transform: translateY(0); opacity: 0.4; }
                                50% { transform: translateY(-3px); opacity: 1; }
                            }
                        `}
                    </style>
                </Paper>
            </Fade>
        </Box>
    );
}
