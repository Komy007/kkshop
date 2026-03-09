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
                    '/mypage/',
                    '/checkout/',
                    '/cart/',
                ],
            },
        ],
        sitemap: 'https://kkshop.cc/sitemap.xml',
    };
}
