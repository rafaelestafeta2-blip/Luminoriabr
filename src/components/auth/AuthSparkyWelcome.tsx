import React from 'react';
import { Film, ShieldCheck, Sparkles, Tv, Users, Zap } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';

export const AuthSparkyWelcome: React.FC = () => {
  const { activeScheme } = useLuminoria();

  return (
    <div className="flex flex-col items-center text-center space-y-4 max-w-lg mx-auto">
      {/* Animated Sparky Mascot Icon Badge */}
      <div className="relative">
        <div
          className="w-20 h-20 rounded-3xl p-1 flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-105"
          style={{
            backgroundImage: `linear-gradient(135deg, ${activeScheme.primaryHex}, ${activeScheme.secondaryHex})`,
            boxShadow: `0 0 35px ${activeScheme.primaryHex}66`,
          }}
        >
          <div className="w-full h-full rounded-[22px] bg-[#0A0B12] flex items-center justify-center">
            <Zap
              className="w-10 h-10 animate-pulse"
              style={{ color: activeScheme.primaryHex }}
            />
          </div>
        </div>

        {/* Ambient Pulsing Halo */}
        <div
          className="absolute inset-0 rounded-3xl blur-xl opacity-60 animate-ping pointer-events-none"
          style={{ backgroundColor: activeScheme.primaryHex }}
        />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SPARKY ⚡ LUMINORIA PRO 4K</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
          Portal Oficial de Filmes & Séries
        </h1>
        <p className="text-xs sm:text-sm text-[#A0A0B0] leading-relaxed max-w-md">
          Para desbloquear o catálogo completo com mais de 300.000 transmissões em 4K, canais ao vivo, salas sincronizadas e salvar seus favoritos, faça login ou cadastre-se.
        </p>
      </div>

      {/* Feature highlights pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span>300k+ Filmes & Séries</span>
        </span>
        <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80 flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-pink-400" />
          <span>Canais Ao Vivo EPG</span>
        </span>
        <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Salas de Cinema</span>
        </span>
        <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Sem Dados Fake</span>
        </span>
      </div>
    </div>
  );
};
