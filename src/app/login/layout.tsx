import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login',
    description: 'Sign in to your KKShop account to shop premium Korean cosmetics in Cambodia.',
    robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
