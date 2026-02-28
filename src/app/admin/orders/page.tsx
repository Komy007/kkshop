import React from 'react';
import { prisma } from '@/lib/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ShoppingBag, Search, CheckCircle, Clock } from 'lucide-react';
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
            }
        }
    });

    const formatUsd = (price: any) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price));

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-900">
            <AdminSidebar />

            <main className="flex-1 ml-64 p-8">
                <header className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <ShoppingBag className="w-6 h-6 text-brand-primary" />
                            주문 관리 (Orders Dashboard)
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            고객들의 체크아웃 목록 확인 및 배송 상태를 컨트롤합니다.
                        </p>
                    </div>
                    <div className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold">
                        총 {orders.length}건
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">주문번호 / 일시</th>
                                    <th className="px-6 py-4">주문자 상세 (연락처/배송지)</th>
                                    <th className="px-6 py-4 min-w-[300px]">구매 항목 (품목)</th>
                                    <th className="px-6 py-4">총 결제액</th>
                                    <th className="px-6 py-4">진행 상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Order ID & Date */}
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-mono text-xs text-gray-500 mb-1">{order.id}</div>
                                            <div className="text-gray-900 font-semibold text-[11px] bg-gray-100 px-2 py-0.5 rounded inline-block">
                                                {order.createdAt.toLocaleString('ko-KR')}
                                            </div>
                                        </td>

                                        {/* Customer Info */}
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-bold text-gray-900">{order.customerName}</div>
                                            <div className="text-gray-500 mt-1">{order.customerPhone}</div>
                                            <div className="text-gray-500 mt-1 text-xs break-all max-w-[200px]">
                                                {order.address} {order.detailAddress && `, ${order.detailAddress}`}
                                            </div>
                                        </td>

                                        {/* Items */}
                                        <td className="px-6 py-4 align-top">
                                            <ul className="space-y-2">
                                                {order.items.map(item => (
                                                    <li key={item.id} className="flex gap-2 items-start bg-gray-50 p-2 rounded border border-gray-100">
                                                        {item.product.imageUrl && (
                                                            <div className="w-8 h-8 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                                                                <img src={item.product.imageUrl} alt={item.product.sku} className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="text-xs">
                                                            <div className="font-bold text-gray-900 truncate max-w-[200px]">{item.product.sku}</div>
                                                            <div className="text-gray-500">{item.quantity}개 수량 ({formatUsd(item.priceUsd)} / 개)</div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>

                                        {/* Price */}
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-black text-rose-600 text-lg">
                                                {formatUsd(order.totalUsd)}
                                            </div>
                                        </td>

                                        {/* Status & Actions */}
                                        <td className="px-6 py-4 align-top space-y-2">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                                                ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                ${order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                ${order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                            `}>
                                                {order.status === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5" />}
                                                {order.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                                                {order.status === 'CANCELLED' && <Clock className="w-3.5 h-3.5" />}
                                                {order.status}
                                            </div>

                                            <form action={async () => {
                                                'use server';
                                                await markStatus(order.id, 'COMPLETED');
                                            }}>
                                                <button disabled={order.status === 'COMPLETED' || order.status === 'CANCELLED'} type="submit" className="w-full text-xs bg-gray-900 text-white px-2 py-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed">
                                                    배송완료 처리
                                                </button>
                                            </form>

                                            <form action={async () => {
                                                'use server';
                                                await markStatus(order.id, 'CANCELLED');
                                            }}>
                                                <button disabled={order.status === 'CANCELLED'} type="submit" className="w-full text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded font-bold disabled:opacity-30 disabled:cursor-not-allowed">
                                                    주문 취소
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            접수된 주문 내역이 없습니다. (현재 장바구니 결제 내역이 반영됩니다)
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
