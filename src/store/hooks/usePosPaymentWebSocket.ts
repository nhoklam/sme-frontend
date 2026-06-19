import { useEffect, useRef, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getSockJsUrl = (): string => {
    let apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    if (apiBase.endsWith('/')) {
        apiBase = apiBase.slice(0, -1);
    }
    return `${apiBase}/ws`;
};

export function usePosPaymentWebSocket(orderCode: string, onPaymentSuccess: (invoice: any) => void) {
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!orderCode) return;

        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const accessToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || userData?.accessToken;

        const client = new Client({
            webSocketFactory: () => new SockJS(getSockJsUrl()),
            connectHeaders: {
                Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);
                // Subscribe to the specific order's payment topic
                client.subscribe(`/topic/pos-payment/${orderCode}`, (msg: IMessage) => {
                    try {
                        const payload = JSON.parse(msg.body);
                        if (payload.data) {
                            onPaymentSuccess(payload.data);
                        }
                    } catch (e) {
                        console.error('Lỗi khi phân tích dữ liệu WebSocket payment:', e);
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            setIsConnected(false);
            client.deactivate();
            clientRef.current = null;
        };
    }, [orderCode]); // Re-run if orderCode changes

    return { isConnected };
}
