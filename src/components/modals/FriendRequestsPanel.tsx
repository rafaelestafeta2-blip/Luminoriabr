import React, { useMemo, useState } from 'react';
import { AtSign, Check, Clock, Search, UserCheck, UserPlus, X } from 'lucide-react';
import { FriendContact, FriendRequestItem } from '../../types/luminoria';
import { searchDirectoryByHandle } from '../../services/friendsChatService';

interface FriendRequestsPanelProps {
  currentUserId: string;
  currentHandle: string;
  friends: FriendContact[];
  friendRequests: FriendRequestItem[];
  onSendRequestByHandle: (handleOrName: string) => { ok: boolean; message: string };
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
}

export const FriendRequestsPanel: React.FC<FriendRequestsPanelProps> = ({
  currentUserId,
  currentHandle,
  friends,
  friendRequests,
  onSendRequestByHandle,
  onAcceptRequest,
  onDeclineRequest,
}) => {
  const [handleQuery, setHandleQuery] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const incomingRequests = useMemo(
    () =>
      friendRequests.filter(
        (r) =>
          r.status === 'pending' &&
          (r.toUserId === currentUserId ||
            r.toHandle.toLowerCase() === currentHandle.toLowerCase())
      ),
    [friendRequests, currentUserId, currentHandle]
  );

  const sentRequests = useMemo(
    () =>
      friendRequests.filter(
        (r) =>
          r.status === 'pending' &&
          (r.fromUserId === currentUserId ||
            r.fromHandle.toLowerCase() === currentHandle.toLowerCase())
      ),
    [friendRequests, currentUserId, currentHandle]
  );

  const directoryMatches = useMemo(() => {
    return searchDirectoryByHandle(handleQuery, currentUserId);
  }, [handleQuery, currentUserId]);

  const handleSend = (targetHandle: string) => {
    const res = onSendRequestByHandle(targetHandle);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setHandleQuery('');
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      {/* Search & Send Request by @username */}
      <div className="p-3.5 rounded-2xl bg-[#11131F] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5 text-cyan-400" />
            Buscar Usuário por @username
          </span>
          <span className="text-[10px] font-mono text-white/50">Seu ID: {currentHandle}</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!handleQuery.trim()) return;
            handleSend(handleQuery);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={handleQuery}
              onChange={(e) => setHandleQuery(e.target.value)}
              placeholder="Digite @username do amigo..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#080910] border border-white/15 text-xs font-mono text-white placeholder-white/35 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Solicitar</span>
          </button>
        </form>

        {feedback && (
          <p
            className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${
              feedback.ok
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {feedback.text}
          </p>
        )}

        {/* Real Registered Users Directory Results */}
        {directoryMatches.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">
              Usuários Cadastrados Encontrados ({directoryMatches.length})
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {directoryMatches.map((u) => {
                const isAlreadyFriend = friends.some(
                  (f) =>
                    f.id === u.userId ||
                    (f.handle && f.handle.toLowerCase() === u.handle.toLowerCase())
                );
                const isPending = friendRequests.some(
                  (r) =>
                    r.status === 'pending' &&
                    ((r.fromUserId === currentUserId &&
                      r.toHandle.toLowerCase() === u.handle.toLowerCase()) ||
                      (r.toUserId === currentUserId &&
                        r.fromHandle.toLowerCase() === u.handle.toLowerCase()))
                );

                return (
                  <div
                    key={u.userId}
                    className="p-2 rounded-xl bg-[#090A10] border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-white">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.username}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{u.username}</p>
                        <p className="text-[10px] font-mono text-cyan-400 truncate">{u.handle}</p>
                      </div>
                    </div>

                    {isAlreadyFriend ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-mono flex items-center gap-1 shrink-0">
                        <UserCheck className="w-3 h-3" /> Amigo
                      </span>
                    ) : isPending ? (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSend(u.handle)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold shrink-0 cursor-pointer"
                      >
                        Enviar Pedido
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Incoming Friend Requests (Accept / Decline) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
          <span>Solicitações Recebidas</span>
          <span className="font-mono text-cyan-400 tabular-nums">{incomingRequests.length}</span>
        </h3>

        {incomingRequests.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-[#A0A0B0]">
            Nenhuma solicitação de amizade pendente no momento.
          </div>
        ) : (
          <div className="space-y-2">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-[#121420] border border-cyan-500/30 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{req.fromUsername}</p>
                  <p className="text-[11px] font-mono text-cyan-400 truncate">
                    {req.fromHandle} · {req.createdAtLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAcceptRequest(req.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceitar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineRequest(req.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Recusar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Sent Friend Requests */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
          <span>Solicitações Enviadas</span>
          <span className="font-mono text-[#A0A0B0] tabular-nums">{sentRequests.length}</span>
        </h3>

        {sentRequests.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-[#A0A0B0]">
            Você não possui pedidos enviados aguardando resposta.
          </div>
        ) : (
          <div className="space-y-2">
            {sentRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-[#0F111A] border border-white/10 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{req.toUsername}</p>
                  <p className="text-[11px] font-mono text-amber-300 truncate">
                    {req.toHandle} · Aguardando confirmação
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAcceptRequest(req.id)}
                    title="Aprovar vínculo em modo teste local"
                    className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineRequest(req.id)}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-[10px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
