import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Join KKShop to shop premium Korean cosmetics in Cambodia. Free delivery over $30, 100% authentic products, and points on every order.',
    robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
