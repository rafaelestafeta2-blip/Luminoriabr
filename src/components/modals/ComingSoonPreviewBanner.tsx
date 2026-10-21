import React, { useState } from 'react';
import { Bell, Calendar, Check, ExternalLink, Play, Sparkles } from 'lucide-react';
import { VodItem } from '../../types/luminoria';
import { getFallbackYoutubeTrailerId } from '../../services/tmdbEnrichClient';
import { getDeterministicHdStream } from '../../services/streamUrlHelper';
import { PosterArtwork } from '../ui/PosterArtwork';

interface ComingSoonPreviewBannerProps {
  vod: VodItem;
  onSetReminder?: () => void;
}

export const ComingSoonPreviewBanner: React.FC<ComingSoonPreviewBannerProps> = ({
  vod,
  onSetReminder,
}) => {
  const [playTrailer, setPlayTrailer] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  const trailerId = vod.youtubeTrailerId || getFallbackYoutubeTrailerId(vod.title);
  const trailerStreamUrl = getDeterministicHdStream(`${vod.title}-trailer`);

  const handleReminderClick = () => {
    if (!reminderSaved) {
      setReminderSaved(true);
      onSetReminder?.();
    }
  };

  return (
    <div className="relative w-full aspect-video bg-[#07080E] overflow-hidden select-none border-b border-white/10">
      {playTrailer ? (
        <div className="relative w-full h-full bg-black">
          <video
            src={trailerStreamUrl}
            poster={vod.backdropUrl || vod.posterUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-black/80 border border-white/15 text-[11px] font-bold text-rose-300">
              Trailer Oficial — {vod.title}
            </span>
            <a
              href={`https://www.youtube.com/watch?v=${trailerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir no App YouTube</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          <PosterArtwork
            variant={vod.backdropUrl || vod.posterUrl || vod.artworkKey}
            imageUrl={vod.backdropUrl || vod.posterUrl}
            title={vod.title}
            hideBottomLabel
            className="absolute inset-0 w-full h-full opacity-65"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F17] via-[#0E0F17]/70 to-black/50" />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-5 sm:p-8 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold uppercase tracking-wider shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Em Breve no Catálogo · Sincronizado TMDB</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black font-display text-white tracking-tight">
              {vod.title} ({vod.year})
            </h3>

            <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
              Este título faz parte do catálogo oficial TMDB e está disponível no player nativo.
              Assista à prévia oficial em alta definição ou ative o alerta de estreia.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPlayTrailer(true)}
                className="px-6 py-3 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.35)] transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Assistir Trailer Oficial</span>
              </button>

              <button
                type="button"
                onClick={handleReminderClick}
                className={`px-5 py-3 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 border transition-all cursor-pointer ${
                  reminderSaved
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-black/75 hover:bg-white/10 border-white/25 text-white'
                }`}
              >
                {reminderSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Lembrete Ativado na Lista</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Avise-me Quando Estrear</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-white/55 pt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Ano: {vod.year}
              </span>
              <span>·</span>
              <span>Duração: {vod.duration}</span>
              <span>·</span>
              <span className="text-amber-400">★ {vod.rating.toFixed(1)} TMDB</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
