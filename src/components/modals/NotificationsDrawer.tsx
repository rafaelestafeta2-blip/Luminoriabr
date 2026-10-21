import React, { useState } from 'react';
import { Bell, CalendarClock, Check, CheckCheck, Film, Trash2, Tv, Users, X } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { AppNotification } from '../../types/luminoria';

export const NotificationsDrawer: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    isNotificationsDrawerOpen,
    setIsNotificationsDrawerOpen,
    activeToastNotification,
    dismissToastNotification,
    triggerEpgFavoriteAlert,
    triggerCinemaFriendJoinedAlert,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
    setActiveNav,
    joinOrCreateCinemaRoom,
    channels,
    friends,
    cinemaRoom,
    authUser,
    activeScheme,
    setIsFriendsDrawerOpen,
  } = useLuminoria();

  const [filterType, setFilterType] = useState<
    'all' | 'epg_reminder' | 'cinema_invite' | 'chat_message'
  >('all');

  const filteredList = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'chat_message') {
      return n.type === 'chat_message' || n.type === 'friend_request';
    }
    return n.type === filterType;
  });

  const handleOpenNotificationTarget = (notif: AppNotification) => {
    markNotificationRead(notif.notificationId);
    dismissToastNotification();
    setIsNotificationsDrawerOpen(false);
    if (notif.type === 'cinema_invite') {
      joinOrCreateCinemaRoom(notif.targetId);
    } else if (notif.type === 'chat_message' || notif.type === 'friend_request') {
      setIsFriendsDrawerOpen(true);
    } else {
      setActiveNav('channels');
    }
  };

  const handleSimulateEpgAlert = () => {
    const ch = channels[0];
    const prog = ch?.currentPrograms[1] || ch?.currentPrograms[0];
    if (!ch || !prog) return;
    triggerEpgFavoriteAlert(ch.id, ch.name, prog.title, prog.startTime);
  };

  const handleSimulateCinemaFriendAlert = () => {
    const randomFriend = friends[Math.floor(Math.random() * friends.length)]?.username || 'ElenaValkyrie';
    triggerCinemaFriendJoinedAlert(randomFriend, cinemaRoom.code);
  };

  return (
    <>
      {/* Live Floating Alert Toast Banner */}
      {activeToastNotification && !isNotificationsDrawerOpen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 w-[340px] sm:w-[390px] p-4 rounded-2xl bg-[#111118]/95 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              {activeToastNotification.type === 'epg_reminder' ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Tv className="w-3.5 h-3.5" />
                  <span>ALERTA EPG FAVORITO</span>
                </span>
              ) : activeToastNotification.type === 'chat_message' ||
                activeToastNotification.type === 'friend_request' ? (
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>CHAT & AMIGOS EM TEMPO REAL</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>AMIGO NA SALA DE CINEMA</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={dismissToastNotification}
              aria-label="Fechar alerta rápido"
              className="text-[#A0A0B0] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold font-display text-white">
              {activeToastNotification.title}
            </p>
            <p className="text-xs text-[#A0A0B0] leading-relaxed">
              {activeToastNotification.message}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => handleOpenNotificationTarget(activeToastNotification)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: activeScheme.primaryHex }}
            >
              {activeToastNotification.type === 'epg_reminder'
                ? 'Sintonizar no Guia EPG'
                : activeToastNotification.type === 'chat_message' ||
                  activeToastNotification.type === 'friend_request'
                ? 'Abrir Chat de Amigos'
                : `Ir para Sala #${activeToastNotification.targetId}`}
            </button>
            <span className="text-[11px] font-mono text-[#A0A0B0]">
              {authUser ? 'Salvo no Firestore' : 'Tempo Real Ativo'}
            </span>
          </div>
        </div>
      )}

      {/* Slide-Over Notifications Drawer */}
      {isNotificationsDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Central de Notificações Firestore"
        >
          <div className="w-full max-w-md bg-[#111118] border-l border-white/15 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="p-5 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#E91E8C]" />
                  <div>
                    <h2 className="text-lg font-bold font-display text-white">
                      Central de Notificações
                    </h2>
                    <p className="text-xs text-[#A0A0B0]">
                      {unreadNotificationCount} não lida(s) · Coleção Firestore{' '}
                      <code className="font-mono text-white">/users/&#123;uid&#125;/notifications</code>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationsDrawerOpen(false)}
                  aria-label="Fechar painel de notificações"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filter & Mark All Read */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#09090D] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      filterType === 'all' ? 'bg-white text-black font-semibold' : 'text-[#A0A0B0]'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('chat_message')}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      filterType === 'chat_message'
                        ? 'bg-white text-black font-semibold'
                        : 'text-[#A0A0B0]'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('epg_reminder')}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      filterType === 'epg_reminder'
                        ? 'bg-white text-black font-semibold'
                        : 'text-[#A0A0B0]'
                    }`}
                  >
                    EPG
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('cinema_invite')}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      filterType === 'cinema_invite'
                        ? 'bg-white text-black font-semibold'
                        : 'text-[#A0A0B0]'
                    }`}
                  >
                    Cinema
                  </button>
                </div>

                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Ler todas</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification Items List */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A0A0B0] space-y-2">
                  <Bell className="w-6 h-6 mx-auto text-[#A0A0B0]/50" />
                  <p>Nenhuma notificação encontrada nesta categoria.</p>
                </div>
              ) : (
                filteredList.map((notif) => (
                  <div
                    key={notif.notificationId}
                    className={`p-4 rounded-xl border transition-colors space-y-2.5 ${
                      notif.read
                        ? 'bg-[#09090D]/60 border-white/5 opacity-80'
                        : 'bg-[#09090D] border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span
                        className={`flex items-center gap-1.5 ${
                          notif.type === 'epg_reminder'
                            ? 'text-emerald-400'
                            : notif.type === 'chat_message' || notif.type === 'friend_request'
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {notif.type === 'epg_reminder' ? (
                          <>
                            <CalendarClock className="w-3.5 h-3.5" />
                            <span>PROGRAMA FAVORITO EPG</span>
                          </>
                        ) : notif.type === 'chat_message' || notif.type === 'friend_request' ? (
                          <>
                            <Users className="w-3.5 h-3.5" />
                            <span>CHAT & AMIGOS</span>
                          </>
                        ) : (
                          <>
                            <Film className="w-3.5 h-3.5" />
                            <span>SALA DE CINEMA</span>
                          </>
                        )}
                      </span>
                      <span className="text-[#A0A0B0] tabular-nums">{notif.createdAtLabel}</span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold font-display text-white">{notif.title}</h3>
                      <p className="text-xs text-[#A0A0B0] leading-relaxed">{notif.message}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenNotificationTarget(notif)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                      >
                        {notif.type === 'epg_reminder'
                          ? 'Abrir Guia EPG'
                          : notif.type === 'chat_message' || notif.type === 'friend_request'
                          ? 'Responder no Chat'
                          : `Entrar na Sala #${notif.targetId}`}
                      </button>

                      <div className="flex items-center gap-2">
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(notif.notificationId)}
                            title="Marcar como lida"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNotification(notif.notificationId)}
                          title="Excluir notificação"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[#A0A0B0] hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer: Quick Trigger / Test Bar for EPG & Cinema Alerts */}
            <div className="p-4 border-t border-white/10 bg-[#09090D] space-y-2.5">
              <p className="text-[11px] font-mono text-[#A0A0B0]">
                DISPARAR ALERTA EM TEMPO REAL (FIRESTORE)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSimulateEpgAlert}
                  className="px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Alerta Guia EPG</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCinemaFriendAlert}
                  className="px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Amigo no Cinema</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
