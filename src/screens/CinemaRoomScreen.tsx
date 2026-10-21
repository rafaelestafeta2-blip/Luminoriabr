import React, { useState } from 'react';
import {
  Check,
  Copy,
  FastForward,
  Film,
  KeyRound,
  Pause,
  Play,
  RefreshCw,
  Rewind,
  Send,
  Users,
} from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { NativeVideoPlayer } from '../components/player/NativeVideoPlayer';
import { generateRandomRoomCode } from '../services/cinemaRoomService';

const REACTION_EMOJIS = ['🔥', '🍿', '🤯', '👏', '❤️'];

export const CinemaRoomScreen: React.FC = () => {
  const {
    cinemaRoom,
    vodItems,
    joinOrCreateCinemaRoom,
    toggleCinemaPlay,
    seekCinemaTime,
    sendCinemaChatMessage,
    awardWatchSession,
    addTimelineActivity,
    activeScheme,
  } = useLuminoria();

  const [codeInput, setCodeInput] = useState('');
  const [codeFeedback, setCodeFeedback] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatText, setChatText] = useState('');
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [rewardedVodId, setRewardedVodId] = useState<string | null>(null);

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

  const handleCreateNewRandomRoom = () => {
    const newCode = generateRandomRoomCode();
    const res = joinOrCreateCinemaRoom(newCode, currentVod?.id);
    setCodeFeedback(`Nova sala criada! Compartilhe o código de 6 dígitos #${newCode} com seus amigos.`);
    if (!res.ok) setCodeFeedback(res.message);
  };

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cinemaRoom.code).catch(() => {});
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    sendCinemaChatMessage(chatText);
    setChatText('');
  };

  const handleTriggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    sendCinemaChatMessage(`Reagiu à cena com ${emoji}`);
    setTimeout(() => setActiveReaction(null), 1600);
  };

  const handleWatchProgress = (seconds: number, durationSeconds: number = 120) => {
    if (!currentVod) return;
    const effectiveDur = durationSeconds > 0 ? durationSeconds : 120;
    const pct = Math.min(100, Math.round((seconds / effectiveDur) * 100));
    if (pct >= 20 && rewardedVodId !== currentVod.id) {
      awardWatchSession(120, 25);
      addTimelineActivity({
        vodId: currentVod.id,
        title: currentVod.title,
        year: currentVod.year,
        artworkKey: currentVod.artworkKey,
        category: currentVod.category,
        watchPercent: pct,
      });
      setRewardedVodId(currentVod.id);
    }
  };

  const progressPct = Math.min(
    100,
    Math.round((cinemaRoom.currentTimeSec / Math.max(1, cinemaRoom.durationSec)) * 100)
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header & 6-Char Room Code Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A0A0B0] mb-1">
            <span>Sessão Sincronizada por Código</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold text-amber-400">SALA #{cinemaRoom.code}</span>
            <span aria-hidden="true">·</span>
            <span>Host: {cinemaRoom.hostName}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copiar Código #{cinemaRoom.code}
                </>
              )}
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Sala de Cinema Luminoria
          </h1>
        </div>

        {/* Join / Switch Room by 6-Character Code */}
        <form onSubmit={handleJoinByCode} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="cinema-code-input"
              type="text"
              maxLength={6}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Código 6 dígitos"
              className="w-44 pl-8 pr-3 py-2 rounded-xl bg-[#111118] border border-white/15 text-xs font-mono tracking-widest text-white uppercase placeholder-[#A0A0B0]/60 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Entrar com Código
          </button>
          <button
            type="button"
            onClick={handleCreateNewRandomRoom}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gerar Novo Código</span>
          </button>
        </form>
      </div>

      {codeFeedback && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
          {codeFeedback}
        </div>
      )}

      {/* Main Cinema Viewport + Live Chat Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Synchronized Video Player & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/15 flex flex-col justify-between">
            {currentVod && (
              <NativeVideoPlayer
                title={currentVod.title}
                streamUrl={currentVod.streamUrl}
                rawStreamUrl={currentVod.streamUrl}
                youtubeTrailerId={currentVod.youtubeTrailerId}
                posterUrl={currentVod.posterUrl}
                backdropUrl={currentVod.backdropUrl}
                category={currentVod.category}
                year={currentVod.year}
                onWatchProgress={handleWatchProgress}
              />
            )}

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

            <div className="relative z-10 p-4 space-y-3 bg-[#0D0F18] border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white min-w-0">
                  <Film className="w-4 h-4 shrink-0" style={{ color: activeScheme.primaryHex }} />
                  <span className="font-semibold truncate">{currentVod?.title}</span>
                </div>
                <span className="font-mono text-emerald-400 tabular-nums shrink-0">
                  {cinemaRoom.isPlaying ? 'SINCRONIZADO · AO VIVO' : 'PAUSADO NA SALA'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: activeScheme.primaryHex,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#A0A0B0] tabular-nums">
                  <span>{formatTime(cinemaRoom.currentTimeSec)}</span>
                  <span>{formatTime(cinemaRoom.durationSec)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCinemaPlay}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold flex items-center gap-1.5 hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    {cinemaRoom.isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pausar Sala</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Retomar Sala</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => seekCinemaTime(cinemaRoom.currentTimeSec - 300)}
                    aria-label="Retroceder 5 minutos"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white cursor-pointer"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => seekCinemaTime(cinemaRoom.currentTimeSec + 300)}
                    aria-label="Avançar 5 minutos"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white cursor-pointer"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleTriggerReaction(emoji)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-transform active:scale-90 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Participants Strip & Movie Switcher */}
          <div className="p-4 rounded-2xl bg-[#111118] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#A0A0B0]">
                <Users className="w-4 h-4 text-amber-400" />
                <span>
                  Participantes na Sala #{cinemaRoom.code} ({cinemaRoom.participants.length})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {cinemaRoom.participants.map((p) => (
                  <div key={p.id} className="text-xs text-white flex items-center gap-1.5">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[#A0A0B0] font-mono text-[11px]">· {p.rank}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="cinema-vod-select" className="text-xs text-[#A0A0B0] whitespace-nowrap">
                Filme da Sala:
              </label>
              <select
                id="cinema-vod-select"
                value={cinemaRoom.vodId}
                onChange={(e) => joinOrCreateCinemaRoom(cinemaRoom.code, e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white max-w-[220px]"
              >
                {vodItems.slice(0, 60).map((v) => (
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
              <h2 className="text-sm font-bold font-display text-white">
                Chat Ao Vivo · Sala #{cinemaRoom.code}
              </h2>
              <p className="text-[11px] text-[#A0A0B0]">
                Apenas quem entrou com o código #{cinemaRoom.code} participa
              </p>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {cinemaRoom.messages.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#A0A0B0]">
                Nenhuma mensagem nesta sala ainda. Compartilhe o código{' '}
                <strong className="text-amber-400 font-mono">#{cinemaRoom.code}</strong> com seus amigos e comece a conversa!
              </div>
            ) : (
              cinemaRoom.messages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-xl bg-[#09090D] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">
                      {msg.senderName}{' '}
                      <span style={{ color: activeScheme.primaryHex }} className="font-mono">
                        · {msg.senderRank}
                      </span>
                    </span>
                    <span className="font-mono text-[#A0A0B0] tabular-nums">{msg.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#F4F4F6]/90 leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-4 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={`Mensagem na sala #${cinemaRoom.code}...`}
              aria-label="Comentar cena no chat da Sala de Cinema"
              className="flex-1 px-3.5 py-2 rounded-lg bg-[#09090D] border border-white/15 text-xs text-white placeholder-[#A0A0B0]/50 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Enviar mensagem no chat do cinema"
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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
