import { NextResponse, NextRequest } from 'next/server';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import { auth } from '@/auth';

const GCS_BUCKET = process.env.GCS_BUCKET_NAME || 'kkshop-images';

const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

// Mirror /api/upload limits — keep them in sync
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_OUTPUT_WIDTH = 1600;
const WEBP_QUALITY = 82;
const FETCH_TIMEOUT_MS = 15000;
const MAX_URLS_PER_REQUEST = 50;
const PARALLEL_LIMIT = 5;

// Magic byte signatures — must match the actual content, not just the URL extension
const MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/jpg':  [[0xFF, 0xD8, 0xFF]],
    'image/png':  [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif':  [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function detectMime(buffer: Buffer): string | null {
    for (const [mime, sigs] of Object.entries(MAGIC_BYTES)) {
        if (sigs.some(sig => sig.every((b, i) => buffer[i] === b))) return mime;
    }
    return null;
}

/**
 * SSRF guard — reject URLs that resolve to private/loopback/link-local ranges
 * or use suspicious schemes/hosts.
 * Note: we only check the URL surface here; for full protection a DNS resolve
 * + IP check would be needed, but for typical e-commerce supplier sites this
 * blocks 99% of accidental + casual misuse.
 */
function isSafeUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; reason: string } {
    let url: URL;
    try { url = new URL(rawUrl); } catch { return { ok: false, reason: 'Invalid URL' }; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { ok: false, reason: `Unsupported protocol: ${url.protocol}` };
    }
    const host = url.hostname.toLowerCase();
    // Block IP literals in private/loopback/link-local space
    if (
        host === 'localhost' ||
        host === '0.0.0.0' ||
        host.startsWith('127.') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        // 172.16.0.0 – 172.31.255.255
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        // IPv6 loopback / link-local / unique-local
        host === '::1' ||
        host.startsWith('fe80:') ||
        host.startsWith('fc00:') ||
        host.startsWith('fd')
    ) {
        return { ok: false, reason: 'Private/loopback host blocked' };
    }
    // Block metadata services
    if (host === '169.254.169.254' || host === 'metadata.google.internal') {
        return { ok: false, reason: 'Cloud metadata host blocked' };
    }
    return { ok: true, url };
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        });
    } finally {
        clearTimeout(timer);
    }
}

interface PerUrlResult {
    url: string;
    ok: boolean;
    gcsUrl?: string;
    error?: string;
}

