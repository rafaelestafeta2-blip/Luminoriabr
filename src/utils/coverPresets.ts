export interface CoverPreset {
  id: string;
  name: string;
  tag: string;
  url: string;
}

export const STUDIO_COVER_PRESETS: CoverPreset[] = [
  {
    id: 'cover-cyberpunk',
    name: 'Neo-Tokyo Cyberpunk',
    tag: 'Ficção & Ação',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cover-cosmos',
    name: 'Interstellar Deep Cosmos',
    tag: 'Sci-Fi Espacial',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cover-synthwave',
    name: 'Stranger 80s Synthwave',
    tag: 'Suspense & Retrô',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cover-noir',
    name: 'Blade Runner Neon Rain',
    tag: 'Cyberpunk Noir',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cover-anime',
    name: 'Anime Starlight Horizon',
    tag: 'Fantasia & Anime',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cover-cinema',
    name: 'IMAX Cinema Hall 4K',
    tag: 'Cinematográfico',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1400&auto=format&fit=crop&q=80',
  },
];

export async function compressCoverFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 520;
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D não suportado.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
