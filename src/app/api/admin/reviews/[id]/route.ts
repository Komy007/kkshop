import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

// Helper function to update product aggregate ratings
async function updateProductRating(productId: bigint, tx: any) {
    const approvedReviews = await tx.productReview.findMany({
        where: {
            productId,
            status: 'APPROVED'
        },
        select: { rating: true }
    });

    const count = approvedReviews.length;
    let avg = 0;
    if (count > 0) {
        const sum = approvedReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        avg = sum / count;
    }

    await tx.product.update({
        where: { id: productId },
        data: {
            reviewCount: count,
            reviewAvg: avg
        }
    });
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reviewIdStr } = await context.params;
    let reviewId: bigint;
    try {
        reviewId = BigInt(reviewIdStr);
    } catch {
        return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { status } = body;

        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const review = await prisma.productReview.findUnique({
            where: { id: reviewId },
            select: { productId: true, status: true }
        });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        const updatedReview = await prisma.$transaction(async (tx) => {
            const updated = await tx.productReview.update({
                where: { id: reviewId },
                data: { status }
            });

            // only recalculate if transitioning to/from APPROVED
            if (review.status === 'APPROVED' || status === 'APPROVED') {
                await updateProductRating(review.productId, tx);
            }

            return updated;
        });

        return NextResponse.json({ success: true, status: updatedReview.status });
    } catch (error) {
        console.error('Failed to update review:', error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
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

    const { id: reviewIdStr } = await context.params;
    let reviewId: bigint;
    try {
        reviewId = BigInt(reviewIdStr);
    } catch {
        return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    try {
        const review = await prisma.productReview.findUnique({
            where: { id: reviewId },
            select: { productId: true, status: true }
        });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.productReview.delete({
                where: { id: reviewId }
            });

            if (review.status === 'APPROVED') {
                await updateProductRating(review.productId, tx);
            }
        });

        return NextResponse.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('Failed to delete review:', error);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}
