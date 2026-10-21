import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Calendar, Check, Clock, Radio, Tv } from 'lucide-react';
import { Channel } from '../../types/luminoria';
import {
  buildLiveSynchronizedEpg,
  DetailedEpgProgram,
  fetchChannelEpgSchedule,
} from '../../services/epgService';

interface EpgSchedulePanelProps {
  channel: Channel;
  onSetReminder: (programTitle: string, startTime?: string) => void;
}

export const EpgSchedulePanel: React.FC<EpgSchedulePanelProps> = ({
  channel,
  onSetReminder,
}) => {
  const [programs, setPrograms] = useState<DetailedEpgProgram[]>(() =>
    buildLiveSynchronizedEpg(channel)
  );
  const [scheduledIds, setScheduledIds] = useState<string[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    let active = true;
    setPrograms(buildLiveSynchronizedEpg(channel));

    fetchChannelEpgSchedule(channel).then((res) => {
      if (active && res.length > 0) {
        setPrograms(res);
      }
    });

    const interval = setInterval(() => {
      setCurrentTimeStr(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
      setPrograms((prev) =>
        prev.length > 0 ? buildLiveSynchronizedEpg(channel, new Date()) : prev
      );
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [channel]);

  const currentProgram = programs[0] || buildLiveSynchronizedEpg(channel)[0];
  const upcomingPrograms = programs.slice(1);

  const handleToggleReminder = (prog: DetailedEpgProgram) => {
    if (!scheduledIds.includes(prog.id)) {
      setScheduledIds((prev) => [...prev, prog.id]);
    }
    onSetReminder(prog.title, prog.startTime);
  };

  return (
    <div className="rounded-2xl bg-[#0E0F17] border border-white/10 p-5 space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        {/* EPG Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              Guia Eletrônico (EPG)
            </h3>
            <p className="text-xs text-white/50">
              Sincronizado em tempo real · Agora {currentTimeStr}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            EPG Ativo
          </span>
        </div>

        {/* Current Live Program with Real-Time Progress Bar */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/30 to-black/60 border border-cyan-500/25 space-y-3">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase text-[10px]">
              NO AR · {currentProgram.category}
            </span>
            <span className="text-white/75 font-mono text-[11px] flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-cyan-400" />
              {currentProgram.startTime} — {currentProgram.endTime}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-white leading-snug">
              {currentProgram.title}
            </h4>
            <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
              {currentProgram.description}
            </p>
          </div>

          {/* Real-time Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${currentProgram.progress || 50}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/45 font-mono">
              <span>Transmissão Ao Vivo</span>
              <span>{currentProgram.progress || 50}% exibido</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleReminder(currentProgram)}
            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              scheduledIds.includes(currentProgram.id)
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
            }`}
          >
            {scheduledIds.includes(currentProgram.id) ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alerta EPG Ativado no Firestore</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lembrar Programa no Guia EPG</span>
              </>
            )}
          </button>
        </div>

        {/* Upcoming Schedule with Individual Reminder Triggers */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-white/60 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            A Seguir na Grade ({upcomingPrograms.length} programas)
          </p>

          <div className="space-y-2">
            {upcomingPrograms.map((prog) => {
              const isScheduled = scheduledIds.includes(prog.id);
              return (
                <div
                  key={prog.id}
                  className="p-2.5 rounded-xl bg-black/35 border border-white/10 hover:border-white/20 flex items-center justify-between text-xs gap-2.5 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-cyan-300 shrink-0">
                        {prog.startTime} - {prog.endTime}
                      </span>
                      <span className="text-[10px] text-white/40 truncate">
                        • {prog.category}
                      </span>
                    </div>
                    <p className="font-bold text-white truncate">{prog.title}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleReminder(prog)}
                    aria-label={`Agendar lembrete EPG para ${prog.title}`}
                    title={isScheduled ? 'Lembrete EPG agendado' : 'Agendar alerta para este programa'}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                      isScheduled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/5 hover:bg-cyan-500/20 text-white/75 hover:text-cyan-300 border border-white/10'
                    }`}
                  >
                    {isScheduled ? (
                      <>
                        <BellRing className="w-3 h-3 text-emerald-400" />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3 h-3 text-cyan-400" />
                        <span>Lembrar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

