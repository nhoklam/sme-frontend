import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Paper, Typography, TextField, CircularProgress, Fab, Fade } from '@mui/material';
import { Chat as ChatIcon, Close, Send, SmartToy, Person } from '@mui/icons-material';
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
        content: 'Xin chào! Tôi là trợ lý AI của nhà sách. Tôi có thể giúp bạn tìm kiếm sách hoặc tư vấn mua hàng hôm nay không?'
    }]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:8080/api/public/ai/chat', {
                message: userMsg.content
            });

            if (res.data.success) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: res.data.data.reply
                }]);
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

    return (
        <>
            <Fade in={!isOpen}>
                <Fab 
                    color="primary" 
                    aria-label="chat" 
                    onClick={() => setIsOpen(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1000,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                    }}
                >
                    <ChatIcon />
                </Fab>
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
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToy />
                            <Typography variant="subtitle1" fontWeight="bold">Trợ lý Nhà sách</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
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
                                gap: 1,
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}>
                                <Box sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    bgcolor: msg.role === 'user' ? 'primary.light' : 'secondary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    flexShrink: 0
                                }}>
                                    {msg.role === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                                </Box>
                                <Paper elevation={1} sx={{ 
                                    p: 1.5, 
                                    maxWidth: '75%',
                                    bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                                    color: msg.role === 'user' ? 'white' : 'text.primary',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    '& p': { m: 0 },
                                    '& ul, & ol': { m: 0, pl: 2 },
                                    '& li': { mb: 0.5 }
                                }}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </Paper>
                            </Box>
                        ))}
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
                                        color="primary" 
                                        onClick={handleSend}
                                        disabled={!inputValue.trim() || isLoading}
                                        size="small"
                                    >
                                        <Send fontSize="small" />
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
