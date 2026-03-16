import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Search Products',
    description: 'Search for Korean cosmetics, skincare, makeup, and lifestyle products in Cambodia.',
    robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
