import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// Public-safe keys: only these can be fetched without authentication
const PUBLIC_SETTING_KEYS = new Set([
    'site_name',
    'site_logo',
    'site_announcement',
    'promo_banner',
    'shipping_info',
    'points_rate',
]);

// Fetch multiple keys by comma separating them OR fetch all if no key is provided.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');

    try {
        if (keys) {
            const keysArray = keys.split(',').map(k => k.trim()).filter(Boolean);

            // Check if ALL requested keys are public-safe
            const hasPrivateKey = keysArray.some(k => !PUBLIC_SETTING_KEYS.has(k));

            if (hasPrivateKey) {
                // Private keys require admin authentication
                const session = await auth();
                if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }

            const settings = await prisma.siteSetting.findMany({
                where: { key: { in: keysArray } }
            });
            return NextResponse.json(settings);
        } else {
            // Fetch all settings — Admin only
            const session = await auth();
            if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const settings = await prisma.siteSetting.findMany();
            return NextResponse.json(settings);
        }
    } catch (error) {
        console.error('Failed to fetch site settings:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// Admin only - Upsert Setting
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 });
        }

        const setting = await prisma.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        return NextResponse.json(setting);
    } catch (error) {
        console.error('Failed to update setting:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
