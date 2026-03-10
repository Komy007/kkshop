'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Package, ChevronLeft, Truck, MapPin, Clock, CheckCircle,
    XCircle, Loader2, ExternalLink, Tag, Gift
} from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const t: Record<string, any> = {
    en: {
        title: 'Order Detail',
        back: 'My Orders',
        orderNo: 'Order #',
        placedOn: 'Placed on',
        items: 'Items',
        summary: 'Order Summary',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        discount: 'Discount',
        points: 'Points Used',
        total: 'Total',
        free: 'Free',
        delivery: 'Delivery Info',
        tracking: 'Track Package',
        noTracking: 'Tracking not available yet',
        status: {
            PENDING: 'Pending',
            CONFIRMED: 'Confirmed',
            SHIPPING: 'Shipping',
            DELIVERED: 'Delivered',
            CANCELLED: 'Cancelled',
        },
        loading: 'Loading order...',
        notFound: 'Order not found.',
    },
    ko: {
        title: '주문 상세',
        back: '주문 목록',
        orderNo: '주문번호 #',
        placedOn: '주문일',
        items: '주문 상품',
        summary: '결제 정보',
        subtotal: '상품 합계',
        shipping: '배송비',
        discount: '할인',
        points: '포인트 사용',
        total: '최종 결제',
        free: '무료',
        delivery: '배송 정보',
        tracking: '배송 추적',
        noTracking: '아직 배송 정보가 없습니다',
        status: {
            PENDING: '결제 대기',
            CONFIRMED: '주문 확인',
            SHIPPING: '배송 중',
            DELIVERED: '배송 완료',
            CANCELLED: '취소됨',
        },
        loading: '주문 정보를 불러오는 중...',
        notFound: '주문을 찾을 수 없습니다.',
    },
    km: {
        title: 'ព័ត៌មានលម្អិតការបញ្ជាទិញ',
        back: 'ការបញ្ជាទិញរបស់ខ្ញុំ',
        orderNo: 'ការបញ្ជាទិញ #',
        placedOn: 'បញ្ជាទិញនៅ',
        items: 'ទំនិញ',
        summary: 'សង្ខេបការបញ្ជាទិញ',
        subtotal: 'សរុបរង',
        shipping: 'ថ្លៃដឹកជញ្ជូន',
        discount: 'បញ្ចុះតម្លៃ',
        points: 'ពិន្ទុដែលបានប្រើ',
        total: 'សរុប',
        free: 'ឥតគិតថ្លៃ',
        delivery: 'ព័ត៌មានដឹកជញ្ជូន',
        tracking: 'តាមដានកញ្ចប់',
        noTracking: 'មិនទាន់មានព័ត៌មានតាមដាន',
        status: {
            PENDING: 'រង់ចាំ',
            CONFIRMED: 'បានបញ្ជាក់',
            SHIPPING: 'កំពុងដឹកជញ្ជូន',
            DELIVERED: 'បានដឹកជញ្ជូន',
            CANCELLED: 'បានលុបចោល',
        },
        loading: 'កំពុងផ្ទុក...',
        notFound: 'រកមិនឃើញការបញ្ជាទិញ។',
    },
    zh: {
        title: '订单详情',
        back: '我的订单',
        orderNo: '订单 #',
        placedOn: '下单时间',
        items: '订单商品',
        summary: '订单汇总',
        subtotal: '商品小计',
        shipping: '运费',
        discount: '折扣',
        points: '使用积分',
        total: '合计',
        free: '免运费',
        delivery: '配送信息',
        tracking: '跟踪包裹',
        noTracking: '暂无物流信息',
        status: {
            PENDING: '待处理',
            CONFIRMED: '已确认',
            SHIPPING: '配送中',
            DELIVERED: '已送达',
            CANCELLED: '已取消',
        },
        loading: '加载订单中...',
        notFound: '找不到该订单。',
    },
};

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    SHIPPING: 'bg-purple-50 text-purple-700 border-purple-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4" />,
    CONFIRMED: <CheckCircle className="w-4 h-4" />,
    SHIPPING: <Truck className="w-4 h-4" />,
    DELIVERED: <CheckCircle className="w-4 h-4" />,
    CANCELLED: <XCircle className="w-4 h-4" />,
};

