import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  MoreVertical,
  Search,
  Send,
  Sparkles,
  Star,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';

export const FriendsDrawer: React.FC = () => {
  const {
    isFriendsDrawerOpen,
    setIsFriendsDrawerOpen,
    friends,
    sendFriendMessage,
    addFriendByUsername,
    toggleFriendFavorite,
    joinOrCreateCinemaRoom,
    triggerCinemaFriendJoinedAlert,
  } = useLuminoria();

  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatFriendId, setChatFriendId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isFriendsDrawerOpen) return null;

  const favoriteFriends = friends.filter((f) => f.isFavorite);

  const filteredFriends = friends.filter((f) => {
    const matchesSearch =
      !searchQuery.trim() ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'online') return f.status === 'online' || f.status === 'watching';
    return true;
  });

  const activeChatFriend = friends.find((f) => f.id === chatFriendId) || null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatFriend || !messageText.trim()) return;
    sendFriendMessage(activeChatFriend.id, messageText);
    setMessageText('');
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addFriendByUsername(newFriendName);
    setFeedback(res.message);
    if (res.ok) setNewFriendName('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Luminora Amigos"
    >
      <div
        className="w-full max-w-md bg-[#0B0C10] border-l border-white/10 h-full flex flex-col justify-between"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Top Header matching Screenshot 4: ✨ LUMINORA AMIGOS */}
        <div className="p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeChatFriend ? (
              <button
                type="button"
                onClick={() => setChatFriendId(null)}
                aria-label="Voltar para lista de amigos"
                className="p-1.5 rounded-full hover:bg-white/10 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Sparkles className="w-5 h-5 text-[#A0A0B0]" />
            )}
            <h2 className="text-xl font-extrabold font-display tracking-wide uppercase">
              <span className="text-white">LUMINORA </span>
              <span className="text-[#E91E8C]">AMIGOS</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsFriendsDrawerOpen(false)}
            aria-label="Fechar painel de amigos"
            className="w-9 h-9 rounded-full text-[#A0A0B0] hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeChatFriend ? (
          /* Direct Chat Sub-View */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-[#14161D] border-y border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white uppercase">
                  {activeChatFriend.username}
                </p>
                <p className="text-xs text-[#8E929F]">
                  {activeChatFriend.lastSeenLabel || activeChatFriend.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerCinemaFriendJoinedAlert(activeChatFriend.username, 'LUMI92');
                  setIsFriendsDrawerOpen(false);
                  joinOrCreateCinemaRoom('LUMI92');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-xs font-semibold text-[#0EA5E9]"
              >
                Convidar p/ Sala
              </button>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {activeChatFriend.messages.length === 0 ? (
                <p className="text-xs text-[#8E929F] text-center my-8">
                  Nenhuma mensagem ainda. Envie um olá para {activeChatFriend.username}!
                </p>
              ) : (
                activeChatFriend.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.fromMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                        m.fromMe
                          ? 'bg-[#0EA5E9] text-black font-semibold'
                          : 'bg-[#171923] text-white border border-white/10'
                      }`}
                    >
                      <p>{m.text}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#8E929F] mt-1">{m.time}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Mensagem para ${activeChatFriend.username}...`}
                aria-label="Digite sua mensagem direta"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#14161D] border border-white/15 text-xs text-white placeholder-[#8E929F] focus:outline-none focus:border-[#0EA5E9]"
              />
              <button
                type="submit"
                aria-label="Enviar mensagem direta"
                className="px-4 py-2.5 rounded-xl bg-[#0EA5E9] text-black font-bold flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Main Friends List View matching Screenshot 4 */
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
            {/* Search Input: 🔍 Buscar... */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E929F] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar amigos"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#161820] border border-white/15 text-sm text-white placeholder-[#8E929F] focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            {/* Tabs: TODOS | ONLINE | PENDENTES */}
            <div className="flex items-center gap-6 border-b border-white/10 text-xs font-extrabold tracking-wider uppercase">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'text-[#0EA5E9] border-[#0EA5E9]'
                    : 'text-[#8E929F] border-transparent hover:text-white'
                }`}
              >
                TODOS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('online')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'online'
                    ? 'text-[#0EA5E9] border-[#0EA5E9]'
                    : 'text-[#8E929F] border-transparent hover:text-white'
                }`}
              >
                ONLINE
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'text-[#0EA5E9] border-[#0EA5E9]'
                    : 'text-[#8E929F] border-transparent hover:text-white'
                }`}
              >
                PENDENTES
              </button>
            </div>

            {activeTab === 'pending' && (
              <form onSubmit={handleAddFriend} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    placeholder="Adicionar amigo por username..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#14161D] border border-white/15 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#E91E8C] text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
                {feedback && <p className="text-xs text-amber-400">{feedback}</p>}
              </form>
            )}

            {/* AMIGOS FAVORITOS Horizontal Avatar Row */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-wider text-[#B0B3C0] uppercase">
                AMIGOS FAVORITOS
              </h3>

              <div className="flex items-center gap-3.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {favoriteFriends.map((fav) => {
                  const isLetterAvatar = fav.username.startsWith('naikel');
                  return (
                    <button
                      key={`fav-${fav.id}`}
                      type="button"
                      onClick={() => setChatFriendId(fav.id)}
                      className="flex flex-col items-center space-y-1.5 shrink-0 w-16 group"
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center border border-white/15 overflow-hidden group-hover:border-[#0EA5E9] transition-colors"
                        style={{ backgroundColor: fav.avatarColor || '#334155' }}
                      >
                        {isLetterAvatar ? (
                          <span className="text-xl font-extrabold text-[#0EA5E9]">
                            {fav.username.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-end bg-gradient-to-b from-sky-400/35 to-slate-900">
                            <span className="w-5 h-5 rounded-full bg-[#E2B897] mb-0.5" />
                            <span className="w-10 h-5 rounded-t-full bg-white/80" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-[#B0B3C0] truncate w-full text-center">
                        {fav.username}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AMIGOS (11) 2-Column Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-wider text-[#B0B3C0] uppercase">
                AMIGOS ({filteredFriends.length})
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {filteredFriends.map((fr) => (
                  <div
                    key={fr.id}
                    className="p-4 rounded-2xl bg-[#14161D] border border-white/10 flex flex-col items-center text-center space-y-2"
                  >
                    {/* Avatar */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center border border-white/15 overflow-hidden"
                      style={{ backgroundColor: fr.avatarColor || '#334155' }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-end bg-gradient-to-b from-sky-400/35 to-slate-900">
                        <span className="w-5 h-5 rounded-full bg-[#E2B897] mb-0.5" />
                        <span className="w-10 h-5 rounded-t-full bg-white/80" />
                      </div>
                    </div>

                    {/* Uppercase Name */}
                    <p className="text-xs font-extrabold text-white uppercase truncate w-full pt-1">
                      {fr.username}
                    </p>

                    {/* Status Label */}
                    <p className="text-[11px] text-[#8E929F]">
                      {fr.lastSeenLabel || 'Offline'}
                    </p>

                    {/* 4 Action Icons Row matching Screenshot 4 */}
                    <div className="flex items-center justify-between w-full pt-2 px-1">
                      <button
                        type="button"
                        onClick={() => setChatFriendId(fr.id)}
                        aria-label={`Ver perfil de ${fr.username}`}
                        className="p-1.5 text-[#0EA5E9] hover:bg-white/5 rounded-lg"
                      >
                        <User className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setChatFriendId(fr.id)}
                        aria-label={`Conversar com ${fr.username}`}
                        className="p-1.5 text-[#0EA5E9] hover:bg-white/5 rounded-lg"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFriendFavorite(fr.id)}
                        aria-label={`Favoritar amigo ${fr.username}`}
                        className="p-1.5 hover:bg-white/5 rounded-lg"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            fr.isFavorite
                              ? 'fill-current text-[#FACC15]'
                              : 'text-[#8E929F]'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerCinemaFriendJoinedAlert(fr.username, 'LUMI92');
                        }}
                        aria-label={`Mais opções para ${fr.username}`}
                        className="p-1.5 text-[#8E929F] hover:text-white rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
