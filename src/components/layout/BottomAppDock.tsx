import React from 'react';
import { Clapperboard, Heart, ListVideo, PlaySquare, ShoppingBag, Tv, User } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { NavSectionId } from '../../types/luminoria';

interface DockItem {
  id: string;
  label: string;
  targetNav: NavSectionId;
  icon: React.ComponentType<{ className?: string }>;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'movies', label: 'Movies', targetNav: 'home', icon: Clapperboard },
  { id: 'canais', label: 'Canais', targetNav: 'channels', icon: Tv },
  { id: 'series', label: 'Series', targetNav: 'series', icon: PlaySquare },
  { id: 'fontes', label: 'Fontes', targetNav: 'playlists', icon: ListVideo },
  { id: 'favoritos', label: 'Favoritos', targetNav: 'favorites', icon: Heart },
  { id: 'loja', label: 'Loja', targetNav: 'shop', icon: ShoppingBag },
  { id: 'perfil', label: 'Perfil', targetNav: 'profile', icon: User },
];

export const BottomAppDock: React.FC = () => {
  const { activeNav, setActiveNav, activeScheme } = useLuminoria();

  return (
    <nav
      aria-label="Barra de navegação inferior Luminoria"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#08090E]/95 backdrop-blur-lg border-t border-white/10 px-1 pt-2"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
      }}
    >
      <div className="max-w-xl mx-auto grid grid-cols-7 gap-0.5">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.targetNav;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.targetNav)}
              style={isActive ? { color: activeScheme.primaryHex } : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isActive ? 'font-bold' : 'text-[#8E929F] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span
                  className="w-1.5 h-1 rounded-full mt-0.5 transition-all"
                  style={{
                    backgroundColor: activeScheme.primaryHex,
                    boxShadow: `0 0 8px ${activeScheme.primaryHex}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
