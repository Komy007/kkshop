import type { Metadata } from 'next';
import { Outfit, Suwannaphum } from "next/font/google";
import Script from 'next/script';
// @ts-ignore
import "./globals.css";
import GNB from "@/components/GNB";
import BottomTabBar from "@/components/BottomTabBar";
import MiniCartDrawer from "@/components/MiniCartDrawer";
import { SessionProvider } from "next-auth/react";
import { prisma } from '@/lib/api';

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
});

const suwannaphum = Suwannaphum({
    variable: "--font-suwannaphum",
    weight: ["100", "300", "400", "700", "900"],
    subsets: ["khmer"],
});

// seo_config DB 조회를 1번만 하도록 모듈 레벨 캐시 (TTL 60초)
let _seoCache: { data: any; ts: number } | null = null;
async function getSeoConfig(): Promise<any> {
    if (_seoCache && Date.now() - _seoCache.ts < 60_000) return _seoCache.data;
    try {
        const s = await prisma.siteSetting.findUnique({ where: { key: 'seo_config' } });
        const data = (s?.value as any) ?? {};
        _seoCache = { data, ts: Date.now() };
        return data;
    } catch {
        return {};
    }
}

// DB SEO 설정을 읽어 동적 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
    let seoConfig: any = {};
    try {
        seoConfig = await getSeoConfig();
    } catch {
        // DB 미설정 시 기본값 사용
    }

    const title    = seoConfig.siteTitle       ?? "KKShop | Premium Korean Cosmetics & Lifestyle in Phnom Penh";
    const desc     = seoConfig.siteDescription ?? "Cambodia's No.1 Premium Korean E-commerce. 100% authentic K-Beauty and lifestyle products delivered fast in Phnom Penh.";
    const keywords = seoConfig.keywords        ?? "Korean cosmetics Cambodia, K-Beauty Phnom Penh, Korean skincare Cambodia, KKShop";
    const ogImage  = seoConfig.ogImage         ?? '/og-image.png';

    return {
        metadataBase: new URL('https://kkshop.cc'),
        title: { default: title, template: "%s | KKShop" },
        description: desc,
        keywords: typeof keywords === 'string' ? keywords.split(',').map((k: string) => k.trim()) : keywords,
        authors: [{ name: 'KKShop', url: 'https://kkshop.cc' }],
        creator: 'KKShop',
        publisher: 'KKShop',
        formatDetection: { telephone: false },
        alternates: {
            canonical: 'https://kkshop.cc',
            languages: {
                'en': 'https://kkshop.cc',
                'ko': 'https://kkshop.cc',
                'km': 'https://kkshop.cc',
                'zh': 'https://kkshop.cc',
                'x-default': 'https://kkshop.cc',
            },
        },
        openGraph: {
            title: seoConfig.ogTitle ?? "KKShop | Premium Korean Cosmetics & Lifestyle",
            description: seoConfig.ogDescription ?? desc,
            locale: "en_US",
            type: "website",
            siteName: "KKShop",
            url: 'https://kkshop.cc',
            images: [{ url: ogImage, width: 1200, height: 630, alt: 'KKShop - Premium Korean Cosmetics in Cambodia' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: seoConfig.ogTitle ?? 'KKShop | Premium Korean Cosmetics in Phnom Penh',
            description: desc,
            images: [ogImage],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
        manifest: '/manifest.json',
        appleWebApp: { capable: true, statusBarStyle: 'default', title: 'KKShop' },
        themeColor: '#E91E8C',
    };
}

// GA ID는 런타임에 DB에서 읽어야 하므로 별도 서버 컴포넌트로 처리
async function GoogleAnalytics() {
    try {
        const seoConfig = await getSeoConfig();
        const gaId = seoConfig?.googleAnalytics;
        // GA4 ID 형식 정규식 검증 (XSS 인젝션 방지): G- 뒤에 영숫자 6~12자만 허용
        if (!gaId || typeof gaId !== 'string' || !/^G-[A-Z0-9]{6,12}$/i.test(gaId)) return null;
        return (
            <>
                <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
                <Script id="ga-init" strategy="afterInteractive">{`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gaId}');
                `}</Script>
            </>
        );
    } catch {
        return null;
    }
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Organization JSON-LD for GEO/SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": "KKshop.cc",
                            "url": "https://kkshop.cc",
                            "logo": "https://kkshop.cc/logo.png",
                            "description": "Cambodia's No.1 Premium Korean E-commerce platform. 100% authentic K-Beauty and lifestyle products.",
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": "Phnom Penh",
                                "addressCountry": "KH"
                            },
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "email": "help@kkshop.cc",
                                "telephone": "+855-95-779-873",
                                "contactType": "customer service",
                                "availableLanguage": ["Korean", "English", "Khmer", "Chinese"]
                            },
                            "sameAs": []
                        })
                    }}
                />
            </head>
            <body
                suppressHydrationWarning
                className={`${outfit.variable} ${suwannaphum.variable} antialiased font-sans`}
            >
                <GoogleAnalytics />
                <SessionProvider>
                    <GNB />
                    <main className="min-h-screen pt-24 pb-20 md:pb-16">
                        {children}
                    </main>
                    <MiniCartDrawer />
                    <BottomTabBar />
                </SessionProvider>
            </body>
        </html>
    );
}
