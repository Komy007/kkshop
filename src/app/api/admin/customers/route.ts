import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET() {
    try {
        // Authenticate User as Admin or SuperAdmin
        const session = await auth();
        if (!session?.user || session.user.role === 'USER') {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 });
        }

        const customers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(customers);

    } catch (error) {
        console.error('Failed to fetch customers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
