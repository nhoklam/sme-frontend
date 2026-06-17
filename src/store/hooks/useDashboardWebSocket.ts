import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useWebSocket, WsPayload } from './useWebSocket';

interface Options {
    warehouseId: string | undefined | null;
    enabled?: boolean;
}

export function useDashboardWebSocket({ warehouseId, enabled = true }: Options) {
    const qc = useQueryClient();

    const handleMessage = useCallback((payload: WsPayload) => {
        switch (payload.type) {
            case 'LOW_STOCK':
                qc.invalidateQueries({ queryKey: ['low-stock-dashboard'] });
                qc.invalidateQueries({ queryKey: ['report-summary'] });
                toast(`⚠️ ${payload.productName || 'Sản phẩm'} sắp hết hàng! (Còn ${payload.quantity} SP)`, {
                    icon: '📦',
                    duration: 5000,
                    style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
                });
                break;

            case 'NEW_ORDER':
                qc.invalidateQueries({ queryKey: ['orders-pending-dashboard'] });
                qc.invalidateQueries({ queryKey: ['top-products-dashboard'] });
                toast.success(`🛒 Đơn hàng ${payload.orderCode || 'mới'} vừa được tạo`, { duration: 4000 });
                break;

            case 'SHIFT_PENDING_APPROVAL':
                qc.invalidateQueries({ queryKey: ['pending-shifts-dashboard'] });
                toast('🕐 Có ca làm việc mới chờ bạn duyệt', {
                    icon: '👤',
                    duration: 5000,
                    style: { background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff' },
                });
                break;

            case 'TRANSFER_ARRIVED':
                qc.invalidateQueries({ queryKey: ['low-stock-dashboard'] });
                toast('📦 Hàng chuyển kho vừa đến nơi', {
                    duration: 3000,
                    style: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
                });
                break;

            default:
                console.log('[WebSocket] Unknown event type:', payload.type);
        }
    }, [qc]);

    const { isConnected } = useWebSocket({ warehouseId, onMessage: handleMessage, enabled });

    return { isConnected };
}