const formatUsd = (n: number | string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const store = useSafeAppStore();
    const lang = (store?.language as keyof typeof t) || 'en';
    const tx = t[lang] || t.en;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/user/orders/${id}`)
            .then(res => {
                if (res.status === 404) { setNotFound(true); return null; }
                if (!res.ok) throw new Error('fetch failed');
                return res.json();
            })
            .then(data => { if (data) setOrder(data); })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-semibold">{tx.loading}</p>
                </div>
            </main>
        );
    }

    if (notFound || !order) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <Package className="w-16 h-16 text-gray-200" />
                <p className="text-gray-500 font-semibold">{tx.notFound}</p>
                <Link href="/mypage" className="text-brand-primary font-bold text-sm hover:underline">{tx.back}</Link>
            </main>
        );
    }

    const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
    const statusIcon = STATUS_ICONS[order.status] || STATUS_ICONS.PENDING;
    const statusLabel = tx.status[order.status] || order.status;

    const shippingFee = Number(order.shippingFee);
    const discountAmount = Number(order.discountAmount);
    const pointsUsed = Number(order.pointsUsed || 0);

    return (
        <main className="min-h-screen bg-gray-50 pb-24 pt-4">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-extrabold text-gray-900">{tx.title}</h1>
                        <p className="text-xs text-gray-400">{tx.orderNo}{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusStyle}`}>
                        {statusIcon}
                        {statusLabel}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Meta */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{tx.placedOn}: <span className="font-bold text-gray-700">{formatDate(order.createdAt)}</span></span>
                    </div>

                    {/* Items */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h2 className="text-sm font-extrabold text-gray-900">{tx.items}</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items.map((item: any) => (
                                <div key={item.id} className="flex items-start gap-3 p-4">
                                    <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                                        <img
                                            src={item.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200'}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                                        />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/products/${item.productId}`}>
                                            <p className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-brand-primary transition-colors">
                                                {item.name}
                                            </p>
                                        </Link>
                                        {item.variantLabel && (
                                            <p className="text-xs text-gray-400 mt-0.5">{item.variantLabel}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-xs text-gray-400">× {item.quantity}</span>
                                            <span className="text-sm font-black text-brand-secondary">
                                                {formatUsd(Number(item.priceUsd) * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <h2 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-primary" /> {tx.delivery}
                        </h2>
                        <div className="space-y-1 text-sm text-gray-600">
                            {order.customerName && <p><span className="font-semibold">{order.customerName}</span></p>}
                            {order.customerPhone && <p>{order.customerPhone}</p>}
                            {order.province && <p className="text-gray-500">{order.province}</p>}
                            {order.address && <p>{order.address}</p>}
                            {order.detailAddress && <p>{order.detailAddress}</p>}
                        </div>

                        {/* Tracking */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5" /> {tx.tracking}
                            </p>
                            {order.shipment ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">{order.shipment.carrier}</p>
                                        <p className="text-xs text-gray-400 font-mono">{order.shipment.trackingNumber}</p>
                                    </div>
                                    {order.shipment.trackingUrl && (
                                        <a
                                            href={order.shipment.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
                                        >
                                            {tx.tracking} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">{tx.noTracking}</p>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h2 className="text-sm font-extrabold text-gray-900 mb-4">{tx.summary}</h2>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>{tx.subtotal}</span>
                                <span className="font-semibold">{formatUsd(order.subtotalUsd)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>{tx.shipping}</span>
                                <span className="font-semibold">
                                    {shippingFee === 0 ? <span className="text-green-600">{tx.free}</span> : formatUsd(shippingFee)}
                                </span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {tx.discount}</span>
                                    <span className="font-semibold">-{formatUsd(discountAmount)}</span>
                                </div>
                            )}
                            {pointsUsed > 0 && (
                                <div className="flex justify-between text-purple-600">
                                    <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> {tx.points}</span>
                                    <span className="font-semibold">-{formatUsd(pointsUsed)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 mt-3 border-t border-gray-100">
                            <span>{tx.total}</span>
                            <span className="text-brand-secondary">{formatUsd(order.totalUsd)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
