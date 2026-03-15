import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { translate } from '@/lib/translate';

// ── GET: 내 상품 목록 ────────────────────────────────────────────────────────
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 });

    const products = await prisma.product.findMany({
        where: { supplierId: supplier.id },
        include: {
            translations: { where: { langCode: 'ko' }, select: { langCode: true, name: true } },
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            _count: { select: { images: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products.map(p => ({
        ...p,
        id: p.id.toString(),
        categoryId: p.categoryId?.toString() ?? null,
        priceUsd: p.priceUsd.toString(),
        reviewAvg: p.reviewAvg.toString(),
        hotSalePrice: p.hotSalePrice?.toString() ?? null,
        costPrice: p.costPrice?.toString() ?? null,
        // Strip BigInt id/productId from images — only need url/sortOrder for list display
        images: p.images.map(img => ({
            url: img.url,
            altText: img.altText ?? null,
            sortOrder: img.sortOrder,
        })),
    })));
}

// ── POST: 새 상품 등록 (PENDING으로 저장) ────────────────────────────────────
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 });
    if (supplier.status !== 'APPROVED') return NextResponse.json({ error: '아직 승인되지 않은 공급업체입니다.' }, { status: 403 });

    const body = await req.json();
    const {
        sku, priceUsd, stockQty, categoryId, brandName, volume, origin, skinType, expiryMonths,
        nameKo, shortDescKo, detailDescKo, ingredientsKo, howToUseKo, benefitsKo,
        imageUrls = [], options = [], variants = [],
    } = body;

    if (!sku || !priceUsd || !nameKo) return NextResponse.json({ error: '필수 값 누락' }, { status: 400 });

    // Check for duplicate SKU
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) return NextResponse.json({ error: 'SKU가 이미 존재합니다.' }, { status: 400 });

    // Auto-translate to 4 languages using korean input
    const LANGS: Array<{ code: string; koreanSource: string }> = [
        { code: 'en', koreanSource: 'en' },
        { code: 'km', koreanSource: 'km' },
        { code: 'zh', koreanSource: 'zh' },
    ];

    const translateField = async (text: string, targetLang: string) => {
        if (!text) return '';
        try { return await translate(text, targetLang); } catch { return text; }
    };

    // Build translations for all 4 langs
    const buildTranslation = async (langCode: string, targetLang: string) => ({
        langCode,
        name: langCode === 'ko' ? nameKo : await translateField(nameKo, targetLang),
        shortDesc: langCode === 'ko' ? (shortDescKo || null) : (shortDescKo ? await translateField(shortDescKo, targetLang) : null),
        detailDesc: langCode === 'ko' ? (detailDescKo || null) : (detailDescKo ? await translateField(detailDescKo, targetLang) : null),
        ingredients: langCode === 'ko' ? (ingredientsKo || null) : (ingredientsKo ? await translateField(ingredientsKo, targetLang) : null),
        howToUse: langCode === 'ko' ? (howToUseKo || null) : (howToUseKo ? await translateField(howToUseKo, targetLang) : null),
        benefits: langCode === 'ko' ? (benefitsKo || null) : (benefitsKo ? await translateField(benefitsKo, targetLang) : null),
    });

    const [trKo, trEn, trKm, trZh] = await Promise.all([
        buildTranslation('ko', 'ko'),
        buildTranslation('en', 'en'),
        buildTranslation('km', 'km'),
        buildTranslation('zh', 'zh'),
    ]);

    const optionsData = await Promise.all(options.map(async (opt: any, i: number) => {
        let labelEn = opt.labelKo || null;
        if (opt.labelKo) {
            labelEn = await translateField(opt.labelKo, 'en');
        }
        return {
            minQty: parseInt(opt.minQty) || 1,
            maxQty: opt.maxQty ? parseInt(opt.maxQty) : null,
            discountPct: parseFloat(opt.discountPct) || 0,
            freeShipping: Boolean(opt.freeShipping),
            labelKo: opt.labelKo || null,
            labelEn,
            sortOrder: i
        };
    }));

    const variantsData = (variants as any[]).map((v: any, i: number) => ({
        variantType: v.variantType,
        variantValue: v.variantValue,
        stockQty: parseInt(v.stockQty) || 0,
        priceUsd: v.priceUsd ? parseFloat(v.priceUsd) : null,
        sortOrder: i,
    }));

    const product = await prisma.product.create({
        data: {
            sku,
            priceUsd,
            stockQty: parseInt(stockQty) || 0,
            categoryId: categoryId ? BigInt(categoryId) : null,
            supplierId: supplier.id,
            brandName: brandName || null,
            volume: volume || null,
            origin: origin || null,
            skinType: skinType || null,
            expiryMonths: expiryMonths ? parseInt(expiryMonths) : null,
            status: 'INACTIVE',
            approvalStatus: 'PENDING',
            imageUrl: imageUrls[0] || null,
            translations: { create: [trKo, trEn, trKm, trZh] },
            ...(imageUrls.length > 0 && {
                images: { create: imageUrls.map((url: string, i: number) => ({ url, sortOrder: i })) },
            }),
            ...(optionsData.length > 0 && {
                options: { create: optionsData },
            }),
            ...(variantsData.length > 0 && {
                variants: { create: variantsData },
            }),
        },
    });

    return NextResponse.json({ success: true, id: product.id.toString() }, { status: 201 });
}
