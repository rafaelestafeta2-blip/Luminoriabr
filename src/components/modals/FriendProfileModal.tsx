import React from 'react';
import {
  Award,
  Ban,
  MessageSquare,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { FriendContact } from '../../types/luminoria';
import { getRankForXp, levelFromXp } from '../../utils/luminoriaLogic';

interface FriendProfileModalProps {
  friend: FriendContact;
  onClose: () => void;
  onOpenChat: () => void;
  onToggleFavorite: () => void;
  onToggleBlock: () => void;
  onRemoveFriend: () => void;
}

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
  friend,
  onClose,
  onOpenChat,
  onToggleFavorite,
  onToggleBlock,
  onRemoveFriend,
}) => {
  const rank = getRankForXp(friend.xp);
  const level = levelFromXp(friend.xp);
  const isOnline = friend.status === 'online' || friend.status === 'watching';

  return (
    <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto space-y-5">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            PERFIL DO AMIGO
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
        </div>

        {/* Friend Avatar & Status */}
        <div className="flex flex-col items-center text-center space-y-2.5 pt-2">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: friend.avatarColor || '#1E293B' }}
            >
              {friend.avatarUrl ? (
                <img
                  src={friend.avatarUrl}
                  alt={friend.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-extrabold text-white">
                  {friend.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#0B0C10] ${
                friend.isBlocked
                  ? 'bg-rose-500'
                  : isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-white uppercase flex items-center justify-center gap-1.5">
              <span>{friend.username}</span>
              {friend.isFavorite && (
                <Star className="w-4 h-4 fill-current text-amber-400" />
              )}
            </h3>
            <p className="text-xs font-medium text-cyan-400">
              {friend.isBlocked
                ? 'Bloqueado por você'
                : isOnline
                ? `🟢 Online agora · ${friend.activity || 'Disponível'}`
                : `🕒 ${friend.lastSeenLabel || 'Visto recentemente'}`}
            </p>
          </div>

          <p className="text-xs text-white/70 max-w-xs">
            {friend.bio || 'Fã de Cinema 4K & Maratonas na Luminoria Pro'}
          </p>
        </div>

        {/* Rank & Stats Box */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#14161D] border border-white/10 text-center space-y-0.5">
            <span className="text-[10px] font-mono text-white/50 uppercase">NÍVEL</span>
            <p className="text-sm font-extrabold text-cyan-400">NV. {level}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#14161D] border border-white/10 text-center space-y-0.5">
            <span className="text-[10px] font-mono text-white/50 uppercase">PATENTE</span>
            <p className="text-xs font-extrabold text-amber-400 truncate">{rank.name}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#14161D] border border-white/10 text-center space-y-0.5">
            <span className="text-[10px] font-mono text-white/50 uppercase">XP TOTAL</span>
            <p className="text-sm font-extrabold text-white">{friend.xp.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onOpenChat}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Abrir Chat em Tempo Real</span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onToggleFavorite}
            className="py-2.5 px-2 rounded-xl bg-[#14161D] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                friend.isFavorite ? 'fill-current text-amber-400' : 'text-white/60'
              }`}
            />
            <span>{friend.isFavorite ? 'Favorito' : 'Favoritar'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleBlock}
            className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              friend.isBlocked
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#14161D] hover:bg-rose-950/40 border-white/10 text-rose-300'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{friend.isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
          </button>

          <button
            type="button"
            onClick={onRemoveFriend}
            className="py-2.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
