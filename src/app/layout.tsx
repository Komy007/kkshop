import type { Metadata } from 'next';
import { Outfit } from "next/font/google";
// @ts-ignore
import "./globals.css";
import GNB from "@/components/GNB";
import BottomTabBar from "@/components/BottomTabBar";
import FloatingChat from "@/components/FloatingChat";
import MiniCartDrawer from "@/components/MiniCartDrawer";

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "KKshop.cc | Premium Korean Cosmetics & Lifestyle in Phnom Penh",
    description: "Cambodia's No.1 Premium Korean E-commerce. 100% authentic K-Beauty and lifestyle products delivered fast in Phnom Penh. ABA Pay & Wing accepted.",
    keywords: "Korean cosmetics Cambodia, K-Beauty Phnom Penh, Korean products Cambodia, KKshop, 한국 화장품 캄보디아",
    openGraph: {
        title: "KKshop.cc | Premium Korean Cosmetics & Lifestyle",
        description: "100% authentic K-Beauty in Phnom Penh. Same-day delivery.",
        locale: "en_US",
        type: "website",
        siteName: "KKshop.cc",
    },
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
                                "telephone": "+855-23-123-456",
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
                className={`${outfit.variable} antialiased font-sans`}
            >
                <GNB />
                <main className="min-h-screen pt-24 pb-20 md:pb-16">
                    {children}
                </main>
                <MiniCartDrawer />
                <FloatingChat />
                <BottomTabBar />
            </body>
        </html>
    );
}
