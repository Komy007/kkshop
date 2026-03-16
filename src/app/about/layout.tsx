import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About KKShop',
    description: 'Learn about KKShop — Cambodia\'s No.1 Premium Korean E-commerce platform delivering 100% authentic K-Beauty products in Phnom Penh.',
    openGraph: {
        title: 'About KKShop | Premium Korean Cosmetics in Cambodia',
        description: 'KKShop is Cambodia\'s No.1 Korean cosmetics store. We deliver 100% authentic K-Beauty products directly to your door in Phnom Penh.',
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
