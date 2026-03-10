import nodemailer from 'nodemailer';
import { prisma } from '@/lib/api';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

/**
 * Fetches SMTP config from DB and creates a nodemailer transporter.
 * Throws if SMTP is not configured.
 */
async function getTransporterAndFrom(): Promise<{
    transporter: nodemailer.Transporter;
    fromAddress: string;
    adminEmail: string;
}> {
    const setting = await prisma.siteSetting.findUnique({
        where: { key: 'email_smtp_settings' }
    });

    if (!setting || !setting.value) {
        throw new Error("SMTP 설정이 구성되지 않았습니다. 관리자 페이지에서 설정을 완료해주세요.");
    }

    const config = setting.value as unknown as {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        fromEmail: string;
        fromName: string;
    };

    if (!config.host || !config.user || !config.pass) {
        throw new Error("SMTP 설정 값이 부족합니다.");
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port) || 587,
        secure: Boolean(config.secure),
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    const fromAddress = config.fromName
        ? `"${config.fromName}" <${config.fromEmail || config.user}>`
        : (config.fromEmail || config.user);

    const adminEmail = config.fromEmail || config.user;

    return { transporter, fromAddress, adminEmail };
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    const { transporter, fromAddress } = await getTransporterAndFrom();

    const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
    });

    return info;
}

export async function sendLowStockAlert(
    products: { sku: string; name: string; stockQty: number; alertQty: number }[]
) {
    if (!products || products.length === 0) return;

    const { transporter, fromAddress, adminEmail } = await getTransporterAndFrom();

    const count = products.length;
    const subject = `[KKShop] Low Stock Alert - ${count} product${count > 1 ? 's' : ''} need attention`;

    // Build table rows for each low-stock product
    const tableRows = products.map(p => {
        const isCritical = p.stockQty <= 0;
        const stockColor = isCritical ? '#dc2626' : '#d97706';
        const stockLabel = isCritical ? 'OUT OF STOCK' : p.stockQty.toString();
        return `
            <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-family:monospace;font-size:13px;color:#374151;">${p.sku}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${p.name}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">
                    <span style="background:${stockColor}1a;color:${stockColor};font-weight:700;font-size:13px;padding:3px 10px;border-radius:999px;border:1px solid ${stockColor}40;">
                        ${stockLabel}
                    </span>
                </td>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px;color:#6b7280;">${p.alertQty}</td>
            </tr>`;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:28px 32px;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td>
                        <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;">KKShop Admin Alert</p>
                        <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">Low Stock Warning</h1>
                    </td>
                    <td style="text-align:right;">
                        <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:52px;height:52px;display:inline-flex;align-items:center;justify-content:center;">
                            <span style="font-size:26px;">&#9888;&#65039;</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">
            <p style="margin:0 0 6px;font-size:15px;color:#374151;">
                <strong>${count} product${count > 1 ? 's have' : ' has'} dropped to or below the stock alert threshold</strong> and may need restocking soon.
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;">
                Triggered at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', dateStyle: 'medium', timeStyle: 'short' })} (Phnom Penh time)
            </p>

            <!-- Table -->
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">SKU</th>
                        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Product Name</th>
                        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Current Stock</th>
                        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Alert Threshold</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <!-- CTA -->
            <div style="margin-top:28px;text-align:center;">
                <a href="https://kkshop.cc/admin/inventory"
                   style="display:inline-block;background:#f97316;color:#ffffff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.3px;">
                    Manage Inventory &rarr;
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} KKShop &middot; Cambodia K-Beauty &middot; Admin Notifications
            </p>
        </div>
    </div>
</body>
</html>`;

    await transporter.sendMail({
        from: fromAddress,
        to: adminEmail,
        subject,
        html,
    });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    const { transporter, fromAddress } = await getTransporterAndFrom();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
    <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:28px 32px;">
            <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">Reset Your Password</h1>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">KKShop Account Security</p>
        </div>
        <div style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
                We received a request to reset your KKShop account password. Click the button below to set a new password.
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">
                This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
            </p>
            <div style="text-align:center;margin-bottom:28px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                    Reset Password &rarr;
                </a>
            </div>
            <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">
                Or copy this link: ${resetUrl}
            </p>
        </div>
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} KKShop &middot; Cambodia K-Beauty
            </p>
        </div>
    </div>
</body>
</html>`;

    await transporter.sendMail({
        from: fromAddress,
        to,
        subject: '[KKShop] Password Reset Request',
        html,
    });
}
