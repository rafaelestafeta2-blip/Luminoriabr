import React, { useEffect, useState } from 'react';
import { Award, Check, Cloud, LogIn, LogOut, Palette, Settings2, Shield } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { COLOR_SCHEME_PRESETS } from '../data/seedData';
import { PROFILE_RANKS } from '../utils/luminoriaLogic';
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
  } = useLuminoria();

  const [showEditPanel, setShowEditPanel] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [bioInput, setBioInput] = useState(profile.bio);
  const [cityInput, setCityInput] = useState(profile.city || 'coimbra');
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setUsernameInput(profile.username);
    setBioInput(profile.bio);
    setCityInput(profile.city || 'coimbra');
  }, [profile.username, profile.bio, profile.city]);

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileInfo({
      username: usernameInput.trim().slice(0, 40) || profile.username,
      bio: bioInput.trim().slice(0, 240),
      city: cityInput.trim().slice(0, 32) || 'coimbra',
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Top Hero Profile Card (Exact Match to Screenshot 2) */}
      <ProfileHeroCard onToggleEditModal={() => setShowEditPanel((v) => !v)} />

      {/* Vertical Watch History Timeline (Exact Match to Screenshot 1: | LINHA DO TEMPO) */}
      <ProfileTimeline />

      {/* Firebase Cloud Sync & Edit Toggle Bar */}
      <section className="p-5 rounded-2xl bg-[#111118] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Cloud className="w-4 h-4" />
            <span>
              {authUser
                ? `Persistência Firestore Ativa · UID: ${authUser.uid.slice(0, 10)}...`
                : 'Firebase Firestore Provisionado · Sincronize Perfil, Ranking e Alertas'}
            </span>
          </div>
          {authError && <p className="text-xs text-rose-400 font-mono">{authError}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowEditPanel((v) => !v)}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>{showEditPanel ? 'Ocultar Editor' : 'Editar Perfil & Temas'}</span>
          </button>

          {authUser ? (
            <button
              type="button"
              onClick={logoutFirebase}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sair ({isCloudSynced ? 'Sincronizado' : 'Online'})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-semibold flex items-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar com Google (Firestore)</span>
            </button>
          )}
        </div>
      </section>

      {/* Collapsible Profile Editor & ColorScheme Switcher */}
      {showEditPanel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl bg-[#111118] border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-white">
                Editar Perfil & Gêneros
              </h2>
              {savedBanner && (
                <span className="text-xs font-mono text-emerald-400">Salvo com sucesso!</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="profile-username" className="block text-xs text-[#A0A0B0]">
                  Nome
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
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${
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
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: activeScheme.primaryHex }}
            >
              Salvar Alterações
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
              {COLOR_SCHEME_PRESETS.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => setSchemeById(scheme.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                    activeScheme.id === scheme.id
                      ? 'bg-white/10 border-white text-white'
                      : 'bg-[#09090D] border-white/10 text-[#A0A0B0]'
                  }`}
                >
                  <span className="text-xs font-semibold text-white">{scheme.name}</span>
                  <span
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${scheme.primaryHex}, ${scheme.secondaryHex})`,
                    }}
                  />
                </button>
              ))}
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
