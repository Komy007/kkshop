import { describe, it, expect } from 'vitest';
import {
    matchBulkTier,
    effectiveUnitPrice,
    hasBulkFreeShipping,
} from '@/store/useCartStore';
import type { CartItem, BulkOption } from '@/store/useCartStore';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
    return {
        productId: 'p1',
        name: 'Test Product',
        priceUsd: 7.00,
        imageUrl: '',
        qty: 1,
        ...overrides,
    };
}

const tier1: BulkOption = { minQty: 1, maxQty: 2,   discountPct: 0,  freeShipping: false };
const tier2: BulkOption = { minQty: 3, maxQty: 5,   discountPct: 10, freeShipping: false };
const tier3: BulkOption = { minQty: 6, maxQty: null, discountPct: 15, freeShipping: true  };

// ────────────────────────────────────────────────────────────────────────────
describe('matchBulkTier', () => {
    it('returns null when bulkOptions is absent', () => {
        expect(matchBulkTier(makeItem({ qty: 5 }))).toBeNull();
    });

    it('returns null when bulkOptions is empty', () => {
        expect(matchBulkTier(makeItem({ bulkOptions: [], qty: 5 }))).toBeNull();
    });

    it('returns null when qty is below all tier minimums', () => {
        // tiers start at minQty=3, qty=1
        const item = makeItem({ bulkOptions: [tier2, tier3], qty: 1 });
        expect(matchBulkTier(item)).toBeNull();
    });

    it('matches the exact range tier', () => {
        const item = makeItem({ bulkOptions: [tier1, tier2, tier3], qty: 3 });
        expect(matchBulkTier(item)).toEqual(tier2);
    });

    it('picks the highest-minQty tier when multiple ranges overlap', () => {
        const lo: BulkOption = { minQty: 1, maxQty: 10, discountPct: 5,  freeShipping: false };
        const hi: BulkOption = { minQty: 3, maxQty: 10, discountPct: 10, freeShipping: false };
        const item = makeItem({ bulkOptions: [lo, hi], qty: 5 });
        expect(matchBulkTier(item)).toEqual(hi);
    });

    it('matches a tier with null maxQty (unlimited)', () => {
        const item = makeItem({ bulkOptions: [tier1, tier2, tier3], qty: 100 });
        expect(matchBulkTier(item)).toEqual(tier3);
    });

    it('falls back to highest eligible tier when qty exceeds all capped maxQty', () => {
        const capped: BulkOption[] = [
            { minQty: 1, maxQty: 2, discountPct: 0,  freeShipping: false },
            { minQty: 3, maxQty: 5, discountPct: 10, freeShipping: false },
        ];
        const item = makeItem({ bulkOptions: capped, qty: 10 });
        const result = matchBulkTier(item);
        // highest eligible tier has minQty=3
        expect(result?.minQty).toBe(3);
        expect(result?.discountPct).toBe(10);
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe('effectiveUnitPrice', () => {
    it('returns basePriceUsd when no bulk options', () => {
        expect(effectiveUnitPrice(makeItem({ basePriceUsd: 6.00, qty: 1 }))).toBe(6.00);
    });

    it('falls back to priceUsd for legacy items that lack basePriceUsd', () => {
        // Old localStorage items only have priceUsd
        expect(effectiveUnitPrice(makeItem({ priceUsd: 7.00, qty: 1 }))).toBe(7.00);
    });

    it('returns base price unchanged when qty does not meet any tier', () => {
        const item = makeItem({ basePriceUsd: 6.00, bulkOptions: [tier2, tier3], qty: 1 });
        expect(effectiveUnitPrice(item)).toBe(6.00);
    });

    it('returns base price when matched tier has 0% discount', () => {
        const item = makeItem({ basePriceUsd: 6.00, bulkOptions: [tier1], qty: 1 });
        expect(effectiveUnitPrice(item)).toBe(6.00);
    });

    it('applies 10% discount: $7.00 × 0.90 = $6.30', () => {
        const item = makeItem({ basePriceUsd: 7.00, bulkOptions: [tier2], qty: 3 });
        expect(effectiveUnitPrice(item)).toBe(6.30);
    });

    it('canonical example — hot-sale $6.00 × 15% = $5.10', () => {
        // priceUsd=$7 (original), basePriceUsd=$6 (hot-sale), 15% tier at qty≥6
        const item = makeItem({
            priceUsd: 7.00,
            basePriceUsd: 6.00,
            bulkOptions: [tier3],
            qty: 6,
        });
        expect(effectiveUnitPrice(item)).toBe(5.10);
    });

    it('rounds result to 2 decimal places', () => {
        // $3.33 × 90% = $2.997 → $3.00
        const item = makeItem({
            basePriceUsd: 3.33,
            bulkOptions: [{ minQty: 2, maxQty: null, discountPct: 10, freeShipping: false }],
            qty: 2,
        });
        expect(effectiveUnitPrice(item)).toBe(3.00);
    });

    it('applies fallback tier when qty exceeds all capped maxQty', () => {
        // Only tier: minQty=3, maxQty=5, 15% — qty=10 exceeds cap → fallback applies
        const item = makeItem({
            basePriceUsd: 6.00,
            bulkOptions: [{ minQty: 3, maxQty: 5, discountPct: 15, freeShipping: true }],
            qty: 10,
        });
        expect(effectiveUnitPrice(item)).toBe(5.10);
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe('hasBulkFreeShipping', () => {
    it('returns false when no bulk options', () => {
        expect(hasBulkFreeShipping(makeItem({ qty: 10 }))).toBe(false);
    });

    it('returns false when qty does not meet any tier', () => {
        const item = makeItem({ bulkOptions: [tier2, tier3], qty: 1 });
        expect(hasBulkFreeShipping(item)).toBe(false);
    });

    it('returns false when matched tier has freeShipping: false', () => {
        const item = makeItem({ bulkOptions: [tier2], qty: 3 });
        expect(hasBulkFreeShipping(item)).toBe(false);
    });

    it('returns true when matched tier has freeShipping: true', () => {
        const item = makeItem({ bulkOptions: [tier1, tier2, tier3], qty: 6 });
        expect(hasBulkFreeShipping(item)).toBe(true);
    });

    it('ignores freeShipping from non-matched tiers', () => {
        // tier1(1-2, freeShipping=false), tier3(6+, freeShipping=true) — qty=2 hits tier1 only
        const item = makeItem({ bulkOptions: [tier1, tier3], qty: 2 });
        expect(hasBulkFreeShipping(item)).toBe(false);
    });

    it('uses fallback tier freeShipping when qty exceeds all capped maxQty', () => {
        const capped: BulkOption[] = [
            { minQty: 3, maxQty: 5, discountPct: 15, freeShipping: true },
        ];
        const item = makeItem({ bulkOptions: capped, qty: 10 });
        expect(hasBulkFreeShipping(item)).toBe(true);
    });
});
