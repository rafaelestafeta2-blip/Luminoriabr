import React, { useEffect, useState } from 'react';
import { Film, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { IntroSceneCanvas } from './IntroSceneCanvas';
import { netflixSpaceAudio } from './netflixSpaceAudio';

interface LuminoriaAnimatedIntroProps {
  onComplete: () => void;
}

export const LuminoriaAnimatedIntro: React.FC<LuminoriaAnimatedIntroProps> = ({
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    // Check ultra-mode autostart requirement
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1') {
        onComplete();
        return;
      }
    }

    // Trigger Netflix-style Ta-Dum cinematic sound
    netflixSpaceAudio.playTaDum();
    setAudioStarted(true);

    const startTime = Date.now();
    const durationMs = 5000; // 5.0 seconds cinematic intro

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(1, elapsed / durationMs);
      setProgress(p);

      if (p >= 1) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    }, 16);

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

  const handleUserInteract = () => {
    if (!audioStarted && !isMuted) {
      netflixSpaceAudio.playTaDum();
      setAudioStarted(true);
    }
  };

  return (
    <div
      onClick={handleUserInteract}
      className="fixed inset-0 z-[100] bg-[#020205] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* 3D WebGL Canvas Layer (Deep Space + Spiderweb Posters + 3D Title) */}
      <IntroSceneCanvas progress={progress} />

      {/* Top Bar Overlay */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6 pointer-events-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-rose-600/40 text-xs font-bold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]">
          <Film className="w-3.5 h-3.5 text-[#E50914]" />
          <span className="tracking-wide">Luminoria Original · Spiderweb Matrix</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSound();
            }}
            className="px-3.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Mudo</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#E50914]" />
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
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label="Pular introdução animada"
          >
            <span>Pular Intro</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Center Subtitle Legend */}
      <div className="relative z-10 text-center px-4 pointer-events-none mt-auto mb-3">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-red-500/25 text-rose-300 text-xs font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
          <span>Catálogo Top Filmes & Séries em 3D</span>
        </div>
      </div>

      {/* Bottom Dock Overlay */}
      <footer className="relative z-10 p-4 sm:p-6 flex flex-col items-center gap-3 pointer-events-auto">
        {/* Progress Bar (Netflix Red) */}
        <div className="w-full max-w-md h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/15">
          <div
            className="h-full bg-gradient-to-r from-[#E50914] via-rose-500 to-[#B20710] transition-all duration-75 shadow-[0_0_10px_#E50914]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full max-w-md text-[11px] text-white/50 font-mono">
          <span>{Math.round(progress * 100)}%</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
          >
            Entrar no Catálogo →
          </button>
        </div>
      </footer>
    </div>
  );
};
