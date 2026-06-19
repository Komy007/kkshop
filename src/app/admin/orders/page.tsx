import React from 'react';
import { prisma } from '@/lib/api';
import { ShoppingBag, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import OrderShipmentModal from '@/components/admin/OrderShipmentModal';
import AdminOrdersFilter from '@/components/admin/AdminOrdersFilter';
import { revalidatePath } from 'next/cache';
import { sendOrderStatusEmail } from '@/lib/mail';
import { logAudit } from '@/lib/audit';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// Valid state machine transitions: only these paths are allowed
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    PENDING:    ['CONFIRMED', 'CANCELLED'],
    CONFIRMED:  ['SHIPPING', 'CANCELLED'],
    SHIPPING:   ['DELIVERED'],
    DELIVERED:  [],
    CANCELLED:  [],
};

async function updateOrderStatus(orderId: string, newStatus: string) {
    'use server';
    // Server Action — 세션은 next/headers 쿠키로 읽음
    const session = await auth();
    // ★ RBAC 체크: ADMIN/SUPERADMIN만 허용 (미들웨어 우회 방지)
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes((session.user as any).role)) return;
    // Validate state machine transition
    const current = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, customerEmail: true, shipment: { select: { carrier: true, trackingNumber: true, trackingUrl: true } } },
    });
    if (!current) return;
    const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(newStatus)) return; // silently reject invalid transitions

    if (newStatus === 'CANCELLED') {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (order && order.status !== 'CANCELLED') {
            await prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    // Restore variant stock if applicable
                    if ((item as any).variantId) {
                        await tx.productVariant.update({
                            where: { id: (item as any).variantId },
                            data: { stockQty: { increment: item.quantity } },
                        });
                    }
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { stockQty: true, status: true },
                    });
                    if (!product) continue;
                    const newStock = product.stockQty + item.quantity;
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQty: newStock,
                            ...(product.status === 'SOLDOUT' && newStock > 0 ? { status: 'ACTIVE' } : {}),
                        },
                    });
                    await (tx as any).stockLog.create({
                        data: {
                            productId: item.productId,
                            changeQty: item.quantity,
                            balanceAfter: newStock,
                            reason: 'RETURN',
                            memo: `주문 취소 복구 (Order #${orderId.slice(0, 8)})`,
                            orderId,
                            createdBy: 'admin',
                        },
                    });
                }
                // Refund points if used
                if ((order as any).pointsUsed > 0 && order.userId) {
                    const updatedUser = await tx.user.update({
                        where: { id: order.userId },
                        data: { pointBalance: { increment: (order as any).pointsUsed } },
                    });
                    await (tx as any).userPoint.create({
                        data: {
                            userId: order.userId,
                            amount: (order as any).pointsUsed,
                            reason: `주문 취소 환불 (Order #${orderId.slice(0, 8)})`,
                            balanceAfter: updatedUser.pointBalance,
                            orderId,
                        },
                    });
                }
                // Return coupon usage
                if ((order as any).couponId && order.userId) {
                    await tx.coupon.update({
                        where: { id: (order as any).couponId },
                        data: { usedCount: { decrement: 1 } },
                    });
                    await tx.userCoupon.deleteMany({
                        where: { orderId, userId: order.userId },
                    });
                }
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: newStatus },
                });
            });
        } else {
            // race condition: 동시 요청에 의해 이미 취소됨 — 재처리 불필요
            return;
        }
    } else if (newStatus === 'DELIVERED') {
        // Award points on delivery (not on order creation)
        await prisma.$transaction(async (tx) => {
            const deliveredOrder = await tx.order.findUnique({
                where: { id: orderId },
                select: { userId: true, totalUsd: true },
            });
            await tx.order.update({ where: { id: orderId }, data: { status: newStatus } });
            if (deliveredOrder?.userId) {
                // Dedupe: skip if points already awarded for this order
                const existing = await tx.userPoint.findFirst({
                    where: { orderId, userId: deliveredOrder.userId, amount: { gt: 0 } },
                });
                if (!existing) {
                    const ptsCfgRow = await tx.siteSetting.findUnique({ where: { key: 'points_config' } });
                    const ptsCfg: any = ptsCfgRow?.value
                        ? (typeof ptsCfgRow.value === 'string' ? JSON.parse(ptsCfgRow.value as string) : ptsCfgRow.value)
                        : {};
                    const earnRatePct = typeof ptsCfg.earnRate === 'number' ? Math.min(Math.max(ptsCfg.earnRate, 0), 50) : 1;
                    const redeemRate = typeof ptsCfg.redeemRate === 'number' ? Math.max(ptsCfg.redeemRate, 1) : 1000;
                    const rewardPoints = Math.floor(Number(deliveredOrder.totalUsd) * (earnRatePct / 100) * redeemRate);
                    if (rewardPoints > 0) {
                        const updatedUser = await tx.user.update({
                            where: { id: deliveredOrder.userId },
                            data: { pointBalance: { increment: rewardPoints } },
                        });
                        await tx.userPoint.create({
                            data: {
                                userId: deliveredOrder.userId,
                                amount: rewardPoints,
                                reason: `배송완료 적립 (Order #${orderId.slice(0, 8)})`,
                                balanceAfter: updatedUser.pointBalance,
                                orderId,
                            },
                        });
                    }
                }
            }
        });
    } else {
        // CONFIRMED, SHIPPING 등 취소/배송완료 이외의 상태 변경
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus },
        });
    }

    // Send customer notification email (non-blocking)
    if (current.customerEmail && ['CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].includes(newStatus)) {
        sendOrderStatusEmail(
            current.customerEmail,
            orderId,
            newStatus as 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED',
            newStatus === 'SHIPPING' && current.shipment ? {
                carrier: current.shipment.carrier,
                trackingNumber: current.shipment.trackingNumber,
                trackingUrl: current.shipment.trackingUrl,
            } : undefined
        ).catch((e) => console.error('Order status email failed:', e));
    }

    // 감사 로그 기록 (non-blocking)
    if (session?.user?.id) {
        logAudit({
            userId: session.user.id,
            userEmail: session.user.email ?? 'admin',
            userRole: (session.user as any).role ?? 'ADMIN',
            action: newStatus === 'CANCELLED' ? 'CANCEL_ORDER' : 'UPDATE_ORDER_STATUS',
            resource: 'Order',
            resourceId: orderId,
            details: { from: current.status, to: newStatus },
        }).catch((e) => console.error('Audit log failed:', e));
    }

    revalidatePath('/admin/orders');
}

