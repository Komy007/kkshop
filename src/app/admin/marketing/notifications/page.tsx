'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Bell, Mail, Package, ShoppingCart, Star, Gift } from 'lucide-react';

interface NotifConfig {
    email: {
        orderConfirmed:  boolean;
        orderShipped:    boolean;
        orderDelivered:  boolean;
        orderCancelled:  boolean;
        lowStockAlert:   boolean;
        newReview:       boolean;
        newSupplier:     boolean;
        weeklyReport:    boolean;
    };
    admin: {
        lowStockThreshold: number;
        dailyDigestEmail:  string;
        weeklyReportDay:   number; // 0=Sun, 1=Mon...
    };
}

const DEFAULT: NotifConfig = {
    email: {
        orderConfirmed:  true,
        orderShipped:    true,
        orderDelivered:  true,
        orderCancelled:  true,
        lowStockAlert:   true,
        newReview:       true,
        newSupplier:     true,
        weeklyReport:    true,
    },
    admin: {
        lowStockThreshold: 10,
        dailyDigestEmail:  '',
        weeklyReportDay:   1,
    },
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function NotificationsPage() {
    const [cfg,    setCfg]    = useState<NotifConfig>(DEFAULT);
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings?keys=notifications_config')
            .then(r => r.json())
            .then(data => {
                if (data.notifications_config) {
                    const parsed = JSON.parse(data.notifications_config);
                    setCfg({ email: { ...DEFAULT.email, ...parsed.email }, admin: { ...DEFAULT.admin, ...parsed.admin } });
                }
            })
            .catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'notifications_config', value: JSON.stringify(cfg) }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const setEmail = (patch: Partial<NotifConfig['email']>) =>
        setCfg(c => ({ ...c, email: { ...c.email, ...patch } }));
    const setAdmin = (patch: Partial<NotifConfig['admin']>) =>
        setCfg(c => ({ ...c, admin: { ...c.admin, ...patch } }));

    const Toggle = ({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
                <div className="text-sm font-medium text-slate-700">{label}</div>
                {sub && <div className="text-xs text-slate-500">{sub}</div>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
                    <p className="text-sm text-gray-500 mt-0.5">알림 설정 / 이메일 알림</p>
                </div>
                <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm">
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Customer Email Notifications */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-700">Customer Email Notifications</h2>
                        <p className="text-xs text-slate-500">Emails sent to customers automatically</p>
                    </div>
                </div>

                <Toggle checked={cfg.email.orderConfirmed} onChange={v => setEmail({ orderConfirmed: v })}
                    label="Order Confirmed" sub="Sent when admin confirms a new order" />
                <Toggle checked={cfg.email.orderShipped} onChange={v => setEmail({ orderShipped: v })}
                    label="Order Shipped" sub="Sent when shipping tracking is added" />
                <Toggle checked={cfg.email.orderDelivered} onChange={v => setEmail({ orderDelivered: v })}
                    label="Order Delivered" sub="Sent when order marked as delivered" />
                <Toggle checked={cfg.email.orderCancelled} onChange={v => setEmail({ orderCancelled: v })}
                    label="Order Cancelled / Refunded" sub="Sent when order is cancelled or refunded" />
            </div>

            {/* Admin Notifications */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-700">Admin Alerts</h2>
                        <p className="text-xs text-slate-500">Notifications sent to admin email</p>
                    </div>
                </div>

                <Toggle checked={cfg.email.lowStockAlert} onChange={v => setEmail({ lowStockAlert: v })}
                    label="Low Stock Alert" sub="Alert when product stock falls below threshold" />
                <Toggle checked={cfg.email.newReview} onChange={v => setEmail({ newReview: v })}
                    label="New Review" sub="Alert when a customer submits a new review" />
                <Toggle checked={cfg.email.newSupplier} onChange={v => setEmail({ newSupplier: v })}
                    label="New Supplier Application" sub="Alert when a new supplier registers" />
                <Toggle checked={cfg.email.weeklyReport} onChange={v => setEmail({ weeklyReport: v })}
                    label="Weekly Sales Report" sub="Summary email of weekly performance" />

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Digest Email</label>
                        <input
                            type="email"
                            value={cfg.admin.dailyDigestEmail}
                            onChange={e => setAdmin({ dailyDigestEmail: e.target.value })}
                            placeholder="admin@kkshop.cc"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">All admin alerts are sent to this address</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Low Stock Threshold</label>
                            <div className="flex items-center gap-2">
                                <input type="number" min={1} max={100} value={cfg.admin.lowStockThreshold}
                                    onChange={e => setAdmin({ lowStockThreshold: parseInt(e.target.value) || 10 })}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <span className="text-sm text-slate-500 whitespace-nowrap">units</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Weekly Report Day</label>
                            <select
                                value={cfg.admin.weeklyReportDay}
                                onChange={e => setAdmin({ weeklyReportDay: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
