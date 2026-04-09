import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { translate, detectLanguage } from '@/lib/translate';

const PAGE_SIZE = 30;

// ── GET: 내 상품 목록 (with pagination) ──────────────────────────────────────
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    // approvalStatus filter for server-side tab filtering
    const approvalFilter = searchParams.get('approvalStatus') || 'ALL';
    const search = searchParams.get('search')?.trim() || '';

    const where: any = { supplierId: supplier.id };
    if (approvalFilter && approvalFilter !== 'ALL') where.approvalStatus = approvalFilter;
    if (search) {
        where.OR = [
            { translations: { some: { name: { contains: search, mode: 'insensitive' } } } },
            { sku: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                translations: { where: { langCode: { in: ['ko', 'en'] } }, select: { langCode: true, name: true } },
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                _count: { select: { images: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.product.count({ where }),
    ]);

    return NextResponse.json({
        products: products.map(p => ({
        id: p.id.toString(),
        sku: p.sku,
        priceUsd: p.priceUsd.toString(),
        stockQty: p.stockQty,
        categoryId: p.categoryId?.toString() ?? null,
        status: p.status,
        approvalStatus: p.approvalStatus,
        rejectionReason: p.rejectionReason ?? null,
        imageUrl: p.imageUrl ?? null,
        brandName: p.brandName ?? null,
        isNew: p.isNew,
        isHotSale: p.isHotSale,
        hotSalePrice: p.hotSalePrice?.toString() ?? null,
        costPrice: p.costPrice?.toString() ?? null,
        reviewAvg: p.reviewAvg.toString(),
        reviewCount: p.reviewCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        translations: p.translations,
        images: p.images.map(img => ({
            url: img.url,
            altText: img.altText ?? null,
            sortOrder: img.sortOrder,
        })),
        _count: p._count,
    })),
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
    });
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
        certifications,
        unitLabel, unitsPerPkg,
        weightGram, lengthCm, widthCm, heightCm,
        nameKo, shortDescKo, detailDescKo, ingredientsKo, howToUseKo, benefitsKo,
        imageUrls = [], options = [], variants = [],
    } = body;

    if (!sku || !priceUsd || !nameKo) return NextResponse.json({ error: '필수 값 누락' }, { status: 400 });

    // SKU length limit (max 50 chars)
    if (sku.trim().length > 50) return NextResponse.json({ error: 'SKU는 50자 이하여야 합니다.' }, { status: 400 });

    // Check for duplicate SKU
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) return NextResponse.json({ error: 'SKU가 이미 존재합니다.' }, { status: 400 });

    // Auto-detect input language from product name — no manual selection needed
    const srcLang: string = await detectLanguage(nameKo);

    const translateField = async (text: string, targetLang: string): Promise<string | null> => {
        if (!text?.trim()) return null;
        try { return (await translate(text, targetLang)) || text; } catch { return text; }
    };

    // Build translations for all 4 langs.
    // Detected language slot → store original text as-is (no API call).
    // All other slots → translate via Google Translate.
    const buildTranslation = async (langCode: string) => ({
        langCode,
        name: langCode === srcLang ? nameKo : await translateField(nameKo, langCode),
        shortDesc: langCode === srcLang ? (shortDescKo || null) : (shortDescKo ? await translateField(shortDescKo, langCode) : null),
        detailDesc: langCode === srcLang ? (detailDescKo || null) : (detailDescKo ? await translateField(detailDescKo, langCode) : null),
        ingredients: langCode === srcLang ? (ingredientsKo || null) : (ingredientsKo ? await translateField(ingredientsKo, langCode) : null),
        howToUse: langCode === srcLang ? (howToUseKo || null) : (howToUseKo ? await translateField(howToUseKo, langCode) : null),
        benefits: langCode === srcLang ? (benefitsKo || null) : (benefitsKo ? await translateField(benefitsKo, langCode) : null),
    });

    const [trKo, trEn, trKm, trZh] = await Promise.all([
        buildTranslation('ko'),
        buildTranslation('en'),
        buildTranslation('km'),
        buildTranslation('zh'),
    ]);

    const optionsData = await Promise.all(options.map(async (opt: any, i: number) => {
        let labelEn = opt.labelKo || null;
        let labelKm = opt.labelKo || null;
        let labelZh = opt.labelKo || null;
        if (opt.labelKo) {
            [labelEn, labelKm, labelZh] = await Promise.all([
                translateField(opt.labelKo, 'en'),
                translateField(opt.labelKo, 'km'),
                translateField(opt.labelKo, 'zh'),
            ]);
        }
        return {
            minQty: parseInt(opt.minQty) || 1,
            maxQty: opt.maxQty ? parseInt(opt.maxQty) : null,
            discountPct: parseFloat(opt.discountPct) || 0,
            freeShipping: Boolean(opt.freeShipping),
            labelKo: opt.labelKo || null,
            labelEn,
            labelKm,
            labelZh,
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
            certifications: certifications || null,
            unitLabel: unitLabel || null,
            unitsPerPkg: unitsPerPkg ? parseInt(unitsPerPkg) : null,
            weightGram: weightGram ?? null,
            lengthCm: lengthCm ?? null,
            widthCm: widthCm ?? null,
            heightCm: heightCm ?? null,
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
