import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

// Fetch multiple keys by comma separating them OR fetch all if no key is provided.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');

    try {
        if (keys) {
            const keysArray = keys.split(',');
            const settings = await prisma.siteSetting.findMany({
                where: { key: { in: keysArray } }
            });
            return NextResponse.json(settings);
        } else {
            // Fetch all settings (Admin use)
            const session = await auth();
            if (!session?.user || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPERADMIN') {
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
    if (!session?.user || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPERADMIN') {
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
