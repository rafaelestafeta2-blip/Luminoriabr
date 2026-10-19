import { Request, Response } from 'express';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const IPTV_USER_AGENT = 'VLC/3.0.18 LibVLC/3.0.18';

/**
 * Upgrades an http://...:80/ URL on Cloudflare-backed IPTV CDNs to https://
 * so browsers can load it directly without Mixed Content blocking.
 */
function upgradeToHttpsIfPossible(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
      if (parsed.port === '80') {
        parsed.port = '';
      }
      return parsed.toString();
    }
  } catch {}
  return rawUrl;
}

/**
 * Resolves the first redirect of an IPTV stream URL and returns both HTTP and HTTPS variants.
 */
export function handleResolveStream(req: Request, res: Response) {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Parâmetro url é obrigatório' });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'URL inválida' });
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const upstreamReq = client.request(
    targetUrl,
    {
      method: 'GET',
      headers: {
        'User-Agent': IPTV_USER_AGENT,
        Accept: '*/*',
      },
      rejectUnauthorized: false,
      timeout: 12000,
    },
    (upstreamRes) => {
      const loc = upstreamRes.headers.location;
      upstreamRes.destroy();
      if (loc) {
        const resolvedUrl = new URL(loc, targetUrl).toString();
        return res.json({
          ok: true,
          originalUrl: targetUrl,
          resolvedUrl,
          httpsUrl: upgradeToHttpsIfPossible(resolvedUrl),
        });
      }
      return res.json({
        ok: true,
        originalUrl: targetUrl,
        resolvedUrl: targetUrl,
        httpsUrl: upgradeToHttpsIfPossible(targetUrl),
      });
    }
  );

  upstreamReq.on('error', () => {
    return res.json({
      ok: false,
      originalUrl: targetUrl,
      resolvedUrl: targetUrl,
      httpsUrl: upgradeToHttpsIfPossible(targetUrl),
    });
  });

  upstreamReq.end();
}

/**
 * High-performance Video Stream Proxy:
 * - Uses VLC/3.0.18 User-Agent required by XUI/Xtream panels
 * - Follows 302 redirects and upgrades to HTTPS when needed
 * - Rewrites relative HLS (.m3u8) paths to proxy URLs
 * - If upstream CDN blocks cloud datacenter IP (403), redirects browser (302)
 *   to the HTTPS CDN URL so the user's residential/Android IP streams directly!
 */
export function handleStreamProxy(req: Request, res: Response) {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send('Parâmetro url é obrigatório');
  }

  forwardStream(targetUrl, req, res, 0);
}

function forwardStream(
  currentUrl: string,
  req: Request,
  res: Response,
  redirectCount: number
) {
  if (redirectCount > 6) {
    return res.status(508).send('Limite de redirecionamentos excedido.');
  }

  let parsed: URL;
  try {
    parsed = new URL(currentUrl);
  } catch {
    return res.status(400).send('URL de stream inválida.');
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': IPTV_USER_AGENT,
    Accept: '*/*',
    Connection: 'keep-alive',
  };

  if (req.headers.range) {
    upstreamHeaders.Range = req.headers.range;
  }

  const upstreamReq = client.request(
    currentUrl,
    {
      method: 'GET',
      headers: upstreamHeaders,
      rejectUnauthorized: false,
      timeout: 20000,
    },
    (upstreamRes) => {
      const statusCode = upstreamRes.statusCode || 200;

      // 1. Handle 301, 302, 307, 308 redirects
      if (
        statusCode >= 300 &&
        statusCode < 400 &&
        upstreamRes.headers.location
      ) {
        const rawNextUrl = new URL(
          upstreamRes.headers.location,
          currentUrl
        ).toString();
        upstreamRes.resume();
        // Upgrade redirect URL to HTTPS so Cloudflare CDNs accept TLS connections
        const httpsNextUrl = upgradeToHttpsIfPossible(rawNextUrl);
        return forwardStream(httpsNextUrl, req, res, redirectCount + 1);
      }

      // 2. If Cloudflare CDN blocks our datacenter IP (403/401) on VOD movies,
      // redirect the client browser directly to the HTTPS CDN URL so the user's
      // residential/mobile IP streams it directly!
      if ((statusCode === 403 || statusCode === 401) && redirectCount > 0) {
        upstreamRes.resume();
        const directHttpsUrl = upgradeToHttpsIfPossible(currentUrl);
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.redirect(302, directHttpsUrl);
      }

      if (statusCode >= 400) {
        upstreamRes.resume();
        return res.status(statusCode).send(`Upstream retornou status ${statusCode}`);
      }

      const contentType = (upstreamRes.headers['content-type'] || '').toLowerCase();

      // 3. If response is an HLS playlist (.m3u8), rewrite relative segment paths
      if (
        contentType.includes('mpegurl') ||
        currentUrl.includes('.m3u8')
      ) {
        let m3u8Body = '';
        upstreamRes.setEncoding('utf8');
        upstreamRes.on('data', (chunk) => {
          m3u8Body += chunk;
        });
        upstreamRes.on('end', () => {
          const baseOrigin = `${parsed.protocol}//${parsed.host}`;
          const rewritten = m3u8Body
            .split('\n')
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith('#')) return line;
              const absUrl = trimmed.startsWith('http')
                ? trimmed
                : trimmed.startsWith('/')
                ? `${baseOrigin}${trimmed}`
                : new URL(trimmed, currentUrl).toString();
              return `/api/stream-proxy?url=${encodeURIComponent(absUrl)}`;
            })
            .join('\n');

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          return res.status(200).send(rewritten);
        });
        return;
      }

      // 4. Pipe binary video stream (video/mp2t, video/mp4, etc.)
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.setHeader(
        'Access-Control-Expose-Headers',
        'Content-Range, Content-Length, Accept-Ranges'
      );
      res.setHeader('Accept-Ranges', 'bytes');

      if (upstreamRes.headers['content-type']) {
        res.setHeader('Content-Type', upstreamRes.headers['content-type']);
      } else if (currentUrl.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t');
      } else {
        res.setHeader('Content-Type', 'video/mp4');
      }

      if (upstreamRes.headers['content-length']) {
        res.setHeader('Content-Length', upstreamRes.headers['content-length']);
      }
      if (upstreamRes.headers['content-range']) {
        res.setHeader('Content-Range', upstreamRes.headers['content-range']);
      }

      res.status(statusCode);
      upstreamRes.pipe(res);

      res.on('close', () => {
        upstreamRes.destroy();
      });
    }
  );

  upstreamReq.on('timeout', () => {
    upstreamReq.destroy();
    if (!res.headersSent) {
      res.status(504).send('Tempo limite ao conectar ao stream IPTV.');
    }
  });

  upstreamReq.on('error', (err: any) => {
    if (!res.headersSent) {
      res.status(502).send(`Falha ao conectar ao stream IPTV: ${err?.message}`);
    }
  });

  upstreamReq.end();
}
