import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Globe,
  HardDrive,
  ListPlus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { generateM3U } from '../utils/luminoriaLogic';
import { PlaylistStatsCard } from '../components/playlists/PlaylistStatsCard';
import { PlaylistUrlImport } from '../components/playlists/PlaylistUrlImport';
import { PlaylistFileUpload } from '../components/playlists/PlaylistFileUpload';
import { PlaylistTextImport } from '../components/playlists/PlaylistTextImport';

export const PlaylistsScreen: React.FC = () => {
  const {
    playlists,
    channels,
    importM3UPlaylist,
    removePlaylist,
    setActiveNav,
    serverCatalogStats,
    syncFullEliteDnsPlaylist,
  } = useLuminoria();

  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'text'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleImport = (name: string, content: string) => {
    const res = importM3UPlaylist(name, content);
    setStatusMessage(res.message);
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      const res = await syncFullEliteDnsPlaylist();
      setStatusMessage(res.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportM3U = () => {
    const output = generateM3U(
      channels.slice(0, 500).map((c) => ({
        name: c.name,
        epgId: c.epgId,
        groupName: c.groupName,
        url: c.url,
        sources: c.sources,
      })),
      'Luminoria Pro Export'
    );
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luminoria_backup_${Date.now()}.m3u`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Central de Listas M3U & Sinais
          </h1>
          <p className="text-xs text-white/60">
            Lista Oficial EliteDNS (Rafalaila) salva permanentemente com 302.408 transmissões e sincronização TMDB
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isLoading || serverCatalogStats.isSyncingCatalog}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-xs font-extrabold text-black flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isLoading || serverCatalogStats.isSyncingCatalog ? 'animate-spin' : ''
              }`}
            />
            <span> Atualizar Lista + TMDB</span>
          </button>

          <button
            type="button"
            onClick={handleExportM3U}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border border-white/10"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Baixar Backup M3U</span>
          </button>
        </div>
      </div>

      {/* Live Stats Across All 3 App Pillars */}
      <PlaylistStatsCard
        playlists={playlists}
        totalStreams={serverCatalogStats.totalStreams}
        totalChannels={serverCatalogStats.totalChannels}
        totalMovies={serverCatalogStats.totalMovies}
        totalSeries={serverCatalogStats.totalSeries}
      />

      {/* Status banner with quick route navigation */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveNav('channels')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold cursor-pointer"
            >
              Ver Canais
            </button>
            <button
              onClick={() => setActiveNav('home')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold cursor-pointer"
            >
              Ver Filmes
            </button>
            <button
              onClick={() => setActiveNav('series')}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold cursor-pointer"
            >
              Ver Séries
            </button>
          </div>
        </div>
      )}

      {/* Import Method Tabs */}
      <section className="p-6 rounded-3xl bg-[#0E0F17] border border-white/10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-cyan-400" />
            Sincronizar ou Adicionar Lista M3U Plus
          </h2>
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'url' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Link URL
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'file' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Arquivo .m3u
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'text' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Colar Texto
            </button>
          </div>
        </div>

        {activeTab === 'url' && (
          <PlaylistUrlImport
            onImport={handleImport}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
        {activeTab === 'file' && (
          <PlaylistFileUpload
            onImport={handleImport}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
        {activeTab === 'text' && (
          <PlaylistTextImport onImport={handleImport} isLoading={isLoading} />
        )}
      </section>

      {/* Active Playlists */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          Listas M3U Salvas Permanentemente ({playlists.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="p-5 rounded-2xl bg-[#111118] border border-cyan-500/30 flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
                  <span className="font-mono uppercase text-cyan-400 font-bold">
                    {pl.type === 'xtream' ? 'M3U PLUS / XTREAM' : 'M3U'}
                  </span>
                  <span>·</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">
                    {(pl.totalServerItems || pl.channelCount).toLocaleString('pt-BR')} itens ativos
                  </span>
                  {pl.moviesCount && (
                    <>
                      <span>·</span>
                      <span className="tabular-nums">
                        {pl.liveCount?.toLocaleString('pt-BR')} TV /{' '}
                        {pl.moviesCount.toLocaleString('pt-BR')} Filmes /{' '}
                        {pl.seriesCount?.toLocaleString('pt-BR')} Séries
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white truncate">{pl.name}</h3>
                <p className="text-xs text-white/50 truncate font-mono">
                  {pl.m3uUrl || pl.urlOrHost}
                </p>
                <p className="text-[11px] text-emerald-400/90">{pl.updatedAt}</p>
              </div>
              {playlists.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlaylist(pl.id)}
                  className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Remover fonte"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
