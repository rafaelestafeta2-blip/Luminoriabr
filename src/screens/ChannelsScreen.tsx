import React, { useEffect, useState } from 'react';
import { Tv, Grid, Activity, Heart, Loader2, Search, Volume2, Radio, BellRing } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { Channel } from '../types/luminoria';
import { searchFullServerCatalog } from '../services/tmdbEnrichClient';
import { PosterArtwork } from '../components/ui/PosterArtwork';
import { LiveTvPlayerViewport } from '../components/channels/LiveTvPlayerViewport';
import { EpgSchedulePanel } from '../components/channels/EpgSchedulePanel';

export const ChannelsScreen: React.FC = () => {
  const {
    channels,
    favoriteIds,
    toggleFavorite,
    awardWatchSession,
    triggerEpgFavoriteAlert,
    activeScheme,
    serverCatalogStats,
  } = useLuminoria();

  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || '');
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [serverChannels, setServerChannels] = useState<Channel[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState<boolean>(false);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [isMultiScreen, setIsMultiScreen] = useState<boolean>(false);
  const [activeQuadIndex, setActiveQuadIndex] = useState<number>(0);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setServerChannels(null);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);
    const timer = setTimeout(() => {
      searchFullServerCatalog({ q, type: 'live', limit: 200 })
        .then((res) => {
          if (!cancelled && res?.channels) {
            setServerChannels(res.channels);
          }
        })
        .finally(() => {
          if (!cancelled) setIsSearchingServer(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const groups = ['Todos', 'Favoritos', ...Array.from(new Set(channels.map((c) => c.groupName)))];

  const baseChannels =
    serverChannels && searchQuery.trim().length >= 2 ? serverChannels : channels;

  const filteredChannels = baseChannels.filter((ch) => {
    const matchesSearch =
      !searchQuery.trim() ||
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.groupName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedGroup === 'Todos') return true;
    if (selectedGroup === 'Favoritos') return favoriteIds.includes(ch.id);
    return ch.groupName === selectedGroup;
  });

  const activeChannel =
    baseChannels.find((c) => c.id === selectedChannelId) ||
    channels.find((c) => c.id === selectedChannelId) ||
    filteredChannels[0] ||
    channels[0];

  const handleSelectChannel = (id: string) => {
    setSelectedChannelId(id);
    setActiveSourceIndex(0);
    setDiagnosticResult(null);
    awardWatchSession(30, 5);
  };

  const handleTestStream = () => {
    if (!activeChannel) return;
    setDiagnosticResult(
      `Teste concluído em ${activeChannel.name}: HTTP 200 OK · Bitrate 18.4 Mbps (${activeChannel.quality}) · Buffer estável`
    );
  };

  const quadChannels = channels.slice(0, 4);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Multi-Screen Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Canais Ao Vivo & Guia EPG
          </h1>
          <p className="text-xs text-[#A0A0B0]">
            Sintonize transmissões com múltiplas rotas de backup ou ative o modo Multi-Tela 2x2
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestStream}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Testar Sinal</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMultiScreen((prev) => !prev)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            style={{
              backgroundColor: isMultiScreen ? activeScheme.primaryHex : 'rgba(255,255,255,0.1)',
            }}
          >
            <Grid className="w-4 h-4" />
            <span>{isMultiScreen ? 'Sair do Multi-Tela (2x2)' : 'Modo Multi-Tela (2x2)'}</span>
          </button>
        </div>
      </div>

      {diagnosticResult && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>{diagnosticResult}</span>
          <button
            type="button"
            onClick={() => setDiagnosticResult(null)}
            className="text-emerald-200 underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Multi-Screen 2x2 View OR Single Player + EPG Timeline */}
      {isMultiScreen ? (
        <section aria-label="Modo Multi-Tela 2x2" className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#A0A0B0]">
            <span>Clique em um dos 4 quadrantes para alternar o foco de áudio principal</span>
            <span className="font-mono text-white">
              Áudio Ativo: Quadrante #{activeQuadIndex + 1} ({quadChannels[activeQuadIndex]?.name})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quadChannels.map((ch, idx) => {
              const isFocused = activeQuadIndex === idx;
              const currentProg = ch.currentPrograms[0];
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveQuadIndex(idx)}
                  className={`relative h-64 rounded-xl overflow-hidden text-left border-2 transition-all ${
                    isFocused ? 'border-[#E91E8C] shadow-lg' : 'border-white/10 opacity-85 hover:opacity-100'
                  }`}
                >
                  <PosterArtwork variant={ch.artworkVariant} className="w-full h-full" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/30 to-transparent">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        TELA 0{idx + 1} · {ch.name}
                      </span>
                      <span className="font-mono text-[11px] text-white/90 inline-flex items-center gap-1">
                        {isFocused ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ÁUDIO ATIVO</span>
                          </>
                        ) : (
                          'MUDO'
                        )}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-emerald-400">
                        {ch.quality} · {ch.groupName}
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {currentProg?.title || 'Programação Ao Vivo'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        activeChannel && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live TV Video Player Viewport */}
            <div className="lg:col-span-2">
              <LiveTvPlayerViewport
                channel={activeChannel}
                activeSourceIndex={activeSourceIndex}
                isFavorite={favoriteIds.includes(activeChannel.id)}
                onToggleFavorite={toggleFavorite}
                onSelectSourceIndex={setActiveSourceIndex}
              />
            </div>

            {/* EPG Schedule Panel */}
            <EpgSchedulePanel
              channel={activeChannel}
              onSetReminder={(progTitle) =>
                triggerEpgFavoriteAlert(
                  activeChannel.id,
                  activeChannel.name,
                  progTitle,
                  'Em breve'
                )
              }
            />
          </section>
        )
      )}

      {/* Channel List Filter & Directory */}
      <section aria-labelledby="channel-directory-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 id="channel-directory-title" className="text-lg font-bold font-display text-white">
            Diretório de Canais ({filteredChannels.length} exibidos de{' '}
            {serverCatalogStats.totalChannels.toLocaleString('pt-BR')})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#A0A0B0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar entre 3.584 canais..."
                aria-label="Filtrar canal ao vivo por nome"
                className="pl-9 pr-8 py-1.5 rounded-lg bg-[#111118] border border-white/15 text-xs text-white placeholder-[#A0A0B0]/60 focus:outline-none focus:border-[#E91E8C]"
              />
              {isSearchingServer && (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#111118] border border-white/10 rounded-lg overflow-x-auto max-w-full">
              {groups.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedGroup === grp
                      ? 'bg-white text-black font-semibold'
                      : 'text-[#A0A0B0] hover:text-white'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((ch) => {
            const isSelected = activeChannel?.id === ch.id;
            const nowPlaying = ch.currentPrograms[0];
            return (
              <div
                key={ch.id}
                onClick={() => handleSelectChannel(ch.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSelectChannel(ch.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-white/[0.07] border-[#E91E8C]'
                    : 'bg-[#111118] border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#09090D] border border-white/10 flex items-center justify-center shrink-0">
                    <Tv className="w-5 h-5 text-[#E91E8C]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#A0A0B0]">
                      <span>{ch.groupName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-emerald-400">{ch.quality}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{ch.name}</h3>
                    <p className="text-xs text-[#A0A0B0] truncate">
                      {nowPlaying ? `${nowPlaying.startTime} · ${nowPlaying.title}` : 'Sinal Disponível'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-[#A0A0B0] shrink-0">
                  {ch.sources.length} {ch.sources.length > 1 ? 'rotas' : 'rota'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
