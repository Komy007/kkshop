import type { Metadata } from 'next';
import { Outfit } from "next/font/google";
// @ts-ignore
import "./globals.css";

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "KKshop | Premium K-Tech & Lifestyle",
    description: "한국인의 깐깐한 선택, 프놈펜에서 만나는 프리미엄 스마트 라이프",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${outfit.variable} antialiased font-sans`}
            >
                {children}
            </body>
        </html>
    );
}
