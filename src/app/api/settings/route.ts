import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');

    try {
        if (!keys) {
            return NextResponse.json({ error: 'Keys are required for public access' }, { status: 400 });
        }

        const keysArray = keys.split(',');
        const settings = await prisma.siteSetting.findMany({
            where: { key: { in: keysArray } }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to fetch public settings:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
