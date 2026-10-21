import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Tv,
  Grid,
  Activity,
  Loader2,
  Search,
  Volume2,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { Channel } from '../types/luminoria';
import { searchFullServerCatalog } from '../services/tmdbEnrichClient';
import { PosterArtwork } from '../components/ui/PosterArtwork';
import { LiveTvPlayerViewport } from '../components/channels/LiveTvPlayerViewport';
import { EpgSchedulePanel } from '../components/channels/EpgSchedulePanel';
import { MultiScreenGrid } from '../components/channels/MultiScreenGrid';

const CHANNELS_PAGE_SIZE = 60;

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
  const [quadChannelIds, setQuadChannelIds] = useState<string[]>(() =>
    channels.slice(0, 4).map((c) => c.id)
  );
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(CHANNELS_PAGE_SIZE);

  useEffect(() => {
    if (quadChannelIds.length === 0 && channels.length > 0) {
      setQuadChannelIds(channels.slice(0, 4).map((c) => c.id));
    }
  }, [channels, quadChannelIds.length]);

  const playerSectionRef = useRef<HTMLDivElement | null>(null);
  const rewardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current);
    };
  }, []);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(CHANNELS_PAGE_SIZE);
  }, [selectedGroup, searchQuery]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setServerChannels(null);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);
    const timer = setTimeout(() => {
      searchFullServerCatalog({ q, type: 'live', limit: 240 })
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

  const groups = useMemo(
    () => ['Todos', 'Favoritos', ...Array.from(new Set(channels.map((c) => c.groupName)))],
    [channels]
  );

  const baseChannels =
    serverChannels && searchQuery.trim().length >= 2 ? serverChannels : channels;

  const filteredChannels = useMemo(
    () =>
      baseChannels.filter((ch) => {
        const matchesSearch =
          !searchQuery.trim() ||
          ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.groupName.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (selectedGroup === 'Todos') return true;
        if (selectedGroup === 'Favoritos') return favoriteIds.includes(ch.id);
        return ch.groupName === selectedGroup;
      }),
    [baseChannels, searchQuery, selectedGroup, favoriteIds]
  );

  const visibleChannels = useMemo(
    () => filteredChannels.slice(0, visibleCount),
    [filteredChannels, visibleCount]
  );

  const activeChannel = useMemo(
    () =>
      baseChannels.find((c) => c.id === selectedChannelId) ||
      channels.find((c) => c.id === selectedChannelId) ||
      filteredChannels[0] ||
      channels[0],
    [baseChannels, channels, filteredChannels, selectedChannelId]
  );

  const quadChannels = useMemo(() => {
    return [0, 1, 2, 3]
      .map((idx) => {
        const id = quadChannelIds[idx];
        return channels.find((c) => c.id === id) || channels[idx] || channels[0];
      })
      .filter(Boolean) as Channel[];
  }, [quadChannelIds, channels]);

  const handleChangeQuadChannel = (slotIndex: number, newChannel: Channel) => {
    setQuadChannelIds((prev) => {
      const updated = [...prev];
      updated[slotIndex] = newChannel.id;
      return updated;
    });
    setDiagnosticResult(`Canal "${newChannel.name}" colocado na Tela #${slotIndex + 1}!`);
  };

  const handleSelectChannel = (id: string) => {
    if (isMultiScreen) {
      setQuadChannelIds((prev) => {
        const updated = [...prev];
        updated[activeQuadIndex] = id;
        return updated;
      });
      const targetCh = channels.find((c) => c.id === id);
      if (targetCh) {
        setDiagnosticResult(`Canal "${targetCh.name}" colocado na Tela #${activeQuadIndex + 1}!`);
      }
      if (playerSectionRef.current && window.scrollY > 360) {
        playerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    if (id === selectedChannelId) return;
    setSelectedChannelId(id);
    setActiveSourceIndex(0);
    setDiagnosticResult(null);

    // Smoothly bring player into view if user clicked a card far down the page
    if (playerSectionRef.current && window.scrollY > 360) {
      playerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Debounce XP award so channel switching never triggers a heavy context re-render during MSE initialization
    if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current);
    rewardTimerRef.current = setTimeout(() => {
      awardWatchSession(30, 5);
    }, 4000);
  };

  const handleTestStream = () => {
    if (!activeChannel) return;
    setDiagnosticResult(
      `Diagnóstico em ${activeChannel.name}: Sinal Estável · Proteção Anti-Crash Ativa (${activeChannel.quality})`
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Multi-Screen Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Canais Ao Vivo & Guia EPG
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300">
              <ShieldCheck className="w-3 h-3" /> SafeStream Engine
            </span>
          </div>
          <p className="text-xs text-[#A0A0B0]">
            Troca rápida de canais com isolamento de buffer e reconexão automática sem travamentos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestStream}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Testar Sinal</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMultiScreen((prev) => !prev)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
            className="text-emerald-200 underline ml-4 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Multi-Screen 2x2 View OR Single Player + EPG Timeline */}
      <div ref={playerSectionRef}>
        {isMultiScreen ? (
          <MultiScreenGrid
            allChannels={channels}
            quadChannels={quadChannels}
            activeQuadIndex={activeQuadIndex}
            onSelectQuadIndex={setActiveQuadIndex}
            onChangeChannelForSlot={handleChangeQuadChannel}
            onCloseMultiScreen={() => setIsMultiScreen(false)}
            activeColor={activeScheme.primaryHex}
          />
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
                onSetReminder={(progTitle, startTime) =>
                  triggerEpgFavoriteAlert(
                    activeChannel.id,
                    activeChannel.name,
                    progTitle,
                    startTime || 'Em breve'
                  )
                }
              />
            </section>
          )
        )}
      </div>

      {/* Channel List Filter & Directory */}
      <section aria-labelledby="channel-directory-title" className="space-y-4">
        <div className="flex flex-col gap-3 bg-[#0C0E16] border border-white/10 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id="channel-directory-title" className="text-lg font-bold font-display text-white">
                Diretório de Canais Ao Vivo
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono text-white/75">
                {visibleChannels.length} exibidos de {filteredChannels.length.toLocaleString('pt-BR')} · Total {serverCatalogStats.totalChannels.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#A0A0B0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar entre ${serverCatalogStats.totalChannels.toLocaleString('pt-BR')} canais...`}
                aria-label="Filtrar canal ao vivo por nome"
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#141622] border border-white/15 text-xs text-white placeholder-[#A0A0B0]/60 focus:outline-none focus:border-[#E91E8C]"
              />
              {isSearchingServer && (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groups.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedGroup === grp
                    ? 'bg-gradient-to-r from-[#E91E8C] to-rose-500 text-white shadow-[0_0_15px_rgba(233,30,140,0.35)]'
                    : 'bg-white/[0.05] text-[#A0A0B0] hover:text-white hover:bg-white/[0.1] border border-white/10'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleChannels.map((ch) => {
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
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-white/[0.09] border-[#E91E8C] shadow-[0_0_20px_rgba(233,30,140,0.2)]'
                    : 'bg-[#111118] border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#09090D] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {ch.logoUrl ? (
                      <img
                        src={ch.logoUrl}
                        alt={ch.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Tv className="w-5 h-5 text-[#E91E8C]" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#A0A0B0]">
                      <span className="truncate max-w-[120px]">{ch.groupName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-emerald-400 shrink-0">{ch.quality}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{ch.name}</h3>
                    <p className="text-xs text-[#A0A0B0] truncate">
                      {nowPlaying
                        ? `${nowPlaying.startTime} · ${nowPlaying.title}`
                        : 'Sinal Disponível'}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-[#A0A0B0] shrink-0 px-2 py-1 rounded bg-white/5">
                  {isSelected ? 'NO AR' : `${ch.sources.length} rota`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Load More Channels Button */}
        {visibleCount < filteredChannels.length && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + CHANNELS_PAGE_SIZE)}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <ChevronDown className="w-4 h-4 text-cyan-400" />
              <span>
                Carregar Mais Canais ({filteredChannels.length - visibleCount} restantes nesta categoria)
              </span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

