/**
 * 기존 셀러 계정 일괄 수정 스크립트
 * - APPROVED 상태이지만 emailVerified=null인 셀러 → emailVerified 설정
 * - PENDING 상태 셀러 → APPROVED + emailVerified + role=SUPPLIER
 *
 * 실행: npx tsx scripts/fix-existing-sellers.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // emailVerified가 null인 모든 셀러 조회
    const suppliers = await prisma.supplier.findMany({
        where: {
            user: { emailVerified: null },
        },
        include: { user: { select: { id: true, email: true, role: true, emailVerified: true } } },
    });

    console.log(`\n📋 emailVerified=null인 셀러 ${suppliers.length}건 발견\n`);

    if (suppliers.length === 0) {
        console.log('✅ 수정할 계정이 없습니다.');
        return;
    }

    for (const sup of suppliers) {
        const u = sup.user;
        console.log(`  → ${u.email} | role=${u.role} | status=${sup.status} | company=${sup.companyName}`);
    }

    // 트랜잭션으로 일괄 수정
    const result = await prisma.$transaction(async (tx) => {
        let fixed = 0;

        for (const sup of suppliers) {
            // User: emailVerified 설정 + PENDING이면 role도 SUPPLIER로
            await tx.user.update({
                where: { id: sup.user.id },
                data: {
                    emailVerified: new Date(),
                    ...(sup.user.role !== 'SUPPLIER' && { role: 'SUPPLIER' }),
                },
            });

            // Supplier: PENDING이면 APPROVED로
            if (sup.status !== 'APPROVED') {
                await tx.supplier.update({
                    where: { id: sup.id },
                    data: {
                        status: 'APPROVED',
                        adminNote: `기존 계정 일괄 승인 (${new Date().toISOString()})`,
                    },
                });
            }

            fixed++;
        }

        return fixed;
    });

    console.log(`\n✅ 완료: ${result}건 수정됨 (emailVerified 설정 완료)\n`);
}

main()
    .catch((e) => {
        console.error('❌ 오류:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
