import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

const PAGE_SIZE = 30;

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // PENDING | APPROVED | REJECTED
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

        const where = status ? { status } : {};

        const [reviews, total] = await Promise.all([
            prisma.productReview.findMany({
                where,
                include: {
                    product: {
                        select: {
                            id: true,
                            sku: true,
                            translations: {
                                where: { langCode: 'ko' },
                                take: 1,
                                select: { name: true }
                            }
                        }
                    },
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    translations: {
                        where: { langCode: 'ko' },
                        take: 1
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
            }),
            prisma.productReview.count({ where }),
        ]);

        // Format for admin consumption
        const formattedReviews = reviews.map(r => ({
            id: r.id.toString(),
            productId: r.productId.toString(),
            productName: r.product.translations[0]?.name || r.product.sku,
            userId: r.userId,
            userName: r.user.name,
            userEmail: r.user.email,
            rating: r.rating,
            content: r.translations[0]?.content || '',
            imageUrl: r.imageUrl,
            status: r.status,
            createdAt: r.createdAt.toISOString()
        }));

        return NextResponse.json({
            reviews: formattedReviews,
            total,
            page,
            pageSize: PAGE_SIZE,
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (error) {
        console.error('Failed to fetch admin reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
