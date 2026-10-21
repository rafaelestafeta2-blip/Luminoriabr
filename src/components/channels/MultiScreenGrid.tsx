import React, { useState } from 'react';
import { Grid, LayoutGrid, X, Info } from 'lucide-react';
import { Channel } from '../../types/luminoria';
import { MultiScreenTile } from './MultiScreenTile';
import { MultiScreenSlotPickerModal } from './MultiScreenSlotPickerModal';

interface MultiScreenGridProps {
  allChannels: Channel[];
  quadChannels: Channel[];
  activeQuadIndex: number;
  onSelectQuadIndex: (index: number) => void;
  onChangeChannelForSlot: (slotIndex: number, newChannel: Channel) => void;
  onCloseMultiScreen: () => void;
  activeColor: string;
}

export const MultiScreenGrid: React.FC<MultiScreenGridProps> = ({
  allChannels,
  quadChannels,
  activeQuadIndex,
  onSelectQuadIndex,
  onChangeChannelForSlot,
  onCloseMultiScreen,
  activeColor,
}) => {
  const [soloSlotIndex, setSoloSlotIndex] = useState<number | null>(null);
  const [pickingSlotIndex, setPickingSlotIndex] = useState<number | null>(null);

  // Guarantee 4 slots with fallbacks if quadChannels is smaller
  const displayChannels = [0, 1, 2, 3].map(
    (idx) => quadChannels[idx] || allChannels[idx] || allChannels[0]
  );

  return (
    <section aria-label="Painel Multi-Tela 2x2" className="space-y-4">
      {/* Top Controls Bar */}
      <div className="p-4 rounded-2xl bg-[#0D0F18] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${activeColor}22`, color: activeColor }}
          >
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                Modo Multi-Tela (2x2) · {soloSlotIndex !== null ? 'Visão Solo Expandida' : '4 Canais Simultâneos'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-[#A0A0B0] flex items-center gap-1.5 mt-0.5">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                Tela selecionada: <strong className="text-white">Tela #{activeQuadIndex + 1}</strong> ({displayChannels[activeQuadIndex]?.name || 'Canal'}). Clique em qualquer canal do catálogo abaixo para enviá-lo para cá!
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {soloSlotIndex !== null && (
            <button
              type="button"
              onClick={() => setSoloSlotIndex(null)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Voltar ao 2x2</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCloseMultiScreen}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar Multi-Tela</span>
          </button>
        </div>
      </div>

      {/* Grid or Solo View */}
      {soloSlotIndex !== null ? (
        <div>
          {displayChannels[soloSlotIndex] && (
            <MultiScreenTile
              key={`solo-${displayChannels[soloSlotIndex].id}-${soloSlotIndex}`}
              channel={displayChannels[soloSlotIndex]}
              slotIndex={soloSlotIndex}
              isAudioActive={true}
              isSolo={true}
              onFocus={() => onSelectQuadIndex(soloSlotIndex)}
              onToggleSolo={() => setSoloSlotIndex(null)}
              onRequestChangeChannel={() => setPickingSlotIndex(soloSlotIndex)}
              activeColor={activeColor}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayChannels.map((channel, idx) => (
            <MultiScreenTile
              key={`tile-${channel.id}-${idx}`}
              channel={channel}
              slotIndex={idx}
              isAudioActive={activeQuadIndex === idx}
              isSolo={false}
              onFocus={() => onSelectQuadIndex(idx)}
              onToggleSolo={() => setSoloSlotIndex(idx)}
              onRequestChangeChannel={() => setPickingSlotIndex(idx)}
              activeColor={activeColor}
            />
          ))}
        </div>
      )}

      {/* Slot Picker Modal */}
      {pickingSlotIndex !== null && displayChannels[pickingSlotIndex] && (
        <MultiScreenSlotPickerModal
          slotIndex={pickingSlotIndex}
          currentChannel={displayChannels[pickingSlotIndex]}
          allChannels={allChannels}
          onSelect={(newChannel) => {
            onChangeChannelForSlot(pickingSlotIndex, newChannel);
            onSelectQuadIndex(pickingSlotIndex);
          }}
          onClose={() => setPickingSlotIndex(null)}
          activeColor={activeColor}
        />
      )}
    </section>
  );
};
