import React, { useState } from 'react';
import { Play, Pause, Send, Users, Sparkles, FastForward, Rewind, Film, BellRing } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { NativeVideoPlayer } from '../components/player/NativeVideoPlayer';

const REACTION_EMOJIS = ['🔥', '🍿', '🤯', '👏', '❤️'];

export const CinemaRoomScreen: React.FC = () => {
  const {
    cinemaRoom,
    vodItems,
    friends,
    joinOrCreateCinemaRoom,
    toggleCinemaPlay,
    seekCinemaTime,
    sendCinemaChatMessage,
    triggerCinemaFriendJoinedAlert,
    awardWatchSession,
    activeScheme,
  } = useLuminoria();

  const [codeInput, setCodeInput] = useState('');
  const [codeFeedback, setCodeFeedback] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const currentVod = vodItems.find((v) => v.id === cinemaRoom.vodId) || vodItems[0];

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const res = joinOrCreateCinemaRoom(codeInput);
    setCodeFeedback(res.message);
    if (res.ok) setCodeInput('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    sendCinemaChatMessage(chatText);
    setChatText('');
  };

  const handleTriggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    awardWatchSession(15, 2);
    setTimeout(() => setActiveReaction(null), 1600);
  };

  const progressPct = Math.round((cinemaRoom.currentTimeSec / cinemaRoom.durationSec) * 100);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & 6-Char Room Code Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#A0A0B0] mb-1">
            <span>Sessão Sincronizada em Tempo Real</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-amber-400">CÓDIGO #{cinemaRoom.code}</span>
            <span aria-hidden="true">·</span>
            <span>Host: {cinemaRoom.hostName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Sala de Cinema Luminoria
          </h1>
        </div>

        {/* Join / Switch Room by 6-Character Code */}
        <form onSubmit={handleJoinByCode} className="flex flex-wrap items-center gap-2">
          <label htmlFor="cinema-code-input" className="sr-only">
            Código de 6 caracteres da sala
          </label>
          <input
            id="cinema-code-input"
            type="text"
            maxLength={6}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Ex: VIP4K1"
            className="w-40 px-3.5 py-2 rounded-lg bg-[#111118] border border-white/15 text-xs font-mono tracking-widest text-white uppercase placeholder-[#A0A0B0]/60 focus:outline-none focus:border-[#E91E8C]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Trocar / Criar Sala
          </button>
        </form>
      </div>

      {codeFeedback && (
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-amber-300 font-mono">
          {codeFeedback}
        </div>
      )}

      {/* Main Cinema Viewport + Live Chat Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Synchronized Video Player & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/15 flex flex-col justify-between">
            <NativeVideoPlayer
              title={currentVod.title}
              streamUrl={currentVod.streamUrl}
              rawStreamUrl={currentVod.streamUrl}
              posterUrl={currentVod.posterUrl}
              backdropUrl={currentVod.backdropUrl}
              category={currentVod.category}
              year={currentVod.year}
            />

            {/* Floating Reaction Overlay */}
            {activeReaction && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                aria-live="polite"
              >
                <div className="px-6 py-4 rounded-2xl bg-black/75 border border-white/20 text-4xl animate-bounce">
                  {activeReaction}
                </div>
              </div>
            )}

            <div className="relative z-10 p-5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent text-xs">
              <div className="flex items-center gap-2 text-white">
                <Film className="w-4 h-4 text-[#E91E8C]" />
                <span className="font-semibold">{currentVod.title}</span>
              </div>
              <span className="font-mono text-emerald-400 tabular-nums">
                {cinemaRoom.isPlaying ? 'SINCRONIZADO · REPRODUZINDO' : 'PAUSADO PELO HOST'}
              </span>
            </div>

            <div className="relative z-10 p-5 space-y-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
              {/* Seek Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: activeScheme.primaryHex,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#A0A0B0] tabular-nums">
                  <span>{formatTime(cinemaRoom.currentTimeSec)}</span>
                  <span>{formatTime(cinemaRoom.durationSec)}</span>
                </div>
              </div>

              {/* Playback & Emoji Reaction Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCinemaPlay}
                    className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-white/90 transition-colors"
                  >
                    {cinemaRoom.isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pausar Todos</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Retomar Todos</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => seekCinemaTime(cinemaRoom.currentTimeSec - 300)}
                    aria-label="Retroceder 5 minutos"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => seekCinemaTime(cinemaRoom.currentTimeSec + 300)}
                    aria-label="Avançar 5 minutos"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Emoji Reactions */}
                <div className="flex items-center gap-1.5">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleTriggerReaction(emoji)}
                      aria-label={`Enviar reação ${emoji}`}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-transform active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Participants Strip & Movie Switcher */}
          <div className="p-5 rounded-2xl bg-[#111118] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#A0A0B0]">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Participantes na Sala ({cinemaRoom.participants.length})</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {cinemaRoom.participants.map((p) => (
                  <div key={p.id} className="text-xs text-white flex items-center gap-1.5">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[#A0A0B0]">({p.rank})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextFriend =
                    friends.find(
                      (f) =>
                        !cinemaRoom.participants.some(
                          (p) => p.name.toLowerCase() === f.username.toLowerCase()
                        )
                    )?.username || 'ElenaValkyrie';
                  triggerCinemaFriendJoinedAlert(nextFriend, cinemaRoom.code);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Simular Entrada de Amigo</span>
              </button>

              <label htmlFor="cinema-vod-select" className="text-xs text-[#A0A0B0] whitespace-nowrap">
                Trocar Filme:
              </label>
              <select
                id="cinema-vod-select"
                value={cinemaRoom.vodId}
                onChange={(e) => joinOrCreateCinemaRoom(cinemaRoom.code, e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white"
              >
                {vodItems.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Synchronized Cinema Chat */}
        <div className="rounded-2xl bg-[#111118] border border-white/10 flex flex-col justify-between h-[520px]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display text-white">Chat da Sessão #{cinemaRoom.code}</h2>
              <p className="text-[11px] text-[#A0A0B0]">Mensagens sincronizadas com a patente do perfil</p>
            </div>
            <Sparkles className="w-4 h-4 text-[#E91E8C]" />
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {cinemaRoom.messages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-xl bg-[#09090D] border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white">
                    {msg.senderName} <span className="text-[#E91E8C] font-mono">· {msg.senderRank}</span>
                  </span>
                  <span className="font-mono text-[#A0A0B0] tabular-nums">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-[#F4F4F6]/90 leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="p-4 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Comentar cena na sala..."
              aria-label="Comentar cena no chat da Sala de Cinema"
              className="flex-1 px-3.5 py-2 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white placeholder-[#A0A0B0]/50 focus:outline-none focus:border-[#E91E8C]"
            />
            <button
              type="submit"
              aria-label="Enviar mensagem no chat do cinema"
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5"
              style={{ backgroundColor: activeScheme.primaryHex }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
