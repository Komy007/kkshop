// 수수료 단일 진실원본(SSOT) — 이 파일에서만 범위를 정의하고 다른 곳은 이를 import할 것.
// 변경 시 이 파일만 수정하면 API 검증·UI·계산 모두 자동 반영됨.

export const COMMISSION_MIN     = 9;   // 최저 수수료율 (%)
export const COMMISSION_MAX     = 30;  // 최고 수수료율 (%)
export const COMMISSION_DEFAULT = 30;  // 신규 공급자 기본값 (스키마 @default(30)과 일치)

/** [9, 30] 범위로 클램프. NaN / 비유한수이면 DEFAULT 반환. */
export function clampCommission(n: number): number {
    if (!Number.isFinite(n)) return COMMISSION_DEFAULT;
    return Math.min(COMMISSION_MAX, Math.max(COMMISSION_MIN, n));
}

/** 9 이상 30 이하의 유한수인지 검사. */
export function isValidCommission(n: number): boolean {
    return Number.isFinite(n) && n >= COMMISSION_MIN && n <= COMMISSION_MAX;
}

/**
 * Prisma Decimal / string / number 등 어떤 형태로 와도 안전하게 number로 변환.
 * typeof === 'number' 비교는 Prisma Decimal에서 항상 false → Number() 사용 필수.
 * 유한수가 아니면 DEFAULT 반환.
 */
export function parseCommissionRate(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : COMMISSION_DEFAULT;
}
