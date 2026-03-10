import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { deleteGCSFiles } from '@/lib/gcs';

export const dynamic = 'force-dynamic';

const translate = new Translate();
const TARGET_LANGS = ['ko', 'en', 'km', 'zh'];

// ── GET: single product detail (with all translations, images, options) ─────
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await context.params;
        const product = await prisma.product.findUnique({
            where: { id: BigInt(id) },
            include: {
                translations: { orderBy: { langCode: 'asc' } },
                images: { orderBy: { sortOrder: 'asc' } },
                options: { orderBy: { sortOrder: 'asc' } },
                productVariants: { orderBy: { sortOrder: 'asc' } },
                category: true,
                supplier: { select: { id: true, companyName: true, brandName: true } },
            },
        });

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Explicitly serialize every field — no ...spread to avoid hidden BigInt/Decimal leaking
        const safe = {
            id: product.id.toString(),
            sku: product.sku,
            priceUsd: product.priceUsd.toString(),
            stockQty: product.stockQty,
            stockAlertQty: product.stockAlertQty,
            categoryId: product.categoryId?.toString() ?? null,
            supplierId: product.supplierId ?? null,
            status: product.status,
            approvalStatus: product.approvalStatus,
            imageUrl: product.imageUrl ?? null,
            isNew: product.isNew,
            isHotSale: product.isHotSale,
            hotSalePrice: product.hotSalePrice != null ? product.hotSalePrice.toString() : null,
            reviewAvg: product.reviewAvg.toString(),
            reviewCount: product.reviewCount,
            brandName: product.brandName ?? null,
            volume: product.volume ?? null,
            skinType: product.skinType ?? null,
            origin: product.origin ?? null,
            expiryMonths: product.expiryMonths ?? null,
            certifications: product.certifications ?? null,
            costPrice: product.costPrice != null ? product.costPrice.toString() : null,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            category: product.category ? {
                id: product.category.id.toString(),
                slug: product.category.slug,
                nameKo: product.category.nameKo,
                nameEn: product.category.nameEn,
                nameKm: product.category.nameKm,
                nameZh: product.category.nameZh,
                sortOrder: product.category.sortOrder,
                isSystem: product.category.isSystem,
            } : null,
            supplier: product.supplier ? {
                id: product.supplier.id,
                companyName: product.supplier.companyName,
                brandName: product.supplier.brandName ?? null,
            } : null,
            translations: product.translations.map(t => ({
                langCode: t.langCode,
                name: t.name,
                shortDesc: t.shortDesc ?? null,
                detailDesc: t.detailDesc ?? null,
                seoKeywords: t.seoKeywords ?? null,
                ingredients: t.ingredients ?? null,
                howToUse: t.howToUse ?? null,
                benefits: t.benefits ?? null,
            })),
            images: product.images.map(img => ({
                id: img.id.toString(),
                url: img.url,
                altText: img.altText ?? null,
                sortOrder: img.sortOrder,
            })),
            options: product.options.map(opt => ({
                id: opt.id.toString(),
                minQty: opt.minQty,
                maxQty: opt.maxQty ?? null,
                discountPct: opt.discountPct.toString(),
                freeShipping: opt.freeShipping,
                labelKo: opt.labelKo ?? null,
                labelEn: opt.labelEn ?? null,
                sortOrder: opt.sortOrder,
            })),
            variants: (product as any).productVariants.map((v: any) => ({
                id: v.id.toString(),
                variantType: v.variantType,
                variantValue: v.variantValue,
                sku: v.sku ?? null,
                stockQty: v.stockQty,
                priceUsd: v.priceUsd != null ? v.priceUsd.toString() : null,
                imageUrl: v.imageUrl ?? null,
                sortOrder: v.sortOrder,
            })),
        };

        return NextResponse.json(safe);
    } catch (error: any) {
        console.error('GET /api/admin/products/[id] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ── PUT: full product update ─────────────────────────────────────────────────
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json();
        const {
            sku, priceUsd, costPrice, stockAlertQty, stockQty, categoryId, supplierId,
            status, approvalStatus, isNew, isHotSale, hotSalePrice,
            brandName, volume, skinType, origin, expiryMonths, certifications,
            baseLang, name, shortDesc, detailDesc, ingredients, howToUse, benefits, seoKeywords,
            retranslate = false,
            imageUrls = [], // new image URLs to add
            deleteImageIds = [], // image IDs to delete
            options = [], // full options replacement
            variants, // full variants replacement (undefined = no change, [] = delete all, [...] = replace)
        } = body;

        const productId = BigInt(id);

        // Build product update data
        const productData: any = {};
        if (sku !== undefined) productData.sku = sku;
        if (priceUsd !== undefined) productData.priceUsd = parseFloat(priceUsd);
        if (costPrice !== undefined) productData.costPrice = costPrice ? parseFloat(costPrice) : null;
        if (stockAlertQty !== undefined) productData.stockAlertQty = parseInt(stockAlertQty);
        if (stockQty !== undefined) productData.stockQty = parseInt(stockQty);
        if (categoryId !== undefined) productData.categoryId = categoryId ? BigInt(categoryId) : null;
        if (supplierId !== undefined) productData.supplierId = supplierId || null;
        if (status !== undefined) productData.status = status;
        if (approvalStatus !== undefined) productData.approvalStatus = approvalStatus;
        if (isNew !== undefined) productData.isNew = Boolean(isNew);
        if (isHotSale !== undefined) productData.isHotSale = Boolean(isHotSale);
        if (hotSalePrice !== undefined) {
            const parsedHot = hotSalePrice ? parseFloat(hotSalePrice) : null;
            const parsedRegular = priceUsd !== undefined ? parseFloat(priceUsd) : null;
            // Hot sale price must be strictly less than regular price
            if (parsedHot !== null && parsedRegular !== null && parsedHot >= parsedRegular) {
                return NextResponse.json({ error: 'Hot sale price must be lower than the regular price.' }, { status: 400 });
            }
            productData.hotSalePrice = parsedHot;
        }
        if (brandName !== undefined) productData.brandName = brandName || null;
        if (volume !== undefined) productData.volume = volume || null;
        if (skinType !== undefined) productData.skinType = skinType || null;
        if (origin !== undefined) productData.origin = origin || null;
        if (expiryMonths !== undefined) productData.expiryMonths = expiryMonths ? parseInt(expiryMonths) : null;
        if (certifications !== undefined) productData.certifications = certifications || null;

        // Handle translations
        let translationsToUpsert: any[] = [];

        if (name !== undefined && baseLang) {
            if (retranslate) {
                // Translate to all languages
                for (const lang of TARGET_LANGS) {
                    if (lang === baseLang) {
                        translationsToUpsert.push({
                            langCode: lang, name,
                            shortDesc: shortDesc || null, detailDesc: detailDesc || null,
                            seoKeywords: seoKeywords || null, ingredients: ingredients || null,
                            howToUse: howToUse || null, benefits: benefits || null,
                        });
                    } else {
                        try {
                            const [tName] = await translate.translate(name, lang);
                            const [tShortDesc] = shortDesc ? await translate.translate(shortDesc, lang) : [null];
                            const [tDetailDesc] = detailDesc ? await translate.translate(detailDesc, lang) : [null];
                            const [tIngredients] = ingredients ? await translate.translate(ingredients, lang) : [null];
                            const [tHowToUse] = howToUse ? await translate.translate(howToUse, lang) : [null];
                            const [tBenefits] = benefits ? await translate.translate(benefits, lang) : [null];
                            const [tSeoKeywords] = seoKeywords ? await translate.translate(seoKeywords, lang) : [null];
                            translationsToUpsert.push({
                                langCode: lang, name: tName,
                                shortDesc: tShortDesc || null, detailDesc: tDetailDesc || null,
                                seoKeywords: tSeoKeywords || null, ingredients: tIngredients || null,
                                howToUse: tHowToUse || null, benefits: tBenefits || null,
                            });
                        } catch {
                            // Use original text as fallback when translation fails
                            translationsToUpsert.push({
                                langCode: lang, name: name,
                                shortDesc: shortDesc || null, detailDesc: detailDesc || null,
                                seoKeywords: seoKeywords || null, ingredients: ingredients || null,
                                howToUse: howToUse || null, benefits: benefits || null,
                            });
                        }
                    }
                }
            } else {
                // Update only the base language
                translationsToUpsert.push({
                    langCode: baseLang, name,
                    shortDesc: shortDesc || null, detailDesc: detailDesc || null,
                    seoKeywords: seoKeywords || null, ingredients: ingredients || null,
                    howToUse: howToUse || null, benefits: benefits || null,
                });
            }
        }

        await prisma.$transaction(async (tx) => {
            // 1. Update product core fields
            if (Object.keys(productData).length > 0) {
                await tx.product.update({ where: { id: productId }, data: productData });
            }

            // 2. Upsert translations
            for (const t of translationsToUpsert) {
                await tx.productTranslation.upsert({
                    where: { productId_langCode: { productId, langCode: t.langCode } },
                    create: { productId, ...t },
                    update: t,
                });
            }

            // 3. Delete removed images (DB first, then GCS after transaction)
            if (deleteImageIds.length > 0) {
                // Fetch URLs before deletion so we can clean up GCS afterward
                const toDelete = await tx.productImage.findMany({
                    where: { id: { in: deleteImageIds.map((id: string) => BigInt(id)) }, productId },
                    select: { url: true },
                });
                await tx.productImage.deleteMany({
                    where: { id: { in: deleteImageIds.map((id: string) => BigInt(id)) }, productId },
                });
                // Update main imageUrl if the first image was deleted
                const remaining = await tx.productImage.findFirst({
                    where: { productId },
                    orderBy: { sortOrder: 'asc' },
                });
                await tx.product.update({
                    where: { id: productId },
                    data: { imageUrl: remaining?.url ?? null },
                });
                // Delete from GCS (outside transaction scope via returned URLs)
                if (toDelete.length > 0) {
                    deleteGCSFiles(toDelete.map(img => img.url)).catch(err =>
                        console.error('[GCS] Image delete failed:', err)
                    );
                }
            }

            // 4. Add new images
            if (imageUrls.length > 0) {
                const maxSort = await tx.productImage.findFirst({
                    where: { productId },
                    orderBy: { sortOrder: 'desc' },
                    select: { sortOrder: true },
                });
                const startSort = (maxSort?.sortOrder ?? -1) + 1;
                await tx.productImage.createMany({
                    data: imageUrls.map((url: string, i: number) => ({
                        productId, url, sortOrder: startSort + i,
                    })),
                });
                // Update imageUrl to the first image if not set
                const firstImg = await tx.productImage.findFirst({
                    where: { productId }, orderBy: { sortOrder: 'asc' }
                });
                if (firstImg) {
                    await tx.product.update({
                        where: { id: productId },
                        data: { imageUrl: firstImg.url },
                    });
                }
            }

            // 5. Replace options if provided
            if (options.length > 0) {
                await tx.productOption.deleteMany({ where: { productId } });
                await tx.productOption.createMany({
                    data: options.map((opt: any, i: number) => ({
                        productId,
                        minQty: parseInt(opt.minQty) || 1,
                        maxQty: opt.maxQty ? parseInt(opt.maxQty) : null,
                        discountPct: parseFloat(opt.discountPct) || 0,
                        freeShipping: Boolean(opt.freeShipping),
                        labelKo: opt.labelKo || null,
                        labelEn: opt.labelEn || null,
                        sortOrder: i,
                    })),
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PUT /api/admin/products/[id] error:', error);
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
