import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings?keys=site_name,chat_widget_enabled
 *
 * SECURITY: Only keys in PUBLIC_SETTING_KEYS are returned without auth.
 * Attempting to read any private key (e.g. email_smtp_settings) returns 403.
 * Admin-level settings must be fetched via /api/admin/settings (requires auth).
 */
const PUBLIC_SETTING_KEYS = new Set([
    'site_name',
    'site_logo',
    'site_announcement',
    'promo_banner',
    'shipping_info',
    'points_rate',
    'chat_widget_enabled',
    'maintenance_mode',
    'free_shipping_threshold',
    'landing_trust_badges',
    'landing_top_banner',
]);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');

    if (!keys) {
        return NextResponse.json({ error: 'keys parameter is required' }, { status: 400 });
    }

    const keysArray = keys.split(',').map(k => k.trim()).filter(Boolean);

    // Block any key that is not in the explicit allowlist
    const forbidden = keysArray.filter(k => !PUBLIC_SETTING_KEYS.has(k));
    if (forbidden.length > 0) {
        return NextResponse.json(
            { error: 'Access denied', forbidden },
            { status: 403 },
        );
    }

    try {
        const settings = await prisma.siteSetting.findMany({
            where: { key: { in: keysArray } },
        });
        return NextResponse.json(settings);
    } catch (error) {
        console.error('GET /api/settings error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
