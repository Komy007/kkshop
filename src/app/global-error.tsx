'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html>
            <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f9fafb' }}>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#111', margin: '0 0 8px' }}>
                            Critical Error
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
                            A critical application error occurred. Please refresh the page.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={reset}
                                style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                            >
                                Try Again
                            </button>
                            <a
                                href="/"
                                style={{ padding: '10px 24px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '10px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
                            >
                                Go Home
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
