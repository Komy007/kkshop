import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { sendSupplierStatusEmail } from '@/lib/mail';
import { logAudit, getIpFromRequest } from '@/lib/audit';

// GET: List all suppliers (ADMIN/SUPERADMIN only)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const suppliers = await prisma.supplier.findMany({
        where: status ? { status } : {},
        include: {
            user: { select: { email: true, name: true } },
            _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suppliers);
}

// PATCH: Approve / Reject / Suspend a supplier (SUPERADMIN only)
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, commissionRate, adminNote } = body;

    if (!id || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Validate commissionRate is within 0–100%
    if (commissionRate !== undefined) {
        const rate = parseFloat(commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            return NextResponse.json({ error: '커미션 비율은 0~100% 사이여야 합니다.' }, { status: 400 });
        }
    }

    // 트랜잭션으로 공급자 상태 + 사용자 역할 원자적 업데이트
    const supplier = await prisma.$transaction(async (tx) => {
        const updated = await tx.supplier.update({
            where: { id },
            data: {
                status,
                ...(commissionRate !== undefined && { commissionRate: parseFloat(commissionRate) }),
                ...(adminNote !== undefined && { adminNote }),
            },
            include: { user: { select: { email: true } } },
        });

        // If approved, update the user's role to SUPPLIER + ensure emailVerified
        if (status === 'APPROVED') {
            const targetUser = await tx.user.findUnique({
                where: { id: updated.userId },
                select: { emailVerified: true },
            });
            await tx.user.update({
                where: { id: updated.userId },
                data: {
                    role: 'SUPPLIER',
                    // 이메일 미인증 상태면 승인 시 자동 인증 처리 (관리자 승인 = 신원 확인)
                    ...(!targetUser?.emailVerified && { emailVerified: new Date() }),
                },
            });
        }

        // If rejected/suspended, downgrade role back to USER and deactivate all their products
        if (status === 'REJECTED' || status === 'SUSPENDED') {
            await tx.user.update({
                where: { id: updated.userId },
                data: { role: 'USER' },
            });
            // 해당 Supplier의 ACTIVE/PENDING 상품 전부 INACTIVE로 전환 (고객 노출 및 승인 대기열 차단)
            await tx.product.updateMany({
                where: {
                    supplierId: updated.id,
                    status: { in: ['ACTIVE', 'PENDING'] },
                },
                data: { status: 'INACTIVE' },
            });
        }

        return updated;
    });

    // 감사 로그
    const actionMap: Record<string, any> = { APPROVED: 'APPROVE_SUPPLIER', REJECTED: 'REJECT_SUPPLIER', SUSPENDED: 'SUSPEND_SUPPLIER' };
    if (actionMap[status]) {
        logAudit({
            userId: session.user.id!,
            userEmail: session.user.email || '',
            userRole: 'SUPERADMIN',
            action: actionMap[status],
            resource: 'suppliers',
            resourceId: id,
            details: { status, adminNote },
            ipAddress: getIpFromRequest(req),
        });
    }

    // 공급자 상태 변경 이메일 (APPROVED / REJECTED / SUSPENDED 시 발송, non-blocking)
    if (['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
        sendSupplierStatusEmail(
            supplier.contactEmail,
            supplier.companyName,
            status as 'APPROVED' | 'REJECTED' | 'SUSPENDED',
            adminNote ?? null
        ).catch(err =>
            console.error('Supplier status email failed (non-critical):', err)
        );
    }

    return NextResponse.json(supplier);
}

// POST: Create a new supplier (SUPERADMIN only)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized. SUPERADMIN required.' }, { status: 403 });
    }

    const body = await req.json();
    const { companyName, brandName, contactEmail, phone, commissionRate, description, password } = body;

    if (!companyName || !contactEmail || !password) {
        return NextResponse.json({ error: '회사명, 이메일, 임시 비밀번호는 필수입니다' }, { status: 400 });
    }

    try {
        let user = await prisma.user.findUnique({ where: { email: contactEmail.toLowerCase() } });

        if (password.length < 8) {
            return NextResponse.json({ error: '비밀번호는 최소 8자리 이상이어야 합니다.' }, { status: 400 });
        }

        // Validate commissionRate
        if (commissionRate !== undefined && commissionRate !== '') {
            const rate = parseFloat(commissionRate);
            if (isNaN(rate) || rate < 0 || rate > 100) {
                return NextResponse.json({ error: '커미션 비율은 0~100% 사이여야 합니다.' }, { status: 400 });
            }
        }

        if (user) {
            const existingSupplier = await prisma.supplier.findUnique({ where: { userId: user.id } });
            if (existingSupplier) {
                return NextResponse.json({ error: '해당 이메일은 이미 공급자 계정이 있습니다.' }, { status: 400 });
            }
            // Upgrade existing user to SUPPLIER role (SUPERADMIN-created = auto-approved)
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: 'SUPPLIER',
                    emailVerified: user.emailVerified ?? new Date(),
                },
            });
        } else {
            const hashedPassword = await bcrypt.hash(password, 12);
            user = await prisma.user.create({
                data: {
                    name: companyName,
                    email: contactEmail.toLowerCase(),
                    hashedPassword,
                    role: 'SUPPLIER',        // SUPERADMIN 직접 생성 → 즉시 SUPPLIER
                    emailVerified: new Date(), // 이메일 인증 불필요 (관리자가 직접 생성)
                    phone: phone || null,
                }
            });
        }

        const supplier = await prisma.supplier.create({
            data: {
                userId: user.id,
                companyName,
                brandName: brandName || null,
                phone: phone || null,
                contactEmail: contactEmail.toLowerCase(),
                description: description || null,
                commissionRate: commissionRate ? parseFloat(commissionRate) : 30,
                status: 'APPROVED',          // SUPERADMIN 직접 생성 → 즉시 승인
                adminNote: 'SUPERADMIN이 직접 생성 — 자동 승인',
            },
            include: {
                user: { select: { email: true, name: true } },
                _count: { select: { products: true } }
            }
        });

        return NextResponse.json({ success: true, supplier }, { status: 201 });
    } catch (e: any) {
        console.error('Failed to create supplier:', e);
        return NextResponse.json({ error: '공급자 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
