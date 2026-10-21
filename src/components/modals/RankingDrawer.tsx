import React, { useState } from 'react';
import { Check, Trophy, UserPlus, X } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { coinsForRank } from '../../utils/luminoriaLogic';

export const RankingDrawer: React.FC = () => {
  const {
    isRankDrawerOpen,
    setIsRankDrawerOpen,
    rankEntries,
    profile,
    friends,
    addFriendByUsername,
  } = useLuminoria();
  const [showFullRules, setShowFullRules] = useState(false);
  const [addedUsernames, setAddedUsernames] = useState<string[]>([]);

  if (!isRankDrawerOpen) return null;

  const handleQuickAddFriend = (username: string) => {
    const res = addFriendByUsername(username);
    if (res.ok) {
      setAddedUsernames((prev) => [...prev, username]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Ranking Global Top 20 Mensal"
    >
      <div
        className="w-full max-w-md bg-[#0B0C10] border-r border-white/10 h-full flex flex-col justify-between"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Header matching Screenshot 1 */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Trophy className="w-8 h-8 text-[#FACC15] shrink-0" />
            <div>
              <h2 className="text-xl font-extrabold font-display tracking-wide text-white uppercase leading-tight">
                RANKING GLOBAL
              </h2>
              <p className="text-xs font-bold text-[#FACC15]">
                Top 20 Mensal · Sincronizado no Firestore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRankDrawerOpen(false)}
            aria-label="Fechar Ranking Global"
            className="w-10 h-10 rounded-full text-[#A0A0B0] hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Ranking List matching Screenshot 1 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {rankEntries.map((entry) => {
            const r = entry.rank;
            const isTop1 = r === 1;
            const isTop2 = r === 2;
            const isTop3 = r === 3;
            const isMe = Boolean(
              (profile.userId && entry.userId === profile.userId) ||
              (profile.username && entry.username.toLowerCase() === profile.username.toLowerCase())
            );
            const isAlreadyFriend =
              friends.some((f) => f.username.toLowerCase() === entry.username.toLowerCase()) ||
              addedUsernames.includes(entry.username);

            const cardClass = isTop1
              ? 'bg-[#1D1A10] border-[#CA8A04]/75'
              : isTop2
              ? 'bg-[#171920] border-[#94A3B8]/55'
              : isTop3
              ? 'bg-[#1D1511] border-[#B45309]/65'
              : isMe
              ? 'bg-[#141A29] border-cyan-500/50'
              : 'bg-[#14161D] border-white/5';

            const rankTextColor = isTop1
              ? 'text-[#FACC15] italic'
              : isTop2
              ? 'text-[#CBD5E1] italic'
              : isTop3
              ? 'text-[#D97706] italic'
              : 'text-white';

            const nameTextColor = isTop1
              ? 'text-[#FACC15]'
              : isTop2
              ? 'text-white'
              : isTop3
              ? 'text-[#D97706]'
              : 'text-white';

            const initial = entry.username.charAt(0).toUpperCase();
            const showLetterOnly =
              entry.username.startsWith('naikel') || entry.username.startsWith('thiago');
            const avatarSrc = isMe ? profile.avatarUrl || entry.avatarUrl : entry.avatarUrl;

            return (
              <div
                key={entry.userId}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${cardClass}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-8 text-center text-lg font-extrabold font-mono shrink-0 ${rankTextColor}`}
                  >
                    #{r}
                  </span>

                  {/* Circular Avatar */}
                  <div
                    className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-base font-bold text-white border border-white/15 overflow-hidden"
                    style={{ backgroundColor: entry.avatarColor || '#334155' }}
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={entry.username}
                        className="w-full h-full object-cover"
                      />
                    ) : showLetterOnly ? (
                      <span>{initial}</span>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-end bg-gradient-to-b from-sky-400/30 to-slate-900">
                        <span className="w-4 h-4 rounded-full bg-[#E2B897] mb-0.5" />
                        <span className="w-8 h-4 rounded-t-full bg-white/80" />
                      </div>
                    )}
                  </div>

                  {/* Username & Watch Time */}
                  <div className="min-w-0">
                    <p className={`text-sm sm:text-base font-bold truncate ${nameTextColor}`}>
                      {entry.username}
                      {entry.isAdminCrown && <span className="ml-1">👑</span>}
                      {isMe && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                          VOCÊ
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#8E929F] truncate">
                      {entry.watchTimeFormatted || `${entry.watchHours}h assistidos`} ·{' '}
                      <span className="text-cyan-400 font-mono">{entry.xp} XP</span>
                    </p>
                  </div>
                </div>

                {/* Right Trophy Icon or Add Friend Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleQuickAddFriend(entry.username)}
                      disabled={isAlreadyFriend}
                      title={
                        isAlreadyFriend
                          ? 'Já está nos seus amigos'
                          : `Adicionar ${entry.username} aos amigos`
                      }
                      aria-label={`Adicionar ${entry.username} aos amigos`}
                      className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isAlreadyFriend
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 hover:bg-cyan-500/20 border-white/10 text-cyan-400'
                      }`}
                    >
                      {isAlreadyFriend ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {r <= 3 ? (
                    <Trophy
                      className={`w-6 h-6 shrink-0 ${
                        isTop1
                          ? 'text-[#FACC15]'
                          : isTop2
                          ? 'text-[#CBD5E1]'
                          : 'text-[#D97706]'
                      }`}
                    />
                  ) : (
                    showFullRules && (
                      <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                        +{coinsForRank(r)} Lumin.
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {showFullRules && (
            <div className="p-4 rounded-2xl bg-[#161822] border border-amber-500/30 space-y-2 text-xs text-[#D4D4E0]">
              <p className="font-bold text-[#FACC15]">Regras & Prémios do Mês (Luminárias):</p>
              <p>• 1º Lugar: +1000 Luminárias + Borda Soberano Solar</p>
              <p>• 2º Lugar: +750 Luminárias · 3º Lugar: +500 Luminárias</p>
              <p>• 4º ao 10º Lugar: +250 Luminárias creditadas automaticamente no dia 1.</p>
            </div>
          )}
        </div>

        {/* Bottom CTA matching Screenshot 1 */}
        <div className="p-4 pt-2 border-t border-white/10 space-y-2 text-center bg-[#0B0C10]">
          <button
            type="button"
            onClick={() => setShowFullRules((v) => !v)}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#332A14] hover:bg-[#3F3418] border border-[#CA8A04]/70 text-sm font-extrabold font-display tracking-wider text-white uppercase transition-colors"
          >
            {showFullRules ? 'OCULTAR REGRAS DO MÊS' : 'VER RANKING COMPLETO'}
          </button>
          <p className="text-xs text-[#8E929F]">
            Pódio, prémios em moedas e regras do mês
          </p>
        </div>
      </div>
    </div>
  );
};
