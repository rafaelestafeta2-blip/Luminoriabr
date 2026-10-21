import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, Sparkles, Star, Users, X } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { SeriesEpisodeItem, VodItem } from '../../types/luminoria';
import { enrichVodWithTmdbDetails } from '../../services/tmdbEnrichClient';
import { NativeVideoPlayer } from '../player/NativeVideoPlayer';
import { AndroidNativePlayerBar } from '../player/AndroidNativePlayerBar';
import { VodTrailerAndCastSection } from './VodTrailerAndCastSection';
import { ComingSoonPreviewBanner } from './ComingSoonPreviewBanner';

export const VideoPlayerModal: React.FC = () => {
  const {
    activeModalVod,
    setActiveModalVod,
    favoriteIds,
    toggleFavorite,
    joinOrCreateCinemaRoom,
    awardWatchSession,
    vodReviews,
    addVodReview,
    addTimelineActivity,
  } = useLuminoria();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [rewarded, setRewarded] = useState(false);
  const [rating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAndroidNativeMode, setIsAndroidNativeMode] = useState(false);
  const [enrichedVod, setEnrichedVod] = useState<VodItem | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState<SeriesEpisodeItem | null>(null);

  useEffect(() => {
    if (!activeModalVod) {
      setEnrichedVod(null);
      setActiveEpisode(null);
      return;
    }

    // Ensure modal always starts scrolled to the very top so the video player is never hidden
    if (overlayRef.current) {
      overlayRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    let cancelled = false;
    setEnrichedVod(activeModalVod);
    setActiveEpisode(null);
    setIsEnriching(true);

    enrichVodWithTmdbDetails(activeModalVod)
      .then((res) => {
        if (cancelled) return;
        setEnrichedVod(res);
        if (res.episodes && res.episodes.length > 0) {
          setActiveEpisode(res.episodes[0]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsEnriching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeModalVod]);

  useEffect(() => {
    if (!activeModalVod) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModalVod(null);
    };
    const onTvRemoteBack = () => {
      setActiveModalVod(null);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('tv-remote-back', onTvRemoteBack);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('tv-remote-back', onTvRemoteBack);
    };
  }, [activeModalVod, setActiveModalVod]);

  if (!activeModalVod) return null;

  const displayVod = enrichedVod || activeModalVod;
  const activeStreamUrl = activeEpisode?.streamUrl || displayVod.streamUrl || '';
  const isComingSoonNoStream = Boolean(
    displayVod.isComingSoon ||
      !activeStreamUrl ||
      activeStreamUrl.startsWith('lumin://') ||
      (displayVod.hasM3uStream === false && !activeEpisode?.streamUrl)
  );
  const activePlayerTitle = activeEpisode
    ? `${displayVod.title} — T${activeEpisode.seasonNumber}:E${activeEpisode.episodeNumber}`
    : displayVod.title;

  const isFav = favoriteIds.includes(displayVod.id);
  const reviews = vodReviews[displayVod.id] || [];

  const handleWatchProgress = (seconds: number, durationSeconds: number = 120) => {
    const effectiveDur = durationSeconds > 0 ? durationSeconds : 120;
    const pct = Math.min(100, Math.round((seconds / effectiveDur) * 100));
    if (pct >= 20 && !rewarded) {
      awardWatchSession(120, 25);
      addTimelineActivity({
        vodId: displayVod.id,
        title: activePlayerTitle,
        year: displayVod.year,
        artworkKey: displayVod.artworkKey,
        category: displayVod.category,
        watchPercent: pct,
      });
      setRewarded(true);
    }
  };

  const handleOpenInCinemaRoom = () => {
    const targetVodId = displayVod.id;
    setActiveModalVod(null);
    joinOrCreateCinemaRoom('LUMI92', targetVodId);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addVodReview(displayVod.id, rating, comment);
    setComment('');
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-md p-2 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vod-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-[#0E0F17] border border-white/15 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] my-1 sm:my-3">
        {/* Sticky Top Bar with Prominent Back Button */}
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-[#090A10]/95 backdrop-blur-md border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveModalVod(null)}
            aria-label="Voltar para página anterior"
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Voltar para Página Anterior</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider shrink-0">
              {displayVod.mediaType === 'series' ? 'Série' : 'Filme'}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-xs font-semibold text-white/90 truncate">
              {activePlayerTitle}
            </span>
            {isComingSoonNoStream && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                Em Breve no M3U
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveModalVod(null)}
            aria-label="Fechar player"
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-white border border-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Native / Cinema Pro Video Player with M3U + Official TMDB Trailer Support */}
        <div className="relative w-full bg-black">
          <NativeVideoPlayer
            title={activePlayerTitle}
            streamUrl={activeStreamUrl}
            rawStreamUrl={activeStreamUrl}
            youtubeTrailerId={displayVod.youtubeTrailerId}
            posterUrl={displayVod.posterUrl}
            backdropUrl={displayVod.backdropUrl}
            category={displayVod.category}
            year={displayVod.year}
            durationText={displayVod.duration}
            isAndroidNativeMode={isAndroidNativeMode}
            onToggleAndroidNativeMode={() => setIsAndroidNativeMode((v) => !v)}
            onClose={() => setActiveModalVod(null)}
            onWatchProgress={handleWatchProgress}
          />
        </div>

        {/* Modal Content: Android Native Player Bar, TMDB Info, Cast, Trailer, Episodes & Reviews */}
        <div className="p-4 sm:p-7 space-y-5">
          {!isComingSoonNoStream && (
            <AndroidNativePlayerBar
              streamUrl={activeStreamUrl}
              title={activePlayerTitle}
              isAndroidNativeMode={isAndroidNativeMode}
              onToggleAndroidNativeMode={() => setIsAndroidNativeMode((v) => !v)}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
                <span className="font-semibold text-cyan-400">{displayVod.category}</span>
                <span>·</span>
                <span>{displayVod.year}</span>
                <span>·</span>
                <span>{displayVod.duration}</span>
                <span>·</span>
                <span className="text-amber-400 font-mono inline-flex items-center gap-1 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-current" />{' '}
                  {displayVod.rating > 0 ? displayVod.rating : 8.4} TMDB
                </span>
              </div>
              <h2 id="vod-modal-title" className="text-xl sm:text-2xl font-black text-white">
                {displayVod.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {rewarded && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+120 XP & +25 Luminárias</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenInCinemaRoom}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Assistir em Grupo na Sala</span>
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(displayVod.id)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isFav
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
                title={isFav ? 'Remover dos favoritos' : 'Favoritar'}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          <p className="text-sm text-white/80 leading-relaxed">{displayVod.synopsis}</p>

          {/* TMDB Official Trailer, Cast & Series Episodes */}
          <VodTrailerAndCastSection
            vod={displayVod}
            isEnriching={isEnriching}
            activeEpisodeId={activeEpisode?.id}
            onSelectEpisode={(ep) => {
              setActiveEpisode(ep);
              if (overlayRef.current) {
                overlayRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />

          {/* Reviews Form & Community Ratings */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
              Comentários e Críticas ({reviews.length})
            </h3>
            <form onSubmit={handleSubmitReview} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Compartilhe o que achou deste título..."
                className="flex-1 px-4 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
