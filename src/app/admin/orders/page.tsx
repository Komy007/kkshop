import React from 'react';
import { prisma } from '@/lib/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ShoppingBag, Search, CheckCircle, Clock, Truck } from 'lucide-react';
import OrderShipmentModal from '@/components/admin/OrderShipmentModal';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function markStatus(orderId: string, newStatus: string) {
    'use server';
    await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
    });
    revalidatePath('/admin/orders');
}

export default async function AdminOrdersPage() {
    // Fetch latest 50 orders
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            items: {
                include: {
                    product: true
                }
            },
            shipment: true
        }
    });

    const formatUsd = (price: any) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price));

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <header className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                        주문 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        고객들의 체크아웃 목록 확인 및 배송 상태를 관리합니다.
                    </p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                    총 {orders.length}건
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">주문번호 / 일시</th>
                                <th className="px-6 py-4">주문자 상세</th>
                                <th className="px-6 py-4 min-w-[250px]">구매 항목</th>
                                <th className="px-6 py-4">총 결제액</th>
                                <th className="px-6 py-4">진행 상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-mono text-xs text-gray-400 mb-1">{order.id}</div>
                                        <div className="text-gray-900 font-semibold text-[11px] bg-gray-100 px-2 py-0.5 rounded inline-block">
                                            {order.createdAt.toLocaleString('ko-KR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-bold text-gray-900">{order.customerName}</div>
                                        <div className="text-gray-500 mt-1">{order.customerPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <ul className="space-y-1">
                                            {order.items.map(item => (
                                                <li key={item.id} className="text-xs text-gray-600">
                                                    • {item.product.sku} ({item.quantity}개)
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-black text-rose-600">
                                            {formatUsd(order.totalUsd)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top space-y-2">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                                            ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                                        `}>
                                            {order.status}
                                        </div>
                                        <OrderShipmentModal orderId={order.id} shipment={order.shipment} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
