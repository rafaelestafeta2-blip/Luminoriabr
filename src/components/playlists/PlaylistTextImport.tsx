import React, { useState } from 'react';
import { FileText, PlusCircle, Sparkles } from 'lucide-react';

const RICH_SAMPLE_M3U = `#EXTM3U x-tvg-url="https://epg.luminoria.pro/custom.xml"

# === CANAIS AO VIVO ===
#EXTINF:-1 tvg-id="globo.4k" tvg-logo="https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200" group-title="Canais Abertos",Rede Globo 4K UHD
https://stream.luminoria.pro/live/globo4k/index.m3u8
#EXTINF:-1 tvg-id="espn.hd" tvg-logo="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200" group-title="Esportes",ESPN Brasil 60fps
https://stream.luminoria.pro/live/espnbrasil/index.m3u8

# === FILMES VOD ===
#EXTINF:-1 tvg-id="deadpool.3" tvg-logo="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" group-title="Filmes Ação & Adrenalina",Deadpool & Wolverine (2024)
https://vod.luminoria.pro/movies/deadpool-wolverine.mp4
#EXTINF:-1 tvg-id="dune.2" tvg-logo="https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg" group-title="Filmes Aventura & Ficção",Duna: Parte Dois (2024)
https://vod.luminoria.pro/movies/dune-2.mp4

# === SÉRIES ===
#EXTINF:-1 tvg-id="theboys.s4e1" tvg-logo="https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg" group-title="Séries Populares",The Boys S04E01 (2024)
https://vod.luminoria.pro/series/theboys_s4e1.mp4
#EXTINF:-1 tvg-id="reacher.s2e1" tvg-logo="https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg" group-title="Séries Ação",Reacher S02E01 (2024)
https://vod.luminoria.pro/series/reacher_s2e1.mp4`;

interface PlaylistTextImportProps {
  onImport: (name: string, content: string) => void;
  isLoading: boolean;
}

export const PlaylistTextImport: React.FC<PlaylistTextImportProps> = ({
  onImport,
  isLoading,
}) => {
  const [name, setName] = useState('Minha Lista M3U Unificada');
  const [content, setContent] = useState(RICH_SAMPLE_M3U);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onImport(name.trim() || 'Lista M3U', content);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-white/80 block mb-1">
          Nome da Lista
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Lista M3U Master"
          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-white/80">
            Conteúdo da Lista M3U
          </label>
          <button
            type="button"
            onClick={() => setContent(RICH_SAMPLE_M3U)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            Carregar Exemplo M3U Triplo (TV + Filmes + Séries)
          </button>
        </div>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="#EXTM3U..."
          className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white/90 focus:outline-none focus:border-cyan-400 resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
      >
        <PlusCircle className="w-4 h-4 text-black" />
        <span>Processar e Distribuir Lista no App</span>
      </button>
    </form>
  );
};
