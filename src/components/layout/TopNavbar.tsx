import React from 'react';
import { Play, Sparkles, Trophy, Users, Coins, Shield, Cloud, LogOut, Bell } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { NavSectionId } from '../../types/luminoria';
import { getRankForXp, levelFromXp } from '../../utils/luminoriaLogic';
import { TvModeToggle } from '../tv/TvModeToggle';

const NAV_LINKS: { id: NavSectionId; label: string }[] = [
  { id: 'home', label: 'Início' },
  { id: 'channels', label: 'Canais & EPG' },
  { id: 'cinema', label: 'Sala de Cinema' },
  { id: 'playlists', label: 'Fontes M3U' },
  { id: 'shop', label: 'Loja & Ranking' },
];

export const TopNavbar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    activeScheme,
    profile,
    cinemaRoom,
    setIsFriendsDrawerOpen,
    unreadNotificationCount,
    setIsNotificationsDrawerOpen,
    authUser,
    isLoggedIn,
    isCloudSynced,
    loginWithGoogle,
    logoutFirebase,
  } = useLuminoria();

  const currentRank = getRankForXp(profile.xp);
  const currentLevel = levelFromXp(profile.xp);

  return (
    <div className="bg-[#09090D] border-b border-white/10">
      {/* Strict 3-Zone Top Bar Contract — Sticky Single Row on Desktop */}
      <div className="md:sticky md:top-0 z-30 bg-[#09090D]/95 backdrop-blur-md border-b border-white/5">
        <header className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-8 py-3">
          {/* Zone 1: Brand Title (Single text element wordmark) */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav('home');
            }}
            className="text-lg sm:text-xl font-extrabold tracking-wider font-display whitespace-nowrap shrink-0 bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, ${activeScheme.primaryHex} 60%, ${activeScheme.secondaryHex} 100%)`,
            }}
          >
            LUMINORIA PRO
          </a>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav aria-label="Navegação Principal" className="hidden md:flex items-center gap-7 text-sm font-medium">
            {NAV_LINKS.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                    isActive
                      ? 'text-white border-[#E91E8C] font-semibold'
                      : 'text-[#A0A0B0] border-transparent hover:text-white'
                  }`}
                  style={isActive ? { borderColor: activeScheme.primaryHex } : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveNav('cinema')}
              className="px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm"
              style={{
                backgroundImage: `linear-gradient(135deg, ${activeScheme.primaryHex}, ${activeScheme.secondaryHex})`,
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Sala #{cinemaRoom.code}</span>
            </button>
          </div>
        </header>
      </div>

      {/* Non-sticky Workspace Sub-Bar: Mobile Nav + Profile Patente, Coins, Cloud Sync & Friends Drawer Trigger */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-[#A0A0B0]">
        {/* Mobile wrap nav links */}
        <div className="flex md:hidden flex-wrap items-center gap-1.5 w-full pb-1.5 border-b border-white/5">
          {NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 font-medium ${
                activeNav === item.id ? 'bg-white/15 text-white' : 'text-[#A0A0B0]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Unboxed Status Metadata */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#A0A0B0]">
          <Sparkles className="w-3.5 h-3.5 text-[#E91E8C]" />
          <span>Patente Nv. {currentLevel}: <strong className="text-white font-semibold">{currentRank.name}</strong></span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{profile.xp} XP</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{profile.watchHours}h assistidas</span>
        </div>

        {/* Interactive Workspace Utility Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full md:w-auto md:ml-auto">
          <TvModeToggle />

          {isLoggedIn ? (
            <button
              type="button"
              onClick={logoutFirebase}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[#A0A0B0] hover:text-rose-300 border border-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Encerrar sessão e voltar ao login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveNav('shop')}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors font-mono tabular-nums whitespace-nowrap shrink-0"
            aria-label="Abrir Loja de Luminárias"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{profile.coins} Luminárias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('shop')}
            className="flex items-center gap-1.5 text-[#F4F4F6] hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Ranking</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNotificationsDrawerOpen(true)}
            className="flex items-center gap-1.5 text-[#F4F4F6] hover:text-white transition-colors whitespace-nowrap shrink-0"
            aria-label="Abrir Central de Notificações"
          >
            <Bell className="w-3.5 h-3.5 text-[#E91E8C]" />
            <span>Alertas</span>
            {unreadNotificationCount > 0 && (
              <span className="font-mono text-[11px] font-bold text-[#E91E8C] tabular-nums">
                ({unreadNotificationCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFriendsDrawerOpen(true)}
            className="flex items-center gap-1.5 text-[#F4F4F6] hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Amigos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('profile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'profile'
                ? 'bg-white/15 text-white font-semibold'
                : 'text-[#F4F4F6] hover:bg-white/10'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#E91E8C]" />
            <span>Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
