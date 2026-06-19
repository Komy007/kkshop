'use client';

import React, { useRef } from 'react';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
    '': 'All',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    SHIPPING: 'Shipping',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};
const STATUS_ACTIVE: Record<string, string> = {
    '': 'bg-gray-900 text-white',
    PENDING: 'bg-amber-500 text-white',
    CONFIRMED: 'bg-blue-600 text-white',
    SHIPPING: 'bg-indigo-600 text-white',
    DELIVERED: 'bg-green-600 text-white',
    CANCELLED: 'bg-red-500 text-white',
};

export default function AdminOrdersFilter({ currentStatus, currentQ }: { currentStatus: string; currentQ: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const update = (key: string, value: string) => {
        const p = new URLSearchParams(searchParams.toString());
        if (value) p.set(key, value); else p.delete(key);
        p.set('page', '1');
        router.push(`${pathname}?${p.toString()}`);
    };

    const handleSearch = (val: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => update('q', val), 400);
    };

    return (
        <div className="space-y-3 mb-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    defaultValue={currentQ}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search by order ID, customer name, email..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            {/* Status tabs */}
            <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                    <button
                        key={s || 'all'}
                        onClick={() => update('status', s)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                            currentStatus === s
                                ? STATUS_ACTIVE[s]
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>
        </div>
    );
}
