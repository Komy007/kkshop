import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';
import { auth } from '@/auth';

export async function POST(request: Request) {
    const session = await auth();
    // Requires ADMIN or SUPERADMIN privileges
    if (!session?.user || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields (to, subject, html)' }, { status: 400 });
        }

        // Call the reusable mail utility which dynamically fetches the config and sends
        const result = await sendEmail({ to, subject, html });

        return NextResponse.json({ success: true, messageId: result.messageId });
    } catch (error: any) {
        console.error('Email send endpoint error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
