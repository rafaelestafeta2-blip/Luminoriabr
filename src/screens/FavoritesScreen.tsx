import React, { useMemo, useState } from 'react';
import { Heart, Tv } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { PosterArtwork } from '../components/ui/PosterArtwork';

export const FavoritesScreen: React.FC = () => {
  const {
    vodItems,
    channels,
    favoriteIds,
    toggleFavorite,
    setActiveModalVod,
    activeScheme,
    setActiveNav,
  } = useLuminoria();

  const [typeFilter, setTypeFilter] = useState<'all' | 'movies' | 'series' | 'channels'>('all');

  const favSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const savedVods = useMemo(
    () => vodItems.filter((v) => favSet.has(v.id)),
    [vodItems, favSet]
  );

  const savedChannels = useMemo(
    () => channels.filter((c) => favSet.has(c.id)),
    [channels, favSet]
  );

  const filteredVods = useMemo(() => {
    if (typeFilter === 'channels') return [];
    if (typeFilter === 'movies') return savedVods.filter((v) => v.mediaType !== 'series');
    if (typeFilter === 'series') return savedVods.filter((v) => v.mediaType === 'series');
    return savedVods;
  }, [savedVods, typeFilter]);

  const showChannels = typeFilter === 'all' || typeFilter === 'channels';
  const totalSavedCount = savedVods.length + savedChannels.length;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Meus Favoritos
          </h1>
          <p className="text-xs text-white/50 tabular-nums">
            Exclusivamente os títulos que você marcou com coração ({totalSavedCount}{' '}
            {totalSavedCount === 1 ? 'item salvo' : 'itens salvos'})
          </p>
        </div>

        {totalSavedCount > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#13151F] border border-white/10 self-start sm:self-auto">
            {[
              { id: 'all', label: `Todos (${totalSavedCount})` },
              { id: 'movies', label: 'Filmes' },
              { id: 'series', label: 'Séries' },
              { id: 'channels', label: 'Canais' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as any)}
                style={
                  typeFilter === tab.id
                    ? { backgroundColor: activeScheme.primaryHex, color: '#FFFFFF' }
                    : undefined
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === tab.id ? 'font-bold' : 'text-[#A0A0B0] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {totalSavedCount === 0 ? (
        <div className="p-12 rounded-3xl bg-[#11131C] border border-white/10 text-center space-y-4">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-white/5 border border-white/10"
            style={{ color: activeScheme.primaryHex }}
          >
            <Heart className="w-7 h-7 fill-current opacity-70" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Você ainda não adicionou favoritos</h3>
            <p className="text-xs text-[#A0A0B0] max-w-sm mx-auto">
              Esta página exibe apenas os filmes, séries e canais que você marcar como favorito no catálogo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
            style={{
              backgroundColor: activeScheme.primaryHex,
              boxShadow: `0 6px 18px ${activeScheme.primaryHex}44`,
            }}
          >
            Ir para o Catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredVods.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredVods.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveModalVod(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveModalVod(item);
                  }}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#151722] border border-white/10 cursor-pointer hover:border-white/40 transition-all hover:scale-[1.02]"
                >
                  <PosterArtwork
                    variant={item.artworkKey}
                    title={item.title}
                    imageUrl={item.posterUrl || item.backdropUrl}
                    hideBottomLabel
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    aria-label={`Remover ${item.title} dos favoritos`}
                    className="absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 hover:scale-105 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-current text-red-500" />
                  </button>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                    <p className="text-xs font-semibold text-white line-clamp-2 leading-snug drop-shadow">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showChannels && savedChannels.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>Canais Ao Vivo Favoritados ({savedChannels.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {savedChannels.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => setActiveNav('channels')}
                    role="button"
                    tabIndex={0}
                    className="p-3.5 rounded-2xl bg-[#131520] border border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:border-white/30"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{ch.name}</p>
                      <p className="text-[11px] text-[#A0A0B0] truncate">
                        {ch.groupName} · {ch.quality}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(ch.id);
                      }}
                      className="p-2 rounded-full bg-black/50 text-red-500 hover:bg-black cursor-pointer shrink-0"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
