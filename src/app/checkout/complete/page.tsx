'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Package, Calendar, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import type { PaymentResult } from '@/lib/paymentGateway';

export default function CheckoutCompletePage() {
    const t = useTranslations();
    const [order, setOrder] = useState<PaymentResult | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const stored = sessionStorage.getItem('lastOrder');
            if (stored) {
                setOrder(JSON.parse(stored));
                sessionStorage.removeItem('lastOrder');
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16">
            <div className="max-w-md w-full text-center animate-fade-in-up">
                {/* Success Icon */}
                <div className="mb-8 relative">
                    <div className="w-24 h-24 mx-auto rounded-full bg-vivid-green/10 flex items-center justify-center animate-scale-in">
                        <CheckCircle className="w-14 h-14 text-vivid-green" strokeWidth={1.5} />
                    </div>
                    {/* Glow circle */}
                    <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-vivid-green/20 animate-breathe pointer-events-none" />
                </div>

                {/* Thank You Message */}
                <h1 className="text-3xl font-extrabold text-white mb-3">
                    {t.checkout.thankYou}
                </h1>
                <p className="text-white/50 mb-8">
                    {t.checkout.orderComplete}
                </p>

                {/* Order Details Card */}
                {order && (
                    <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] mb-8 text-left space-y-4 animate-fade-in delay-200">
                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-brand-primary" />
                            <div>
                                <p className="text-xs text-white/40">{t.checkout.orderNumber}</p>
                                <p className="text-sm font-bold text-white font-mono">{order.orderId}</p>
                            </div>
                        </div>

                        {order.estimatedDelivery && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-vivid-cyan" />
                                <div>
                                    <p className="text-xs text-white/40">{t.checkout.estimatedDelivery}</p>
                                    <p className="text-sm font-bold text-white">{order.estimatedDelivery}</p>
                                </div>
                            </div>
                        )}

                        {order.transactionId && (
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-xs text-white/30">Transaction: {order.transactionId}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/mypage"
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
                    >
                        {t.mypage.orders}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center py-4 px-6 rounded-2xl border border-white/10 text-white/70 font-semibold hover:bg-white/5 transition-all"
                    >
                        {t.checkout.backToHome}
                    </Link>
                </div>
            </div>
        </div>
    );
}
