import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 });
    if (supplier.status !== 'APPROVED') return NextResponse.json({ error: 'Supplier not approved' }, { status: 403 });

    const body = await req.json();
    const { productId } = body;
    if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });

    // Fetch original product and verify ownership
    const original = await prisma.product.findUnique({
        where: { id: BigInt(productId) },
        include: {
            translations: true,
            variants: true,
            options: true,
            images: { orderBy: { sortOrder: 'asc' } },
        },
    });

    if (!original) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (original.supplierId !== supplier.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Build a unique SKU: try "<original>-copy", then "-copy-2", "-copy-3", etc.
    const baseCopySku = `${original.sku}-copy`.slice(0, 100);
    let newSku = baseCopySku;
    let attempt = 1;
    while (true) {
        const conflict = await prisma.product.findUnique({ where: { sku: newSku } });
        if (!conflict) break;
        attempt++;
        newSku = `${original.sku}-copy-${attempt}`.slice(0, 100);
    }

    // Find the Korean translation to prepend "[Copy] "
    const koTranslation = original.translations.find(t => t.langCode === 'ko');
    const newKoName = koTranslation ? `[Copy] ${koTranslation.name}` : undefined;

    const newProduct = await prisma.product.create({
        data: {
            sku:              newSku,
            priceUsd:         original.priceUsd,
            stockQty:         0,
            categoryId:       original.categoryId,
            supplierId:       original.supplierId,
            brandName:        original.brandName,
            volume:           original.volume,
            origin:           original.origin,
            skinType:         original.skinType,
            expiryMonths:     original.expiryMonths,
            certifications:   original.certifications,
            unitLabel:        original.unitLabel,
            unitsPerPkg:      original.unitsPerPkg,
            costPrice:        original.costPrice,
            stockAlertQty:    original.stockAlertQty,
            weightGram:       original.weightGram,
            lengthCm:         original.lengthCm,
            widthCm:          original.widthCm,
            heightCm:         original.heightCm,
            imageUrl:         original.imageUrl,
            isNew:            false,
            isHotSale:        false,
            status:           'INACTIVE',
            approvalStatus:   'PENDING',
            // Reset review stats, badges, priorities
            reviewAvg:        0,
            reviewCount:      0,
            badgeAuthentic:   false,
            badgeKoreanCertified: false,
            displayPriority:  0,
            isTodayPick:      false,
            translations: {
                create: original.translations.map(t => ({
                    langCode:   t.langCode,
                    name:       t.langCode === 'ko' && newKoName ? newKoName : t.name,
                    shortDesc:  t.shortDesc,
                    detailDesc: t.detailDesc,
                    seoKeywords: t.seoKeywords,
                    ingredients: t.ingredients,
                    howToUse:   t.howToUse,
                    benefits:   t.benefits,
                })),
            },
            ...(original.images.length > 0 && {
                images: {
                    create: original.images.map(img => ({
                        url:       img.url,
                        altText:   img.altText,
                        sortOrder: img.sortOrder,
                    })),
                },
            }),
            ...(original.options.length > 0 && {
                options: {
                    create: original.options.map(opt => ({
                        minQty:       opt.minQty,
                        maxQty:       opt.maxQty,
                        discountPct:  opt.discountPct,
                        freeShipping: opt.freeShipping,
                        labelKo:      opt.labelKo,
                        labelEn:      opt.labelEn,
                        labelKm:      opt.labelKm,
                        labelZh:      opt.labelZh,
                        sortOrder:    opt.sortOrder,
                    })),
                },
            }),
            ...(original.variants.length > 0 && {
                variants: {
                    create: original.variants.map((v, i) => ({
                        variantType:  v.variantType,
                        variantValue: v.variantValue,
                        // variant SKU must be unique — append "-copy" suffix
                        sku:          v.sku ? `${v.sku}-copy`.slice(0, 100) : null,
                        stockQty:     0,
                        priceUsd:     v.priceUsd,
                        imageUrl:     v.imageUrl,
                        sortOrder:    i,
                    })),
                },
            }),
        },
    });

    return NextResponse.json({ success: true, productId: newProduct.id.toString() }, { status: 201 });
}
