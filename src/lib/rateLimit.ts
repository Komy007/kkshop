/**
 * Rate Limiter — Upstash Redis (multi-instance safe) with in-memory fallback.
 *
 * ─ When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses a
 *   distributed fixed-window counter via the Upstash REST API. This works
 *   correctly across multiple Cloud Run instances.
 * ─ When those env vars are absent, falls back to an in-process Map (single
 *   instance only — fine for dev / low traffic).
 *
 * checkRateLimit is async so the same call site works for both backends.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// ── In-memory fallback store ──────────────────────────────────────────────────
const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 50_000; // DDoS OOM 방지 — 엔트리 상한

const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 5 * 60_000);
if (cleanup.unref) cleanup.unref();

// ── Upstash config ────────────────────────────────────────────────────────────
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

function checkInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        if (store.size >= MAX_STORE_SIZE) {
            const firstKey = store.keys().next().value;
            if (firstKey !== undefined) store.delete(firstKey);
        }
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }
    if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }
    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

async function checkUpstash(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    // Fixed window: bucket the key by window start so counters auto-expire cleanly
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const redisKey = `rl:${key}:${windowStart}`;
    const resetAt = windowStart + windowMs;

    try {
        // Pipeline: INCR then set expiry only if newly created (NX)
        const res = await fetch(`${UPSTASH_URL}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${UPSTASH_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                ['INCR', redisKey],
                ['PEXPIRE', redisKey, String(windowMs), 'NX'],
            ]),
            // Don't let a slow Redis hang the request
            signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
        const data = await res.json();
        const count = Number(data?.[0]?.result ?? 0);
        if (!Number.isFinite(count) || count <= 0) throw new Error('Bad Upstash response');

        if (count > limit) {
            return { allowed: false, remaining: 0, resetAt };
        }
        return { allowed: true, remaining: limit - count, resetAt };
    } catch (err) {
        // Fail-open to in-memory so a Redis outage never takes down checkout/login
        console.warn('[rateLimit] Upstash unavailable, falling back to in-memory:', (err as Error)?.message);
        return checkInMemory(key, limit, windowMs);
    }
}

/**
 * Rate limit 확인 (async — Upstash 또는 메모리)
 * @param ip       클라이언트 IP
 * @param route    구분용 키 (e.g. 'register', 'orders')
 * @param limit    허용 횟수
 * @param windowMs 윈도우 시간 (ms)
 */
export async function checkRateLimit(
    ip: string,
    route: string,
    limit: number,
    windowMs: number,
): Promise<RateLimitResult> {
    const key = `${route}:${ip}`;
    return useUpstash ? checkUpstash(key, limit, windowMs) : checkInMemory(key, limit, windowMs);
}

/**
 * Request에서 클라이언트 IP를 추출
 * Cloud Run: X-Forwarded-For 헤더에 실제 IP가 포함됨
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = (forwarded.split(',')[0] ?? '').trim();
        if (/^[\d.]+$/.test(first) || /^[a-f0-9:]+$/i.test(first)) return first;
    }
    return req.headers.get('x-real-ip') ?? 'unknown';
}
