import React, { useState } from 'react';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';

interface AuthLoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
}

export const AuthLoginForm: React.FC<AuthLoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const { loginWithCredentials, activeScheme } = useLuminoria();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-xs font-semibold text-white/80">
          E-mail ou @username Único
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="login-email"
            type="text"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com ou @seu_id"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080910] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-xs font-semibold text-white/80">
          Senha
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#080910] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        style={{
          backgroundImage: `linear-gradient(135deg, ${activeScheme.primaryHex}, ${activeScheme.secondaryHex})`,
          boxShadow: `0 8px 24px ${activeScheme.primaryHex}44`,
        }}
      >
        <LogIn className="w-4 h-4" />
        <span>{isLoading ? 'Entrando...' : 'Entrar no Catálogo'}</span>
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          Não tem uma conta?{' '}
          <span style={{ color: activeScheme.primaryHex }} className="font-bold underline">
            Cadastre-se grátis
          </span>
        </button>
      </div>
    </form>
  );
};
