'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, Building, QrCode, Smartphone, Tag, Truck } from 'lucide-react';
import { useCartStore, selectTotalItems, selectTotalPrice } from '@/store/useCartStore';
import { useTranslations } from '@/i18n/useTranslations';
import { paymentGateway, type PaymentResult } from '@/lib/paymentGateway';
import Footer from '@/components/Footer';

const PAYMENT_METHODS = [
    { id: 'aba_payway', label: 'ABA PayWay', icon: Building, color: 'text-blue-400' },
    { id: 'khqr', label: 'KHQR', icon: QrCode, color: 'text-vivid-cyan' },
    { id: 'credit_card', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-vivid-yellow' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: Smartphone, color: 'text-vivid-green' },
];

export default function CheckoutPage() {
    const router = useRouter();
    const t = useTranslations();
    const items = useCartStore((s) => s.items);
    const totalItems = useCartStore(selectTotalItems);
    const totalPrice = useCartStore(selectTotalPrice);
    const clearCart = useCartStore((s) => s.clearCart);

    const [paymentMethod, setPaymentMethod] = useState('aba_payway');
    const [isProcessing, setIsProcessing] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: 'Phnom Penh',
        notes: '',
    });

    const shippingFee = totalPrice >= 30 ? 0 : 3.00;
    const discount = 0; // Coupon logic placeholder
    const grandTotal = totalPrice + shippingFee - discount;

    const formatUsd = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            // TODO: Replace with actual payment API
            const result: PaymentResult = await paymentGateway.processPayment({
                amount: grandTotal,
                currency: 'USD',
                method: paymentMethod,
                customerName: form.fullName,
                customerPhone: form.phone,
                customerAddress: form.address,
                customerCity: form.city,
                items: items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    qty: item.qty,
                    priceUsd: item.priceUsd,
                })),
            });

            if (result.success) {
                clearCart();
                // Store result for thank you page
                sessionStorage.setItem('lastOrder', JSON.stringify(result));
                router.push('/checkout/complete');
            }
        } catch (error) {
            console.error('Payment error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white/60 px-4">
                <Truck className="w-16 h-16 text-white/10" />
                <p className="text-xl font-bold text-white">{t.cart.empty}</p>
                <a href="/" className="text-brand-primary hover:underline">{t.cart.continueShopping}</a>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back link */}
                <a href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm">
                    <ChevronLeft className="w-4 h-4" />
                    {t.cart.continueShopping}
                </a>

                <h1 className="text-3xl font-extrabold text-white mb-8">{t.checkout.pageTitle}</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left — Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Shipping Address */}
                        <section className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-brand-primary" />
                                {t.checkout.shippingAddress}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder={t.checkout.fullName}
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-colors text-sm min-h-[44px]"
                                />
                                <input
                                    type="tel"
                                    placeholder={t.checkout.phone}
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-colors text-sm min-h-[44px]"
                                />
                                <input
                                    type="text"
                                    placeholder={t.checkout.address}
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-colors text-sm sm:col-span-2 min-h-[44px]"
                                />
                                <input
                                    type="text"
                                    placeholder={t.checkout.city}
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-colors text-sm min-h-[44px]"
                                />
                                <textarea
                                    placeholder={t.checkout.notes}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-colors text-sm sm:col-span-2 min-h-[44px] resize-none"
                                />
                            </div>
                        </section>

                        {/* Payment Method */}
                        <section className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-brand-primary" />
                                {t.checkout.paymentMethod}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {PAYMENT_METHODS.map((method) => {
                                    const Icon = method.icon;
                                    const selected = paymentMethod === method.id;
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left min-h-[56px] ${selected
                                                ? 'border-brand-primary bg-brand-primary/10 text-white'
                                                : 'border-white/5 text-white/60 hover:border-white/10 hover:bg-white/[0.02]'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl ${selected ? 'bg-brand-primary/20' : 'bg-white/5'} flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 ${selected ? method.color : 'text-white/40'}`} />
                                            </div>
                                            <span className="font-semibold text-sm">{method.label}</span>
                                            {/* Radio indicator */}
                                            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-brand-primary' : 'border-white/20'
                                                }`}>
                                                {selected && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Right — Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-6">
                            <h2 className="text-lg font-bold text-white">{t.checkout.orderSummary}</h2>

                            {/* Items list */}
                            <ul className="space-y-3 max-h-[300px] overflow-y-auto">
                                {items.map((item) => (
                                    <li key={item.productId} className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-space-800 overflow-hidden flex-shrink-0">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                                            <p className="text-xs text-white/40">× {item.qty}</p>
                                        </div>
                                        <span className="text-sm font-bold text-white">{formatUsd(item.priceUsd * item.qty)}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Coupon */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="text"
                                        placeholder={t.checkout.couponPlaceholder}
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-colors text-sm"
                                    />
                                </div>
                                <button className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 transition-colors">
                                    {t.checkout.applyCoupon}
                                </button>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">{t.cart.subtotal} ({totalItems})</span>
                                    <span className="text-white">{formatUsd(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">{t.checkout.shippingFee}</span>
                                    <span className={shippingFee === 0 ? 'text-vivid-green font-semibold' : 'text-white'}>
                                        {shippingFee === 0 ? 'FREE' : formatUsd(shippingFee)}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/50">{t.checkout.discount}</span>
                                        <span className="text-vivid-green font-semibold">-{formatUsd(discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-black pt-3 border-t border-white/10">
                                    <span className="text-white">{t.checkout.total}</span>
                                    <span className="text-brand-primary">{formatUsd(grandTotal)}</span>
                                </div>
                            </div>

                            {/* Place Order Button */}
                            <button
                                onClick={handlePlaceOrder}
                                disabled={isProcessing || !form.fullName || !form.phone || !form.address}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] min-h-[56px] ${isProcessing || !form.fullName || !form.phone || !form.address
                                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                    : 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'
                                    }`}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </div>
                                ) : (
                                    t.checkout.placeOrder
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