const STATUS_STYLE: Record<string, string> = {
    PENDING:          'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED:        'bg-blue-50 text-blue-700 border-blue-200',
    SHIPPING:         'bg-indigo-50 text-indigo-700 border-indigo-200',
    DELIVERED:        'bg-green-50 text-green-700 border-green-200',
    CANCELLED:        'bg-red-50 text-red-700 border-red-200',
    REFUNDED:         'bg-gray-50 text-gray-500 border-gray-200',
    RETURN_REQUESTED: 'bg-orange-50 text-orange-700 border-orange-200',
};

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; q?: string }> }) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? '1', 10));
    const status = params.status ?? '';
    const q = params.q ?? '';
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (q) {
        where.OR = [
            { id: { contains: q, mode: 'insensitive' } },
            { customerName: { contains: q, mode: 'insensitive' } },
            { customerEmail: { contains: q, mode: 'insensitive' } },
        ];
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: PAGE_SIZE,
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                translations: { where: { langCode: 'en' }, take: 1 },
                            },
                        },
                    },
                },
                shipment: true,
            },
        }),
        prisma.order.count({ where }),
    ]);
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const formatUsd = (price: any) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price));

    const buildPageUrl = (p: number) => {
        const sp = new URLSearchParams();
        sp.set('page', String(p));
        if (status) sp.set('status', status);
        if (q) sp.set('q', q);
        return `?${sp.toString()}`;
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <header className="mb-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" /> Order Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Update status, add shipment tracking for each order.</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                    {total} Orders
                </div>
            </header>

            <AdminOrdersFilter currentStatus={status} currentQ={q} />

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-5 py-4">Order / Date</th>
                                <th className="px-5 py-4">Customer</th>
                                <th className="px-5 py-4 min-w-[200px]">Items</th>
                                <th className="px-5 py-4">Total</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-gray-400">No orders found.</td>
                                </tr>
                            )}
                            {orders.map(order => {
                                const confirmAction = updateOrderStatus.bind(null, order.id, 'CONFIRMED');
                                const shipAction = updateOrderStatus.bind(null, order.id, 'SHIPPING');
                                const deliverAction = updateOrderStatus.bind(null, order.id, 'DELIVERED');
                                const cancelAction = updateOrderStatus.bind(null, order.id, 'CANCELLED');

                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 align-top">
                                            <div className="font-mono text-[10px] text-gray-400 mb-1">{order.id.slice(0, 12)}…</div>
                                            <div className="text-xs text-gray-600 font-medium">
                                                {order.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                {order.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
                                            <div className="text-gray-400 text-xs mt-0.5 truncate max-w-[140px]">{order.customerEmail}</div>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <ul className="space-y-0.5">
                                                {order.items.map(item => {
                                                    const enName = item.product.translations[0]?.name ?? item.product.sku;
                                                    return (
                                                        <li key={item.id} className="text-xs text-gray-600 line-clamp-1 max-w-[200px]">
                                                            • {enName} × {item.quantity}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="font-black text-rose-600 text-sm">{formatUsd(order.totalUsd)}</div>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLE[order.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex flex-col gap-1.5">
                                                {order.status === 'PENDING' && (
                                                    <form action={confirmAction}>
                                                        <button type="submit" className="w-full text-xs px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-semibold transition-colors">
                                                            ✓ Confirm
                                                        </button>
                                                    </form>
                                                )}
                                                {order.status === 'CONFIRMED' && (
                                                    <form action={shipAction}>
                                                        <button type="submit" className="w-full text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded font-semibold transition-colors flex items-center justify-center gap-1">
                                                            <Truck className="w-3 h-3" /> Ship
                                                        </button>
                                                    </form>
                                                )}
                                                {order.status === 'SHIPPING' && (
                                                    <form action={deliverAction}>
                                                        <button type="submit" className="w-full text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded font-semibold transition-colors">
                                                            ✅ Delivered
                                                        </button>
                                                    </form>
                                                )}
                                                {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                                    <form action={cancelAction}>
                                                        <button type="submit" className="w-full text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded font-semibold transition-colors">
                                                            ✕ Cancel
                                                        </button>
                                                    </form>
                                                )}
                                                <OrderShipmentModal orderId={order.id} shipment={order.shipment} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {orders.length === 0 && (
                    <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">No orders found.</div>
                )}
                {orders.map(order => {
                    const confirmAction = updateOrderStatus.bind(null, order.id, 'CONFIRMED');
                    const shipAction = updateOrderStatus.bind(null, order.id, 'SHIPPING');
                    const deliverAction = updateOrderStatus.bind(null, order.id, 'DELIVERED');
                    const cancelAction = updateOrderStatus.bind(null, order.id, 'CANCELLED');
                    return (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="font-mono text-[10px] text-gray-400">{order.id.slice(0, 12)}…</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLE[order.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="mb-2">
                                <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
                                <div className="text-xs text-gray-400">{order.customerEmail}</div>
                            </div>
                            <ul className="space-y-0.5 mb-3">
                                {order.items.map(item => {
                                    const enName = item.product.translations[0]?.name ?? item.product.sku;
                                    return (
                                        <li key={item.id} className="text-xs text-gray-600 line-clamp-1">• {enName} × {item.quantity}</li>
                                    );
                                })}
                            </ul>
                            <div className="flex items-center justify-between">
                                <span className="font-black text-rose-600 text-base">{formatUsd(order.totalUsd)}</span>
                                <div className="flex gap-1.5">
                                    {order.status === 'PENDING' && (
                                        <form action={confirmAction}>
                                            <button type="submit" className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">✓ Confirm</button>
                                        </form>
                                    )}
                                    {order.status === 'CONFIRMED' && (
                                        <form action={shipAction}>
                                            <button type="submit" className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold">Ship</button>
                                        </form>
                                    )}
                                    {order.status === 'SHIPPING' && (
                                        <form action={deliverAction}>
                                            <button type="submit" className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded font-semibold">✅ Delivered</button>
                                        </form>
                                    )}
                                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                        <form action={cancelAction}>
                                            <button type="submit" className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded font-semibold">✕ Cancel</button>
                                        </form>
                                    )}
                                    <OrderShipmentModal orderId={order.id} shipment={order.shipment} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total} orders
                    </p>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <a href={buildPageUrl(page - 1)} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </a>
                        )}
                        <span className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg">
                            {page} / {totalPages}
                        </span>
                        {page < totalPages && (
                            <a href={buildPageUrl(page + 1)} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Next <ChevronRight className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
