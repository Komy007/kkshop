import type { Metadata } from 'next';
import { Outfit, Suwannaphum } from "next/font/google";
// @ts-ignore
import "./globals.css";
import GNB from "@/components/GNB";
import BottomTabBar from "@/components/BottomTabBar";

import MiniCartDrawer from "@/components/MiniCartDrawer";
import { SessionProvider } from "next-auth/react";

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
});

const suwannaphum = Suwannaphum({
    variable: "--font-suwannaphum",
    weight: ["100", "300", "400", "700", "900"],
    subsets: ["khmer"],
});

export const metadata: Metadata = {
    metadataBase: new URL('https://kkshop.cc'),
    title: {
        default: "KKShop | Premium Korean Cosmetics & Lifestyle in Phnom Penh",
        template: "%s | KKShop",
    },
    description: "Cambodia's No.1 Premium Korean E-commerce. 100% authentic K-Beauty and lifestyle products delivered fast in Phnom Penh.",
    keywords: ["Korean cosmetics Cambodia", "K-Beauty Phnom Penh", "Korean skincare Cambodia", "KKShop", "한국 화장품 캄보디아"],
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
        title: "KKShop | Premium Korean Cosmetics & Lifestyle",
        description: "100% authentic K-Beauty products delivered to your door in Cambodia.",
        locale: "en_US",
        type: "website",
        siteName: "KKShop",
        url: 'https://kkshop.cc',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KKShop - Premium Korean Cosmetics in Cambodia' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'KKShop | Premium Korean Cosmetics in Phnom Penh',
        description: '100% authentic K-Beauty delivered to your door in Cambodia.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    // PWA 메타데이터
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'KKShop',
    },
    themeColor: '#E91E8C',
};

export default function RootLayout({
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
