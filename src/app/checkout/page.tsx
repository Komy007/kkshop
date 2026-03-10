'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, selectTotalPrice } from '@/store/useCartStore';
import { useSafeAppStore } from '@/store/useAppStore';
import { ShoppingBag, ChevronDown, Loader2, MapPin, Ticket, Coins, CheckCircle2, QrCode, AlertCircle, Clock, BookmarkCheck } from 'lucide-react';
import Footer from '@/components/Footer';

const checkoutTranslations: Record<string, any> = {
    en: {
        title: 'Checkout',
        shipping: 'Shipping Information',
        recipient: 'Recipient Name',
        phone: 'Phone Number',
        email: 'Email',
        province: 'Province / State',
        address: 'Address',
        detailAddress: 'Apt / Unit / Floor',
        notes: 'Delivery Notes',
        notesPlaceholder: 'e.g. Leave at the door',
        discounts: 'Discounts & Points',
        coupon: 'Coupon Code',
        couponPlaceholder: 'Enter coupon code',
        apply: 'Apply',
        couponApplied: 'Coupon applied!',
        couponInvalid: 'Invalid coupon code.',
        couponError: 'An error occurred.',
        points: 'Use Points',
        pointsBalance: 'Your Points',
        pointsHint: '1 Point = $1 USD discount',
        useAll: 'Use All',
        payment: 'Payment Method',
        qrTitle: 'Bank QR Code (KHQR)',
        qrTestingEn: '⏳ Now Testing — Please wait when Opening Site',
        qrTestingKo: '현재 테스트 중입니다.',
        qrNote: 'Bank QR payment will be available soon. Thank you for your patience.',
        orderSummary: 'Order Summary',
        subtotal: 'Subtotal',
        shipping_fee: 'Shipping',
        shippingFree: 'Free (Event)',
        couponDiscount: 'Coupon Discount',
        pointsUsed: 'Points Used',
        total: 'Total',
        placeOrder: 'Place Order',
        processing: 'Processing...',
        savedAddress: 'Saved Addresses',
        newAddress: 'Enter New Address',
        selectProvince: 'Select Province / State',
        selectSavedAddress: 'Select a saved address...',
    },
    ko: {
        title: '주문 / 결제',
        shipping: '배송지 정보',
        recipient: '수령인',
        phone: '연락처',
        email: '이메일',
        province: '주/지역',
        address: '기본 주소',
        detailAddress: '상세 주소',
        notes: '배송 메모',
        notesPlaceholder: '문 앞에 두고 가주세요',
        discounts: '할인 및 포인트',
        coupon: '할인 쿠폰',
        couponPlaceholder: '쿠폰 코드를 입력하세요',
        apply: '적용',
        couponApplied: '쿠폰이 적용되었습니다!',
        couponInvalid: '유효하지 않은 쿠폰입니다.',
        couponError: '오류가 발생했습니다.',
        points: '포인트 사용',
        pointsBalance: '보유 포인트',
        pointsHint: '1 포인트 = 1 USD 할인',
        useAll: '전액사용',
        payment: '결제 수단',
        qrTitle: '은행 QR코드 결제 (KHQR)',
        qrTestingEn: '⏳ Now Testing — Please wait when Opening Site',
        qrTestingKo: '현재 테스트 중입니다.',
        qrNote: '은행 QR 결제 서비스 준비 중입니다. 조금만 기다려 주세요.',
        orderSummary: '주문 요약',
        subtotal: '상품 금액',
        shipping_fee: '배송비',
        shippingFree: '무료 (이벤트)',
        couponDiscount: '쿠폰 할인',
        pointsUsed: '포인트 사용',
        total: '최종 결제 금액',
        placeOrder: '결제하기',
        processing: '처리 중...',
        savedAddress: '저장된 주소',
        newAddress: '새 주소 입력',
        selectProvince: '주/지역 선택',
        selectSavedAddress: '저장된 주소를 선택하세요...',
    },
    km: {
        title: 'ការទូទាត់',
        shipping: 'ព័ត៌មានដឹកជញ្ជូន',
        recipient: 'ឈ្មោះអ្នកទទួល',
        phone: 'លេខទូរស័ព្ទ',
        email: 'អ៊ីមែល',
        province: 'ខេត្ត/ក្រុង',
        address: 'អាសយដ្ឋាន',
        detailAddress: 'ព័ត៌មានលំអិត',
        notes: 'កំណត់ចំណាំ',
        notesPlaceholder: 'ទុកនៅមុខទ្វារ',
        discounts: 'បញ្ចុះតម្លៃ',
        coupon: 'លេខកូដប័ណ្ណ',
        couponPlaceholder: 'បញ្ចូលលេខកូដប័ណ្ណ',
        apply: 'អនុវត្ត',
        couponApplied: 'ប័ណ្ណបានអនុវត្ត!',
        couponInvalid: 'លេខកូដប័ណ្ណមិនត្រឹមត្រូវ',
        couponError: 'បានកើតកំហុស',
        points: 'ប្រើពិន្ទុ',
        pointsBalance: 'ពិន្ទុរបស់អ្នក',
        pointsHint: '1 ពិន្ទុ = បញ្ចុះ $1',
        useAll: 'ប្រើទាំងអស់',
        payment: 'វិធីសាស្ត្រទូទាត់',
        qrTitle: 'QR Code ធនាគារ (KHQR)',
        qrTestingEn: '⏳ Now Testing — Please wait when Opening Site',
        qrTestingKo: '현재 테스트 중입니다.',
        qrNote: 'ការទូទាត់ QR ក្ខ្មែររ កំពុងត្រូវបានរៀបចំ។ សូមមេត្តាអត់ធ្មត់។',
        orderSummary: 'សង្ខេបការបញ្ជាទិញ',
        subtotal: 'សរុបរង',
        shipping_fee: 'ដឹកជញ្ជូន',
        shippingFree: 'ឥតគិតថ្លៃ',
        couponDiscount: 'បញ្ចុះតម្លៃប័ណ្ណ',
        pointsUsed: 'ពិន្ទុបានប្រើ',
        total: 'សរុបទាំងអស់',
        placeOrder: 'ដាក់ការបញ្ជាទិញ',
        processing: 'កំពុងដំណើរការ...',
        savedAddress: 'អាសយដ្ឋានដែលបានរក្សា',
        newAddress: 'បញ្ចូលអាសយដ្ឋានថ្មី',
        selectProvince: 'ជ្រើសរើសខេត្ត/ក្រុង',
        selectSavedAddress: 'ជ្រើសរើសអាសយដ្ឋានដែលបានរក្សា...',
    },
    zh: {
        title: '结账',
        shipping: '收货信息',
        recipient: '收货人',
        phone: '手机号码',
        email: '电子邮件',
        province: '省份/城市',
        address: '收货地址',
        detailAddress: '详细地址',
        notes: '配送备注',
        notesPlaceholder: '请放在门口',
        discounts: '优惠与积分',
        coupon: '优惠券',
        couponPlaceholder: '输入优惠券代码',
        apply: '使用',
        couponApplied: '优惠券已使用！',
        couponInvalid: '无效的优惠券',
        couponError: '发生错误',
        points: '使用积分',
        pointsBalance: '积分余额',
        pointsHint: '1积分 = $1折扣',
        useAll: '全部使用',
        payment: '付款方式',
        qrTitle: '银行二维码 (KHQR)',
        qrTestingEn: '⏳ Now Testing — Please wait when Opening Site',
        qrTestingKo: '현재 테스트 중입니다.',
        qrNote: '银行二维码付款功能即将上线，感谢您的耐心等待。',
        orderSummary: '订单摘要',
        subtotal: '商品小计',
        shipping_fee: '运费',
        shippingFree: '免运费（活动）',
        couponDiscount: '优惠券折扣',
        pointsUsed: '积分抵扣',
        total: '实付金额',
        placeOrder: '提交订单',
        processing: '处理中...',
        savedAddress: '已保存地址',
        newAddress: '输入新地址',
        selectProvince: '选择省份/城市',
        selectSavedAddress: '选择已保存地址...',
    },
};

