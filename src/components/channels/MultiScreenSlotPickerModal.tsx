import React, { useMemo, useState } from 'react';
import { Search, X, Tv, Check } from 'lucide-react';
import { Channel } from '../../types/luminoria';

interface MultiScreenSlotPickerModalProps {
  slotIndex: number;
  currentChannel: Channel;
  allChannels: Channel[];
  onSelect: (newChannel: Channel) => void;
  onClose: () => void;
  activeColor: string;
}

export const MultiScreenSlotPickerModal: React.FC<MultiScreenSlotPickerModalProps> = ({
  slotIndex,
  currentChannel,
  allChannels,
  onSelect,
  onClose,
  activeColor,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Todos');

  const groups = useMemo(() => {
    return ['Todos', ...Array.from(new Set(allChannels.map((c) => c.groupName)))];
  }, [allChannels]);

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allChannels.filter((c) => {
      const matchText = !q || c.name.toLowerCase().includes(q) || c.groupName.toLowerCase().includes(q);
      const matchGroup = selectedGroup === 'Todos' || c.groupName === selectedGroup;
      return matchText && matchGroup;
    });
  }, [allChannels, search, selectedGroup]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0F111D] border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
              style={{ backgroundColor: `${activeColor}25`, color: activeColor }}
            >
              #{slotIndex + 1}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Escolher Canal para Tela #{slotIndex + 1}</h3>
              <p className="text-[11px] text-[#A0A0B0]">Atual: {currentChannel.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-3 border-b border-white/10 space-y-2.5 bg-black/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou emissora..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {groups.slice(0, 10).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedGroup === grp
                    ? 'bg-white/20 text-white font-semibold'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A0A0B0]">Nenhum canal encontrado.</div>
          ) : (
            filteredChannels.slice(0, 80).map((ch) => {
              const isCurrent = ch.id === currentChannel.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    onSelect(ch);
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                    isCurrent ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                      <Tv className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{ch.name}</p>
                      <p className="text-[10px] text-[#A0A0B0]">{ch.groupName} · {ch.quality}</p>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                      <Check className="w-3.5 h-3.5" /> Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/10 text-white/80 hover:bg-white/20">
                      Colocar na Tela {slotIndex + 1}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
