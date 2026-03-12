import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized. SUPERADMIN required.' }, { status: 403 });
        }

        const body = await req.json();
        const { email, password, name, role, companyName } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields (email, password, role).' }, { status: 400 });
        }

        // Email normalization
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Transaction to create User (and Supplier if role is SUPPLIER)
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    hashedPassword: hashedPassword,
                    name: name || null,
                    role: role, // ADMIN | SUPPLIER | SUPERADMIN
                    emailVerified: new Date(),
                }
            });

            if (role === 'SUPPLIER') {
                await tx.supplier.create({
                    data: {
                        userId: user.id,
                        companyName: companyName || name || 'New Supplier',
                        contactEmail: normalizedEmail,
                        status: 'APPROVED',
                    }
                });
            }

            return user;
        });

        logAudit({
            userId: session.user.id!,
            userEmail: session.user.email || '',
            userRole: 'SUPERADMIN',
            action: 'CREATE_ADMIN_USER',
            resource: 'users',
            resourceId: newUser.id,
            details: { email: normalizedEmail, role },
            ipAddress: getIpFromRequest(req),
        });

        return NextResponse.json({
            success: true,
            user: { id: newUser.id, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        console.error('Failed to create admin/supplier user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
