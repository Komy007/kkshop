import nodemailer from 'nodemailer';
import { prisma } from '@/lib/api';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    // 1. Fetch SMTP settings from DB
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

    // 2. Create Transporter
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port) || 587,
        secure: Boolean(config.secure), // true for 465, false for other ports
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    // 3. Send Email
    const fromAddress = config.fromName ? `"${config.fromName}" <${config.fromEmail || config.user}>` : (config.fromEmail || config.user);

    const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
    });

    return info;
}
