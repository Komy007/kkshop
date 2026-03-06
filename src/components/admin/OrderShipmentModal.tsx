'use client';

import React, { useState } from 'react';
import { Truck, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ShipmentModalProps {
    orderId: string;
    shipment: {
        id: string;
        carrier: string;
        trackingNumber: string;
        trackingUrl: string | null;
        memo: string | null;
    } | null;
}

export default function OrderShipmentModal({ orderId, shipment }: ShipmentModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        carrier: shipment?.carrier || '',
        trackingNumber: shipment?.trackingNumber || '',
        trackingUrl: shipment?.trackingUrl || '',
        memo: shipment?.memo || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                setIsOpen(false);
                router.refresh();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save shipment');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-2 text-xs flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-2 py-1.5 rounded font-medium transition-colors"
                title="운송장 정보 등록/수정"
            >
                <Truck className="w-3.5 h-3.5" />
                {shipment ? '운송장 수정' : '운송장 등록'}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-500" /> 배송 정보 등록
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">배송사 (Carrier)*</label>
                                <input required type="text" value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. CJ대한통운, J&T Express" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">운송장 번호 (Tracking No)*</label>
                                <input required type="text" value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="송장번호 입력" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">배송조회 URL (선택)</label>
                                <input type="url" value={form.trackingUrl} onChange={e => setForm({ ...form, trackingUrl: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
                                <textarea value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20" placeholder="기타 참고사항" />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
                                    취소
                                </button>
                                <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
