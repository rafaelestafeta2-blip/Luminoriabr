import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyM3UItem } from './m3uClassifier.ts';
import { extractXtreamCredentials, parseUnifiedM3U } from './m3uParserAdvanced.ts';

test('classifyM3UItem accurately identifies live channels, movies, and series', () => {
  // Live channel
  assert.equal(
    classifyM3UItem({
      name: 'Globo RJ 4K',
      epgId: 'globo.rj',
      groupName: 'Canais Abertos',
      url: 'https://server.com/live/user/pass/101.m3u8',
    }),
    'live'
  );

  // Movie VOD
  assert.equal(
    classifyM3UItem({
      name: 'Duna 2 (2024)',
      epgId: 'dune.2',
      groupName: 'Filmes 4K Lançamentos',
      url: 'https://server.com/movie/user/pass/999.mp4',
    }),
    'movie'
  );

  // Series
  assert.equal(
    classifyM3UItem({
      name: 'Breaking Bad S01E01',
      epgId: 'bb.s01e01',
      groupName: 'Séries Drama',
      url: 'https://server.com/series/user/pass/1234.mp4',
    }),
    'series'
  );
});

test('parseUnifiedM3U splits a mixed playlist into channels, movies and series', () => {
  const content = `#EXTM3U x-tvg-url="https://epg.server.com/epg.xml"
#EXTINF:-1 tvg-id="espn.hd" group-title="Esportes",ESPN Brasil HD
https://stream.server.com/live/espn.m3u8
#EXTINF:-1 tvg-id="deadpool.3" group-title="Filmes Ação",Deadpool & Wolverine (2024)
https://vod.server.com/movie/deadpool.mp4
#EXTINF:-1 tvg-id="theboys.s4e1" group-title="Séries 4K",The Boys S04E01
https://vod.server.com/series/theboys_s4e1.mp4`;

  const result = parseUnifiedM3U(content, 'Lista M3U Teste');
  assert.equal(result.stats.totalParsed, 3);
  assert.equal(result.channels.length, 1);
  assert.equal(result.movies.length, 1);
  assert.equal(result.series.length, 1);

  assert.equal(result.channels[0].name, 'ESPN Brasil HD');
  assert.equal(result.movies[0].title, 'Deadpool & Wolverine');
  assert.equal(result.movies[0].category, 'AÇÃO');
  assert.equal(result.series[0].title, 'The Boys S04E01');
  assert.equal(result.series[0].mediaType, 'series');
});

test('extractXtreamCredentials correctly extracts user and host from get.php IPTV URLs', () => {
  const url =
    'https://elitedns.xyz/get.php?username=Rafalaila&password=1662167&type=m3u_plus&output=mpegts';
  const creds = extractXtreamCredentials(url);
  assert.ok(creds);
  assert.equal(creds.host, 'https://elitedns.xyz');
  assert.equal(creds.username, 'Rafalaila');
  assert.equal(creds.password, '1662167');

  const invalid = 'https://example.com/playlist.m3u';
  assert.equal(extractXtreamCredentials(invalid), null);
});

test('parseUnifiedM3U handles XUI session data headers and ts streams', () => {
  const sample = `#EXTM3U
#EXT-X-SESSION-DATA:DATA-ID="com.xui.1_5_5r2"
#EXTINF:-1 tvg-id="" tvg-name="LILO E STITCH" tvg-logo="https://painelexpress.xyz/logos-xui/desenhos.png" group-title="24H - DESENHOS",LILO E STITCH
http://main.securitycloudflare.online:80/Rafalaila/1662167/16026642.ts
#EXTINF:-1 tvg-id="" tvg-name="Duna Parte 2" tvg-logo="https://painelexpress.xyz/logos-xui/duna.png" group-title="FILMES - LANÇAMENTOS",Duna Parte 2 (2024)
http://main.securitycloudflare.online:80/movie/Rafalaila/1662167/99812.mp4`;

  const result = parseUnifiedM3U(sample, 'Lista Rafalaila');
  assert.equal(result.channels.length, 1);
  assert.equal(result.movies.length, 1);
  assert.equal(result.channels[0].name, 'LILO E STITCH');
  assert.equal(result.channels[0].groupName, '24H - DESENHOS');
  assert.equal(result.movies[0].title, 'Duna Parte 2');
});

