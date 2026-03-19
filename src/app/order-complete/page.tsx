'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, MapPin, Package, Loader2 } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const t: Record<string, Record<string, string>> = {
    en: {
        title: 'Order Complete!',
        subtitle: 'Thank you for your purchase.',
        orderNumber: 'Order Number',
        items: 'items',
        total: 'Total',
        recipient: 'Recipient',
        address: 'Delivery Address',
        viewOrder: 'View Order Details',
        continueShopping: 'Continue Shopping',
        loading: 'Loading order...',
        error: 'Could not load order information.',
    },
    ko: {
        title: '주문이 완료되었습니다!',
        subtitle: '구매해 주셔서 감사합니다.',
        orderNumber: '주문번호',
        items: '개 상품',
        total: '결제 금액',
        recipient: '수령인',
        address: '배송지',
        viewOrder: '주문 상세 보기',
        continueShopping: '쇼핑 계속하기',
        loading: '주문 정보를 불러오는 중...',
        error: '주문 정보를 불러올 수 없습니다.',
    },
    km: {
        title: 'ការបញ្ជាទិញបានបញ្ចប់!',
        subtitle: 'អរគុណសម្រាប់ការទិញរបស់អ្នក។',
        orderNumber: 'លេខបញ្ជាទិញ',
        items: 'ផលិតផល',
        total: 'សរុប',
        recipient: 'អ្នកទទួល',
        address: 'អាសយដ្ឋានដឹកជញ្ជូន',
        viewOrder: 'មើលព័ត៌មានលម្អិត',
        continueShopping: 'បន្តទិញទំនិញ',
        loading: 'កំពុងផ្ទុកការបញ្ជាទិញ...',
        error: 'មិនអាចផ្ទុកព័ត៌មានបញ្ជាទិញបានទេ។',
    },
    zh: {
        title: '订单已完成！',
        subtitle: '感谢您的购买。',
        orderNumber: '订单号',
        items: '件商品',
        total: '支付金额',
        recipient: '收件人',
        address: '配送地址',
        viewOrder: '查看订单详情',
        continueShopping: '继续购物',
        loading: '正在加载订单信息...',
        error: '无法加载订单信息。',
    },
};

interface OrderData {
    id: string;
    customerName: string;
    address: string;
    detailAddress?: string | null;
    totalUsd: number | string;
    items: Array<{ id: string; quantity: number }>;
}

function LoadingScreen({ text }: { text: string }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">{text}</p>
            </div>
        </div>
    );
}

function OrderCompleteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { data: session, status: sessionStatus } = useSession();
    const language = useSafeAppStore(s => s.language) || 'en';
    const tx = t[language] ?? t['en'];

    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // 인증 확인 — 미로그인 시 /login으로 리다이렉트
    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.replace('/login');
        }
    }, [sessionStatus, router]);

    useEffect(() => {
        if (!orderId || sessionStatus !== 'authenticated') return;

        fetch(`/api/user/orders/${orderId}`)
            .then(res => {
                if (!res.ok) throw new Error('fetch failed');
                return res.json();
            })
            .then(data => {
                setOrder(data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [orderId, sessionStatus]);

    if (sessionStatus === 'loading' || loading) {
        return <LoadingScreen text={tx.loading} />;
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm p-6 max-w-sm w-full text-center">
                    <p className="text-gray-500 mb-4">{tx.error}</p>
                    <Link href="/" className="inline-block px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors">
                        {tx.continueShopping}
                    </Link>
                </div>
            </div>
        );
    }

    const shortId = order.id.slice(0, 8).toUpperCase();
    const itemCount = order.items?.length ?? 0;
    const total = Number(order.totalUsd).toFixed(2);
    const fullAddress = order.detailAddress
        ? `${order.address}, ${order.detailAddress}`
        : order.address;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-4">
            <div className="w-full max-w-md space-y-4">

                {/* 성공 헤더 */}
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-200/50"
                            style={{ animation: 'scale-in-3d 0.5s ease-out forwards' }}
                        />
                        <svg className="relative w-24 h-24 p-6" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 13l4 4L19 7"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    strokeDasharray: 30,
                                    strokeDashoffset: 30,
                                    animation: 'draw-check 0.4s ease-out 0.4s forwards',
                                }}
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{tx.title}</h1>
                    <p className="text-gray-500 text-sm">{tx.subtitle}</p>
                </div>

                {/* 주문 정보 카드 */}
                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">

                    {/* 주문 번호 */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">{tx.orderNumber}</p>
                            <p className="text-sm font-semibold text-gray-900 font-mono">#{shortId}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* 상품 수 + 총 금액 */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400">{tx.total}</p>
                                <p className="text-sm text-gray-600">
                                    {itemCount} {tx.items}
                                </p>
                            </div>
                            <p className="text-lg font-bold text-gray-900">${total}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* 배송지 */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">{tx.recipient} · {tx.address}</p>
                            <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{fullAddress}</p>
                        </div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="space-y-3">
                    <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center justify-center w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
                    >
                        {tx.viewOrder}
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                    >
                        {tx.continueShopping}
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default function OrderCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        }>
            <OrderCompleteContent />
        </Suspense>
    );
}
