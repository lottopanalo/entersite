import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  SignalHigh,
  Download,
  Bell,
  X,
  Share,
  PlusSquare
} from 'lucide-react';

// Import OneSignal Push SDK
import OneSignal from 'react-onesignal';

// Imported logo asset
import logoImg from './assets/images/my_logo.png';

// Main and backup API endpoint list
const TARGET_DOMAINS = [
  'https://phplotto.net',
  'https://phplotto.ph',
  'https://phplottos.com',
  'https://phplotto.com'
];

export default function App() {
  const [progress, setProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [pingMs, setPingMs] = useState<number>(18);
  const [activeNode, setActiveNode] = useState<string>('Node MNL-04 (Fastest)');

  // Modal display states
  const [showModal, setShowModal] = useState<boolean>(true);
  const [hasStartedLoading, setHasStartedLoading] = useState<boolean>(false);

  // PWA install prompt states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);

  // Push Notification state
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // iOS & Standalone detection states
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  // Initial detection and OneSignal setup
  useEffect(() => {
    // 1. Detect HTTPS redirect
    if (window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
      window.location.replace(window.location.href.replace('http://', 'https://'));
      return;
    }

    // 2. Detect iOS & Standalone mode
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;

    setIsIOS(iosDevice);
    setIsStandalone(standaloneMode);

    // 3. Listen for Android/Desktop PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
      console.log('[PWA] Install prompt captured successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Initialize OneSignal
    if (typeof window !== 'undefined' && !(window as any)._oneSignalInitialized) {
      (window as any)._oneSignalInitialized = true;
      
      OneSignal.init({
        appId: "aa84d6bc-c116-4612-97b0-c63794bb4a53",
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: "OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js",
      }).then(async () => {
        console.log('[OneSignal] Initialized successfully!');
        
        try {
          if (OneSignal.User && OneSignal.User.pushSubscription) {
            const isOptedIn = OneSignal.User.pushSubscription.optedIn;
            if (isOptedIn) {
              setIsSubscribed(true);
            }
          }
        } catch (e) {
          console.log('[OneSignal] Checking subscription status...');
        }
      }).catch((err) => {
        console.error('[OneSignal] Initialization error:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Request Push Notification permission via OneSignal
  const handleSubscribePush = async () => {
    console.log('[Push Debug] Triggering subscription...');

    // If Notifications or ServiceWorkers are not supported in current browser environment
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert(
        '⚠️ Web notifications are not supported in your current browser mode.\n\n' +
        'Please add this app to your Home Screen or install it first, then open it from your Home Screen to enable notifications.'
      );
      return;
    }

    const currentPermission = Notification.permission;
    console.log('[Push Debug] Current permission status:', currentPermission);

    if (currentPermission === 'denied') {
      alert(
        '⚠️ Notification permissions are blocked!\n\n' +
        'Please click the lock icon next to the address bar, enable "Notifications", and refresh the page.'
      );
      return;
    }

    if (currentPermission === 'granted') {
      setIsSubscribed(true);
      alert('✅ Notifications are already enabled!');
      return;
    }

    try {
      if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
        const accepted = await OneSignal.Notifications.requestPermission();
        console.log('[Push Debug] Permission result:', accepted);
        
        if (accepted) {
          setIsSubscribed(true);
          alert('🎉 Push notifications enabled successfully!');
        } else {
          alert('⚠️ Notification request was canceled.');
        }
      } else {
        const nativePermission = await Notification.requestPermission();
        if (nativePermission === 'granted') {
          setIsSubscribed(true);
          alert('🎉 Push notifications enabled successfully!');
        }
      }
    } catch (err: any) {
      console.error('[Push Debug] Exception during subscription:', err);
      alert(`❌ Subscription error: ${err?.message || JSON.stringify(err)}`);
    }
  };

  // Handle Android PWA install trigger
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        "📲 App Installation Guide:\n\n" +
        "🍏 iOS (Safari):\n" +
        "1. Tap the Share button at the bottom of Safari.\n" +
        "2. Scroll down and select 'Add to Home Screen'.\n\n" +
        "🤖 Android (Chrome):\n" +
        "1. Tap the browser menu (⋮) at the top-right.\n" +
        "2. Select 'Install app' or 'Add to Home screen'."
      );
      return;
    }

    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Close Modal & trigger loading sequence
  const handleCloseModal = () => {
    setShowModal(false);
    setHasStartedLoading(true);
  };

  // Redirect upon connection completion
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
            console.warn(`[App] Domain connection test failed: ${domain}`);
          }
        }

        window.location.href = targetUrl;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // Simulate progress bar
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
      return 'Initializing route network scan...';
    } else if (progress < 70) {
      return 'Testing server latency & stability...';
    } else if (progress < 100) {
      return 'Optimizing and establishing optimal route...';
    } else {
      return 'Successfully connected to the fastest line!';
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full text-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans select-none px-4"
      style={{ background: 'linear-gradient(135deg, #84c1ff 0%, #3b82f6 50%, #1e40af 100%)' }}
    >
      <div className="absolute w-[600px] h-[600px] border border-white/25 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-yellow-300/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* 🌟 Interactive Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-gradient-to-b from-blue-900 to-blue-950 text-white border border-yellow-400/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.4)] text-center space-y-4"
            >
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-blue-900 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400 hover:text-blue-950 transition cursor-pointer shadow-md"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 pt-1">
                {/* 🏷️ Platform Logo */}
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <img 
                      src={logoImg} 
                      alt="Platform Logo" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-yellow-400/60 shadow-lg" 
                    />
                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-yellow-400 text-blue-950 rounded-full shadow-md">
                      <Bell className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-yellow-300 tracking-wide">
                  Never Miss Important Updates & Rewards!
                </h3>
                <p className="text-xs text-blue-100/90">
                  Enable notifications or install our web app for instant updates and exclusive offers.
                </p>
              </div>

              {/* Modal Content Logic: iOS vs Android/Desktop */}
              <div className="flex flex-col gap-3 pt-2">
                {isIOS && !isStandalone ? (
                  /* 🍎 iOS Safari Guidance Card */
                  <div className="bg-blue-900/90 border border-yellow-400/40 rounded-2xl p-4 text-left space-y-2.5 text-xs text-blue-100">
                    <div className="flex items-center gap-2 text-yellow-300 font-bold border-b border-yellow-400/20 pb-2">
                      <Share className="w-4 h-4 text-yellow-300 animate-pulse" />
                      <span>iOS Setup Required for Push Notifications</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
                      <li>
                        Tap the <span className="font-bold text-yellow-300">Share</span> button <Share className="inline w-3.5 h-3.5 mx-0.5 text-yellow-300" /> at the bottom of Safari.
                      </li>
                      <li>
                        Scroll down and select <span className="font-bold text-yellow-300">'Add to Home Screen'</span> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-yellow-300" />.
                      </li>
                      <li>
                        Open the app from your Home Screen to enable push notifications.
                      </li>
                    </ol>
                  </div>
                ) : (
                  /* 🚀 Android, Desktop, or iOS PWA Standalone Mode */
                  <>
                    {/* 1. App Install Button (First Priority) */}
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
                            "📲 App Installation Guide:\n\n" +
                            "🍏 iOS (Safari):\n" +
                            "1. Tap the Share button at the bottom of Safari.\n" +
                            "2. Scroll down and select 'Add to Home Screen'.\n\n" +
                            "🤖 Android (Chrome):\n" +
                            "1. Tap the browser menu (⋮) at the top-right.\n" +
                            "2. Select 'Install app' or 'Add to Home screen'."
                          );
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-blue-900 text-yellow-300 border border-yellow-400/40 hover:bg-blue-800 transition-all cursor-pointer shadow-lg"
                      >
                        <Download className="w-4 h-4 text-yellow-400" />
                        <span>📲 How to Install App?</span>
                      </button>
                    )}

                    {/* 2. Push Notification Button (Second Priority) */}
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
                  </>
                )}
              </div>

              <button 
                onClick={handleCloseModal}
                className="text-[11px] text-blue-200 hover:text-yellow-300 underline pt-1 cursor-pointer font-medium"
              >
                Continue to site ➔
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Loading Card */}
      <main className="relative z-10 w-full max-w-md flex flex-col items-center text-center py-8">
        <div className="relative mb-12 group drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
          <div className="absolute -inset-2 bg-gradient-to-r from-yellow-300 to-white rounded-3xl blur-md opacity-50 group-hover:opacity-80 transition duration-500 animate-pulse" />
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-yellow-300 bg-blue-900 p-2 shadow-2xl backdrop-blur-xl flex items-center justify-center"
          >
            <img src={logoImg} alt="Fast Route Logo" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-xl transform transition duration-500 hover:scale-105" />
            <div className="absolute top-1.5 right-1.5 bg-yellow-400/30 border border-yellow-300/60 rounded-full p-1 text-yellow-200 shadow-sm">
              <SignalHigh className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </motion.div>
        </div>

        <div className="w-full space-y-3 mb-10 max-w-[340px]">
          <div className="flex items-center justify-between text-xs font-medium px-1">
            <span className="flex items-center gap-1.5 text-yellow-200 tracking-wider uppercase font-bold text-[11px] drop-shadow">
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
              <span>Route Speed Scan</span>
            </span>
            <span className="font-mono text-sm font-bold text-yellow-300 drop-shadow">{Math.floor(progress)}%</span>
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
            <span>Node: <span className="text-white font-bold">{activeNode}</span></span>
          </div>
        </div>

        <div className="w-full bg-blue-950/70 border border-white/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
          <div className="space-y-3">
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-yellow-300 font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Optimizing Connection</span>
              </div>
              <h2 className="text-[18px] font-medium text-white tracking-[0.02em] leading-relaxed drop-shadow">
                "Searching for the fastest route for you..."
              </h2>
              <p className="text-xs text-blue-200">{getSubStatusText()}</p>
            </motion.div>
          </div>
          <AnimatePresence>
            {isCompleted && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-4 pt-3 border-t border-yellow-300/40 text-yellow-300 flex items-center justify-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                <span>Connection verified! Redirecting to secure route...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls Section */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-white">
          <button onClick={handleReplay} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/80 border border-white/30 hover:border-yellow-300 text-white transition active:scale-95 cursor-pointer shadow-md">
            <RefreshCw className={`w-3.5 h-3.5 text-yellow-300 ${progress < 100 ? 'animate-spin' : ''}`} />
            <span>Replay Scan</span>
          </button>
          <button onClick={() => setSpeedMultiplier(prev => prev === 1 ? 2.5 : prev === 2.5 ? 0.4 : 1)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-900/80 border border-white/30 hover:border-yellow-300 text-white transition cursor-pointer font-medium shadow-md">
            <Zap className="w-3 h-3 text-yellow-300" />
            <span>Speed: {speedMultiplier === 1 ? '1x' : speedMultiplier === 2.5 ? 'Fast (2.5x)' : 'Slow (0.4x)'}</span>
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-blue-100 uppercase tracking-[0.2em] font-medium drop-shadow">
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
          <span>Secure Connection Established • 256-bit Node Verification</span>
        </div>
      </main>
    </div>
  );
}
