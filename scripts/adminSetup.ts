import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@kkshop.cc';
    const plainPassword = 'kkshop6175@';

    console.log(`Checking if admin user ${email} exists...`);
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log('Admin user already exists. Updating password...');
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await prisma.user.update({
            where: { email },
            data: {
                hashedPassword,
                role: 'ADMIN'
            }
        });
        console.log('Admin user updated successfully!');
    } else {
        console.log('Creating new admin user...');
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await prisma.user.create({
            data: {
                email,
                name: 'System Admin',
                hashedPassword,
                role: 'ADMIN'
            }
        });
        console.log('Admin user created successfully!');
    }
}

main()
    .catch((e) => {
        console.error('Failed to setup admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
