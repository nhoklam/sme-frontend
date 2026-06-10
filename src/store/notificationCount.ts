// src/store/notificationCount.ts
// Module-level store cho số thông báo chưa đọc.
// AdminLayout đăng ký setter, các trang khác gọi để cập nhật badge.

type CountUpdater = (updater: (prev: number) => number) => void;

let _setCount: CountUpdater | null = null;

export function registerCountSetter(setter: CountUpdater) {
    _setCount = setter;
}

export function unregisterCountSetter() {
    _setCount = null;
}

/** Giảm số badge đi 1 */
export function decrementUnread() {
    _setCount?.(prev => Math.max(0, prev - 1));
}

/** Reset số badge về 0 */
export function resetUnread() {
    _setCount?.(() => 0);
}
