/**
 * Server-side one-time nonce store for 2FA verification.
 * After the API verifies the TOTP code, it registers the userId here.
 * The JWT callback consumes the entry (one-time use, 5-minute TTL).
 * This prevents clients from sending { twoFactorVerified: true }
 * without actually passing through the verify API.
 *
 * Note: In-process only — Cloud Run multi-instance에서는 Redis로 교체 권장.
 */

const store = new Map<string, number>(); // userId -> expiresAt (ms)
const TTL_MS = 5 * 60_000; // 5분

export const twoFactorCache = {
    /** 2FA 코드 검증 성공 후 userId 등록 */
    set(userId: string): void {
        store.set(userId, Date.now() + TTL_MS);
    },

    /**
     * JWT update 콜백에서 호출 — 존재하고 유효하면 소비(삭제) 후 true 반환.
     * 없거나 만료된 경우 false 반환 (클라이언트가 API를 거치지 않은 경우).
     */
    consume(userId: string): boolean {
        const expiresAt = store.get(userId);
        if (!expiresAt || Date.now() > expiresAt) {
            store.delete(userId);
            return false;
        }
        store.delete(userId); // one-time use
        return true;
    },
};
