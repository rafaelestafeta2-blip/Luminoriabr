import React, { useEffect, useRef, useState } from 'react';
import {
  Ban,
  Check,
  CheckCheck,
  Film,
  Play,
  Send,
  ShieldAlert,
  Star,
  Trash2,
} from 'lucide-react';
import { FriendContact } from '../../types/luminoria';

interface FriendChatViewProps {
  friend: FriendContact;
  featuredMovieTitle?: string;
  onSendMessage: (text: string, sharedMovieTitle?: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onToggleFavorite: () => void;
  onToggleBlock: () => void;
  onRemoveFriend: () => void;
  onInviteToCinema: () => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '🍿', '😂'];

export const FriendChatView: React.FC<FriendChatViewProps> = ({
  friend,
  featuredMovieTitle,
  onSendMessage,
  onReactToMessage,
  onToggleFavorite,
  onToggleBlock,
  onRemoveFriend,
  onInviteToCinema,
}) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [friend.messages.length, friend.isTyping]);

  const isOnline = friend.status === 'online' || friend.status === 'watching';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || friend.isBlocked) return;
    onSendMessage(messageText.trim());
    setMessageText('');
  };

  const handleShareMovie = () => {
    if (friend.isBlocked) return;
    const movie = featuredMovieTitle || 'Homem-Aranha: Um Novo Dia (2026)';
    onSendMessage(`🎬 Te recomendo assistir "${movie}" em 4K aqui na Luminoria!`, movie);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Friend Presence & Action Header */}
      <div className="px-4 py-3 bg-[#14161D] border-y border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex items-center justify-center"
              style={{ backgroundColor: friend.avatarColor || '#1E293B' }}
            >
              {friend.avatarUrl ? (
                <img
                  src={friend.avatarUrl}
                  alt={friend.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-extrabold text-white">
                  {friend.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#14161D] ${
                friend.isBlocked
                  ? 'bg-rose-500'
                  : isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs sm:text-sm font-extrabold text-white uppercase truncate">
                {friend.username}
              </p>
              {friend.isFavorite && (
                <Star className="w-3.5 h-3.5 fill-current text-amber-400 shrink-0" />
              )}
            </div>
            {friend.isTyping ? (
              <p className="text-[11px] font-bold text-cyan-400 animate-pulse">
                ✍️ digitando mensagem...
              </p>
            ) : (
              <p className="text-[11px] text-[#8E929F] truncate">
                {friend.isBlocked
                  ? 'Contato bloqueado'
                  : isOnline
                  ? `Online agora · ${friend.activity || 'Ativo no app'}`
                  : friend.lastSeenLabel || 'Visto recentemente'}
              </p>
            )}
          </div>
        </div>

        {/* Action Toolbar: Favorite, Invite, Block, Delete */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleFavorite}
            title={friend.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                friend.isFavorite ? 'fill-current text-amber-400' : 'text-white/60'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={onInviteToCinema}
            title="Convidar para Sala de Cinema"
            className="px-2.5 py-1.5 rounded-lg bg-[#0EA5E9]/20 hover:bg-[#0EA5E9]/30 border border-[#0EA5E9]/40 text-[11px] font-bold text-[#0EA5E9] flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Sala</span>
          </button>

          <button
            type="button"
            onClick={onToggleBlock}
            title={friend.isBlocked ? 'Desbloquear amigo' : 'Bloquear amigo'}
            className={`p-1.5 rounded-lg border cursor-pointer ${
              friend.isBlocked
                ? 'bg-rose-500/25 border-rose-500/50 text-rose-300'
                : 'bg-white/5 hover:bg-rose-500/20 border-white/10 text-white/60 hover:text-rose-300'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRemoveFriend}
            title="Excluir amigo da lista"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 text-white/60 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {friend.isBlocked && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-between gap-2 text-xs text-rose-200">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              Você bloqueou {friend.username}. Mensagens estão desativadas.
            </span>
            <button
              type="button"
              onClick={onToggleBlock}
              className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Desbloquear
            </button>
          </div>
        )}

        {friend.messages.length === 0 ? (
          <div className="text-center my-10 space-y-2">
            <p className="text-xs text-[#8E929F]">
              Nenhuma mensagem ainda. Envie um olá para {friend.username}!
            </p>
          </div>
        ) : (
          friend.messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.fromMe ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs space-y-1.5 relative ${
                  m.fromMe
                    ? 'bg-gradient-to-r from-[#0EA5E9] to-cyan-400 text-black font-semibold rounded-br-xs'
                    : 'bg-[#171923] text-white border border-white/10 rounded-bl-xs'
                }`}
              >
                {m.sharedMovieTitle && (
                  <div className="px-2 py-1 rounded-lg bg-black/20 flex items-center gap-1.5 text-[10px] font-bold">
                    <Film className="w-3 h-3 shrink-0" />
                    <span className="truncate">Indicação 4K: {m.sharedMovieTitle}</span>
                  </div>
                )}
                <p className="leading-relaxed break-words">{m.text}</p>

                {m.reaction && (
                  <span className="inline-block px-1.5 py-0.5 rounded-full bg-black/30 text-[11px]">
                    {m.reaction}
                  </span>
                )}
              </div>

              {/* Time, Read Receipt & Quick Emoji Reaction Bar */}
              <div className="flex items-center gap-2 mt-1 px-1">
                <span className="text-[10px] font-mono text-[#8E929F]">{m.time}</span>
                {m.fromMe && (
                  <span className="inline-flex items-center" title={`Status: ${m.status || 'read'}`}>
                    {m.status === 'sent' ? (
                      <Check className="w-3 h-3 text-white/50" />
                    ) : (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          m.status === 'delivered' ? 'text-white/60' : 'text-cyan-400'
                        }`}
                      />
                    )}
                  </span>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => onReactToMessage(m.id, em)}
                      className="text-[11px] hover:scale-125 transition-transform cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Real-Time Typing Bubble when Friend is Typing */}
        {friend.isTyping && (
          <div className="flex items-center gap-2">
            <div className="px-4 py-2.5 rounded-2xl bg-[#171923] border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
              </span>
              <span className="text-[11px] font-medium">
                {friend.username} está digitando...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Bar + Message Input */}
      <div className="p-3 bg-[#0E1017] border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            disabled={friend.isBlocked}
            onClick={handleShareMovie}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-cyan-300 flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
          >
            <Film className="w-3 h-3" />
            <span>Indicar Filme</span>
          </button>
          <button
            type="button"
            disabled={friend.isBlocked}
            onClick={() => onSendMessage('Bora entrar na Sala de Cinema #LUMI92 agora? 🍿')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 shrink-0 cursor-pointer disabled:opacity-40"
          >
            🍿 Bora Sala #LUMI92?
          </button>
          <button
            type="button"
            disabled={friend.isBlocked}
            onClick={() => onSendMessage('Vi o Top 10 da Semana, só filmaço! 🔥')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 shrink-0 cursor-pointer disabled:opacity-40"
          >
            🔥 Top 10 da Semana
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            disabled={friend.isBlocked}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              friend.isBlocked
                ? 'Desbloqueie para enviar mensagens...'
                : `Mensagem em tempo real para ${friend.username}...`
            }
            aria-label="Digite sua mensagem direta"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14161D] border border-white/15 text-xs text-white placeholder-[#8E929F] focus:outline-none focus:border-[#0EA5E9] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={friend.isBlocked || !messageText.trim()}
            aria-label="Enviar mensagem direta"
            className="px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-cyan-400 text-black font-bold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
