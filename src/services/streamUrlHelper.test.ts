import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAndroidNativeIntentUrls,
  convertTsToHlsUrl,
  isPlaceholderStreamUrl,
  resolveSafeStreamUrl,
} from './streamUrlHelper.ts';

test('streamUrlHelper resolves placeholder and IPTV URLs and builds Android Native Intents', () => {
  assert.equal(isPlaceholderStreamUrl('https://vod.luminoria.pro/movies/test.mp4'), true);
  const safeDemo = resolveSafeStreamUrl('https://vod.luminoria.pro/movies/test.mp4', 'Duna');
  assert.ok(safeDemo.startsWith('https://'));
  assert.ok(!safeDemo.includes('luminoria.pro'));

  const iptvUrl = 'http://main.securitycloudflare.online:80/movie/Rafalaila/1662167/15433532.mp4';
  const proxied = resolveSafeStreamUrl(iptvUrl, 'Filme IPTV');
  assert.ok(proxied.startsWith('/api/stream-proxy?url='));

  const intents = buildAndroidNativeIntentUrls(iptvUrl, 'Duna Parte 2');
  assert.ok(intents.systemVideoPlayerIntent.startsWith('intent://main.securitycloudflare.online:80/movie/'));
  assert.ok(intents.systemVideoPlayerIntent.includes('action=android.intent.action.VIEW'));
  assert.ok(intents.vlcIntent.includes('package=org.videolan.vlc'));
  assert.ok(intents.mxPlayerIntent.includes('package=com.mxtech.videoplayer.ad'));

  const hlsUrl = convertTsToHlsUrl('http://main.securitycloudflare.online:80/Rafalaila/1662167/16026642.ts');
  assert.equal(hlsUrl, 'http://main.securitycloudflare.online/live/Rafalaila/1662167/16026642.m3u8');
});
