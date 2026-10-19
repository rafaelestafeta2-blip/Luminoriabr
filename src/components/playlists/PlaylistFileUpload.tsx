import React, { useRef, useState } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';
import { readM3UFile } from '../../services/m3uParserAdvanced';

interface PlaylistFileUploadProps {
  onImport: (name: string, content: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const PlaylistFileUpload: React.FC<PlaylistFileUploadProps> = ({
  onImport,
  isLoading,
  setIsLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFileName(file.name);
    setIsLoading(true);

    try {
      const content = await readM3UFile(file);
      const name = file.name.replace(/\.(m3u8?|txt)$/i, '');
      onImport(name, content);
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar arquivo M3U.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".m3u,.m3u8,text/plain"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/20 hover:border-cyan-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-cyan-500/[0.03] space-y-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-white">
            {selectedFileName
              ? `Arquivo: ${selectedFileName}`
              : 'Clique ou arraste seu arquivo .m3u ou .m3u8'}
          </h4>
          <p className="text-xs text-white/50 mt-1">
            Suporta listas gigantes (5.000 a 50.000+ canais, filmes e séries)
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <FileUp className="w-4 h-4 text-cyan-400" />
          <span>Selecionar do Celular / Computador</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
};
