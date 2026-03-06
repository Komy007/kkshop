import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const reviews = await prisma.productReview.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        sku: true,
                        translations: {
                            where: { langCode: 'ko' },
                            take: 1
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
            orderBy: {
                createdAt: 'desc'
            }
        });

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

        return NextResponse.json(formattedReviews);
    } catch (error) {
        console.error('Failed to fetch admin reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
