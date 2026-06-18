import crypto from 'crypto';

export interface TelegramAuthData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

export function verifyTelegramAuth(data: TelegramAuthData): boolean {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN is not set');
        return false;
    }

    const { hash, ...rest } = data;

    // Build data-check-string: sorted key=value pairs joined by \n (exclude hash)
    const dataCheckString = (Object.keys(rest) as (keyof typeof rest)[])
        .filter(k => rest[k] !== undefined && rest[k] !== null && rest[k] !== '')
        .sort()
        .map(k => `${k}=${rest[k]}`)
        .join('\n');

    // secret_key = SHA256(bot_token) — NOT HMAC, raw digest
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // computed_hash = HMAC-SHA256(data_check_string, secret_key)
    const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    if (computedHash !== hash) return false;

    // Auth data must not be older than 1 hour
    const ageSeconds = Math.floor(Date.now() / 1000) - data.auth_date;
    if (ageSeconds > 3600) return false;

    return true;
}
