'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

export default function NotFound() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 px-4 text-center">
            <div className="animate-fade-in">
                <h1 className="text-[120px] font-black text-gray-100 leading-none select-none">404</h1>
                <div className="-mt-16 relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">Oops! Page not found.</h2>
                    <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
                        The page you are looking for might have been removed or is temporarily unavailable.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-10 py-4 bg-brand-primary text-white text-lg font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)]"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
