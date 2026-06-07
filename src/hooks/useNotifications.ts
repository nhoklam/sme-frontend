import { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

// Base URL detection
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
// Thay thế http/https thành ws/wss
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

export interface AppNotification {
    id: string;
    type: 'NEW_ORDER' | 'LOW_STOCK' | string;
    message: string;
    productId?: string;
    orderId?: string;
    timestamp: number;
    read: boolean;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const client = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);
                // Subscribe to the public notifications topic
                client.subscribe('/topic/notifications', (message) => {
                    try {
                        const body = JSON.parse(message.body);
                        const newNotif: AppNotification = {
                            id: Math.random().toString(36).substring(7) + Date.now().toString(),
                            type: body.type,
                            message: body.message,
                            productId: body.productId,
                            orderId: body.orderId,
                            timestamp: Date.now(),
                            read: false,
                        };

                        setNotifications((prev) => {
                            const updated = [newNotif, ...prev];
                            // Giới hạn tối đa 50 notifications
                            if (updated.length > 50) {
                                return updated.slice(0, 50);
                            }
                            return updated;
                        });
                    } catch (err) {
                        console.error('Error parsing notification message', err);
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    return { notifications, unreadCount, markAllRead, markAsRead, isConnected };
};
