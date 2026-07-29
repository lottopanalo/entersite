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
  Download
} from 'lucide-react';

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

  // PWA 安裝提示相關狀態
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);

  // 🎯 主站與備用 API 清單
  const TARGET_DOMAINS = [
    'https://phplotto.ph',
    'https://phplotto.net',
    'https://phplottos.com',
    'https://phplotto.com'
  ];

  // 📥 監聽瀏覽器的 PWA 安裝事件
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // 阻止瀏覽器預設行為
      setDeferredPrompt(e); // 儲存事件
      setShowInstallBtn(true); // 顯示自訂安裝按鈕
      console.log('[PWA] 已成功捕捉到安裝事件，按鈕已啟用');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 手動觸發 PWA 安裝
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`使用者安裝選擇: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // 🚀 當進度條完成時，自動測試網域並跳轉到第一個健康的網址
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(async () => {
        let targetUrl = TARGET_DOMAINS[0]; // 預設先用主站

        // 依序測試清單中的網址，確保能通才跳轉
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
            console.log(`[App] 探測成功，選擇可用網域: ${domain}`);
            break; 
          } catch (e) {
            console.warn(`[App] 網域連線測試失敗，嘗試下一個: ${domain}`);
          }
        }

        // 執行最終跳轉
        window.location.href = targetUrl;
      }, 1200); // 延長停留在 100% 的時間（1.2 秒），給予 PWA 安裝與緩衝時間

      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // Simulate realistic network route finding progress
  useEffect(() => {
    if (isCompleted) return;

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
  }, [isCompleted, speedMultiplier]);

  const handleReplay = () => {
    setIsCompleted(false);
    setProgress(0);
    setPingMs(16);
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
    <div className="relative min-h-screen w-full bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white flex flex-col items-center justify-center overflow-hidden font-sans select-none px-4">
      
      {/* 藍黃主題背景光暈與裝飾 */}
      <div className="absolute w-[600px] h-[600px] border border-blue-400/10 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-yellow-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Single-Page Centered Content Card */}
      <main className="relative z-10 w-full max-w-md flex flex-col items-center text-center py-8">
        
        {/* LOGO SECTION */}
        <div className="relative mb-12 group drop-shadow-[0_0_25px_rgba(255,215,0,0.3)]">
          <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-blue-500 rounded-3xl blur-md opacity-40 group-hover:opacity-70 transition duration-500 animate-pulse" />
          
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-yellow-400 bg-blue-950 p-2 shadow-2xl backdrop-blur-xl flex items-center justify-center"
          >
            <img 
              src={logoImg} 
              alt="Fast Route Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl transform transition duration-500 hover:scale-105"
            />

            <div className="absolute top-1.5 right-1.5 bg-yellow-400/20 border border-yellow-400/50 rounded-full p-1 text-yellow-300 shadow-sm">
              <SignalHigh className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="w-full space-y-3 mb-10 max-w-[340px]">
          <div className="flex items-center justify-between text-xs font-medium px-1">
            <span className="flex items-center gap-1.5 text-yellow-300 tracking-wider uppercase font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
              <span>Route Speed Scan</span>
            </span>
            <span className="font-mono text-sm font-bold text-yellow-300">
              {Math.floor(progress)}%
            </span>
          </div>

          <div className="relative w-full h-[6px] bg-blue-950 rounded-full overflow-hidden border border-blue-500/30 shadow-inner">
            <motion.div 
              className="relative h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(250,204,21,0.8)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />

              {progress > 2 && progress < 100 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_#FACC15]" />
              )}
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-200/70 px-1 font-mono pt-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping inline-block" />
              <span>Latency:</span>
              <span className="text-yellow-300 font-semibold">{pingMs} ms</span>
            </span>
            <span>
              Node: <span className="text-white font-medium">{activeNode}</span>
            </span>
          </div>
        </div>

        {/* STATUS MESSAGES */}
        <div className="w-full bg-blue-950/80 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

          <div className="space-y-4">
            
            {(langMode === 'dual' || langMode === 'tl') && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-yellow-300 font-bold tracking-widest uppercase">
                  <Globe className="w-3.5 h-3.5 text-yellow-400" />
                  <span>TAGALOG</span>
                </div>
                <h2 className="text-[18px] font-medium text-white tracking-[0.02em] leading-relaxed">
                  "Naghahanap ng pinakamabilis na linya para sa iyo..."
                </h2>
                <p className="text-xs text-blue-200/70">
                  {statusSub.tl}
                </p>
              </motion.div>
            )}

            {langMode === 'dual' && (
              <div className="w-full h-[1px] bg-blue-800/50 my-2" />
            )}

            {(langMode === 'dual' || langMode === 'en') && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-blue-300 font-bold tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>ENGLISH</span>
                </div>
                <h3 className="text-[14px] font-normal text-blue-200/90 uppercase tracking-[0.15em] leading-relaxed">
                  "Searching for the fastest line for you..."
                </h3>
                <p className="text-xs text-blue-200/60">
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
                className="mt-4 pt-3 border-t border-yellow-400/30 text-yellow-300 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                <span>Ready! Line test completed. Redirecting...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM CONTROLS & UTILITIES */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-blue-200">
          
          <button
            onClick={handleReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/60 border border-blue-500/30 hover:border-yellow-400 text-white transition active:scale-95 cursor-pointer shadow-sm"
            title="Replay loading animation"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-yellow-400 ${progress < 100 ? 'animate-spin' : ''}`} />
            <span>Replay Loading</span>
          </button>

          <div className="flex items-center bg-blue-900/60 border border-blue-500/30 rounded-lg p-0.5">
            {(['dual', 'tl', 'en'] as LanguageMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLangMode(mode)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer uppercase ${
                  langMode === mode 
                    ? 'bg-yellow-400 text-blue-950 shadow' 
                    : 'text-blue-200/70 hover:text-white'
                }`}
              >
                {mode === 'dual' ? 'Dual' : mode === 'tl' ? 'Tagalog' : 'English'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSpeedMultiplier(prev => prev === 1 ? 2.5 : prev === 2.5 ? 0.4 : 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-900/60 border border-blue-500/30 hover:border-yellow-400 text-white transition cursor-pointer font-medium"
          >
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>Speed: {speedMultiplier === 1 ? '1x' : speedMultiplier === 2.5 ? 'Fast (2.5x)' : 'Slow (0.4x)'}</span>
          </button>

        </div>

        {/* Security Footer */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-blue-300/60 uppercase tracking-[0.2em] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
          <span>Secure Connection Established • 256-bit Node Verification</span>
        </div>

      </main>

      {/* 🌟 浮動的 PWA 安裝按鈕（當瀏覽器觸發 beforeinstallprompt 時會自動顯示） */}
      <AnimatePresence>
        {showInstallBtn && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-blue-950 font-extrabold px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(250,204,21,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/40 animate-bounce"
            >
              <Download className="w-5 h-5 text-blue-950" />
              <span>安裝 PHPLotto App</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
