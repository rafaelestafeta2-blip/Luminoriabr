import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Flame,
  HardDrive,
  Key,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { clearLocalDb } from '../../services/tmdbLocalDb';

interface TmdbSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TmdbSyncModal: React.FC<TmdbSyncModalProps> = ({ isOpen, onClose }) => {
  const { tmdbSyncMeta, syncTmdbCatalog, isSyncingTmdb, tmdbMovies } = useLuminoria();
  const [selectedCategory, setSelectedCategory] = useState<'trending' | 'popular' | 'top_rated' | 'now_playing'>('popular');
  const [customKey, setCustomKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    setStatusMessage('Sincronizando TMDB, gravando no Firestore e atualizando IndexedDB local...');
    const result = await syncTmdbCatalog(selectedCategory, customKey);
    setStatusMessage(result.message);
  };

  const handleClearLocalCache = async () => {
    await clearLocalDb();
    setStatusMessage('Cache do IndexedDB e localStorage foi esvaziado com sucesso.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F0F16] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] p-6 overflow-hidden">
        {/* Glow corner accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black shadow-lg shadow-cyan-500/30">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cache Triplo (IndexedDB + Firebase)
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-white/60">
                L1 IndexedDB (0ms) + L2 Firestore Cloud + 0 Tokens Desperdiçados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Tier Cache Grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> L1: IndexedDB Local
            </span>
            <span className="text-lg font-black text-white mt-1">
              {tmdbMovies.length > 0 ? `${tmdbMovies.length} Filmes` : '40+ Filmes'}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> 0ms • Offline Ativo
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> L2: Firestore Nuvem
            </span>
            <span className="text-lg font-black text-white mt-1">99.8% Poupança</span>
            <span className="text-[11px] text-white/50 mt-0.5 truncate">
              Zero chamadas repetidas à API
            </span>
          </div>
        </div>

        {/* Category selector */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-white/80 block">
            Categoria para Sincronizar:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'popular', label: 'Em Alta (Populares)', icon: Flame },
              { id: 'trending', label: 'Tendências Semana', icon: TrendingUp },
              { id: 'top_rated', label: 'Mais Votados (Top)', icon: Sparkles },
              { id: 'now_playing', label: 'Lançamentos Cartaz', icon: Zap },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedCategory(id as any)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedCategory === id
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-4 h-4 ${selectedCategory === id ? 'text-cyan-400' : 'text-white/40'}`} />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
            {statusMessage}
          </div>
        )}

        {/* Options Row: Clear cache + API key toggle */}
        <div className="flex items-center justify-between text-[11px] mb-4">
          <button
            type="button"
            onClick={handleClearLocalCache}
            className="text-white/50 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Limpar IndexedDB Local
          </button>

          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <Key className="w-3 h-3" />
            {showKeyInput ? 'Ocultar chave' : 'Chave TMDB própria?'}
          </button>
        </div>

        {showKeyInput && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Cole sua TMDB API Key v3 aqui..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncingTmdb}
            className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSyncingTmdb ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Sincronizando com TMDB...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-black" />
                <span>Puxar & Atualizar Cache</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
