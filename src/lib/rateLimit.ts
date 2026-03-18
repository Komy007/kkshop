/**
 * In-process Rate Limiter (IP별, 메모리 Map 기반)
 * ─ Cloud Run 단일 인스턴스에서 정상 동작
 * ─ 멀티 인스턴스 확장 시 Redis/Upstash 로 교체 권장
 */

interface RateLimitEntry {
    count:   number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 50_000; // DDoS OOM 방지 — 엔트리 상한

// 5분마다 만료된 엔트리 정리 (메모리 누수 방지)
const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 5 * 60_000);

// 테스트 환경에서 타이머가 프로세스를 붙잡지 않도록
if (cleanup.unref) cleanup.unref();

/**
 * Rate limit 확인
 * @param ip      클라이언트 IP
 * @param route   구분용 키 (e.g. 'register', 'orders')
 * @param limit   허용 횟수
 * @param windowMs 윈도우 시간 (ms)
 */
export function checkRateLimit(
    ip:       string,
    route:    string,
    limit:    number,
    windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
    const key = `${route}:${ip}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        // 상한 초과 시 가장 오래된 엔트리 제거 (긴급 방어)
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

/**
 * Request에서 클라이언트 IP를 추출
 * Cloud Run: X-Forwarded-For 헤더에 실제 IP가 포함됨
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0].trim();
        // IPv4 또는 IPv6 형식 검증
        if (/^[\d.]+$/.test(first) || /^[a-f0-9:]+$/i.test(first)) return first;
    }
    return req.headers.get('x-real-ip') ?? 'unknown';
}
