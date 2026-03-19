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

// SUPERADMIN 전용 설정 키 — ADMIN은 읽기만 가능, 쓰기 불가
const SUPERADMIN_ONLY_KEYS = new Set([
    'email_smtp_settings',   // SMTP 자격증명 (탈취 시 피싱 메일 발송 가능)
    'payment_gateway',       // 결제 게이트웨이 설정
    'seo_config',            // 사이트 전체 SEO/GA 설정
    'shipping_settings',     // 배송비 정책
    'google_translate_key',  // Google API 키
]);

// Admin only - Upsert Setting
export async function POST(request: Request) {
    const session = await auth();
    const callerRole = session?.user?.role ?? '';
    if (!['ADMIN', 'SUPERADMIN'].includes(callerRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 });
        }

        // SUPERADMIN 전용 키는 ADMIN이 수정 불가
        if (SUPERADMIN_ONLY_KEYS.has(key) && callerRole !== 'SUPERADMIN') {
            return NextResponse.json({ error: `'${key}' 설정은 SUPERADMIN만 변경할 수 있습니다.` }, { status: 403 });
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
