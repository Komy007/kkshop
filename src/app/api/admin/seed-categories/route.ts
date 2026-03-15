import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

// Default K-beauty / K-living categories for kkshop
const DEFAULT_CATEGORIES = [
    { slug: 'skincare',        nameKo: '스킨케어',    nameEn: 'Skincare',         nameKm: 'ថែទាំស្បែក',       nameZh: '护肤品',   sortOrder: 1 },
    { slug: 'cleansing',       nameKo: '클렌징',      nameEn: 'Cleansing',        nameKm: 'សម្អាតមុខ',         nameZh: '清洁产品', sortOrder: 2 },
    { slug: 'toner-essence',   nameKo: '토너·에센스', nameEn: 'Toner & Essence',  nameKm: 'តូណឺ & អាសង់',     nameZh: '爽肤水&精华', sortOrder: 3 },
    { slug: 'serum-ampoule',   nameKo: '세럼·앰플',  nameEn: 'Serum & Ampoule',  nameKm: 'ស្ស៊ីរ៉ូម & អំពូល', nameZh: '精华液',   sortOrder: 4 },
    { slug: 'moisturizer',     nameKo: '모이스처라이저', nameEn: 'Moisturizer',   nameKm: 'ការបំប៉នសំណើម',     nameZh: '保湿霜',   sortOrder: 5 },
    { slug: 'sunscreen',       nameKo: '선크림',      nameEn: 'Sunscreen',        nameKm: 'ក្រែមការពារថ្ងៃ',  nameZh: '防晒霜',   sortOrder: 6 },
    { slug: 'mask-pack',       nameKo: '마스크팩',    nameEn: 'Mask & Pack',      nameKm: 'ម៉ាស់មុខ',          nameZh: '面膜',     sortOrder: 7 },
    { slug: 'eye-care',        nameKo: '아이케어',    nameEn: 'Eye Care',         nameKm: 'ថែទាំភ្នែក',        nameZh: '眼霜',     sortOrder: 8 },
    { slug: 'makeup',          nameKo: '메이크업',    nameEn: 'Makeup',           nameKm: 'គ្រឿងសម្អាង',       nameZh: '彩妆',     sortOrder: 9 },
    { slug: 'lip-care',        nameKo: '립케어',      nameEn: 'Lip Care',         nameKm: 'ថែទាំបបូរមាត់',     nameZh: '唇部护理', sortOrder: 10 },
    { slug: 'hair-care',       nameKo: '헤어케어',    nameEn: 'Hair Care',        nameKm: 'ថែទាំសក់',          nameZh: '护发产品', sortOrder: 11 },
    { slug: 'body-care',       nameKo: '바디케어',    nameEn: 'Body Care',        nameKm: 'ថែទាំរាងកាយ',       nameZh: '身体护理', sortOrder: 12 },
    { slug: 'fragrance',       nameKo: '향수·방향',   nameEn: 'Fragrance',        nameKm: 'គ្រឿងក្រអូប',       nameZh: '香水',     sortOrder: 13 },
    { slug: 'supplements',     nameKo: '이너뷰티',    nameEn: 'Inner Beauty',     nameKm: 'ភាពស្អាតខាងក្នុង',  nameZh: '内服美容', sortOrder: 14 },
    { slug: 'baby-care',       nameKo: '베이비케어',  nameEn: 'Baby Care',        nameKm: 'ថែទាំទារក',         nameZh: '婴儿护理', sortOrder: 15 },
    { slug: 'mens-care',       nameKo: '맨즈케어',    nameEn: "Men's Care",       nameKm: 'ការថែទាំបុរស',      nameZh: '男士护理', sortOrder: 16 },
    { slug: 'tools-devices',   nameKo: '뷰티기기',    nameEn: 'Tools & Devices',  nameKm: 'ឧបករណ៍សម្អាង',     nameZh: '美容仪器', sortOrder: 17 },
    { slug: 'k-living',        nameKo: 'K-리빙',      nameEn: 'K-Living',         nameKm: 'K-Living',          nameZh: 'K生活',    sortOrder: 18 },
    { slug: 'food-snacks',     nameKo: '식품·간식',   nameEn: 'Food & Snacks',    nameKm: 'អាហារ & អាហារសម្រន់', nameZh: '食品零食', sortOrder: 19 },
    { slug: 'health',          nameKo: '건강·의약',   nameEn: 'Health & Medicine', nameKm: 'សុខភាព',            nameZh: '健康医药', sortOrder: 20 },
];

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized — SUPERADMIN only' }, { status: 403 });
        }

        // Count existing non-system categories
        const existingCount = await prisma.category.count({ where: { isSystem: false } });

        let created = 0;
        let skipped = 0;

        for (const cat of DEFAULT_CATEGORIES) {
            const exists = await prisma.category.findUnique({ where: { slug: cat.slug } });
            if (exists) {
                skipped++;
                continue;
            }
            await prisma.category.create({
                data: { ...cat, isSystem: false },
            });
            created++;
        }

        return NextResponse.json({
            success: true,
            message: `Done! Created ${created} categories, skipped ${skipped} already existing.`,
            messageKo: `완료! ${created}개 생성, ${skipped}개 이미 존재하여 건너뜀.`,
            existingBefore: existingCount,
            created,
            skipped,
        });
    } catch (error: any) {
        console.error('seed-categories error:', error);
        return NextResponse.json({ error: error.message ?? 'Internal error' }, { status: 500 });
    }
}
