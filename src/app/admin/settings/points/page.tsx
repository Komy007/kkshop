'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Star, Gift, Clock } from 'lucide-react';

interface PointsConfig {
    earnRate:        number;   // % of order total to earn (default 1)
    redeemRate:      number;   // 1 point = $X  (default 1)
    minOrderToEarn:  number;   // min order USD to earn points
    maxRedeemPct:    number;   // max % of order that can be paid by points
    expiryDays:      number;   // 0 = never expire
    welcomeBonus:    number;   // points given on signup
    reviewBonus:     number;   // points given for leaving a review
    enabled:         boolean;
}

const DEFAULT: PointsConfig = {
    earnRate:       1,
    redeemRate:     1,
    minOrderToEarn: 5,
    maxRedeemPct:   50,
    expiryDays:     365,
    welcomeBonus:   100,
    reviewBonus:    50,
    enabled:        true,
};

export default function PointsSettingsPage() {
    const [cfg,    setCfg]    = useState<PointsConfig>(DEFAULT);
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings?keys=points_config')
            .then(r => r.json())
            .then(data => {
                if (data.points_config) {
                    setCfg({ ...DEFAULT, ...JSON.parse(data.points_config) });
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
                body: JSON.stringify({ key: 'points_config', value: JSON.stringify(cfg) }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const set = (patch: Partial<PointsConfig>) => setCfg(c => ({ ...c, ...patch }));

    const Field = ({ label, subLabel, children }: { label: string; subLabel?: string; children: React.ReactNode }) => (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">{label}</label>
            {subLabel && <p className="text-xs text-slate-500 mb-2">{subLabel}</p>}
            {children}
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Points System Settings</h1>
                    <p className="text-sm text-gray-500 mt-0.5">포인트 적립 / 사용 설정</p>
                </div>
                <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm">
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Enable toggle */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Star className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-700">Points System</div>
                            <div className="text-xs text-slate-500">Enable or disable the points reward program</div>
                        </div>
                    </div>
                    <button
                        onClick={() => set({ enabled: !cfg.enabled })}
                        className={`relative w-12 h-6 rounded-full transition-all ${cfg.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${cfg.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            </div>

            {/* Earning Rules */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-slate-700">Earning Rules</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <Field label="Earn Rate (%)" subLabel="Points earned per $1 spent. Default: 1%">
                        <div className="flex items-center gap-2">
                            <input type="number" min={0} max={20} step={0.5} value={cfg.earnRate}
                                onChange={e => set({ earnRate: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <span className="text-sm text-slate-500 font-medium">%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">e.g. $20 order earns {Math.round(20 * cfg.earnRate / 100)} points</p>
                    </Field>

                    <Field label="Minimum Order to Earn" subLabel="Minimum order value (USD) required to earn points">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">$</span>
                            <input type="number" min={0} step={1} value={cfg.minOrderToEarn}
                                onChange={e => set({ minOrderToEarn: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </Field>

                    <Field label="Welcome Bonus" subLabel="Points given when a new user signs up">
                        <div className="flex items-center gap-2">
                            <input type="number" min={0} step={10} value={cfg.welcomeBonus}
                                onChange={e => set({ welcomeBonus: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <span className="text-sm text-slate-500">pts</span>
                        </div>
                    </Field>

                    <Field label="Review Bonus" subLabel="Points given when a customer leaves a product review">
                        <div className="flex items-center gap-2">
                            <input type="number" min={0} step={10} value={cfg.reviewBonus}
                                onChange={e => set({ reviewBonus: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <span className="text-sm text-slate-500">pts</span>
                        </div>
                    </Field>
                </div>
            </div>

            {/* Redemption Rules */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-slate-700">Redemption Rules</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <Field label="Redeem Rate" subLabel="How much $1 discount costs in points">
                        <div className="flex items-center gap-2">
                            <input type="number" min={1} step={1} value={cfg.redeemRate}
                                onChange={e => set({ redeemRate: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <span className="text-sm text-slate-500 whitespace-nowrap">pts = $1</span>
                        </div>
                    </Field>

                    <Field label="Max Redeem (%)" subLabel="Max % of order total payable by points">
                        <div className="flex items-center gap-2">
                            <input type="number" min={0} max={100} step={5} value={cfg.maxRedeemPct}
                                onChange={e => set({ maxRedeemPct: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <span className="text-sm text-slate-500">%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">e.g. $30 order → max ${(30 * cfg.maxRedeemPct / 100).toFixed(2)} off</p>
                    </Field>
                </div>
            </div>

            {/* Expiry */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-bold text-slate-700">Points Expiry</h2>
                </div>
                <Field label="Expiry (days)" subLabel="0 = points never expire">
                    <div className="flex items-center gap-3">
                        <input type="number" min={0} step={30} value={cfg.expiryDays}
                            onChange={e => set({ expiryDays: parseInt(e.target.value) || 0 })}
                            className="w-40 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="text-sm text-slate-500">
                            {cfg.expiryDays === 0 ? 'Points never expire' : `Points expire after ${cfg.expiryDays} days`}
                        </span>
                    </div>
                </Field>
            </div>

            {/* Preview Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                <div className="font-bold mb-2">Preview (for a $50 order)</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Points earned: <strong>{Math.round(50 * cfg.earnRate / 100)} pts</strong></div>
                    <div>Max discount: <strong>${(50 * cfg.maxRedeemPct / 100).toFixed(2)}</strong></div>
                    <div>Requires pts: <strong>{Math.round(50 * cfg.maxRedeemPct / 100 * cfg.redeemRate)} pts</strong></div>
                    <div>Min order to earn: <strong>${cfg.minOrderToEarn}</strong></div>
                </div>
            </div>
        </div>
    );
}
