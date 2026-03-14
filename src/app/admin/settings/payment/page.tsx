'use client';

import React, { useState, useEffect } from 'react';
import { Save, CreditCard, QrCode, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface PaymentConfig {
    provider: 'MOCK' | 'ABA' | 'KHQR';
    aba: {
        merchantId: string;
        apiKey: string;
        apiSecret: string;
        publicKey: string;
        returnUrl: string;
        cancelUrl: string;
        testMode: boolean;
    };
    khqr: {
        merchantId: string;
        acquiringBank: string;
        merchantName: string;
        merchantCity: string;
        currency: 'USD' | 'KHR';
        testMode: boolean;
    };
}

const DEFAULT: PaymentConfig = {
    provider: 'MOCK',
    aba: {
        merchantId: '', apiKey: '', apiSecret: '', publicKey: '',
        returnUrl: '', cancelUrl: '', testMode: true,
    },
    khqr: {
        merchantId: '', acquiringBank: 'ABA', merchantName: 'KKShop',
        merchantCity: 'Phnom Penh', currency: 'USD', testMode: true,
    },
};

export default function PaymentGatewayPage() {
    const [config, setConfig]     = useState<PaymentConfig>(DEFAULT);
    const [saving, setSaving]     = useState(false);
    const [saved, setSaved]       = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings?keys=payment_gateway')
            .then(r => r.json())
            .then(data => {
                if (data.payment_gateway) {
                    setConfig({ ...DEFAULT, ...JSON.parse(data.payment_gateway) });
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
                body: JSON.stringify({ key: 'payment_gateway', value: JSON.stringify(config) }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const setAba   = (patch: Partial<typeof config.aba>)  => setConfig(c => ({ ...c, aba:  { ...c.aba,  ...patch } }));
    const setKhqr  = (patch: Partial<typeof config.khqr>) => setConfig(c => ({ ...c, khqr: { ...c.khqr, ...patch } }));

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payment Gateway</h1>
                    <p className="text-sm text-gray-500 mt-0.5">결제 게이트웨이 설정 (ABA PayWay / KHQR)</p>
                </div>
                <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
                >
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Provider Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Active Payment Provider</h2>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'MOCK',  label: 'Mock (Testing)', icon: AlertCircle, desc: 'No real payments' },
                        { id: 'ABA',   label: 'ABA PayWay',     icon: CreditCard,  desc: 'Card & QR payments' },
                        { id: 'KHQR',  label: 'KHQR',           icon: QrCode,      desc: 'Bank QR code' },
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => setConfig(c => ({ ...c, provider: p.id as any }))}
                            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                                config.provider === p.id
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                        >
                            <p.icon className="w-6 h-6" />
                            <span className="text-sm font-bold">{p.label}</span>
                            <span className="text-xs opacity-70">{p.desc}</span>
                            {config.provider === p.id && (
                                <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-blue-600" />
                            )}
                        </button>
                    ))}
                </div>

                {config.provider === 'MOCK' && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Mock mode is active. All payments will be simulated without real transactions.
                    </div>
                )}
            </div>

            {/* ABA PayWay Config */}
            {config.provider === 'ABA' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">ABA PayWay Configuration</h2>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.aba.testMode}
                                onChange={e => setAba({ testMode: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-slate-600">Test Mode</span>
                        </label>
                    </div>

                    {config.aba.testMode && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs">
                            Test mode — use ABA sandbox credentials
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Merchant ID</label>
                            <input
                                type="text"
                                value={config.aba.merchantId}
                                onChange={e => setAba({ merchantId: e.target.value })}
                                placeholder="e.g. 123456"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Key</label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={config.aba.apiKey}
                                    onChange={e => setAba({ apiKey: e.target.value })}
                                    placeholder="ABA API Key"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                />
                                <button onClick={() => setShowApiKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Secret</label>
                            <div className="relative">
                                <input
                                    type={showSecret ? 'text' : 'password'}
                                    value={config.aba.apiSecret}
                                    onChange={e => setAba({ apiSecret: e.target.value })}
                                    placeholder="ABA API Secret"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                />
                                <button onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Public Key</label>
                            <input
                                type="text"
                                value={config.aba.publicKey}
                                onChange={e => setAba({ publicKey: e.target.value })}
                                placeholder="RSA Public Key"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Return URL</label>
                            <input
                                type="url"
                                value={config.aba.returnUrl}
                                onChange={e => setAba({ returnUrl: e.target.value })}
                                placeholder="https://kkshop.cc/checkout/success"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cancel URL</label>
                            <input
                                type="url"
                                value={config.aba.cancelUrl}
                                onChange={e => setAba({ cancelUrl: e.target.value })}
                                placeholder="https://kkshop.cc/checkout"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* KHQR Config */}
            {config.provider === 'KHQR' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">KHQR Configuration</h2>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.khqr.testMode}
                                onChange={e => setKhqr({ testMode: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-slate-600">Test Mode</span>
                        </label>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Merchant ID (Baker ID)</label>
                            <input
                                type="text"
                                value={config.khqr.merchantId}
                                onChange={e => setKhqr({ merchantId: e.target.value })}
                                placeholder="e.g. 012345678"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Acquiring Bank</label>
                            <select
                                value={config.khqr.acquiringBank}
                                onChange={e => setKhqr({ acquiringBank: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {['ABA', 'ACLEDA', 'Canadia', 'Chip Mong', 'Wing', 'True Money'].map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Merchant Name</label>
                            <input
                                type="text"
                                value={config.khqr.merchantName}
                                onChange={e => setKhqr({ merchantName: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Merchant City</label>
                            <input
                                type="text"
                                value={config.khqr.merchantCity}
                                onChange={e => setKhqr({ merchantCity: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Currency</label>
                            <div className="flex gap-2">
                                {['USD', 'KHR'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setKhqr({ currency: c as any })}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                            config.khqr.currency === c
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1">
                <div className="font-bold">Integration Notes</div>
                <ul className="list-disc list-inside text-xs space-y-0.5 opacity-80">
                    <li>ABA PayWay: Apply at <strong>pay.aba.com.kh</strong> for merchant credentials</li>
                    <li>KHQR: Register via National Bank of Cambodia KHQR portal</li>
                    <li>Test credentials are provided by ABA sandbox environment</li>
                    <li>Live mode changes take effect immediately on next checkout</li>
                </ul>
            </div>
        </div>
    );
}
