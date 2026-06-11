'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const FULL_WIDTH_PREFIXES = ['/admin', '/seller'];

export default function AppShellWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullWidth = FULL_WIDTH_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isFullWidth) return <>{children}</>;
    return <div className="app-shell">{children}</div>;
}
