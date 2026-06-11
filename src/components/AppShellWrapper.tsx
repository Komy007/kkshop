'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const FULL_WIDTH_PREFIXES = ['/admin', '/seller'];

function isFullWidthPath(pathname: string | null): boolean {
    if (!pathname) return false;
    return FULL_WIDTH_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function AppShellWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (isFullWidthPath(pathname)) return <>{children}</>;
    return <div className="app-shell">{children}</div>;
}
