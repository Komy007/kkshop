import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('D:/kkshop/.env') });

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@kkshop.cc';
    const plainPassword = 'KKshop2024!';

    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('❌ User NOT FOUND in DB!');
        return;
    }
    console.log('✅ User found:', user.email, '| Role:', user.role, '| hashedPassword:', user.hashedPassword ? user.hashedPassword.substring(0, 20) + '...' : 'NULL');

    // 2. Verify match
    const match = await bcrypt.compare(plainPassword, user.hashedPassword || '');
    console.log('Password match test:', match ? '✅ MATCH — Login should work' : '❌ NO MATCH — Need to reset');

    if (!match) {
        // Reset password
        console.log('Resetting password...');
        const newHash = await bcrypt.hash(plainPassword, 10);
        await prisma.user.update({ where: { email }, data: { hashedPassword: newHash } });
        const check = await bcrypt.compare(plainPassword, newHash);
        console.log('After reset, verify:', check ? '✅ DONE' : '❌ STILL FAILING');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
