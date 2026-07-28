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

/**
 * 執行一個 Promise 並在指定時間後超時。
 * @param {Promise<Response>} promise - 要執行的 Promise 請求。
 * @param {number} timeout - 超時時間 (毫秒)。
 * @returns {Promise<Response>} - 帶有超時機制的 Promise。
 */
async function fetchWithTimeout(request, timeout) {
    // 建立 AbortController 實例，用於控制請求的取消
    const controller = new AbortController();
    // 取得 AbortController 的信號，將其傳遞給 fetch
    const signal = controller.signal;

    // 設定超時計時器，當時間到時，中斷請求
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        // 發送實際的 fetch 請求，並將 signal 傳遞給它
        const response = await fetch(request, { signal });
        clearTimeout(timeoutId); // 請求成功，清除超時計時器
        return response;
    } catch (error) {
        clearTimeout(timeoutId); // 捕獲到錯誤，清除超時計時器
        // 判斷是否為超時錯誤
        if (error.name === 'AbortError') {
            console.warn(`[Service Worker] 請求超時: ${request.url}`);
            throw new Error('TimeoutError'); // 自定義超時錯誤類型
        }
        console.error(`[Service Worker] 網路錯誤: ${request.url}`, error);
        throw new Error('NetworkError'); // 自定義網路錯誤類型
    }
}

// ===========================================
// 核心邏輯函式
// ===========================================

/**
 * 第一階段：嘗試使用當前可用的主 API 發送請求。
 * @param {Request} originalRequest - 原始的 Request 物件。
 * @returns {Promise<Response|null>} - 成功則返回 Response，失敗則返回 null。
 */
async function tryPrimaryApi(originalRequest) {
    try {
        // 克隆原始請求，因為請求體只能被消耗一次
        const requestToUse = originalRequest.clone();
        const url = new URL(requestToUse.url);
        // 將 URL 的主機替換為當前的主 API 網域
        url.host = new URL(PRIMARY_API).host;
        const newRequest = new Request(url.toString(), requestToUse);

        console.log(`[Service Worker] 嘗試主 API: ${newRequest.url}`);
        const response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);

        // 檢查回應狀態碼，200-299 視為成功
        if (response.ok) {
            console.log(`[Service Worker] 主 API 成功: ${newRequest.url}`);
            return response;
        } else if (response.status >= 500) {
            console.warn(`[Service Worker] 主 API 伺服器錯誤 (${response.status}): ${newRequest.url}`);
            // 5xx 錯誤也視為失敗，進入備援
            return null;
        }
        // 其他非 2xx/5xx 錯誤，直接返回回應，不觸發備援 (例如 4xx 錯誤應直接傳遞給客戶端)
        return response;
    } catch (error) {
        // 捕獲到 TimeoutError 或 NetworkError
        console.warn(`[Service Worker] 主 API 請求失敗 (進入備援):`, error.message);
        return null;
    }
}

/**
 * 第二階段：遍歷備用網域清單，並在成功時晉升為新的主 API。
 * @param {Request} originalRequest - 原始的 Request 物件。
 * @returns {Promise<Response|null>} - 成功則返回 Response，失敗則返回 null。
 */
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

            // 晉升成功的備用 API 為新的主 API
            PRIMARY_API = fallbackApi;

               console.log(`[Service Worker] 已將 ${PRIMARY_API} 晉升為主 API。`);
                return response;
            } else if (response.status >= 500) {
                console.warn(`[Service Worker] 備用 API 伺服器錯誤 (${response.status}): ${newRequest.url}`);
                // 5xx 錯誤也視為失敗，繼續嘗試下一個備援
            } else {
                // 其他非 2xx/5xx 錯誤，直接返回回應
                return response;
            }
        } catch (error) {
            // 捕獲到 TimeoutError 或 NetworkError，繼續嘗試下一個備援
            console.warn(`[Service Worker] 備用 API 請求失敗 (嘗試下一個):`, error.message);
        }
    }
    return null; // 所有備用 API 都失敗
}

