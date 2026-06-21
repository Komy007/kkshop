import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { translate, detectLanguage } from '@/lib/translate';
import { getDominantBgColor } from '@/lib/imageColor';

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
        // Support both new field names (name, shortDesc, ...) and legacy Ko-suffix names
        name: nameInput, shortDesc: shortDescInput, detailDesc: detailDescInput,
        ingredients: ingredientsInput, howToUse: howToUseInput, benefits: benefitsInput,
        nameKo: nameKoLegacy, shortDescKo, detailDescKo, ingredientsKo, howToUseKo, benefitsKo,
        imageUrls = [], detailImageUrls = [],
        imageAlts = [], detailImageAlts = [],
        options = [], variants = [],
        doTranslate = true,
        baseLang,
    } = body;

    const nameKo = nameInput ?? nameKoLegacy;
    const shortDescKoFinal = shortDescInput ?? shortDescKo;
    const detailDescKoFinal = detailDescInput ?? detailDescKo;
    const ingredientsKoFinal = ingredientsInput ?? ingredientsKo;
    const howToUseKoFinal = howToUseInput ?? howToUseKo;
    const benefitsKoFinal = benefitsInput ?? benefitsKo;

    if (!sku || !priceUsd || !nameKo) return NextResponse.json({ error: 'Missing required fields: sku, priceUsd, name' }, { status: 400 });

    // SKU length limit (max 50 chars)
    if (sku.trim().length > 50) return NextResponse.json({ error: 'SKU must be 50 characters or less.' }, { status: 400 });

    // Check for duplicate SKU
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) return NextResponse.json({ error: 'SKU already exists.' }, { status: 400 });

    // Auto-detect input language (use provided baseLang if set, else auto-detect)
    const srcLang: string = baseLang || (await detectLanguage(nameKo));

    const translateField = async (text: string, targetLang: string): Promise<string | null> => {
        if (!text?.trim()) return null;
        try { return (await translate(text, targetLang)) || text; } catch { return text; }
    };

    // Build translations for all 4 langs.
    // If doTranslate=false, copy the same text to all languages without API calls.
    // If doTranslate=true, detected/selected language slot → original text, other slots → Google Translate.
    const buildTranslation = async (langCode: string) => ({
        langCode,
        name: (!doTranslate || langCode === srcLang) ? nameKo : await translateField(nameKo, langCode),
        shortDesc: !shortDescKoFinal ? null : ((!doTranslate || langCode === srcLang) ? shortDescKoFinal : await translateField(shortDescKoFinal, langCode)),
        detailDesc: !detailDescKoFinal ? null : ((!doTranslate || langCode === srcLang) ? detailDescKoFinal : await translateField(detailDescKoFinal, langCode)),
        ingredients: !ingredientsKoFinal ? null : ((!doTranslate || langCode === srcLang) ? ingredientsKoFinal : await translateField(ingredientsKoFinal, langCode)),
        howToUse: !howToUseKoFinal ? null : ((!doTranslate || langCode === srcLang) ? howToUseKoFinal : await translateField(howToUseKoFinal, langCode)),
        benefits: !benefitsKoFinal ? null : ((!doTranslate || langCode === srcLang) ? benefitsKoFinal : await translateField(benefitsKoFinal, langCode)),
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

    // 배경색 사전 추출
    const firstSellerImageUrl: string | null = imageUrls[0] || null;
    let sellerBgColor: string | null = null;
    if (firstSellerImageUrl) {
        sellerBgColor = await getDominantBgColor(firstSellerImageUrl);
    }

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
            imageUrl: firstSellerImageUrl,
            ...(sellerBgColor !== null ? { bgColor: sellerBgColor } : {}),
            translations: { create: [trKo, trEn, trKm, trZh] },
            ...((imageUrls.length > 0 || detailImageUrls.length > 0) && {
                images: {
                    create: [
                        ...imageUrls.slice(0, 10).map((url: string, i: number) => ({
                            url,
                            altText: imageAlts[i]?.trim() || null,
                            sortOrder: i,
                            imageType: 'MAIN',
                        })),
                        ...detailImageUrls.slice(0, 50).map((url: string, i: number) => ({
                            url,
                            altText: detailImageAlts[i]?.trim() || null,
                            sortOrder: i,
                            imageType: 'DETAIL',
                        })),
                    ],
                },
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
