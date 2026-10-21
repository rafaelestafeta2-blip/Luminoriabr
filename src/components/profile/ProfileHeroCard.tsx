import React, { useRef, useState } from 'react';
import { Archive, Camera, Clock, Heart, History, Image as ImageIcon, LogIn, MapPin, Shield, Users } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { getNextRankProgress, levelFromXp } from '../../utils/luminoriaLogic';
import { compressAvatarFileToDataUrl } from '../../utils/avatarUploadHelper';
import { CoverPhotoModal } from './CoverPhotoModal';

const GENRE_COLORS: Record<string, string> = {
  ANIME: '#D81B60',
  GUERRA: '#5D4037',
  AVENTURA: '#2E7D32',
  AÇÃO: '#EF6C00',
  FICÇÃO: '#0288D1',
  SUSPENSE: '#6A1B9A',
  TERROR: '#B71C1C',
  DRAMA: '#455A64',
  COMÉDIA: '#F9A825',
  ROMANCE: '#AD1457',
};

const COUNTRY_LABELS: Record<string, { flag: string; label: string }> = {
  PT: { flag: '🇵🇹', label: 'Portugal' },
  BR: { flag: '🇧🇷', label: 'Brasil' },
  US: { flag: '🇺🇸', label: 'Estados Unidos' },
  ES: { flag: '🇪🇸', label: 'Espanha' },
  FR: { flag: '🇫🇷', label: 'França' },
};

