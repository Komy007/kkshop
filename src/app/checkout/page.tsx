'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, selectTotalPrice } from '@/store/useCartStore';
import { useTranslations } from '@/i18n/useTranslations';
import { ShoppingBag, ChevronRight, Loader2, MapPin, Ticket, Coins, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function CheckoutPage() {
    const t = useTranslations();
    const router = useRouter();
    const cartItems = useCartStore(state => state.items);
    const subtotal = useCartStore(selectTotalPrice);
    const clearCart = useCartStore(state => state.clearCart);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        address: '',
        detailAddress: '',
        notes: '',
        couponCode: '',
        pointsUsed: '0'
    });

    const [couponStatus, setCouponStatus] = useState<{ id?: string, discount?: number, msg?: string, type?: string, ok?: boolean }>({});

    // Fetch user profile on mount
    useEffect(() => {
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    router.push('/login?callbackUrl=/checkout');
                    return;
                }
                setUser(data);
                setForm(f => ({
                    ...f,
                    customerName: data.name || '',
                    customerEmail: data.email || '',
                    customerPhone: data.phone || '',
                    address: data.address || '',
                    detailAddress: data.detailAddress || ''
                }));
                setLoading(false);
            })
            .catch(() => {
                router.push('/login?callbackUrl=/checkout');
            });
    }, [router]);

    // Go back if cart is empty
    useEffect(() => {
        if (!loading && cartItems.length === 0) {
            router.push('/cart');
        }
    }, [loading, cartItems.length, router]);

    const handleApplyCoupon = async () => {
        if (!form.couponCode) return;
        setCouponStatus({ msg: '확인 중...' });

        try {
            // Check coupon validity against subtotal
            // Normally we'd do this via an API, let's just do a dry-run check or fetch coupon details
            // Creating a minimal check endpoint or just doing it server-side.
            // Actually, we can just fetch /api/admin/coupons and find the active ones if user is admin, but consumer shouldn't.
            // We should have a /api/checkout/validate-coupon endpoint. 
            // Given I didn't write it, I'll write it next, or I'll just pass it to the POST /api/orders.
            // Actually, doing a POST /api/orders dry-run is better, but since I didn't write dry-run, I'll assume users get feedback on submit, or I will write a validate endpoint.
            // Let's assume there is /api/coupons/validate POST endpoint.
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: form.couponCode, subtotal })
            });

            const data = await res.json();
            if (res.ok) {
                setCouponStatus({ discount: data.discount, type: data.type, ok: true, msg: '쿠폰이 적용되었습니다.' });
            } else {
                setCouponStatus({ ok: false, msg: data.error || '유효하지 않은 쿠폰입니다.' });
            }
        } catch (e) {
            setCouponStatus({ ok: false, msg: '오류가 발생했습니다.' });
        }
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0;
        if (user && val > user.pointBalance) val = user.pointBalance;
        // Don't allow points to exceed subtotal - couponDiscount
        const discountAmt = couponStatus.ok ? (couponStatus.type === 'PERCENT' ? subtotal * (couponStatus.discount! / 100) : couponStatus.discount!) : 0;
        const maxUsable = subtotal - discountAmt;
        if (val > maxUsable) val = Math.floor(maxUsable);

        setForm({ ...form, pointsUsed: val.toString() });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cartItems.length === 0) return;
        setSubmitting(true);

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    items: cartItems.map(i => ({
                        productId: i.productId,
                        quantity: i.qty,
                        priceUsd: i.priceUsd
                    }))
                })
            });

            const data = await res.json();
            if (res.ok) {
                clearCart();
                router.push(`/mypage?success=true&orderId=${data.orderId}`);
            } else {
                alert(data.error || '주문 처리에 실패했습니다.');
                setSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>;
    }

    const discountAmt = couponStatus.ok ? (couponStatus.type === 'PERCENT' ? subtotal * (couponStatus.discount! / 100) : couponStatus.discount!) : 0;
    const finalTotal = subtotal - discountAmt - (parseInt(form.pointsUsed) || 0);

    const formatUsd = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-20 pt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <ShoppingBag className="w-7 h-7 text-brand-primary" />
                    체크아웃 (결제정보)
                </h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Shipping Info Section */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                배송지 정보
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">수령인</label>
                                        <input required type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">연락처</label>
                                        <input required type="tel" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
                                    <input required type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50 cursor-not-allowed" readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">기본 주소</label>
                                    <input required type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">상세 주소</label>
                                    <input required type="text" value={form.detailAddress} onChange={e => setForm({ ...form, detailAddress: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">배송 메모</label>
                                    <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="문 앞에 두고 가주세요" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Discounts & Points Section */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                <Ticket className="w-5 h-5 text-gray-500" />
                                할인 및 포인트
                            </h2>
                            <div className="space-y-6">
                                {/* Coupon */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">할인 쿠폰</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={form.couponCode} onChange={e => { setForm({ ...form, couponCode: e.target.value.toUpperCase() }); setCouponStatus({}); }} placeholder="쿠폰 코드를 입력하세요" className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 font-mono uppercase focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                                        <button type="button" onClick={handleApplyCoupon} className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap">
                                            적용
                                        </button>
                                    </div>
                                    {couponStatus.msg && (
                                        <p className={`text-sm mt-2 flex items-center gap-1 ${couponStatus.ok ? 'text-green-600 font-medium' : 'text-red-500'}`}>
                                            {couponStatus.ok && <CheckCircle2 className="w-4 h-4" />}
                                            {couponStatus.msg}
                                        </p>
                                    )}
                                </div>

                                {/* Points */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-sm font-bold text-gray-700">포인트 사용</label>
                                        <span className="text-xs text-gray-500 font-medium">보유 포인트: <strong className="text-brand-primary">{user?.pointBalance.toLocaleString()} P</strong></span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Coins className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input type="number" min="0" value={form.pointsUsed} onChange={handlePointsChange} className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                                        </div>
                                        <button type="button" onClick={() => handlePointsChange({ target: { value: String(user?.pointBalance) } } as any)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap text-sm">
                                            전액사용
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">1 포인트 = 1 USD 할인으로 적용됩니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-24">
                            <h2 className="text-lg font-bold mb-6 border-b border-gray-100 pb-4">주문 요약</h2>

                            {/* Items */}
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                {cartItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">수량: {item.qty}개</p>
                                        </div>
                                        <div className="font-black text-sm text-gray-900">
                                            {formatUsd(item.priceUsd * item.qty)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 py-4 border-t border-b border-gray-100 mb-6">
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>상품 금액</span>
                                    <span className="font-bold text-gray-900">{formatUsd(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>배송비</span>
                                    <span className="font-bold text-gray-900">무료 (이벤트)</span>
                                </div>
                                {discountAmt > 0 && (
                                    <div className="flex justify-between text-brand-primary text-sm font-bold">
                                        <span>쿠폰 할인</span>
                                        <span>-{formatUsd(discountAmt)}</span>
                                    </div>
                                )}
                                {parseInt(form.pointsUsed) > 0 && (
                                    <div className="flex justify-between text-brand-primary text-sm font-bold">
                                        <span>포인트 사용</span>
                                        <span>-{formatUsd(parseInt(form.pointsUsed))}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-base font-bold text-gray-900">최종 결제 금액</span>
                                <span className="text-2xl font-black text-rose-600">{formatUsd(Math.max(0, finalTotal))}</span>
                            </div>

                            <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-primary text-white font-black text-lg rounded-xl hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 flex justify-center items-center gap-2">
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : '결제하기'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <Footer />
        </main>
    );
}
