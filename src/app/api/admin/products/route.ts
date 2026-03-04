import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { Translate } from '@google-cloud/translate/build/src/v2';

const translate = new Translate();
const TARGET_LANGS = ['ko', 'en', 'km', 'zh'];

// ── GET: list all products (admin) ──────────────────────────────────────────
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role === 'USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const products = await prisma.product.findMany({
            where: status ? { status } : {},
            include: {
                translations: {
                    where: { langCode: 'ko' },
                    select: { langCode: true, name: true },
                },
                category: { select: { id: true, slug: true, nameKo: true } },
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                _count: { select: { images: true } },
            },
            orderBy: [{ isNew: 'desc' }, { createdAt: 'desc' }],
        });

        // Serialize BigInt
        const safe = products.map(p => ({
            ...p,
            id: p.id.toString(),
            categoryId: p.categoryId?.toString() ?? null,
            priceUsd: p.priceUsd.toString(),
        }));

        return NextResponse.json(safe);
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

        await prisma.product.delete({ where: { id: BigInt(id) } });
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
        const { id, categoryId, isNew, status, stockQty, priceUsd } = body;
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        const data: any = {};
        if (categoryId !== undefined) data.categoryId = categoryId ? BigInt(categoryId) : null;
        if (isNew !== undefined) data.isNew = Boolean(isNew);
        if (status !== undefined) data.status = status;
        if (stockQty !== undefined) data.stockQty = parseInt(stockQty);
        if (priceUsd !== undefined) data.priceUsd = parseFloat(priceUsd);

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
        if (!session?.user || session.user.role === 'USER') {
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
        } = body;

        if (!sku || !priceUsd || !name || !baseLang) {
            return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
        }

        // 2. Perform Translations
        const translationsData: Array<{
            langCode: string;
            name: string;
            shortDesc: string | null;
            detailDesc: string | null;
            seoKeywords: string | null;
            ingredients: string | null;
            howToUse: string | null;
            benefits: string | null;
        }> = [];

        for (const lang of TARGET_LANGS) {
            if (lang === baseLang) {
                translationsData.push({
                    langCode: lang,
                    name: name,
                    shortDesc: shortDesc || null,
                    detailDesc: detailDesc || null,
                    seoKeywords: seoKeywords || null,
                    ingredients: ingredients || null,
                    howToUse: howToUse || null,
                    benefits: benefits || null,
                });
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
                    translationsData.push({
                        langCode: lang,
                        name: `[Auto-failed] ${name}`,
                        shortDesc: shortDesc || null,
                        detailDesc: detailDesc || null,
                        seoKeywords: seoKeywords || null,
                        ingredients: ingredients || null,
                        howToUse: howToUse || null,
                        benefits: benefits || null,
                    });
                }
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
