import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Tv,
  Zap,
} from 'lucide-react';
import {
  buildAndroidNativeIntentUrls,
  isPlaceholderStreamUrl,
} from '../../services/streamUrlHelper';
import {
  buildApiUrl,
  openInAppNativeAndroidPlayer,
  openNativeAndroidPlayer,
} from '../../services/apiConfig';

interface AndroidNativePlayerBarProps {
  streamUrl: string;
  title: string;
  isAndroidNativeMode: boolean;
  onToggleAndroidNativeMode: () => void;
}

export const AndroidNativePlayerBar: React.FC<AndroidNativePlayerBarProps> = ({
  streamUrl,
  title,
  isAndroidNativeMode,
  onToggleAndroidNativeMode,
}) => {
  const [resolvedEdgeUrl, setResolvedEdgeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResolvedEdgeUrl(null);
    if (!streamUrl || isPlaceholderStreamUrl(streamUrl)) return;

    let cancelled = false;
    fetch(buildApiUrl(`/api/resolve-stream?url=${encodeURIComponent(streamUrl)}`))
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.resolvedUrl && data.resolvedUrl !== streamUrl) {
          setResolvedEdgeUrl(data.resolvedUrl);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [streamUrl]);

  const effectiveUrl = resolvedEdgeUrl || streamUrl;
  const primaryIntents = buildAndroidNativeIntentUrls(effectiveUrl, title);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(primaryIntents.directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const handleOpenPrimaryNative = (e: React.MouseEvent) => {
    const openedInApp = openInAppNativeAndroidPlayer(effectiveUrl, title);
    if (openedInApp) {
      e.preventDefault();
      return;
    }
    const openedExternal = openNativeAndroidPlayer(effectiveUrl, title, '');
    if (openedExternal) {
      e.preventDefault();
    }
  };

  const handleOpenVlc = (e: React.MouseEvent) => {
    const opened = openNativeAndroidPlayer(effectiveUrl, title, 'org.videolan.vlc');
    if (opened) e.preventDefault();
  };

  const handleOpenMx = (e: React.MouseEvent) => {
    const opened = openNativeAndroidPlayer(effectiveUrl, title, 'com.mxtech.videoplayer.ad');
    if (opened) e.preventDefault();
  };

  const isIos = primaryIntents.platform === 'ios';

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B121E] via-[#0F172A] to-[#0B121E] border border-cyan-500/30 space-y-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>{isIos ? 'Motor Nativo iPhone & Anti-Bloqueio' : 'Motor Nativo Android & Anti-Bloqueio IPTV'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isIos ? 'AVPLAYER APPLE / H.264 & HEVC' : 'EXOPLAYER / CODEC H.264 & MKV'}
              </span>
            </h4>
            <p className="text-[11px] text-white/65">
              {isIos
                ? 'No iPhone, use o AVPlayer em Tela Cheia ou abra direto no app VLC/Infuse sem aviso de certificado:'
                : 'Se o servidor da lista bloquear o navegador ou usar áudio AC3/MKV, ative o Player Nativo Android abaixo:'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleAndroidNativeMode}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            isAndroidNativeMode
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>
            {isAndroidNativeMode
              ? 'Player Nativo Interno: ATIVO'
              : isIos
              ? 'Ativar Controles Nativos iOS'
              : 'Ativar Player Nativo Interno (Android)'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        {/* 1. Primary Native Android Hardware Player */}
        <a
          href={primaryIntents.primaryNativeUrl}
          onClick={handleOpenPrimaryNative}
          className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span className="truncate">{primaryIntents.primaryNativeLabel}</span>
        </a>

        {/* 2. VLC Player */}
        <a
          href={primaryIntents.vlcUrl}
          onClick={handleOpenVlc}
          className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{primaryIntents.vlcLabel}</span>
        </a>

        {/* 3. MX Player */}
        <a
          href={primaryIntents.secondaryPlayerUrl}
          onClick={handleOpenMx}
          className="px-3.5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Tv className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{primaryIntents.secondaryPlayerLabel}</span>
        </a>

        {/* 4. Copy Direct Stream Link */}
        <button
          type="button"
          onClick={handleCopyUrl}
          className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300">Link Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Copiar Link Direto</span>
            </>
          )}
        </button>
      </div>

      {resolvedEdgeUrl && (
        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-white/60 border-t border-white/10">
          <span className="truncate">Rota CDN Direta identificada para este conteúdo</span>
          <button
            type="button"
            onClick={handleOpenPrimaryNative}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline shrink-0 cursor-pointer"
          >
            Abrir Rota Direta no Player Nativo →
          </button>
        </div>
      )}
    </div>
  );
};
