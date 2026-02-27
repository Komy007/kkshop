import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "admin@kkshop.cc";
    const password = "KKshop2024!"; // strong password

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: { hashedPassword: hashed, role: "ADMIN" },
        create: {
            email,
            name: "KKShop Admin",
            hashedPassword: hashed,
            role: "ADMIN",
        },
    });

    console.log("✅ Admin account ready:", user.email, "| Role:", user.role);
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
}

main().catch(console.error).finally(() => prisma.$disconnect());
