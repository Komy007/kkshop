import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { translate } from '@/lib/translate';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ko';

    // Validate id
    const { id: productIdStr } = await context.params;
    let productId: bigint;
    try {
        productId = BigInt(productIdStr);
    } catch {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const reviews = await prisma.productReview.findMany({
            where: {
                productId,
                status: 'APPROVED'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                },
                translations: {
                    where: { langCode: lang }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedReviews = reviews.map(r => {
            const translation = r.translations[0] || { content: '' };

            // Mask user name (e.g., 홍길동 -> 홍*동)
            let maskedName = 'User';
            if (r.user.name) {
                if (r.user.name.length <= 2) {
                    maskedName = r.user.name.charAt(0) + '*';
                } else {
                    maskedName = r.user.name.charAt(0) + '*'.repeat(r.user.name.length - 2) + r.user.name.slice(-1);
                }
            }

            return {
                id: r.id.toString(),
                userId: r.userId,
                userName: maskedName,
                userImage: r.user.image,
                rating: r.rating,
                content: translation.content,
                imageUrl: r.imageUrl,
                createdAt: r.createdAt.toISOString(),
            };
        });

        return NextResponse.json(formattedReviews);
    } catch (error) {
        console.error('Failed to fetch reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Validate id
    const { id: productIdStr } = await context.params;
    let productId: bigint;
    try {
        productId = BigInt(productIdStr);
    } catch {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { rating, content, imageUrl, orderId } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
        }
        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Review content is required' }, { status: 400 });
        }

        // 구매 검증: orderId가 있으면 실제 구매 여부 + 본인 주문 확인
        if (orderId) {
            const orderItem = await prisma.orderItem.findFirst({
                where: {
                    orderId,
                    productId,
                    order: {
                        userId,
                        status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPING'] },
                    },
                },
            });
            if (!orderItem) {
                return NextResponse.json({ error: '해당 주문에서 구매한 상품이 아닙니다.' }, { status: 403 });
            }
        }

        // 중복 리뷰 방지 (같은 상품에 이미 리뷰가 있으면 차단)
        const existingReview = await prisma.productReview.findFirst({
            where: { productId, userId, status: { not: 'REJECTED' } },
        });
        if (existingReview) {
            return NextResponse.json({ error: '이미 리뷰를 작성한 상품입니다.' }, { status: 409 });
        }

        // Auto-translate to other languages
        const enContent = await translate(content, 'en');
        const zhContent = await translate(content, 'zh-CN');
        const kmContent = await translate(content, 'km');

        // Create review with translations in a transaction
        const review = await prisma.$transaction(async (tx) => {
            const newReview = await tx.productReview.create({
                data: {
                    productId,
                    userId: userId,
                    orderId: orderId || null,
                    rating: parseInt(rating),
                    imageUrl: imageUrl || null,
                    status: 'PENDING',
                }
            });

            await tx.productReviewTranslation.createMany({
                data: [
                    { reviewId: newReview.id, langCode: 'ko', content },
                    { reviewId: newReview.id, langCode: 'en', content: enContent },
                    { reviewId: newReview.id, langCode: 'zh', content: zhContent },
                    { reviewId: newReview.id, langCode: 'km', content: kmContent },
                ]
            });

            return newReview;
        });

        return NextResponse.json({
            success: true,
            message: 'Review submitted successfully and is pending approval.',
            reviewId: review.id.toString()
        });

    } catch (error: any) {
        console.error('Failed to post review:', error);
        // Provide more helpful error message
        const message = error.message || 'Failed to post review';
        return NextResponse.json({
            error: message,
            success: false
        }, { status: 500 });
    }
}
