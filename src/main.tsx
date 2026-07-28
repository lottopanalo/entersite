import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ===========================================
// Service Worker 註冊程式碼
// ===========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker 註冊成功:', registration);
      })
      .catch(error => {
        console.error('Service Worker 註冊失敗:', error);
      });
  });
}

// ===========================================
// 您的 React 應用程式渲染邏輯
// ===========================================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
