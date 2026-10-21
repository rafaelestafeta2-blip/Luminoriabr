import React, { useRef, useState } from 'react';
import { AtSign, Camera, CheckCircle2, Lock, Mail, MapPin, User, UserPlus, XCircle } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { isHandleAvailable, normalizeInstagramHandle } from '../../services/authService';
import {
  compressAvatarFileToDataUrl,
  STUDIO_AVATAR_PRESETS,
} from '../../utils/avatarUploadHelper';

interface AuthRegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'Espanha' },
];

export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { registerNewAccount, activeScheme } = useLuminoria();
  const [username, setUsername] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('BR');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(STUDIO_AVATAR_PRESETS[0].url);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedHandle = normalizeInstagramHandle(handleInput || username);
  const handleValidLength = normalizedHandle.length >= 4;
  const handleAvailable = handleValidLength && isHandleAvailable(normalizedHandle);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFileToDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch {
      setErrorMsg('Erro ao carregar a foto.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await registerNewAccount({
        username,
        handle: normalizedHandle,
        email,
        password,
        countryCode,
        city,
        avatarUrl,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Avatar Selection */}
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#080910] border border-white/10">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0 relative">
          <img src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-white/80">Foto de Perfil (Salva na Conta)</p>
          <div className="flex items-center gap-1.5 mt-1 overflow-x-auto pb-0.5">
            {STUDIO_AVATAR_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setAvatarUrl(p.url)}
                className={`w-6 h-6 rounded-full overflow-hidden border cursor-pointer ${
                  avatarUrl === p.url ? 'border-cyan-400 scale-110' : 'border-white/20 opacity-70'
                }`}
              >
                <img src={p.url} alt={p.label} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white/80 flex items-center gap-1 shrink-0 hover:bg-white/20 cursor-pointer"
            >
              <Camera className="w-3 h-3" />
              <span>Sua Foto</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Instagram-style Unique @username */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="reg-handle" className="block text-xs font-semibold text-white/80">
            ID Único (@username estilo Instagram)
          </label>
          {handleValidLength && (
            <span
              className={`text-[10px] font-mono flex items-center gap-1 ${
                handleAvailable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {handleAvailable ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> {normalizedHandle} disponível
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" /> Já em uso
                </>
              )}
            </span>
          )}
        </div>
        <div className="relative">
          <AtSign className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="reg-handle"
            type="text"
            required
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value.replace(/^@+/, '').toLowerCase())}
            placeholder="ex: rafael_cine"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#080910] border border-white/15 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-username" className="block text-xs font-semibold text-white/80">
          Nome de Exibição no Perfil
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="reg-username"
            type="text"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (!handleInput) {
                setHandleInput(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9._]/g, '_')
                    .slice(0, 20)
                );
              }
            }}
            placeholder="Seu nome ou apelido"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#080910] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor="reg-email" className="block text-xs font-semibold text-white/80">
            E-mail
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-9 pr-2.5 py-2 rounded-xl bg-[#080910] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="reg-password" className="block text-xs font-semibold text-white/80">
            Senha (mín. 6)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full pl-9 pr-2.5 py-2 rounded-xl bg-[#080910] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor="reg-country" className="block text-xs font-semibold text-white/80">
            País
          </label>
          <select
            id="reg-country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#080910] border border-white/15 text-xs text-white focus:outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="reg-city" className="block text-xs font-semibold text-white/80">
            Cidade
          </label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="reg-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sua cidade"
              className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-[#080910] border border-white/15 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !handleAvailable}
        className="w-full py-3 rounded-xl text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
        style={{
          backgroundImage: `linear-gradient(135deg, ${activeScheme.primaryHex}, ${activeScheme.secondaryHex})`,
          boxShadow: `0 8px 24px ${activeScheme.primaryHex}44`,
        }}
      >
        <UserPlus className="w-4 h-4" />
        <span>{isLoading ? 'Criando Conta...' : 'Criar @Username e Entrar'}</span>
      </button>

      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          Já possui conta?{' '}
          <span style={{ color: activeScheme.primaryHex }} className="font-bold underline">
            Faça login aqui
          </span>
        </button>
      </div>
    </form>
  );
};
