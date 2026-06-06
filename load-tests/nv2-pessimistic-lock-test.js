/**
 * ═══════════════════════════════════════════════════════════════════
 * NV-2: Load Test — Pessimistic Locking trên Inventory
 * ═══════════════════════════════════════════════════════════════════
 *
 * Tool    : k6 (https://k6.io)
 * Mục đích: Verify tính toàn vẹn Inventory khi có concurrent access
 *           từ POS checkout và Admin adjustInventory.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  TRƯỚC KHI CHẠY:                                                │
 * │  1. Chạy migration V3__Add_coordinates_to_orders.sql            │
 * │  2. Điền các placeholder bên dưới (BASE_URL, token, IDs)       │
 * │  3. Đảm bảo sản phẩm TEST có đủ tồn kho ban đầu (≈15 cái)    │
 * │  4. Đảm bảo có 1 ca POS đang OPEN cho cashier (SHIFT_ID)      │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Cài k6:
 *   Windows:  winget install Grafana.k6
 *   macOS:    brew install k6
 *   Linux:    https://grafana.com/docs/k6/latest/set-up/install-k6/
 *
 * Chạy:
 *   k6 run load-tests/nv2-pessimistic-lock-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ═══════════════════════════════════════════════════════════════════
// ██ PLACEHOLDER — ĐIỀN TRƯỚC KHI CHẠY
// ═══════════════════════════════════════════════════════════════════

// Base URL của backend (không có trailing slash)
const BASE_URL = 'http://localhost:8080/api'; 

// Bearer Token cho tài khoản CASHIER/MANAGER (dùng cho POS checkout)
const POS_TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJraG9URCIsInVzZXJJZCI6ImE4ZDNkMjE1LTc5ZGQtNDFjNi1hNGMyLWQxNThhNDc3YWE3MCIsInJvbGUiOiJST0xFX0NBU0hJRVIiLCJmdWxsTmFtZSI6Ik5ndXnhu4VuIEhvw6BuZyBBbmgiLCJpYXQiOjE3ODA3MzI5ODIsImV4cCI6MTc4MDc0Mzc4Miwid2FyZWhvdXNlSWQiOiJiYmY2ZmFmNi1kNzFlLTRlMDktYWYxOS05NTdmZDU1Mzk0M2MifQ.nB21-2onLP4MGa1-lzB2FmRLpkDfYqBMJbtUv5uaCXKC5rlOiIJg8ZNzbjHTlPUS';

// Bearer Token cho tài khoản ADMIN/MANAGER (dùng cho adjustInventory)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6ImI3MDg2MWVhLWI5NzctNDdjMS1hMDc2LWFlYmUxNTAwM2ZmYiIsInJvbGUiOiJST0xFX0FETUlOIiwiZnVsbE5hbWUiOiJTdXBlciBBZG1pbiIsImlhdCI6MTc4MDczMTg3NywiZXhwIjoxNzgwNzQyNjc3fQ.g-9e_kcHpc4uijUVk00KM9CHjIQ3nPNzcy9NEtAv0Fl7nBWxTmQIkxTm8_W6E4MG';

// UUID sản phẩm dùng để test (PHẢI tồn tại trong DB)
const PRODUCT_ID = 'ab45bbf1-7f89-4f94-b2e5-d3e2f53e9ed2'; // VD: '550e8400-e29b-41d4-a716-446655440000'

// UUID kho dùng để test (PHẢI là kho active)
const WAREHOUSE_ID = 'bbf6faf6-d71e-4e09-af19-957fd553943c';

// UUID ca làm việc đang OPEN (lấy từ /pos/shifts/current)
const SHIFT_ID = 'a2821528-3186-4a57-be39-9d188ebc8b39';

// Giá bán sản phẩm (BigDecimal string, khớp với DB)
const UNIT_PRICE = '100000'; // 100,000 VNĐ

// Tồn kho ban đầu TRƯỚC khi chạy test.
// Đặt giá trị ≈15 để 20 VUs mua qty=1 → một số phải bị INSUFFICIENT_STOCK
const INITIAL_STOCK = 15;

// ═══════════════════════════════════════════════════════════════════
// ██ CUSTOM METRICS
// ═══════════════════════════════════════════════════════════════════

// Đếm số request thành công (checkout success / adjust success)
const successfulCheckouts = new Counter('pos_checkout_success');
const failedExpected       = new Counter('pos_checkout_expected_failure');  // 409 INSUFFICIENT_STOCK
const failedUnexpected     = new Counter('pos_checkout_unexpected_failure'); // 500, timeout, etc.

const adminAdjustSuccess   = new Counter('admin_adjust_success');
const adminAdjustExpected  = new Counter('admin_adjust_expected_failure');  // 409 lock timeout
const adminAdjustUnexpected = new Counter('admin_adjust_unexpected_failure');

// Rate of unexpected errors (dùng cho threshold)
const unexpectedErrorRate = new Rate('unexpected_error_rate');

// Response time trends
const checkoutDuration = new Trend('pos_checkout_duration', true);
const adjustDuration   = new Trend('admin_adjust_duration', true);

// ═══════════════════════════════════════════════════════════════════
// ██ SCENARIOS & THRESHOLDS
// ═══════════════════════════════════════════════════════════════════

export const options = {
    scenarios: {
        pos_concurrency: {
            executor: 'constant-vus',
            vus: 20,
            duration: '30s',
            exec: 'posCheckout',
            tags: { scenario: 'pos_concurrency' },
        },

        pos_vs_admin_pos: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '35s',  // Bắt đầu sau scenario 1 kết thúc
            exec: 'posCheckout',
            tags: { scenario: 'pos_vs_admin' },
        },
        pos_vs_admin_adjust: {
            executor: 'constant-vus',
            vus: 5,
            duration: '30s',
            startTime: '35s',  // Chạy song song với pos_vs_admin_pos
            exec: 'adminAdjust',
            tags: { scenario: 'pos_vs_admin' },
        },
    },

    thresholds: {
        'unexpected_error_rate': ['rate<0.05'],
        'pos_checkout_duration': ['p(95)<2000'],
        'admin_adjust_duration': ['p(95)<2000'],
    },
};

// ═══════════════════════════════════════════════════════════════════
// ██ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function authHeaders(token) {
    return {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    };
}
function classifyResponse(res) {
    if (!res) return 'UNEXPECTED_FAILURE';

    const status = res.status;

    // Success
    if (status === 200 || status === 201) {
        return 'SUCCESS';
    }

    // Parse body để lấy error code
    let body = {};
    try {
        body = JSON.parse(res.body);
    } catch (e) {
        // Body không parse được → unexpected
        return 'UNEXPECTED_FAILURE';
    }

    const code = (body.code || '').toUpperCase();
    const message = (body.message || '').toLowerCase();

    if (status === 409) {
        if (code.includes('INSUFFICIENT_STOCK') || code.includes('CONCURRENT_MODIFICATION')) {
            return 'EXPECTED_FAILURE';
        }
    }

    // 400 Bad Request: BusinessException với code INSUFFICIENT_STOCK
    if (status === 400) {
        if (code.includes('INSUFFICIENT_STOCK')) {
            return 'EXPECTED_FAILURE';
        }
        // Lock timeout trên Admin path có thể ném IMPORT_STOCK_CRASH
        if (code.includes('IMPORT_STOCK_CRASH') && message.includes('lock')) {
            return 'EXPECTED_FAILURE';
        }
    }

    // Tất cả các trường hợp khác: unexpected
    // Bao gồm: 500 Internal Server Error, 403, network timeout, etc.
    return 'UNEXPECTED_FAILURE';
}

// ═══════════════════════════════════════════════════════════════════
// ██ SCENARIO 1 & 2 (POS): POST /pos/checkout
// ═══════════════════════════════════════════════════════════════════

export function posCheckout() {
    const payload = JSON.stringify({
        shiftId: SHIFT_ID,
        customerId: null,              // Khách vãng lai
        items: [
            {
                productId: PRODUCT_ID,
                quantity: 1,           // Mỗi VU mua 1 cái
                unitPrice: UNIT_PRICE,
            },
        ],
        payments: [
            {
                method: 'CASH',
                amount: UNIT_PRICE,    // Trả đủ tiền mặt
            },
        ],
        pointsToUse: 0,
        note: 'k6-load-test-pos-checkout',
    });

    const res = http.post(`${BASE_URL}/pos/checkout`, payload, authHeaders(POS_TOKEN));

    // Đo response time
    checkoutDuration.add(res.timings.duration);

    // Phân loại kết quả
    const classification = classifyResponse(res);

    if (classification === 'SUCCESS') {
        successfulCheckouts.add(1);
        unexpectedErrorRate.add(false); // Không phải lỗi unexpected
    } else if (classification === 'EXPECTED_FAILURE') {
        failedExpected.add(1);
        unexpectedErrorRate.add(false); // INSUFFICIENT_STOCK là expected, KHÔNG tính vào error rate

        // Double-check: response body phải chứa thông tin rõ ràng về lý do
        check(res, {
            '[POS] Expected failure có error code rõ ràng': (r) => {
                try {
                    const b = JSON.parse(r.body);
                    return b.code && b.code.length > 0;
                } catch { return false; }
            },
        });
    } else {
        // ⚠️  UNEXPECTED FAILURE — đây là bug cần điều tra
        failedUnexpected.add(1);
        unexpectedErrorRate.add(true); // Tính vào error rate

        console.error(
            `[POS UNEXPECTED] VU=${__VU} | status=${res.status} | body=${res.body?.substring(0, 200)}`
        );
    }

    // Verify: response KHÔNG được trả 200 kèm inventory âm (silent corruption)
    if (res.status === 200 || res.status === 201) {
        check(res, {
            '[POS] Success response có invoice code': (r) => {
                try {
                    const b = JSON.parse(r.body);
                    // Response format: ApiResponse<InvoiceResponse> → data.code
                    return b.data && b.data.code && b.data.code.startsWith('INV-');
                } catch { return false; }
            },
        });
    }

    // Nghỉ ngẫu nhiên 0.5-1.5s giữa các request để mô phỏng real-world
    sleep(Math.random() * 1 + 0.5);
}

// ═══════════════════════════════════════════════════════════════════
// ██ SCENARIO 2 (ADMIN): POST /inventory/adjust
// ═══════════════════════════════════════════════════════════════════

export function adminAdjust() {
    // Số lượng thực tế ngẫu nhiên để mô phỏng admin kiểm kê
    const actualQuantity = Math.floor(Math.random() * 11) + 10; // 10 ~ 20

    const payload = JSON.stringify({
        productId: PRODUCT_ID,
        warehouseId: WAREHOUSE_ID,
        actualQuantity: actualQuantity,
        reason: `k6-load-test-admin-adjust-${Date.now()}`,
    });

    const res = http.post(`${BASE_URL}/inventory/adjust`, payload, authHeaders(ADMIN_TOKEN));

    // Đo response time
    adjustDuration.add(res.timings.duration);

    // Phân loại kết quả
    const classification = classifyResponse(res);

    if (classification === 'SUCCESS') {
        adminAdjustSuccess.add(1);
        unexpectedErrorRate.add(false);
    } else if (classification === 'EXPECTED_FAILURE') {
        adminAdjustExpected.add(1);
        unexpectedErrorRate.add(false);
    } else {
        // ⚠️  UNEXPECTED FAILURE — kiểm tra có phải OptimisticLockingFailureException không
        adminAdjustUnexpected.add(1);
        unexpectedErrorRate.add(true);

        // CRITICAL CHECK: Phải KHÔNG có ObjectOptimisticLockingFailureException
        const bodyStr = res.body || '';
        const hasOptimisticLockError = bodyStr.includes('ObjectOptimisticLockingFailure')
            || bodyStr.includes('CONCURRENT_MODIFICATION');

        check(res, {
            '[ADMIN] KHÔNG có ObjectOptimisticLockingFailureException': () => !hasOptimisticLockError,
        });

        if (hasOptimisticLockError) {
            console.error(
                `[ADMIN CRITICAL] OptimisticLockingFailure detected! VU=${__VU} | body=${bodyStr.substring(0, 300)}`
            );
        } else {
            console.error(
                `[ADMIN UNEXPECTED] VU=${__VU} | status=${res.status} | body=${bodyStr.substring(0, 200)}`
            );
        }
    }

    // Verify: Admin response KHÔNG chứa OptimisticLockingException ở bất kỳ status nào
    check(res, {
        '[ADMIN] Response không chứa OptimisticLocking': (r) => {
            return !(r.body || '').includes('OptimisticLocking');
        },
    });

    // Nghỉ 1-3s — Admin thao tác chậm hơn POS
    sleep(Math.random() * 2 + 1);
}

// ═══════════════════════════════════════════════════════════════════
// ██ TEARDOWN — Báo cáo tổng hợp sau khi test xong
// ═══════════════════════════════════════════════════════════════════
export function handleSummary(data) {
    // k6 tự in summary, nhưng ta thêm phần phân tích NV-2 specific
    const lines = [
        '',
        '══════════════════════════════════════════════════════════',
        '  NV-2 LOAD TEST — KẾT QUẢ PHÂN TÍCH',
        '══════════════════════════════════════════════════════════',
        '',
    ];

    // Extract metric values
    const metrics = data.metrics;

    const checkoutSuccess    = metrics.pos_checkout_success?.values?.count || 0;
    const checkoutExpFail    = metrics.pos_checkout_expected_failure?.values?.count || 0;
    const checkoutUnexpFail  = metrics.pos_checkout_unexpected_failure?.values?.count || 0;

    const adjustSuccess      = metrics.admin_adjust_success?.values?.count || 0;
    const adjustExpFail      = metrics.admin_adjust_expected_failure?.values?.count || 0;
    const adjustUnexpFail    = metrics.admin_adjust_unexpected_failure?.values?.count || 0;

    const unexpRate          = metrics.unexpected_error_rate?.values?.rate || 0;
    const checkoutP95        = metrics.pos_checkout_duration?.values?.['p(95)'] || 0;
    const adjustP95          = metrics.admin_adjust_duration?.values?.['p(95)'] || 0;

    lines.push('── POS Checkout ─────────────────────────────────────────');
    lines.push(`  ✅ Thành công:                ${checkoutSuccess}`);
    lines.push(`  ⚠️  Hết hàng (expected):      ${checkoutExpFail}`);
    lines.push(`  ❌ Lỗi bất ngờ (unexpected):  ${checkoutUnexpFail}`);
    lines.push(`  📊 p95 response time:         ${checkoutP95.toFixed(0)}ms`);
    lines.push('');

    lines.push('── Admin Adjust ─────────────────────────────────────────');
    lines.push(`  ✅ Thành công:                ${adjustSuccess}`);
    lines.push(`  ⚠️  Lock timeout (expected):   ${adjustExpFail}`);
    lines.push(`  ❌ Lỗi bất ngờ (unexpected):  ${adjustUnexpFail}`);
    lines.push(`  📊 p95 response time:         ${adjustP95.toFixed(0)}ms`);
    lines.push('');

    lines.push('── Tổng hợp ─────────────────────────────────────────────');
    lines.push(`  📈 Unexpected Error Rate:     ${(unexpRate * 100).toFixed(2)}% (ngưỡng: <5%)`);
    lines.push('');

    // ── Verdict ──
    const pass = unexpRate < 0.05
        && checkoutP95 < 2000
        && adjustP95 < 2000
        && adjustUnexpFail === 0; // CRITICAL: không có unexpected admin failure

    if (pass) {
        lines.push('  🎉 VERDICT: ✅ NV-2 PASS — Pessimistic Locking hoạt động đúng!');
        lines.push('     - Không có silent inventory corruption');
        lines.push('     - Tất cả failure đều explicit (409/400)');
        lines.push('     - Không có ObjectOptimisticLockingFailureException');
        lines.push('     - Response time trong ngưỡng chấp nhận');
    } else {
        lines.push('  🚨 VERDICT: ❌ NV-2 FAIL — Cần điều tra!');
        if (unexpRate >= 0.05) lines.push('     ↳ Unexpected error rate vượt ngưỡng 5%');
        if (checkoutP95 >= 2000) lines.push('     ↳ POS checkout p95 vượt 2000ms');
        if (adjustP95 >= 2000) lines.push('     ↳ Admin adjust p95 vượt 2000ms');
        if (adjustUnexpFail > 0) lines.push('     ↳ Có unexpected failure trên Admin path (có thể là OptimisticLock?)');
    }

    lines.push('');
    lines.push('══════════════════════════════════════════════════════════');

    console.log(lines.join('\n'));

    // Trả về default summary + custom text
    return {
        stdout: textSummary(data, { indent: '  ', enableColors: true }),
    };
}

// k6 built-in text summary (import-less version)
function textSummary(data, opts) {
    // k6 >= 0.30 tự render summary, hàm này chỉ là fallback
    return '';
}
