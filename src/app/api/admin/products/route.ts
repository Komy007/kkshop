import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { deleteGCSFiles } from '@/lib/gcs';

export const dynamic = 'force-dynamic';

const translate = new Translate();
const TARGET_LANGS = ['ko', 'en', 'km', 'zh'];

const PAGE_SIZE = 50;

// ── GET: list products (admin) with pagination + search + category filter ────
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const approvalStatus = searchParams.get('approvalStatus');
        const search = searchParams.get('search')?.trim() || '';
        const categorySlug = searchParams.get('category') || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

        const where: any = {};
        if (status) where.status = status;
        // approvalStatus filter: 'pending' → PENDING only, 'all' or empty → no filter (show everything)
        if (approvalStatus && approvalStatus !== 'all') {
            where.approvalStatus = approvalStatus.toUpperCase();
        }
        if (categorySlug && categorySlug !== 'all') {
            where.category = { slug: categorySlug };
        }
        if (search) {
            where.OR = [
                { translations: { some: { langCode: 'ko', name: { contains: search, mode: 'insensitive' } } } },
                { sku: { contains: search, mode: 'insensitive' } },
                { brandName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    translations: {
                        where: { langCode: 'ko' },
                        select: { langCode: true, name: true },
                    },
                    category: { select: { id: true, slug: true, nameKo: true } },
                    supplier: { select: { id: true, companyName: true } },
                    images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                    _count: { select: { images: true } },
                },
                orderBy: [{ approvalStatus: 'asc' }, { displayPriority: 'desc' }, { isNew: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
            }),
            prisma.product.count({ where }),
        ]);

        // Serialize BigInt and Decimal (including nested)
        const safe = products.map(p => ({
            ...p,
            id: p.id.toString(),
            categoryId: p.categoryId?.toString() ?? null,
            priceUsd: p.priceUsd.toString(),
            reviewAvg: p.reviewAvg.toString(),
            hotSalePrice: p.hotSalePrice?.toString() ?? null,
            costPrice: p.costPrice?.toString() ?? null,
            category: p.category ? { ...p.category, id: p.category.id.toString() } : null,
            supplier: p.supplier ? { id: p.supplier.id.toString(), companyName: p.supplier.companyName } : null,
            images: p.images.map(img => ({
                ...img,
                id: img.id.toString(),
                productId: img.productId.toString(),
            }))
        }));

        return NextResponse.json({ products: safe, total, page, pageSize: PAGE_SIZE });
    } catch (error: any) {
        console.error('GET /api/admin/products error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ── DELETE: remove a product by id ──────────────────────────────────────────
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        // Fetch image URLs before deletion so we can remove them from GCS
        const product = await prisma.product.findUnique({
            where: { id: BigInt(id) },
            include: { images: { select: { url: true } } },
        });

        // Block deletion if there are active (non-completed) orders referencing this product
        const activeOrderCount = await prisma.orderItem.count({
            where: {
                productId: BigInt(id),
                order: {
                    status: { in: ['PENDING', 'CONFIRMED', 'SHIPPING'] },
                },
            },
        });
        if (activeOrderCount > 0) {
            return NextResponse.json(
                { error: `진행 중인 주문(${activeOrderCount}건)이 있어 삭제할 수 없습니다. 주문 완료 후 삭제해주세요.` },
                { status: 409 }
            );
        }

        await prisma.product.delete({ where: { id: BigInt(id) } });

        // Delete all product images from GCS (non-blocking, won't fail the request)
        if (product?.images?.length) {
            deleteGCSFiles(product.images.map(img => img.url)).catch(err =>
                console.error('[GCS] Product image cleanup failed:', err)
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /api/admin/products error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ── PATCH: update product (category move, isNew toggle, status, stock) ─────
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const body = await req.json();
        const { id, categoryId, isNew, isTodayPick, displayPriority, status, approvalStatus, rejectionReason, stockQty, priceUsd, isHotSale, hotSalePrice, costPrice, stockAlertQty, badgeAuthentic, badgeKoreanCertified } = body;
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        const data: any = {};
        if (categoryId !== undefined) data.categoryId = categoryId ? BigInt(categoryId) : null;
        if (isNew !== undefined) data.isNew = Boolean(isNew);
        if (isHotSale !== undefined) data.isHotSale = Boolean(isHotSale);
        if (hotSalePrice !== undefined) {
            const parsedHot = hotSalePrice ? parseFloat(hotSalePrice) : null;
            // Fetch current price if not provided in request to avoid incorrect comparison
            let comparePrice = priceUsd !== undefined ? parseFloat(priceUsd) : null;
            if (comparePrice === null && parsedHot !== null) {
                const current = await prisma.product.findUnique({ where: { id: BigInt(id) }, select: { priceUsd: true } });
                comparePrice = current ? parseFloat(current.priceUsd.toString()) : null;
            }
            if (parsedHot !== null && comparePrice !== null && parsedHot >= comparePrice) {
                return NextResponse.json({ error: 'Hot sale price must be lower than the regular price.' }, { status: 400 });
            }
            data.hotSalePrice = parsedHot;
        }
        if (status !== undefined) data.status = status;
        if (approvalStatus !== undefined) {
            const VALID_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
            if (!VALID_APPROVAL_STATUSES.includes(approvalStatus)) {
                return NextResponse.json({ error: 'Invalid approval status' }, { status: 400 });
            }
            data.approvalStatus = approvalStatus;
            // Save rejection reason when rejecting; clear it when approving
            if (approvalStatus === 'REJECTED') {
                data.rejectionReason = rejectionReason?.trim() || null;
            } else if (approvalStatus === 'APPROVED') {
                data.rejectionReason = null;
            }
        }
        if (stockQty !== undefined) data.stockQty = parseInt(stockQty);
        if (priceUsd !== undefined) data.priceUsd = parseFloat(priceUsd);
        if (costPrice !== undefined) data.costPrice = costPrice ? parseFloat(costPrice) : null;
        if (stockAlertQty !== undefined) data.stockAlertQty = parseInt(stockAlertQty);
        if (badgeAuthentic !== undefined) data.badgeAuthentic = Boolean(badgeAuthentic);
        if (badgeKoreanCertified !== undefined) data.badgeKoreanCertified = Boolean(badgeKoreanCertified);
        if (isTodayPick !== undefined) data.isTodayPick = Boolean(isTodayPick);
        if (displayPriority !== undefined) data.displayPriority = Math.max(0, Math.min(999, parseInt(displayPriority) || 0));

        await prisma.product.update({ where: { id: BigInt(id) }, data });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PATCH /api/admin/products error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ── POST: create new product ─────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        // 1. Authenticate Admin/SuperAdmin User
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized Access. Admin required.' }, { status: 403 });
        }

        const body = await req.json();
        const {
            sku,
            priceUsd,
            stockQty,
            categoryId,
            isNew = false,
            baseLang,
            name,
            shortDesc,
            detailDesc,
            ingredients,
            howToUse,
            benefits,
            seoKeywords,
            imageUrls = [],
            supplierId = null,
            brandName = null,
            volume = null,
            skinType = null,
            origin = null,
            expiryMonths = null,
            certifications = null,
            options = [], // [{ minQty, maxQty, discountPct, freeShipping, labelKo }]
            variants = [], // [{ variantType, variantValue, sku?, stockQty, priceUsd?, imageUrl?, sortOrder }]
            doTranslate = false, // translate to all 4 languages only when explicitly requested
        } = body;

        if (!sku || !priceUsd || !name || !baseLang) {
            return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
        }

        // SKU length limit (max 50 chars)
        if (sku.trim().length > 50) {
            return NextResponse.json({ error: 'SKU must be 50 characters or less.' }, { status: 400 });
        }

        // 2. Build base translation row (always used)
        const baseRow = {
            langCode: baseLang,
            name: name,
            shortDesc: shortDesc || null,
            detailDesc: detailDesc || null,
            seoKeywords: seoKeywords || null,
            ingredients: ingredients || null,
            howToUse: howToUse || null,
            benefits: benefits || null,
        };

        const translationsData: typeof baseRow[] = [];

        if (!doTranslate) {
            // No translation requested — save input text for all languages (no API calls)
            for (const lang of TARGET_LANGS) {
                translationsData.push({ ...baseRow, langCode: lang });
            }
        } else {
            // Translate to all 4 languages via Google Translate API
            for (const lang of TARGET_LANGS) {
                if (lang === baseLang) {
                    translationsData.push(baseRow);
                } else {
                    try {
                        const [translatedName] = await translate.translate(name, lang);

                        let translatedShortDesc = shortDesc;
                        if (shortDesc) { [translatedShortDesc] = await translate.translate(shortDesc, lang); }

                        let translatedDetailDesc = detailDesc;
                        if (detailDesc) { [translatedDetailDesc] = await translate.translate(detailDesc, lang); }

                        let translatedSeoKeywords = seoKeywords;
                        if (seoKeywords) { [translatedSeoKeywords] = await translate.translate(seoKeywords, lang); }

                        let translatedIngredients = ingredients;
                        if (ingredients) { [translatedIngredients] = await translate.translate(ingredients, lang); }

                        let translatedHowToUse = howToUse;
                        if (howToUse) { [translatedHowToUse] = await translate.translate(howToUse, lang); }

                        let translatedBenefits = benefits;
                        if (benefits) { [translatedBenefits] = await translate.translate(benefits, lang); }

                        translationsData.push({
                            langCode: lang,
                            name: translatedName,
                            shortDesc: translatedShortDesc || null,
                            detailDesc: translatedDetailDesc || null,
                            seoKeywords: translatedSeoKeywords || null,
                            ingredients: translatedIngredients || null,
                            howToUse: translatedHowToUse || null,
                            benefits: translatedBenefits || null,
                        });
                    } catch (translationError) {
                        console.error(`Translation failed for language: ${lang}`, translationError);
                        // Fallback to original text on API error
                        translationsData.push({ ...baseRow, langCode: lang });
                    }
                }
            }
        }

        // 2b. Translate Options
        const translatedOptions: any[] = [];
        if (options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                let labelEn = opt.labelKo || null;
                if (opt.labelKo && baseLang === 'ko') {
                    try {
                        const [translatedLabel] = await translate.translate(opt.labelKo, 'en');
                        labelEn = translatedLabel;
                    } catch (e) {
                        console.error('Failed to translate option label', e);
                    }
                }
                translatedOptions.push({
                    minQty: parseInt(opt.minQty) || 1,
                    maxQty: opt.maxQty ? parseInt(opt.maxQty) : null,
                    discountPct: parseFloat(opt.discountPct) || 0,
                    freeShipping: Boolean(opt.freeShipping),
                    labelKo: opt.labelKo || null,
                    labelEn: labelEn,
                    sortOrder: i
                });
            }
        }

        // 3. Save to Database using Prisma Transaction
        const newProduct = await prisma.$transaction(async (tx) => {
            // Create root Product object
            const product = await tx.product.create({
                data: {
                    sku,
                    priceUsd: parseFloat(priceUsd),
                    stockQty: parseInt(stockQty) || 0,
                    categoryId: categoryId ? BigInt(categoryId) : null,
                    status: 'ACTIVE',
                    imageUrl: imageUrls[0] || null,
                    supplierId: supplierId || null,
                    brandName: brandName || null,
                    volume: volume || null,
                    skinType: skinType || null,
                    origin: origin || null,
                    expiryMonths: expiryMonths ? parseInt(expiryMonths) : null,
                    certifications: certifications || null,
                }
            });

            // Save all images to ProductImage table
            if (imageUrls.length > 0) {
                await tx.productImage.createMany({
                    data: imageUrls.map((url: string, idx: number) => ({
                        productId: product.id,
                        url,
                        sortOrder: idx,
                    })),
                });
            }

            // Create all ProductTranslation objects
            await tx.productTranslation.createMany({
                data: translationsData.map(t => ({ ...t, productId: product.id }))
            });

            // Create ProductOption objects
            if (translatedOptions.length > 0) {
                await tx.productOption.createMany({
                    data: translatedOptions.map(opt => ({
                        ...opt,
                        productId: product.id
                    }))
                });
            }

            // Create ProductVariant records if provided
            if (variants && variants.length > 0) {
                const validVariants = variants.filter((v: any) => v.variantValue && v.variantValue.trim());
                if (validVariants.length > 0) {
                    await tx.productVariant.createMany({
                        data: validVariants.map((v: any, idx: number) => ({
                            productId: product.id,
                            variantType: v.variantType || 'OTHER',
                            variantValue: v.variantValue.trim(),
                            sku: v.sku ? v.sku.trim() : null,
                            stockQty: parseInt(v.stockQty) || 0,
                            priceUsd: v.priceUsd ? parseFloat(v.priceUsd) : null,
                            imageUrl: v.imageUrl || null,
                            sortOrder: v.sortOrder !== undefined ? parseInt(v.sortOrder) : idx,
                        })),
                    });
                }
            }

            return product;
        });

        // Convert BigInt to string for JSON serialization
        return NextResponse.json({
            success: true,
            productId: newProduct.id.toString(),
            message: 'Product registered and auto-translated successfully.',
            translations: translationsData
        });

    } catch (error: any) {
        console.error('Error creating product:', error);

        // Handle specific Prisma errors like Unique Constraint on SKU
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
