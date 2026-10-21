import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Camera,
  Check,
  Cloud,
  LogIn,
  LogOut,
  Palette,
  Settings2,
  Shield,
  UserPlus,
} from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { COLOR_SCHEME_PRESETS } from '../data/seedData';
import { PROFILE_RANKS } from '../utils/luminoriaLogic';
import {
  compressAvatarFileToDataUrl,
  STUDIO_AVATAR_PRESETS,
} from '../utils/avatarUploadHelper';
import { ProfileHeroCard } from '../components/profile/ProfileHeroCard';
import { ProfileTimeline } from '../components/profile/ProfileTimeline';

const PROFILE_GENRES = [
  'ANIME', 'GUERRA', 'AVENTURA', 'AÇÃO', 'FICÇÃO', 'SUSPENSE', 'TERROR', 'DRAMA', 'COMÉDIA', 'ROMANCE',
];

const COUNTRIES = [
  { code: 'PT', name: 'Portugal' },
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
];

const MARITAL_OPTIONS = [
  'Solteiro(a)',
  'Namorando',
  'Casado(a)',
  'Noivo(a)',
  'Maratonando 4K',
];

export const ProfileScreen: React.FC = () => {
  const {
    profile,
    updateProfileInfo,
    activeScheme,
    setSchemeById,
    shopProducts,
    equipItem,
    authUser,
    isCloudSynced,
    authError,
    loginWithGoogle,
    logoutFirebase,
    setIsAuthModalOpen,
  } = useLuminoria();

  const [showEditPanel, setShowEditPanel] = useState(true);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [bioInput, setBioInput] = useState(profile.bio);
  const [cityInput, setCityInput] = useState(profile.city || 'coimbra');
  const [maritalInput, setMaritalInput] = useState(profile.maritalStatus || 'Solteiro(a)');
  const [savedBanner, setSavedBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setUsernameInput(profile.username);
    setBioInput(profile.bio);
    setCityInput(profile.city || 'coimbra');
    setMaritalInput(profile.maritalStatus || 'Solteiro(a)');
  }, [profile.username, profile.bio, profile.city, profile.maritalStatus]);

  const handleToggleGenre = (genre: string) => {
    const exists = profile.favoriteGenres.includes(genre);
    if (exists) {
      updateProfileInfo({
        favoriteGenres: profile.favoriteGenres.filter((g) => g !== genre),
      });
    } else if (profile.favoriteGenres.length < 4) {
      updateProfileInfo({
        favoriteGenres: [...profile.favoriteGenres, genre],
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFileToDataUrl(file);
      updateProfileInfo({ avatarUrl: dataUrl });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } catch {}
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileInfo({
      username: usernameInput.trim().slice(0, 40) || profile.username,
      bio: bioInput.trim().slice(0, 240),
      city: cityInput.trim().slice(0, 32) || 'coimbra',
      maritalStatus: maritalInput,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Top Hero Profile Card */}
      <ProfileHeroCard onToggleEditModal={() => setShowEditPanel((v) => !v)} />

      {/* Firebase Cloud Sync, Login/Cadastro & Edit Toggle Bar */}
      <section className="p-5 rounded-2xl bg-[#111118] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Cloud className="w-4 h-4" />
            <span>
              {authUser
                ? `Persistência Firestore Ativa · ${profile.email} (UID: ${authUser.uid.slice(0, 8)}...)`
                : `Conta Ativa: ${profile.username} (${profile.email}) · Sincronia Cloud & Local`}
            </span>
          </div>
          {authError && <p className="text-xs text-rose-400 font-mono">{authError}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowEditPanel((v) => !v)}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>{showEditPanel ? 'Ocultar Editor' : 'Editar Perfil & Foto'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#D81B60] text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Login / Criar Conta</span>
          </button>

          {authUser ? (
            <button
              type="button"
              onClick={logoutFirebase}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sair ({isCloudSynced ? 'Sincronizado' : 'Online'})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Auth</span>
            </button>
          )}
        </div>
      </section>

      {/* Collapsible Profile Editor, Photo Upload & ColorScheme Switcher */}
      {showEditPanel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl bg-[#111118] border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-white">
                Editar Perfil, Foto & Dados Reais
              </h2>
              {savedBanner && (
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  ✓ Perfil atualizado!
                </span>
              )}
            </div>

            {/* Profile Photo Upload + Presets */}
            <div className="p-3.5 rounded-xl bg-[#09090D] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">
                  Foto de Perfil (Upload ou Estúdio 4K)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Enviar Foto</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STUDIO_AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateProfileInfo({ avatarUrl: preset.url })}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 transition-transform cursor-pointer ${
                      profile.avatarUrl === preset.url
                        ? 'border-cyan-400 scale-105'
                        : 'border-white/15 opacity-75 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="profile-username" className="block text-xs text-[#A0A0B0]">
                  Nome de Exibição
                </label>
                <input
                  id="profile-username"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="profile-marital" className="block text-xs text-[#A0A0B0]">
                  Status / Estado Civil
                </label>
                <select
                  id="profile-marital"
                  value={maritalInput}
                  onChange={(e) => setMaritalInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white"
                >
                  {MARITAL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="profile-country" className="block text-xs text-[#A0A0B0]">
                  País
                </label>
                <select
                  id="profile-country"
                  value={profile.countryCode}
                  onChange={(e) => updateProfileInfo({ countryCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="profile-city" className="block text-xs text-[#A0A0B0]">
                  Cidade
                </label>
                <input
                  id="profile-city"
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="profile-bio" className="block text-xs text-[#A0A0B0]">
                Biografia
              </label>
              <input
                id="profile-bio"
                type="text"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs text-[#A0A0B0]">
                Gêneros Favoritos ({profile.favoriteGenres.length}/4)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE_GENRES.map((genre) => {
                  const active = profile.favoriteGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleToggleGenre(genre)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        active
                          ? 'bg-white text-black font-semibold'
                          : 'bg-[#09090D] text-[#A0A0B0] border border-white/10'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold text-white cursor-pointer"
              style={{ backgroundColor: activeScheme.primaryHex }}
            >
              Salvar Alterações no Perfil
            </button>
          </form>

          <div className="p-6 rounded-2xl bg-[#111118] border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#E91E8C]" />
              <h2 className="text-base font-bold font-display text-white">
                Esquema de Cores & Inventário
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {COLOR_SCHEME_PRESETS.map((scheme) => {
                const isSelected = activeScheme.id === scheme.id;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => setSchemeById(scheme.id)}
                    style={
                      isSelected
                        ? {
                            borderColor: scheme.primaryHex,
                            boxShadow: `0 0 16px ${scheme.primaryHex}55`,
                            backgroundColor: `${scheme.primaryHex}18`,
                          }
                        : undefined
                    }
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'text-white'
                        : 'bg-[#09090D] border-white/10 text-[#A0A0B0] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: scheme.primaryHex }}
                        />
                      )}
                      <span className="text-xs font-semibold text-white">{scheme.name}</span>
                    </div>
                    <span
                      className="w-5 h-5 rounded-full shrink-0 border border-white/20"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${scheme.primaryHex}, ${scheme.secondaryHex})`,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Bordas Desbloqueadas ({profile.ownedProductIds.length})</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.ownedProductIds.map((pid) => {
                  const prod = shopProducts.find((p) => p.id === pid);
                  if (!prod) return null;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => equipItem(pid)}
                      className="px-3 py-1.5 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white flex items-center gap-1.5"
                    >
                      {profile.equippedBorderId === pid && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{prod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Watch History Timeline (| LINHA DO TEMPO) */}
      <ProfileTimeline />

      {/* All 10 XP Patentes Ladder */}
      <section aria-labelledby="ranks-ladder-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#00E5FF]" />
          <h2 id="ranks-ladder-heading" className="text-base font-bold font-display text-white">
            Progressão de Patentes (Níveis 1 a 10)
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PROFILE_RANKS.map((r) => {
            const unlocked = profile.xp >= r.xpRequired;
            return (
              <div
                key={r.id}
                className={`p-3.5 rounded-xl border space-y-1 ${
                  unlocked
                    ? 'bg-[#11131C] border-[#00E5FF]/30 text-white'
                    : 'bg-[#09090D] border-white/5 text-[#A0A0B0]/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span>NV. {r.level}</span>
                  <span>{r.xpRequired} XP</span>
                </div>
                <p className="text-xs font-extrabold font-display">{r.name}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
