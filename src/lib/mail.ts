import nodemailer from 'nodemailer';
import { prisma } from '@/lib/api';

/** HTML-escape user input to prevent XSS in email templates */
function escHtml(s: string | null | undefined): string {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

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

    // 이메일 헤더 인젝션 방어 — CR/LF/인용부호 제거
    const safeName = (config.fromName ?? '').replace(/[\r\n"\\]/g, '').trim();
    const fromAddress = safeName
        ? `"${safeName}" <${config.fromEmail || config.user}>`
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
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-family:monospace;font-size:13px;color:#374151;">${escHtml(p.sku)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${escHtml(p.name)}</td>
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

export async function sendWelcomeEmail(to: string, name: string, referralCode: string) {
    const { transporter, fromAddress } = await getTransporterAndFrom();
    const baseUrl = process.env.NEXTAUTH_URL || 'https://kkshop.cc';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1 0%,#ec4899 100%);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-size:28px;color:#fff;font-weight:900;letter-spacing:-0.5px;">KKShop</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Cambodia K-Beauty &amp; K-Living</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 12px;font-size:20px;color:#111;font-weight:700;">Welcome, ${name}! 🎉</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
        Thank you for joining KKShop. You can now browse and order K-Beauty products delivered right to your door in Cambodia.
      </p>
      <div style="background:#f5f3ff;border-radius:10px;padding:16px 20px;margin-bottom:20px;border:1px solid #e0d9ff;">
        <p style="margin:0 0 4px;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Your Referral Code</p>
        <p style="margin:0;font-size:24px;font-weight:900;color:#6366f1;letter-spacing:2px;">${referralCode}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#888;">Share this code — earn 50 points for every friend who signs up!</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${baseUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          Start Shopping →
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
        Questions? Reach us at <a href="${baseUrl}" style="color:#6366f1;">kkshop.cc</a>
      </p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} KKShop &middot; Cambodia K-Beauty</p>
    </div>
  </div>
</body>
</html>`;
    await transporter.sendMail({ from: fromAddress, to, subject: '[KKShop] Welcome! Your account is ready 🎉', html });
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
    const { transporter, fromAddress } = await getTransporterAndFrom();
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1 0%,#ec4899 100%);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-size:28px;color:#fff;font-weight:900;letter-spacing:-0.5px;">KKShop</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Cambodia K-Beauty &amp; K-Living</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 10px;font-size:20px;color:#111;font-weight:700;">Hi ${name}, please verify your email ✉️</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
        Thank you for joining KKShop! Click the button below to verify your email address and activate your account.
        This link expires in <strong>24 hours</strong>.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${verifyUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;padding:15px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;">
          ✅ Verify My Email
        </a>
      </div>
      <p style="margin:0 0 8px;font-size:12px;color:#aaa;text-align:center;">Or copy this link:</p>
      <p style="margin:0;font-size:11px;color:#9ca3af;word-break:break-all;text-align:center;">${verifyUrl}</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
        If you didn't create a KKShop account, you can safely ignore this email.
      </p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} KKShop &middot; Cambodia K-Beauty</p>
    </div>
  </div>
</body>
</html>`;
    await transporter.sendMail({ from: fromAddress, to, subject: '[KKShop] Verify your email address ✉️', html });
}

export async function sendSupplierReceivedEmail(to: string, companyName: string) {
    const { transporter, fromAddress, adminEmail } = await getTransporterAndFrom();
    const safeCompany = escHtml(companyName);
    const supplierHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);padding:28px 32px;">
      <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700;">Supplier Application Received</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">KKShop Seller Program</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hello <strong>${safeCompany}</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">
        We have received your supplier application on KKShop. Our team will review your application and get back to you within <strong>1-3 business days</strong>.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#166534;">✅ Application status: <strong>Under Review</strong></p>
      </div>
      <p style="margin:0;font-size:13px;color:#888;">You will receive another email when your application has been reviewed. Please check your inbox (and spam folder).</p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} KKShop &middot; Cambodia K-Beauty</p>
    </div>
  </div>
</body>
</html>`;

    const adminHtml = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <div style="background:#1e293b;padding:20px 28px;">
        <h2 style="margin:0;color:#fff;font-size:18px;">New Supplier Application</h2>
      </div>
      <div style="padding:24px 28px;background:#fff;border:1px solid #e5e7eb;">
        <p style="margin:0 0 8px;"><strong>Company:</strong> ${safeCompany}</p>
        <p style="margin:0 0 8px;"><strong>Contact Email:</strong> ${to}</p>
        <p style="margin:0 0 20px;"><strong>Applied at:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })} (Phnom Penh)</p>
        <a href="https://kkshop.cc/admin/suppliers" style="display:inline-block;background:#6366f1;color:#fff;padding:11px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">
          Review Application →
        </a>
      </div>
    </div>`;

    await transporter.sendMail({ from: fromAddress, to, subject: '[KKShop] Supplier Application Received — Under Review', html: supplierHtml });
    await transporter.sendMail({ from: fromAddress, to: adminEmail, subject: `[KKShop Admin] New Supplier Application: ${companyName}`, html: adminHtml });
}

