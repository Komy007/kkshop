import { prisma } from './api';

export type AuditAction =
    // 상품
    | 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT' | 'APPROVE_PRODUCT' | 'REJECT_PRODUCT'
    // 주문
    | 'UPDATE_ORDER_STATUS' | 'CANCEL_ORDER' | 'ADD_SHIPMENT'
    // 회원
    | 'UPDATE_USER_ROLE' | 'RESET_USER_PASSWORD' | 'DELETE_USER' | 'GRANT_POINTS'
    // 공급자
    | 'APPROVE_SUPPLIER' | 'REJECT_SUPPLIER' | 'SUSPEND_SUPPLIER'
    // 쿠폰
    | 'CREATE_COUPON' | 'UPDATE_COUPON' | 'DELETE_COUPON'
    // 설정
    | 'UPDATE_SETTINGS' | 'UPDATE_SMTP'
    // 2FA
    | 'ENABLE_2FA' | 'DISABLE_2FA'
    // 기타
    | 'LOGIN_ADMIN' | 'CREATE_ADMIN_USER';

interface LogAuditParams {
    userId: string;
    userEmail: string;
    userRole: string;
    action: AuditAction;
    resource?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                userEmail: params.userEmail,
                userRole: params.userRole,
                action: params.action,
                resource: params.resource ?? null,
                resourceId: params.resourceId ?? null,
                details: params.details ?? undefined,
                ipAddress: params.ipAddress ?? null,
            },
        });
    } catch (err) {
        // 감사 로그 실패는 주 작업을 중단시키지 않음
        console.error('[Audit] Failed to write audit log:', err);
    }
}

export function getIpFromRequest(req: Request): string | null {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0].trim();
        if (/^[\d.]+$/.test(first) || /^[a-f0-9:]+$/i.test(first)) return first;
    }
    return req.headers.get('x-real-ip');
}