async function processOneUrl(rawUrl: string, square: boolean): Promise<PerUrlResult> {
    const trimmed = rawUrl.trim();
    if (!trimmed) return { url: rawUrl, ok: false, error: 'Empty URL' };

    const safe = isSafeUrl(trimmed);
    if (!safe.ok) return { url: trimmed, ok: false, error: safe.reason };

    let res: Response;
    try {
        res = await fetchWithTimeout(safe.url.toString(), FETCH_TIMEOUT_MS);
    } catch (err: any) {
        return { url: trimmed, ok: false, error: err?.name === 'AbortError' ? 'Timeout' : 'Fetch failed' };
    }
    if (!res.ok) return { url: trimmed, ok: false, error: `HTTP ${res.status}` };

    // Size guard via Content-Length header (cheap pre-check)
    const cl = res.headers.get('content-length');
    if (cl && Number(cl) > MAX_BYTES) {
        return { url: trimmed, ok: false, error: `Too large (${Math.round(Number(cl)/1024/1024)}MB)` };
    }

    const arr = await res.arrayBuffer();
    if (arr.byteLength > MAX_BYTES) {
        return { url: trimmed, ok: false, error: `Too large (${Math.round(arr.byteLength/1024/1024)}MB)` };
    }
    const buffer = Buffer.from(arr);

    // Verify it's a real image, regardless of Content-Type the server claims
    const realMime = detectMime(buffer);
    if (!realMime || !ALLOWED_MIME.has(realMime)) {
        return { url: trimmed, ok: false, error: 'Not a valid image (jpg/png/webp/gif)' };
    }

    // Convert: GIF preserved; everything else → WebP, optionally square-cropped
    let outBuffer: Buffer;
    let ext: string;
    let contentType: string;
    try {
        if (realMime === 'image/gif') {
            outBuffer = buffer;
            ext = 'gif';
            contentType = 'image/gif';
        } else {
            const pipeline = sharp(buffer, { failOn: 'truncated' }).rotate();
            const resized = square
                ? pipeline.resize({ width: MAX_OUTPUT_WIDTH, height: MAX_OUTPUT_WIDTH, fit: 'cover', position: 'center', withoutEnlargement: false })
                : pipeline.resize({ width: MAX_OUTPUT_WIDTH, withoutEnlargement: true });
            outBuffer = await resized.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
            ext = 'webp';
            contentType = 'image/webp';
        }
    } catch (err: any) {
        return { url: trimmed, ok: false, error: 'Image processing failed' };
    }

    // Save to GCS
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    // Derive a clean filename from the URL path (or just use random)
    const pathName = safe.url.pathname.split('/').pop() ?? 'imported';
    const baseName = pathName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 40) || 'img';
    const gcsFilename = `products/${timestamp}_${rand}_${baseName}.${ext}`;
    try {
        await bucket.file(gcsFilename).save(outBuffer, {
            contentType,
            metadata: { cacheControl: 'public, max-age=31536000, immutable' },
        });
    } catch (err: any) {
        return { url: trimmed, ok: false, error: 'GCS save failed' };
    }

    const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsFilename}`;
    return { url: trimmed, ok: true, gcsUrl: publicUrl };
}

/**
 * Pure-promise concurrency limiter — runs `tasks` with at most `limit` in flight.
 * Avoids adding `p-limit` as a dependency.
 */
async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let idx = 0;
    const workers = new Array(Math.min(limit, tasks.length)).fill(null).map(async () => {
        while (true) {
            const i = idx++;
            if (i >= tasks.length) return;
            try {
                results[i] = await tasks[i]();
            } catch (err) {
                // Defensive: store as a "failed" placeholder rather than throwing the whole batch
                results[i] = { ok: false, error: 'Unhandled error' } as any;
            }
        }
    });
    await Promise.all(workers);
    return results;
}

/**
 * POST /api/upload/from-urls
 * Body: { urls: string[], crop?: 'square' }
 * Auth: ADMIN | SUPERADMIN | SUPPLIER
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const role = session?.user?.role;
        if (!session?.user || !['ADMIN', 'SUPERADMIN', 'SUPPLIER'].includes(role ?? '')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const urls: unknown = body?.urls;
        const cropSquare = body?.crop === 'square';

        if (!Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ success: false, error: 'urls must be a non-empty array' }, { status: 400 });
        }
        if (urls.length > MAX_URLS_PER_REQUEST) {
            return NextResponse.json({ success: false, error: `Too many URLs (max ${MAX_URLS_PER_REQUEST})` }, { status: 400 });
        }
        if (!urls.every(u => typeof u === 'string')) {
            return NextResponse.json({ success: false, error: 'All URLs must be strings' }, { status: 400 });
        }

        // Deduplicate (preserving order)
        const unique = Array.from(new Set((urls as string[]).map(u => u.trim()).filter(Boolean)));

        const tasks = unique.map((u) => () => processOneUrl(u, cropSquare));
        const results = await runWithConcurrency(tasks, PARALLEL_LIMIT);

        const successCount = results.filter(r => r.ok).length;
        const failureCount = results.length - successCount;

        return NextResponse.json({
            success: true,
            total: results.length,
            successCount,
            failureCount,
            results,
            urls: results.filter(r => r.ok).map(r => r.gcsUrl), // convenience: successful URLs only
        });
    } catch (err: any) {
        console.error('[upload/from-urls] Error:', err);
        return NextResponse.json({ success: false, error: 'Internal error: ' + (err?.message || 'Unknown') }, { status: 500 });
    }
}
