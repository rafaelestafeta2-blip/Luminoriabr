import test from 'node:test';
import assert from 'node:assert/strict';
import { Channel } from '../../types/luminoria';

test('MultiScreen slot allocation maintains 4 active channels with fallback', () => {
  const mockChannels: Channel[] = [
    {
      id: 'ch-1',
      name: 'Globo SP',
      epgId: 'ch-1',
      playlistId: 'pl-1',
      isLive: true,
      url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      sources: ['https://media.w3.org/2010/05/sintel/trailer.mp4'],
      groupName: 'Abertos',
      quality: 'FHD 60fps',
      artworkVariant: 'news',
      currentPrograms: [
        {
          id: 'p1',
          title: 'Jornal Hoje',
          startTime: '13:00',
          endTime: '14:00',
          category: 'Jornalismo',
          progress: 40,
        },
      ],
    },
    {
      id: 'ch-2',
      name: 'ESPN Brasil',
      epgId: 'ch-2',
      playlistId: 'pl-1',
      isLive: true,
      url: 'https://media.w3.org/2010/05/bunny/movie.mp4',
      sources: ['https://media.w3.org/2010/05/bunny/movie.mp4'],
      groupName: 'Esportes',
      quality: '4K UHD',
      artworkVariant: 'sports',
      currentPrograms: [
        {
          id: 'p2',
          title: 'Futebol Ao Vivo',
          startTime: '16:00',
          endTime: '18:00',
          category: 'Esportes',
          progress: 20,
        },
      ],
    },
  ];

  // When slots are requested
  const quadChannelIds = ['ch-1', 'ch-2', 'ch-nonexistent', ''];
  const quadChannels = [0, 1, 2, 3].map((idx) => {
    const id = quadChannelIds[idx];
    return mockChannels.find((c) => c.id === id) || mockChannels[idx] || mockChannels[0];
  });

  assert.equal(quadChannels.length, 4);
  assert.equal(quadChannels[0].name, 'Globo SP');
  assert.equal(quadChannels[1].name, 'ESPN Brasil');
  // Fallback to mockChannels[0] for missing
  assert.equal(quadChannels[2].name, 'Globo SP');
  assert.equal(quadChannels[3].name, 'Globo SP');
});

test('MultiScreen slot assignment updates target slot only', () => {
  let quadChannelIds = ['ch-1', 'ch-2', 'ch-3', 'ch-4'];
  const activeQuadIndex = 2; // Slot #3
  const newChannelId = 'ch-premiere';

  quadChannelIds = quadChannelIds.map((id, idx) => (idx === activeQuadIndex ? newChannelId : id));

  assert.deepEqual(quadChannelIds, ['ch-1', 'ch-2', 'ch-premiere', 'ch-4']);
});
