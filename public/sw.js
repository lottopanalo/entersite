// ===========================================
// 系統環境與變數設定
// 這些變數方便您後續修改
// ===========================================

// 主 API 網域 (當前最佳選擇)
let PRIMARY_API = 'https://phplotto.ph';

// 備用 API 網域清單
let FALLBACK_APIS = [
    'https://phplotto.net',
    'https://phplottos.com',
    'https://phplotto.com'
];

// 發牌中心 (Dispatcher) 的靜態 JSON 網址，用於動態更新 API 清單
const DISPATCHER_URL = 'https://raw.githubusercontent.com/lottopanalo/entersite/main/config.json';

// 每個 API 請求的超時時間，設定為 3000 毫秒 (3秒)
const REQUEST_TIMEOUT = 3000;

// ===========================================
// 輔助函式：加上超時機制的 Fetch 請求
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
            console.warn(`[Service Worker] 請求超時: ${request.url}`);
            throw new Error('TimeoutError');
        }
        console.error(`[Service Worker] 網路錯誤: ${request.url}`, error);
        throw new Error('NetworkError');
    }
}

// ===========================================
// 核心邏輯函式
// ===========================================

async function tryPrimaryApi(originalRequest) {
    try {
        const requestToUse = originalRequest.clone();
        const url = new URL(requestToUse.url);
        url.host = new URL(PRIMARY_API).host;
        const newRequest = new Request(url.toString(), requestToUse);

        console.log(`[Service Worker] 嘗試主 API: ${newRequest.url}`);
        const response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);

        if (response.ok) {
            console.log(`[Service Worker] 主 API 成功: ${newRequest.url}`);
            return response;
        } else if (response.status >= 500) {
            console.warn(`[Service Worker] 主 API 伺服器錯誤 (${response.status}): ${newRequest.url}`);
            return null;
        }
        return response;
    } catch (error) {
        console.warn(`[Service Worker] 主 API 請求失敗 (進入備援):`, error.message);
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

            console.log(`[Service Worker] 嘗試備用 API: ${newRequest.url}`);
            const response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);

            if (response.ok) {
                console.log(`[Service Worker] 備用 API 成功: ${newRequest.url}`);
                PRIMARY_API = fallbackApi;
                console.log(`[Service Worker] 已將 ${PRIMARY_API} 晉升為主 API。`);
                return response;
            } else if (response.status >= 500) {
                console.warn(`[Service Worker] 備用 API 伺服器錯誤 (${response.status}): ${newRequest.url}`);
            } else {
                return response;
            }
        } catch (error) {
            console.warn(`[Service Worker] 備用 API 請求失敗 (嘗試下一個):`, error.message);
        }
    }
    return null;
}

async function fetchDispatcher() {
    console.log(`[Service Worker] 呼叫發牌中心: ${DISPATCHER_URL}`);
    try {
        const response = await fetchWithTimeout(new Request(DISPATCHER_URL), REQUEST_TIMEOUT);
        if (response.ok) {
            const config = await response.json();
            if (config && Array.isArray(config.latest_apis) && config.latest_apis.length > 0) {
                FALLBACK_APIS = config.latest_apis;
                PRIMARY_API = FALLBACK_APIS[0];
                console.log(`[Service Worker] 發牌中心更新成功。新的主 API: ${PRIMARY_API}, 備用 API:`, FALLBACK_APIS);
                return true;
            }
        }
    } catch (error) {
        console.error(`[Service Worker] 呼叫發牌中心失敗:`, error.message);
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

        console.log(`[Service Worker] 使用發牌中心提供的新主 API 重試: ${newRequest.url}`);
        try {
            response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);
            if (response.ok || response.status < 500) {
                return response;
            }
        } catch (error) {
            console.error(`[Service Worker] 使用新的主 API 重試失敗:`, error.message);
        }
    }

    console.error(`[Service Worker] 所有備援機制均失敗，無法處理請求: ${originalRequest.url}`);
    return new Response('Service Unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// ===========================================
// Service Worker 事件監聽
// ===========================================

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const url = new URL(event.request.url);
    const isApiRequest = url.pathname.includes('/api/');

    if (isApiRequest) {
        console.log(`[Service Worker] 攔截到 API 請求: ${event.request.url}`);
        event.respondWith(fetchAndBackup(event.request));
    } else {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[Service Worker] 已安裝。');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    console.log('[Service Worker] 已啟用。');
});

// ===========================================
// 推播通知 (Push Notifications) 相關事件監聽
// ===========================================

self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'PHPLotto Notification';
    const options = {
        body: data.body || 'May bago kang update mula sa PHPLotto!',
        icon: '/assets/images/my_logo.png',
        badge: '/assets/images/my_logo.png',
        data: {
            url: data.url || PRIMARY_API
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const targetUrl = event.notification.data?.url || PRIMARY_API;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('focus' in client) {
                    client.focus();
                    if ('navigate' in client) {
                        return client.navigate(targetUrl);
                    }
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
