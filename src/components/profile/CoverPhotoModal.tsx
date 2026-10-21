import React, { useRef, useState } from 'react';
import { Camera, Check, Image as ImageIcon, Sparkles, Trash2, X } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import {
  compressCoverFileToDataUrl,
  STUDIO_COVER_PRESETS,
} from '../../utils/coverPresets';

interface CoverPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoverPhotoModal: React.FC<CoverPhotoModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfileInfo } = useLuminoria();
  const [selectedUrl, setSelectedUrl] = useState<string>(profile.coverUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const dataUrl = await compressCoverFileToDataUrl(file);
      setSelectedUrl(dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao processar a imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    updateProfileInfo({ coverUrl: selectedUrl });
    onClose();
  };

  const handleReset = () => {
    setSelectedUrl('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Alterar Foto de Capa do Perfil"
    >
      <div className="w-full max-w-2xl bg-[#0B0C12] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Personalizar Capa do Perfil
              </h2>
              <p className="text-xs text-[#A0A0B0]">
                Faça upload da sua foto ou escolha um tema cinematográfico
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Live Preview of Banner */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-white/70">Pré-visualização da Capa</span>
            <div className="relative h-40 sm:h-48 w-full rounded-2xl overflow-hidden border border-white/15 bg-[#07070B]">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="Pré-visualização da Capa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-r from-red-950 via-rose-900 to-red-950">
                  <Sparkles className="w-8 h-8 text-rose-400 mb-1 animate-pulse" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Capa Padrão Luminoria Retrô Stranger
                  </p>
                  <p className="text-[11px] text-white/60">
                    Selecione uma imagem abaixo para substituir
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>
          </div>

          {/* Upload Custom Image Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{isProcessing ? 'Processando foto...' : 'Enviar Foto do Dispositivo'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {selectedUrl && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>
            )}
          </div>

          {/* Cinematic Presets Grid */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-white/70">
              Galeria de Capas Cinematográficas 4K
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STUDIO_COVER_PRESETS.map((preset) => {
                const isSelected = selectedUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedUrl(preset.url)}
                    className={`group relative rounded-xl overflow-hidden aspect-[16/9] border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-[1.02]'
                        : 'border-white/15 hover:border-white/40'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-white truncate leading-tight">
                          {preset.name}
                        </p>
                        <p className="text-[9px] text-cyan-300 font-mono">{preset.tag}</p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-end gap-3 bg-[#08090E]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs transition-all shadow-lg cursor-pointer"
          >
            Salvar Capa
          </button>
        </div>
      </div>
    </div>
  );
};