interface Province {
    id: string;
    name: string;
    shippingFee: number;
}

interface SavedAddress {
    id: string;
    recipientName: string;
    phone: string;
    province: string;
    address: string;
    detailAddress?: string;
    isDefault?: boolean;
}

export default function CheckoutPage() {
    const store = useSafeAppStore();
    const language = store?.language || 'en';
    const t = checkoutTranslations[language] || checkoutTranslations.en;

    const router = useRouter();
    const cartItems = useCartStore(state => state.items);
    const subtotal = useCartStore(selectTotalPrice);
    const clearCart = useCartStore(state => state.clearCart);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [shippingFee, setShippingFee] = useState(0);

    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        province: '',
        address: '',
        detailAddress: '',
        notes: '',
        couponCode: '',
        pointsUsed: '0'
    });

    const [couponStatus, setCouponStatus] = useState<{ id?: string, discount?: number, msg?: string, type?: string, ok?: boolean }>({});

    // Fetch provinces on mount
    useEffect(() => {
        fetch('/api/settings/provinces')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProvinces(data);
            })
            .catch(() => {});
    }, []);

    // Fetch user profile + saved addresses
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
                    province: data.province || '',
                    address: data.address || '',
                    detailAddress: data.detailAddress || ''
                }));
                setLoading(false);
            })
            .catch(() => {
                router.push('/login?callbackUrl=/checkout');
            });

        fetch('/api/user/addresses')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSavedAddresses(data);
            })
            .catch(() => {});
    }, [router]);

    // Update shipping fee when province changes or provinces loaded
    useEffect(() => {
        if (form.province && provinces.length > 0) {
            const found = provinces.find(p => p.name === form.province);
            setShippingFee(found ? found.shippingFee : 0);
        }
    }, [form.province, provinces]);

    useEffect(() => {
        if (!loading && cartItems.length === 0) {
            router.push('/cart');
        }
    }, [loading, cartItems.length, router]);

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedName = e.target.value;
        const found = provinces.find(p => p.name === selectedName);
        setForm(f => ({ ...f, province: selectedName }));
        setShippingFee(found ? found.shippingFee : 0);
    };

    const handleSavedAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val || val === '__new__') {
            setForm(f => ({
                ...f,
                customerName: '',
                customerPhone: '',
                province: '',
                address: '',
                detailAddress: '',
            }));
            setShippingFee(0);
            return;
        }
        const addr = savedAddresses.find(a => a.id === val);
        if (!addr) return;
        const foundProvince = provinces.find(p => p.name === addr.province);
        setShippingFee(foundProvince ? foundProvince.shippingFee : 0);
        setForm(f => ({
            ...f,
            customerName: addr.recipientName || f.customerName,
            customerPhone: addr.phone || f.customerPhone,
            province: addr.province || '',
            address: addr.address || '',
            detailAddress: addr.detailAddress || '',
        }));
    };

    const handleApplyCoupon = async () => {
        if (!form.couponCode) return;
        setCouponStatus({ msg: '...' });
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: form.couponCode, subtotal })
            });
            const data = await res.json();
            if (res.ok) {
                setCouponStatus({ discount: data.discount, type: data.type, ok: true, msg: t.couponApplied });
            } else {
                setCouponStatus({ ok: false, msg: data.error || t.couponInvalid });
            }
        } catch (e) {
            setCouponStatus({ ok: false, msg: t.couponError });
        }
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0;
        if (user && val > user.pointBalance) val = user.pointBalance;
        const discountAmt = couponStatus.ok
            ? (couponStatus.type === 'PERCENT'
                ? subtotal * (couponStatus.discount! / 100)
                : couponStatus.discount!)
            : 0;
        const maxUsable = subtotal + shippingFee - discountAmt;
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
                    shippingFee,
                    items: cartItems.map(i => ({
                        productId: i.productId,
                        variantId: i.variantId || null,
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
                alert(data.error || 'Order failed. Please try again.');
                setSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred. Please try again.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            </div>
        );
    }

    const discountAmt = couponStatus.ok
        ? (couponStatus.type === 'PERCENT'
            ? subtotal * (couponStatus.discount! / 100)
            : couponStatus.discount!)
        : 0;
    const finalTotal = Math.max(0, subtotal + shippingFee - discountAmt - (parseInt(form.pointsUsed) || 0));
    const formatUsd = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-20 pt-4">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
                <h1 className="text-xl sm:text-2xl font-black mb-6 flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-brand-primary flex-shrink-0" />
                    {t.title}
                </h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* ── Left Column ── */}
                    <div className="lg:col-span-7 space-y-4">

                        {/* Shipping Info */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <h2 className="text-base font-bold flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
                                <MapPin className="w-4 h-4 text-brand-primary" />
                                {t.shipping}
                            </h2>

                            {/* Saved Address Picker */}
                            {savedAddresses.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
                                        <BookmarkCheck className="w-3.5 h-3.5 text-brand-primary" />
                                        {t.savedAddress}
                                    </label>
                                    <div className="relative">
                                        <select
                                            onChange={handleSavedAddressSelect}
                                            defaultValue=""
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none appearance-none bg-white pr-8"
                                        >
                                            <option value="">{t.selectSavedAddress}</option>
                                            {savedAddresses.map(addr => (
                                                <option key={addr.id} value={addr.id}>
                                                    {addr.recipientName} — {addr.province}, {addr.address}
                                                    {addr.isDefault ? ' ★' : ''}
                                                </option>
                                            ))}
                                            <option value="__new__">{t.newAddress}</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">{t.recipient}</label>
                                        <input required type="text" value={form.customerName}
                                            onChange={e => setForm({ ...form, customerName: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">{t.phone}</label>
                                        <input required type="tel" value={form.customerPhone}
                                            onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.email}</label>
                                    <input required type="email" value={form.customerEmail}
                                        onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" readOnly />
                                </div>

                                {/* Province Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">
                                        {t.province}
                                    </label>
                                    {provinces.length > 0 ? (
                                        <div className="relative">
                                            <select
                                                value={form.province}
                                                onChange={handleProvinceChange}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none appearance-none bg-white pr-8"
                                            >
                                                <option value="">{t.selectProvince}</option>
                                                {provinces.map(p => (
                                                    <option key={p.id} value={p.name}>
                                                        {p.name}
                                                        {p.shippingFee > 0 ? ` (+${formatUsd(p.shippingFee)})` : ' (Free)'}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={form.province}
                                            onChange={e => setForm({ ...form, province: e.target.value })}
                                            placeholder={t.selectProvince}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                                        />
                                    )}
                                    {shippingFee > 0 && (
                                        <p className="text-[11px] text-amber-600 font-medium mt-1">
                                            Shipping fee: {formatUsd(shippingFee)}
                                        </p>
                                    )}
                                    {shippingFee === 0 && form.province && (
                                        <p className="text-[11px] text-green-600 font-medium mt-1">
                                            Free shipping for this area
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.address}</label>
                                    <input required type="text" value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.detailAddress}</label>
                                    <input type="text" value={form.detailAddress}
                                        onChange={e => setForm({ ...form, detailAddress: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">{t.notes}</label>
                                    <input type="text" value={form.notes} placeholder={t.notesPlaceholder}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Discounts & Points */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <h2 className="text-base font-bold flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
                                <Ticket className="w-4 h-4 text-brand-primary" />
                                {t.discounts}
                            </h2>
                            <div className="space-y-5">
                                {/* Coupon */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">{t.coupon}</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={form.couponCode} placeholder={t.couponPlaceholder}
                                            onChange={e => { setForm({ ...form, couponCode: e.target.value.toUpperCase() }); setCouponStatus({}); }}
                                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                        <button type="button" onClick={handleApplyCoupon}
                                            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap">
                                            {t.apply}
                                        </button>
                                    </div>
                                    {couponStatus.msg && (
                                        <p className={`text-xs mt-2 flex items-center gap-1 ${couponStatus.ok ? 'text-green-600 font-medium' : 'text-red-500'}`}>
                                            {couponStatus.ok && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {couponStatus.msg}
                                        </p>
                                    )}
                                </div>
                                {/* Points */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-xs font-bold text-gray-600">{t.points}</label>
                                        <span className="text-[11px] text-gray-400">{t.pointsBalance}: <strong className="text-brand-primary">{(user?.pointBalance || 0).toLocaleString()} P</strong></span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input type="number" min="0" value={form.pointsUsed} onChange={handlePointsChange}
                                                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                        </div>
                                        <button type="button" onClick={() => handlePointsChange({ target: { value: String(user?.pointBalance) } } as any)}
                                            className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap">
                                            {t.useAll}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1.5">{t.pointsHint}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Payment Method Section ── */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <h2 className="text-base font-bold flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
                                <QrCode className="w-4 h-4 text-brand-primary" />
                                {t.payment}
                            </h2>

                            {/* Bank QR Card - Testing State */}
                            <div className="border-2 border-dashed border-amber-300 rounded-2xl p-5 bg-amber-50">
                                <div className="flex items-start gap-3 mb-4">
                                    {/* QR Placeholder */}
                                    <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-white border border-amber-200 flex items-center justify-center shadow-sm">
                                        <QrCode className="w-10 h-10 text-amber-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-gray-900">{t.qrTitle}</span>
                                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">KHQR</span>
                                        </div>
                                        {/* Supported Banks */}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {['ABA', 'ACLEDA', 'Wing', 'TrueMoney', 'Pi Pay'].map(b => (
                                                <span key={b} className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-1.5 py-0.5 rounded">{b}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Testing Notice */}
                                <div className="bg-white rounded-xl border border-amber-200 p-3 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-sm font-bold text-amber-700">{t.qrTestingEn}</p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 pl-6">{t.qrTestingKo}</p>
                                    <p className="text-xs text-gray-400 pl-6">{t.qrNote}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column - Order Summary ── */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm lg:sticky lg:top-24">
                            <h2 className="text-base font-bold mb-4 border-b border-gray-100 pb-3">{t.orderSummary}</h2>

                            {/* Cart Items */}
                            <div className="space-y-3 mb-5 max-h-[280px] overflow-y-auto pr-1">
                                {cartItems.map((item, idx) => (
                                    <div key={item.variantId ? `${item.productId}-${item.variantId}` : `${item.productId}-${idx}`} className="flex gap-3 items-center">
                                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                                            {item.variantLabel && (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                                                    {item.variantLabel}
                                                </span>
                                            )}
                                            <p className="text-[11px] text-gray-400 mt-0.5">× {item.qty}</p>
                                        </div>
                                        <div className="font-black text-sm text-gray-900 flex-shrink-0">
                                            {formatUsd(item.priceUsd * item.qty)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 py-4 border-t border-b border-gray-100 mb-4">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{t.subtotal}</span>
                                    <span className="font-bold text-gray-900">{formatUsd(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{t.shipping_fee}</span>
                                    {shippingFee > 0 ? (
                                        <span className="font-bold text-gray-900">{formatUsd(shippingFee)}</span>
                                    ) : (
                                        <span className="font-bold text-green-600">{t.shippingFree}</span>
                                    )}
                                </div>
                                {discountAmt > 0 && (
                                    <div className="flex justify-between text-sm text-brand-primary font-bold">
                                        <span>{t.couponDiscount}</span>
                                        <span>-{formatUsd(discountAmt)}</span>
                                    </div>
                                )}
                                {parseInt(form.pointsUsed) > 0 && (
                                    <div className="flex justify-between text-sm text-brand-primary font-bold">
                                        <span>{t.pointsUsed}</span>
                                        <span>-{formatUsd(parseInt(form.pointsUsed))}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center mb-5">
                                <span className="text-sm font-bold text-gray-900">{t.total}</span>
                                <span className="text-2xl font-black text-rose-600">{formatUsd(finalTotal)}</span>
                            </div>

                            <button type="submit" disabled={submitting}
                                className="w-full py-4 bg-brand-primary text-white font-black text-base rounded-xl hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 flex justify-center items-center gap-2">
                                {submitting
                                    ? <><Loader2 className="w-5 h-5 animate-spin" />{t.processing}</>
                                    : t.placeOrder
                                }
                            </button>

                            <p className="text-center text-[11px] text-gray-400 mt-3 leading-relaxed">
                                🔒 Secure order • 100% Authentic products • Fast delivery to Phnom Penh
                            </p>
                        </div>
                    </div>
                </form>
            </div>
            <Footer />
        </main>
    );
}
