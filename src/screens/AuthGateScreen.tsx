import React, { useState } from 'react';
import { Chrome, Sparkles } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { AuthSparkyWelcome } from '../components/auth/AuthSparkyWelcome';
import { AuthLoginForm } from '../components/auth/AuthLoginForm';
import { AuthRegisterForm } from '../components/auth/AuthRegisterForm';

export const AuthGateScreen: React.FC = () => {
  const { activeScheme, loginWithGoogle } = useLuminoria();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{
        backgroundColor: '#05060A',
        backgroundImage: `radial-gradient(circle at 50% 15%, ${activeScheme.primaryHex}20 0%, transparent 60%)`,
      }}
    >
      {/* Background ambient decorative effects */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ backgroundColor: activeScheme.primaryHex }}
      />

      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Sparky Mascot Welcome Header */}
        <AuthSparkyWelcome />

        {/* Auth Card Box */}
        <div className="rounded-3xl bg-[#0D0F18]/95 backdrop-blur-xl border border-white/15 p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#07080D] border border-white/10">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* Form */}
          {tab === 'login' ? (
            <AuthLoginForm onSwitchToRegister={() => setTab('register')} />
          ) : (
            <AuthRegisterForm onSwitchToLogin={() => setTab('login')} />
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0D0F18] px-3 text-[11px] font-mono text-white/40 uppercase tracking-widest shrink-0">
              ou
            </span>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 text-[#4285F4]" />
            <span>{isGoogleLoading ? 'Conectando...' : 'Entrar com Conta Google'}</span>
          </button>
        </div>

        {/* Security / Firestore notice */}
        <p className="text-center text-[11px] text-white/40 font-mono">
          Luminoria Pro · Autenticação Segura & Persistência em Nuvem
        </p>
      </div>
    </div>
  );
};
