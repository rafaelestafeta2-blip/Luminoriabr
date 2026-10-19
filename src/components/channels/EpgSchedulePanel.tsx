import React from 'react';
import { Bell, Calendar, Clock, Tv } from 'lucide-react';
import { Channel } from '../../types/luminoria';

interface EpgSchedulePanelProps {
  channel: Channel;
  onSetReminder: (programTitle: string) => void;
}

export const EpgSchedulePanel: React.FC<EpgSchedulePanelProps> = ({
  channel,
  onSetReminder,
}) => {
  const currentProgram = channel.currentPrograms[0] || {
    id: 'prog-live',
    title: `Programação Ao Vivo: ${channel.name}`,
    startTime: 'Ao Vivo',
    endTime: 'Contínuo',
    category: channel.groupName,
    progress: 45,
  };

  const upcomingPrograms = [
    {
      time: '18:00 - 19:30',
      title: `${channel.name} Especial HD`,
      category: channel.groupName,
    },
    {
      time: '19:30 - 21:00',
      title: 'Jornal & Notícias em Tempo Real',
      category: 'Informativo',
    },
    {
      time: '21:00 - 23:00',
      title: 'Sessão Cinema 4K Ao Vivo',
      category: 'Entretenimento',
    },
  ];

  return (
    <div className="rounded-2xl bg-[#0E0F17] border border-white/10 p-5 space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              Guia Eletrônico (EPG)
            </h3>
            <p className="text-xs text-white/50">Grade de programação em tempo real</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            EPG Ativo
          </span>
        </div>

        {/* Current Live Program with Progress Bar */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-400 font-bold uppercase text-[11px]">
              {currentProgram.category}
            </span>
            <span className="text-white/60 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {currentProgram.startTime} - {currentProgram.endTime}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white leading-snug">
            {currentProgram.title}
          </h4>

          {/* Real-time Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${currentProgram.progress || 50}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
              <span>Em exibição</span>
              <span>{currentProgram.progress || 50}% concluído</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSetReminder(currentProgram.title)}
            className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
          >
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lembrar no EPG</span>
          </button>
        </div>

        {/* Upcoming Schedule */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-white/60 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            A Seguir na Programação
          </p>

          <div className="space-y-2">
            {upcomingPrograms.map((prog, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{prog.title}</p>
                  <p className="text-[11px] text-white/40">{prog.category}</p>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 shrink-0">
                  {prog.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
