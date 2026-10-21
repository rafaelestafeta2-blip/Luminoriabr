import React, { useState } from 'react';
import {
  ArrowLeft,
  Ban,
  MessageSquare,
  Search,
  Star,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { FriendChatView } from './FriendChatView';
import { FriendProfileModal } from './FriendProfileModal';
import { FriendRequestsPanel } from './FriendRequestsPanel';
import { normalizeInstagramHandle } from '../../services/authService';

export const FriendsDrawer: React.FC = () => {
  const {
    isFriendsDrawerOpen,
    setIsFriendsDrawerOpen,
    profile,
    friends,
    friendRequests,
    sendFriendMessage,
    reactToFriendMessage,
    markFriendChatRead,
    addFriendByUsername,
    acceptFriendRequest,
    declineFriendRequest,
    toggleFriendFavorite,
    toggleBlockFriend,
    removeFriend,
    joinOrCreateCinemaRoom,
    cinemaRoom,
    vodItems,
    activeScheme,
  } = useLuminoria();

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'online' | 'favorites' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatFriendId, setChatFriendId] = useState<string | null>(null);
  const [inspectProfileFriendId, setInspectProfileFriendId] = useState<string | null>(null);

  if (!isFriendsDrawerOpen) return null;

  const myHandle = normalizeInstagramHandle(profile.handle || profile.username);
  const activeFriends = friends.filter((f) => !f.isBlocked);
  const onlineCount = activeFriends.filter(
    (f) => f.status === 'online' || f.status === 'watching'
  ).length;

  const pendingRequestsCount = friendRequests.filter(
    (r) =>
      r.status === 'pending' &&
      (r.toUserId === profile.userId ||
        r.toHandle.toLowerCase() === myHandle.toLowerCase() ||
        r.fromUserId === profile.userId)
  ).length;

  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      f.username.toLowerCase().includes(q) ||
      (f.handle && f.handle.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if (activeTab === 'blocked') return Boolean(f.isBlocked);
    if (f.isBlocked) return false;
    if (activeTab === 'online') return f.status === 'online' || f.status === 'watching';
    if (activeTab === 'favorites') return Boolean(f.isFavorite);
    return true;
  });

  const activeChatFriend = friends.find((f) => f.id === chatFriendId) || null;
  const inspectFriend = friends.find((f) => f.id === inspectProfileFriendId) || null;

  const handleOpenChat = (friendId: string) => {
    setInspectProfileFriendId(null);
    setChatFriendId(friendId);
    markFriendChatRead(friendId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Rede Social de Amigos"
    >
      <div
        className="w-full max-w-md bg-[#0B0C10] border-l border-white/10 h-full flex flex-col justify-between"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeChatFriend || inspectFriend ? (
              <button
                type="button"
                onClick={() => {
                  setChatFriendId(null);
                  setInspectProfileFriendId(null);
                }}
                aria-label="Voltar para lista de amigos"
                className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Users className="w-5 h-5" style={{ color: activeScheme.primaryHex }} />
            )}
            <div>
              <h2 className="text-base font-extrabold font-display tracking-wide text-white leading-none">
                Rede Social · Amigos ({activeFriends.length})
              </h2>
              <p className="text-[11px] font-mono text-cyan-400 mt-1">
                Seu ID: {myHandle} · {onlineCount} online
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFriendsDrawerOpen(false)}
            aria-label="Fechar painel de amigos"
            className="w-8 h-8 rounded-full text-[#A0A0B0] hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inspectFriend ? (
          <FriendProfileModal
            friend={inspectFriend}
            onClose={() => setInspectProfileFriendId(null)}
            onOpenChat={() => handleOpenChat(inspectFriend.id)}
            onToggleFavorite={() => toggleFriendFavorite(inspectFriend.id)}
            onToggleBlock={() => toggleBlockFriend(inspectFriend.id)}
            onRemoveFriend={() => {
              removeFriend(inspectFriend.id);
              setInspectProfileFriendId(null);
            }}
          />
        ) : activeChatFriend ? (
          <FriendChatView
            friend={activeChatFriend}
            featuredMovieTitle={vodItems[0]?.title}
            onSendMessage={(text, sharedMovie) =>
              sendFriendMessage(activeChatFriend.id, text, sharedMovie)
            }
            onReactToMessage={(msgId, emoji) =>
              reactToFriendMessage(activeChatFriend.id, msgId, emoji)
            }
            onToggleFavorite={() => toggleFriendFavorite(activeChatFriend.id)}
            onToggleBlock={() => toggleBlockFriend(activeChatFriend.id)}
            onRemoveFriend={() => {
              removeFriend(activeChatFriend.id);
              setChatFriendId(null);
            }}
            onInviteToCinema={() => {
              joinOrCreateCinemaRoom(cinemaRoom.code);
              sendFriendMessage(
                activeChatFriend.id,
                `Vem assistir comigo na Sala de Cinema! Digite o código de 6 dígitos: ${cinemaRoom.code}`
              );
            }}
          />
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'all' ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                Amigos ({activeFriends.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                  activeTab === 'requests'
                    ? 'bg-cyan-400 text-black'
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>@Buscar & Pedidos ({pendingRequestsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('online')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'online' ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                Online ({onlineCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('blocked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'blocked' ? 'bg-rose-500 text-white' : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                Bloqueados
              </button>
            </div>

            {activeTab === 'requests' ? (
              <FriendRequestsPanel
                currentUserId={profile.userId}
                currentHandle={myHandle}
                friends={friends}
                friendRequests={friendRequests}
                onSendRequestByHandle={addFriendByUsername}
                onAcceptRequest={acceptFriendRequest}
                onDeclineRequest={declineFriendRequest}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Filter Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar seus amigos por nome ou @id..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#12141E] border border-white/10 text-xs text-white placeholder-white/35 focus:outline-none"
                  />
                </div>

                {filteredFriends.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
                    <Users className="w-8 h-8 text-white/30 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Sua lista de amigos está vazia</p>
                      <p className="text-xs text-[#A0A0B0]">
                        Nenhum amigo fictício é adicionado. Busque seus amigos reais pelo @username único!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('requests')}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Buscar por @username</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="p-3 rounded-xl bg-[#12141E] border border-white/10 flex items-center justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenChat(friend.id)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center text-xs font-bold text-white">
                            {friend.avatarUrl ? (
                              <img
                                src={friend.avatarUrl}
                                alt={friend.username}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              friend.username.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{friend.username}</p>
                            <p className="text-[11px] font-mono text-cyan-400 truncate">
                              {friend.handle || normalizeInstagramHandle(friend.username)}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenChat(friend.id)}
                            aria-label="Abrir conversa"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectProfileFriendId(friend.id)}
                            aria-label="Ver perfil"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFriendFavorite(friend.id)}
                            aria-label="Favoritar amigo"
                            className={`p-2 rounded-lg bg-white/5 hover:bg-white/15 cursor-pointer ${
                              friend.isFavorite ? 'text-amber-400' : 'text-white/50'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBlockFriend(friend.id)}
                            aria-label="Bloquear amigo"
                            className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-300 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFriend(friend.id)}
                            aria-label="Remover amigo"
                            className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
