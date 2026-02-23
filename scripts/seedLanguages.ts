import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLanguages() {
    const languages = [
        { code: 'ko', name: 'Korean', isFrontend: true, isAdmin: true },
        { code: 'en', name: 'English', isFrontend: true, isAdmin: false },
        { code: 'km', name: 'Khmer', isFrontend: true, isAdmin: false },
        { code: 'zh', name: 'Chinese', isFrontend: true, isAdmin: false },
    ];

    console.log('Seeding languages...');
    for (const lang of languages) {
        await prisma.language.upsert({
            where: { code: lang.code },
            update: {},
            create: lang,
        });
    }
    console.log('Language seeding complete!');
}

seedLanguages()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
