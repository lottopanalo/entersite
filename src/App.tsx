import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Zap, 
  RefreshCw, 
  Globe, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  SignalHigh,
  Download,
  Bell,
  X
} from 'lucide-react';

// 引入 OneSignal 推播 SDK
import OneSignal from 'react-onesignal';

// Imported generated logo asset
import logoImg from './assets/images/my_logo.png';

type LanguageMode = 'dual' | 'tl' | 'en';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [langMode, setLangMode] = useState<LanguageMode>('dual');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [pingMs, setPingMs] = useState<number>(18);
  const [activeNode, setActiveNode] = useState<string>('Node MNL-04 (Fastest)');

  // 控制訂閱視窗（Modal）是否顯示，預設進站就顯示 (true)
  const [showModal, setShowModal] = useState<boolean>(true);
  // 記錄視窗是否已經被關閉過，用來觸發後續的進度條
  const [hasStartedLoading, setHasStartedLoading] = useState<boolean>(false);

  // PWA 安裝提示相關狀態
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);

  // 🔔 推播通知狀態
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // 🎯 主站與備用 API 清單
  const TARGET_DOMAINS = [
    'https://phplotto.ph',
    'https://phplotto.net',
    'https://phplottos.com',
    'https://phplotto.com'
  ];

  // 📥 監聽瀏覽器的 PWA 安裝事件、Service Worker 註冊與 OneSignal 初始化
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
      console.log('[PWA] 已成功捕捉到安裝事件，按鈕已啟用');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 註冊 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('[PWA] Service Worker 註冊成功:', reg.scope))
        .catch((err) => console.error('[PWA] Service Worker 註冊失敗:', err));
    }

    // 避免重複初始化 OneSignal
    if (typeof window !== 'undefined' && !(window as any)._oneSignalInitialized) {
      (window as any)._oneSignalInitialized = true;

      OneSignal.init({
        appId: "4df189d3-17e8-4314-8ee3-38791652df11",
        allowLocalhostAsSecureOrigin: true,
      }).then(async () => {
        console.log('[OneSignal] 初始化成功！');
        
        try {
          if (OneSignal.User && OneSignal.User.pushSubscription) {
            const isOptedIn = OneSignal.User.pushSubscription.optedIn;
            if (isOptedIn) {
              setIsSubscribed(true);
            }
          }
        } catch (e) {
          console.log('尚未訂閱或狀態檢查中');
        }
      }).catch((err) => {
        console.error('[OneSignal] 初始化失敗:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 🔔 透過 OneSignal 請求推播通知權限
  const handleSubscribePush = async () => {
    try {
      console.log('[OneSignal] 正在嘗試請求訂閱...');
      
      const OneSignalW = (window as any).OneSignal;
      if (OneSignalW && OneSignalW.Slidedown) {
        await OneSignalW.Slidedown.promptPush();
      } else if (OneSignalW && OneSignalW.User) {
        await OneSignalW.User.pushSubscription.optIn();
      } else {
        await OneSignal.User.pushSubscription.optIn();
      }

      setIsSubscribed(true);
      alert('🎉 成功訂閱推播通知！\nPush notifications enabled successfully!');
      
    } catch (error: any) {
      console.error('[OneSignal] 訂閱失敗詳情:', error);
      alert(`訂閱失敗: ${error?.message || error}`);
    }
  };

  // 📲 處理 PWA 安裝按鈕點擊
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('使用者接受了安裝');
      }
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  // ❌ 關閉視窗並開始跑進度條與跳轉
  const handleCloseModal = () => {
    setShowModal(false);
    setHasStartedLoading(true); // 觸發下方進度條開始
  };

  // 🚀 當進度條完成時，自動測試網域並跳轉
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(async () => {
        let targetUrl = TARGET_DOMAINS[0];

        for (const domain of TARGET_DOMAINS) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            
            await fetch(domain, { 
              method: 'HEAD', 
              mode: 'no-cors',
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            targetUrl = domain;
            break; 
          } catch (e) {
            console.warn(`[App] 網域連線測試失敗: ${domain}`);
          }
        }

        window.location.href = targetUrl;
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // Simulate realistic network route finding progress
  useEffect(() => {
    if (!hasStartedLoading || isCompleted) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsCompleted(true);
          clearInterval(interval);
          return 100;
        }

        let increment = Math.random() * 8 + 3;
        if (prev > 75) increment = Math.random() * 4 + 1;
        if (prev > 95) increment = 0.8;

        const next = Math.min(100, prev + increment * speedMultiplier);
        
        if (Math.random() > 0.6) {
          setPingMs(Math.floor(12 + Math.random() * 10));
        }

        if (next >= 100) {
          setIsCompleted(true);
          return 100;
        }
        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [hasStartedLoading, isCompleted, speedMultiplier]);

  const handleReplay = () => {
    setIsCompleted(false);
    setProgress(0);
    setPingMs(16);
    setHasStartedLoading(true);
  };

  const getSubStatusText = () => {
    if (progress < 30) {
      return {
        tl: 'Inihahanda ang pag-scan ng mga linya...',
        en: 'Initializing route network scan...',
        zh: '正在初始化網路線路掃描...'
      };
    } else if (progress < 70) {
      return {
        tl: 'Sinusuri ang latency ng pinakamabilis na server...',
        en: 'Testing server latency & stability...',
        zh: '正在測試最快伺服器的延遲與穩定度...'
      };
    } else if (progress < 100) {
      return {
        tl: 'Pinakamainam na ruta ay kinokonekta na...',
        en: 'Optimizing and establishing optimal route...',
        zh: '正在優化並建立最佳連線路徑...'
      };
    } else {
      return {
        tl: 'Nakakonekta na sa pinakamabilis na linya!',
        en: 'Successfully connected to the fastest line!',
        zh: '已成功連線至最快線路！'
      };
    }
  };

  const statusSub = getSubStatusText();

  return (
    <div 
      className="relative min-h-screen w-full text-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans select-none px-4"
      style={{ background: 'linear-gradient(135deg, #84c1ff 0%, #3b82f6 50%, #1e40af 100%)' }}
    >
      
      {/* 光暈與裝飾背景 */}
      <div className="absolute w-[600px] h-[600px] border border-white/25 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-yellow-300/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* 🌟 彈跳視窗 Modal (一進站預設顯示) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-gradient-to-b from-blue-900 to-blue-950 text-white border border-yellow-400/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.4)] text-center space-y-4"
            >
              {/* ❌ 右上角叉叉關閉按鈕 */}
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-blue-900 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400 hover:text-blue-950 transition cursor-pointer shadow-md"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 圖示與吸引人標題 */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-yellow-400/20 border border-yellow-400/40 rounded-2xl text-yellow-300">
                    <Bell className="w-6 h-6 animate-bounce" />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-yellow-300 tracking-wide">
                  🎉 Huwag palampasin ang mga bagong update at premyo!
                </h3>
                <p className="text-xs text-blue-100/90">
                  Enable notifications & download the app for instant updates.<br />
                  <span className="italic text-yellow-200 font-medium">I-on ang notifications at i-download ang app para sa mga huling balita.</span>
                </p>
              </div>

              {/* 按鈕群組 */}
              <div className="flex flex-col gap-3 pt-2">
                
                {/* 🔔 訂閱通知按鈕 */}
                <button
                  onClick={handleSubscribePush}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg transition-all cursor-pointer ${
                    isSubscribed 
                      ? 'bg-emerald-600 text-white border border-emerald-400' 
                      : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-blue-950 border border-white/60 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                  }`}
                >
                  <Bell className="w-4 h-4 text-blue-950" />
                  <span>{isSubscribed ? '✅ Notifications Enabled' : '🚀 Enable Notifications'}</span>
                </button>

                {/* 📥 下載/安裝 App 按鈕 */}
                {showInstallBtn ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-[#84c1ff] to-blue-600 text-blue-950 border border-white/40 hover:scale-[1.02] active:scale-95 shadow-lg transition-all cursor-pointer animate-pulse"
                  >
                    <Download className="w-4 h-4 text-blue-950" />
                    <span>📥 Install PHPLotto App</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      alert(
                        "📲 PHPLotto App Installation Guide / Gabay sa Pag-install:\n\n" +
                        "【iPhone / iPad (iOS Safari)】\n" +
                        "1. Tap the 'Share' button at the bottom toolbar (📤).\n" +
                        "   (I-tap ang 'Share' button sa ibaba)\n\n" +
                        "2. Scroll down and tap 'Add to Home Screen' (➕).\n" +
                        "   (I-scroll pababa at piliin ang 'Add to Home Screen')\n\n" +
                        "3. Tap 'Add' at the top right to complete.\n" +
                        "   (I-tap ang 'Add' sa kanang itaas)\n\n" +
                        "【Android / Desktop】\n" +
                        "Tap the browser menu (⋮) and select 'Install app' or 'Add to Home screen'."
                      );
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-blue-900 text-yellow-300 border border-yellow-400/40 hover:bg-blue-800 transition-all cursor-pointer shadow-lg"
                  >
                    <Download className="w-4 h-4 text-yellow-400" />
                    <span>📲 How to Install App?</span>
                  </button>
                )}

              </div>

              {/* 關閉提示 */}
              <button 
                onClick={handleCloseModal}
                className="text-[11px] text-blue-200 hover:text-yellow-300 underline pt-1 cursor-pointer font-medium"
              >
                Patuloy sa site / Continue to site ➔
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Single-Page Centered Content Card (背景主畫面) */}
      <main className="relative z-10 w-full max-w-md flex flex-col items-center text-center py-8">
        
        {/* LOGO SECTION */}
        <div className="relative mb-12 group drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
          <div className="absolute -inset-2 bg-gradient-to-r from-yellow-300 to-white rounded-3xl blur-md opacity-50 group-hover:opacity-80 transition duration-500 animate-pulse" />
          
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-yellow-300 bg-blue-900 p-2 shadow-2xl backdrop-blur-xl flex items-center justify-center"
          >
            <img 
              src={logoImg} 
              alt="Fast Route Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl transform transition duration-500 hover:scale-105"
            />

            <div className="absolute top-1.5 right-1.5 bg-yellow-400/30 border border-yellow-300/60 rounded-full p-1 text-yellow-200 shadow-sm">
              <SignalHigh className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="w-full space-y-3 mb-10 max-w-[340px]">
          <div className="flex items-center justify-between text-xs font-medium px-1">
            <span className="flex items-center gap-1.5 text-yellow-200 tracking-wider uppercase font-bold text-[11px] drop-shadow">
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
              <span>Route Speed Scan</span>
            </span>
            <span className="font-mono text-sm font-bold text-yellow-300 drop-shadow">
              {Math.floor(progress)}%
            </span>
          </div>

          <div className="relative w-full h-[7px] bg-blue-950/80 rounded-full overflow-hidden border border-white/30 shadow-inner">
            <motion.div 
              className="relative h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 shadow-[0_0_15px_rgba(250,204,21,0.9)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />

              {progress > 2 && progress < 100 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_#FACC15]" />
              )}
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-100 px-1 font-mono pt-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping inline-block" />
              <span>Latency:</span>
              <span className="text-yellow-200 font-bold">{pingMs} ms</span>
            </span>
            <span>
              Node: <span className="text-white font-bold">{activeNode}</span>
            </span>
          </div>
        </div>

        {/* STATUS MESSAGES */}
        <div className="w-full bg-blue-950/70 border border-white/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />

          <div className="space-y-4">
            
            {(langMode === 'dual' || langMode === 'tl') && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-yellow-300 font-bold tracking-widest uppercase">
                  <Globe className="w-3.5 h-3.5 text-yellow-300" />
                  <span>TAGALOG</span>
                </div>
                <h2 className="text-[18px] font-medium text-white tracking-[0.02em] leading-relaxed drop-shadow">
                  "Naghahanap ng pinakamabilis na linya para sa iyo..."
                </h2>
                <p className="text-xs text-blue-200">
                  {statusSub.tl}
                </p>
              </motion.div>
            )}

            {langMode === 'dual' && (
              <div className="w-full h-[1px] bg-white/20 my-2" />
            )}

            {(langMode === 'dual' || langMode === 'en') && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#84c1ff] font-bold tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>ENGLISH</span>
                </div>
                <h3 className="text-[14px] font-normal text-blue-100 uppercase tracking-[0.15em] leading-relaxed">
                  "Searching for the fastest line for you..."
                </h3>
                <p className="text-xs text-blue-200/80">
                  {statusSub.en}
                </p>
              </motion.div>
            )}

          </div>

          <AnimatePresence>
            {isCompleted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 pt-3 border-t border-yellow-300/40 text-yellow-300 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                <span>Ready! Line test completed. Redirecting...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM CONTROLS & UTILITIES */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-white">
          
          <button
            onClick={handleReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/80 border border-white/30 hover:border-yellow-300 text-white transition active:scale-95 cursor-pointer shadow-md"
            title="Replay loading animation"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-yellow-300 ${progress < 100 ? 'animate-spin' : ''}`} />
            <span>Replay Loading</span>
          </button>

          <div className="flex items-center bg-blue-900/80 border border-white/30 rounded-lg p-0.5 shadow-md">
            {(['dual', 'tl', 'en'] as LanguageMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLangMode(mode)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer uppercase ${
                  langMode === mode 
                    ? 'bg-yellow-300 text-blue-950 shadow' 
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                {mode === 'dual' ? 'Dual' : mode === 'tl' ? 'Tagalog' : 'English'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSpeedMultiplier(prev => prev === 1 ? 2.5 : prev === 2.5 ? 0.4 : 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-900/80 border border-white/30 hover:border-yellow-300 text-white transition cursor-pointer font-medium shadow-md"
          >
            <Zap className="w-3 h-3 text-yellow-300" />
            <span>Speed: {speedMultiplier === 1 ? '1x' : speedMultiplier === 2.5 ? 'Fast (2.5x)' : 'Slow (0.4x)'}</span>
          </button>

        </div>

        {/* Security Footer */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-blue-100 uppercase tracking-[0.2em] font-medium drop-shadow">
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
          <span>Secure Connection Established • 256-bit Node Verification</span>
        </div>

      </main>

    </div>
  );
}