/**
 * 第三階段：呼叫發牌中心 (Dispatcher) 獲取最新 API 清單。
 * @returns {Promise<boolean>} - 成功更新清單則返回 true，否則返回 false。
 */
async function fetchDispatcher() {
    console.log(`[Service Worker] 呼叫發牌中心: ${DISPATCHER_URL}`);
    try {
        const response = await fetchWithTimeout(new Request(DISPATCHER_URL), REQUEST_TIMEOUT);
        if (response.ok) {
            const config = await response.json();
            if (config && Array.isArray(config.latest_apis) && config.latest_apis.length > 0) {
                // 更新備用 API 清單
                FALLBACK_APIS = config.latest_apis;
                // 使用新清單的第一個作為新的主 API
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

/**
 * 整合三階段備援邏輯來處理 API 請求。
 * @param {Request} originalRequest - 原始的 Request 物件。
 * @returns {Promise<Response>} - 最終的回應。
 */
async function fetchAndBackup(originalRequest) {
    // 1. 嘗試當前可用的主 API
    let response = await tryPrimaryApi(originalRequest);
    if (response) {
        return response;
    }

    // 2. 遍歷備用網域 (Fallback Loop)
    response = await tryFallbackApis(originalRequest);
    if (response) {
        return response;
    }

    // 3. 呼叫發牌中心 (Dispatcher Rescue)
    const dispatcherUpdated = await fetchDispatcher();
    if (dispatcherUpdated) {
        // 使用新的 PRIMARY_API 重新發送原本使用者失敗的那次 API 請求
        // 這裡需要再次克隆原始請求
        const requestToRetry = originalRequest.clone();
        const url = new URL(requestToRetry.url);
        url.host = new URL(PRIMARY_API).host;
        const newRequest = new Request(url.toString(), requestToRetry);

        console.log(`[Service Worker] 使用發牌中心提供的新主 API 重試: ${newRequest.url}`);
        try {
            response = await fetchWithTimeout(newRequest, REQUEST_TIMEOUT);
            if (response.ok || response.status < 500) {
                // 如果成功或非 5xx 錯誤，則回傳
                return response;
            }
        } catch (error) {
            console.error(`[Service Worker] 使用新的主 API 重試失敗:`, error.message);
        }
    }

    // 如果所有備援都失敗，或發牌中心也未能提供有效更新，則返回一個表示失敗的回應
    // 例如，返回一個 503 Service Unavailable 的回應
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

// 監聽 fetch 事件
self.addEventListener('fetch', (event) => {
    // 確保只處理 HTTP/HTTPS 請求，並過濾掉 chrome-extension:// 等非 Web 請求
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const url = new URL(event.request.url);

    // 檢查請求的 URL 路徑是否包含 /api/
    // 同時也確保只攔截對我們 API 網域的請求，避免影響其他外部資源（如 CDN）
    // 或者，您可以讓它攔截所有包含 /api/ 的請求，這取決於您的具體需求
    const isApiRequest = url.pathname.includes('/api/');
    const isOurDomain = (url.host === new URL(PRIMARY_API).host) || FALLBACK_APIS.some(api => url.host === new URL(api).host);

    if (isApiRequest) { // 如果是 API 請求，則執行備援邏輯
        console.log(`[Service Worker] 攔截到 API 請求: ${event.request.url}`);

       event.respondWith(fetchAndBackup(event.request));
    } else {
        // 如果不是 API 請求，Service Worker 不介入，直接發送請求
        event.respondWith(fetch(event.request));
    }
});

// 監聽 install 事件 (Service Worker 安裝時觸發)
self.addEventListener('install', (event) => {
    // 跳過等待，確保新的 Service Worker 立即啟用
    self.skipWaiting();
    console.log('[Service Worker] 已安裝。');
});

// 監聽 activate 事件 (Service Worker 啟用時觸發)
self.addEventListener('activate', (event) => {
    // 客戶端宣告所有當前打開的頁面，應由這個新的 Service Worker 控制
    event.waitUntil(clients.claim());
    console.log('[Service Worker] 已啟用。');
});

