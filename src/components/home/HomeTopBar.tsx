import React from 'react';
import { Bell, Play, Search, Trophy, UserCheck, Users } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { TmdbSyncBadge } from '../tmdb/TmdbSyncBadge';

interface HomeTopBarProps {
  showSearchInput: boolean;
  onToggleSearch: () => void;
  featuredMovieId?: string;
}

export const HomeTopBar: React.FC<HomeTopBarProps> = ({
  showSearchInput,
  onToggleSearch,
  featuredMovieId,
}) => {
  const {
    activeScheme,
    profile,
    friends,
    cinemaRoom,
    joinOrCreateCinemaRoom,
    setIsFriendsDrawerOpen,
    setIsRankDrawerOpen,
    setIsNotificationsDrawerOpen,
    unreadNotificationCount,
    setIsTmdbSyncModalOpen,
    isSyncingTmdb,
    setShowIntro,
    setIsAuthModalOpen,
  } = useLuminoria();

  const activeFriends = friends.filter((f) => !f.isBlocked);
  const unreadChats = activeFriends.reduce((acc, f) => acc + (f.unreadCount || 0), 0);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pt-1">
      {/* Brand & Section Title */}
      <div className="flex items-center gap-2">
        <span
          className="text-lg sm:text-xl font-extrabold font-display tracking-wider bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, ${activeScheme.primaryHex} 60%, ${activeScheme.secondaryHex} 100%)`,
          }}
        >
          LUMINORIA
        </span>
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#0EA5E9]">
          FILMES
        </span>
      </div>

      {/* Top Action Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Replay Cinema Intro Button */}
        <button
          type="button"
          onClick={() => setShowIntro(true)}
          aria-label="Ver Abertura Cinema Luminoria"
          className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          title="Assistir à abertura leve e cinematográfica Luminoria com som Ta-Dum"
        >
          <span>🎬 Intro Cinema</span>
        </button>

        {/* TMDB Firestore Cache Indicator Badge */}
        <TmdbSyncBadge
          onOpenSyncModal={() => setIsTmdbSyncModalOpen(true)}
          isSyncing={isSyncingTmdb}
        />

        {/* Friends Drawer with Unread Chat Badge */}
        <button
          type="button"
          onClick={() => setIsFriendsDrawerOpen(true)}
          aria-label="Abrir lista de amigos"
          className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#13151F] hover:bg-[#1C1F2E] border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer relative"
        >
          <Users className="w-3.5 h-3.5 text-[#E91E8C]" />
          <span>Amigos</span>
          <span className="font-mono text-[11px] text-[#0EA5E9] tabular-nums">
            ({activeFriends.length})
          </span>
          {unreadChats > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#E91E8C] text-[10px] font-extrabold text-white">
              {unreadChats}
            </span>
          )}
        </button>

        {/* Ranking Drawer */}
        <button
          type="button"
          onClick={() => setIsRankDrawerOpen(true)}
          aria-label="Abrir Ranking Global"
          className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#13151F] hover:bg-[#1C1F2E] border border-amber-500/35 text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Ranking</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => setIsNotificationsDrawerOpen(true)}
          aria-label="Abrir Central de Notificações"
          className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#13151F] hover:bg-[#1C1F2E] border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-[#0EA5E9]" />
          <span className="hidden sm:inline">Alertas</span>
          {unreadNotificationCount > 0 && (
            <span className="font-mono text-[11px] font-bold text-[#E91E8C] tabular-nums">
              ({unreadNotificationCount})
            </span>
          )}
        </button>

        {/* Account Login / Register Button */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          aria-label="Conta e Login"
          className="min-h-[38px] pl-2 pr-3.5 py-1 rounded-full bg-[#13151F] hover:bg-[#1C1F2E] border border-cyan-500/35 text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="w-6 h-6 rounded-full object-cover border border-cyan-400"
            />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          )}
          <span className="max-w-[100px] truncate">{profile.username}</span>
        </button>

        {/* Cinema Room */}
        <button
          type="button"
          onClick={() => joinOrCreateCinemaRoom(cinemaRoom.code, featuredMovieId)}
          className="min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(135deg, ${activeScheme.primaryHex}, ${activeScheme.secondaryHex})`,
          }}
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Sala #{cinemaRoom.code}</span>
        </button>

        {/* Search Toggle */}
        <button
          type="button"
          onClick={onToggleSearch}
          aria-label="Buscar filmes"
          className={`min-h-[38px] min-w-[38px] rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            showSearchInput
              ? 'bg-[#0EA5E9] text-black border-[#0EA5E9]'
              : 'bg-[#13151F] hover:bg-[#1C1F2E] border-white/15 text-white'
          }`}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

