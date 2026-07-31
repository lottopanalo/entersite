// ===========================================
// 1. 安全引入 OneSignal Service Worker
// ===========================================
try {
    importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
    console.warn('[Service Worker] OneSignal SDK 載入失敗或離線:', e);
}

// ===========================================
// 2. 系統環境與變數設定 (API 自動備援機制)
// ===========================================
let PRIMARY_API = 'https://phplotto.ph';

let FALLBACK_APIS = [
    'https://phplotto.net',
    'https://phplottos.com',
    'https://phplotto.com'
];

const DISPATCHER_URL = 'https://raw.githubusercontent.com/lottopanalo/entersite/main/config.json';
const REQUEST_TIMEOUT = 3000;

// ===========================================
// 3. 輔助函式：帶有超時機制的 Fetch 請求
// ===========================================
async function fetchWithTimeout(request, timeout) {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(request, { signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('TimeoutError');
        }
        throw new Error('NetworkError');
    }
}

// ===========================================
// 4. API 容錯與備援邏輯
// ===========================================
async function tryPrimaryApi(originalRequest) {
    try {
        const requestToUse = originalRequest.clone();
        const url = new URL(requestToUse.url);
        url.host = new URL(PRIMARY_API).host;
        const newRequest = new Request(url.toString(), requestToUse);

        const response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);
        if (response.ok || response.status < 500) {
            return response;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function tryFallbackApis(originalRequest) {
    for (const fallbackApi of FALLBACK_APIS) {
        try {
            const requestToUse = originalRequest.clone();
            const url = new URL(requestToUse.url);
            url.host = new URL(fallbackApi).host;
            const newRequest = new Request(url.toString(), requestToUse);

            const response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);
            if (response.ok || response.status < 500) {
                PRIMARY_API = fallbackApi;
                return response;
            }
        } catch (error) {
            // 繼續嘗試下一個備用網域
        }
    }
    return null;
}

async function fetchDispatcher() {
    try {
        const response = await fetchWithTimeout(new Request(DISPATCHER_URL), REQUEST_TIMEOUT);
        if (response.ok) {
            const config = await response.json();
            if (config && Array.isArray(config.latest_apis) && config.latest_apis.length > 0) {
                FALLBACK_APIS = config.latest_apis;
                PRIMARY_API = FALLBACK_APIS[0];
                return true;
            }
        }
    } catch (error) {
        // 忽略發牌中心錯誤
    }
    return false;
}

async function fetchAndBackup(originalRequest) {
    let response = await tryPrimaryApi(originalRequest);
    if (response) return response;

    response = await tryFallbackApis(originalRequest);
    if (response) return response;

    const dispatcherUpdated = await fetchDispatcher();
    if (dispatcherUpdated) {
        const requestToRetry = originalRequest.clone();
        const url = new URL(requestToRetry.url);
        url.host = new URL(PRIMARY_API).host;
        const newRequest = new Request(url.toString(), requestToRetry);

        try {
            response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);
            if (response.ok || response.status < 500) {
                return response;
            }
        } catch (error) {
            // 忽略重試錯誤
        }
    }

    return new Response('Service Unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// ===========================================
// 5. Service Worker 核心事件監聽
// ===========================================
self.addEventListener('fetch', (event) => {
    // 確保只處理 http/https 請求
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const url = new URL(event.request.url);
    const isApiRequest = url.pathname.includes('/api/');

    if (isApiRequest) {
        event.respondWith(fetchAndBackup(event.request));
    } else {
        // 非 API 請求正常放行（包含 OneSignal 所需的背景資源）
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
