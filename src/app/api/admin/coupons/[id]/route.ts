import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const body = await request.json();

        // Update isActive status or other fields
        const coupon = await prisma.coupon.update({
            where: { id },
            data: body
        });

        return NextResponse.json(coupon);
    } catch (error) {
        console.error('Failed to update coupon:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await context.params;

        await prisma.coupon.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete coupon:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
