'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Globe, Search, Share2, FileText } from 'lucide-react';

interface SeoConfig {
    siteName:        string;
    siteUrl:         string;
    defaultTitle:    string;
    titleSuffix:     string;
    defaultDesc:     string;
    defaultKeywords: string;
    ogImage:         string;
    googleSiteVerify: string;
    naverSiteVerify: string;
    googleAnalytics: string;
    robotsIndex:     boolean;
    canonicalBase:   string;
    twitterHandle:   string;
    pages: {
        home:     { title: string; desc: string };
        products: { title: string; desc: string };
        about:    { title: string; desc: string };
    };
}

const DEFAULT: SeoConfig = {
    siteName:         'KKShop',
    siteUrl:          'https://kkshop.cc',
    defaultTitle:     'KKShop – K-Beauty & K-Living in Cambodia',
    titleSuffix:      ' | KKShop',
    defaultDesc:      'Shop authentic Korean cosmetics and lifestyle products delivered to your door in Cambodia. Free shipping on orders over $30.',
    defaultKeywords:  'K-beauty, Korean cosmetics, Cambodia, skincare, COSRX, Laneige',
    ogImage:          '',
    googleSiteVerify: '',
    naverSiteVerify:  '',
    googleAnalytics:  '',
    robotsIndex:      true,
    canonicalBase:    'https://kkshop.cc',
    twitterHandle:    '',
    pages: {
        home:     { title: 'KKShop – K-Beauty & K-Living in Cambodia', desc: 'Discover authentic Korean beauty products. Fast delivery across Cambodia.' },
        products: { title: 'Shop K-Beauty Products', desc: 'Browse our full collection of Korean skincare, makeup, and lifestyle products.' },
        about:    { title: 'About KKShop', desc: 'Learn about KKShop – Cambodia\'s premier K-Beauty store.' },
    },
};

export default function SeoPage() {
    const [cfg,    setCfg]    = useState<SeoConfig>(DEFAULT);
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings?keys=seo_config')
            .then(r => r.json())
            .then(data => {
                if (data.seo_config) {
                    const parsed = JSON.parse(data.seo_config);
                    setCfg(c => ({ ...c, ...parsed, pages: { ...c.pages, ...(parsed.pages ?? {}) } }));
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
                body: JSON.stringify({ key: 'seo_config', value: JSON.stringify(cfg) }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const set = (patch: Partial<SeoConfig>) => setCfg(c => ({ ...c, ...patch }));
    const setPage = (page: keyof SeoConfig['pages'], patch: Partial<{ title: string; desc: string }>) =>
        setCfg(c => ({ ...c, pages: { ...c.pages, [page]: { ...c.pages[page], ...patch } } }));

    const InputField = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
    );

    const TextareaField = ({ label, value, onChange, placeholder, maxLen }: any) => (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">{label}</label>
                {maxLen && <span className={`text-xs ${value.length > maxLen ? 'text-red-500' : 'text-slate-400'}`}>{value.length}/{maxLen}</span>}
            </div>
            <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
                    <p className="text-sm text-gray-500 mt-0.5">검색엔진 최적화 설정</p>
                </div>
                <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm">
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Site Identity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-slate-700">Site Identity</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Site Name" value={cfg.siteName} onChange={(v: string) => set({ siteName: v })} placeholder="KKShop" />
                    <InputField label="Site URL" value={cfg.siteUrl} onChange={(v: string) => set({ siteUrl: v })} placeholder="https://kkshop.cc" type="url" />
                    <InputField label="Canonical Base URL" value={cfg.canonicalBase} onChange={(v: string) => set({ canonicalBase: v })} placeholder="https://kkshop.cc" type="url" />
                    <InputField label="Title Suffix" value={cfg.titleSuffix} onChange={(v: string) => set({ titleSuffix: v })} placeholder=" | KKShop" />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={cfg.robotsIndex} onChange={e => set({ robotsIndex: e.target.checked })} className="w-4 h-4 rounded" id="robots" />
                    <label htmlFor="robots" className="text-sm text-slate-700 cursor-pointer">Allow search engines to index this site (robots: index, follow)</label>
                </div>
            </div>

            {/* Default Meta */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-green-500" />
                    <h2 className="text-sm font-bold text-slate-700">Default Meta Tags</h2>
                </div>
                <TextareaField label="Default Title" value={cfg.defaultTitle} onChange={(v: string) => set({ defaultTitle: v })} placeholder="KKShop – K-Beauty & K-Living in Cambodia" maxLen={60} />
                <TextareaField label="Default Description" value={cfg.defaultDesc} onChange={(v: string) => set({ defaultDesc: v })} placeholder="Shop authentic Korean cosmetics..." maxLen={160} />
                <InputField label="Default Keywords" value={cfg.defaultKeywords} onChange={(v: string) => set({ defaultKeywords: v })} placeholder="K-beauty, Korean cosmetics, Cambodia, skincare" />
                <InputField label="OG Image URL (1200×630)" value={cfg.ogImage} onChange={(v: string) => set({ ogImage: v })} placeholder="https://kkshop.cc/og-image.jpg" />
            </div>

            {/* Social & Analytics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-purple-500" />
                    <h2 className="text-sm font-bold text-slate-700">Analytics &amp; Verification</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Google Analytics ID" value={cfg.googleAnalytics} onChange={(v: string) => set({ googleAnalytics: v })} placeholder="G-XXXXXXXXXX" />
                    <InputField label="Twitter / X Handle" value={cfg.twitterHandle} onChange={(v: string) => set({ twitterHandle: v })} placeholder="@kkshopkh" />
                    <InputField label="Google Site Verification" value={cfg.googleSiteVerify} onChange={(v: string) => set({ googleSiteVerify: v })} placeholder="google-site-verification code" />
                    <InputField label="Naver Site Verification" value={cfg.naverSiteVerify} onChange={(v: string) => set({ naverSiteVerify: v })} placeholder="naver verification code" />
                </div>
            </div>

            {/* Per-page Meta */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-bold text-slate-700">Per-Page Meta Tags</h2>
                </div>
                {(['home', 'products', 'about'] as const).map(page => (
                    <div key={page} className="border border-slate-100 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase">{page === 'home' ? 'Homepage' : page === 'products' ? 'Products Page' : 'About Page'}</div>
                        <TextareaField
                            label="Title" maxLen={60}
                            value={cfg.pages[page].title}
                            onChange={(v: string) => setPage(page, { title: v })}
                            placeholder={`Title for ${page} page`}
                        />
                        <TextareaField
                            label="Description" maxLen={160}
                            value={cfg.pages[page].desc}
                            onChange={(v: string) => setPage(page, { desc: v })}
                            placeholder={`Description for ${page} page`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
