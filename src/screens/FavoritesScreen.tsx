import React, { useState } from 'react';
import { Clapperboard, Heart } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { PosterArtwork } from '../components/ui/PosterArtwork';

export const FavoritesScreen: React.FC = () => {
  const { vodItems, favoriteIds, toggleFavorite, setActiveModalVod } = useLuminoria();
  const [filterMode, setFilterMode] = useState<'all' | 'saved'>('all');

  const displayList =
    filterMode === 'saved'
      ? vodItems.filter((v) => favoriteIds.includes(v.id))
      : vodItems;

  return (
    <div className="space-y-6 pb-32">
      {/* Header matching Screenshot 3 */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Favoritos
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-[#0EA5E9] text-black'
                : 'bg-[#13151F] text-[#A0A0B0] hover:text-white'
            }`}
          >
            Catálogo ({vodItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('saved')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterMode === 'saved'
                ? 'bg-[#0EA5E9] text-black'
                : 'bg-[#13151F] text-[#A0A0B0] hover:text-white'
            }`}
          >
            Meus Favoritos ({favoriteIds.length})
          </button>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-extrabold font-display text-white">
        Filmes e Séries
      </h2>

      {displayList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#11131C] border border-white/10 text-center space-y-3">
          <Clapperboard className="w-10 h-10 text-[#A0A0B0] mx-auto" />
          <p className="text-sm text-[#A0A0B0]">
            Nenhum título marcado nos seus favoritos ainda. Toque no coração de qualquer filme ou série!
          </p>
        </div>
      ) : (
        /* 3-Column Grid on Mobile, 6 on Desktop (Exact Match to Screenshot 3) */
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayList.map((item) => {
            const isFav = favoriteIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => setActiveModalVod(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setActiveModalVod(item);
                }}
                className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#151722] border border-white/10 cursor-pointer hover:border-[#0EA5E9] transition-all"
              >
                <PosterArtwork
                  variant={item.artworkKey}
                  title={item.title}
                  hideBottomLabel
                  className="w-full h-full"
                />

                {/* Dark gradient scrim for bottom title legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                {/* Top-Right Dark Circle with Red Heart (Exact Match to Screenshot 3) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  aria-label={
                    isFav
                      ? `Remover ${item.title} dos favoritos`
                      : `Favoritar ${item.title}`
                  }
                  className="absolute top-2.5 right-2.5 z-20 w-10 h-10 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center transition-transform active:scale-90"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFav ? 'fill-current text-red-500' : 'fill-current text-red-500/80'
                    }`}
                  />
                </button>

                {/* Bottom 2-line Title */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                  <p className="text-xs sm:text-sm font-medium text-white line-clamp-2 leading-snug drop-shadow">
                    {item.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
