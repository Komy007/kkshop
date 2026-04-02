import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Verify admin session with 2FA enforcement.
 * Returns null if authorized, or a NextResponse error if not.
 * Usage: const denied = await requireAdmin(req); if (denied) return denied;
 */
export async function requireAdmin(options?: { superOnly?: boolean }) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!role || !['ADMIN', 'SUPERADMIN'].includes(role)) {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
    }

    if (options?.superOnly && role !== 'SUPERADMIN') {
        return { error: NextResponse.json({ error: 'SUPERADMIN only' }, { status: 403 }), session: null };
    }

    // 2FA enforcement: if admin has 2FA enabled and hasn't verified yet, block API access
    if ((session?.user as any)?.twoFactorPending) {
        return {
            error: NextResponse.json(
                { error: '2FA verification required. Please complete two-factor authentication.' },
                { status: 403 }
            ),
            session: null,
        };
    }

    return { error: null, session };
}
