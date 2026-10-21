import React, { useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Chrome,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import {
  compressAvatarFileToDataUrl,
  STUDIO_AVATAR_PRESETS,
} from '../../utils/avatarUploadHelper';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithCredentials,
    registerNewAccount,
    loginWithGoogle,
    authError,
  } = useLuminoria();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('BR');
  const [city, setCity] = useState('São Paulo');
  const [avatarUrl, setAvatarUrl] = useState<string>(STUDIO_AVATAR_PRESETS[0].url);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isAuthModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFileToDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err: any) {
      setStatusMsg({ ok: false, text: err?.message || 'Erro ao carregar foto.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginWithCredentials(email, password);
        setStatusMsg({ ok: res.ok, text: res.message });
        if (res.ok) {
          setTimeout(() => setIsAuthModalOpen(false), 900);
        }
      } else {
        const res = await registerNewAccount({
          username,
          email,
          password,
          countryCode,
          city,
          avatarUrl,
        });
        setStatusMsg({ ok: res.ok, text: res.message });
        if (res.ok) {
          setTimeout(() => setIsAuthModalOpen(false), 1100);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Autenticação e Cadastro Luminoria"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0D0F18] border border-white/15 shadow-2xl overflow-hidden">
        {/* Top Gradient Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-cyan-950/40 to-transparent border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold font-display text-white tracking-wide">
                LUMINORIA ID · CLOUD
              </h2>
              <p className="text-xs text-white/55">
                Sincronize Perfil, Favoritos, Amigos e Ranking no Firebase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            aria-label="Fechar janela de login"
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 rounded-xl bg-[#07080D] border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setStatusMsg(null);
            }}
            className={`py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setStatusMsg(null);
            }}
            className={`py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#E91E8C] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {mode === 'register' && (
            <>
              {/* Avatar Upload & Quick Preset Studio */}
              <div className="flex flex-col items-center space-y-2.5 pb-2">
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil selecionada"
                    className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 shadow-md cursor-pointer"
                    title="Enviar foto do seu dispositivo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {STUDIO_AVATAR_PRESETS.slice(0, 5).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border transition-transform cursor-pointer ${
                        avatarUrl === preset.url
                          ? 'border-cyan-400 scale-110'
                          : 'border-white/20 opacity-70 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/75 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Nome de Exibição / Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: LucasCinema4K"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080D] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/75">País</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#07080D] border border-white/15 text-xs text-white"
                  >
                    <option value="BR">🇧🇷 Brasil (BR)</option>
                    <option value="PT">🇵🇹 Portugal (PT)</option>
                    <option value="US">🇺🇸 EUA (US)</option>
                    <option value="ES">🇪🇸 Espanha (ES)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/75 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" /> Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Sua cidade"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#07080D] border border-white/15 text-xs text-white"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/75 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              E-mail da Conta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080D] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/75 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080D] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {(statusMsg || authError) && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMsg?.ok
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
              }`}
            >
              {statusMsg?.ok && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMsg?.text || authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            {isLoading
              ? 'Autenticando...'
              : mode === 'login'
              ? 'Entrar na Plataforma'
              : 'Concluir Cadastro & Ganhar +2.500 Luminárias'}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-white/40">
              ou sincronizar via Google Cloud
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <button
            type="button"
            onClick={async () => {
              await loginWithGoogle();
              setIsAuthModalOpen(false);
            }}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-blue-600" />
            <span>Continuar com Google (Firebase Auth)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
