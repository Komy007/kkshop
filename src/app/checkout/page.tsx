'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, selectTotalPrice } from '@/store/useCartStore';
import { useAppStore } from '@/store/useAppStore';

const checkoutTranslations: Record<string, any> = {
    ko: {
        title: '결제하기',
        subtitle: '주문을 완료하기 위해 배송 정보를 입력해주세요.',
        name: '받는 분 성함',
        phone: '연락처 (전화번호)',
        email: '이메일 (선택)',
        address: '기본 배송지 주소',
        detailAddress: '상세 주소 (선택)',
        orderSummary: '주문 요약',
        total: '총 결제 금액',
        placeOrder: '주문 확정하기',
        processing: '처리 중...',
        cancel: '취소 돌아가기',
        empty: '장바구니가 비어있습니다. 상품을 먼저 담아주세요.',
        goHome: '홈으로 이동',
        success: '주문이 성공적으로 접수되었습니다!',
        error: '주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
    },
    en: {
        title: 'Checkout',
        subtitle: 'Enter your shipping details to complete the order.',
        name: 'Full Name',
        phone: 'Phone Number',
        email: 'Email (Optional)',
        address: 'Shipping Address',
        detailAddress: 'Apt, Suite, etc. (Optional)',
        orderSummary: 'Order Summary',
        total: 'Total',
        placeOrder: 'Place Order',
        processing: 'Processing...',
        cancel: 'Cancel & Return',
        empty: 'Your cart is empty. Please add items to checkout.',
        goHome: 'Go to Home',
        success: 'Order placed successfully!',
        error: 'An error occurred. Please try again.',
    },
    km: {
        title: 'ពិនិត្យចេញ',
        subtitle: 'បញ្ចូលព័ត៌មានលម្អិតសម្រាប់ការដឹកជញ្ជូនរបស់អ្នកដើម្បីបញ្ចប់ការបញ្ជាទិញ។',
        name: 'ឈ្មោះ​ពេញ',
        phone: 'លេខទូរស័ព្ទ',
        email: 'អ៊ីមែល',
        address: 'អាសយដ្ឋានដឹកជញ្ជូន',
        detailAddress: 'អាសយដ្ឋានលម្អិត',
        orderSummary: 'សេចក្តីសង្ខេបនៃការបញ្ជាទិញ',
        total: 'សរុប',
        placeOrder: 'បញ្ជាទិញ',
        processing: 'កំពុងដំណើរការ...',
        cancel: 'បោះបង់',
        empty: 'រទេះរបស់អ្នកទទេ',
        goHome: 'ទៅកាន់គេហទំព័រ',
        success: 'ការបញ្ជាទិញទទួលបានជោគជ័យ!',
        error: 'មានកំហុសសូមព្យាយាមម្តងទៀត។',
    },
    zh: {
        title: '结账',
        subtitle: '输入您的送货信息以完成订单。',
        name: '姓名',
        phone: '电话号码',
        email: '电子邮件（选填）',
        address: '送货地址',
        detailAddress: '详细地址',
        orderSummary: '订单摘要',
        total: '总计',
        placeOrder: '提交订单',
        processing: '处理中...',
        cancel: '取消返回',
        empty: '购物车是空的。请先添加商品。',
        goHome: '返回主页',
        success: '订单提交成功！',
        error: '发生错误，请重试。',
    }
};

export default function CheckoutPage() {
    const router = useRouter();
    const { language } = useAppStore();
    const t = checkoutTranslations[language] || checkoutTranslations.en;

    const items = useCartStore((s) => s.items);
    const clearCart = useCartStore((s) => s.clearCart);
    const totalPrice = useCartStore(selectTotalPrice);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        address: '',
        detailAddress: '',
    });

    const formatUsd = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCancel = () => {
        // Just go back to home without clearing cart
        router.push('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            const payload = {
                ...form,
                items,
                totalUsd: totalPrice,
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatusMessage({ type: 'success', text: t.success });
                clearCart();
                // Optionally redirect to a thank you page. We'll just redirect to home after 3s.
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            } else {
                setStatusMessage({ type: 'error', text: data.error || t.error });
            }
        } catch (err) {
            console.error(err);
            setStatusMessage({ type: 'error', text: t.error });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0 && !statusMessage) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">{t.empty}</h2>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90"
                >
                    {t.goHome}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
            <h1 className="text-3xl font-extrabold text-white mb-2">{t.title}</h1>
            <p className="text-white/60 mb-8">{t.subtitle}</p>

            {statusMessage && (
                <div className={`p-4 rounded-xl mb-6 font-bold text-center ${statusMessage.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {statusMessage.text}
                </div>
            )}

            {!statusMessage || statusMessage.type === 'error' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">{t.name} *</label>
                                <input
                                    required
                                    type="text"
                                    name="customerName"
                                    value={form.customerName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">{t.phone} *</label>
                                <input
                                    required
                                    type="tel"
                                    name="customerPhone"
                                    value={form.customerPhone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">{t.email}</label>
                                <input
                                    type="email"
                                    name="customerEmail"
                                    value={form.customerEmail}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">{t.address} *</label>
                                <input
                                    required
                                    type="text"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">{t.detailAddress}</label>
                                <input
                                    type="text"
                                    name="detailAddress"
                                    value={form.detailAddress}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="flex-1 py-4 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || items.length === 0}
                                className="flex-[2] py-4 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? t.processing : t.placeOrder}
                            </button>
                        </div>
                    </form>

                    {/* Order Summary */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl h-fit sticky top-24">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                            {t.orderSummary}
                            <span className="text-brand-primary text-sm font-black bg-brand-primary/20 px-3 py-1 rounded-full">{items.length} items</span>
                        </h2>

                        <ul className="space-y-4 mb-6">
                            {items.map(item => (
                                <li key={item.productId} className="flex gap-4">
                                    <div className="w-16 h-16 rounded-lg bg-space-800 flex-shrink-0 overflow-hidden">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                        <p className="text-xs text-white/50 mt-1">Qty: {item.qty}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-brand-primary">{formatUsd(item.priceUsd * item.qty)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-lg text-white/70 font-medium">{t.total}</span>
                            <span className="text-3xl font-black text-white">{formatUsd(totalPrice)}</span>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
