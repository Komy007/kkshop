'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Admin Error Boundary]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-1 max-w-md">
                {error.message || 'An unexpected error occurred in the admin panel.'}
            </p>
            {error.digest && (
                <p className="text-xs text-gray-400 mb-6 font-mono">Error ID: {error.digest}</p>
            )}
            <div className="flex gap-3 mt-4">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
                <a
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Admin Home
                </a>
            </div>
        </div>
    );
}
