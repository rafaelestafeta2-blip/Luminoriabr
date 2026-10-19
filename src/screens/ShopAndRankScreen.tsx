import React, { useState } from 'react';
import { ArrowLeft, Check, DollarSign, Sparkles, Trophy } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { ShopCategoryType, ShopProduct } from '../types/luminoria';
import { PosterArtwork } from '../components/ui/PosterArtwork';

const SHOP_TABS: { id: ShopCategoryType; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'themes', label: 'Temas' },
  { id: 'borders', label: 'Bordas' },
  { id: 'special', label: 'Especial' },
];

export const ShopAndRankScreen: React.FC = () => {
  const {
    shopProducts,
    profile,
    purchaseProduct,
    equipItem,
    awardWatchSession,
    setActiveNav,
    setIsRankDrawerOpen,
  } = useLuminoria();

  const [selectedCat, setSelectedCat] = useState<ShopCategoryType>('all');
  const [shopNotice, setShopNotice] = useState<string | null>(null);

  const filteredProducts = shopProducts.filter((p) =>
    selectedCat === 'all' ? true : p.category === selectedCat
  );

  const handleCardAction = (prod: ShopProduct) => {
    const isOwned = profile.ownedProductIds.includes(prod.id);
    if (isOwned) {
      equipItem(prod.id);
      setShopNotice(`Tema/Item "${prod.name}" equipado com sucesso no seu perfil!`);
      return;
    }
    const res = purchaseProduct(prod.id);
    if (res.ok) {
      equipItem(prod.id);
    }
    setShopNotice(res.message);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Top Header matching Screenshot 2: <- Loja Premium [$ 41591] */}
      <header className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            aria-label="Voltar para Filmes"
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Loja Premium
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Gold Coin Pill Badge ($ 41591) */}
          <div className="px-4 py-1.5 rounded-full bg-[#241E0F] border border-[#CA8A04]/70 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#EAB308] text-black flex items-center justify-center font-extrabold text-xs">
              $
            </span>
            <span className="text-base sm:text-lg font-extrabold font-mono text-[#FACC15] tabular-nums">
              {profile.coins}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsRankDrawerOpen(true)}
            aria-label="Abrir Ranking Global"
            className="px-3.5 py-2 rounded-full bg-[#13151F] border border-amber-500/35 text-xs font-semibold text-amber-400 flex items-center gap-1.5 hover:bg-white/10"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Ranking Global</span>
          </button>
        </div>
      </header>

      {/* Filter Pills Row matching Screenshot 2: [✓ Todos] [Temas] [Bordas] [Especial] */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SHOP_TABS.map((tab) => {
          const isActive = selectedCat === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCat(tab.id)}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#3D3117] border border-[#CA8A04] text-[#FACC15]'
                  : 'bg-[#090A0F] border border-white/45 text-[#B0B3C0] hover:text-white'
              }`}
            >
              {isActive && <Check className="w-4 h-4 text-[#FACC15]" />}
              <span>{tab.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            awardWatchSession(150, 250);
            setShopNotice('+250 Luminárias e +150 XP adicionados pelo bónus diário!');
          }}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13151F] border border-white/15 text-xs font-semibold text-[#0EA5E9] flex items-center gap-1.5 whitespace-nowrap shrink-0 ml-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>+250 Lumin.</span>
        </button>
      </div>

      {shopNotice && (
        <div className="p-3.5 rounded-2xl bg-[#161926] border border-[#0EA5E9]/40 text-xs text-[#0EA5E9] font-medium flex items-center justify-between">
          <span>{shopNotice}</span>
          <button
            type="button"
            onClick={() => setShopNotice(null)}
            className="text-white/60 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2-Column Visual Theme Cards Grid (Exact Match to Screenshot 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((prod) => {
          const isOwned = profile.ownedProductIds.includes(prod.id);
          const isEquipped = profile.equippedBorderId === prod.id;
          const badge = prod.badgeLabel || 'TEMAS';

          return (
            <div
              key={prod.id}
              onClick={() => handleCardAction(prod)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCardAction(prod);
              }}
              className="group rounded-2xl overflow-hidden bg-[#121318] border border-white/10 flex flex-col cursor-pointer hover:border-[#0EA5E9] transition-all shadow-lg"
            >
              {/* Top Visual Artwork with Red TEMAS / BORDAS Badge */}
              <div className="relative aspect-[4/4.4] w-full overflow-hidden bg-[#090A0F]">
                <PosterArtwork
                  variant={prod.artworkKey || 'aot_theme'}
                  title={prod.name}
                  hideBottomLabel
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top-Left Red Category Tag */}
                <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md bg-[#E11D48] text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow">
                  {badge}
                </span>

                {isOwned && (
                  <span className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-md bg-emerald-500/90 text-black text-[10px] font-extrabold uppercase">
                    {isEquipped ? 'Equipado' : 'Adquirido'}
                  </span>
                )}
              </div>

              {/* Card Bottom Info: Title + ($ 1500 Lumin.) */}
              <div className="p-3.5 sm:p-4 bg-[#121318] flex flex-col justify-between gap-2 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {prod.name}
                </h3>

                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border border-[#0EA5E9] text-[#0EA5E9] flex items-center justify-center">
                    <DollarSign className="w-3 h-3" />
                  </span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-[#0EA5E9] tabular-nums">
                    {prod.priceCoins}
                  </span>
                  <span className="text-xs text-[#8E929F]">Lumin.</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
