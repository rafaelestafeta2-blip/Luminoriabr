import React, { useState } from 'react';

interface PosterArtworkProps {
  variant: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  aspect?: '16:9' | '3:4' | '1:1';
  badge4k?: boolean;
  hideBottomLabel?: boolean;
}

function cleanTmdbUrl(raw?: string): string | undefined {
  if (!raw || !raw.startsWith('http')) return undefined;
  return raw
    .replace(/^http:\/\/image\.tmdb\.org/i, 'https://image.tmdb.org')
    .replace('image.tmdb.org//t/p/', 'image.tmdb.org/t/p/')
    .replace('/w600_and_h900_bestv2/', '/w500/');
}

export const PosterArtwork: React.FC<PosterArtworkProps> = ({
  variant,
  imageUrl,
  title,
  subtitle,
  className = '',
  badge4k = false,
  hideBottomLabel = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const resolvedImg = cleanTmdbUrl(imageUrl || (variant.startsWith('http') ? variant : undefined));
  const uid = `art-${variant}-${(title || 'p').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;
  const posClass = className.includes('absolute') ? '' : 'relative';

  const renderPosterScene = () => {
    switch (variant) {
      case 'tulsa_king':
        // TULSA KING (Screenshot 5): Mafia capo in charcoal suit lighting boarding pass on fire with cigar
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-tk`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1B1D21" />
                <stop offset="45%" stopColor="#5C5A54" />
                <stop offset="85%" stopColor="#121316" />
                <stop offset="100%" stopColor="#050508" />
              </linearGradient>
              <radialGradient id={`${uid}-flame`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="45%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-tk)`} />
            {/* Moody clouds */}
            <circle cx="120" cy="360" r="160" fill="#8C887E" fillOpacity="0.25" />
            <circle cx="480" cy="420" r="180" fill="#8C887E" fillOpacity="0.2" />
            {/* Charcoal Suit Shoulders & Lapels */}
            <path d="M40 880 C65 440, 155 310, 290 310 C425 310, 505 440, 540 880 Z" fill="#2A2B2E" />
            <path d="M220 310 L295 540 L365 310 Z" fill="#111215" />
            <path d="M280 355 L305 355 L315 520 L270 520 Z" fill="#09090B" />
            {/* Head & Silver Hair */}
            <circle cx="320" cy="195" r="88" fill="#B58969" />
            <path d="M235 175 C240 100, 390 100, 405 175 C380 140, 265 140, 235 175 Z" fill="#3F3F46" />
            {/* Boarding Pass JFK -> TUL */}
            <g transform="rotate(14 430 430)">
              <rect x="380" y="330" width="110" height="210" rx="6" fill="#E5E7EB" />
              <text x="435" y="385" textAnchor="middle" fill="#111827" fontFamily="monospace" fontWeight="900" fontSize="22">
                JFK
              </text>
              <text x="435" y="455" textAnchor="middle" fill="#991B1B" fontFamily="monospace" fontWeight="900" fontSize="22">
                TUL
              </text>
            </g>
            {/* Cigar & Golden Flame */}
            <line x1="335" y1="265" x2="395" y2="310" stroke="#78350F" strokeWidth="14" strokeLinecap="round" />
            <ellipse cx="400" cy="315" rx="38" ry="68" fill={`url(#${uid}-flame)`} />
          </>
        );

      case 'reacher_series':
        // REACHER (Screenshot 5): Bright sky, muscular hero in olive tee, bold orange REACHER letters
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-rc`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="60%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-rc)`} />
            <path d="M110 880 C130 440, 200 320, 300 320 C400 320, 470 440, 490 880 Z" fill="#475569" />
            <circle cx="300" cy="210" r="78" fill="#C6906E" />
            <text
              x="300"
              y="660"
              textAnchor="middle"
              fill="#F97316"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="96"
              letterSpacing="6"
            >
              REACHER
            </text>
          </>
        );

      case 'aot_theme':
        // ATTACK ON TITANS (Screenshot 2): Fiery orange sky, Colossal Titan eyes & Scout silhouette
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-aot`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#431407" />
                <stop offset="50%" stopColor="#EA580C" />
                <stop offset="85%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#1C1917" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-aot)`} />
            {/* Colossal Titan glowing eyes in clouds */}
            <circle cx="210" cy="240" r="24" fill="#E0F2FE" />
            <circle cx="390" cy="240" r="24" fill="#E0F2FE" />
            {/* Scout warrior standing on wall with dual swords */}
            <circle cx="300" cy="520" r="26" fill="#1C1917" />
            <path d="M275 550 L325 550 L340 720 L260 720 Z" fill="#292524" />
            <line x1="265" y1="620" x2="110" y2="820" stroke="#1C1917" strokeWidth="10" />
            <line x1="335" y1="620" x2="490" y2="820" stroke="#1C1917" strokeWidth="10" />
          </>
        );

      case 'naruto_theme':
        // NARUTO (Screenshot 2): Vibrant ninja orange/amber energy & headband silhouette
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-nar`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="55%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-nar)`} />
            {/* Spiky blonde hair & ninja headband */}
            <polygon points="160,260 220,120 270,210 310,105 350,210 410,130 440,260" fill="#FDE047" />
            <circle cx="300" cy="310" r="86" fill="#FDBA74" />
            <rect x="215" y="235" width="170" height="36" rx="6" fill="#1E293B" />
            <rect x="260" y="242" width="80" height="22" rx="4" fill="#CBD5E1" />
            <path d="M140 860 C165 500, 220 410, 300 410 C380 410, 435 500, 460 860 Z" fill="#EA580C" />
            <text
              x="300"
              y="690"
              textAnchor="middle"
              fill="#F97316"
              stroke="#FFFFFF"
              strokeWidth="4"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="86"
            >
              NARUTO
            </text>
          </>
        );

      case 'ryan_theme':
        // RESGATE DO SOLDADO RYAN (Screenshot 2): Parchment background with helmeted WWII soldier silhouette
        return (
          <>
            <rect width="600" height="900" fill="#E7E5E4" />
            {/* Helmet & Soldier */}
            <path d="M210 215 C210 125, 390 125, 390 215 Z" fill="#292524" />
            <circle cx="300" cy="245" r="64" fill="#A8A29E" />
            <path d="M150 620 C170 380, 230 320, 300 320 C370 320, 430 380, 450 620 Z" fill="#44403C" />
            <text
              x="300"
              y="740"
              textAnchor="middle"
              fill="#292524"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="54"
            >
              saving private ryan
            </text>
          </>
        );

      case 'fast_theme':
        // VELOZES E FURIOSOS (Screenshot 2): Dark chrome charger & blue nitro street scene
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-ff`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#090D16" />
                <stop offset="55%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-ff)`} />
            <circle cx="200" cy="240" r="78" fill="#64748B" fillOpacity="0.6" />
            <circle cx="360" cy="210" r="88" fill="#94A3B8" fillOpacity="0.7" />
            {/* Muscle Car Hood & Chrome Supercharger */}
            <polygon points="40,680 560,520 580,820 40,860" fill="#0EA5E9" fillOpacity="0.45" />
            <rect x="260" y="470" width="130" height="75" rx="12" fill="#E2E8F0" />
            <text
              x="340"
              y="735"
              textAnchor="middle"
              fill="#F8FAFC"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="62"
              transform="rotate(-12 340 735)"
            >
              FAST &amp; FURIOUS
            </text>
          </>
        );

      case 'origem_series':
        // ORIGEM (2022) (Screenshot 3): Golden yellow textured backdrop & mysterious forest figures
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-or`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="55%" stopColor="#CA8A04" />
                <stop offset="100%" stopColor="#1C1917" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-or)`} />
            <circle cx="300" cy="310" r="82" fill="#422006" />
            <path d="M150 850 C175 490, 235 410, 300 410 C365 410, 425 490, 450 850 Z" fill="#292524" />
            <text
              x="300"
              y="680"
              textAnchor="middle"
              fill="#FEF9C3"
              fontFamily="Outfit, sans-serif"
              fontWeight="800"
              fontSize="82"
              letterSpacing="6"
            >
              ORIGEM
            </text>
          </>
        );

      case 'the_boys_series':
        // THE BOYS (Screenshot 3): Gritty white wall with blue splatter & bold stencil
        return (
          <>
            <rect width="600" height="900" fill="#CBD5E1" />
            <circle cx="340" cy="420" r="210" fill="#0284C7" fillOpacity="0.45" />
            <text
              x="250"
              y="390"
              textAnchor="middle"
              fill="#0F172A"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="86"
              transform="rotate(-8 250 390)"
            >
              THE BOYS
            </text>
          </>
        );

      case 'breaking_bad_series':
        // BREAKING BAD (Screenshot 3): Moody monochrome with toxic green chemical glow
        return (
          <>
            <rect width="600" height="900" fill="#18181B" />
            <circle cx="300" cy="270" r="85" fill="#52525B" />
            <path d="M130 880 C150 480, 220 380, 300 380 C380 380, 450 480, 470 880 Z" fill="#09090B" />
            <circle cx="300" cy="560" r="140" fill="#22C55E" fillOpacity="0.45" />
            <rect x="195" y="700" width="75" height="65" fill="#15803D" stroke="#FFFFFF" strokeWidth="3" />
            <text x="232" y="745" textAnchor="middle" fill="#FFFFFF" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="38">
              Br
            </text>
          </>
        );

      case 'arcane_series':
        // ARCANE (Screenshot 3): Vivid pink & hextech cyan split portrait
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-arc`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="50%" stopColor="#4C1D95" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-arc)`} />
            <circle cx="240" cy="340" r="95" fill="#FDA4AF" fillOpacity="0.75" />
            <circle cx="370" cy="520" r="85" fill="#38BDF8" fillOpacity="0.75" />
          </>
        );

      case 'crimson_freq':
        // CAPITAL HUMANO: Warm ivory fractured glass mosaic with dramatic portraits
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-ch`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E5DFD5" />
                <stop offset="65%" stopColor="#CFC6B8" />
                <stop offset="100%" stopColor="#9E9486" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-ch)`} />
            <polygon points="300,660 95,120 265,90" fill="#2B211E" />
            <polygon points="300,660 285,75 455,115" fill="#4A342B" />
            <polygon points="300,660 475,165 555,365" fill="#1F1918" />
            <polygon points="300,660 55,295 155,175" fill="#3B2A23" />
            <polygon points="300,660 75,495 45,335" fill="#231F20" />
            <circle cx="215" cy="250" r="58" fill="#C89D7C" />
            <circle cx="365" cy="240" r="62" fill="#D5AB8B" />
            <circle cx="465" cy="340" r="46" fill="#B88B6A" />
            <circle cx="135" cy="390" r="44" fill="#C49A7A" />
            <g stroke="#EAE4DC" strokeWidth="8">
              <line x1="300" y1="660" x2="275" y2="60" />
              <line x1="300" y1="660" x2="90" y2="115" />
              <line x1="300" y1="660" x2="468" y2="140" />
              <line x1="300" y1="660" x2="45" y2="320" />
              <line x1="300" y1="660" x2="560" y2="380" />
            </g>
            <circle cx="360" cy="695" r="22" fill="none" stroke="#231F20" strokeWidth="4" />
            <circle cx="430" cy="700" r="22" fill="none" stroke="#231F20" strokeWidth="4" />
            <path d="M360 695 L395 680 L430 700" fill="none" stroke="#231F20" strokeWidth="4" />
          </>
        );

      case 'valkyrie_code':
        // CONTRA O RELÓGIO: Jungle night, tactical vest with red LEDs & cyan 01:22 timer + axe
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-cr`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#122B32" />
                <stop offset="55%" stopColor="#091920" />
                <stop offset="100%" stopColor="#04080C" />
              </linearGradient>
              <radialGradient id={`${uid}-redled`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-cr)`} />
            <circle cx="300" cy="360" r="260" fill="#163B45" fillOpacity="0.45" />
            <path d="M95 850 C110 420, 180 280, 300 280 C420 280, 490 420, 505 850 Z" fill="#1C262B" />
            <circle cx="300" cy="175" r="78" fill="#8C624C" />
            <rect x="175" y="310" width="250" height="330" rx="22" fill="#263238" stroke="#37474F" strokeWidth="4" />
            <rect x="242" y="425" width="116" height="54" rx="6" fill="#06283D" stroke="#00E5FF" strokeWidth="3" />
            <text
              x="300"
              y="461"
              textAnchor="middle"
              fill="#00E5FF"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="800"
              fontSize="28"
            >
              01:22
            </text>
            <circle cx="205" cy="390" r="28" fill={`url(#${uid}-redled)`} />
            <circle cx="395" cy="390" r="28" fill={`url(#${uid}-redled)`} />
            <circle cx="220" cy="520" r="26" fill={`url(#${uid}-redled)`} />
            <circle cx="380" cy="520" r="26" fill={`url(#${uid}-redled)`} />
            <line x1="210" y1="680" x2="440" y2="490" stroke="#8D6E63" strokeWidth="22" strokeLinecap="round" />
            <path d="M405 450 L485 505 L445 555 Z" fill="#B0BEC5" />
          </>
        );

      case 'cyber_odyssey':
        // HOMEM-ARANHA: UM NOVO DIA: Open hoodie over crimson spider-suit chest
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-sp`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="45%" stopColor="#991B1B" />
                <stop offset="100%" stopColor="#11070C" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-sp)`} />
            <path d="M80 880 C95 410, 175 260, 300 260 C425 260, 505 410, 520 880 Z" fill="#B91C1C" />
            <g stroke="#450A0A" strokeWidth="2.5" fill="none">
              <circle cx="300" cy="490" r="70" />
              <circle cx="300" cy="490" r="140" />
              <circle cx="300" cy="490" r="210" />
              <line x1="300" y1="260" x2="300" y2="750" />
              <line x1="120" y1="340" x2="480" y2="640" />
              <line x1="480" y1="340" x2="120" y2="640" />
            </g>
            <path d="M60 250 L215 280 L165 880 L40 880 Z" fill="#1E293B" />
            <path d="M540 250 L385 280 L435 880 L560 880 Z" fill="#1E293B" />
            <circle cx="300" cy="485" r="18" fill="#09090D" />
            <ellipse cx="300" cy="518" rx="12" ry="24" fill="#09090D" />
            <path
              d="M300 485 L250 440 M300 485 L350 440 M300 495 L240 495 M300 495 L360 495 M300 510 L255 565 M300 510 L345 565"
              stroke="#09090D"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="300" cy="145" r="88" fill="#D4A383" />
          </>
        );

      case 'solaris_titan':
        // SULLY: O HERÓI DO RIO HUDSON
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-su`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="65%" stopColor="#1E3A5F" />
                <stop offset="100%" stopColor="#07111E" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-su)`} />
            <circle cx="300" cy="210" r="76" fill="#94A3B8" />
            <path d="M170 460 C180 330, 230 295, 300 295 C370 295, 420 330, 430 460 Z" fill="#1E293B" />
            <rect x="0" y="560" width="600" height="340" fill="#0C2338" />
            <ellipse cx="300" cy="575" rx="95" ry="26" fill="#F8FAFC" />
            <path d="M40 585 L560 585" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" />
            <path d="M295 510 L305 560 L285 560 Z" fill="#0284C7" />
            <circle cx="220" cy="595" r="14" fill="#475569" />
            <circle cx="380" cy="595" r="14" fill="#475569" />
          </>
        );

      case 'silk_road_2099':
        // A HORA DO MAL: Stormy dark blue night sky & children running down moonlit road
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-hm`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#091526" />
                <stop offset="55%" stopColor="#16324F" />
                <stop offset="100%" stopColor="#05080F" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-hm)`} />
            <circle cx="300" cy="430" r="160" fill="#38BDF8" fillOpacity="0.22" />
            <polygon points="220,540 380,540 580,900 20,900" fill="#0B1320" />
            <circle cx="300" cy="445" r="24" fill="#030508" />
            <path
              d="M285 470 L315 470 L325 565 L275 565 Z M240 505 L360 485 M285 565 L265 650 M315 565 L335 650"
              stroke="#030508"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </>
        );

      default:
        // CONTROLE ABSOLUTO / Action: Diagonal orange explosion & surveillance grid
        return (
          <>
            <defs>
              <linearGradient id={`${uid}-ca`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="50%" stopColor="#431407" />
                <stop offset="100%" stopColor="#090504" />
              </linearGradient>
            </defs>
            <rect width="600" height="900" fill={`url(#${uid}-ca)`} />
            <circle cx="340" cy="490" r="190" fill="#F97316" fillOpacity="0.45" />
            <circle cx="340" cy="490" r="95" fill="#FDE047" fillOpacity="0.5" />
            <g stroke="#F97316" strokeOpacity="0.45" strokeWidth="3">
              <line x1="0" y1="220" x2="600" y2="80" />
              <line x1="0" y1="420" x2="600" y2="280" />
              <line x1="0" y1="620" x2="600" y2="480" />
            </g>
            <circle cx="290" cy="480" r="22" fill="#09090D" />
            <path d="M270 505 L315 505 L330 610 L260 610 Z" fill="#09090D" />
          </>
        );
    }
  };

  return (
    <div
      className={`${posClass} overflow-hidden select-none bg-[#08080D] ${className}`}
      aria-hidden="true"
    >
      {resolvedImg && !imgError ? (
        <img
          src={resolvedImg}
          alt={title || 'Pôster'}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <svg
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full block"
        >
          {renderPosterScene()}
        </svg>
      )}

      {badge4k && (
        <div className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded bg-black/75 border border-white/25 text-[10px] font-mono font-bold tracking-wider text-amber-300">
          4K
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {!hideBottomLabel && (
        <div className="absolute bottom-3.5 left-3 right-3 pointer-events-none text-center space-y-0.5 z-10">
          {subtitle && (
            <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-white/75 truncate">
              {subtitle}
            </p>
          )}
          {title && (
            <p className="text-xs sm:text-sm font-extrabold font-display uppercase tracking-wider text-white truncate drop-shadow">
              {title}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