export async function sendOrderStatusEmail(
    to: string,
    orderId: string,
    newStatus: 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED',
    tracking?: { carrier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null }
) {
    const { transporter, fromAddress } = await getTransporterAndFrom();
    const baseUrl = process.env.NEXTAUTH_URL || 'https://kkshop.cc';
    const shortId = orderId.slice(0, 12).toUpperCase();

    const cfg = {
        CONFIRMED: {
            subject: `[KKShop] Order ${shortId} Confirmed ✅`,
            headerBg: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            icon: '✅', title: 'Order Confirmed',
            message: 'Your order has been confirmed and is being prepared for shipping.',
        },
        SHIPPING: {
            subject: `[KKShop] Order ${shortId} Shipped 🚚`,
            headerBg: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
            icon: '🚚', title: 'Your Order is on the Way!',
            message: 'Your order has been handed over to the courier and is on its way to you.',
        },
        DELIVERED: {
            subject: `[KKShop] Order ${shortId} Delivered 📦`,
            headerBg: 'linear-gradient(135deg,#16a34a,#15803d)',
            icon: '📦', title: 'Order Delivered',
            message: 'Your order has been delivered. We hope you enjoy your purchase! Leave a review to share your experience.',
        },
        CANCELLED: {
            subject: `[KKShop] Order ${shortId} Cancelled`,
            headerBg: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            icon: '❌', title: 'Order Cancelled',
            message: 'Your order has been cancelled. If this was unexpected, please contact us.',
        },
    }[newStatus];

    const trackingHtml = newStatus === 'SHIPPING' && tracking?.trackingNumber ? `
        <div style="background:#f5f3ff;border:1px solid #e0d9ff;border-radius:8px;padding:14px 18px;margin:16px 0;">
            <p style="margin:0 0 6px;font-size:11px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Tracking Information</p>
            ${tracking.carrier ? `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Carrier: <strong>${tracking.carrier}</strong></p>` : ''}
            <p style="margin:0 0 4px;font-size:13px;color:#374151;">Tracking #: <strong style="font-family:monospace;">${tracking.trackingNumber}</strong></p>
            ${tracking.trackingUrl ? `<a href="${tracking.trackingUrl}" style="display:inline-block;margin-top:8px;background:#6366f1;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;">Track My Package →</a>` : ''}
        </div>` : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:${cfg.headerBg};padding:28px 32px;">
      <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;">Order Update</p>
      <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700;">${cfg.icon} ${cfg.title}</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">${cfg.message}</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:4px;">
        <p style="margin:0;font-size:12px;color:#6b7280;">Order Reference</p>
        <p style="margin:4px 0 0;font-size:14px;font-family:monospace;font-weight:700;color:#111827;">${shortId}…</p>
      </div>
      ${trackingHtml}
      <div style="text-align:center;margin-top:24px;">
        <a href="${baseUrl}/mypage" style="display:inline-block;background:#6366f1;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          View My Orders →
        </a>
      </div>
      ${newStatus === 'DELIVERED' ? `<p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">Enjoyed your purchase? <a href="${baseUrl}/mypage" style="color:#6366f1;font-weight:700;">Leave a review</a> and earn reward points!</p>` : ''}
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} KKShop &middot; Cambodia K-Beauty</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({ from: fromAddress, to, subject: cfg.subject, html });
}

export async function sendSupplierStatusEmail(to: string, companyName: string, newStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED', adminNote?: string | null) {
    const { transporter, fromAddress } = await getTransporterAndFrom();
    const baseUrl = process.env.NEXTAUTH_URL || 'https://kkshop.cc';
    const safeCompany = escHtml(companyName);
    const safeAdminNote = escHtml(adminNote);

    const isApproved = newStatus === 'APPROVED';
    const headerBg = isApproved ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)';
    const statusLabel = isApproved ? '✅ Approved' : newStatus === 'SUSPENDED' ? '⏸ Suspended' : '❌ Rejected';
    const bodyText = isApproved
        ? `Your supplier account has been <strong>approved</strong>! You can now log in to your seller dashboard and start listing products.`
        : newStatus === 'SUSPENDED'
        ? `Your supplier account has been <strong>suspended</strong>. Please contact us for more information.`
        : `Unfortunately, your supplier application has been <strong>rejected</strong>. Please see the reason below and feel free to re-apply after addressing the feedback.`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:${headerBg};padding:28px 32px;">
      <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700;">Supplier Application Update</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${statusLabel}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hello <strong>${safeCompany}</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">${bodyText}</p>
      ${safeAdminNote ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;color:#92400e;font-weight:700;text-transform:uppercase;">Admin Note</p>
        <p style="margin:0;font-size:13px;color:#78350f;">${safeAdminNote}</p>
      </div>` : ''}
      ${isApproved ? `<div style="text-align:center;margin-top:24px;">
        <a href="${baseUrl}/seller" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          Go to Seller Dashboard →
        </a>
      </div>` : ''}
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} KKShop &middot; Cambodia K-Beauty</p>
    </div>
  </div>
</body>
</html>`;

    const subjectMap = { APPROVED: 'Congratulations — Your supplier account is approved! 🎉', REJECTED: 'Supplier Application Update', SUSPENDED: 'Supplier Account Suspended' };
    await transporter.sendMail({ from: fromAddress, to, subject: `[KKShop] ${subjectMap[newStatus]}`, html });
}
