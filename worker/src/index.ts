/**
 * Soon Weather — Pirate Weather proxy (Cloudflare Worker)
 *
 * Exists so the Pirate Weather API key isn't shipped in the client bundle.
 * Accepts the same path shape as Pirate Weather minus the key:
 *   /forecast/<lat>,<lng>[,<unixTime>]?units=ca&exclude=...
 *
 * Validates lat/lng/timestamp, restricts query params to a whitelist, gates
 * by Origin (configurable via ALLOWED_ORIGINS), and caches successful
 * responses for 5 min on Cloudflare's edge.
 */

const PIRATE_BASE = 'https://api.pirateweather.net/forecast';
const CACHE_TTL_S = 300;
const ALLOWED_PARAMS = new Set(['units', 'exclude', 'lang']);

interface Env {
  PIRATE_API_KEY: string;
  ALLOWED_ORIGINS?: string; // comma-separated list, or unset for "anywhere"
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';
    const corsOk = isOriginAllowed(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, corsOk) });
    }

    if (request.method !== 'GET') {
      return jsonResp({ error: 'Method not allowed' }, 405, origin, corsOk);
    }
    if (!url.pathname.startsWith('/forecast/')) {
      return jsonResp({ error: 'Not found' }, 404, origin, corsOk);
    }

    if (!env.PIRATE_API_KEY) {
      return jsonResp({ error: 'Proxy misconfigured: PIRATE_API_KEY secret not set' }, 500, origin, corsOk);
    }

    // Parse path: /forecast/<lat>,<lng>[,<ts>]
    const path = url.pathname.replace(/^\/forecast\//, '');
    const parts = path.split(',');
    if (parts.length < 2 || parts.length > 3) {
      return jsonResp({ error: 'Invalid path; expected /forecast/<lat>,<lng>[,<ts>]' }, 400, origin, corsOk);
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    const ts = parts[2] !== undefined ? parseInt(parts[2], 10) : null;

    if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return jsonResp({ error: 'Invalid coordinates' }, 400, origin, corsOk);
    }
    if (ts !== null) {
      const nowS = Math.floor(Date.now() / 1000);
      // Allow within ~70 years past, ~1 day future
      if (!isFinite(ts) || ts < nowS - 70 * 365 * 86400 || ts > nowS + 86400) {
        return jsonResp({ error: 'Invalid timestamp' }, 400, origin, corsOk);
      }
    }

    // Build upstream URL with whitelisted query params only
    const upstreamPath = ts !== null ? `${lat},${lng},${ts}` : `${lat},${lng}`;
    const upstream = new URL(`${PIRATE_BASE}/${env.PIRATE_API_KEY}/${upstreamPath}`);
    for (const [k, v] of url.searchParams) {
      if (ALLOWED_PARAMS.has(k)) upstream.searchParams.set(k, v);
    }

    // Edge cache. Key derived from upstream URL but stored under a
    // key-free cache key so the API key isn't visible in cache logs.
    const cacheKey = new Request(`${url.origin}/cache/${upstreamPath}?${upstream.searchParams.toString()}`, {
      method: 'GET',
    });
    const cache = caches.default;
    let cached = await cache.match(cacheKey);

    let upstreamResponse: Response;
    if (cached) {
      upstreamResponse = cached;
    } else {
      upstreamResponse = await fetch(upstream.toString(), {
        cf: { cacheTtl: CACHE_TTL_S, cacheEverything: true },
      });
      if (upstreamResponse.ok) {
        const cacheable = new Response(upstreamResponse.clone().body, upstreamResponse);
        cacheable.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL_S}, max-age=${CACHE_TTL_S}`);
        ctx.waitUntil(cache.put(cacheKey, cacheable));
      }
    }

    // Defensive: redact key in case it leaks into a response field
    const text = await upstreamResponse.text();
    const cleaned = text.split(env.PIRATE_API_KEY).join('REDACTED');

    return new Response(cleaned, {
      status: upstreamResponse.status,
      headers: {
        ...corsHeaders(origin, corsOk),
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TTL_S}`,
      },
    });
  },
};

function isOriginAllowed(origin: string, allowed?: string): boolean {
  if (!allowed || allowed.trim() === '') return true; // unrestricted
  const list = allowed.split(',').map(s => s.trim()).filter(Boolean);
  return list.includes(origin) || list.includes('*');
}

function corsHeaders(origin: string, ok: boolean): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ok ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResp(body: unknown, status: number, origin: string, corsOk: boolean) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin, corsOk),
      'Content-Type': 'application/json',
    },
  });
}
