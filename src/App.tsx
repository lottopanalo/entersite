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
  SignalHigh 
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

        // Realistic non-linear progress increments
        let increment = Math.random() * 8 + 3;
        if (prev > 75) increment = Math.random() * 4 + 1; // Slow down slightly near finish for realistic feel
        if (prev > 95) increment = 0.8;

        const next = Math.min(100, prev + increment * speedMultiplier);
        
        // Dynamic ping variation
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

  // Helper for status tag based on progress
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
    <div className="relative min-h-screen w-full bg-[#0A0A0A] text-white flex flex-col items-center justify-center overflow-hidden font-sans select-none px-4">
      
      {/* Elegant Dark Concentric Rings */}
      <div className="absolute w-[600px] h-[600px] border border-white/[0.03] rounded-full pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] border border-white/[0.05] rounded-full pointer-events-none" />

      {/* Dynamic Ambient Orange Accent Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F27D26]/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#F27D26]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Single-Page Centered Content Card */}
      <main className="relative z-10 w-full max-w-md flex flex-col items-center text-center py-8">
        
        {/* LOGO SECTION */}
        <div className="relative mb-12 group drop-shadow-[0_0_25px_rgba(242,125,38,0.22)]">
          {/* Logo Outer Halo Effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#F27D26] to-amber-600 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse" />
          
          {/* Logo Frame */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#F27D26] bg-[#0E0E0E] p-2 shadow-2xl backdrop-blur-xl flex items-center justify-center animate-float-slow"
          >
            <img 
              src={logoImg} 
              alt="Fast Route Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl transform transition duration-500 hover:scale-105"
            />

            {/* Glowing Accent Badge */}
            <div className="absolute top-1.5 right-1.5 bg-[#F27D26]/20 border border-[#F27D26]/50 rounded-full p-1 text-[#F27D26] shadow-sm">
              <SignalHigh className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="w-full space-y-3 mb-10 max-w-[340px]">
          {/* Progress Header & Percentage */}
          <div className="flex items-center justify-between text-xs font-medium px-1">
            <span className="flex items-center gap-1.5 text-[#F27D26] tracking-wider uppercase font-semibold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-[#F27D26] animate-bounce" />
              <span>Route Speed Scan</span>
            </span>
            <span className="font-mono text-sm font-bold text-white">
              {Math.floor(progress)}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-[5px] bg-[#1A1A1A] rounded-full overflow-hidden shadow-inner">
            {/* Active Progress Fill */}
            <motion.div 
              className="relative h-full rounded-full bg-[#F27D26] shadow-[0_0_12px_rgba(242,125,38,0.7)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />

              {/* Glowing Leading Head Dot */}
              {progress > 2 && progress < 100 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_#F27D26]" />
              )}
            </motion.div>
          </div>

          {/* Sub-metrics latency bar */}
          <div className="flex items-center justify-between text-[11px] text-[#666666] px-1 font-mono pt-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26] animate-ping inline-block" />
              <span>Latency:</span>
              <span className="text-[#F27D26] font-semibold">{pingMs} ms</span>
            </span>
            <span>
              Node: <span className="text-slate-300 font-medium">{activeNode}</span>
            </span>
          </div>
        </div>

        {/* WARM TIPS / STATUS MESSAGES */}
        <div className="w-full bg-[#121212]/80 border border-[#222222] rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[1px] bg-gradient-to-r from-transparent via-[#F27D26]/60 to-transparent" />

          {/* Primary Warm Tip Header */}
          <div className="space-y-4">
            
            {/* Tagalog Section */}
            {(langMode === 'dual' || langMode === 'tl') && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#F27D26] font-medium tracking-widest uppercase">
                  <Globe className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>TAGALOG</span>
                </div>
                <h2 className="text-[18px] font-light text-white tracking-[0.02em] leading-relaxed">
                  "Naghahanap ng pinakamabilis na linya para sa iyo..."
                </h2>
                <p className="text-xs text-[#888888]">
                  {statusSub.tl}
                </p>
              </motion.div>
            )}

            {/* Separator if both enabled */}
            {langMode === 'dual' && (
              <div className="w-full h-[1px] bg-[#1F1F1F] my-2" />
            )}

            {/* English Section */}
            {(langMode === 'dual' || langMode === 'en') && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#888888] font-medium tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>ENGLISH</span>
                </div>
                <h3 className="text-[14px] font-normal text-[#666666] uppercase tracking-[0.15em] leading-relaxed">
                  "Searching for the fastest line for you..."
                </h3>
                <p className="text-xs text-[#666666]">
                  {statusSub.en}
                </p>
              </motion.div>
            )}


          </div>

          {/* Completion Celebration State */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 pt-3 border-t border-[#F27D26]/30 text-[#F27D26] flex items-center justify-center gap-2 text-xs font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-[#F27D26]" />
                <span>Ready! Line test completed.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM CONTROLS & UTILITIES */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-[#888888]">
          
          {/* Replay Loading Button */}
          <button
            onClick={handleReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#262626] hover:border-[#F27D26]/50 text-slate-200 transition active:scale-95 cursor-pointer shadow-sm"
            title="Replay loading animation"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F27D26] ${progress < 100 ? 'animate-spin' : ''}`} />
            <span>Replay Loading</span>
          </button>

          {/* Language Mode Toggle */}
          <div className="flex items-center bg-[#141414] border border-[#262626] rounded-lg p-0.5">
            <button
              onClick={() => setLangMode('dual')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                langMode === 'dual' 
                  ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40' 
                  : 'text-[#666666] hover:text-slate-200'
              }`}
            >
              Dual
            </button>
            <button
              onClick={() => setLangMode('tl')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                langMode === 'tl' 
                  ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40' 
                  : 'text-[#666666] hover:text-slate-200'
              }`}
            >
              Tagalog
            </button>
            <button
              onClick={() => setLangMode('en')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                langMode === 'en' 
                  ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40' 
                  : 'text-[#666666] hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>

          {/* Speed Toggle */}
          <button
            onClick={() => setSpeedMultiplier(prev => prev === 1 ? 2.5 : prev === 2.5 ? 0.4 : 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#262626] hover:border-[#F27D26]/50 text-slate-300 transition cursor-pointer"
          >
            <Zap className="w-3 h-3 text-[#F27D26]" />
            <span>Speed: {speedMultiplier === 1 ? '1x' : speedMultiplier === 2.5 ? 'Fast (2.5x)' : 'Slow (0.4x)'}</span>
          </button>

        </div>

        {/* Security / Quality Assurance Footer */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-[#444444] uppercase tracking-[0.2em] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#F27D26]/60" />
          <span>Secure Connection Established • 256-bit Node Verification</span>
        </div>

      </main>
    </div>
  );
}