export const ProfileHeroCard: React.FC<{ onToggleEditModal: () => void }> = ({
  onToggleEditModal,
}) => {
  const {
    profile,
    updateProfileInfo,
    friends,
    favoriteIds,
    setIsFriendsDrawerOpen,
    setActiveNav,
    setIsAuthModalOpen,
    isLoggedIn,
    logoutFirebase,
  } = useLuminoria();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  const rankProgress = getNextRankProgress(profile.xp);
  const currentLevel = levelFromXp(profile.xp);
  const countryInfo = COUNTRY_LABELS[profile.countryCode] || COUNTRY_LABELS.PT;

  const totalHours = Math.max(0, profile.watchHours || 0);
  const hoursWhole = Math.floor(totalHours);
  const minutesRemainder = Math.round((totalHours - hoursWhole) * 60);
  const formattedWatchTime = `${hoursWhole}h ${minutesRemainder}m`;

  const activeFriendsCount = friends.filter((f) => !f.isBlocked).length;
  const watchedCount = profile.watchedCount ?? 0;
  const favsCount = favoriteIds.length;

  const handleQuickPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFileToDataUrl(file);
      updateProfileInfo({ avatarUrl: dataUrl });
    } catch {}
  };

  return (
    <section className="rounded-3xl overflow-hidden bg-[#07070B] border border-white/10 pb-8">
      {/* Dramatic Crimson or Custom Photo Widescreen Hero Banner */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#07070B]">
        {profile.coverUrl ? (
          <img
            src={profile.coverUrl}
            alt="Foto de Capa do Perfil"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 1200 450"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 w-full h-full block"
          >
            <defs>
              <linearGradient id="prof-banner-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A070E" />
                <stop offset="50%" stopColor="#8B0D18" />
                <stop offset="100%" stopColor="#1A050A" />
              </linearGradient>
              <radialGradient id="prof-banner-glow" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#7F1D1D" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#07070B" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="450" fill="url(#prof-banner-bg)" />
            <rect width="1200" height="450" fill="url(#prof-banner-glow)" />

            {/* Triptych diagonal split lines */}
            <line x1="420" y1="0" x2="360" y2="450" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />
            <line x1="820" y1="0" x2="770" y2="450" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />

            {/* Three dramatic portrait silhouettes */}
            <circle cx="210" cy="155" r="78" fill="#2A080C" />
            <path d="M70 430 C80 285, 140 245, 210 245 C280 245, 340 285, 350 430 Z" fill="#1E0609" />

            <circle cx="600" cy="140" r="82" fill="#32090E" />
            <path d="M450 430 C460 275, 525 235, 600 235 C675 235, 740 275, 750 430 Z" fill="#24070B" />

            <circle cx="1000" cy="155" r="78" fill="#2A080C" />
            <path d="M860 430 C870 285, 930 245, 1000 245 C1070 245, 1130 285, 1140 430 Z" fill="#1E0609" />

            {/* Retro Serif Outlined Backdrop Title */}
            <text
              x="600"
              y="290"
              textAnchor="middle"
              fill="none"
              stroke="#F4F4F6"
              strokeOpacity="0.55"
              strokeWidth="3"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="68"
              letterSpacing="8"
            >
              STRANGER
            </text>
          </svg>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#07070B] via-[#07070B]/40 to-transparent pointer-events-none" />

        {/* Top-left Archive / Edit Profile & Cover Trigger Buttons */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleEditModal}
            title="Editar Perfil e Preferências"
            className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-xs font-bold text-white hover:bg-black/85 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Archive className="w-4 h-4 text-cyan-400" />
            <span>Editar Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCoverModalOpen(true)}
            title="Alterar Foto de Capa do Perfil"
            className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-xs font-bold text-white hover:bg-black/85 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Foto de Capa</span>
          </button>
        </div>

        {/* Top-right Login / Cadastro & Sair Account Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {isLoggedIn && (
            <button
              type="button"
              onClick={logoutFirebase}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 backdrop-blur-md border border-rose-400/40 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sair da conta e voltar à tela de login"
            >
              <LogIn className="w-4 h-4 rotate-180" />
              <span>Sair</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md border border-cyan-400/40 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Conta</span>
          </button>
        </div>
      </div>

      {/* Centered Overlapping Glowing Avatar + Level Badge + Direct Photo Upload */}
      <div className="px-4 sm:px-8 -mt-20 relative z-10 flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          <div
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 flex items-center justify-center bg-[#09090D]"
            style={{
              border: '3.5px solid #EC4899',
              boxShadow: '0 0 38px rgba(236, 72, 153, 0.8), 0 0 14px rgba(168, 85, 247, 0.65)',
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              /* Stylized Portrait Avatar */
              <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#2A2D3E] to-[#121526] flex flex-col items-center justify-end relative">
                <div className="w-12 h-12 rounded-full bg-[#D2A68E] mb-1 border border-white/20" />
                <div className="w-24 h-12 rounded-t-3xl bg-[#0D3B8C]" />
              </div>
            )}
          </div>

          {/* Direct Upload Profile Photo Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Fazer upload de foto de perfil"
            title="Trocar Foto de Perfil (Upload do Dispositivo)"
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black flex items-center justify-center border-2 border-[#09090D] shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQuickPhotoUpload}
            className="hidden"
          />

          {/* Online Presence Dot */}
          <span
            title="Online agora"
            className="absolute bottom-1 left-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#09090D] shadow-[0_0_10px_#10B981]"
          />

          {/* Floating Top-Right Level Badge (Level 5 / Current Level) */}
          <div
            className="absolute -top-1 -right-2 w-12 h-12 rounded-full bg-[#09090D] border-2 border-[#00E5FF] flex flex-col items-center justify-center shadow-lg"
            style={{ boxShadow: '0 0 16px rgba(0, 229, 255, 0.45)' }}
          >
            <span className="text-[9px] text-[#A0A0B0] uppercase leading-none">Level</span>
            <span className="text-sm font-extrabold font-mono text-white leading-tight">
              {currentLevel}
            </span>
          </div>
        </div>

        {/* Username + Unique Instagram @handle + Crown (Admin only) */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-wide text-white uppercase flex items-center justify-center gap-2">
            <span>{profile.username}</span>
            {(profile.username.toUpperCase().includes('ADM') || profile.email === 'rafaaprodrigu3s@gmail.com') && (
              <span aria-hidden="true" title="Administrador Verificado">👑</span>
            )}
          </h1>
          <p className="text-xs sm:text-sm font-mono font-bold text-cyan-400">
            {profile.handle || `@${profile.username.toLowerCase().replace(/[^a-z0-9._]/g, '_')}`}
          </p>
        </div>

        {/* RANK Section */}
        <div className="w-full max-w-md space-y-2.5">
          <p className="text-[11px] font-mono tracking-[0.22em] text-[#A0A0B0] uppercase">
            RANK
          </p>

          <div className="p-3.5 rounded-2xl bg-[#131520] border border-white/10 flex items-center justify-between px-5 shadow-inner">
            <div
              className="w-12 h-12 rounded-full bg-[#0A1929] border-2 border-[#00E5FF] flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 0 18px rgba(0, 229, 255, 0.4)' }}
            >
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <span className="flex-1 text-center text-lg sm:text-xl font-extrabold font-display tracking-wider text-white uppercase pr-6">
              {rankProgress.currentRank.name}
            </span>
          </div>

          {/* Cyan/Teal XP Progress Bar */}
          <div className="w-full h-2 bg-[#171923] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, rankProgress.progressPercent))}%`,
                backgroundImage: 'linear-gradient(90deg, #00B8D4 0%, #00E5FF 100%)',
              }}
            />
          </div>

          <p className="text-xs font-mono text-[#A0A0B0] tabular-nums">
            {profile.xp} / {rankProgress.nextRank?.xpRequired || 15000} XP
          </p>
        </div>

        {/* Bio & Marital / Country / City Row */}
        <p className="text-sm text-[#D4D4E0]">{profile.bio}</p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-[#F4F4F6]">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-current text-pink-500" />
            <span>{profile.maritalStatus}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span>{countryInfo.flag}</span>
            <span>{countryInfo.label}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>{profile.city || 'coimbra'}</span>
          </span>
        </div>

        {/* Colorful Genre Pills Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {profile.favoriteGenres.map((genre) => (
            <span
              key={genre}
              className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-white uppercase shadow-sm"
              style={{ backgroundColor: GENRE_COLORS[genre] || '#D81B60' }}
            >
              {genre}
            </span>
          ))}
        </div>

        {/* 4-Card Bento Stats Grid (AMIGOS, VISTOS, FAVS, TEMPO — 4 columns on mobile & desktop) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-xl pt-3">
          <button
            type="button"
            onClick={() => setIsFriendsDrawerOpen(true)}
            className="p-3 sm:p-4 rounded-2xl bg-[#11131C] hover:bg-[#161926] border border-white/10 flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer"
          >
            <Users className="w-5 h-5 text-[#00B8D4] mb-0.5" />
            <span className="text-base sm:text-lg font-extrabold font-mono text-white tabular-nums">
              {activeFriendsCount}
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#A0A0B0] uppercase">
              AMIGOS
            </span>
          </button>

          <div className="p-3 sm:p-4 rounded-2xl bg-[#11131C] border border-white/10 flex flex-col items-center justify-center space-y-1">
            <History className="w-5 h-5 text-[#00B8D4] mb-0.5" />
            <span className="text-base sm:text-lg font-extrabold font-mono text-white tabular-nums">
              {watchedCount}
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#A0A0B0] uppercase">
              VISTOS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveNav('favorites')}
            className="p-3 sm:p-4 rounded-2xl bg-[#11131C] hover:bg-[#161926] border border-white/10 flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer"
          >
            <Heart className="w-5 h-5 text-[#00B8D4] fill-current mb-0.5" />
            <span className="text-base sm:text-lg font-extrabold font-mono text-white tabular-nums">
              {favsCount}
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#A0A0B0] uppercase">
              FAVS
            </span>
          </button>

          <div className="p-3 sm:p-4 rounded-2xl bg-[#11131C] border border-white/10 flex flex-col items-center justify-center space-y-1">
            <Clock className="w-5 h-5 text-[#00B8D4] mb-0.5" />
            <span className="text-sm sm:text-lg font-extrabold font-mono text-white tabular-nums whitespace-nowrap">
              {formattedWatchTime}
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#A0A0B0] uppercase">
              TEMPO
            </span>
          </div>
        </div>
      </div>

      <CoverPhotoModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
      />
    </section>
  );
};
