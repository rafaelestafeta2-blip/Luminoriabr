import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export interface FetchM3uOptions {
  maxBytes?: number;
  timeoutMs?: number;
  cutAtLastNewline?: boolean;
}

/**
 * High-performance streaming fetcher for M3U playlists and IPTV servers.
 * Bypasses self-signed SSL certificate errors (DEPTH_ZERO_SELF_SIGNED_CERT)
 * and supports large 80k-300k item playlists (up to 90MB).
 */
export function fetchM3uStream(
  targetUrl: string,
  options: FetchM3uOptions = {}
): Promise<string> {
  const maxBytes = options.maxBytes ?? 85 * 1024 * 1024; // 85MB covers 300,000+ M3U items
  const timeoutMs = options.timeoutMs ?? 45000;
  const cutAtLastNewline = options.cutAtLastNewline ?? true;

  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return reject(new Error('URL informada é inválida.'));
    }

    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(
      targetUrl,
      {
        rejectUnauthorized: false,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Luminoria/2.0 IPTV Player',
          Accept: '*/*',
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          return resolve(fetchM3uStream(redirectUrl, options));
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(`Servidor IPTV retornou status HTTP ${res.statusCode}`)
          );
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;
        let isDone = false;

        const finish = (truncated: boolean) => {
          if (isDone) return;
          isDone = true;
          const full = Buffer.concat(chunks).toString('utf-8');
          if (truncated && cutAtLastNewline) {
            const lastNl = full.lastIndexOf('\n');
            const cleanText = lastNl !== -1 ? full.slice(0, lastNl) : full;
            return resolve(cleanText);
          }
          resolve(full);
        };

        res.on('data', (chunk: Buffer) => {
          if (isDone) return;
          chunks.push(chunk);
          totalBytes += chunk.length;
          if (totalBytes >= maxBytes) {
            res.destroy();
            finish(true);
          }
        });

        res.on('end', () => finish(false));
        res.on('close', () => finish(false));

        res.on('error', (err) => {
          if (!isDone) {
            reject(new Error(`Erro ao ler transmissão M3U: ${err.message}`));
          }
        });
      }
    );

    req.on('error', (err: any) => {
      reject(new Error(`Falha de conexão com IPTV (${err.code || err.message})`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Tempo limite excedido ao conectar ao servidor IPTV.'));
    });
  });
}

/**
 * Fetches full JSON payloads from Xtream Codes player_api (supports 30,000+ VOD/Series arrays up to 60MB)
 */
export async function fetchXtreamApiJson(apiUrl: string): Promise<any> {
  const text = await fetchM3uStream(apiUrl, {
    maxBytes: 60 * 1024 * 1024,
    timeoutMs: 45000,
    cutAtLastNewline: false,
  });
  try {
    return JSON.parse(text);
  } catch (err: any) {
    throw new Error(`Resposta do servidor Xtream não é JSON válido: ${err.message}`);
  }
}
