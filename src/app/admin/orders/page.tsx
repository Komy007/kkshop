import React from 'react';
import { prisma } from '@/lib/api';
import { ShoppingBag, Truck } from 'lucide-react';
import OrderShipmentModal from '@/components/admin/OrderShipmentModal';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function updateOrderStatus(orderId: string, newStatus: string) {
    'use server';
    await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
    });
    revalidatePath('/admin/orders');
}

const STATUS_STYLE: Record<string, string> = {
    PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    SHIPPING:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    REFUNDED:  'bg-gray-50 text-gray-500 border-gray-200',
};

export default async function AdminOrdersPage() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
            items: { include: { product: true } },
            shipment: true,
        },
    });

    const formatUsd = (price: any) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price));

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <header className="mb-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" /> Order Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Update status, add shipment tracking for each order.</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                    {orders.length} Orders
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                                    <td colSpan={6} className="px-5 py-16 text-center text-gray-400">No orders yet.</td>
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
                                            <div className="text-gray-500 text-xs mt-0.5">{order.customerPhone}</div>
                                            <div className="text-gray-400 text-xs mt-0.5 truncate max-w-[140px]">{order.customerEmail}</div>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <ul className="space-y-0.5">
                                                {order.items.map(item => (
                                                    <li key={item.id} className="text-xs text-gray-600">
                                                        • {item.product.sku} × {item.quantity}
                                                    </li>
                                                ))}
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
                                                {/* Status transition buttons */}
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
                                                {/* Shipment tracking */}
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
        </div>
    );
}
