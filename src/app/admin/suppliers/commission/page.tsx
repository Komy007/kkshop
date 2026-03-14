'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle, Percent, Building2, RefreshCcw } from 'lucide-react';

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
    defaultRate:  number;
    minRate:      number;
    maxRate:      number;
    categoryRates: Record<string, number>;
}

const CATEGORIES = [
    'skincare', 'makeup', 'haircare', 'bodycare', 'fragrance',
    'supplements', 'household', 'food', 'electronics', 'fashion',
];

export default function CommissionPage() {
    const [suppliers,    setSuppliers]    = useState<Supplier[]>([]);
    const [globalCfg,    setGlobalCfg]    = useState<GlobalCommission>({ defaultRate: 30, minRate: 10, maxRate: 50, categoryRates: {} });
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
                setGlobalCfg({ ...globalCfg, ...JSON.parse(gData.commission_config) });
            }
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line

    useEffect(() => { fetchData(); }, [fetchData]);

    const saveSupplier = async (supplierId: string) => {
        const rate = edits[supplierId];
        if (rate === undefined) return;
        setSavingId(supplierId);
        try {
            await fetch('/api/admin/suppliers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: supplierId, commissionRate: rate }),
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
        setSavingGlobal(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'commission_config', value: JSON.stringify(globalCfg) }),
            });
            setSavedGlobal(true);
            setTimeout(() => setSavedGlobal(false), 2000);
        } finally {
            setSavingGlobal(false);
        }
    };

    const setCategoryRate = (cat: string, rate: number) =>
        setGlobalCfg(c => ({ ...c, categoryRates: { ...c.categoryRates, [cat]: rate } }));

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
                        { key: 'defaultRate', label: 'Default Rate', sub: 'Applied to new suppliers' },
                        { key: 'minRate',     label: 'Minimum Rate', sub: 'Lowest allowed per-supplier rate' },
                        { key: 'maxRate',     label: 'Maximum Rate', sub: 'Highest allowed per-supplier rate' },
                    ].map(field => (
                        <div key={field.key} className="bg-slate-50 rounded-xl p-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-0.5">{field.label}</label>
                            <p className="text-xs text-slate-400 mb-2">{field.sub}</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number" min={0} max={100} step={1}
                                    value={(globalCfg as any)[field.key]}
                                    onChange={e => setGlobalCfg(c => ({ ...c, [field.key]: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-500 text-sm">%</span>
                            </div>
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
                                        type="number" min={0} max={100} step={1}
                                        value={globalCfg.categoryRates[cat] ?? globalCfg.defaultRate}
                                        onChange={e => setCategoryRate(cat, parseFloat(e.target.value) || 0)}
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
                                            type="number" min={globalCfg.minRate} max={globalCfg.maxRate} step={1}
                                            value={current}
                                            onChange={e => setEdits(ed => ({ ...ed, [supplier.id]: parseFloat(e.target.value) || 0 }))}
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
