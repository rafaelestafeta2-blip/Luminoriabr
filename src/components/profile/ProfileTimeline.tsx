import React, { useState } from 'react';
import { Film, History, RotateCw } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { PosterArtwork } from '../ui/PosterArtwork';

export const ProfileTimeline: React.FC = () => {
  const { vodItems, setActiveModalVod, timeline, refreshTimeline, activeScheme, setActiveNav } =
    useLuminoria();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshTimeline = () => {
    setIsRefreshing(true);
    refreshTimeline();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  const handleOpenTimelineVod = (vodId: string) => {
    const found = vodItems.find((v) => v.id === vodId);
    if (found) setActiveModalVod(found);
  };

  return (
    <section
      aria-labelledby="timeline-heading"
      className="p-6 sm:p-8 rounded-3xl bg-[#07070B] border border-white/10 space-y-6"
    >
      {/* Header matching Screenshot 1: | LINHA DO TEMPO + Refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-1.5 h-6 rounded-full transition-colors"
            style={{ backgroundColor: activeScheme.primaryHex }}
          />
          <h2
            id="timeline-heading"
            className="text-lg sm:text-xl font-extrabold font-display tracking-wide text-white uppercase"
          >
            LINHA DO TEMPO
          </h2>
        </div>

        <button
          type="button"
          onClick={handleRefreshTimeline}
          aria-label="Atualizar Linha do Tempo"
          className="p-2 rounded-full text-[#A0A0B0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <RotateCw
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
            style={isRefreshing ? { color: activeScheme.primaryHex } : undefined}
          />
        </button>
      </div>

      {/* Empty State vs Vertical Watch History Timeline */}
      {timeline.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0B0C14] border border-white/10 text-center space-y-3">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-white/5 border border-white/10"
            style={{ color: activeScheme.primaryHex }}
          >
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Sua Linha do Tempo está limpa</h3>
          <p className="text-xs text-[#A0A0B0] max-w-sm mx-auto">
            Apenas filmes e episódios que você assistir por pelo menos 20% da duração total aparecerão registrados aqui.
          </p>
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className="px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            style={{
              backgroundColor: activeScheme.primaryHex,
              boxShadow: `0 4px 14px ${activeScheme.primaryHex}44`,
            }}
          >
            Explorar Filmes & Séries
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {timeline.map((item, idx) => {
            const isLast = idx === timeline.length - 1;
            return (
              <div
                key={item.id}
                onClick={() => handleOpenTimelineVod(item.vodId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleOpenTimelineVod(item.vodId);
                }}
                className="group flex items-stretch gap-4 cursor-pointer"
              >
                {/* Left Column: Colored Node + Vertical Line */}
                <div className="flex flex-col items-center pt-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: activeScheme.primaryHex,
                      boxShadow: `0 0 10px ${activeScheme.primaryHex}`,
                    }}
                  />
                  {!isLast && <span className="w-0.5 flex-1 bg-white/15 my-2" />}
                </div>

                {/* Middle Column: Vertical Movie Poster Thumbnail */}
                <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border border-white/15 shrink-0 group-hover:border-white/40 transition-colors">
                  <PosterArtwork
                    variant={item.artworkKey}
                    title={item.title.split('(')[0].trim()}
                    subtitle={String(item.year)}
                    className="w-full h-full"
                  />
                </div>

                {/* Right Column: VOCÊ ASSISTIU + Title + Relative Date */}
                <div className="flex flex-col justify-center space-y-1 min-w-0">
                  <span
                    className="text-xs font-mono tracking-wider uppercase font-semibold tabular-nums"
                    style={{ color: activeScheme.primaryHex }}
                  >
                    VOCÊ ASSISTIU · {item.watchPercent || 20}% DO FILME
                  </span>
                  <h3 className="text-base sm:text-lg font-bold font-display text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <span className="text-xs sm:text-sm text-[#A0A0B0]">{item.timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
