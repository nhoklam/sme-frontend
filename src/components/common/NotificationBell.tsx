import React, { useState } from 'react';
import { 
    Badge, 
    IconButton, 
    Popover, 
    List, 
    ListItem, 
    ListItemAvatar, 
    Avatar, 
    ListItemText, 
    Typography, 
    Box, 
    Button,
    Divider,
    ListItemButton
} from '@mui/material';
import { 
    Notifications as NotificationsIcon,
    ShoppingCart as ShoppingCartIcon,
    WarningAmber as WarningAmberIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import { useNotifications, AppNotification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_ORDER':
                return <ShoppingCartIcon />;
            case 'LOW_STOCK':
                return <WarningAmberIcon />;
            default:
                return <NotificationsIcon />;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'NEW_ORDER':
                return '#1890ff';
            case 'LOW_STOCK':
                return '#faad14';
            default:
                return '#8c8c8c';
        }
    };

    return (
        <>
            <IconButton 
                color="inherit" 
                onClick={handleClick}
                aria-describedby={id}
                sx={{ ml: 1 }}
            >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: { width: 360, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                    <Typography variant="h6" fontSize={16} fontWeight={700}>Thông báo</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={markAllRead} sx={{ textTransform: 'none', fontSize: 12 }}>
                            Đánh dấu đã đọc tất cả
                        </Button>
                    )}
                </Box>
                
                <List sx={{ p: 0, overflowY: 'auto', flex: 1, maxHeight: 400 }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary" variant="body2">Không có thông báo mới</Typography>
                        </Box>
                    ) : (
                        notifications.map((notif: AppNotification) => (
                            <React.Fragment key={notif.id}>
                                <ListItemButton 
                                    alignItems="flex-start" 
                                    onClick={() => markAsRead(notif.id)}
                                    sx={{ 
                                        bgcolor: notif.read ? 'transparent' : '#e6f7ff',
                                        '&:hover': { bgcolor: notif.read ? '#f5f5f5' : '#bae0ff' }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: getIconColor(notif.type), color: '#fff' }}>
                                            {getIcon(notif.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" fontWeight={notif.read ? 500 : 700} color="#262626">
                                                {notif.message}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                                {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: vi })}
                                            </Typography>
                                        }
                                    />
                                    {!notif.read && (
                                        <CircleIcon sx={{ fontSize: 10, color: '#1890ff', mt: 1 }} />
                                    )}
                                </ListItemButton>
                                <Divider component="li" />
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Popover>
        </>
    );
};

export default NotificationBell;
