// ===========================================
// 1. Securely Import OneSignal Service Worker
// ===========================================
try {
    importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
    console.warn('[Service Worker] Failed to load OneSignal SDK or offline:', e);
}

// ===========================================
// 2. System Environment and Variable Settings (API Auto-Fallback Mechanism)
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
// 3. Helper Function: Fetch Request with Timeout Mechanism
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
// 4. API Fault Tolerance and Fallback Logic
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
            // Continue trying the next fallback domain
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
        // Ignore dispatcher errors
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
            // Ignore retry errors
        }
    }

    return new Response('Service Unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// ===========================================
// 5. Service Worker Core Event Listeners
// ===========================================
self.addEventListener('fetch', (event) => {
    // Ensure only http/https requests are processed
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const url = new URL(event.request.url);
    const isApiRequest = url.pathname.includes('/api/');

    if (isApiRequest) {
        event.respondWith(fetchAndBackup(event.request));
    } else {
        // Allow non-API requests to pass through normally (including background assets required by OneSignal)
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
