import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/seller/',
                    '/supplier/',
                    '/mypage/',
                    '/checkout/',
                    '/cart/',
                    '/onboarding/',
                    '/verify-email',
                    '/reset-password',
                    '/forgot-password',
                ],
            },
        ],
        sitemap: 'https://kkshop.cc/sitemap.xml',
        host: 'https://kkshop.cc',
    };
}
