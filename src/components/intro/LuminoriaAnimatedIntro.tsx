import React, { useEffect, useState } from 'react';
import { Film, Play, Sparkles, Tv, Volume2, VolumeX, X } from 'lucide-react';
import { netflixSpaceAudio } from './netflixSpaceAudio';

interface LuminoriaAnimatedIntroProps {
  onComplete: () => void;
}

const SHOWCASE_POSTERS = [
  'https://image.tmdb.org/t/p/w342/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
  'https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'https://image.tmdb.org/t/p/w342/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
  'https://image.tmdb.org/t/p/w342/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
  'https://image.tmdb.org/t/p/w342/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
  'https://image.tmdb.org/t/p/w342/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
];

export const LuminoriaAnimatedIntro: React.FC<LuminoriaAnimatedIntroProps> = ({
  onComplete,
}) => {
  const [progress, setProgress] = useState(8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1') {
        onComplete();
        return;
      }
    }

    netflixSpaceAudio.playTaDum();
    setAudioStarted(true);

    const startTime = Date.now();
    const durationMs = 3200; // Lightweight, snappy 3.2s cinematic intro

    // Low-frequency state update (every 80ms instead of 16ms) for zero main-thread stutter
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(p);

      if (elapsed >= durationMs) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 220);
      }
    }, 80);

    return () => {
      clearInterval(timer);
    };
  }, [onComplete]);

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    netflixSpaceAudio.setMuted(nextMuted);
    if (!nextMuted && !audioStarted) {
      netflixSpaceAudio.playTaDum();
      setAudioStarted(true);
    }
  };

  return (
    <div
      onClick={() => {
        if (!audioStarted && !isMuted) {
          netflixSpaceAudio.playTaDum();
          setAudioStarted(true);
        }
      }}
      className="fixed inset-0 z-[100] bg-[#04050A] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Pure GPU-Accelerated Ambient Prism Background (Zero WebGL Lag) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial Cinema Glows */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[420px] rounded-full opacity-35 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(6,182,212,0.55) 0%, rgba(229,9,20,0.35) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute -bottom-36 left-1/2 -translate-x-1/2 w-[760px] h-[360px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(229,9,20,0.5) 0%, rgba(14,165,233,0.25) 55%, transparent 80%)',
          }}
        />

        {/* Floating Poster Ribbon in Subtle Perspective */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 px-6 max-w-6xl w-full transform -rotate-3 scale-105">
            {SHOWCASE_POSTERS.map((src, idx) => (
              <div
                key={idx}
                className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#0B0D16]"
              >
                <img
                  src={src}
                  alt=""
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dark Cinema Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04050A] via-[#04050A]/75 to-[#04050A]" />
      </div>

      {/* Top Bar Overlay */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/15 text-xs font-bold text-white">
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tracking-wide">Luminoria Ultra HD · Cinema & Live TV</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSound();
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Mudo</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Som Ativo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="px-4 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            aria-label="Pular introdução animada"
          >
            <span>Pular Intro</span>
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Center Emblem & Brand Reveal */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 my-auto space-y-5">
        {/* Glowing Crest */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-cyan-500/30 via-rose-500/30 to-amber-500/30 blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#111526] to-[#070810] border border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#E50914] via-rose-500 to-cyan-400 flex items-center justify-center shadow-inner">
              <Play className="w-7 h-7 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[11px] font-mono uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Streaming 4K · M3U & TMDB Sync</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-rose-200 drop-shadow-[0_4px_30px_rgba(6,182,212,0.35)]">
            LUMINORIA
          </h1>

          <p className="text-xs sm:text-sm text-white/65 max-w-md mx-auto font-medium">
            Catálogo Completo de Filmes (2026 → Clássicos), Séries por Gênero e Canais Ao Vivo
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white/80 font-mono flex items-center gap-1.5">
            <Film className="w-3 h-3 text-amber-400" /> +21.700 Filmes
          </span>
          <span className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white/80 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" /> +9.500 Séries
          </span>
          <span className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white/80 font-mono flex items-center gap-1.5">
            <Tv className="w-3 h-3 text-emerald-400" /> +3.500 Canais Live
          </span>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <footer className="relative z-10 p-5 sm:p-7 flex flex-col items-center gap-2.5">
        <div className="w-full max-w-md h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-[#E50914] transition-all duration-100 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full max-w-md text-[11px] text-white/55 font-mono">
          <span>Sincronizando catálogo... {progress}%</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
          >
            Entrar Agora →
          </button>
        </div>
      </footer>
    </div>
  );
};

