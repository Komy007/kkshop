import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                phone: true,
                address: true,
                detailAddress: true,
                pointBalance: true,
                referralCode: true,
                _count: { select: { referralRewards: true } },
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({
            id: session.user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            phone: user.phone,
            address: user.address,
            detailAddress: user.detailAddress,
            pointBalance: user.pointBalance,
            referralCode: user.referralCode,
            referralCount: (user as any)._count?.referralRewards ?? 0,
        });
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
