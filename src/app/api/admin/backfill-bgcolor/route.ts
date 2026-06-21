// 기존 상품 bgColor 백필 — 배포 후 SUPERADMIN이 1회 POST 호출로 실행
// 백필 완료 후 이 파일은 제거 가능
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { getDominantBgColor } from '@/lib/imageColor';

export const dynamic = 'force-dynamic';

const CONCURRENCY = 5;

export async function POST(_req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'SUPERADMIN only' }, { status: 403 });
    }

    // bgColor가 없고 이미지가 있는 ACTIVE 상품만 대상
    const products = await prisma.product.findMany({
        where: { bgColor: null, status: 'ACTIVE' },
        select: {
            id: true,
            imageUrl: true,
            images: { where: { imageType: 'MAIN' }, orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
        },
    });

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    // 동시성 5개로 제한 (from-urls 라우트의 PARALLEL_LIMIT 패턴 동일)
    const queue = [...products];
    const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length > 0) {
            const p = queue.shift();
            if (!p) break;

            const imgUrl = p.images[0]?.url ?? p.imageUrl;
            if (!imgUrl) {
                skipped++;
                continue;
            }

            const bgColor = await getDominantBgColor(imgUrl);
            if (bgColor === null) {
                failed++;
                continue;
            }

            try {
                await prisma.product.update({
                    where: { id: p.id },
                    data: { bgColor },
                });
                processed++;
            } catch {
                failed++;
            }
        }
    });

    await Promise.all(workers);

    return NextResponse.json({
        success: true,
        total: products.length,
        processed,
        failed,
        skipped,
    });
}
