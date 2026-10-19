import React, { useState } from 'react';
import { Globe, Loader2, Sparkles } from 'lucide-react';
import {
  extractXtreamCredentials,
  fetchM3UFromUrl,
  tryXtreamConnectFromUrl,
} from '../../services/m3uParserAdvanced';
import { OFFICIAL_ELITEDNS_M3U_URL } from '../../services/playlistStorageDb';
import { useLuminoria } from '../../context/LuminoriaContext';

interface PlaylistUrlImportProps {
  onImport: (name: string, m3uContent: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const PlaylistUrlImport: React.FC<PlaylistUrlImportProps> = ({
  onImport,
  isLoading,
  setIsLoading,
}) => {
  const { importXtreamData } = useLuminoria();
  const [name, setName] = useState('EliteDNS Oficial · Rafalaila');
  const [url, setUrl] = useState(OFFICIAL_ELITEDNS_M3U_URL);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!url.trim()) {
      setError('Informe a URL válida da lista M3U ou M3U8.');
      return;
    }

    setIsLoading(true);
    try {
      const creds = extractXtreamCredentials(url);
      if (creds) {
        const xtreamData = await tryXtreamConnectFromUrl(url);
        if (xtreamData && xtreamData.ok) {
          const res = importXtreamData(
            name.trim() || `Xtream (${creds.username})`,
            creds.host,
            creds.username,
            xtreamData.channels || [],
            xtreamData.movies || [],
            xtreamData.series || [],
            xtreamData.stats
          );
          setSuccessMsg(res.message);
          return;
        }
      }

      const content = await fetchM3UFromUrl(url);
      onImport(name.trim() || 'Lista Remota M3U', content);
      setSuccessMsg('Lista M3U importada, classificada e salva permanentemente!');
    } catch (err: any) {
      setError(err.message || 'Falha ao baixar lista M3U.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/70">
            Nome de Identificação da Lista
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: EliteDNS Oficial · Rafalaila"
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/70">
            URL da Lista (.m3u / .m3u8 / get.php M3U Plus)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://elitedns.xyz/get.php?username=..."
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-white/50">
          Persistência automática ativa (IndexedDB + LocalStorage): sua lista nunca desaparece ao fechar o app.
        </span>

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sincronizando 302.408 Itens + TMDB...</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span>Importar & Sincronizar Lista Completa</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
