import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 💡 必須明確註冊 Service Worker，PWA 安裝按鈕才會被 Chrome 喚醒！
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker 註冊成功:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker 註冊失敗:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
