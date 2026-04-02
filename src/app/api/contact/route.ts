import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { sendEmail } from '@/lib/mail';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { z } from 'zod';

const ContactSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email().max(255),
    subject: z.string().min(1).max(200).trim(),
    message: z.string().min(1).max(5000).trim(),
});

/** HTML-escape user input to prevent XSS in email templates */
function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(request: Request) {
    // Rate limit: 5 contact form submissions per IP per 10 minutes
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'contact', 5, 10 * 60_000);
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const parsed = ContactSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 });
        }

        const { name, email, subject, message } = parsed.data;

        // Send notification email to admin
        try {
            const smtpSetting = await prisma.siteSetting.findUnique({ where: { key: 'email_smtp_settings' } });
            const adminEmail = smtpSetting?.value
                ? ((smtpSetting.value as any).fromEmail ?? (smtpSetting.value as any).user ?? null)
                : null;

            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: `[KKShop Contact] ${esc(subject)} — from ${esc(name)}`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                        <div style="background:#1a1a2e;padding:20px;text-align:center;">
                            <h1 style="color:white;margin:0;font-size:18px;">New Contact Form Submission</h1>
                        </div>
                        <div style="padding:24px;background:#fff;">
                            <div style="background:#f0f9ff;padding:16px;border-radius:8px;border-left:4px solid #0ea5e9;margin-bottom:20px;">
                                <p style="margin:0 0 6px;"><strong>From:</strong> ${esc(name)}</p>
                                <p style="margin:0 0 6px;"><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
                                <p style="margin:0 0 6px;"><strong>Subject:</strong> ${esc(subject)}</p>
                            </div>
                            <div style="background:#f9f9f9;padding:16px;border-radius:8px;">
                                <p style="margin:0 0 8px;font-weight:bold;color:#333;">Message:</p>
                                <p style="margin:0;color:#555;white-space:pre-wrap;">${esc(message)}</p>
                            </div>
                            <p style="margin-top:16px;color:#999;font-size:12px;">Reply directly to <a href="mailto:${esc(email)}">${esc(email)}</a></p>
                        </div>
                    </div>`,
                });
            }
        } catch (emailErr) {
            console.error('Contact email send failed (non-critical):', emailErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Failed to process contact form' }, { status: 500 });
    }
}
