import React, { useState } from 'react';
import { Bell, BellRing, Calendar, Check, Clapperboard, Play, Sparkles } from 'lucide-react';
import { VodItem } from '../../types/luminoria';
import { getFallbackYoutubeTrailerId } from '../../services/tmdbEnrichClient';
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

  const handleReminderClick = () => {
    if (!reminderSaved) {
      setReminderSaved(true);
      onSetReminder?.();
    }
  };

  return (
    <div className="relative w-full aspect-video bg-[#07080E] overflow-hidden select-none border-b border-white/10">
      {playTrailer ? (
        <iframe
          src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0`}
          title={`Trailer Oficial — ${vod.title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
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
              Este título faz parte do catálogo oficial TMDB e está em fase de liberação para a sua
              lista M3U. Assista à prévia oficial abaixo ou ative o alerta de estreia.
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
              <span className="inline-flex items-center gap-1">
                <Clapperboard className="w-3.5 h-3.5 text-rose-400" /> Ficha Técnica TMDB Verificada
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
