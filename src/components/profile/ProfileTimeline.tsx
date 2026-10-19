import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { INITIAL_TIMELINE_ENTRIES } from '../../data/seedData';
import { PosterArtwork } from '../ui/PosterArtwork';

export const ProfileTimeline: React.FC = () => {
  const { vodItems, setActiveModalVod, awardWatchSession } = useLuminoria();
  const [timelineItems, setTimelineItems] = useState(INITIAL_TIMELINE_ENTRIES);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshTimeline = () => {
    setIsRefreshing(true);
    awardWatchSession(25, 5);
    setTimeout(() => {
      setTimelineItems((prev) => [...prev]);
      setIsRefreshing(false);
    }, 350);
  };

  const handleOpenTimelineVod = (vodId: string) => {
    const found = vodItems.find((v) => v.id === vodId) || vodItems[0];
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
          <span className="w-1.5 h-6 rounded-full bg-[#00B8D4]" />
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
          className="p-2 rounded-full text-[#A0A0B0] hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#00E5FF]' : ''}`} />
        </button>
      </div>

      {/* Vertical Watch History Timeline List */}
      <div className="space-y-6">
        {timelineItems.map((item, idx) => {
          const isLast = idx === timelineItems.length - 1;
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
              {/* Left Column: Cyan Node + Vertical Line */}
              <div className="flex flex-col items-center pt-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full bg-[#0EA5E9] shrink-0"
                  style={{ boxShadow: '0 0 10px rgba(14, 165, 233, 0.8)' }}
                />
                {!isLast && <span className="w-0.5 flex-1 bg-white/15 my-2" />}
              </div>

              {/* Middle Column: Vertical Movie Poster Thumbnail */}
              <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border border-white/15 shrink-0 group-hover:border-[#0EA5E9] transition-colors">
                <PosterArtwork
                  variant={item.artworkKey}
                  title={item.title.split('(')[0].trim()}
                  subtitle={String(item.year)}
                  className="w-full h-full"
                />
              </div>

              {/* Right Column: VOCÊ ASSISTIU + Title + Relative Date */}
              <div className="flex flex-col justify-center space-y-1 min-w-0">
                <span className="text-xs font-mono tracking-wider text-[#A0A0B0] uppercase">
                  VOCÊ ASSISTIU
                </span>
                <h3 className="text-base sm:text-lg font-bold font-display text-white group-hover:text-[#00E5FF] transition-colors leading-snug">
                  {item.title}
                </h3>
                <span className="text-xs sm:text-sm text-[#A0A0B0]">{item.timeAgo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
