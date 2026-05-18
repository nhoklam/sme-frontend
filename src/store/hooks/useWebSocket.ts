import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

export type WsEventType =
    | 'LOW_STOCK'
    | 'NEW_ORDER'
    | 'SHIFT_PENDING_APPROVAL'
    | 'TRANSFER_ARRIVED'
    | 'IMPORT_SUCCESS'
    | 'OUT_OF_STOCK';

export interface WsPayload {
    type: WsEventType;
    productId?: string;
    warehouseId?: string;
    warehouseName?: string;
    quantity?: number;
    minQuantity?: number;
    productName?: string;
    orderCode?: string;
    amount?: number;
    shiftId?: string;
    transferId?: string;
    [key: string]: unknown;
}

type TopicHandler = (payload: WsPayload) => void;

// Define a global audio object to prevent multiple allocations
let notificationAudio: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
    notificationAudio = new Audio('/assets/ting.mp3');
    notificationAudio.volume = 0.8;
}

interface UseWebSocketOptions {
    warehouseId: string | undefined | null;
    onMessage: TopicHandler;
    enabled?: boolean;
}

// Số lần retry tối đa trước khi dừng hẳn
const MAX_RETRIES = 3;

// Lấy WebSocket URL từ biến môi trường hoặc mặc định
const getWsUrl = (): string => {
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    return apiBase
        .replace(/^http:/, 'ws:')
        .replace(/^https:/, 'wss:')
        .replace(/\/api$/, '/ws');
};

export function useWebSocket({ warehouseId, onMessage, enabled = true }: UseWebSocketOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);
    const subscriptionsRef = useRef<StompSubscription[]>([]);
    const onMessageRef = useRef<TopicHandler>(onMessage);
    // Đếm số lần kết nối thất bại liên tiếp
    const retryCountRef = useRef(0);
    // Tránh gọi cleanup 2 lần
    const isDeactivatingRef = useRef(false);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const subscribe = useCallback((client: Client, wid: string) => {
        // Xóa subscription cũ
        subscriptionsRef.current.forEach(s => {
            try { s.unsubscribe(); } catch { /* ignore */ }
        });
        subscriptionsRef.current = [];

        const topics = [
            `/topic/warehouse/${wid}/low-stock`,
            `/topic/warehouse/${wid}/new-order`,
            `/topic/warehouse/${wid}/shift-alert`,
            `/topic/warehouse/${wid}/transfer`,
            `/topic/warehouse/${wid}/inventory`,
        ];

        topics.forEach(topic => {
            const sub = client.subscribe(topic, (msg: IMessage) => {
                try {
                    const payload = JSON.parse(msg.body) as WsPayload;
                    onMessageRef.current(payload);
                } catch {
                    console.warn('[WebSocket] Cannot parse message:', msg.body);
                }
            });
            subscriptionsRef.current.push(sub);
        });

        console.log(`[WebSocket] Subscribed to ${topics.length} topics for warehouse ${wid}`);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Kiểm tra quyền từ localStorage hoặc store
        const userStr = localStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const isAdmin = userData?.role === 'ROLE_ADMIN';

        // Nếu không phải Admin và cũng không có warehouseId thì mới bỏ qua
        if (!isAdmin && !warehouseId) {
            console.log('[WebSocket] No warehouseId and not Admin — skipping WebSocket connection');
            return;
        }

        // Xác định các topic cần subscribe
        const topics = isAdmin
            ? [
                '/topic/admin/low-stock',
                '/topic/admin/new-order',
                '/topic/admin/shift-alert',
                '/topic/admin/transfer'
            ]
            : [
                `/topic/warehouse/${warehouseId}/low-stock`,
                `/topic/warehouse/${warehouseId}/new-order`,
                `/topic/warehouse/${warehouseId}/shift-alert`,
                `/topic/warehouse/${warehouseId}/transfer`,
                `/topic/warehouse/${warehouseId}/inventory`,
            ];

        // Reset retry counter khi thông tin thay đổi
        retryCountRef.current = 0;
        isDeactivatingRef.current = false;

        const accessToken = localStorage.getItem('access_token') || userData?.accessToken;

        const client = new Client({
            brokerURL: getWsUrl(),
            connectHeaders: {
                Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
            reconnectDelay: 0,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,

            onConnect: () => {
                retryCountRef.current = 0;
                setIsConnected(true);
                console.log('[WebSocket] Connected');

                // Đăng ký các topic đã xác định
                topics.forEach(topic => {
                    const sub = client.subscribe(topic, (msg: IMessage) => {
                        try {
                            const payload = JSON.parse(msg.body) as WsPayload;

                            // Phát âm thanh khi có đơn hàng mới
                            if (payload.type === 'NEW_ORDER' && notificationAudio) {
                                notificationAudio.play().catch(e => console.warn('Autoplay prevented:', e));
                            }

                            onMessageRef.current(payload);
                        } catch {
                            console.warn('[WebSocket] Cannot parse message:', msg.body);
                        }
                    });
                    subscriptionsRef.current.push(sub);
                });
                console.log(`[WebSocket] Subscribed to ${topics.length} topics`);
            },

            onDisconnect: () => {
                setIsConnected(false);
                console.log('[WebSocket] Disconnected');

                // Không retry nếu đang trong quá trình cleanup
                if (isDeactivatingRef.current) return;

                retryCountRef.current += 1;

                if (retryCountRef.current >= MAX_RETRIES) {
                    console.warn(
                        `[WebSocket] Đã thử kết nối ${MAX_RETRIES} lần không thành công. ` +
                        'Dừng retry — kiểm tra backend WebSocket server.'
                    );
                    return;
                }

                // Retry với delay tăng dần: 3s, 6s, 9s...
                const delay = retryCountRef.current * 3000;
                console.log(`[WebSocket] Retry lần ${retryCountRef.current}/${MAX_RETRIES} sau ${delay / 1000}s...`);
                setTimeout(() => {
                    if (!isDeactivatingRef.current && clientRef.current) {
                        try { clientRef.current.activate(); } catch { /* ignore */ }
                    }
                }, delay);
            },

            onStompError: (frame) => {
                console.error('[WebSocket] STOMP error:', frame.headers?.message);
            },

            // Giới hạn log debug để không làm rối console
            debug: process.env.NODE_ENV === 'development'
                ? (str) => {
                    // Chỉ log các message quan trọng, bỏ qua heartbeat
                    if (!str.includes('>>>') && !str.includes('<<<')) {
                        console.debug('[STOMP]', str);
                    }
                }
                : undefined,
        });

        client.activate();
        clientRef.current = client;

        return () => {
            isDeactivatingRef.current = true;
            setIsConnected(false);

            subscriptionsRef.current.forEach(s => {
                try { s.unsubscribe(); } catch { /* ignore */ }
            });
            subscriptionsRef.current = [];

            client.deactivate().catch(() => { /* ignore deactivate errors */ });
            clientRef.current = null;

            console.log('[WebSocket] Cleanup complete');
        };
    }, [warehouseId, enabled, subscribe]);

    return { isConnected };
}