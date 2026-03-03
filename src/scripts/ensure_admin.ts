import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('D:/kkshop/.env') });

const prisma = new PrismaClient();

async function main() {
    const password = 'KKshop2024!';
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@kkshop.cc' },
        update: { hashedPassword: hashed, role: 'ADMIN', name: 'Admin' },
        create: { email: 'admin@kkshop.cc', hashedPassword: hashed, role: 'ADMIN', name: 'Admin' },
    });

    console.log('Admin password reset successfully!');
    console.log('Email:', user.email, '| Role:', user.role);

    // Verify
    const check = await bcrypt.compare(password, hashed);
    console.log('Password verify test:', check ? '✅ OK' : '❌ FAIL');
}

main().catch(console.error).finally(() => prisma.$disconnect());
