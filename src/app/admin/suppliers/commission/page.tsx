'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle, Percent, Building2, RefreshCcw, Info } from 'lucide-react';
import { COMMISSION_MIN, COMMISSION_MAX, COMMISSION_DEFAULT, clampCommission } from '@/lib/commission';

interface Supplier {
    id:             string;
    companyName:    string;
    brandName:      string | null;
    contactEmail:   string;
    commissionRate: number;
    status:         string;
    _count:         { products: number };
}

interface GlobalCommission {
    defaultRate:   number;
    minRate:       number;
    maxRate:       number;
    categoryRates: Record<string, number>;
}

const CATEGORIES = [
    'skincare', 'makeup', 'haircare', 'bodycare', 'fragrance',
    'supplements', 'household', 'food', 'electronics', 'fashion',
];

export default function CommissionPage() {
    const [suppliers,    setSuppliers]    = useState<Supplier[]>([]);
    const [globalCfg,    setGlobalCfg]    = useState<GlobalCommission>({
        defaultRate:   COMMISSION_DEFAULT,
        minRate:       COMMISSION_MIN,
        maxRate:       COMMISSION_MAX,
        categoryRates: {},
    });
    const [loading,      setLoading]      = useState(true);
    const [savingId,     setSavingId]     = useState<string | null>(null);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [savedId,      setSavedId]      = useState<string | null>(null);
    const [savedGlobal,  setSavedGlobal]  = useState(false);
    const [edits,        setEdits]        = useState<Record<string, number>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sRes, gRes] = await Promise.all([
                fetch('/api/admin/suppliers?status=APPROVED'),
                fetch('/api/admin/settings?keys=commission_config'),
            ]);
            const sData = await sRes.json();
            const gData = await gRes.json();
            setSuppliers(sData.suppliers ?? []);
            if (gData.commission_config) {
                const parsed = JSON.parse(gData.commission_config);
                // 저장된 값도 범위 안전하게 클램프해서 적용
                setGlobalCfg({
                    defaultRate:   clampCommission(parsed.defaultRate   ?? COMMISSION_DEFAULT),
                    minRate:       clampCommission(parsed.minRate       ?? COMMISSION_MIN),
                    maxRate:       clampCommission(parsed.maxRate       ?? COMMISSION_MAX),
                    categoryRates: parsed.categoryRates ?? {},
                });
            }
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line

    useEffect(() => { fetchData(); }, [fetchData]);

    const saveSupplier = async (supplierId: string) => {
        const rawRate = edits[supplierId];
        if (rawRate === undefined) return;
        const rate = clampCommission(rawRate); // 저장 직전 범위 보정
        setSavingId(supplierId);
        try {
            await fetch('/api/admin/suppliers', {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id: supplierId, commissionRate: rate }),
            });
            setSuppliers(ss => ss.map(s => s.id === supplierId ? { ...s, commissionRate: rate } : s));
            const newEdits = { ...edits };
            delete newEdits[supplierId];
            setEdits(newEdits);
            setSavedId(supplierId);
            setTimeout(() => setSavedId(null), 2000);
        } finally {
            setSavingId(null);
        }
    };

    const saveGlobal = async () => {
        // 저장 직전 전체 클램프
        const safeCfg: GlobalCommission = {
            defaultRate:   clampCommission(globalCfg.defaultRate),
            minRate:       clampCommission(globalCfg.minRate),
            maxRate:       clampCommission(globalCfg.maxRate),
            categoryRates: Object.fromEntries(
                Object.entries(globalCfg.categoryRates).map(([k, v]) => [k, clampCommission(v)])
            ),
        };
        setGlobalCfg(safeCfg);
        setSavingGlobal(true);
        try {
            await fetch('/api/admin/settings', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ key: 'commission_config', value: JSON.stringify(safeCfg) }),
            });
            setSavedGlobal(true);
            setTimeout(() => setSavedGlobal(false), 2000);
        } finally {
            setSavingGlobal(false);
        }
    };

    const setCategoryRate = (cat: string, raw: number) =>
        setGlobalCfg(c => ({ ...c, categoryRates: { ...c.categoryRates, [cat]: raw } }));

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Commission Settings</h1>
                    <p className="text-sm text-gray-500 mt-0.5">공급자 수수료 설정</p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all">
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            {/* 범위 안내 배너 */}
            <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                    Commission rates are locked between <strong>{COMMISSION_MIN}% and {COMMISSION_MAX}%</strong> platform-wide.
                    <span className="opacity-70 ml-1">· 수수료율은 {COMMISSION_MIN}%~{COMMISSION_MAX}% 범위 내에서만 설정 가능합니다.</span>
                </span>
            </div>

            {/* Global Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-purple-500" />
                        <h2 className="text-sm font-bold text-slate-700">Global Commission Rules</h2>
                    </div>
                    <button onClick={saveGlobal} disabled={savingGlobal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
                        {savedGlobal ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {savedGlobal ? 'Saved!' : 'Save Global'}
                    </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {[
                        { key: 'defaultRate', label: 'Default Rate',  sub: 'Applied to new suppliers' },
                        { key: 'minRate',     label: 'Minimum Rate',  sub: 'Lowest allowed per-supplier rate' },
                        { key: 'maxRate',     label: 'Maximum Rate',  sub: 'Highest allowed per-supplier rate' },
                    ].map(field => (
                        <div key={field.key} className="bg-slate-50 rounded-xl p-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-0.5">{field.label}</label>
                            <p className="text-xs text-slate-400 mb-2">{field.sub}</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={COMMISSION_MIN} max={COMMISSION_MAX} step={1}
                                    value={(globalCfg as any)[field.key]}
                                    onChange={e => {
                                        const v = parseFloat(e.target.value) || COMMISSION_MIN;
                                        setGlobalCfg(c => ({ ...c, [field.key]: clampCommission(v) }));
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-500 text-sm">%</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{COMMISSION_MIN}%–{COMMISSION_MAX}% allowed</p>
                        </div>
                    ))}
                </div>

                {/* Category rates */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Category-Specific Rates (overrides default)</h3>
                    <div className="grid md:grid-cols-5 gap-3">
                        {CATEGORIES.map(cat => (
                            <div key={cat} className="bg-slate-50 rounded-xl p-3">
                                <label className="block text-xs font-semibold text-slate-600 capitalize mb-1.5">{cat}</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min={COMMISSION_MIN} max={COMMISSION_MAX} step={1}
                                        value={globalCfg.categoryRates[cat] ?? globalCfg.defaultRate}
                                        onChange={e => setCategoryRate(cat, parseFloat(e.target.value) || COMMISSION_MIN)}
                                        onBlur={e => setCategoryRate(cat, clampCommission(parseFloat(e.target.value) || COMMISSION_MIN))}
                                        className="w-full px-2 py-1.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-slate-500 text-xs">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Per-supplier rates */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-bold text-slate-700">Per-Supplier Commission Override</h2>
                    <span className="ml-auto text-xs text-slate-400">{COMMISSION_MIN}%–{COMMISSION_MAX}% only · 범위 제한</span>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-400 text-sm">Loading suppliers...</div>
                ) : suppliers.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 text-sm">No approved suppliers found.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {suppliers.map(supplier => {
                            const current = edits[supplier.id] ?? supplier.commissionRate;
                            const isDirty = edits[supplier.id] !== undefined && edits[supplier.id] !== supplier.commissionRate;
                            return (
                                <div key={supplier.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900">{supplier.companyName}</div>
                                        <div className="text-xs text-slate-500">{supplier.brandName ?? supplier.contactEmail} · {supplier._count.products} products</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={COMMISSION_MIN} max={COMMISSION_MAX} step={1}
                                            value={current}
                                            onChange={e => setEdits(ed => ({ ...ed, [supplier.id]: parseFloat(e.target.value) || COMMISSION_MIN }))}
                                            onBlur={e => setEdits(ed => ({ ...ed, [supplier.id]: clampCommission(parseFloat(e.target.value) || COMMISSION_MIN) }))}
                                            className={`w-20 px-3 py-1.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right ${isDirty ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}
                                        />
                                        <span className="text-sm text-slate-500">%</span>
                                        {isDirty && (
                                            <button
                                                onClick={() => saveSupplier(supplier.id)}
                                                disabled={savingId === supplier.id}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                                            >
                                                {savedId === supplier.id ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                                                {savingId === supplier.id ? '...' : savedId === supplier.id ? 'Saved' : 'Save'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
