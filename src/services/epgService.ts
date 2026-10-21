import { Channel, EpgProgram } from '../types/luminoria';
import { buildApiUrl } from './apiConfig';

export interface DetailedEpgProgram extends EpgProgram {
  description: string;
  isLiveNow: boolean;
}

const GENRE_PROGRAMS_DB: Record<
  string,
  { title: string; desc: string; category: string }[]
> = {
  sports: [
    {
      title: 'Transmissão Ao Vivo: Rodada decisiva UHD',
      desc: 'Cobertura em tempo real direto do estádio com narração exclusiva e estatísticas em tela.',
      category: 'Esportes Ao Vivo',
    },
    {
      title: 'Central da Rodada & Melhores Momentos',
      desc: 'Análise tática completa, gols da rodada e entrevistas coletivas pós-jogo.',
      category: 'Debate Esportivo',
    },
    {
      title: 'Arena Internacional · Liga Europeia',
      desc: 'Compacto especial dos grandes clássicos europeus em alta definição 60fps.',
      category: 'Futebol Internacional',
    },
    {
      title: 'Revista do Esporte & Bastidores',
      desc: 'Reportagens especiais sobre preparação física e mercado de transferências.',
      category: 'Jornalismo Esportivo',
    },
  ],
  news: [
    {
      title: 'Jornal 24h: Edição Em Tempo Real',
      desc: 'As principais notícias do Brasil e do mundo atualizadas minuto a minuto.',
      category: 'Telejornalismo',
    },
    {
      title: 'Radar Econômico & Mercados Globais',
      desc: 'Bolsas de valores, tecnologia, câmbio e análises com especialistas.',
      category: 'Economia & Tech',
    },
    {
      title: 'Painel Internacional & Geopolítica',
      desc: 'Correspondentes ao vivo nas principais capitais trazendo os fatos do dia.',
      category: 'Internacional',
    },
    {
      title: 'Documento Especial da Semana',
      desc: 'Investigação jornalística aprofundada sobre os temas que movem a sociedade.',
      category: 'Reportagem Especial',
    },
  ],
  cinema: [
    {
      title: 'Sessão Premiere 4K: Grande Sucesso',
      desc: 'Exibição sem intervalos comerciais com áudio Dolby Digital e imagem remasterizada.',
      category: 'Filme em Exibição',
    },
    {
      title: 'Especial Diretores & Bastidores de Hollywood',
      desc: 'Entrevistas exclusivas com elenco e cenas inéditas de gravação em IMAX.',
      category: 'Making Of',
    },
    {
      title: 'Noite de Ação & Adrenalina',
      desc: 'Superprodução de tirar o fôlego selecionada para a grade nobre.',
      category: 'Cinema Ação',
    },
    {
      title: 'Clássicos Cult & Premiados do Oscar',
      desc: 'Obras-primas consagradas pela crítica mundial em versão de colecionador.',
      category: 'Cinema Premiado',
    },
  ],
  anime: [
    {
      title: 'Faixa Simulcast: Episódio Inédito HD',
      desc: 'Transmissão simultânea com o Japão com legendas em português revisadas.',
      category: 'Anime Shonen',
    },
    {
      title: 'Maratona Geek & Cyber Cultura',
      desc: 'Sequência de episódios especiais das sagas mais votadas pela comunidade.',
      category: 'Cultura Pop',
    },
    {
      title: 'Sessão Mecha & Sci-Fi Neo Tokyo',
      desc: 'Animação japonesa de ficção científica com trilha sonora original.',
      category: 'Sci-Fi Anime',
    },
    {
      title: 'Top Openings & Lançamentos da Temporada',
      desc: 'Guia completo dos novos animes e estreias da temporada atual.',
      category: 'Especial Otaku',
    },
  ],
};

function formatTimeHHMM(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Generates a realistic, clock-synchronized EPG schedule for any channel,
 * calculating exact live progress % from the current system clock.
 */
export function buildLiveSynchronizedEpg(
  channel: Channel,
  now: Date = new Date()
): DetailedEpgProgram[] {
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  // 90-minute slot alignment
  const slotDurationMin = 90;
  const slotStartMin = Math.floor(minuteOfDay / slotDurationMin) * slotDurationMin;
  const elapsedInSlot = minuteOfDay - slotStartMin;
  const liveProgress = Math.min(98, Math.max(5, Math.round((elapsedInSlot / slotDurationMin) * 100)));

  const templates =
    GENRE_PROGRAMS_DB[channel.artworkVariant] || GENRE_PROGRAMS_DB.cinema;

  // Deterministic rotation based on channel ID + slot index
  const hash = channel.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const slotIndex = Math.floor(slotStartMin / slotDurationMin);

  const result: DetailedEpgProgram[] = [];

  for (let i = 0; i < 4; i++) {
    const startMin = slotStartMin + i * slotDurationMin;
    const endMin = startMin + slotDurationMin;

    const startDate = new Date(now);
    startDate.setHours(0, startMin, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(0, endMin, 0, 0);

    const tpl = templates[(hash + slotIndex + i) % templates.length];
    const seedProg = channel.currentPrograms[i];

    result.push({
      id: `${channel.id}-epg-${slotIndex + i}`,
      title: !isGenericTitle(seedProg?.title) && i < 2 && seedProg
        ? seedProg.title
        : `${channel.name} · ${tpl.title}`,
      startTime: formatTimeHHMM(startDate),
      endTime: formatTimeHHMM(endDate),
      category: seedProg?.category || tpl.category || channel.groupName,
      progress: i === 0 ? liveProgress : 0,
      description: tpl.desc,
      isLiveNow: i === 0,
    });
  }

  return result;
}

function isGenericTitle(title?: string): boolean {
  if (!title) return true;
  return (
    title.startsWith('Ao Vivo:') ||
    title.startsWith('Programação Ao Vivo:') ||
    title.startsWith('A Seguir:')
  );
}

/**
 * Queries the backend Xtream EPG endpoint for real XMLTV/JSON EPG entries if available,
 * falling back to the clock-synchronized EPG schedule.
 */
export async function fetchChannelEpgSchedule(
  channel: Channel
): Promise<DetailedEpgProgram[]> {
  const m = channel.id.match(/xt-live-(\d+)/);
  if (m && m[1]) {
    try {
      const res = await fetch(buildApiUrl(`/api/xtream-epg?streamId=${m[1]}`));
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.programs) && data.programs.length > 0) {
          return data.programs;
        }
      }
    } catch {}
  }
  return buildLiveSynchronizedEpg(channel);
}
