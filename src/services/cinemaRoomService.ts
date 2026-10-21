import { CinemaChatMessage, CinemaRoomState } from '../types/luminoria';

const CINEMA_ROOM_PREFIX = 'luminoria_cinema_room_v2_';
const CHANNEL_NAME = 'luminoria_cinema_sync_v2';

export function normalizeRoomCode(raw: string): string {
  return (raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

export function generateRandomRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function loadPersistedCinemaRoom(
  code: string,
  fallbackHostName: string,
  fallbackRank: string,
  defaultVodId: string
): CinemaRoomState {
  const cleanCode = normalizeRoomCode(code) || 'LUMI4K';
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${CINEMA_ROOM_PREFIX}${cleanCode}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CinemaRoomState;
        if (parsed && parsed.code === cleanCode) {
          return parsed;
        }
      }
    } catch {}
  }

  return {
    code: cleanCode,
    hostName: fallbackHostName || 'Host',
    vodId: defaultVodId || 'vod-1',
    isPlaying: true,
    currentTimeSec: 0,
    durationSec: 7200,
    participants: [
      {
        id: 'host-self',
        name: fallbackHostName || 'Você',
        rank: fallbackRank || 'INICIANTE',
        isHost: true,
      },
    ],
    messages: [],
  };
}

export function saveAndBroadcastCinemaRoom(room: CinemaRoomState): void {
  if (typeof window === 'undefined') return;
  const cleanCode = normalizeRoomCode(room.code);
  if (!cleanCode) return;
  try {
    localStorage.setItem(`${CINEMA_ROOM_PREFIX}${cleanCode}`, JSON.stringify(room));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'ROOM_UPDATE', room });
      bc.close();
    }
  } catch {}
}

export function subscribeToCinemaRoomUpdates(
  activeCode: string,
  onRoomSync: (room: CinemaRoomState) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const cleanCode = normalizeRoomCode(activeCode);

  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'ROOM_UPDATE' && ev.data?.room?.code === cleanCode) {
          onRoomSync(ev.data.room);
        }
      };
    } catch {}
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === `${CINEMA_ROOM_PREFIX}${cleanCode}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as CinemaRoomState;
        if (parsed && parsed.code === cleanCode) {
          onRoomSync(parsed);
        }
      } catch {}
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
    if (bc) {
      try {
        bc.close();
      } catch {}
    }
  };
}

export function appendCinemaRoomChatMessage(
  room: CinemaRoomState,
  senderName: string,
  senderRank: string,
  text: string
): CinemaRoomState {
  const newMsg: CinemaChatMessage = {
    id: `cmsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    senderName,
    senderRank,
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  const updated: CinemaRoomState = {
    ...room,
    messages: [...room.messages, newMsg].slice(-80),
  };
  saveAndBroadcastCinemaRoom(updated);
  return updated;
}
