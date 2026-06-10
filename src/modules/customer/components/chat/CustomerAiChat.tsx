import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Paper, Typography, TextField, CircularProgress, Fab, Fade, Avatar, Chip, Badge } from '@mui/material';
import { Chat as ChatIcon, Close, Send, SmartToy, Person, SupportAgent } from '@mui/icons-material';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const CustomerAiChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        role: 'assistant',
        content: '👋 Chào mừng bạn đến với nhà sách! Mình là Trợ lý AI, có thể giúp bạn tìm sách, tra cứu đơn hàng hoặc tư vấn chương trình khuyến mãi.\n\nBạn cần mình hỗ trợ gì hôm nay?'
    }]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Show greeting bubble after 3 seconds
        const timer = setTimeout(() => {
            if (!isOpen) setShowGreeting(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string = inputValue.trim()) => {
        if (!text) return;

        const historyData = messages
            .filter(m => m.id !== 'welcome')
            .slice(-6)
            .map(m => ({ role: m.role, content: m.content }));

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
            const res = await axios.post(`${apiUrl}/public/ai/chat`, {
                message: userMsg.content,
                history: historyData
            });

            if (res.data.success) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: res.data.data.reply
                }]);
                const audio = new Audio('/assets/ting.mp3');
                audio.play().catch(e => console.log('Audio error:', e));
            } else {
                throw new Error(res.data.message);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Xin lỗi, hiện tại tôi đang gặp chút sự cố kết nối. Bạn vui lòng thử lại sau nhé!'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const SUGGESTIONS = ['Gợi ý sách mới', 'Có khuyến mãi gì?', 'Chính sách đổi trả'];

    return (
        <>
            <Fade in={!isOpen}>
                <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Fade in={showGreeting}>
                        <Paper 
                            elevation={4} 
                            onClick={() => { setShowGreeting(false); setIsOpen(true); }}
                            sx={{ 
                                p: 1.5, 
                                borderRadius: '16px 16px 4px 16px', 
                                bgcolor: 'white', 
                                border: '1px solid #f0f0f0',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)', bgcolor: '#f8fafc' }
                            }}
                        >
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                👋 Xin chào! Mình có thể tư vấn sách cho bạn không?
                            </Typography>
                            <IconButton size="small" 
                                onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }} 
                                sx={{ p: 0.5, bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                            >
                                <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Paper>
                    </Fade>
                    
                    <Badge 
                        overlap="circular"
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        variant="dot"
                        color="error"
                        invisible={!showGreeting}
                    >
                        <Fab 
                            onClick={() => { setIsOpen(true); setShowGreeting(false); }}
                            sx={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: 'white',
                                boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
                                '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)' }
                            }}
                        >
                            <SupportAgent fontSize="large" />
                        </Fab>
                    </Badge>
                </Box>
            </Fade>

            <Fade in={isOpen}>
                <Paper
                    elevation={6}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: 380,
                        height: 550,
                        display: isOpen ? 'flex' : 'none',
                        flexDirection: 'column',
                        zIndex: 1000,
                        borderRadius: 3,
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ 
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white', 
                        p: 2, pb: 2.5,
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" sx={{ '& .MuiBadge-badge': { bgcolor: '#10b981', boxShadow: '0 0 0 2px #1d4ed8' } }}>
                                <Avatar sx={{ bgcolor: 'white', color: '#1d4ed8', width: 40, height: 40 }}>
                                    <SupportAgent />
                                </Avatar>
                            </Badge>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>Trợ lý Tư vấn</Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Nhà sách trực tuyến</Typography>
                            </Box>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Chat Area */}
                    <Box sx={{ 
                        flex: 1, 
                        p: 2, 
                        overflowY: 'auto', 
                        bgcolor: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        {messages.map((msg) => (
                            <Box key={msg.id} sx={{ 
                                display: 'flex', 
                                gap: 1.5,
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}>
                                <Avatar sx={{ 
                                    width: 32, height: 32, 
                                    bgcolor: msg.role === 'user' ? '#e2e8f0' : '#10b981',
                                    color: msg.role === 'user' ? '#64748b' : 'white',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}>
                                    {msg.role === 'user' ? <Person fontSize="small" /> : <SupportAgent fontSize="small" />}
                                </Avatar>
                                <Paper elevation={0} sx={{ 
                                    p: 1.5, 
                                    maxWidth: '75%',
                                    bgcolor: msg.role === 'user' ? '#2563eb' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#334155',
                                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    '& p': { m: 0, fontSize: '0.9rem', lineHeight: 1.5 },
                                    '& ul, & ol': { m: 0, pl: 2.5, mt: 0.5 },
                                    '& li': { mb: 0.5, fontSize: '0.9rem' },
                                    '& strong': { color: msg.role === 'user' ? '#fff' : '#0f172a' }
                                }}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </Paper>
                            </Box>
                        ))}
                        {messages.length === 1 && !isLoading && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pl: 5, mt: -1 }}>
                                {SUGGESTIONS.map((sug, i) => (
                                    <Chip 
                                        key={i} label={sug} size="small" 
                                        onClick={() => handleSend(sug)}
                                        sx={{ 
                                            bgcolor: 'white', border: '1px solid #cbd5e1', color: '#475569',
                                            fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                            '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' }
                                        }} 
                                    />
                                ))}
                            </Box>
                        )}
                        {isLoading && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ 
                                    width: 32, height: 32, borderRadius: '50%', bgcolor: 'secondary.main',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                }}>
                                    <SmartToy fontSize="small" />
                                </Box>
                                <Paper elevation={1} sx={{ p: 1.5, borderRadius: '16px 16px 16px 4px', display: 'flex', alignItems: 'center' }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>Đang gõ...</Typography>
                                </Paper>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Nhập câu hỏi của bạn..."
                            variant="outlined"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            InputProps={{
                                endAdornment: (
                                    <IconButton 
                                        onClick={() => handleSend()}
                                        disabled={!inputValue.trim() || isLoading}
                                        size="small"
                                        sx={{ 
                                            bgcolor: inputValue.trim() ? '#2563eb' : '#e2e8f0', 
                                            color: inputValue.trim() ? 'white' : '#94a3b8',
                                            mr: 0.5,
                                            '&:hover': { bgcolor: inputValue.trim() ? '#1d4ed8' : '#e2e8f0' }
                                        }}
                                    >
                                        <Send fontSize="small" sx={{ ml: 0.5 }} />
                                    </IconButton>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '24px'
                                }
                            }}
                        />
                    </Box>
                </Paper>
            </Fade>
        </>
    );
};

export default CustomerAiChat;
