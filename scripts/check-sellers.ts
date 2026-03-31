/**
 * 모든 셀러 계정 상태 확인 스크립트
 * 실행: npx tsx scripts/check-sellers.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const suppliers = await prisma.supplier.findMany({
        include: { user: { select: { id: true, email: true, role: true, emailVerified: true } } },
    });

    console.log(`\n📋 전체 셀러 ${suppliers.length}건\n`);

    if (suppliers.length === 0) {
        console.log('등록된 셀러가 없습니다.');
        return;
    }

    for (const sup of suppliers) {
        const u = sup.user;
        const verified = u.emailVerified ? '✓ 인증됨' : '✗ 미인증';
        console.log(`  [${sup.status}] ${u.email} | role=${u.role} | email=${verified} | company=${sup.companyName}`);
    }

    // emailVerified가 null인 셀러 수
    const unverified = suppliers.filter(s => !s.user.emailVerified);
    const wrongRole = suppliers.filter(s => s.status === 'APPROVED' && s.user.role !== 'SUPPLIER');

    console.log(`\n⚠️  emailVerified=null: ${unverified.length}건`);
    console.log(`⚠️  APPROVED인데 role≠SUPPLIER: ${wrongRole.length}건\n`);
}

main()
    .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
