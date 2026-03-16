'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-10">
                <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white font-black">K</div>
                <span className="font-black text-xl text-gray-900">KKShop</span>
            </Link>

            <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-5">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-2">
                    오류가 발생했습니다
                </h1>
                <p className="text-gray-500 text-sm mb-1">Something went wrong</p>
                <p className="text-gray-400 text-sm mb-6">
                    일시적인 오류입니다. 잠시 후 다시 시도해주세요.<br />
                    <span className="text-xs">A temporary error occurred. Please try again.</span>
                </p>

                {/* Error ID */}
                {error.digest && (
                    <div className="bg-gray-50 rounded-xl px-4 py-2 mb-6 inline-block">
                        <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        다시 시도
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        <Home className="w-4 h-4" />
                        홈으로
                    </Link>
                </div>

                {/* Contact support */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">
                        문제가 계속되면 고객센터에 문의해주세요
                    </p>
                    <a
                        href="https://t.me/kkshop"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-brand-primary font-semibold hover:underline"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Telegram 문의하기
                    </a>
                </div>
            </div>
        </div>
    );
}
